import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/Category.css";

const categories = [
  { name: "Breakfast", image: "/images/breakfast.jpg", path: "/recipes/breakfast" },
  { name: "Lunch", image: "/images/lunch.jpg", path: "/recipes/lunch" },
  { name: "Dinner", image: "/images/dinner.jpg", path: "/recipes/dinner" },
  { name: "Dessert", image: "/images/dessert.jpg", path: "/recipes/dessert" },
  { name: "Snacks", image: "/images/snacks.jpg", path: "/recipes/snacks" },
];

const Category: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="category-page">
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