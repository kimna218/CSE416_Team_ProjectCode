import "../css/Guideline.css";

const Guideline = ({ onClose }: { onClose: () => void }) => {

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>✖</button>

        <div className="welcome-guide">
          <div className="welcome-box">
            <h1 className="welcome-title">👋 Welcome to Smart AI Recipes!</h1>

            <p className="welcome-description">
              Whether you're not sure what to cook or just want to try something new,
              <strong> Smart AI Recipes </strong> helps you find the perfect recipe.
            </p>

            <div className="guide-section">
              <h2>🍳 How It Works</h2>
              <ul>
                <li><strong>Search by Ingredients & Name</strong><br />
                  Just type in what’s in your fridge (e.g., "egg, cheese, tomato") and we’ll suggest recipes you can make right away.</li>
                <li><strong>Personalized Suggestions</strong><br />
                  Log in with your Google account to get recipe recommendations tailored to your preferences.</li>
                <li><strong>Step-by-Step Instructions</strong><br />
                  Each recipe comes with clear steps, photos, and nutrition information to make cooking easy — even for beginners!</li>
                <li><strong>Create & Explore Recipes</strong><br />
                    You can upload your own recipes and also explore what others have shared.</li>
              </ul>
            </div>

            <div className="guide-section">
              <h2> More Features!</h2>
              <ul>
                <li>Smart filters for dietary needs (e.g., vegetarian, low sodium)</li>
                <li>“Favorite” recipes and access them anytime in <strong>My Page</strong></li>
                <li>Community ratings and feedback on original recipe (not for user-uploaded ones).</li>
                <li>You can also share what you've cooked and eaten on the <strong>Feed</strong> page — post photos, captions, and see others' cooking stories!</li>
              </ul>
            </div>

            <div className="button-group">
              <p style={{ marginTop: "20px" }}>
                🧑‍🍳 Ready to start cooking? <br />
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guideline;
