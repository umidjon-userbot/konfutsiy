// auth.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// 🔥 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBT1H17hj0xNHQScoBmJkdiuAlzy0qk1uY",
  authDomain: "wuminjun-f4d97.firebaseapp.com",
  projectId: "wuminjun-f4d97",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// LOGIN
export function login() {
  return signInWithPopup(auth, provider);
}

// LOGOUT
export function logout() {
  return signOut(auth);
}

// AUTH CHECK
export function requireAuth(redirectTo = "index.html") {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.replace(redirectTo);
    }
  });
}

// REDIRECT AGAR LOGIN BOR BO'LSA
export function redirectIfLoggedIn(to = "dashboard.html") {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.replace(to);
    }
  });
}

// USER INFO
export function setUserInfo(elementId) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      document.getElementById(elementId).innerText = "👤 " + user.displayName;
    }
  });
}
