import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

export const firebaseConfig = {
  apiKey: "AIzaSyDqM6Ov-rroihEaZfhN20h40C_5b51GG8U",
  authDomain: "pandora-564d6.firebaseapp.com",
  projectId: "pandora-564d6",
  storageBucket: "pandora-564d6.appspot.com",
  messagingSenderId: "449479526819",
  appId: "1:449479526819:web:fa69d73c2e03443a137216",
  measurementId: "G-NKTSK2B7X8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };