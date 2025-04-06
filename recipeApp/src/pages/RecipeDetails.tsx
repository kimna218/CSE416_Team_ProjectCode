import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../css/RecipeDetails.css";

// interface ManualStep {
//   text: string;
//   image?: string;
// }

const RecipeDetails: React.FC = () => {
  const { recipeName } = useParams<{ recipeName: string }>();
  const [activeTab, setActiveTab] = useState<"instructions" | "ingredients">("instructions");

//   나중에 openAPI에서 가져와야댐..
//   const [manual, setManual] = useState<ManualStep[]>([]);
//   const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);        
  const [hoverRating, setHoverRating] = useState(0); 

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

  return (
    <div className="recipe-detail-page">
      <h2>{recipeName}</h2>
        <div className="recipe-content">
            <div className="recipe-image-box">
                <img src="/images/default-image.jpg" className="recipe-detail-image" alt="reci image" />
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
        </div>

    </div>
  );
};

export default RecipeDetails;
