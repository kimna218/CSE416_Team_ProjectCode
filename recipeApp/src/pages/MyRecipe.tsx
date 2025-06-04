import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/MyRecipe.css";
import { getAuth } from "firebase/auth";

interface RecipeSummary {
  id: number;
  title: string;
  description: string;
  image_url: string;
}

const MyRecipe: React.FC = () => {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecipes = async () => {
      const user = getAuth().currentUser;
      if (!user) {
        alert("Login is required to see your recipes.");
        return;
      }

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/recipes/my?firebase_uid=${user.uid}`);
        if (!res.ok) throw new Error("Failed to fetch recipes");

        const data = await res.json();
        setRecipes(data); // 서버는 [{ id, title, description, image_url }]
      } catch (err) {
        console.error("Fetch error:", err);
        alert("Failed to load recipes.");
      }
    };

    fetchRecipes();
  }, []);

  const deleteRecipe = async (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this recipe?");
    if (!confirmDelete) return;
  
    const user = getAuth().currentUser;
    if (!user) {
      alert("Login is required to delete.");
      return;
    }
  
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/recipes/my/${id}?firebase_uid=${user.uid}`,
        { method: "DELETE" }
      );
  
      if (!res.ok) throw new Error("Delete failed");
  
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      alert("✅ Recipe deleted!");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete recipe.");
    }
  };  

  return (
    <div className="top-class my-recipes-page">
      <h1>My Recipes</h1>
      <div className="my-recipes-buttons">
        <Link to="/MyRecipe/UploadRecipe" className="upload-button">+ Add New Recipe</Link>
        <Link to="/Explore" className="explore-button">🌎 Explore</Link>
      </div>
      {recipes.length === 0 ? (
        <p>You haven’t added any recipes yet.</p>
      ) : (
        <div className="recipe-grid">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="recipe-card"
              onClick={() => navigate(`/MyRecipe/detail/${recipe.id}`)}
            >
              <img src={recipe.image_url} alt={recipe.title} className="recipe-thumbnail" />
              <h3>{recipe.title}</h3>
              <p>{recipe.description}</p>
              <button
                className="edit-button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/MyRecipe/edit/${recipe.id}`);
                }}
              >
                ✏️ Edit
              </button>

              <button
                className="delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteRecipe(recipe.id);
                }}
              >
                🗑 Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRecipe;
