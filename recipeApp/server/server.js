import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import pkg from "pg";
const { Pool } = pkg;

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

console.log("Starting server...");
console.log("Database URL:", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  }
});

console.log("Success to connect");

// 테이블 생성
await pool.query(`
  CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(50),
    image_url VARCHAR(255)
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
          await pool.query(
            "INSERT INTO recipes (name, category, image_url) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING",
            [name, category, image_url]
          );

          const result = await pool.query(
            "SELECT id FROM recipes WHERE name = $1",
            [name]
          );
          const recipe_id = result.rows[0]?.id;

          if (recipe_id) {
            const nutrition = extractNutritionFromRecipe(recipe);
            await pool.query(
              `INSERT INTO nutrition (recipe_id, calories, carbohydrates, protein, fat, sodium)
               VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (recipe_id) DO NOTHING`,
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
        } catch (e) {
          console.warn("Fail to insert:", name, e.message);
        }
      }
    }

    console.log("Complete storing recipes & nutrition from OpenAPI");
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

// 서버 시작
const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
  try {
    await importRecipesFromOpenAPI();
  } catch (err) {
    console.error("Cannot start server:", err);
  }
});

// React 정적 파일 서빙
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.resolve(__dirname, "../dist")));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../dist", "index.html"));
});
