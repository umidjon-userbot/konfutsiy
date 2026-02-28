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

// 📱 Telegram config
const TELEGRAM_BOT_TOKEN = "8724309567:AAH1GyhzfRBnAVys0fPS9qIyB5kcilW9W00"; // BotFather dan olingan token
const TELEGRAM_CHAT_ID = "660086073"; // Sizning chat ID

// 📱 TELEGRAM SEND MESSAGE
export async function sendTelegram(message) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "HTML"
      })
    });
  } catch (e) {
    console.log("Telegram xabar yuborilmadi:", e);
  }
}

// LOGIN
export function login() {
  return signInWithPopup(auth, provider).then((result) => {
    const user = result.user;
    
    // Telegram ga xabar yuborish
    const now = new Date().toLocaleString("uz-UZ");
    sendTelegram(
      `🔐 <b>Yangi kirish!</b>\n\n` +
      `👤 <b>Ism:</b> ${user.displayName}\n` +
      `📧 <b>Email:</b> ${user.email}\n` +
      `🕐 <b>Vaqt:</b> ${now}`
    );
    
    return result;
  });
}

// LOGOUT
export function logout() {
  const user = auth.currentUser;
  
  if (user) {
    const now = new Date().toLocaleString("uz-UZ");
    sendTelegram(
      `👋 <b>Chiqdi</b>\n\n` +
      `👤 ${user.displayName}\n` +
      `🕐 ${now}`
    );
  }
  
  return signOut(auth).then(() => {
    window.location.replace("index.html");
  });
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

// USER INFO - oddiy (faqat ism)
export function setUserInfo(elementId) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      document.getElementById(elementId).innerText = "👤 " + user.displayName;
    }
  });
}

// USER INFO - to'liq (rasm + ism + email)
export function setUserProfile(containerId) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = `
          <img src="${user.photoURL}" alt="Profile" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">
          <div style="display:flex;flex-direction:column;line-height:1.3;">
            <span style="font-weight:bold;">${user.displayName}</span>
            <span style="font-size:12px;opacity:0.8;">${user.email}</span>
          </div>
        `;
      }
    }
  });
}

// GET CURRENT USER - user obyektini qaytaradi
export function getCurrentUser() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      resolve(user);
    });
  });
}

// GET USER DATA - barcha ma'lumotlar
export function getUserData() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        resolve({
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photo: user.photoURL,
          phone: user.phoneNumber,
          emailVerified: user.emailVerified,
          createdAt: user.metadata.creationTime,
          lastLogin: user.metadata.lastSignInTime
        });
      } else {
        resolve(null);
      }
    });
  });
}
