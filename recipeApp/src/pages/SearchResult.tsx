import React, { useState } from "react";
import "../css/SearchResult.css";

const recipes = [
  { name: "Egg and Cheese Sandwich", image: "/images/egg-cheese-sandwich.jpg" },
  { name: "Tomato Pasta", image: "/images/tomato-pasta.jpg" },
  { name: "Cheese Omelette", image: "/images/cheese-omelette.jpg" },
  { name: "Tomato Salad", image: "/images/tomato-salad.jpg" },
  { name: "Pancakes", image: "/images/pancakes.jpg" },
  { name: "Grilled Chicken", image: "/images/grilled-chicken.jpg" },
];

function SearchResult() {
  const [searchInput, setSearchInput] = useState("");
  const [filteredRecipes, setFilteredRecipes] = useState(recipes);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchInput(query);
    const results = recipes.filter((recipe) =>
      recipe.name.toLowerCase().includes(query)
    );
    setFilteredRecipes(results);
  };

  return (
    <div className="search-result-page">
      <h1>Search Recipes</h1>
      <p className="search-result-page-desc">Filter recipes by its name:</p>
      <input
        type="text"
        value={searchInput}
        onChange={handleSearch}
        placeholder="Search by recipe name..."
        className="search-box"
      />
      <div className="results-grid">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe, index) => (
            <div key={index} className="recipe-card">
              <img src={recipe.image} alt={recipe.name} className="recipe-image" />
              <p className="recipe-name">{recipe.name}</p>
            </div>
          ))
        ) : (
          <p className="no-results">No recipes found. Try a different search.</p>
        )}
      </div>
    </div>
  );
}

export default SearchResult;