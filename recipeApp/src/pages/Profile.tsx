import { useState } from "react";
import "../css/Profile.css";

function Profile() {
  const [user] = useState({
    name: "John Doe",
    email: "johndoe@example.com",
    profileImage: "/images/default-profile.jpg",
    favoriteRecipes: [
      { name: "Pancakes", image: "/images/pancakes.jpg" },
      { name: "Grilled Chicken", image: "/images/grilled-chicken.jpg" },
    ],
    preferences: {
      dietary: "Vegetarian",
      dislikedIngredients: ["onions", "garlic"],
    },
  });

  const handleEditPreferences = () => {
    alert("Edit preferences functionality coming soon!");
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <img
          src={user.profileImage}
          alt={`${user.name}'s profile`}
          className="profile-image"
        />
        <h1>{user.name}</h1>
        <p>{user.email}</p>
      </div>

      <div className="profile-section">
        <h2>Favorite Recipes</h2>
        <div className="favorite-recipes">
          {user.favoriteRecipes.map((recipe, index) => (
            <div key={index} className="recipe-card">
              <img src={recipe.image} alt={recipe.name} className="recipe-image" />
              <p className="recipe-name">{recipe.name}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="profile-section">
        <h2>Preferences</h2>
        <p><strong>Dietary Preference:</strong> {user.preferences.dietary}</p>
        <p>
          <strong>Disliked Ingredients:</strong>{" "}
          {user.preferences.dislikedIngredients.join(", ")}
        </p>
        <button className="edit-button" onClick={handleEditPreferences}>
          Edit Preferences
        </button>
      </div>
    </div>
  );
}

export default Profile;