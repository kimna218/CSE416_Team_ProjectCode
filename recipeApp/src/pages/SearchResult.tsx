import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../css/SearchResult.css";
import { getCurrentLang } from "../components/language";

interface Recipe {
  id: number;
  name: string;
  en_name: string;
  category: string;
  image_url: string;
  ingredients: string;
  en_ingredients: string;
}

const SearchResult: React.FC = () => {
  const lang = getCurrentLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("query") || "";

  const [inputValue, setInputValue] = useState(initialQuery);
  const [searchInput, setSearchInput] = useState(initialQuery.toLowerCase());
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);

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
    if (e.key === "Enter") {
      setSearchInput(inputValue.toLowerCase());
      setSearchParams({ query: inputValue });
      setHasSearched(true);
    }
  };

  const handleClick = (recipe: Recipe) => {
    const path = `/recipes/detail/${encodeURIComponent(
      lang === "en" ? recipe.en_name || recipe.name : recipe.name
    )}`;
    navigate(path);
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const searchKeywords = searchInput
      .split(/[\s,]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const recipeText = [
      recipe.name,
      recipe.en_name,
      recipe.ingredients,
      recipe.en_ingredients,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchKeywords.some((keyword) => recipeText.includes(keyword));
  });

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="search-result-page">
      <h1>Search Recipes</h1>
      <p className="search-result-page-desc">
        Filter recipes by its name or enter ingredients separated by space (e.g., 새우 계란 토마토):
      </p>
      <div className="search-controls">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder="Enter input..."
          className="search-box"
        />
      </div>

      <div className="results-grid">
        {hasSearched ? (
          filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe, index) => (
              <div key={index} className="result-recipe-card" onClick={() => handleClick(recipe)}>
                <img src={recipe.image_url} alt={recipe.name} className="recipe-image" />
                <p className="recipe-name">
                  {lang === "en" ? recipe.en_name || recipe.name : recipe.name}
                </p>
              </div>
            ))
          ) : (
            <p className="no-results">No recipes found. Try a different search.</p>
          )
        ) : null}
      </div>
    </div>
  );
};

export default SearchResult;
