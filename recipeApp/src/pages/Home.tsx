import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Home.css";


const popularRecipes = [
  { name: "Pancakes", image: "/images/pancakes.jpg" },
  { name: "Grilled Chicken", image: "/images/grilled-chicken.jpg" },
  { name: "Chocolate Cake", image: "/images/chocolate-cake.jpg" },
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
  const [visibleCount, setVisibleCount] = useState(8); // 처음에 8개만 보이게


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

  // 정렬 로직
  const sortedRecipes = [...recipes].sort((a, b) => {
    switch (sortKey) {
      case "protein": return b.protein - a.protein;
      case "carbohydrates": return a.carbohydrates - b.carbohydrates;
      case "sodium": return a.sodium - b.sodium;
      case "fat": return a.fat - b.fat;
      case "calories": return a.calories - b.calories;
      default: return 0;
    }
  });

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 8); // 4개씩 추가
  };

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
        <div className="category-grid">
         {/*recommendation recipes 넣어야됨~~  */}
        </div>
      </div>

      <div className="popular-recipes">
        <h2>Popular Recipes</h2>
        <div className="recipe-grid">
          {popularRecipes.map((recipe, index) => (
            <div key={index} className="recipe-card">
              <img src={recipe.image} alt={recipe.name} className="recipe-image" />
              <p className="recipe-name">{recipe.name}</p>
            </div>
          ))}
        </div>
      </div>


        <div className="sort-bar">
          <h2>Sorted By:</h2>
          <select
            id="sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
          >
            <option value="protein">High Protein</option>
            <option value="carbohydrates">Low Carbs</option>
            <option value="sodium">Low Sodium</option>
            <option value="fat">Low Fat</option>
            <option value="calories">Low Calories</option>
          </select>
        </div>

        <div className="category-grid">
          {sortedRecipes.slice(0, visibleCount).map((recipe) => (
            <div key={recipe.id} className="recipe-card" onClick={() => handleClick(recipe)}>
              <img
                src={recipe.image_url}
                alt={recipe.name}
                className="recipe-image"
              />
              <p className="recipe-name">{recipe.name}</p>
              <p className="nutrition-info">
                {`Protein: ${recipe.protein.toFixed(1)}g | Carbs: ${recipe.carbohydrates.toFixed(1)}g | Fat: ${recipe.fat.toFixed(1)}g | Sodium: ${recipe.sodium.toFixed(1)}mg | Calories: ${recipe.calories}`}
              </p>
            </div>
          ))}
        </div>

        {visibleCount < sortedRecipes.length && (
        <div className="show-more-container">
          <button className="show-more-button" onClick={handleShowMore}>
            <span className="arrow-down">▼</span>
          </button>
        </div>
        )}
    </div>
  );
}

export default Home;