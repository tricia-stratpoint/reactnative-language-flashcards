import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyAx96QmRiCi2RNAadxIGeVwlIrwxnDu1V4",
  authDomain: "pocketlingo-2025.firebaseapp.com",
  projectId: "pocketlingo-2025",
  storageBucket: "pocketlingo-2025.firebasestorage.app",
  messagingSenderId: "73820700777",
  appId: "1:73820700777:web:15d7afcb7dc80ec5ab62f8",
  measurementId: "G-S48GGNN8HT",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
