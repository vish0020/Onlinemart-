
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

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

// Explicitly set persistence to local to ensure login state survives browser refreshes/restarts
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Error setting auth persistence:", error);
});

export const db = getFirestore(app);

// Enable offline persistence for Firestore
// This prevents "Backend didn't respond within 10 seconds" errors on slow connections
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn("Firestore persistence enabled in another tab already");
    } else if (err.code == 'unimplemented') {
        console.warn("Browser doesn't support persistence");
    }
});

export const googleProvider = new GoogleAuthProvider();
