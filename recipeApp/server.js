import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import pkg from "pg";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

console.log("➡️ Starting server...");
console.log("✅ FULL ENV DUMP:");
for (const key of Object.keys(process.env)) {
  if (key.toLowerCase().includes("db") || key.toLowerCase().includes("pg")) {
    console.log(`${key} = ${process.env[key]}`);
  }
}

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

console.log("➡️ Success to connect!");

// CREATE TABLES
/* * * * * * * * */
/*  Recipe Page  */
/* * * * * * * * */
await pool.query(`
  CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    en_name VARCHAR(255),
    category VARCHAR(50),
    image_url VARCHAR(255),
    ingredients TEXT,
    en_ingredients TEXT,
    likes INTEGER DEFAULT 0
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

/* * * * * * * * */
/*   Feed Page   */
/* * * * * * * * */
await pool.query(`
  CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    caption TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS post_comments (
    id SERIAL PRIMARY KEY,
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS post_likes (
  post_id INT REFERENCES posts(id) ON DELETE CASCADE,
  firebase_uid VARCHAR(255),
  PRIMARY KEY (post_id, firebase_uid)
);
`);

/* * * * * * * * */
/*   User Page   */
/* * * * * * * * */
await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    liked_ingredients TEXT,
    disliked_ingredients TEXT,
    favorite_recipes TEXT,
    favorite_user_recipes TEXT
  )
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS recipes_rate (
      user_id VARCHAR(255),
      nickname VARCHAR(50),
      recipe_id INT,
      rating INT CHECK (
          rating >= 1
          AND rating <= 5
      ),
      feedback TEXT,
      rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, recipe_id),
      FOREIGN KEY (user_id) REFERENCES users (firebase_uid),
      FOREIGN KEY (recipe_id) REFERENCES recipes (id)
  )
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS my_recipes (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      ingredients TEXT,
      steps JSONB,
      nutrition JSONB,
      likes INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

          // ✨ DeepL API로 영어 번역
          await sleep(1000);

          const en_name = await translateText(name);
          await sleep(1000); // 또 1초 대기
          const en_ingredients = await translateText(ingredientsText);

          const insertResult = await pool.query(
            `INSERT INTO recipes (name, en_name, category, image_url, ingredients, en_ingredients)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (name) DO NOTHING
            RETURNING id`,
            [
              name,
              en_name,
              category,
              image_url,
              ingredientsText,
              en_ingredients,
            ]
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
          console.warn("Fail to insert steps:", name, e.message);
        }
      }
    }

    console.log("➡️ Complete storing details from OpenAPI");
  } catch (err) {
    console.error("OpenAPI fetch error:", err);
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const extractNutritionFromRecipe = (recipe) => {
  return {
    calories: parseInt(recipe.INFO_ENG) || 0,
    carbohydrates: parseFloat(recipe.INFO_CAR) || 0,
    protein: parseFloat(recipe.INFO_PRO) || 0,
    fat: parseFloat(recipe.INFO_FAT) || 0,
    sodium: parseFloat(recipe.INFO_NA) || 0,
  };
};

const extractStepsFromRecipe = (recipe) => {
  const steps = [];

  for (let i = 1; i <= 20; i++) {
    const raw = recipe[`MANUAL${i.toString().padStart(2, "0")}`];
    if (raw && raw.trim() !== "") {
      const cleaned = raw.trim().replace(/^\d+\.\s*/, ""); // "1. ~" 제거
      steps.push({
        step_number: i,
        description: cleaned,
      });
    }
  }

  return steps;
};

export async function translateText(text, targetLang = "EN") {
  const res = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      auth_key: process.env.DEEPL_API_KEY,
      text,
      source_lang: "KO",
      target_lang: targetLang,
    }),
  });

  const json = await res.json();
  return json.translations?.[0]?.text || "";
}

/**
export async function getUserByUID(uid) {
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE firebase_uid = $1",
      [uid]
    );
    return result.rows[0];
  } catch (err) {
    console.error("Error fetching user by UID:", err);
    return null;
  }
}
 */

// API ROUTERS
/* * * * * * * * */
/*    Recipe     */
/* * * * * * * * */
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
  const result = await pool.query("SELECT * FROM recipes WHERE name = $1", [
    req.params.name,
  ]);
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
      return res
        .status(404)
        .json({ error: "Nutrition info not found for this recipe." });
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

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch steps error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch top 4 popular recipes
app.get("/recipes/popular", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, en_name, image_url, category, likes
      FROM recipes
      ORDER BY likes DESC
      LIMIT 4
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching popular recipes:", err);
    res.status(500).json({ error: "Failed to fetch popular recipes" });
  }
});

/* * * * * * * * */
/*     Post      */
/* * * * * * * * */
app.get("/posts", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM posts ORDER BY created_at DESC"
  );
  res.json(result.rows);
});

app.post("/posts", async (req, res) => {
  const { username, caption, image_url } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO posts (username, caption, image_url)
       VALUES ($1, $2, $3) RETURNING *`,
      [username, caption, image_url]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Failed to insert post:", err);
    res.status(500).json({ error: "Failed to insert post" });
  }
});

