import { useState } from "react";
import "../css/Ingredient.css";

const recipes = [
  { name: "Egg and Cheese Sandwich", ingredients: ["eggs", "cheese", "bread"] },
  { name: "Tomato Pasta", ingredients: ["tomatoes", "pasta", "olive oil"] },
  { name: "Cheese Omelette", ingredients: ["eggs", "cheese", "butter"] },
  { name: "Tomato Salad", ingredients: ["tomatoes", "lettuce", "olive oil"] },
];

function Ingredient() {
  const [input, setInput] = useState("");
  const [filteredRecipes, setFilteredRecipes] = useState<string[]>([]);

  const handleSearch = () => {
    const inputIngredients = input.toLowerCase().split(",").map((item) => item.trim());
    const results = recipes
      .filter((recipe) =>
        inputIngredients.every((ingredient) => recipe.ingredients.includes(ingredient))
      )
      .map((recipe) => recipe.name);
    setFilteredRecipes(results);
  };

  return (
    <div className="ingredient-page">
      <h1>Search By Ingredient</h1>
      <p>Enter ingredients separated by commas (e.g., eggs, cheese, tomatoes):</p>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter ingredients"
        className="ingredient-input"
      />
      <button onClick={handleSearch} className="ingredient-button">
        Search
      </button>
      <div className="ingredient-results">
        {filteredRecipes.length > 0 ? (
          <ul>
            {filteredRecipes.map((recipe, index) => (
              <li key={index}>{recipe}</li>
            ))}
          </ul>
        ) : (
          <p>No recipes found. Try different ingredients.</p>
        )}
      </div>
    </div>
  );
}

export default Ingredient;