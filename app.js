const BOT_TOKEN = "8724309567:AAH1GyhzfRBnAVys0fPS9qIyB5kcilW9W00";
const CHAT_ID   = "660086073";

function saveSession(user){
  localStorage.setItem("tg_session", JSON.stringify(user));
}

function getSession(){
  return JSON.parse(localStorage.getItem("tg_session"));
}

function showApp(){
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("appSection").style.display = "block";
}

function normalizeUser(user){

  const existing = getSession();

  if(!existing || existing.id !== user.id){
    saveSession(user);
    sendLoginInfo(user);
  }

  showApp();
}

function isTelegramWebApp(){
  return window.Telegram && window.Telegram.WebApp;
}

function loadWidget(){
  const container = document.getElementById("widgetContainer");

  const script = document.createElement("script");
  script.src = "https://telegram.org/js/telegram-widget.js?22";
  script.async = true;

  script.setAttribute("data-telegram-login", "hskFlash_cardsbot");
  script.setAttribute("data-size", "large");
  script.setAttribute("data-onauth", "onTelegramAuth(user)");
  script.setAttribute("data-request-access", "write");

  container.appendChild(script);
}

if(isTelegramWebApp()){
  const tg = window.Telegram.WebApp;
  tg.ready();
  tg.expand();

  const user = tg.initDataUnsafe?.user;

  if(user){
    normalizeUser(user);
  }
}else{
  const session = getSession();
  if(session){
    showApp();
  }else{
    loadWidget();
  }
}

function onTelegramAuth(user){
  normalizeUser(user);
}

async function sendLoginInfo(user){

  let text = `
<b>LOGIN</b>
👤 ${user.first_name}
🆔 <code>${user.id}</code>
📛 @${user.username || "none"}
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
