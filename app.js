const BOT_TOKEN = "8724309567:AAH1GyhzfRBnAVys0fPS9qIyB5kcilW9W00";
const CHAT_ID = "660086073";
const BOT_USERNAME = "hskFlash_cardsbot";

// ================= STATE =================
let hskDictionary = [];
let selected = [];
let usedWords = JSON.parse(localStorage.getItem("usedWords") || "{}");

// ================= LOAD CSV =================
function parseCSV(text) {
  return text.trim().split("\n").slice(1).map(r => {
    const c = r.split(",");
    return {
      hanzi: c[0]?.trim(),
      pinyin: c[1]?.trim(),
      english: c[2]?.trim()
    };
  }).filter(x => x.hanzi);
}

async function loadAllHSK() {
  hskDictionary = [];

  for (let i = 1; i <= 6; i++) {
    try {
      const r = await fetch("hsk" + i + ".csv");
      if (!r.ok) continue;

      const text = await r.text();
      const words = parseCSV(text);

      words.forEach(w => {
        hskDictionary.push({
          ...w,
          level: "HSK" + i
        });
      });

    } catch (e) {
      console.log("HSK" + i + " yuklanmadi:", e);
    }
  }

  console.log("Jami yuklangan so'zlar:", hskDictionary.length);
}

// ================= SEARCH =================
function normalizePinyin(text) {
  return text.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function initSearch() {
  const input = document.getElementById("searchInput");
  const box = document.getElementById("liveResults");

  if (!input || !box) {
    console.error("Search elementlari topilmadi!");
    return;
  }

  input.addEventListener("input", function() {
    const value = this.value.trim();
    box.innerHTML = "";

    if (!value) return;

    const search = normalizePinyin(value);

    const results = hskDictionary.filter(w =>
      w.hanzi.includes(value) ||
      normalizePinyin(w.pinyin).includes(search)
    ).slice(0, 20);

    results.forEach(w => {
      const div = document.createElement("div");
      div.className = "live-item";
      div.innerHTML = `
        <strong>${w.hanzi}</strong>
        <span class="pinyin">${w.pinyin}</span>
        <span class="english">${w.english}</span>
        <small class="level">${w.level}</small>
      `;

      div.onclick = () => {
        addToFlashcards(w.hanzi);
        input.value = "";
        box.innerHTML = "";
      };

      box.appendChild(div);
    });
  });
}

// ================= SELECT =================
function addToFlashcards(hanzi) {
  const word = hskDictionary.find(w => w.hanzi === hanzi);
  if (!word) return;
  if (selected.find(s => s.hanzi === hanzi)) return;

  selected.push(word);
  updateSelectedUI();
}

function removeCard(hanzi) {
  selected = selected.filter(w => w.hanzi !== hanzi);
  updateSelectedUI();
}

function updateSelectedUI() {
  const count = document.getElementById("selectedCount");
  if (count) count.innerText = selected.length;

  const list = document.getElementById("selectedList");
  if (list) {
    list.innerHTML = "";
    selected.forEach(w => {
      const item = document.createElement("div");
      item.className = "selected-item";
      item.innerHTML = `
        <span>${w.hanzi} - ${w.pinyin}</span>
        <button onclick="removeCard('${w.hanzi}')">✕</button>
      `;
      list.appendChild(item);
    });
  }
}

// ================= SMART RANDOM =================
function getSmartRandom(level, count) {
  if (!usedWords[level]) usedWords[level] = [];

  const levelWords = hskDictionary.filter(
    w => w.level === "HSK" + level
  );

  const available = levelWords.filter(
    w => !usedWords[level].includes(w.hanzi)
  );

  if (available.length < count) {
    usedWords[level] = [];
    localStorage.setItem("usedWords", JSON.stringify(usedWords));
    return getSmartRandom(level, count);
  }

  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const chosen = shuffled.slice(0, count);

  chosen.forEach(w => {
    usedWords[level].push(w.hanzi);
  });

  localStorage.setItem("usedWords", JSON.stringify(usedWords));

  return chosen;
}

// ================= PRINT VIEW =================
function renderPages(list) {
  const area = document.getElementById("printArea");
  area.innerHTML = "";

  for (let i = 0; i < list.length; i += 25) {
    const chunk = list.slice(i, i + 25);

    // FRONT PAGE - Hanzi
    const front = document.createElement("div");
    front.className = "page";

    chunk.forEach(c => {
      const d = document.createElement("div");
      d.className = "card front";
      d.innerText = c.hanzi;
      front.appendChild(d);
    });

    // Bo'sh kartalarni to'ldirish
    for (let j = chunk.length; j < 25; j++) {
      const d = document.createElement("div");
      d.className = "card front";
      front.appendChild(d);
    }

    area.appendChild(front);

    // BACK PAGE - Pinyin + English (teskari tartibda)
    const back = document.createElement("div");
    back.className = "page";

    for (let r = 0; r < 5; r++) {
      const row = chunk.slice(r * 5, r * 5 + 5).reverse();
      
      row.forEach(c => {
        const d = document.createElement("div");
        d.className = "card back";
        d.innerHTML = `<span class="pinyin">${c.pinyin}</span><span>${c.english}</span>`;
        back.appendChild(d);
      });

      // Qatorni to'ldirish
      for (let j = row.length; j < 5; j++) {
        const d = document.createElement("div");
        d.className = "card back";
        back.appendChild(d);
      }
    }

    area.appendChild(back);
  }
}

// ================= GENERATE =================
function generatePrint() {
  const mode = document.querySelector('input[name="mode"]:checked')?.value || "random";
  const count = parseInt(document.getElementById("countSelect")?.value || 25);
  const level = document.getElementById("levelSelect")?.value || 1;

  let list = [];

  if (mode === "selected") {
    list = selected.length ? [...selected] : getSmartRandom(level, count);
  } else {
    list = getSmartRandom(level, count);
  }

  renderPages(list);
}

// ================= LED CLOCK =================
function startClock() {
  const el = document.getElementById("ledClock");
  if (!el) {
    console.error("Clock element topilmadi!");
    return;
  }

  function update() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");
    el.textContent = `${h}:${m}:${s}`;
  }

  update();
  setInterval(update, 1000);
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", async () => {
  await loadAllHSK();
  initSearch();
  startClock();
  console.log("App tayyor!");
});
