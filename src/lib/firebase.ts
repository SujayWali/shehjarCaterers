import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCD08Vhuo8_6WkzUwIFDa1SaAS1bpHvvZg",
  authDomain: "shehjarcaterersmenu.firebaseapp.com",
  projectId: "shehjarcaterersmenu",
  storageBucket: "shehjarcaterersmenu.firebasestorage.app",
  messagingSenderId: "148622868189",
  appId: "1:148622868189:web:3df5a726eb167728606534"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
