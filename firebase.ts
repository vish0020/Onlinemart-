
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// --- 1. Firebase Configuration ---
// Replace these values with your actual Firebase project configuration if needed.
const firebaseConfig = {
  apiKey: "AIzaSyANU6ZUxqChdzI-Y_9MfEmy8DnTXsDy-e0",
  authDomain: "onlinemart-7768c.firebaseapp.com",
  projectId: "onlinemart-7768c",
  storageBucket: "onlinemart-7768c.firebasestorage.app",
  messagingSenderId: "534381468822",
  appId: "1:534381468822:web:1b3407dd525aeb215e36b7",
  measurementId: "G-DWRPB7R2DN"
};

// --- 2. Initialize App ---
const app = initializeApp(firebaseConfig);

// --- 3. Initialize Auth & Persistence ---
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Force persistence to LOCAL (survives refresh and browser restart)
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Auth Persistence Error:", error);
});

// --- 4. Initialize Firestore & Offline Support ---
export const db = getFirestore(app);

enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code == 'unimplemented') {
        console.warn("The current browser does not support all of the features required to enable persistence");
    }
});
