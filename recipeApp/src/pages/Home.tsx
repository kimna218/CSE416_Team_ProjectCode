import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/Home.css";

const categories = [
  { name: "Meal", image: "/images/breakfast.jpg", path: "/recipes/Meal" },
  { name: "One Dish Meal", image: "/images/lunch.jpg", path: "/recipes/OneDish" },
  { name: "Soup", image: "/images/dinner.jpg", path: "/recipes/Soup" },
  { name: "Dessert", image: "/images/dessert.jpg", path: "/recipes/dessert" },
];

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
        <button className="explore-button" onClick={() => navigate("/category")}>
          Explore Categories
        </button>
      </div>

      <div className="categories-preview">
        <h2>Browse by Categories</h2>
        <div className="category-grid">
          {/* {categories.map((category, index) => (
            <div
              key={index}
              className="category-block"
              onClick={() => navigate(category.path)}
            >
              <img src={category.image} alt={category.name} className="category-image" />
              <p className="category-name">{category.name}</p>
            </div>
          ))} */}
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