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

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackList, setFeedbackList] = useState<
    { user_id: string; nickname: string; rating: number; feedback: string; rated_at: string }[]
  >([]);
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);

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

        const feedbackRes = await fetch(`${import.meta.env.VITE_API_URL}/recipes/${data.id}/feedbacks`);
        const feedbackData = await feedbackRes.json();
        setFeedbackList(feedbackData);
      }

      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/users/${currentUser.uid}`);
          const data = await res.json();
          const favorites = JSON.parse(data.user.favorite_recipes || "[]");
          setIsFavorited(favorites.includes(recipeName));
        } catch (err) {
          console.error("Failed to fetch favorite_recipes:", err);
        }
      }
    };

    window.scrollTo(0, 0);
    fetchRecipe();
  }, [recipeName]);

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (recipe?.id && currentUser) {
      fetch(`${import.meta.env.VITE_API_URL}/recipes/${recipe.id}/rate/${currentUser.uid}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.rating) setRating(data.rating);
          if (data.feedback) {
            setFeedback(data.feedback);
            setHasSubmittedFeedback(true);
          }
        })
        .catch((err) => console.error("Failed to fetch rating:", err));
    }
  }, [recipe]);

  const handleFeedbackSubmit = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) return alert("You need to login for feedback");
    if (rating === 0) return alert("Please rate the recipe.");

    try {
      const userRes = await fetch(`${import.meta.env.VITE_API_URL}/users/${currentUser.uid}`);
      const userData = await userRes.json();
      const nickname = userData?.user?.nickname;
      if (!nickname) return alert("닉네임을 불러올 수 없습니다.");

      await fetch(`${import.meta.env.VITE_API_URL}/recipes/${recipe?.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.uid,
          nickname,
          rating,
          feedback,
        }),
      });

      alert("Thanks for your feedback!");
      setIsEditingFeedback(false);
      setHasSubmittedFeedback(true);

      const updatedFeedbacks = await fetch(`${import.meta.env.VITE_API_URL}/recipes/${recipe?.id}/feedbacks`);
      setFeedbackList(await updatedFeedbacks.json());
    } catch (err) {
      console.error("Feedback submission error:", err);
      alert("Failed to submit. Please try again.");
    }
  };

  const handleShare = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => alert("Link has been copied!"))
      .catch((err) => console.error("Failed to share:", err));
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
              if (!currentUser) return alert("로그인이 필요합니다.");
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
            <img src={recipe.image_url} className="recipe-detail-image" alt={recipe.name} />
          )}
        </div>

        <div className="nutrition-box">
          <h4>Nutrition Info</h4>
          <table className="nutrition-table">
            <tbody>
              <tr><td>Calory</td><td>{nutrition?.calories ?? 0} kcal</td></tr>
              <tr><td>Carbohydrate</td><td>{nutrition?.carbohydrates ?? 0} g</td></tr>
              <tr><td>Protein</td><td>{nutrition?.protein ?? 0} g</td></tr>
              <tr><td>Fat</td><td>{nutrition?.fat ?? 0} g</td></tr>
              <tr><td>Sodium</td><td>{nutrition?.sodium ?? 0} mg</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="recipe-info-box">
        <div className="tab-buttons">
          <button className={activeTab === "instructions" ? "active" : ""} onClick={() => setActiveTab("instructions")}>Instructions</button>
          <button className={activeTab === "ingredients" ? "active" : ""} onClick={() => setActiveTab("ingredients")}>Ingredients</button>
        </div>
        <div className="tab-content">
          {activeTab === "ingredients" ? (
            <div style={{ whiteSpace: "pre-wrap" }}>{recipe?.ingredients}</div>
          ) : (
            <ul>{instructions.map((step) => (
              <li key={step.step_number}><strong>Step {step.step_number}:</strong> {step.description}</li>
            ))}</ul>
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
          <label htmlFor="feedback">Your Feedback:</label>

          {!hasSubmittedFeedback ? (
            <>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what you think about the recipe..."
                rows={4}
                cols={50}
              />
              <button onClick={handleFeedbackSubmit}>Submit Feedback</button>
            </>
          ) : isEditingFeedback ? (
            <>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                cols={50}
              />
              <button onClick={handleFeedbackSubmit}>Update Feedback</button>
              <button onClick={() => setIsEditingFeedback(false)}>Cancel</button>
            </>
          ) : (
            <>
              <p style={{ whiteSpace: 'pre-wrap', marginBottom: '8px' }}>{feedback}</p>
              <button onClick={() => setIsEditingFeedback(true)}>Edit</button>
            </>
          )}
        </div>

        <div className="all-feedbacks">
          <h4>All Reviews</h4>
          {feedbackList.length === 0 ? (
            <p>No reviews yet.</p>
          ) : (
            feedbackList.map((item, idx) => (
              <div key={idx} className="feedback-item">
                <p><strong>⭐ {item.rating}</strong> by {item.nickname}</p>
                <p>{item.feedback}</p>
                <p style={{ fontSize: "0.8em", color: "#888" }}>{new Date(item.rated_at).toLocaleString()}</p>
                <hr />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeDetails;
