
// ======= CONFIG =======
const BOT_TOKEN = "8724309567:AAH1GyhzfRBnAVys0fPS9qIyB5kcilW9W00";
const CHAT_ID = "660086073";
// ================= CONFIG =================

// ================= CONFIG =================

const BOT_USERNAME = "hskFlash_cardsbot";

// ================= STATE =================
let flashcards = [];
let selected = [];
let hskDictionary = [];

// ================= SESSION =================
function saveSession(user){
  localStorage.setItem("tg_user", JSON.stringify(user));
}

function getSession(){
  return JSON.parse(localStorage.getItem("tg_user"));
}

function showApp(){
  document.getElementById("loginSection")?.remove();
  document.getElementById("appSection").style.display = "block";
}

// ================= BOT SEND =================
function sendLoginToBot(user){
  if(!BOT_TOKEN || !CHAT_ID) return;

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
  }).catch(()=>{});
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

// ================= LOAD ALL HSK =================
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

// ================= SEARCH =================
function generatePrint(){

  const level = document.getElementById("levelSelect").value;
  const count = parseInt(document.getElementById("countSelect").value);

  // agar searchdan tanlangan bo'lsa
  if(selected.length > 0){
    renderPages(selected);
    return;
  }

  // aks holda leveldan random tanlaydi
  const levelWords = hskDictionary.filter(w => w.level === "HSK"+level);

  if(levelWords.length === 0){
    alert("So‘zlar topilmadi");
    return;
  }

  const randomWords = shuffleArray([...levelWords]).slice(0,count);

  renderPages(randomWords);
}
function normalizePinyin(text){
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}

function initSearch(){
  const input = document.getElementById("searchInput");
  input.addEventListener("input",()=>{
    performSearch(input.value.trim());
  });
}

function performSearch(input){
  const resultBox = document.getElementById("searchResult");
  if(!input){
    resultBox.innerHTML = "";
    return;
  }

  const search = normalizePinyin(input);

  const results = hskDictionary.filter(w=>{
    return w.hanzi.includes(input) ||
           normalizePinyin(w.pinyin).includes(search);
  });

  if(results.length===0){
    resultBox.innerHTML = "<p>Topilmadi</p>";
    return;
  }

  resultBox.innerHTML = results.slice(0,50).map(w=>`
    <div class="result-card" onclick="addToFlashcards('${w.hanzi}')">
      <div class="hanzi">${w.hanzi}</div>
      <div class="pinyin">${w.pinyin}</div>
      <div class="meaning">${w.english}</div>
      <div class="level">${w.level}</div>
    </div>
  `).join("");
}

// ================= ADD TO FLASHCARD =================
function addToFlashcards(hanzi){
  const word = hskDictionary.find(w=>w.hanzi===hanzi);
  if(!word) return;

  if(selected.find(s=>s.hanzi===hanzi)) return;

  selected.push(word);
  alert(hanzi+" qo‘shildi");
}

// ================= PRINT =================
function shuffleArray(a){ return a.sort(()=>Math.random()-0.5); }

function generatePrint(){
  if(selected.length===0){
    alert("Hech narsa tanlanmagan");
    return;
  }

  renderPages(selected);
}

function renderPages(list){
  const area = document.getElementById("printArea");
  area.innerHTML="";

  for(let i=0;i<list.length;i+=25){
    const chunk = list.slice(i,i+25);

    const front = document.createElement("div");
    front.className="page";

    chunk.forEach(c=>{
      const d=document.createElement("div");
      d.className="card";
      d.innerText=c.hanzi;
      front.appendChild(d);
    });

    const back = document.createElement("div");
    back.className="page";

    for(let r=0;r<5;r++){
      let row = chunk.slice(r*5,r*5+5).reverse();
      row.forEach(c=>{
        const d=document.createElement("div");
        d.className="card";
        d.innerText=c.pinyin+"\n"+c.english;
        back.appendChild(d);
      });
    }

    area.appendChild(front);
    area.appendChild(back);
  }
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded",async()=>{
  const session=getSession();
  await loadAllHSK();
  initSearch();

  if(session){
    showApp();
    initApp();
  }else{
    loadWidget();
  }
});

function initApp(){
  document.getElementById("levelSelect")
  ?.addEventListener("change",e=>{
    loadLevel(e.target.value);
  });
}
