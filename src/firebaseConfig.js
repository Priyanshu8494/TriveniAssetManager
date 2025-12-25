// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// TODO: User needs to provide the full config from Firebase Console
const firebaseConfig = {
    apiKey: "REPLACE_WITH_YOUR_API_KEY", // Missing
    authDomain: "triveniassetmanager.firebaseapp.com", // Inferred
    databaseURL: "https://triveniassetmanager-default-rtdb.firebaseio.com/", // Provided
    projectId: "triveniassetmanager", // Inferred
    storageBucket: "triveniassetmanager.appspot.com", // Inferred
    messagingSenderId: "REPLACE_WITH_SENDER_ID", // Missing
    appId: "REPLACE_WITH_APP_ID" // Missing
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
