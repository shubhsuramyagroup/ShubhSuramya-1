import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

import { getFirestore } from "firebase/firestore";

import { getStorage } from "firebase/storage";

import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey:
    "AIzaSyAqqiVxUk_qXquOtK7n9gJU6vydK0DhYyw",

  authDomain:
    "shubhsuramya-e4184.firebaseapp.com",

  projectId:
    "shubhsuramya-e4184",

  storageBucket:
    "shubhsuramya-e4184.appspot.com",

  messagingSenderId:
    "558181692753",

  appId:
    "1:558181692753:web:9b537091035e9322024f70",

  measurementId:
    "G-BXWRLQ1DY5",
};

const app = initializeApp(
  firebaseConfig
);

// Analytics

export const analytics =
  getAnalytics(app);

// Firebase Services

export const auth =
  getAuth(app);

export const db =
  getFirestore(app);

export const storage =
  getStorage(app);

export default app;