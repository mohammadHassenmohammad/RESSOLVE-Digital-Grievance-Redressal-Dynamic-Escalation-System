import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDmZiBg5mxJo--x92iDIyXkCoAnk1uPTmw",
  authDomain: "grievance-c45af.firebaseapp.com",
  projectId: "grievance-c45af",
  storageBucket: "grievance-c45af.firebasestorage.app",
  messagingSenderId: "148925973795",
  appId: "1:148925973795:web:0c3d10e9fead4d9a6bb896"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Secondary auth instance to create users in Admin Panel without changing the main session
const secondaryApp = initializeApp(firebaseConfig, "secondary");
export const secondaryAuth = getAuth(secondaryApp);

export default app;
