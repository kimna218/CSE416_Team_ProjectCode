import React from 'react';
import AppNavbar from './components/Navbar';
import Home from './pages/Home';
import Feed from './pages/Feed';
import Category from './pages/Category';
import SearchResult from './pages/SearchResult';
import Profile from './pages/Profile';
import RecipeList from './components/RecipeList';
import RecipeDetails from "./pages/RecipeDetails";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';


const App: React.FC = () => {
  return (
    <Router>
      <AppNavbar />
      <main className="container mt-5">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/category" element={<Category />} />
          <Route path="/recipes/:category" element={<RecipeList />} />
          <Route path="/search-result" element={<SearchResult />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/recipes/detail/:recipeName" element={<RecipeDetails />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;
