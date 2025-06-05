import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Home.css";
import "../css/Spinner.css";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getCurrentLang } from "../components/language";
import Guideline from "../components/Guideline";
import "../css/Guideline.css";

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
  const [recommendedRecipes, setRecommendedRecipes] = useState<any[]>([]);
  const [recommendationMessage, setRecommendationMessage] =
    useState<string>("");
  const [showGuideline, setShowGuideline] = useState(false);
  const [sortKey, setSortKey] = useState<string>("protein");

  const [isLoadingRecommended, setIsLoadingRecommended] = useState(true);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const recipesPerPage = 12;

  const fetchRecommended = async (uid: string) => {
    setIsLoadingRecommended(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/recommend-recipes?uid=${uid}`
      );
      const data = await res.json();

      if (data.error === "no-preference") {
        setRecommendedRecipes([]);
        setRecommendationMessage(data.message);
      } else {
        setRecommendedRecipes(data);
        setRecommendationMessage("");
      }
    } catch (err) {
      console.error("Failed to fetch recommended recipes", err);
      setRecommendedRecipes([]);
      setRecommendationMessage("Failed to load recommendations.");
    } finally {
      setIsLoadingRecommended(false);
    }
  };

  const fetchRecipesWithNutrition = async () => {
    setIsLoadingNutrition(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/recipes`);
      const data: Recipe[] = await res.json();

      const enriched = await Promise.all(
        data.map(async (recipe) => {
          try {
            const nutriRes = await fetch(
              `${import.meta.env.VITE_API_URL}/recipes/detail/${recipe.id}/nutrition`
            );
            const nutrition: Nutrition = await nutriRes.json();
            return { ...recipe, ...nutrition };
          } catch {
            return null;
          }
        })
      );

      const filtered = enriched.filter((r) => r !== null) as FullRecipe[];
      setRecipes(filtered);
    } catch (err) {
      console.error("Failed to fetch recipes:", err);
    } finally {
      setIsLoadingNutrition(false);
    }
  };

  const fetchPopularRecipes = async () => {
    setIsLoadingPopular(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/recipes/popular`
      );
      const data: Recipe[] = await res.json();
      setPopularRecipes(data);
    } catch (err) {
      console.error("Failed to fetch popular recipes:", err);
    } finally {
      setIsLoadingPopular(false);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchRecommended(user.uid);
      }
    });

    fetchRecipesWithNutrition();
    fetchPopularRecipes();

    return () => unsubscribe();
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
    <div>
      <div className="top-class home-page">
        <div className="hero-section">
          <h1>Welcome to RecipeApp 🍳</h1>
          <p>
            Discover delicious recipes, search by ingredients, and explore meal
            categories!
          </p>
          <button className="cta-button" onClick={() => setShowGuideline(true)}>
            Show Guidelines
          </button>
        </div>

        <div className="categories-preview">
          <h2>AI Recommended Recipes</h2>
          <div className="rec-recipe-grid">
            {isLoadingRecommended ? (
              <div className="spinner" />
            ) : recommendedRecipes.length > 0 ? (
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
                  <p className="home-recipe-name">
                    {lang === "en"
                      ? recipe.en_name || recipe.name
                      : recipe.name}
                  </p>
                  <p className="rec-reason">{recipe.reason}</p>
                </div>
              ))
            ) : (
              <p>{recommendationMessage || "No recommended recipes."}</p>
            )}
          </div>
        </div>

        <div className="popular-recipes">
          <h2>Popular Recipes</h2>
          {isLoadingPopular ? (
            <div className="spinner" />
          ) : (
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
                  <p className="home-recipe-name">
                    {lang == "en"
                      ? recipe.en_name || recipe.name
                      : recipe.name}
                  </p>
                  <p className="home-recipe-likes">❤️ {recipe.likes} Likes</p>
                </div>
              ))}
            </div>
          )}
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
          {isLoadingNutrition ? (
            <div className="spinner" />
          ) : (
            currentRecipes.map((recipe) => (
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
                <p className="home-recipe-name">
                  {lang == "en"
                    ? recipe.en_name || recipe.name
                    : recipe.name}
                </p>
                <p className="nutrition-info">
                  {`Protein: ${recipe.protein.toFixed(
                    1
                  )}g | Carbs: ${recipe.carbohydrates.toFixed(
                    1
                  )}g | Fat: ${recipe.fat.toFixed(
                    1
                  )}g | Sodium: ${recipe.sodium.toFixed(
                    1
                  )}mg | Calories: ${recipe.calories}`}
                </p>
              </div>
            ))
          )}
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
      {showGuideline && <Guideline onClose={() => setShowGuideline(false)} />}
    </div>
  );
}

export default Home;
