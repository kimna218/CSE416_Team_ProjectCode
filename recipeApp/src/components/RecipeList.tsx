import React, { useEffect, useState } from "react";
import { useParams,useNavigate } from "react-router-dom";
import "../css/RecipeList.css";

interface Recipe {
  id: number;
  name: string;
  category: string;
  image_url: string;
}

const RecipeList: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  //흠.. 한국어로 되어있어서..일단은 예시로 바꿨어
  const categoryMap: Record<string, string> = {
    rice: "밥",
    oneDish: "일품",
    soup: "국&찌개",
    dessert: "후식",
    sideDish: "반찬",
  };
  const korCategory = categoryMap[category || ""] || category;
  // console.log(" korCategory :", korCategory);

  const categoryRecipes = recipes.filter(
    (recipe) => recipe.category === korCategory
  );

  const handleClick = (recipe: Recipe) => {
    const path = `/recipes/detail/${encodeURIComponent(recipe.name)}`;
    navigate(path);
  };

  return (
    <div className="recipe-list-page">
      <h1>{category?.toUpperCase()} Recipes</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="recipe-grid">
          {categoryRecipes.map((recipe) => (
            <div key={recipe.id} className="recipe-card" onClick={() => handleClick(recipe)}>
              <img src={recipe.image_url} alt={recipe.name} className="recipe-image" />
              <p className="recipe-name">{recipe.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
};



export default RecipeList;
