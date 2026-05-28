import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBFd8tsTT814t9oqHn-zLPauy3eR6-UDlk",
  authDomain: "study-hub-cf023.firebaseapp.com",
  projectId: "study-hub-cf023",
  storageBucket: "study-hub-cf023.firebasestorage.app",
  messagingSenderId: "1088412470643",
  appId: "1:1088412470643:web:a4fdc47465e7743d558906",
  measurementId: "G-QKWHNSZ41E"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);
