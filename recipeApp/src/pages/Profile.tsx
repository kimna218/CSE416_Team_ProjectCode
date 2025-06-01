import { useEffect, useState } from "react";
import "../css/Profile.css";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

interface Recipe {
  id: number;
  name: string;
  category: string;
  image_url: string;
  ingredients: string;
}

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [dislikedInput, setDislikedInput] = useState("");
  const [likedInput, setLikedInput] = useState("");
  const [dislikedList, setDislikedList] = useState<string[]>([]);
  const [likedList, setLikedList] = useState<string[]>([]);
  const [initialDisliked, setInitialDisliked] = useState<string[]>([]);
  const [initialLiked, setInitialLiked] = useState<string[]>([]);
  const [favoriteRecipesData, setFavoriteRecipesData] = useState<Recipe[]>([]);
  const [favoriteUserRecipesData, setFavoriteUserRecipesData] = useState<Recipe[]>([]);

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const fetchUserInfo = async () => {
      if (currentUser) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/users/${currentUser.uid}`);
          const data = await res.json();
          const userData = data.user;

          const recipeNames = JSON.parse(userData.favorite_recipes || "[]");
          const rawIds = userData.favorite_user_recipes || "";
          const userRecipeIds = rawIds.split(",").map((id: string) => id.trim()).filter(Boolean);
          
          setUser({
            name: userData.nickname || currentUser.displayName,
            email: userData.email || "",
            profileImage: currentUser.photoURL || "/images/default-profile.jpg",
            favoriteRecipes: recipeNames,
            favoriteUserRecipeIds: userRecipeIds,
          });
          

          const liked = JSON.parse(userData.liked_ingredients || "[]");
          const disliked = JSON.parse(userData.disliked_ingredients || "[]");

          setLikedList(liked);
          setDislikedList(disliked);
          setInitialLiked(liked);
          setInitialDisliked(disliked);

          const fetchedRecipes = await Promise.all(
            recipeNames.map(async (name: string) => {
              const res = await fetch(`${import.meta.env.VITE_API_URL}/recipes/detail/${encodeURIComponent(name)}`);
              return await res.json();
            })
          );
          setFavoriteRecipesData(fetchedRecipes);

          const fetchedUserRecipes = await Promise.all(
            userRecipeIds.map(async (id: string) => {
              const res = await fetch(`${import.meta.env.VITE_API_URL}/recipes/my/${id}?firebase_uid=${currentUser.uid}`);
              return await res.json();
            })
          );
          setFavoriteUserRecipesData(fetchedUserRecipes);

        } catch (err) {
          console.error("Failed to fetch user info:", err);
        }
      }
    };

    fetchUserInfo();
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

  const handleRemoveDisliked = (item: string) => {
    setDislikedList(dislikedList.filter(i => i !== item));
  };

  const handleRemoveLiked = (item: string) => {
    setLikedList(likedList.filter(i => i !== item));
  };

  const handleSave = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      await fetch(`${import.meta.env.VITE_API_URL}/users/${currentUser.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liked_ingredients: likedList,
          disliked_ingredients: dislikedList,
        }),
      });

      setInitialLiked(likedList);
      setInitialDisliked(dislikedList);
      setIsEditing(false);
      alert("Preferences saved!");
    } catch (err) {
      console.error("Failed to update preferences:", err);
      alert("Failed to save preferences.");
    }
  };

  const handleCancel = () => {
    setLikedList(initialLiked);
    setDislikedList(initialDisliked);
    setLikedInput("");
    setDislikedInput("");
    setIsEditing(false);
  };

  const handleClick = (recipe: Recipe) => {
    const path = `/recipes/detail/${encodeURIComponent(recipe.name)}`;
    navigate(path);
  };

  if (!user) return <p>Loading profile...</p>;

  return (
    <div className="top-class profile-page">
      <div className="profile-header">
        <img src={user.profileImage} alt={`${user.name}'s profile`} className="profile-image" />
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
            favoriteRecipesData.map((recipe) => (
              <div key={recipe.id} className="profile-recipe-card" onClick={() => handleClick(recipe)}>
                <img src={recipe.image_url} alt={recipe.name} className="recipe-image" />
                <p className="recipe-name">{recipe.name}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="profile-section">
        <h2>Favorite User's Recipes</h2>
        <div className="favorite-recipes">
          {user.favoriteUserRecipeIds.length === 0 ? (
            <p>No favorite user recipes yet.</p>
          ) : (
            favoriteUserRecipesData.map((recipe) => (
              <div key={recipe.id} className="profile-recipe-card" onClick={() => navigate(`/MyRecipe/detail/${recipe.id}`)}>
                <img src={recipe.image_url} alt={recipe.name} className="recipe-image" />
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
            <div style={{ marginTop: "10px" }}>
              <label><strong>Liked Ingredients:</strong></label><br />
              <div className="tag-list">
                {likedList.map((item, i) => (
                  <div key={i} className="tag" onClick={() => handleRemoveLiked(item)}>{item}</div>
                ))}
              </div>
              <div style={{ marginTop: 5 }}>
                <input
                  value={likedInput}
                  onChange={(e) => setLikedInput(e.target.value)}
                  placeholder="Add ingredient"
                  onKeyUp={(e) => { if (e.key === "Enter") handleAddLike(); }}
                />
                <button onClick={handleAddLike}>+ Add</button>
              </div>
            </div>

            <div style={{ marginTop: "10px" }}>
              <label><strong>Disliked Ingredients:</strong></label><br />
              <div className="tag-list disliked">
                {dislikedList.map((item, i) => (
                  <div key={i} className="tag" onClick={() => handleRemoveDisliked(item)}>{item}</div>
                ))}
              </div>
              <div style={{ marginTop: 5 }}>
                <input
                  value={dislikedInput}
                  onChange={(e) => setDislikedInput(e.target.value)}
                  placeholder="Add ingredient"
                  onKeyUp={(e) => { if (e.key === "Enter") handleAddDislike(); }}
                />
                <button onClick={handleAddDislike}>+ Add</button>
              </div>
            </div>

            <div style={{ marginTop: "10px" }}>
              <button onClick={handleSave} className="save-btn">Save</button>
              <button onClick={handleCancel} className="cancel-btn">Cancel</button>
            </div>
          </>
        ) : (
          <>
            <p><strong>Liked Ingredients:</strong> {likedList.join(", ")}</p>
            <p><strong>Disliked Ingredients:</strong> {dislikedList.join(", ")}</p>
            <button className="edit-button" onClick={() => setIsEditing(true)}>Edit Preferences</button>
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;
