
// ======= CONFIG =======
const BOT_TOKEN = "8724309567:AAH1GyhzfRBnAVys0fPS9qIyB5kcilW9W00";
const CHAT_ID = "660086073";
 // ================= CONFIG =================

const BOT_USERNAME = "hskFlash_cardsbot";

// ================= STATE =================
let hskDictionary = [];
let selected = [];
let usedWords = JSON.parse(localStorage.getItem("usedWords") || "{}");

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
    resultBox.innerHTML="";
    return;
  }

  const search = normalizePinyin(input);

  const results = hskDictionary.filter(w=>{
    return w.hanzi.includes(input) ||
           normalizePinyin(w.pinyin).includes(search);
  });

  resultBox.innerHTML = results.slice(0,30).map(w=>`
    <div class="result-card" onclick="addToFlashcards('${w.hanzi}')">
      <div class="hanzi">${w.hanzi}</div>
      <div>${w.pinyin}</div>
      <div>${w.english}</div>
      <div class="level">${w.level}</div>
    </div>
  `).join("");
}

// ================= SELECTED =================
function addToFlashcards(hanzi){
  const word = hskDictionary.find(w=>w.hanzi===hanzi);
  if(!word) return;
  if(selected.find(s=>s.hanzi===hanzi)) return;

  selected.push(word);
  updateSelectedUI();
}

function removeCard(hanzi){
  selected = selected.filter(w=>w.hanzi!==hanzi);
  updateSelectedUI();
}

function updateSelectedUI(){
  const list = document.getElementById("selectedList");
  const count = document.getElementById("selectedCount");

  count.innerText = selected.length;

  list.innerHTML = selected.map(w=>`
    <div class="selected-card">
      <div class="hanzi">${w.hanzi}</div>
      <div>${w.pinyin}</div>
      <div>${w.english}</div>
      <div class="level">${w.level}</div>
      <button class="remove-btn" onclick="removeCard('${w.hanzi}')">Remove</button>
    </div>
  `).join("");
}

// ================= SMART RANDOM =================
function getSmartRandom(level, count){

  if(!usedWords[level]){
    usedWords[level] = [];
  }

  const levelWords = hskDictionary.filter(
    w => w.level === "HSK"+level
  );

  const available = levelWords.filter(
    w => !usedWords[level].includes(w.hanzi)
  );

  if(available.length < count){
    usedWords[level] = [];
    localStorage.setItem("usedWords", JSON.stringify(usedWords));
    return getSmartRandom(level, count);
  }

  const shuffled = [...available].sort(()=>Math.random()-0.5);
  const chosen = shuffled.slice(0,count);

  chosen.forEach(w=>{
    usedWords[level].push(w.hanzi);
  });

  localStorage.setItem("usedWords", JSON.stringify(usedWords));

  return chosen;
}

function resetSmartRandom(){
  usedWords = {};
  localStorage.removeItem("usedWords");
  alert("Random reset qilindi");
}

// ================= PRINT =================
function generatePrint(){

  const mode = document.querySelector('input[name="mode"]:checked').value;
  const count = parseInt(document.getElementById("countSelect").value);
  const level = document.getElementById("levelSelect").value;

  let listToPrint = [];

  // Rejim: Selected
  if(mode === "selected"){

    if(selected.length > 0){
      listToPrint = [...selected];
    }else{
      // Agar selected bo‘sh bo‘lsa avtomatik random ishlasin
      listToPrint = getSmartRandom(level, count);
    }
  }

  // Rejim: Random
  if(mode === "random"){
    listToPrint = getSmartRandom(level, count);
  }

  renderPages(listToPrint);
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
async function downloadPDF(){

  const mode = document.querySelector('input[name="mode"]:checked').value;
  const count = parseInt(document.getElementById("countSelect").value);
  const level = document.getElementById("levelSelect").value;

  let list = [];

  if(mode === "selected"){
    if(selected.length === 0){
      alert("Hech qanday flashcard qo‘shilmagan");
      return;
    }
    list = [...selected];
  }else{
    list = getSmartRandom(level, count);
  }

  if(list.length === 0){
    alert("So‘z topilmadi");
    return;
  }

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });
const { jsPDF } = window.jspdf;

const doc = new jsPDF({
  orientation: "portrait",
  unit: "mm",
  format: "a4"
});

// FONT EMBED
doc.addFileToVFS("NotoSansSC-Regular.otf", NOTO_BASE64);
doc.addFont("NotoSansSC-Regular.otf", "NotoSansSC", "normal");
 //kkkkkkkk
  // 🔥 Xitoy font aktivatsiya
  doc.setFont("helvetica"); // pinyin/english
  doc.addFont("STSong-Light", "stsong", "normal");
  doc.setFont("stsong");

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const gridSize = 5;

  const usableW = pageWidth - margin*2;
  const usableH = pageHeight - margin*2;

  const cellW = usableW / gridSize;
  const cellH = usableH / gridSize;

  function drawFront(chunk){
    chunk.forEach((c, index)=>{
      const row = Math.floor(index / 5);
      const col = index % 5;

      const x = margin + col * cellW;
      const y = margin + row * cellH;

      doc.rect(x, y, cellW, cellH);

      doc.setFont("stsong");
      doc.setFontSize(18);

      doc.text(c.hanzi, x + cellW/2, y + cellH/2, {
        align: "center",
        baseline: "middle"
      });
    });
  }

  function drawBack(chunk){
    for(let r=0; r<5; r++){
      let row = chunk.slice(r*5, r*5+5).reverse();

      row.forEach((c, col)=>{
        const x = margin + col * cellW;
        const y = margin + r * cellH;

        doc.rect(x, y, cellW, cellH);

        doc.setFont("helvetica");
        doc.setFontSize(10);

        doc.text(
          `${c.pinyin}\n${c.english}`,
          x + cellW/2,
          y + cellH/2,
          {
            align: "center",
            baseline: "middle",
            maxWidth: cellW - 4
          }
        );
      });
    }
  }

  for(let i=0;i<list.length;i+=25){

    const chunk = list.slice(i,i+25);

    if(i!==0) doc.addPage();
    drawFront(chunk);

    doc.addPage();
    drawBack(chunk);
  }

  doc.save("flashcards_A4_wuminjun_hsk.pdf");
}
// ================= INIT =================
document.addEventListener("DOMContentLoaded",async()=>{
  await loadAllHSK();
  initSearch();
});
