
let flashcards = [];
let selectedCards = [];
let current = 0;
let flipped = false;

async function autoDetectLevels(){
  const select = document.getElementById("levelSelect");
  select.innerHTML = "";
  for(let i=1;i<=6;i++){
    try{
      const res = await fetch("./hsk"+i+".csv");
      if(res.ok){
        const opt=document.createElement("option");
        opt.value=i;
        opt.text="HSK"+i;
        select.appendChild(opt);
      }
    }catch(e){}
  }
}

function parseCSV(text){
  return text.trim().split("\n").slice(1).map(r=>{
    const c=r.split(",");
    return { hanzi:c[0]?.trim(), pinyin:c[1]?.trim(), english:c[2]?.trim() };
  }).filter(x=>x.hanzi && !x.hanzi.startsWith("<"));
}

async function loadCSV(level){
  try{
    const res = await fetch("./hsk"+level+".csv");
    if(!res.ok) throw "CSV not found";
    const text = await res.text();
    flashcards = parseCSV(text);
    selectedCards=[...flashcards];
    current=0;
    renderCard();
  }catch(e){
    alert("CSV yuklanmadi yoki xato.");
  }
}

function shuffleArray(arr){ return arr.sort(()=>Math.random()-0.5); }

function shuffleLevel(){ shuffleArray(selectedCards); current=0; renderCard(); }

function renderCard(){
  if(!selectedCards.length) return;
  document.getElementById("card").innerText=selectedCards[current].hanzi;
  flipped=false;
}

function flipCard(){
  if(!selectedCards.length) return;
  if(!flipped){
    document.getElementById("card").innerText = selectedCards[current].pinyin+"\n"+selectedCards[current].english;
    flipped=true;
  }else renderCard();
}

function nextCard(){ current=(current+1)%selectedCards.length; renderCard(); }

function createBackLayout(chunk){
  const back=document.createElement("div");
  back.className="page";
  for(let r=0;r<5;r++){
    let row=chunk.slice(r*5,r*5+5);
    row.reverse().forEach(c=>{
      const d=document.createElement("div");
      d.className="print-card";
      d.innerText=c.pinyin+"\n"+c.english;
      back.appendChild(d);
    });
  }
  return back;
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
    const back=createBackLayout(chunk);
    printArea.appendChild(front);
    printArea.appendChild(back);
  }
}

function printCards(){
  const count=parseInt(document.getElementById("countSelect").value);
  selectedCards=shuffleArray([...flashcards]).slice(0,count);
  autoSplitAndRender();
  window.print();
}

async function downloadPDF(){
  const { jsPDF } = window.jspdf;
  const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
  const count=parseInt(document.getElementById("countSelect").value);
  selectedCards=shuffleArray([...flashcards]).slice(0,count);

  for(let i=0;i<selectedCards.length;i+=25){
    const chunk=selectedCards.slice(i,i+25);
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

document.getElementById("levelSelect").addEventListener("change",e=>{ loadCSV(e.target.value); });

(async function init(){
  await autoDetectLevels();
  const first=document.getElementById("levelSelect").value;
  if(first) loadCSV(first);
})();
