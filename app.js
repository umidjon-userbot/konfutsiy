
let flashcards = [];
let selectedCards = [];

function loadCSV(level){
  return fetch(`hsk${level}.csv`)
  .then(res=>res.text())
  .then(text=>{
    const rows = text.trim().split("\n").slice(1);
    flashcards = rows.map(r=>{
      const cols = r.split(",");
      return {hanzi:cols[0], pinyin:cols[1], english:cols[2]};
    });
  });
}

function shuffleArray(arr){
  return arr.sort(()=>Math.random()-0.5);
}

function shuffleLevel(){
  shuffleArray(selectedCards);
  renderPreview();
}

function renderPreview(){
  const preview = document.getElementById("preview");
  preview.innerHTML = selectedCards.map(c=>c.hanzi).join(" | ");
}

function autoSplitAndRender(){
  const printArea = document.getElementById("printArea");
  printArea.innerHTML = "";

  for(let i=0;i<selectedCards.length;i+=25){
    const chunk = selectedCards.slice(i,i+25);

    // FRONT
    const front = document.createElement("div");
    front.className="page";
    chunk.forEach(c=>{
      const div=document.createElement("div");
      div.className="card";
      div.innerText=c.hanzi;
      front.appendChild(div);
    });

    // BACK (reverse for duplex)
    const back = document.createElement("div");
    back.className="page";
    [...chunk].reverse().forEach(c=>{
      const div=document.createElement("div");
      div.className="card";
      div.innerText=c.pinyin+"\n"+c.english;
      back.appendChild(div);
    });

    printArea.appendChild(front);
    printArea.appendChild(back);
  }
}

function printCards(){
  const level = document.getElementById("levelSelect").value;
  const count = parseInt(document.getElementById("countSelect").value);

  loadCSV(level).then(()=>{
    selectedCards = shuffleArray([...flashcards]).slice(0,count);
    autoSplitAndRender();
    window.print();
  });
}

document.getElementById("levelSelect").addEventListener("change", e=>{
  loadCSV(e.target.value).then(()=>{
    selectedCards=[...flashcards];
    renderPreview();
  });
});

loadCSV(1).then(()=>{
  selectedCards=[...flashcards];
  renderPreview();
});
