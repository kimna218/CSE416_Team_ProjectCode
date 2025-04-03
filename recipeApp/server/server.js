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

// MySQL 서버에 연결 
const baseConnection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});


// DB에 연결
const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
console.log("Success to connect");

// 테이블 생성
await db.execute(`
  CREATE TABLE IF NOT EXISTS recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(1000)
  )
`);

const apiKey = process.env.FOOD_API_KEY;

// 오픈API에서 레시피 받아와서 DB에 저장 /
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
      if (name && category) {
        try {
          await db.execute(
            "INSERT IGNORE INTO recipes (name, category) VALUES (?, ?)",
            [name, category]
          );
        } catch (e) {
          console.warn("Fail to insert:", name);
        }
      }
    }

    console.log("Complete store openAPI in DB");
  } catch (err) {
    console.error("OpenAPI err:", err);
  }
};

// API 라우터
app.get("/recipes", async (req, res) => {
  const [rows] = await db.execute("SELECT * FROM recipes");
  res.json(rows);
});

app.post("/recipes", async (req, res) => {
  const { name, category } = req.body;
  try {
    await db.execute(
      "INSERT IGNORE INTO recipes (name, category) VALUES (?, ?)",
      [name, category]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Fail to insert:", err);
    res.status(500).json({ success: false });
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
