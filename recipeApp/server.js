import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import pkg from "pg";
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

console.log("Starting server...");
console.log("✅ FULL ENV DUMP:");
for (const key of Object.keys(process.env)) {
  if (key.toLowerCase().includes("db") || key.toLowerCase().includes("pg")) {
    console.log(`${key} = ${process.env[key]}`);
  }
}

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

console.log("Success to connect");

// 테이블 생성
await pool.query(`
  CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(50),
    image_url VARCHAR(255),
    ingredients TEXT
  )
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS nutrition (
    recipe_id INT REFERENCES recipes(id),
    calories INT,
    carbohydrates FLOAT,
    protein FLOAT,
    fat FLOAT,
    sodium FLOAT,
    PRIMARY KEY (recipe_id)
  )
`);
await pool.query(`
  CREATE TABLE IF NOT EXISTS recipe_steps (
    recipe_id INT REFERENCES recipes (id),
    step_number INT,
    description TEXT,
    PRIMARY KEY (recipe_id, step_number)
  )
`);

const apiKey = process.env.FOOD_API_KEY;

const importRecipesFromOpenAPI = async () => {
  try {
    const res = await fetch(
      `https://openapi.foodsafetykorea.go.kr/api/${apiKey}/COOKRCP01/json/1/1000`
    );
    const data = await res.json();
    const rows = data.COOKRCP01?.row || [];

    for (const recipe of rows) {
      const name = recipe.RCP_NM;
      const category = recipe.RCP_PAT2;
      const image_url = recipe.ATT_FILE_NO_MAIN;

      if (name && category && image_url) {
        try {
          const ingredientsText = recipe.RCP_PARTS_DTLS;

          const insertResult = await pool.query(
            `INSERT INTO recipes (name, category, image_url, ingredients)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (name) DO NOTHING
            RETURNING id`,
            [name, category, image_url, ingredientsText]
          );

          let recipe_id = insertResult.rows[0]?.id;

          if (!recipe_id) {
            const selectResult = await pool.query(
              "SELECT id FROM recipes WHERE name = $1",
              [name]
            );
            recipe_id = selectResult.rows[0]?.id;
          }

          // nutrition insert
          if (recipe_id) {
            const nutrition = extractNutritionFromRecipe(recipe);
            await pool.query(
              `INSERT INTO nutrition (recipe_id, calories, carbohydrates, protein, fat, sodium)
              VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (recipe_id) DO NOTHING`,
              [
                recipe_id,
                nutrition.calories,
                nutrition.carbohydrates,
                nutrition.protein,
                nutrition.fat,
                nutrition.sodium,
              ]
            );
          }

          // // recipe_ingredients insert
          // const ingredients = extractIngredientsFromRecipe(recipe);
          // for (const ing of ingredients) {
          //   await pool.query(
          //     `INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity)
          //     VALUES ($1, $2, $3)
          //     ON CONFLICT DO NOTHING`,
          //     [recipe_id, ing.ingredient_name, ing.quantity]
          //   );
          // }

          // recipe_steps insert
          const steps = extractStepsFromRecipe(recipe);
          for (const step of steps) {
            await pool.query(
              `INSERT INTO recipe_steps (recipe_id, step_number, description)
              VALUES ($1, $2, $3)
              ON CONFLICT DO NOTHING`,
              [recipe_id, step.step_number, step.description]
            );
          }

        } catch (e) {
          console.warn("Fail to insert:", name, e.message);
        }
      }

    }

    console.log("Complete storing details from OpenAPI");
  } catch (err) {
    console.error("OpenAPI fetch error:", err);
  }
};

const extractNutritionFromRecipe = (recipe) => {
  return {
    calories: parseInt(recipe.INFO_ENG) || 0,
    carbohydrates: parseFloat(recipe.INFO_CAR) || 0,
    protein: parseFloat(recipe.INFO_PRO) || 0,
    fat: parseFloat(recipe.INFO_FAT) || 0,
    sodium: parseFloat(recipe.INFO_NA) || 0,
  };
};

// const extractIngredientsFromRecipe = (recipe) => {
//   const raw = recipe.RCP_PARTS_DTLS;
//   if (!raw) return [];

//   const lines = raw.split('\n');
//   const ingredients = [];

//   for (const line of lines) {
//     const items = line.split(',');
//     for (let item of items) {
//       item = item.trim();
//       if (!item) continue;

//       // 예: "연두부 75g(3/4모)"
//       const match = item.match(/^([^\d\s,]+)\s*(.+)$/);
//       if (match) {
//         const name = match[1].trim();
//         const quantity = match[2].trim();
//         ingredients.push({ ingredient_name: name, quantity });
//       }
//     }
//   }

//   return ingredients;
// };

const extractStepsFromRecipe = (recipe) => {
  const steps = [];

  for (let i = 1; i <= 20; i++) {
    const raw = recipe[`MANUAL${i.toString().padStart(2, '0')}`];
    if (raw && raw.trim() !== '') {
      const cleaned = raw.trim().replace(/^\d+\.\s*/, '');  // "1. ~" 제거
      steps.push({
        step_number: i,
        description: cleaned
      });
    }
  }

  return steps;
};

// API 라우터
app.get("/recipes", async (req, res) => {
  const result = await pool.query("SELECT * FROM recipes");
  res.json(result.rows);
});

app.post("/recipes", async (req, res) => {
  const { name, category, image_url } = req.body;
  try {
    await pool.query(
      "INSERT INTO recipes (name, category, image_url) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING",
      [name, category, image_url]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Fail to insert:", err);
    res.status(500).json({ success: false });
  }
});

app.get("/recipes/detail/:name", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM recipes WHERE name = $1",
    [req.params.name]
  );
  res.json(result.rows[0]);
});

app.get("/recipes/detail/:id/nutrition", async (req, res) => {
  const recipeId = parseInt(req.params.id, 10);

  try {
    const result = await pool.query(
      `SELECT calories, carbohydrates, protein, fat, sodium
       FROM nutrition
       WHERE recipe_id = $1`,
      [recipeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Nutrition info not found for this recipe." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Nutrition fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/recipes/detail/:id/steps", async (req, res) => {
  const recipeId = parseInt(req.params.id, 10);

  try {
    const result = await pool.query(
      `SELECT step_number, description
       FROM recipe_steps
       WHERE recipe_id = $1
       ORDER BY step_number`,
      [recipeId]
    );

    res.json(result.rows); // 배열로 보냄
  } catch (err) {
    console.error("Fetch steps error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// 서버 시작
const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
  try {
    await importRecipesFromOpenAPI();
  } catch (err) {
    console.error("Cannot start server:", err);
  }
});
