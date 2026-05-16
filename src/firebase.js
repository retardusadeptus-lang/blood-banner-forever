import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB6Roi4-SNGjILdlr85jDn5Bf8IGIVlAs0",
  authDomain: "loot-council-ec7b1.firebaseapp.com",
  projectId: "loot-council-ec7b1",
  storageBucket: "loot-council-ec7b1.firebasestorage.app",
  messagingSenderId: "772832163543",
  appId: "1:772832163543:web:f676a2f9afa7cfea5da292",
  measurementId: "G-NHJM2WZGMP"
};

// Initialize Firebase and export the Database connection
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);