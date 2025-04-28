import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../css/RecipeDetails.css";

interface Recipe {
  id: number;
  name: string;
  category: string;
  image_url: string;
}

const RecipeDetails: React.FC = () => {
    const [activeTab, setActiveTab] = useState<"instructions" | "ingredients">("instructions");

//   나중에 openAPI에서 가져와야댐..
//   const [manual, setManual] = useState<ManualStep[]>([]);
//   const [loading, setLoading] = useState(true);

    const { recipeName } = useParams();
    const [recipe, setRecipe] = useState<Recipe | null>(null);

    useEffect(() => {
        const fetchRecipe = async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/recipes/detail/${recipeName}`);
            const data = await res.json();
            setRecipe(data);
        };
        window.scrollTo(0, 0);
    fetchRecipe();
    }, [recipeName]);

    const [rating, setRating] = useState(0);        
    const [hoverRating, setHoverRating] = useState(0); 
    const [isFavorited, setIsFavorited] = useState(false);
    const [feedback, setFeedback] = useState("");


    // 예시 데이터
    const ingredients = [
        "ingredient 1",
        "ingredient 2",
        "ingredient 3",
        "ingredient 4"
    ];

    const instructions = [
        "...",
        "...",
        "...",
        "..."
    ];

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
                    onClick={() => setIsFavorited(!isFavorited)}
                    >
                    {isFavorited ? "♥" : "♥"}
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
                            <td>0 kcal</td>
                        </tr>
                        <tr>
                            <td>Carbohydrate</td>
                            <td>0 g</td>
                        </tr>
                        <tr>
                            <td>Protein</td>
                            <td>0 g</td>
                        </tr>
                        <tr>
                            <td>Fat</td>
                            <td>0 g</td>
                        </tr>
                        <tr>
                            <td>Sodium</td>
                            <td>0 mg</td>
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
                    {activeTab === "instructions" ? (
                    <ul>
                        {instructions.map((step, i) => (
                        <li key={i}><strong>Step {i + 1}:</strong> {step}</li>
                        ))}
                    </ul>
                    ) : (
                    <ul>
                        {ingredients.map((item, i) => (
                        <li key={i}>• {item}</li>
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
