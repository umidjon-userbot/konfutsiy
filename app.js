
let flashcards = [];
let selected = [];

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

function parseCSV(text){
  return text.trim().split("\n").slice(1).map(r=>{
    const c=r.split(",");
    return {hanzi:c[0],pinyin:c[1],english:c[2]};
  }).filter(x=>x.hanzi);
}

async function loadLevel(lv){
  const r=await fetch("./hsk"+lv+".csv");
  const t=await r.text();
  flashcards=parseCSV(t);
}

function shuffleArray(a){ return a.sort(()=>Math.random()-0.5); }

function shufflePage(){
  shuffleArray(flashcards);
}

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
    front.className="page crop";
    chunk.forEach(c=>{
      const d=document.createElement("div");
      d.className="card";
      d.innerText=c.hanzi;
      front.appendChild(d);
    });

    const back=document.createElement("div");
    back.className="page crop";
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
  pdf.save("flashcards_PRO.pdf");
}

document.getElementById("levelSelect").addEventListener("change",e=>loadLevel(e.target.value));

autoDetect();
