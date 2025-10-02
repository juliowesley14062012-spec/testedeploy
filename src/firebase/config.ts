import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDmrv4fqAo16W39gf_kcbPnQ4GZ7hElfgk",
  authDomain: "bratual-a3ba3.firebaseapp.com",
  projectId: "bratual-a3ba3",
  storageBucket: "bratual-a3ba3.firebasestorage.app",
  messagingSenderId: "351858723196",
  appId: "1:351858723196:web:8e65d72fdbb1127f923cf9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);