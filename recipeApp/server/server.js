// server.js (mysql2...로 했는데 상관없겠지?)
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

console.log("📡 Connecting to DB...");
console.log({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// DB에 연결
const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
console.log("Success to connect");

// * * * * * * * * *
// *               *
// * create table  *
// *               *
// * * * * * * * * *

// recipe
await db.execute(`
  CREATE TABLE IF NOT EXISTS recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(50),
    image_url VARCHAR(255)
  )
`);

// nutrition info
await db.execute(`
  CREATE TABLE IF NOT EXISTS nutrition (
    recipe_id INT,
    calories INT,
    carbohydrates FLOAT,
    protein FLOAT,
    fat FLOAT,
    sodium FLOAT,
    PRIMARY KEY (recipe_id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
  )
`);

const apiKey = process.env.FOOD_API_KEY;

// * * * * * * * * *
// *               *
// *   Store DB    *
// *               *
// * * * * * * * * *

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
          // 1. recipe insert
          await db.execute(
            "INSERT IGNORE INTO recipes (name, category, image_url) VALUES (?, ?, ?)",
            [name, category, image_url]
          );

          // 2. recipe_id 가져오기
          const [result] = await db.execute(
            "SELECT id FROM recipes WHERE name = ?",
            [name]
          );
          const recipe_id = result[0]?.id;

          // 3. nutrition insert
          if (recipe_id) {
            const nutrition = extractNutritionFromRecipe(recipe);
            await db.execute(
              `INSERT IGNORE INTO nutrition (recipe_id, calories, carbohydrates, protein, fat, sodium)
               VALUES (?, ?, ?, ?, ?, ?)`,
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


// * * * * * * * * *
// *               *
// *   API Router  *
// *               *
// * * * * * * * * *

app.get("/recipes", async (req, res) => {
  const [rows] = await db.execute("SELECT * FROM recipes");
  res.json(rows);
});

app.post("/recipes", async (req, res) => {
  const { name, category, image_url } = req.body;
  try {
    await db.execute(
      "INSERT IGNORE INTO recipes (name, category, image_url) VALUES (?, ?, ?)",
      [name, category, image_url]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Fail to insert:", err);
    res.status(500).json({ success: false });
  }
});

// recipe detail가져오기
app.get("/recipes/detail/:name", async (req, res) => {
  const [rows] = await db.execute(
    "SELECT * FROM recipes WHERE name = ?",
    [req.params.name]
  );
  res.json(rows[0]); // 하나만 가져옴
});

// get nutrition info
app.get("/recipes/detail/:id/nutrition", async (req, res) => {
  const recipeId = parseInt(req.params.id, 10);

  try {
    // nutrition 테이블에서 해당 recipe_id의 영양정보 조회
    const [nutritionRows] = await db.execute(
      `SELECT calories, carbohydrates, protein, fat, sodium
       FROM nutrition
       WHERE recipe_id = ?`,
      [recipeId]
    );

    if (nutritionRows.length === 0) {
      return res.status(404).json({ error: "Nutrition info not found for this recipe." });
    }

    res.json(nutritionRows[0]);
  } catch (err) {
    console.error("Nutrition fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// 🔹 서버 시작
const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
  try {
    await importRecipesFromOpenAPI();
  } catch (err) {
    console.error("Cannot start server:", err);
  }
  console.log(`Server is running on: http://localhost:${PORT}`);
});
