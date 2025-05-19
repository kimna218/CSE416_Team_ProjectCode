import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../css/Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState<string | null>(null); 

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    setLoading(true);
    setError(null);

    try {
      const result = await signInWithPopup(auth, provider);
      console.log("Login successful:", result.user);
      navigate("/profile");
    } catch (err: any) {
      console.error("Login failed:", err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1 className="app-title">🍳 Smart AI Recipes</h1>
        <p className="login-message">You need to login to continue!</p>

        <button className="google-login-button" onClick={handleGoogleLogin} disabled={loading}>
            {loading ? "Signing in..." : "🔐 Sign in with Google"}
        </button>

        {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
      </div>
    </div>
  );
};

export default Login;
