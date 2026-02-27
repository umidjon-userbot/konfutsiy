
// ======= CONFIG =======
const BOT_TOKEN = "8724309567:AAH1GyhzfRBnAVys0fPS9qIyB5kcilW9W00";
const CHAT_ID = "660086073";

let flashcards=[];
let selected=[];

// ======= TELEGRAM LOGIN =======

function saveSession(user){
  localStorage.setItem("tg_user", JSON.stringify(user));
}

function getSession(){
  return JSON.parse(localStorage.getItem("tg_user"));
}

function showApp(){
  document.getElementById("loginSection").style.display="none";
  document.getElementById("appSection").style.display="block";
}

function sendLoginToBot(user){
  const device=navigator.userAgent;
  const text=`LOGIN
Name: ${user.first_name}
ID: ${user.id}
Username: @${user.username||"none"}
Device: ${device}
Time: ${new Date().toLocaleString()}`;

  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
    method:"POST",
    headers:{ "Content-Type":"application/json"},
    body:JSON.stringify({
      chat_id:CHAT_ID,
      text:text
    })
  });
}

function normalizeUser(user){
  const existing=getSession();
  if(!existing || existing.id!==user.id){
    saveSession(user);
    sendLoginToBot(user);
  }
  showApp();
}

function loadWidget(){
  const script=document.createElement("script");
  script.src="https://telegram.org/js/telegram-widget.js?22";
  script.async=true;
  script.setAttribute("data-telegram-login","YOUR_BOT_USERNAME");
  script.setAttribute("data-size","large");
  script.setAttribute("data-onauth","onTelegramAuth(user)");
  script.setAttribute("data-request-access","write");
  document.getElementById("widgetContainer").appendChild(script);
}

if(window.Telegram && window.Telegram.WebApp){
  const tg=window.Telegram.WebApp;
  tg.ready();
  const user=tg.initDataUnsafe?.user;
  if(user) normalizeUser(user);
}else{
  const s=getSession();
  if(s) showApp();
  else loadWidget();
}

function onTelegramAuth(user){
  normalizeUser(user);
}

// ======= CSV + PRINT =======

function parseCSV(text){
  return text.trim().split("\n").slice(1).map(r=>{
    const c=r.split(",");
    return {hanzi:c[0],pinyin:c[1],english:c[2]};
  }).filter(x=>x.hanzi);
}

async function autoDetect(){
  const sel=document.getElementById("levelSelect");
  for(let i=1;i<=6;i++){
    try{
      const r=await fetch("./hsk"+i+".csv");
      if(r.ok){
        const o=document.createElement("option");
        o.value=i;
        o.text="HSK"+i;
        sel.appendChild(o);
      }
    }catch(e){}
  }
  if(sel.value) loadLevel(sel.value);
}

async function loadLevel(lv){
  try{
    const basePath = window.location.pathname
      .split("/")
      .slice(0, -1)
      .join("/") + "/";

    const url = window.location.origin + basePath + "hsk" + lv + ".csv";

    console.log("Loading CSV from:", url);

    const r = await fetch(url);
    if(!r.ok) throw new Error("CSV not found");

    const t = await r.text();
    flashcards = parseCSV(t);

  }catch(e){
    console.error("CSV ERROR:", e);
    alert("CSV yuklanmadi yoki xato.");
  }
}

function shuffleArray(a){ return a.sort(()=>Math.random()-0.5); }

function shufflePage(){ shuffleArray(flashcards); }

function generatePrint(){
  const count=parseInt(document.getElementById("countSelect").value);
  selected=shuffleArray([...flashcards]).slice(0,count);
  renderPages();
}

function renderPages(){
  const area=document.getElementById("printArea");
  area.innerHTML="";
  for(let i=0;i<selected.length;i+=25){
    const chunk=selected.slice(i,i+25);

    const front=document.createElement("div");
    front.className="page";
    chunk.forEach(c=>{
      const d=document.createElement("div");
      d.className="card";
      d.innerText=c.hanzi;
      front.appendChild(d);
    });

    const back=document.createElement("div");
    back.className="page";
    for(let r=0;r<5;r++){
      let row=chunk.slice(r*5,r*5+5).reverse();
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

async function downloadPDF(){
  const { jsPDF } = window.jspdf;
  const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});

  for(let i=0;i<selected.length;i+=25){
    const chunk=selected.slice(i,i+25);

    chunk.forEach((c,index)=>{
      const x=(index%5)*40+10;
      const y=Math.floor(index/5)*50+20;
      pdf.text(c.hanzi,x,y);
    });
    pdf.addPage();

    for(let r=0;r<5;r++){
      let row=chunk.slice(r*5,r*5+5).reverse();
      row.forEach((c,index)=>{
        const x=(index%5)*40+10;
        const y=Math.floor(index/5)*50+20;
        pdf.text(c.pinyin+" "+c.english,x,y);
      });
    }
    pdf.addPage();
  }

  pdf.save("flashcards.pdf");
}

document.getElementById("levelSelect").addEventListener("change",e=>loadLevel(e.target.value));

autoDetect();
