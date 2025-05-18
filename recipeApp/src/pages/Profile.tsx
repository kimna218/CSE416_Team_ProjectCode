import { useEffect, useState } from "react";
import "../css/Profile.css";
import { getAuth, signOut, User } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  const [preferences, setPreferences] = useState({
    dietary: "Vegetarian",
    dislikedIngredients: ["onions", "garlic"],
    likedIngredients: ["onions", "garlic"],
  });

  const [isEditing, setIsEditing] = useState(false);
  const [dietaryInput, setDietaryInput] = useState(preferences.dietary);
  const [dislikedInput, setDislikedInput] = useState("");
  const [dislikedList, setDislikedList] = useState(preferences.dislikedIngredients);
  const [likedList, setLikedList] = useState(preferences.likedIngredients);
  const [likedInput, setLikedInput] = useState("");

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser({
        name: currentUser.displayName || "Anonymous",
        email: currentUser.email || "",
        profileImage: currentUser.photoURL || "/images/default-profile.jpg",
        favoriteRecipes: [], // TODO: 백엔드 연동 시 불러오기
      });
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      alert("Successfully Logged Out.");
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
      alert("Failed to logout. Please try again.");
    }
  };

  const handleAddDislike = () => {
    if (dislikedInput && !dislikedList.includes(dislikedInput)) {
      setDislikedList([...dislikedList, dislikedInput]);
      setDislikedInput("");
    }
  };

  const handleAddLike = () => {
    if (likedInput && !likedList.includes(likedInput)) {
      setLikedList([...likedList, likedInput]);
      setLikedInput("");
    }
  };

  const handleRemoveDislike = (item: string) => {
    setDislikedList(dislikedList.filter(i => i !== item));
  };

  const handleRemoveLike = (item: string) => {
    setLikedList(likedList.filter(i => i !== item));
  };

  const handleSave = () => {
    setPreferences({
      dietary: dietaryInput,
      dislikedIngredients: dislikedList,
      likedIngredients: likedList,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDietaryInput(preferences.dietary);
    setDislikedList(preferences.dislikedIngredients);
    setLikedList(preferences.likedIngredients);
    setDislikedInput("");
    setLikedInput("");
    setIsEditing(false);
  };

  if (!user) return <p>Loading profile...</p>;

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
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>

      <div className="profile-section">
        <h2>Favorite Recipes</h2>
        <div className="favorite-recipes">
          {user.favoriteRecipes.length === 0 ? (
            <p>No favorite recipes yet.</p>
          ) : (
            user.favoriteRecipes.map((recipe: any, index: number) => (
              <div key={index} className="recipe-card">
                <img src={recipe.image} alt={recipe.name} className="recipe-image" />
                <p className="recipe-name">{recipe.name}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="profile-section">
        <h2>Preferences</h2>

        {isEditing ? (
          <>
            <div>
              <label><strong>Dietary Preference:</strong></label><br />
              <input
                value={dietaryInput}
                onChange={(e) => setDietaryInput(e.target.value)}
              />
            </div>

            <div style={{ marginTop: "10px" }}>
              <label><strong>Disliked Ingredients:</strong></label><br />
              {dislikedList.map((item, idx) => (
                <span key={idx} className="tag">
                  {item}
                  <button onClick={() => handleRemoveDislike(item)} style={{ marginLeft: 5 }}>x</button>
                </span>
              ))}

              <div style={{ marginTop: 5 }}>
                <input
                  value={dislikedInput}
                  onChange={(e) => setDislikedInput(e.target.value)}
                  placeholder="Add ingredient"
                />
                <button onClick={handleAddDislike}>+ Add</button>
              </div>
            </div>

            <div style={{ marginTop: "10px" }}>
              <label><strong>Liked Ingredients:</strong></label><br />
              {likedList.map((item, idx) => (
                <span key={idx} className="tag">
                  {item}
                  <button onClick={() => handleRemoveLike(item)} style={{ marginLeft: 5 }}>x</button>
                </span>
              ))}

              <div style={{ marginTop: 5 }}>
                <input
                  value={likedInput}
                  onChange={(e) => setLikedInput(e.target.value)}
                  placeholder="Add ingredient"
                />
                <button onClick={handleAddLike}>+ Add</button>
              </div>
            </div>

            <div style={{ marginTop: "10px" }}>
              <button onClick={handleSave} className="save-btn">Save</button>
              <button onClick={handleCancel} className="cancel-btn">Cancel</button>
            </div>
          </>
        ) : (
          <>
            <p><strong>Dietary Preference:</strong> {preferences.dietary}</p>
            <p><strong>Disliked Ingredients:</strong> {preferences.dislikedIngredients.join(", ")}</p>
            <p><strong>Liked Ingredients:</strong> {preferences.likedIngredients.join(", ")}</p>
            <button className="edit-button" onClick={() => setIsEditing(true)}>Edit Preferences</button>
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;
