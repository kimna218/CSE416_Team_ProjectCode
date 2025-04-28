import React, { useEffect,useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/SearchResult.css";

interface Recipe {
  id: number;
  name: string;
  category: string;
  image_url: string;
}

const SearchResult: React.FC = () => {
  const [searchInput, setSearchInput] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

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
          console.error("Error to fetch recipe:", err);
        } finally {
          setLoading(false);
        }
      };
  
      fetchRecipes();
  }, []);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value.toLowerCase());
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchInput)
  );

  const navigate = useNavigate();
  const handleClick = (recipe: Recipe) => {
    const path = `/recipes/detail/${encodeURIComponent(recipe.name)}`;
    navigate(path);
  };

  return (
    <div className="search-result-page">
      <h1>Search Recipes</h1>
      <p className="search-result-page-desc">Filter recipes by its name or Enter ingredients separated by commas (e.g., eggs, cheese, tomatoes):</p>
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
}

export default SearchResult;