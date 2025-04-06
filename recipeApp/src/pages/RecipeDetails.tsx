import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../css/RecipeDetails.css";

interface ManualStep {
  text: string;
  image?: string;
}

const RecipeDetails: React.FC = () => {
  const { recipeName } = useParams<{ recipeName: string }>();
  const [activeTab, setActiveTab] = useState<"instructions" | "ingredients">("instructions");
  const [manual, setManual] = useState<ManualStep[]>([]);
  const [loading, setLoading] = useState(true);

  

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
          <img src="/images/default-image.jpg" className="recipe-detail-image" alt="요리 이미지" />
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
    </div>
  );
};

export default RecipeDetails;
