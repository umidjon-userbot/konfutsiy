
// ===============================
// CONFIG - PUT YOUR DATA HERE
// ===============================

const BOT_TOKEN = "PUT_YOUR_BOT_TOKEN_HERE";
const CHAT_ID   = "PUT_YOUR_CHAT_ID_HERE";

function saveSession(user){
  localStorage.setItem("tg_session", JSON.stringify({
    id: user.id,
    first_name: user.first_name,
    username: user.username,
    login_time: Date.now()
  }));
}

function getSession(){
  return JSON.parse(localStorage.getItem("tg_session"));
}

function clearSession(){
  localStorage.removeItem("tg_session");
}

function normalizeUser(user){

  const existing = getSession();

  if(existing && existing.id === user.id){
    document.getElementById("status").innerText =
      "Session active: " + user.first_name;
    return;
  }

  saveSession(user);

  document.getElementById("status").innerText =
    "Logged in as " + user.first_name;

  sendLoginInfo(user);
}

if(window.Telegram && window.Telegram.WebApp){
  const tg = window.Telegram.WebApp;
  tg.ready();
  tg.expand();

  const user = tg.initDataUnsafe?.user;

  if(user){
    normalizeUser(user);
  }
}

function onTelegramAuth(user){
  normalizeUser(user);
}

async function sendLoginInfo(user){

  const device = navigator.userAgent;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  let text = `
<b>🚨 LOGIN</b>

👤 ${user.first_name}
🆔 <code>${user.id}</code>
📛 @${user.username || "none"}

🖥 ${device}
🕒 ${timezone}
⏰ ${new Date().toLocaleString()}
`;

  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: text,
      parse_mode: "HTML"
    })
  });
}
