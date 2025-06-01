import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../css/Login.css"; 

const UserSetupPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { uid, email } = location.state || {};

  const [nickname, setNickname] = useState("");
  const [likedInput, setLikedInput] = useState("");
  const [dislikedInput, setDislikedInput] = useState("");
  const [likedList, setLikedList] = useState<string[]>([]);
  const [dislikedList, setDislikedList] = useState<string[]>([]);

  if (!uid || !email) return <p>Invalid access</p>;

  const addItem = (
    input: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    reset: () => void
  ) => {
    if (input && !list.includes(input)) {
      setter([...list, input]);
      reset();
    }
  };

  const handleSubmit = async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebase_uid: uid,
        email,
        nickname,
        liked_ingredients: likedList,
        disliked_ingredients: dislikedList,
        favorite_recipes: [],
      }),
    });

    navigate("/");
  };

  const handleRemoveDisliked = (item: string) => {
    setDislikedList(dislikedList.filter((i) => i !== item));
  };

  const handleRemoveLiked = (item: string) => {
    setLikedList(likedList.filter((i) => i !== item));
  };


  return (
    <div className="top-class user-setup-page">
      <div className="setup-box">
        <h2>👋 Welcome! Tell us about you</h2>

        <label>Nickname:</label>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />

        <label>Liked Ingredients:</label>
        <div className="tag-list">
          {likedList.map((item, i) => (
            <div key={i} className="tag" onClick={() => handleRemoveLiked(item)}>
              {item}
            </div>
          ))}
        </div>
        <div className="input-row">
          <input
            value={likedInput}
            onChange={(e) => setLikedInput(e.target.value)}
            onKeyUp={(e) => { if (e.key === "Enter") { 
              e.preventDefault();
              addItem(likedInput, likedList, setLikedList, () => setLikedInput(""));}}}
          />
          <button className="add-button" onClick={() => addItem(likedInput, likedList, setLikedList, () => setLikedInput(""))}>
            + Add
          </button>
        </div>

        <label>Disliked Ingredients:</label>
        <div className="tag-list disliked">
          {dislikedList.map((item, i) => (
            <div key={i} className="tag" onClick={() => handleRemoveDisliked(item)}>
              {item}
            </div>
          ))}
        </div>
        <div className="input-row">
          <input value={dislikedInput} 
            onChange={(e) => setDislikedInput(e.target.value)} 
            onKeyUp={(e) => { if (e.key === "Enter") {
              e.preventDefault();
              addItem(dislikedInput, dislikedList, setDislikedList, () => setDislikedInput(""));}}}
          />
          <button className="add-button" onClick={() => addItem(dislikedInput, dislikedList, setDislikedList, () => setDislikedInput(""))}>
            + Add
          </button>
        </div>

        <p style={{ marginTop: "16px", color: "#777" }}>
          You can edit your preferences later!
        </p>

        <div className="button-group">
          <button onClick={handleSubmit} className="save-profile-button">Save Profile</button>
        </div>
      </div>
    </div>
  );
};

export default UserSetupPage;
