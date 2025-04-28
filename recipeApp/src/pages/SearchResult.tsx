import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/SearchResult.css";

interface Recipe {
  id: number;
  name: string;
  category: string;
  image_url: string;
}

const SearchResult: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const [searchInput, setSearchInput] = useState(""); // "확정된 검색어"
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // loading state
  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/recipes`);
        const data = await res.json();
        setRecipes(data);
      } catch (err) {
        console.error("Error fetching recipes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearchInput(inputValue.toLowerCase()); // Enter 누르면 searchInput 확정
    }
  };

  const handleClick = (recipe: Recipe) => {
    const path = `/recipes/detail/${encodeURIComponent(recipe.name)}`;
    navigate(path);
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchInput)
  );

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="search-result-page">
      <h1>Search Recipes</h1>
      <p className="search-result-page-desc">
        Filter recipes by its name or Enter ingredients separated by commas (e.g., eggs, cheese, tomatoes):
      </p>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}  // <-- 추가!
        placeholder="Search by recipe name..."
        className="search-box"
      />
      <div className="results-grid">
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe, index) => (
            <div key={index} className="recipe-card" onClick={() => handleClick(recipe)}>
              <img src={recipe.image_url} alt={recipe.name} className="recipe-image" />
              <p className="recipe-name">{recipe.name}</p>
            </div>
          ))
        ) : (
          <p className="no-results">No recipes found. Try a different search.</p>
        )}
      </div>
    </div>
  );
};

export default SearchResult;
