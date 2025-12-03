
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyANU6ZUxqChdzI-Y_9MfEmy8DnTXsDy-e0",
  authDomain: "onlinemart-7768c.firebaseapp.com",
  projectId: "onlinemart-7768c",
  storageBucket: "onlinemart-7768c.firebasestorage.app",
  messagingSenderId: "534381468822",
  appId: "1:534381468822:web:1b3407dd525aeb215e36b7",
  measurementId: "G-DWRPB7R2DN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
