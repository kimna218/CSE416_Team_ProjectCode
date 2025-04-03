import React from "react";
import { useParams } from "react-router-dom";
import "../css/RecipeList.css";

const recipes = {
  breakfast: [
    { name: "Pancakes", image: "/images/pancakes.jpg" },
    { name: "Omelette", image: "/images/omelette.jpg" },
  ],
  lunch: [
    { name: "Grilled Chicken", image: "/images/grilled-chicken.jpg" },
    { name: "Caesar Salad", image: "/images/caesar-salad.jpg" },
  ],
  dinner: [
    { name: "Steak", image: "/images/steak.jpg" },
    { name: "Spaghetti", image: "/images/spaghetti.jpg" },
  ],
  dessert: [
    { name: "Chocolate Cake", image: "/images/chocolate-cake.jpg" },
    { name: "Ice Cream", image: "/images/ice-cream.jpg" },
  ],
  snacks: [
    { name: "Nachos", image: "/images/nachos.jpg" },
    { name: "Popcorn", image: "/images/popcorn.jpg" },
  ],
};

const RecipeList: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const categoryRecipes = recipes[category as keyof typeof recipes] || [];

  return (
    <div className="recipe-list-page">
      <h1>{category?.toUpperCase()} Recipes</h1>
      <div className="recipe-grid">
        {categoryRecipes.map((recipe, index) => (
          <div key={index} className="recipe-card">
            <img src={recipe.image} alt={recipe.name} className="recipe-image" />
            <p className="recipe-name">{recipe.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipeList;