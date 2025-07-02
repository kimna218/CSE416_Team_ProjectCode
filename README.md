# CSE416_ProjectCode

## AI Powered Recipe Recommendation Website

## 👥 Contributors

- [@jellyrgb](https://github.com/jellyrgb)
- [@kimna218](https://github.com/kimna218) 

## 🔍 Problem Statement (Updated)

Many individuals, especially those living alone, often struggle with choosing meals due to limited ingredients or lack of ideas. This results in frequent reliance on costly and unhealthy delivery food. Our goal is to provide a smarter alternative through an AI-powered web application.

Our website allows users to input ingredients they currently have and receive personalized recipe suggestions. In addition to search and filtering options, our platform incorporates AI recommendation, user reviews, and social interaction through a feed system to create a more engaging and helpful cooking experience.

## ✨ Key Features

- Recipe Search by Name and Ingredients
- Ingredient-Based Smart Filtering System
- Personalized AI Recipe Recommendations
- Step-by-Step Cooking Instructions
- Google OAuth Secure Login
- Favorite Recipes & Personalized Profile Page
- User Ratings, Likes, Dislikes, and Feedback Submission
- Public Recipe Upload Feature
- User Feed System with Food Posts, Likes, and Comments
- Fully Responsive UI/UX across Devices
- Deployed Frontend, Backend, and Database on Render

## 🚀 Deployment Links

- **Frontend (Render):** [https://recipes-416.onrender.com](https://recipes-416.onrender.com)
- **Backend API (Render):** Hosted on Render – please allow up to 50 seconds for cold start

## 🛠️ Project Setup Instructions (for New Developers)

> The following steps have been verified to work on macOS, Windows 10+, and Ubuntu Linux. Please ensure you have Node.js (v18+), PostgreSQL (v8+), and npm installed.

### 1. 🔽 Clone the Repository

```bash
git clone https://github.com/jellyrgb/CSE416_ProjectCode.git
cd CSE416_ProjectCode
```

### 2. 🗂️ Configure Environment Variables

- Please contact us to get the env files required(For render).
- If you want to test it on your local environments, please follow the steps:

Create a local PostgreSQL database with the following name and Update your .env file with the following configuration:

```bash
VITE_API_URL=http://localhost:5001
DB_USER=postgres
DB_PASSWORD=12345678
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=local_recipes_postgresql
```

### 3. 🚀 Run the Application Locally

```bash
# Backend
cd recipeApp
node server.js

# Frontend
cd recipeApp
npm run dev
```

Visit `http://localhost:5173` in your browser.

## 🧪 Testing Instructions

Please test the following:

- **Recipe search** (by name or ingredients)
- **Filtering by category** (Rice, Soup, Dessert, etc.)
- **View recipe details** with nutrition info and images
- **Favorite a recipe** using the heart icon
- **Post to the feed** and check integration with user account
- **Rate or provide feedback** on recipes
- **Login using Google OAuth**
- **Upload your own recipes** and view them on your profile
- **Delete or like feed posts**
- **Responsiveness** on mobile and desktop

## 📚 API Documentation

All API routes, parameters, and examples are documented in [https://github.com/jellyrgb/CSE416_ProjectCode/wiki](https://github.com/jellyrgb/CSE416_ProjectCode/wiki)

## 🐞 Bug Tracking & Reporting

We are using **GitHub Issues** to manage and track bugs.

### 🔎 How to Check Existing Bugs

1. Visit: [GitHub Repository Issues](https://github.com/jellyrgb/CSE416_ProjectCode/issues)
2. Filter by label: `bug`

### 📝 How to Report a New Bug

1. Go to Issues > New Issue
2. Choose the `Bug report` template
3. Fill in:
   - Clear steps to reproduce
   - Expected vs actual outcome
   - Screenshots or logs (if possible)
   - Your system/browser info

### ✅ Verified Fixes & Bug Assignments

- All serious bugs are assigned to specific developers.
- Fixes are tracked with `bug` and `in-progress` labels.
- Bug fix efforts are scheduled in the final sprint.

## 🗓️ Development Schedule

Trello Board: [https://trello.com/b/1B4X590E/cse416ai-powered-recipes](https://trello.com/b/1B4X590E/cse416ai-powered-recipes)

- Completed features are clearly marked ✅
- Adjustments to timeline (e.g. added recipe upload, removed voice input) are labeled
- Remaining UI polish and testing will be finalized in the final release sprint
