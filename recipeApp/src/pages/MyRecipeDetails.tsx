import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAuth } from "firebase/auth";
import "../css/RecipeDetails.css";

interface Step {
  step_number: number;
  description: string;
}

interface Nutrition {
  calories: number;
  carbohydrates: number;
  protein: number;
  fat: number;
  sodium: number;
}

interface Recipe {
  id: number;
  title: string;
  description: string;
  image_url: string;
  ingredients: string;
  steps: Step[];
  nutrition: Nutrition;
  likes: number;
}

const MyRecipeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [activeTab, setActiveTab] = useState<"instructions" | "ingredients">("instructions");
  const [likes, setLikes] = useState<number>(0);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  useEffect(() => {
    const fetchRecipeAndFavorite = async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("Login required");
        return;
      }
  
      try {
        // ✅ 1. 레시피 정보 가져오기
        const res = await fetch(`${import.meta.env.VITE_API_URL}/recipes/my/${id}?firebase_uid=${currentUser.uid}`);
        const recipeData = await res.json();
        setRecipe(recipeData);
        setLikes(recipeData.likes || 0);
  
        const userRes = await fetch(`${import.meta.env.VITE_API_URL}/users/${currentUser.uid}`);
        const userData = await userRes.json();
  
        const rawFavorites = userData.user.favorite_user_recipes; // "3,1"
        const favorites = typeof rawFavorites === "string" ? rawFavorites.split(",").map(s => s.trim()) : [];
  
        setIsFavorited(favorites.includes(String(recipeData.id)));
        
      } catch (err) {
        console.error("Failed to load recipe or favorite state:", err);
        alert("Error loading recipe");
      }
    };
  
    fetchRecipeAndFavorite();
    window.scrollTo(0, 0);
  }, [id]);  
  

  const handleFavoriteToggle = async () => {
    const user = getAuth().currentUser;
    if (!user || !recipe) return alert("Please login first.");

    const newState = !isFavorited;
    setIsFavorited(newState);
    setLikes((prev) => newState ? prev + 1 : Math.max(prev - 1, 0));

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/users/${user.uid}/favorite-user-recipes`, {
        method: newState ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipe.id }),
      });
    } catch (err) {
      console.error("즐겨찾기 업데이트 실패:", err);
    }
  };

  if (!recipe) return <p>Recipe not found</p>;

  return (
    <div className="top-class recipe-detail-page">
      <div className="recipe-title-box">
        <h2 className="recipe-title">
          {recipe.title}
          <span
            className={`heart-icon ${isFavorited ? "favorited" : ""}`}
            onClick={handleFavoriteToggle}
            style={{
              cursor: "pointer",
              marginLeft: "12px",
              fontSize: "1.2em",
              userSelect: "none",
            }}
          >
            {isFavorited ? "♥" : "♡"} {likes}
          </span>
        </h2>
      </div>

      <div className="recipe-image-nutrition-content">
        <div className="recipe-image-box">
          <img src={recipe.image_url} className="recipe-detail-image" alt={recipe.title} />
        </div>

        <div className="nutrition-box">
          <h4>Nutrition Info</h4>
          <table className="nutrition-table">
            <tbody>
              <tr><td>Calories</td><td>{recipe.nutrition.calories} kcal</td></tr>
              <tr><td>Carbohydrates</td><td>{recipe.nutrition.carbohydrates} g</td></tr>
              <tr><td>Protein</td><td>{recipe.nutrition.protein} g</td></tr>
              <tr><td>Fat</td><td>{recipe.nutrition.fat} g</td></tr>
              <tr><td>Sodium</td><td>{recipe.nutrition.sodium} mg</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="recipe-info-box">
        <div className="tab-buttons">
          <button className={activeTab === "instructions" ? "active" : ""} onClick={() => setActiveTab("instructions")}>
            Instructions
          </button>
          <button className={activeTab === "ingredients" ? "active" : ""} onClick={() => setActiveTab("ingredients")}>
            Ingredients
          </button>
        </div>
        <div className="tab-content">
          {activeTab === "ingredients" ? (
            <div style={{ whiteSpace: "pre-wrap" }}>{recipe.ingredients}</div>
          ) : (
            <ul>
              {recipe.steps.map((step) => (
                <li key={step.step_number}>
                  <strong>Step {step.step_number}:</strong> {step.description}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyRecipeDetails;
