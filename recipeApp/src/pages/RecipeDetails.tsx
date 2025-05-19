import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAuth } from "firebase/auth";
import "../css/RecipeDetails.css";

interface Recipe {
  id: number;
  name: string;
  category: string;
  image_url: string;
  ingredients: string;
}

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

const RecipeDetails: React.FC = () => {
    const [activeTab, setActiveTab] = useState<"instructions" | "ingredients">("instructions");
    const { recipeName } = useParams();
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [instructions, setInstructions] = useState<Step[]>([]);
    const [nutrition, setNutrition] = useState<Nutrition | null>(null);
    

useEffect(() => {
  const fetchRecipe = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/recipes/detail/${recipeName}`);
    const data = await res.json();
    setRecipe(data);

    if (data?.id) {
      const stepRes = await fetch(`${import.meta.env.VITE_API_URL}/recipes/detail/${data.id}/steps`);
      const stepData = await stepRes.json();
      setInstructions(stepData);

      const nutRes = await fetch(`${import.meta.env.VITE_API_URL}/recipes/detail/${data.id}/nutrition`);
      const nutData = await nutRes.json();
      setNutrition(nutData);
    }

    // ✅ 즐겨찾기 여부 확인
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/users/${currentUser.uid}`);
        const data = await res.json();
        const favorites = JSON.parse(data.user.favorite_recipes || "[]");

        if (favorites.includes(recipeName)) {
          setIsFavorited(true);
        } else {
          setIsFavorited(false);
        }
      } catch (err) {
        console.error("Failed to fetch favorite_recipes:", err);
      }
    }
  };

  window.scrollTo(0, 0);
  fetchRecipe();
}, [recipeName]);


    const [rating, setRating] = useState(0);        
    const [hoverRating, setHoverRating] = useState(0); 
    const [isFavorited, setIsFavorited] = useState(false);
    const [feedback, setFeedback] = useState("");

        const handleFeedbackSubmit = () => {
            if (feedback.trim() === "") {
                alert("Please write something before submitting!");
                return;
            }

            // user not logged in setup.
            
            console.log("Feedback submitted:", feedback);
            alert("Thanks for your feedback!");
            setFeedback(""); // 초기화
        };

        const handleShare = () => {
            navigator.clipboard.writeText(window.location.href)
                .then(() => {
                alert("Link has been copied!");
                })
                .catch((err) => {
                console.error("Failed to share:", err);
                });
        };


    return (
        <div className="recipe-detail-page">

            <div className="recipe-title-box">
                <h2 className="recipe-title">
                    {recipeName}
                    <span
                    className={`heart-icon ${isFavorited ? "favorited" : ""}`}
                    onClick={async () => {
                        const auth = getAuth();
                        const currentUser = auth.currentUser;

                        if (!currentUser) {alert("로그인이 필요합니다.");return;}

                        // 로그인 상태일 때 → 토글 + DB 업데이트
                        setIsFavorited(!isFavorited);

                        try {
                        await fetch(`${import.meta.env.VITE_API_URL}/users/${currentUser.uid}/favorites`, {
                            method: isFavorited ? "DELETE" : "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ recipeName }),
                        });
                        } catch (err) {
                            console.error("즐겨찾기 업데이트 실패:", err);
                        }
                    }}
                    >
                    {isFavorited ? "♥" : "♡"}
                    </span>
                </h2>

                <button className="share-button" onClick={handleShare}>
                    🔗 Share
                </button>
            </div>
            

            <div className="recipe-image-nutrition-content">
                <div className="recipe-image-box">
                    {recipe && (
                        <img
                        src={recipe.image_url}
                        className="recipe-detail-image"
                        alt={recipe.name}
                        />
                    )}
                </div>

                <div className="nutrition-box">
                    <h4>Nutrition Info</h4>
                    <table className="nutrition-table">
                        <tbody>
                        <tr>
                            <td>Calory</td>
                            <td>{nutrition?.calories ?? 0} kcal</td>
                        </tr>
                        <tr>
                            <td>Carbohydrate</td>
                            <td>{nutrition?.carbohydrates ?? 0} g</td>
                        </tr>
                        <tr>
                            <td>Protein</td>
                            <td>{nutrition?.protein ?? 0} g</td>
                        </tr>
                        <tr>
                            <td>Fat</td>
                            <td>{nutrition?.fat ?? 0} g</td>
                        </tr>
                        <tr>
                            <td>Sodium</td>
                            <td>{nutrition?.sodium ?? 0} mg</td>
                        </tr>
                        </tbody>
                    </table>
                </div>

            </div>

            <div className="recipe-info-box">
                <div className="tab-buttons">
                    <button
                    className={activeTab === "instructions" ? "active" : ""}
                    onClick={() => setActiveTab("instructions")}
                    >
                    Instructions
                    </button>
                    <button
                    className={activeTab === "ingredients" ? "active" : ""}
                    onClick={() => setActiveTab("ingredients")}
                    >
                    Ingredients
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === "ingredients" ? (
                    <div style={{ whiteSpace: "pre-wrap" }}>
                        {recipe?.ingredients}
                    </div>
                    ) : (
                    <ul>
                        {instructions.map((step) => (
                            <li key={step.step_number}><strong>Step {step.step_number}:</strong> {step.description}</li>
                        ))}
                    </ul>
                    )}
                </div>
            </div>
            
            <div className="rating-box">
                <h4>Rate this recipe</h4>
                <div className="stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className={`star ${star <= (hoverRating || rating) ? "filled" : ""}`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        >
                        ★
                    </span>
                    ))}
                </div>
                {rating > 0 && <p>You rated this recipe {rating} out of 5</p>}

                <div className="feedback-box">
                    <label htmlFor="feedback">Leave your feedback:</label>
                    <textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tell us what you think about the recipe..."
                    rows={4}
                    cols={50}
                    />
                    <button onClick={handleFeedbackSubmit}>Submit Feedback</button>
                </div>
            </div>

        </div>
    );
};

export default RecipeDetails;
