import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/Category.css";

const categories = [
  { name: "Rice", image: "/images/rice.jpg", path: "/recipes/rice" },
  { name: "One Dish Meal", image: "/images/oneDish.jpg", path: "/recipes/oneDish" },
  { name: "Soup", image: "/images/soup.jpg", path: "/recipes/soup" },
  { name: "Dessert", image: "/images/dessert.jpg", path: "/recipes/dessert" },
  { name: "Side Dish", image: "/images/sideDish.jpg", path: "/recipes/sideDish" },
];

const Category: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="top-class category-page">
      <h1>Choose a Category</h1>
      <div className="category-grid">
        {categories.map((category, index) => (
          <div
            key={index}
            className="category-block"
            onClick={() => navigate(category.path)}
          >
            <img src={category.image} alt={category.name} className="category-image" />
            <p className="category-name">{category.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Category;