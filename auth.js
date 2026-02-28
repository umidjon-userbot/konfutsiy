// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ✅ FIREBASE CONFIG - o'zingiznikini qo'ying
const firebaseConfig = {
  apiKey: "AIzaSyBT1H17hj0xNHQScoBmJkdiuAlzy0qk1uY",
  authDomain: "wuminjun-f4d97.firebaseapp.com",
  projectId: "wuminjun-f4d97",
  storageBucket: "wuminjun-f4d97.firebasestorage.app",
  messagingSenderId: "888774800981",
  appId: "b4875adf0b9361dc7f86dc"
};

// ✅ Firebase initialize - FAQAT BIR MARTA
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ✅ TELEGRAM CONFIG
const TELEGRAM_BOT_TOKEN = "8724309567:AAH1GyhzfRBnAVys0fPS9qIyB5kcilW9W00";
const TELEGRAM_CHAT_ID = "660086073";

// ✅ EMAILJS CONFIG
const EMAILJS_SERVICE_ID = "service_tpzfhmc";
const EMAILJS_TEMPLATE_ID = "template_qr8x3no";
const EMAILJS_PUBLIC_KEY = "D2XmGLr_S2RZK8oeJ";

// ─────────────────────────────────────────
// 📱 TELEGRAM SEND MESSAGE
// ─────────────────────────────────────────
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

// ─────────────────────────────────────────
// 📧 EMAIL SEND (EmailJS)
// template_params emailjs template bilan mos bo'lishi kerak:
// {{name}}, {{email}}, {{message}}, {{title}}
// ─────────────────────────────────────────
export async function sendEmail(name, email, message, title = "Contact") {
  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          name: name,       // {{name}}
          email: email,     // {{email}} - Reply To
          message: message, // {{message}}
          title: title      // {{title}} - Subject
        }
      })
    });

    if (response.ok) {
      console.log("✅ Email yuborildi!");
      return true;
    } else {
      console.log("❌ Email yuborilmadi:", await response.text());
      return false;
    }
  } catch (e) {
    console.log("❌ Email xatosi:", e);
    return false;
  }
}

// ─────────────────────────────────────────
// 🔐 LOGIN (Google)
// ─────────────────────────────────────────
export function login() {
  return signInWithPopup(auth, provider).then((result) => {
    const user = result.user;
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

// ─────────────────────────────────────────
// 👋 LOGOUT
// ─────────────────────────────────────────
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

// ─────────────────────────────────────────
// 🔒 AUTH CHECK - login yo'q bo'lsa redirect
// ─────────────────────────────────────────
export function requireAuth(redirectTo = "index.html") {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.replace(redirectTo);
    }
  });
}

// ─────────────────────────────────────────
// ➡️ REDIRECT - login bor bo'lsa redirect
// ─────────────────────────────────────────
export function redirectIfLoggedIn(to = "dashboard.html") {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.replace(to);
    }
  });
}

// ─────────────────────────────────────────
// 👤 USER INFO - faqat ism
// ─────────────────────────────────────────
export function setUserInfo(elementId) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const el = document.getElementById(elementId);
      if (el) el.innerText = "👤 " + user.displayName;
    }
  });
}

// ─────────────────────────────────────────
// 🖼️ USER PROFILE - rasm + ism + email
// ─────────────────────────────────────────
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

// ─────────────────────────────────────────
// 📦 GET CURRENT USER - promise qaytaradi
// ─────────────────────────────────────────
export function getCurrentUser() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      resolve(user);
    });
  });
}

// ─────────────────────────────────────────
// 📋 GET USER DATA - barcha ma'lumotlar
// ─────────────────────────────────────────
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
