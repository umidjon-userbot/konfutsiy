// ======= CONFIG =======
const BOT_TOKEN = "8724309567:AAH1GyhzfRBnAVys0fPS9qIyB5kcilW9W00";
const CHAT_ID = "660086073";
 // ================= CONFIG =================

const BOT_USERNAME = "hskFlash_cardsbot";
// ================= STATE =================
let hskDictionary = [];
let selected = [];
let usedWords = JSON.parse(localStorage.getItem("usedWords") || "{}");
let currentFocus = -1;

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
  return text.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"");
}

function initSearch(){
  const input = document.getElementById("searchInput");
  const resultsBox = document.getElementById("liveResults");
  if(!input || !resultsBox) return;

  input.addEventListener("input", function(){

    const value = this.value.trim();
    resultsBox.innerHTML = "";
    currentFocus = -1;

    if(!value) return;

    const search = normalizePinyin(value);

    const results = hskDictionary.filter(w =>
      w.hanzi.includes(value) ||
      normalizePinyin(w.pinyin).includes(search)
    ).slice(0,20);

    results.forEach((w,index)=>{
      const div = document.createElement("div");
      div.className = "live-item";
      div.innerHTML = `
        <strong>${w.hanzi}</strong>
        <small>${w.pinyin}</small>
        <div style="font-size:12px;color:gray">
          ${w.english} • ${w.level}
        </div>
      `;

      div.addEventListener("click",()=>{
        addToFlashcards(w.hanzi);
        input.value = "";
        resultsBox.innerHTML = "";
      });

      resultsBox.appendChild(div);
    });
  });

  input.addEventListener("keydown", function(e){
    const items = resultsBox.getElementsByClassName("live-item");

    if(e.key === "ArrowDown"){
      currentFocus++;
      setActive(items);
    }
    else if(e.key === "ArrowUp"){
      currentFocus--;
      setActive(items);
    }
    else if(e.key === "Enter"){
      e.preventDefault();
      if(currentFocus > -1 && items[currentFocus]){
        items[currentFocus].click();
      }
    }
  });

  function setActive(items){
    if(!items.length) return;
    removeActive(items);

    if(currentFocus >= items.length) currentFocus = 0;
    if(currentFocus < 0) currentFocus = items.length - 1;

    items[currentFocus].classList.add("active");
  }

  function removeActive(items){
    for(let i=0;i<items.length;i++){
      items[i].classList.remove("active");
    }
  }
}

// ================= SELECT =================
function addToFlashcards(hanzi){
  const word = hskDictionary.find(w=>w.hanzi===hanzi);
  if(!word) return;
  if(selected.find(s=>s.hanzi===hanzi)) return;
  selected.push(word);
}

// ================= SMART RANDOM =================
function getSmartRandom(level, count){

  if(!usedWords[level]) usedWords[level] = [];

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

// ================= GENERATE VIEW =================
function generatePrint(){

  const mode = document.querySelector('input[name="mode"]:checked')?.value || "random";
  const count = parseInt(document.getElementById("countSelect")?.value || 25);
  const level = document.getElementById("levelSelect")?.value || 1;

  let list = [];

  if(mode === "selected"){
    list = selected.length ? [...selected] : getSmartRandom(level, count);
  }else{
    list = getSmartRandom(level, count);
  }

  renderPages(list);
}

function renderPages(list){

  const area = document.getElementById("printArea");
  if(!area) return;

  area.innerHTML = "";

  for(let i=0;i<list.length;i+=25){

    const chunk = list.slice(i,i+25);
    const rows = Math.ceil(chunk.length / 5);

    const front = document.createElement("div");
    front.className = "page";

    chunk.forEach((c,index)=>{
      const d = document.createElement("div");
      d.className = "card";
      d.innerText = c.hanzi;
      front.appendChild(d);
    });

    const back = document.createElement("div");
    back.className = "page";

    for(let r=0;r<rows;r++){
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

// ================= PDF DOWNLOAD =================
function downloadPDF(){

  const mode = document.querySelector('input[name="mode"]:checked')?.value || "random";
  const count = parseInt(document.getElementById("countSelect")?.value || 25);
  const level = document.getElementById("levelSelect")?.value || 1;

  let list = [];

  if(mode === "selected"){
    list = selected.length ? [...selected] : getSmartRandom(level, count);
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

  doc.addFont("STSong-Light", "stsong", "normal");

  const margin = 10;
  const usableW = 210 - margin*2;
  const usableH = 297 - margin*2;
  const cellW = usableW / 5;
  const cellH = usableH / 5;

  for(let i=0;i<list.length;i+=25){

    const chunk = list.slice(i,i+25);
    const rows = Math.ceil(chunk.length / 5);

    if(i!==0) doc.addPage();

    // FRONT
    chunk.forEach((c,index)=>{
      const row = Math.floor(index/5);
      const col = index%5;
      const x = margin + col*cellW;
      const y = margin + row*cellH;

      doc.rect(x,y,cellW,cellH);

      doc.setFont("stsong");
      doc.setFontSize(20);

      doc.text(c.hanzi, x+cellW/2, y+cellH/2, {
        align:"center",
        baseline:"middle"
      });
    });

    doc.addPage();

    // BACK
    for(let r=0;r<rows;r++){
      let rowData = chunk.slice(r*5,r*5+5).reverse();

      rowData.forEach((c,col)=>{
        const x = margin + col*cellW;
        const y = margin + r*cellH;

        doc.rect(x,y,cellW,cellH);

        doc.setFont("helvetica");
        doc.setFontSize(10);

        doc.text(
          `${c.pinyin}\n${c.english}`,
          x+cellW/2,
          y+cellH/2,
          { align:"center", baseline:"middle", maxWidth:cellW-4 }
        );
      });
    }
  }

  doc.save("flashcards_clean.pdf");
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", async()=>{
  await loadAllHSK();
  initSearch();
});
