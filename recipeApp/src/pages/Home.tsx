import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/Home.css";


const popularRecipes = [
  { name: "Pancakes", image: "/images/pancakes.jpg" },
  { name: "Grilled Chicken", image: "/images/grilled-chicken.jpg" },
  { name: "Chocolate Cake", image: "/images/chocolate-cake.jpg" },
];

function Home() {
  const navigate = useNavigate();

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
    </div>
  );
}

export default Home;