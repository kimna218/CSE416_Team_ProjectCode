import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import pkg from "pg";
import dotenv from "dotenv";
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

// CREATE TABLES
// Recipe Page
await pool.query(`
  CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(50),
    image_url VARCHAR(255),
    ingredients TEXT,
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

// Feed Page
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

// User Page
await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    liked_ingredients TEXT,
    disliked_ingredients TEXT,
    favorite_recipes TEXT
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

export async function getUserByUID(uid) {
  try {
    const result = await pool.query("SELECT * FROM users WHERE firebase_uid = $1", [uid]);
    return result.rows[0];
  } catch (err) {
    console.error("Error fetching user by UID:", err);
    return null;
  }
}

// API Routers
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

// 인기 레시피 4개 조회 (likes 기준)
app.get("/recipes/popular", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, image_url, category
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

// All posts with like counts
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

app.post("/posts/:postId/like", async (req, res) => {
  const { firebase_uid } = req.body;
  const postId = parseInt(req.params.postId);

  try {
    await pool.query(
      `INSERT INTO post_likes (post_id, firebase_uid)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [postId, firebase_uid]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to like post:", err);
    res.status(500).json({ error: "Failed to like post" });
  }
});

/* * * * * * * * */
/*     Users     */
/* * * * * * * * */
//이미 signUp 했는지, get user's info
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

// post user's info
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

//see all users
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//update user's preferences
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

// 즐겨찾기 추가
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
      await pool.query(
        "UPDATE recipes SET likes = likes + 1 WHERE name = $1",
        [recipeName]
      );
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


// 즐겨찾기 제거
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


/* * * * * * * * * * */
/*     Feedback      */
/* * * * * * * * * * */
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
// GET /recommend-recipes?uid=xxxx
app.get("/recommend-recipes", async (req, res) => {
  const uid = req.query.uid;
  if (!uid) return res.status(400).json({ error: "Missing UID" });

  const user = await getUserByUID(uid);
  if (!user) return res.status(404).json({ error: "User not found" });

  const liked = JSON.parse(user.liked_ingredients || "[]");
  const disliked = JSON.parse(user.disliked_ingredients || "[]");

  // 🔥 레시피 전체 목록 가져오기
  const allRecipeNames = await pool.query("SELECT name FROM recipes");
  const nameList = allRecipeNames.rows.map(r => r.name);
  const nameListString = JSON.stringify(nameList.slice(0, 500)); // 길이 제한을 위해 500개까지만 전달

  const prompt = `
You are a recipe recommender.

The user likes: ${liked.join(", ")}.
The user dislikes: ${disliked.join(", ")}.

Only recommend 5 recipe titles that exactly match the following list:
${nameListString}

Return them as a JSON array:
[
  "Recipe 1",
  "Recipe 2",
  ...
]
`;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await openaiRes.json();
    const text = data.choices[0].message.content;

    if (!openaiRes.ok) {
  const errorText = await openaiRes.text();
  console.error("❌ OpenAI 응답 실패 상태코드:", openaiRes.status);
  console.error("❌ OpenAI 응답 본문:", errorText);
  return res.status(500).json({ error: "OpenAI request failed" });
}


    let recipes;
    try {
      recipes = JSON.parse(text);
    } catch (err) {
      console.error("OpenAI 응답 파싱 실패:", text);
      return res.status(500).json({ error: "Invalid JSON from OpenAI" });
    }

    // 🔎 필터링 (혹시라도 추천된 이름이 DB에 없다면 제거)
    const verified = recipes.filter((name) => nameList.includes(name));
    res.json({ recommendations: verified });
  } catch (err) {
    console.error("OpenAI 요청 실패:", err);
    res.status(500).json({ error: "OpenAI request failed" });
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

// 서버 시작
const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
  try {
    await importRecipesFromOpenAPI();
  } catch (err) {
    console.error("Cannot start server:", err);
  }
});
