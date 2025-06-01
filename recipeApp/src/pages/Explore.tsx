import React, { useEffect, useState } from "react";
import {useNavigate } from "react-router-dom";
import "../css/Explore.css";

interface Recipe {
  id: number;
  title: string;
  description: string;
  image_url: string;
  likes: number;
  user_nickname: string;
}

const Explore: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExploreRecipes = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/recipes/explore`);
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        setRecipes(data);
      } catch (err) {
        console.error("Explore fetch error:", err);
        alert("Failed to load recipes.");
      }
    };

    fetchExploreRecipes();
  }, []);

  return (
    <div className="top-class explore-page">
      <h1>Explore User's Recipes</h1>
      {recipes.length === 0 ? (
        <p>No recipes to explore yet.</p>
      ) : (
        <div className="explore-grid">
          {recipes.map((r) => (
            <div key={r.id} className="explore-card" onClick={() => navigate(`/MyRecipe/detail/${r.id}`)}>
              <img src={r.image_url} alt={r.title} className="explore-image" />
              <div className="explore-info">
                <h3>{r.title}</h3>
                <p>{r.description}</p>
                <div className="explore-meta">
                  <span>👤 {r.user_nickname}</span>
                  <span style={{ color: "#e74c3c" }}>♥ {r.likes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;
