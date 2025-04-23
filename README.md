# CSE416_ProjectCode

## Smart AI-Recipes

### Team members:

Hyomin Kim(114744241), Nahyun Kim(115242403)

### Problem Statement:

Many people who live alone often want to cook but struggle with menu choices, a lack of ingredients, and insufficient recipes. Due to this reason, they rely on expensive and unhealthy delivery food.

To address this issue, we are developing an AI web application that provides recipes and suggests meals based on the ingredients currently available in the user's fridge. Users can input their available ingredients, and the AI will analyze recipes to recommend suitable recipes. The provided recipes include step-by-step instructions and cooking times, making them easy to follow for anyone.

### Key Features:

**_Recipe Search:_** Users input a dish, and the system provides matching recipes.  
**_Ingredient-Based Recipe Search:_** Users input the ingredients they have, and the system suggests suitable recipes.  
**_Smart Recipe Filtering:_** The platform prioritizes recipes that match the available ingredients as closely as possible.  
**_Step-by-Step Cooking Instructions:_** Each recipe comes with easy-to-follow instructions.  
**_User Account:_** Users can save the recipe when they like it.  
**_Admin Roles:_** Admin add or manage the content.  
**_Secure Login:_** Use the Google OAuth for user authentication.  
**_User-Friendly Interface:_** Simple and intuitive UI to enhance user experience.

### Project Goals:

Create a web application with a user-friendly interface.
Implement AI features to provide recipes to the users.
Ensure security and scalability for a better user experience.
Make an online platform for public access.

### Trello:

https://trello.com/b/1B4X590E/cse416ai-powered-recipes

### Project Setup Instructions (for New Developers)

This project is currently running on a local development environment. The instructions below will help you get started with checking out the source code, building the software, and testing it locally.

#### 1. 🔨 Clone the Repository

https://github.com/jellyrgb/CSE416_ProjectCode.git
or
Open with the GitHub Desktop

#### 2. 🔨 Install Dependencies

- For React
  cd src
  npm install

- For backend
  cd server
  npm install

#### 3. 🛠️ Set Up and Run the Local Environment

- Make sure to change .env file located in /src and /src/server path to your local information
- Make sure MySQL is running
- Create a new database if you are the first time to run this
  sql> CREATE DATABASE recipe_db;

- Run the Backend Server
  cd src/server
  node server.js

- Run frontend
  cd src
  npm run dev

#### 4. 🔖 Testing the System:

Recipes:

- Categorized by 'Rice', 'One Dish Meal', 'Soup', 'Dessert', 'Side Dish'
- Checking nutrition data in the details page
- Able to see the image of each meal
- Sorted by nutritions

Searching:

- Searching recipes by name

User communication:

- Rating and feedback on recipes(only display)

### 🐞 Bug Tracking & Reporting

We are using **GitHub Issues** to track bugs in this project.

#### How to check existing bugs

1. Go to our GitHub repository
2. Click on the `Issues` tab
3. Filter by the label `bug` to see all known issues

#### How to report a new bug

1. Go to `Issues` > `New Issue`
2. Choose the `Bug report` template (if available)
3. Include:
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Screenshot or error log (if possible)
   - Your environment (browser/OS)
