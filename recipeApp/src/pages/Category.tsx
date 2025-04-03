import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/Category.css";

const categories = [
  { name: "Meal", image: "/images/breakfast.jpg", path: "/recipes/Meal" },
  { name: "One Dish Meal", image: "/images/lunch.jpg", path: "/recipes/OneDish" },
  { name: "Soup", image: "/images/dinner.jpg", path: "/recipes/Soup" },
  { name: "Dessert", image: "/images/dessert.jpg", path: "/recipes/dessert" },
  { name: "Side Dish", image: "/images/snacks.jpg", path: "/recipes/SideDish" },
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