import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Home.css";

const popularRecipes = [
  { name: "Pancakes", image: "/images/pancakes.jpg" },
  { name: "Omelette", image: "/images/omelette.jpg" },
  { name: "Vanilla Ice Cream", image: "/images/dessert.jpg" },
  { name: "Fried Eggs", image: "/images/breakfast.jpg" },
];

interface Recipe {
  id: number;
  name: string;
  image_url: string;
  category: string;
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
  const [recipes, setRecipes] = useState<FullRecipe[]>([]);
  const [sortKey, setSortKey] = useState<string>("protein");

  const [currentPage, setCurrentPage] = useState(1);
  const recipesPerPage = 12;

  useEffect(() => {
    const fetchRecipesWithNutrition = async () => {
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
          } catch (err) {
            console.warn(`Nutrition missing for: ${recipe.name}`);
            return null;
          }
        })
      );

      const filtered = enriched.filter((r) => r !== null) as FullRecipe[];
      setRecipes(filtered);
    };

    fetchRecipesWithNutrition();
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
  const currentRecipes = sortedRecipes.slice(startIndex, startIndex + recipesPerPage);

  const paginationGroupSize = 5;
  const paginationStart = Math.floor((currentPage - 1) / paginationGroupSize) * paginationGroupSize + 1;
  const paginationEnd = Math.min(paginationStart + paginationGroupSize - 1, totalPages);

  const handleClick = (recipe: Recipe) => {
    const path = `/recipes/detail/${encodeURIComponent(recipe.name)}`;
    navigate(path);
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Welcome to RecipeApp 🍳</h1>
        <p>Discover delicious recipes, search by ingredients, and explore meal categories!</p>
      </div>

      <div className="categories-preview">
        <h2>Recommendation Recipes</h2>
        <div className="home-category-grid">
          {/* 추천 레시피 영역 (추후 구현) */}
          <p>Coming Soon...</p>
        </div>
      </div>

      <div className="popular-recipes">
        <h2>Popular Recipes</h2>
        <div className="home-recipe-grid">
          {popularRecipes.map((recipe, index) => (
            <div key={index} className="popular-recipe-card">
              <img src={recipe.image} alt={recipe.name} className="popular-recipe-image" />
              <p className="home-recipe-name">{recipe.name}</p>
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
          <div key={recipe.id} className="home-recipe-card" onClick={() => handleClick(recipe)}>
            <img src={recipe.image_url} alt={recipe.name} className="home-recipe-image" />
            <p className="home-recipe-name">{recipe.name}</p>
            <p className="nutrition-info">
              {`Protein: ${recipe.protein.toFixed(1)}g | Carbs: ${recipe.carbohydrates.toFixed(1)}g | Fat: ${recipe.fat.toFixed(1)}g | Sodium: ${recipe.sodium.toFixed(1)}mg | Calories: ${recipe.calories}`}
            </p>
          </div>
        ))}
      </div>

      <div className="pagination">
        {paginationStart > 1 && (
          <button onClick={() => setCurrentPage(paginationStart - 1)}>{'<'}</button>
        )}
        {Array.from({ length: paginationEnd - paginationStart + 1 }, (_, i) => paginationStart + i).map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => setCurrentPage(pageNum)}
            className={currentPage === pageNum ? "active-page" : ""}
          >
            {pageNum}
          </button>
        ))}
        {paginationEnd < totalPages && (
          <button onClick={() => setCurrentPage(paginationEnd + 1)}>{'>'}</button>
        )}
      </div>
    </div>
  );
}

export default Home;
