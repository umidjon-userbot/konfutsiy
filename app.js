
// ======= CONFIG =======
const BOT_TOKEN = "8724309567:AAH1GyhzfRBnAVys0fPS9qIyB5kcilW9W00";
const CHAT_ID = "660086073";
// ================= CONFIG =================

const BOT_USERNAME = "hskFlash_cardsbot";

// ================= STATE =================
let flashcards = [];
let selected = [];

// ================= SESSION =================
function saveSession(user){
  localStorage.setItem("tg_user", JSON.stringify(user));
}

function getSession(){
  return JSON.parse(localStorage.getItem("tg_user"));
}

function showApp(){
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("appSection").style.display = "block";
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
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: text
    })
  }).catch(err=>console.error(err));
}

// ================= LOGIN =================
function normalizeUser(user){
  const existing = getSession();

  if(!existing || existing.id !== user.id){
    saveSession(user);
    sendLoginToBot(user);
  }

  showApp();
  initApp();
}

function loadWidget(){
  const container = document.getElementById("loginSection");

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

// ================= CSV =================
function parseCSV(text){
  return text.trim().split("\n").slice(1).map(r=>{
    const c = r.split(",");
    return {
      hanzi: c[0]?.trim(),
      pinyin: c[1]?.trim(),
      english: c[2]?.trim()
    };
  }).filter(x=>x.hanzi);
}

async function autoDetectLevels(){
  const sel = document.getElementById("levelSelect");
  sel.innerHTML = "";

  for(let i=1;i<=6;i++){
    try{
      const r = await fetch("hsk"+i+".csv");
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
    const r = await fetch("hsk"+lv+".csv");
    if(!r.ok) throw "CSV not found";
    const t = await r.text();
    flashcards = parseCSV(t);
  }catch(e){
    alert("CSV yuklanmadi yoki xato.");
    console.error(e);
  }
}

// ================= PRINT =================
function shuffleArray(a){ return a.sort(()=>Math.random()-0.5); }

function generatePrint(){
  const count = parseInt(document.getElementById("countSelect").value);
  selected = shuffleArray([...flashcards]).slice(0,count);
  renderPages();
}

function renderPages(){
  const area = document.getElementById("printArea");
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
        d.innerText = c.pinyin + "\n" + c.english;
        back.appendChild(d);
      });
    }

    area.appendChild(front);
    area.appendChild(back);
  }
}
// ===== GLOBAL DICTIONARY =====
let hskDictionary = [];

// ===== LOAD ALL HSK CSV =====
async function loadAllHSK(){
  hskDictionary = [];

  for(let i=1;i<=6;i++){
    try{
      const r = await fetch("hsk"+i+".csv");
      if(!r.ok) continue;

      const text = await r.text();
      const words = parseCSV(text);

      words.forEach(w=>{
        hskDictionary.push({
          ...w,
          level: "HSK"+i
        });
      });

    }catch(e){}
  }
}

// ===== SMART REAL-TIME SEARCH SYSTEM =====

// tone olib tashlash
function normalizePinyin(text){
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// REAL TIME LISTENER
function initSearch(){
  const input = document.getElementById("searchInput");

  input.addEventListener("input", function(){
    const value = this.value.trim();
    performSearch(value);
  });
}

// SEARCH ENGINE
function performSearch(input){
  const resultBox = document.getElementById("searchResult");

  if(!input){
    resultBox.innerHTML = "";
    return;
  }

  const search = normalizePinyin(input);

  const results = hskDictionary.filter(w => {
    const hanziMatch = w.hanzi.includes(input);
    const pinyinMatch = normalizePinyin(w.pinyin).includes(search);
    return hanziMatch || pinyinMatch;
  });

  if(results.length === 0){
    resultBox.innerHTML = "<p>Topilmadi</p>";
    return;
  }

  resultBox.innerHTML = results.slice(0,50).map(w => `
    <div style="
      border:1px solid #ddd;
      padding:12px;
      margin:8px 0;
      border-radius:8px;
    ">
      <h3 style="margin:0">${w.hanzi}</h3>
      <div>${w.pinyin}</div>
      <div>${w.uzbek || w.english || ""}</div>
      <div style="font-size:12px;color:gray">${w.level}</div>
    </div>
  `).join("");
}
}
// ================= INIT =================
document.addEventListener("DOMContentLoaded",()=>{

  const session = getSession();
loadAllHSK();
initSearch();
  if(session){
    showApp();
    initApp();
  }else{
    loadWidget();
  }
});

function initApp(){
  autoDetectLevels();

  document.getElementById("levelSelect")
    .addEventListener("change",e=>{
      loadLevel(e.target.value);
    });
}
