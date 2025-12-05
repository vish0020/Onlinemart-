
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

// --- PASTE YOUR FIREBASE CONFIG HERE ---
const firebaseConfig = {
  apiKey: "AIzaSyANU6ZUxqChdzI-Y_9MfEmy8DnTXsDy-e0",
  authDomain: "onlinemart-7768c.firebaseapp.com",
  databaseURL: "https://onlinemart-7768c-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "onlinemart-7768c",
  storageBucket: "onlinemart-7768c.firebasestorage.app",
  messagingSenderId: "534381468822",
  appId: "1:534381468822:web:1b3407dd525aeb215e36b7",
  measurementId: "G-DWRPB7R2DN"
};

// --- Initialize App ---
const app = initializeApp(firebaseConfig);

// --- Initialize Auth ---
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// --- Initialize Realtime Database ---
export const db = getDatabase(app);
