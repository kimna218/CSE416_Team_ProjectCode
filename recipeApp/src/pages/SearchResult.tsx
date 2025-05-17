import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/SearchResult.css";

interface Recipe {
  id: number;
  name: string;
  category: string;
  image_url: string;
  ingredients: string;
}

const SearchResult: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const [searchInput, setSearchInput] = useState(""); 
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false); 

  const navigate = useNavigate();

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
      setSearchInput(inputValue.toLowerCase());
      setHasSearched(true); 
    }
  };

  const handleClick = (recipe: Recipe) => {
    const path = `/recipes/detail/${encodeURIComponent(recipe.name)}`;
    navigate(path);
  };

const filteredRecipes = recipes.filter((recipe) => {
  const searchKeywords = searchInput.split(/[\s,]+/).map(k => k.trim()).filter(k => k.length > 0);

  const recipeText = `${recipe.name} ${recipe.ingredients}`.toLowerCase(); // 이름 + 재료 전체 문자열 결합

  return searchKeywords.some(keyword =>
    recipeText.includes(keyword)
  );
});


  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="search-result-page">
      <h1>Search Recipes</h1>
      <p className="search-result-page-desc">
        Filter recipes by its name or Enter ingredients separated by space (e.g., 새우 계란 토마토):
      </p>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
        placeholder="Search by recipe name..."
        className="search-box"
      />
      <div className="results-grid">
        {hasSearched ? (
          filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe, index) => (
              <div key={index} className="recipe-card" onClick={() => handleClick(recipe)}>
                <img src={recipe.image_url} alt={recipe.name} className="recipe-image" />
                <p className="recipe-name">{recipe.name}</p>
              </div>
            ))
          ) : (
            <p className="no-results">No recipes found. Try a different search.</p>
          )
        ) : (
          null
        )}
      </div>
    </div>
  );
};

export default SearchResult;
