import React, { useEffect, useState } from "react";
import { useParams,useNavigate } from "react-router-dom";
import "../css/RecipeList.css";
import { getCurrentLang } from "../components/language";

interface Recipe {
  id: number;
  name: string;
  en_name: string;
  category: string;
  image_url: string;
}

const RecipeList: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const lang = getCurrentLang();

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/recipes`);
        const data = await res.json();
        setRecipes(data);
      } catch (err) {
        console.error("Error to fetch recipe:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  const categoryMap: Record<string, string> = {
    rice: "밥",
    oneDish: "일품",
    soup: "국&찌개",
    dessert: "후식",
    sideDish: "반찬",
  };
  const korCategory = categoryMap[category || ""] || category;

  const categoryRecipes = recipes.filter(
    (recipe) => recipe.category === korCategory
  );

  const handleClick = (recipe: Recipe) => {
    const path = `/recipes/detail/${encodeURIComponent(recipe.name)}`;
    navigate(path);
  };

  return (
    <div className="top-class recipe-list-page">
      <h1>{category?.toUpperCase()} Recipes</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="recipe-grid">
          {categoryRecipes.map((recipe) => (
            <div key={recipe.id} className="list-recipe-card" onClick={() => handleClick(recipe)}>
              <img src={recipe.image_url} alt={recipe.name} className="list-recipe-image" />
              <p className="list-recipe-name">{lang === "en" ? recipe.en_name || recipe.name : recipe.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
};



export default RecipeList;
