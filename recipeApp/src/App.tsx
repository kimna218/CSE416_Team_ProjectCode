import React from 'react';
import AppNavbar from './components/Navbar';
import Home from './pages/Home';
import Ingredient from './pages/Ingredient';
import Category from './pages/Category';
import SearchResult from './pages/SearchResult';
import Profile from './pages/Profile';
import RecipeList from './components/RecipeList';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <Router>
      <AppNavbar />
      <main className="container mt-5">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/ingredient" element={<Ingredient />} />
          <Route path="/category" element={<Category />} />
          <Route path="/recipes/:category" element={<RecipeList />} />
          <Route path="/search-result" element={<SearchResult />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;
