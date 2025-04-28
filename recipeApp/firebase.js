// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyALCmXjQLNj0XH6lgCCFHcxEIgLw0QRGlE",
  authDomain: "recipes-416.firebaseapp.com",
  projectId: "recipes-416",
  storageBucket: "recipes-416.firebasestorage.app",
  messagingSenderId: "1040798258753",
  appId: "1:1040798258753:web:2114c7f5599f09519918c0",
  measurementId: "G-XTZPT8PXQQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);