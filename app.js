
// ======= CONFIG =======
const BOT_TOKEN = "8724309567:AAH1GyhzfRBnAVys0fPS9qIyB5kcilW9W00";
const CHAT_ID = "660086073";

// ================= CONFIG =================

const BOT_USERNAME = "hskFlash_cardsbot";

// ================= STATE =================
let flashcards = [];
let selected = [];

// ================= SAFE PATH =================
function getBasePath(){
  return window.location.pathname
    .split("/")
    .slice(0, -1)
    .join("/") + "/";
}

// ================= SESSION =================
function saveSession(user){
  localStorage.setItem("tg_user", JSON.stringify(user));
}

function getSession(){
  return JSON.parse(localStorage.getItem("tg_user"));
}

function showApp(){
  const login = document.getElementById("loginSection");
  const app = document.getElementById("appSection");
  if(login) login.style.display = "none";
  if(app) app.style.display = "block";
}

// ================= BOT SEND =================
function sendLoginToBot(user){
  const device = navigator.userAgent;

  const text =
`LOGIN
Name: ${user.first_name || ""}
Last: ${user.last_name || ""}
ID: ${user.id}
Username: @${user.username || "none"}
Device: ${device}
Time: ${new Date().toLocaleString()}`;

  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      chat_id: CHAT_ID,
      text: text
    })
  }).catch(err=>console.error("Bot send error:",err));
}

// ================= LOGIN NORMALIZER =================
function normalizeUser(user){
  const existing = getSession();

  if(!existing || existing.id !== user.id){
    saveSession(user);
    sendLoginToBot(user);
  }

  showApp();
  initApp(); // important
}

// ================= WIDGET LOADER =================
function loadWidget(){
  const container = document.getElementById("loginSection");
  if(!container) return;

  const script = document.createElement("script");
  script.src = "https://telegram.org/js/telegram-widget.js?22";
  script.async = true;
  script.setAttribute("data-telegram-login", BOT_USERNAME);
  script.setAttribute("data-size","large");
  script.setAttribute("data-request-access","write");

  window.onTelegramAuth = function(user){
    normalizeUser(user);
  };

  script.setAttribute("data-onauth","onTelegramAuth(user)");

  container.appendChild(script);
}

// ================= LOGIN DETECT =================
function initLogin(){

  if(window.Telegram && window.Telegram.WebApp){
    const tg = window.Telegram.WebApp;
    tg.ready();

    const user = tg.initDataUnsafe?.user;
    if(user){
      normalizeUser(user);
      return;
    }
  }

  const session = getSession();
  if(session){
    showApp();
    initApp();
  }else{
    loadWidget();
  }
}

// ================= CSV =================
function parseCSV(text){
  return text.trim().split("\n").slice(1).map(r=>{
    const c = r.split(",");
    return {
      hanzi: c[0]?.trim(),
      pinyin: c[1]?.trim(),
      english: c[2]?.trim()
    };
  }).filter(x=>x.hanzi && !x.hanzi.startsWith("<"));
}

async function autoDetectLevels(){
  const sel = document.getElementById("levelSelect");
  if(!sel) return;

  sel.innerHTML = "";

  for(let i=1;i<=6;i++){
    try{
      const url = window.location.origin + getBasePath() + "hsk"+i+".csv";
      const r = await fetch(url);
      if(r.ok){
        const o = document.createElement("option");
        o.value = i;
        o.text = "HSK"+i;
        sel.appendChild(o);
      }
    }catch(e){}
  }

  if(sel.value){
    loadLevel(sel.value);
  }
}

async function loadLevel(lv){
  try{
    const url = window.location.origin + getBasePath() + "hsk"+lv+".csv";
    const r = await fetch(url);
    if(!r.ok) throw "CSV not found";

    const t = await r.text();
    flashcards = parseCSV(t);

  }catch(e){
    console.error("CSV ERROR:",e);
    alert("CSV yuklanmadi yoki xato.");
  }
}

// ================= PRINT =================
function shuffleArray(a){ return a.sort(()=>Math.random()-0.5); }

function generatePrint(){
  const count = parseInt(document.getElementById("countSelect")?.value || 25);
  selected = shuffleArray([...flashcards]).slice(0,count);
  renderPages();
}

function renderPages(){
  const area = document.getElementById("printArea");
  if(!area) return;

  area.innerHTML = "";

  for(let i=0;i<selected.length;i+=25){
    const chunk = selected.slice(i,i+25);

    const front = document.createElement("div");
    front.className = "page";

    chunk.forEach(c=>{
      const d = document.createElement("div");
      d.className = "card";
      d.innerText = c.hanzi;
      front.appendChild(d);
    });

    const back = document.createElement("div");
    back.className = "page";

    for(let r=0;r<5;r++){
      let row = chunk.slice(r*5,r*5+5).reverse();
      row.forEach(c=>{
        const d = document.createElement("div");
        d.className = "card";
        d.innerText = c.pinyin + "\\n" + c.english;
        back.appendChild(d);
      });
    }

    area.appendChild(front);
    area.appendChild(back);
  }
}

// ================= INIT APP =================
function initApp(){
  autoDetectLevels();

  const sel = document.getElementById("levelSelect");
  if(sel){
    sel.addEventListener("change", e=>{
      loadLevel(e.target.value);
    });
  }
}

// ================= START =================
document.addEventListener("DOMContentLoaded",()=>{
  initLogin();
});
