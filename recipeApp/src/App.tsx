import React, { useEffect } from "react";
import AppNavbar from './components/Navbar';
import Home from './pages/Home';
import Feed from './pages/Feed';
import Category from './pages/Category';
import SearchResult from './pages/SearchResult';
import Profile from './pages/Profile';
import RecipeList from './components/RecipeList';
import RecipeDetails from "./pages/RecipeDetails";
import Login from "./pages/Login";
import ProtectedRoute from './components/ProtectedRoute'; 
import UserSetupPage from './components/UserSetupPage';
import MyRecipe from "./pages/MyRecipe";
import MyRecipeDetails from "./pages/MyRecipeDetails";
import UploadRecipe from "./components/UploadRecipe";
import Explore from "./pages/Explore";

import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { getAuth } from "firebase/auth";

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {

        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/users/${firebaseUser.uid}`);
          const data = await res.json();

          if (!data.exists && location.pathname !== "/setup") {
            navigate("/setup", {
              state: {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
              },
            });
          }
        } catch (err) {
          console.error("Error checking user:", err);
        }
      }
    });

    return () => unsubscribe();
  }, [location.pathname, navigate]);

  return (
    <main className="container mt-5">
      <Routes>
        <Route path="/setup" element={<UserSetupPage />} />
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          }
        />
        <Route path="/category" element={<Category />} />
        <Route path="/recipes/:category" element={<RecipeList />} />
        <Route path="/search-result" element={<SearchResult />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/recipes/detail/:recipeName" element={<RecipeDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/MyRecipe" 
          element={
            <ProtectedRoute>
              <MyRecipe />
            </ProtectedRoute>
          }
        />
        <Route path="/MyRecipe/UploadRecipe" element={<UploadRecipe />} />
        <Route path="/MyRecipe/detail/:id" element={<MyRecipeDetails />} />
        <Route path="/Explore" element={<Explore />} />
      </Routes>
    </main>
  );
};

const AppWrapper: React.FC = () => (
  <Router>
    <AppNavbar />
    <App />
  </Router>
);

export default AppWrapper;
