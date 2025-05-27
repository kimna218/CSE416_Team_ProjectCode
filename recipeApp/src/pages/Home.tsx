import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Home.css";
import { getAuth } from "firebase/auth";
import { getCurrentLang } from "../components/language";

interface Recipe {
  id: number;
  name: string;
  en_name: string;
  image_url: string;
  category: string;
  likes: number;
}

interface Nutrition {
  calories: number;
  carbohydrates: number;
  protein: number;
  fat: number;
  sodium: number;
}

interface FullRecipe extends Recipe, Nutrition {}

function Home() {
  const navigate = useNavigate();
  const lang = getCurrentLang();
  const [recipes, setRecipes] = useState<FullRecipe[]>([]);
  const [popularRecipes, setPopularRecipes] = useState<Recipe[]>([]);
  const [sortKey, setSortKey] = useState<string>("protein");
  const [recommendedRecipes, setRecommendedRecipes] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const recipesPerPage = 12;

  const fetchRecommended = async () => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) {
      console.log("User not authenticated");
      setRecommendedRecipes([]);
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/recommend-recipes?uid=${uid}`
      );
      const data = await res.json();
      setRecommendedRecipes(data);
    } catch (err) {
      console.error("Failed to fetch recommended recipes", err);
    }
  };

  useEffect(() => {
    const fetchRecipesWithNutrition = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/recipes`);
      const data: Recipe[] = await res.json();

      const enriched = await Promise.all(
        data.map(async (recipe) => {
          try {
            const nutriRes = await fetch(
              `${import.meta.env.VITE_API_URL}/recipes/detail/${
                recipe.id
              }/nutrition`
            );
            const nutrition: Nutrition = await nutriRes.json();
            return { ...recipe, ...nutrition };
          } catch (err) {
            console.warn(`Nutrition missing for: ${recipe.name}`);
            return null;
          }
        })
      );

      const filtered = enriched.filter((r) => r !== null) as FullRecipe[];
      setRecipes(filtered);
    };

    const fetchPopularRecipes = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/recipes/popular`
        );
        const data: Recipe[] = await res.json();
        setPopularRecipes(data);
      } catch (err) {
        console.error("Failed to fetch popular recipes:", err);
      }
    };

    fetchRecipesWithNutrition();
    fetchPopularRecipes();
    fetchRecommended();
  }, []);

  const sortedRecipes = [...recipes].sort((a, b) => {
    switch (sortKey) {
      case "protein":
        return b.protein - a.protein;
      case "carbohydrates":
        return a.carbohydrates - b.carbohydrates;
      case "sodium":
        return a.sodium - b.sodium;
      case "fat":
        return a.fat - b.fat;
      case "calories":
        return a.calories - b.calories;
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedRecipes.length / recipesPerPage);
  const startIndex = (currentPage - 1) * recipesPerPage;
  const currentRecipes = sortedRecipes.slice(
    startIndex,
    startIndex + recipesPerPage
  );

  const paginationGroupSize = 5;
  const paginationStart =
    Math.floor((currentPage - 1) / paginationGroupSize) * paginationGroupSize +
    1;
  const paginationEnd = Math.min(
    paginationStart + paginationGroupSize - 1,
    totalPages
  );

  const handleClick = (recipe: Recipe) => {
    const path = `/recipes/detail/${encodeURIComponent(recipe.name)}`;
    navigate(path);
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Welcome to RecipeApp 🍳</h1>
        <p>
          Discover delicious recipes, search by ingredients, and explore meal
          categories!
        </p>
      </div>

      <div className="categories-preview">
        <h2>AI Recommended Recipes</h2>
        <div className="rec-recipe-grid">
          {recommendedRecipes.length > 0 ? (
            recommendedRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="rec-recipe-card"
                onClick={() => handleClick(recipe)}
              >
                <img
                  src={recipe.image_url}
                  alt={recipe.name}
                  className="rec-recipe-image"
                />
                <p className="home-recipe-name">{lang === "en" ? recipe.en_name || recipe.name : recipe.name}</p>
                <p className="rec-reason">{recipe.reason}</p>
              </div>
            ))
          ) : (
            <p>Loading recommendations...</p>
          )}
        </div>
      </div>

      <div className="popular-recipes">
        <h2>Popular Recipes</h2>
        <div className="home-recipe-grid">
          {popularRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="popular-recipe-card"
              onClick={() => handleClick(recipe)}
            >
              <img
                src={recipe.image_url}
                alt={recipe.name}
                className="popular-recipe-image"
              />
              <p className="home-recipe-name">{lang == "en" ? recipe.en_name || recipe.name : recipe.name}</p>
              <p className="home-recipe-likes">❤️ {recipe.likes} Likes</p>
            </div>
          ))}
        </div>
      </div>

      <div className="sort-bar">
        <h2>Sorted By:</h2>
        <select
          id="sort"
          value={sortKey}
          onChange={(e) => {
            setSortKey(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="protein">High Protein</option>
          <option value="carbohydrates">Low Carbs</option>
          <option value="sodium">Low Sodium</option>
          <option value="fat">Low Fat</option>
          <option value="calories">Low Calories</option>
        </select>
      </div>

      <div className="home-category-grid">
        {currentRecipes.map((recipe) => (
          <div
            key={recipe.id}
            className="home-recipe-card"
            onClick={() => handleClick(recipe)}
          >
            <img
              src={recipe.image_url}
              alt={recipe.name}
              className="home-recipe-image"
            />
              <p className="home-recipe-name">{lang == "en" ? recipe.en_name || recipe.name : recipe.name}</p>
              <p className="nutrition-info">
              {`Protein: ${recipe.protein.toFixed(
                1
              )}g | Carbs: ${recipe.carbohydrates.toFixed(
                1
              )}g | Fat: ${recipe.fat.toFixed(
                1
              )}g | Sodium: ${recipe.sodium.toFixed(1)}mg | Calories: ${
                recipe.calories
              }`}
            </p>
          </div>
        ))}
      </div>

      <div className="pagination">
        {paginationStart > 1 && (
          <button onClick={() => setCurrentPage(paginationStart - 1)}>
            {"<"}
          </button>
        )}
        {Array.from(
          { length: paginationEnd - paginationStart + 1 },
          (_, i) => paginationStart + i
        ).map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => setCurrentPage(pageNum)}
            className={currentPage === pageNum ? "active-page" : ""}
          >
            {pageNum}
          </button>
        ))}
        {paginationEnd < totalPages && (
          <button onClick={() => setCurrentPage(paginationEnd + 1)}>
            {">"}
          </button>
        )}
      </div>
    </div>
  );
}

export default Home;
