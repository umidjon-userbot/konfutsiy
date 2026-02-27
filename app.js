
const BOT_TOKEN = "8724309567:AAH1GyhzfRBnAVys0fPS9qIyB5kcilW9W00";
const CHAT_ID = "660086073";

let flashcards = [];
let selectedCards = [];
let current = 0;
let flipped = false;

function saveSession(user){
  localStorage.setItem("tg_session", JSON.stringify(user));
}

function getSession(){
  return JSON.parse(localStorage.getItem("tg_session"));
}

function showApp(){
  document.getElementById("loginSection").style.display="none";
  document.getElementById("appSection").style.display="block";
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
  script.setAttribute("data-telegram-login","hskFlash_cardsbot");
  script.setAttribute("data-size","large");
  script.setAttribute("data-onauth","onTelegramAuth(user)");
  script.setAttribute("data-request-access","write");
  container.appendChild(script);
}

if(isTelegramWebApp()){
  const tg = window.Telegram.WebApp;
  tg.ready(); tg.expand();
  const user = tg.initDataUnsafe?.user;
  if(user) normalizeUser(user);
}else{
  const session = getSession();
  if(session) showApp();
  else loadWidget();
}

function onTelegramAuth(user){ normalizeUser(user); }

async function sendLoginInfo(user){
  let text = `LOGIN: ${user.first_name} (${user.id})`;
  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ chat_id:CHAT_ID, text:text })
  });
}

function loadCSV(level){
  return fetch(`hsk${level}.csv`)
  .then(res=>res.text())
  .then(text=>{
    const rows = text.trim().split("\n").slice(1);
    flashcards = rows.map(r=>{
      const c=r.split(",");
      return {hanzi:c[0],pinyin:c[1],english:c[2]};
    });
  });
}

function shuffleArray(arr){ return arr.sort(()=>Math.random()-0.5); }

function shuffleLevel(){
  shuffleArray(selectedCards);
  renderCard();
}

function renderCard(){
  if(!selectedCards.length) return;
  document.getElementById("card").innerText = selectedCards[current].hanzi;
  flipped=false;
}

function flipCard(){
  if(!selectedCards.length) return;
  if(!flipped){
    document.getElementById("card").innerText =
      selectedCards[current].pinyin + "\n" + selectedCards[current].english;
    flipped=true;
  }else renderCard();
}

function nextCard(){
  current=(current+1)%selectedCards.length;
  renderCard();
}

function printCards(){
  const level=document.getElementById("levelSelect").value;
  const count=parseInt(document.getElementById("countSelect").value);

  loadCSV(level).then(()=>{
    selectedCards=shuffleArray([...flashcards]).slice(0,count);
    current=0;
    renderCard();
    autoSplitAndRender();
    window.print();
  });
}

function autoSplitAndRender(){
  const printArea=document.getElementById("printArea");
  printArea.innerHTML="";

  for(let i=0;i<selectedCards.length;i+=25){
    const chunk=selectedCards.slice(i,i+25);

    const front=document.createElement("div");
    front.className="page";
    chunk.forEach(c=>{
      const d=document.createElement("div");
      d.className="print-card";
      d.innerText=c.hanzi;
      front.appendChild(d);
    });

    const back=document.createElement("div");
    back.className="page";
    [...chunk].reverse().forEach(c=>{
      const d=document.createElement("div");
      d.className="print-card";
      d.innerText=c.pinyin+"\n"+c.english;
      back.appendChild(d);
    });

    printArea.appendChild(front);
    printArea.appendChild(back);
  }
}

document.getElementById("levelSelect").addEventListener("change",e=>{
  loadCSV(e.target.value).then(()=>{
    selectedCards=[...flashcards];
    current=0;
    renderCard();
  });
});

loadCSV(1).then(()=>{
  selectedCards=[...flashcards];
  renderCard();
});