app.post("/posts/:postId/like", async (req, res) => {
  const { firebase_uid } = req.body;
  const postId = parseInt(req.params.postId);

  if (!firebase_uid) {
    return res.status(400).json({ error: "firebase_uid is required" });
  }

  try {
    const check = await pool.query(
      `SELECT * FROM post_likes WHERE post_id = $1 AND firebase_uid = $2`,
      [postId, firebase_uid]
    );

    if (check.rows.length > 0) {
      await pool.query(
        `DELETE FROM post_likes WHERE post_id = $1 AND firebase_uid = $2`,
        [postId, firebase_uid]
      );
      return res.json({ liked: false });
    } else {
      await pool.query(
        `INSERT INTO post_likes (post_id, firebase_uid)
         VALUES ($1, $2)`,
        [postId, firebase_uid]
      );
      return res.json({ liked: true });
    }
  } catch (err) {
    console.error("Failed to toggle like:", err);
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

// Get total likes for each post
app.get("/posts/likes", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT post_id, COUNT(*) AS likes
      FROM post_likes
      GROUP BY post_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch likes:", err);
    res.status(500).json({ error: "Failed to fetch likes" });
  }
});

// Get all posts liked by a specific user
app.get("/users/:firebase_uid/likes", async (req, res) => {
  const { firebase_uid } = req.params;
  try {
    const result = await pool.query(
      `SELECT post_id FROM post_likes WHERE firebase_uid = $1`,
      [firebase_uid]
    );
    res.json(result.rows); // [{ post_id: 1 }, ...]
  } catch (err) {
    console.error("Failed to get user likes:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/posts/:postId/comments", async (req, res) => {
  const postId = parseInt(req.params.postId, 10);
  const result = await pool.query(
    `SELECT * FROM post_comments
     WHERE post_id = $1 ORDER BY created_at`,
    [postId]
  );
  res.json(result.rows);
});

app.post("/posts/:postId/comments", async (req, res) => {
  const postId = parseInt(req.params.postId, 10);
  const { username, text } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO post_comments (post_id, username, text)
       VALUES ($1, $2, $3) RETURNING *`,
      [postId, username, text]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Failed to insert comment:", err);
    res.status(500).json({ error: "Failed to insert comment" });
  }
});

app.delete("/posts/:postId", async (req, res) => {
  const { postId } = req.params;
  try {
    await pool.query(`DELETE FROM posts WHERE id = $1`, [postId]);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Failed to delete post:", err);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

/* * * * * * * * */
/*     Users     */
/* * * * * * * * */
// Check if user signed up
app.get("/users/:firebase_uid", async (req, res) => {
  const { firebase_uid } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE firebase_uid = $1",
      [firebase_uid]
    );
    if (result.rows.length > 0) {
      res.json({ exists: true, user: result.rows[0] });
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    console.error("Error checking user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Post user's info
app.post("/users/register", async (req, res) => {
  const {
    firebase_uid,
    email,
    nickname,
    liked_ingredients,
    disliked_ingredients,
  } = req.body;

  const liked = JSON.stringify(liked_ingredients);
  const disliked = JSON.stringify(disliked_ingredients);
  const favorite = JSON.stringify([]);

  try {
    await pool.query(
      `INSERT INTO users (firebase_uid,email,nickname,liked_ingredients,disliked_ingredients,favorite_recipes
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [firebase_uid, email, nickname, liked, disliked, favorite]
    );

    res.status(201).json({ message: "User registered" });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// See all users
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user's preferences
app.put("/users/:firebase_uid", async (req, res) => {
  const { firebase_uid } = req.params;
  const { liked_ingredients, disliked_ingredients } = req.body;

  try {
    await pool.query(
      `UPDATE users
       SET liked_ingredients = $1,
           disliked_ingredients = $2
       WHERE firebase_uid = $3`,
      [
        JSON.stringify(liked_ingredients),
        JSON.stringify(disliked_ingredients),
        firebase_uid,
      ]
    );

    res.status(200).json({ message: "Preferences updated" });
  } catch (err) {
    console.error("Error updating preferences:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add favorite recipe
app.post("/users/:firebase_uid/favorites", async (req, res) => {
  const { firebase_uid } = req.params;
  const { recipeName } = req.body;

  try {
    const result = await pool.query(
      "SELECT favorite_recipes FROM users WHERE firebase_uid = $1",
      [firebase_uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const favorites = JSON.parse(result.rows[0].favorite_recipes || "[]");
    if (!favorites.includes(recipeName)) {
      favorites.push(recipeName);

      // likes 수 +1
      await pool.query("UPDATE recipes SET likes = likes + 1 WHERE name = $1", [
        recipeName,
      ]);
    }

    await pool.query(
      "UPDATE users SET favorite_recipes = $1 WHERE firebase_uid = $2",
      [JSON.stringify(favorites), firebase_uid]
    );
    res.status(200).json({ message: "Recipe added to favorites" });
  } catch (err) {
    console.error("Error adding favorite:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Remove favorite recipe
app.delete("/users/:firebase_uid/favorites", async (req, res) => {
  const { firebase_uid } = req.params;
  const { recipeName } = req.body;

  try {
    const result = await pool.query(
      "SELECT favorite_recipes FROM users WHERE firebase_uid = $1",
      [firebase_uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    let favorites = JSON.parse(result.rows[0].favorite_recipes || "[]");
    const wasFavorited = favorites.includes(recipeName);
    favorites = favorites.filter((name) => name !== recipeName);

    if (wasFavorited) {
      // likes 수 -1 (최소 0)
      await pool.query(
        "UPDATE recipes SET likes = GREATEST(likes - 1, 0) WHERE name = $1",
        [recipeName]
      );
    }

    await pool.query(
      "UPDATE users SET favorite_recipes = $1 WHERE firebase_uid = $2",
      [JSON.stringify(favorites), firebase_uid]
    );
    res.status(200).json({ message: "Recipe removed from favorites" });
  } catch (err) {
    console.error("Error removing favorite:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* * * * * * * * */
/*   Feedback    */
/* * * * * * * * */
// 별점 및 피드백 저장 (INSERT or UPDATE)
app.post("/recipes/:recipeId/rate", async (req, res) => {
  const { recipeId } = req.params;
  const { userId, nickname, rating, feedback } = req.body;

  if (!userId || !nickname || !rating) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const query = `
      INSERT INTO recipes_rate (user_id, nickname, recipe_id, rating, feedback, rated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (user_id, recipe_id)
      DO UPDATE SET
        rating = EXCLUDED.rating,
        feedback = EXCLUDED.feedback,
        nickname = EXCLUDED.nickname,
        rated_at = NOW();
    `;
    await pool.query(query, [userId, nickname, recipeId, rating, feedback]);
    res.status(200).json({ message: "Rating saved successfully" });
  } catch (err) {
    console.error("Failed to save rating:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 해당 레시피의 모든 피드백 가져오기
app.get("/recipes/:recipeId/feedbacks", async (req, res) => {
  const { recipeId } = req.params;

  try {
    const result = await pool.query(
      "SELECT nickname, rating, feedback, rated_at FROM recipes_rate WHERE recipe_id = $1 ORDER BY rated_at DESC",
      [recipeId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Failed to fetch feedbacks:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 유저가 남긴 별점 및 피드백 가져오기
app.get("/recipes/:recipeId/rate/:userId", async (req, res) => {
  const { recipeId, userId } = req.params;

  try {
    const result = await pool.query(
      "SELECT rating, feedback, rated_at FROM recipes_rate WHERE user_id = $1 AND recipe_id = $2",
      [userId, recipeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No rating found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Failed to get rating:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Recommendation API
app.get("/recommend-recipes", async (req, res) => {
  const uid = req.query.uid;
  if (!uid) return res.status(400).json({ error: "Missing UID" });

  try {
    // 1. 사용자 선호 재료 불러오기
    const userRes = await pool.query(
      "SELECT liked_ingredients, disliked_ingredients FROM users WHERE firebase_uid = $1",
      [uid]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const liked = JSON.parse(userRes.rows[0].liked_ingredients || "[]");
    const disliked = JSON.parse(userRes.rows[0].disliked_ingredients || "[]");

    if (liked.length === 0 && disliked.length === 0) {
      console.log("GPT-3.5 recommender: no preferences found");
      return res.status(200).json({
        error: "no-preference",
        message: "Please add preferences to get the recommendation.",
      });
    }

    // 2. 레시피 리스트 일부 불러오기 (토큰 초과 방지)
    const recipesRes = await pool.query(`
      SELECT id, title, ingredients, description
      FROM recipes
      LIMIT 15
    `);

    // 3. GPT 프롬프트 생성
    const prompt = `
You are a helpful recipe recommendation assistant.

A user likes the following ingredients: ${liked.join(", ")}.
They dislike the following: ${disliked.join(", ")}.

Given the recipe list below, recommend the top 3 recipes that best match the user's taste.
Respond ONLY as a JSON array like this: [{"id": ..., "title": "...", "reason": "..."}]

Recipes:
${recipesRes.rows
  .map(
    (r, i) =>
      `${i + 1}. ID: ${r.id}, Title: ${r.title}, Ingredients: ${
        r.ingredients
      }, Description: ${r.description}`
  )
  .join("\n")}
`;

    // 4. GPT-3.5 API 호출
    const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await gptRes.json();

    // 5. JSON 파싱
    const content = data.choices?.[0]?.message?.content || "[]";
    const recommendations = JSON.parse(content);

    console.log("GPT-3.5 recommendations:", recommendations);
    
    res.json(recommendations);
  } catch (err) {
    console.error("GPT-3.5 recommender error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* * * * * * * * * */
/*   My Recipes    */
/* * * * * * * * * */
app.post("/recipes/my", async (req, res) => {
  const {
    firebase_uid,
    title,
    description,
    image_url,
    ingredients,
    steps,
    nutrition,
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO my_recipes 
        (user_id, title, description, image_url, ingredients, steps, nutrition, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        firebase_uid,
        title,
        description,
        image_url,
        ingredients,
        JSON.stringify(steps),
        JSON.stringify(nutrition),
      ]
    );
    res.json({ message: "Recipe saved" });
  } catch (err) {
    console.error("Error saving recipe:", err);
    res.status(500).json({ error: "Failed to save recipe" });
  }
});

app.get("/recipes/my", async (req, res) => {
  const { firebase_uid } = req.query;

  try {
    const result = await pool.query(
      `SELECT id, title, description, image_url FROM my_recipes WHERE user_id = $1 ORDER BY created_at DESC`,
      [firebase_uid]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error loading recipes:", err);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

app.get("/recipes/my/:id", async (req, res) => {
  const { id } = req.params;
  const { firebase_uid } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM my_recipes WHERE id = $1 AND user_id = $2`,
      [id, firebase_uid]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error loading recipe:", err);
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
});

app.delete("/recipes/my/:id", async (req, res) => {
  const { id } = req.params;
  const { firebase_uid } = req.query;

  try {
    const result = await pool.query(
      `DELETE FROM my_recipes WHERE id = $1 AND user_id = $2`,
      [id, firebase_uid]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Not found or unauthorized" });
    }

    // 모든 유저의 favorite_user_recipes에서 해당 ID 제거
    const users = await pool.query(
      `SELECT id, favorite_user_recipes FROM users WHERE favorite_user_recipes IS NOT NULL`
    );

    for (const user of users.rows) {
      const updatedFavorites = user.favorite_user_recipes
        .split(",")
        .map((s) => s.trim())
        .filter((favId) => favId !== id);

      const newValue =
        updatedFavorites.length > 0 ? updatedFavorites.join(",") : null;

      await pool.query(
        `UPDATE users SET favorite_user_recipes = $1 WHERE id = $2`,
        [newValue, user.id]
      );
    }

    res.json({
      message: "Recipe deleted and removed from all users' favorites",
    });
  } catch (err) {
    console.error("Error deleting recipe:", err);
    res.status(500).json({ error: "Failed to delete recipe" });
  }
});

// GET /recipes/explore
app.get("/recipes/explore", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id, m.title, m.description, m.image_url, m.likes, u.nickname AS user_nickname
       FROM my_recipes m
       JOIN users u ON m.user_id = u.firebase_uid
       ORDER BY m.likes DESC, m.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching explore recipes:", err);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

app.post("/recipes/:id/like", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE my_recipes SET likes = likes + 1 WHERE id = $1 RETURNING likes`,
      [id]
    );
    res.json({ likes: result.rows[0].likes });
  } catch (err) {
    console.error("Error liking recipe:", err);
    res.status(500).json({ error: "Failed to update likes" });
  }
});

// Add favorite user recipe
// server.js 또는 routes 파일에 아래 추가
app.post("/users/:firebase_uid/favorite-user-recipes", async (req, res) => {
  const { firebase_uid } = req.params;
  const { recipeId } = req.body;

  try {
    const userResult = await pool.query(
      "SELECT favorite_user_recipes FROM users WHERE firebase_uid = $1",
      [firebase_uid]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const favorites = (userResult.rows[0].favorite_user_recipes || "")
      .split(",")
      .filter(Boolean);

    if (!favorites.includes(recipeId.toString())) {
      favorites.push(recipeId.toString());

      await pool.query(
        "UPDATE users SET favorite_user_recipes = $1 WHERE firebase_uid = $2",
        [favorites.join(","), firebase_uid]
      );

      await pool.query(
        "UPDATE my_recipes SET likes = likes + 1 WHERE id = $1",
        [recipeId]
      );
    }

    res.status(200).json({ message: "Added to favorite_user_recipes" });
  } catch (err) {
    console.error("Error adding to favorite_user_recipes:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Remove favorite user recipe
app.delete("/users/:firebase_uid/favorite-user-recipes", async (req, res) => {
  const { firebase_uid } = req.params;
  const { recipeId } = req.body;

  try {
    const userResult = await pool.query(
      "SELECT favorite_user_recipes FROM users WHERE firebase_uid = $1",
      [firebase_uid]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentFavorites = userResult.rows[0].favorite_user_recipes || "";
    const favorites = currentFavorites
      .split(",")
      .filter((s) => s && s !== recipeId.toString());

    // likes -1
    await pool.query(
      "UPDATE my_recipes SET likes = GREATEST(likes - 1, 0) WHERE id = $1",
      [recipeId]
    );

    await pool.query(
      "UPDATE users SET favorite_user_recipes = $1 WHERE firebase_uid = $2",
      [favorites.join(","), firebase_uid]
    );

    res.status(200).json({ message: "User recipe removed from favorites" });
  } catch (err) {
    console.error("Error removing favorite user recipe:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 디버깅용 구문
app.get("/admin/reset-feed", async (req, res) => {
  try {
    await pool.query("DELETE FROM post_likes");
    await pool.query("DELETE FROM post_comments");
    await pool.query("DELETE FROM posts");
    res.status(200).json({ message: "Feed reset successful (GET method)" });
  } catch (err) {
    console.error("Feed reset error:", err);
    res.status(500).json({ error: "Failed to reset feed" });
  }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
  try {
    // 레시피가 이미 저장돼 있는지 확인
    const alreadyInserted = await pool.query(`SELECT COUNT(*) FROM recipes`);
    if (parseInt(alreadyInserted.rows[0].count) > 0) {
      console.log("📕 Recipes already imported. Skipping import.");
    } else {
      console.log("🚀 First-time recipe import...");
      await importRecipesFromOpenAPI();
    }

    console.log(`✅ Server listening on port ${PORT}`);
  } catch (err) {
    console.error("❌ Cannot start server:", err);
  }
});
