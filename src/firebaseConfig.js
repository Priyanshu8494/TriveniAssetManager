import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Triveni Asset Manager Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDQtoV0hz4e8q8--4DeV0k_HmBKJZKvNPU",
    authDomain: "triveniassetmanager.firebaseapp.com",
    databaseURL: "https://triveniassetmanager-default-rtdb.firebaseio.com",
    projectId: "triveniassetmanager",
    storageBucket: "triveniassetmanager.firebasestorage.app",
    messagingSenderId: "216534389154",
    appId: "1:216534389154:web:ec388ac05c2b12432762fb",
    measurementId: "G-1ZQT0B10V7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
