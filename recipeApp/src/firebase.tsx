// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCBrVxhe0NZcK1kVdKtbWLe0e-Rx8g0ntU",
  authDomain: "cse416-recipeapp-9f023.firebaseapp.com",
  projectId: "cse416-recipeapp-9f023",
  storageBucket: "cse416-recipeapp-9f023.firebasestorage.app",
  messagingSenderId: "513663206331",
  appId: "1:513663206331:web:36ec7ea8b7f1bf3a863a9e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export { app, auth };
