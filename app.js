
let currentUser = null;

function saveUsers(users){
  localStorage.setItem("users", JSON.stringify(users));
}

function getUsers(){
  return JSON.parse(localStorage.getItem("users")||"{}");
}

function initUser(tgUser){

  let users = getUsers();

  if(!users[tgUser.id]){
    users[tgUser.id] = {
      telegram_id: tgUser.id,
      username: tgUser.username || "",
      first_name: tgUser.first_name || "",
      role: "user",
      is_active: true,
      registered_at: new Date().toISOString(),
      login_count: 1,
      cards: [],
      progress: {}
    };
  } else {
    users[tgUser.id].login_count++;
  }

  saveUsers(users);
  currentUser = users[tgUser.id];
}

function renderCards(){
  let div = document.getElementById("cards");
  div.innerHTML = "";
  currentUser.cards.forEach((c,i)=>{
    div.innerHTML += `<div class="card">
      ${c.hanzi} - ${c.pinyin} - ${c.english}
      <button onclick="markCorrect('${c.hanzi}')">✔</button>
      <button onclick="markWrong('${c.hanzi}')">✖</button>
    </div>`;
  });
  renderProgress();
}

function addCard(){
  let h = hanzi.value;
  let p = pinyin.value;
  let e = english.value;

  if(!h) return;

  currentUser.cards.push({hanzi:h,pinyin:p,english:e});
  updateUser();
  renderCards();
}

function markCorrect(h){
  if(!currentUser.progress[h]) currentUser.progress[h]={correct:0,wrong:0};
  currentUser.progress[h].correct++;
  updateUser();
  renderProgress();
}

function markWrong(h){
  if(!currentUser.progress[h]) currentUser.progress[h]={correct:0,wrong:0};
  currentUser.progress[h].wrong++;
  updateUser();
  renderProgress();
}

function renderProgress(){
  let div = document.getElementById("progress");
  div.innerHTML="";
  for(let h in currentUser.progress){
    let p = currentUser.progress[h];
    div.innerHTML+=`${h} ✔${p.correct} ✖${p.wrong}<br>`;
  }
}

function updateUser(){
  let users = getUsers();
  users[currentUser.telegram_id] = currentUser;
  saveUsers(users);
}

function openAdmin(){
  if(currentUser.role !== "admin"){
    alert("Not admin");
    return;
  }
  document.getElementById("admin").classList.remove("hidden");
  loadUsers();
}

function closeAdmin(){
  document.getElementById("admin").classList.add("hidden");
}

function loadUsers(){
  let users = getUsers();
  let div = document.getElementById("userList");
  div.innerHTML="";
  for(let id in users){
    let u = users[id];
    div.innerHTML+=`
      <div class="card">
        ${u.first_name} (${u.telegram_id})
        Role: ${u.role}
        Active: ${u.is_active}
        <button onclick="toggleBan('${id}')">Ban/Unban</button>
        <button onclick="makeAdmin('${id}')">Make Admin</button>
      </div>`;
  }
}

function toggleBan(id){
  let users = getUsers();
  users[id].is_active = !users[id].is_active;
  saveUsers(users);
  loadUsers();
}

function makeAdmin(id){
  let users = getUsers();
  users[id].role="admin";
  saveUsers(users);
  loadUsers();
}

if(window.Telegram && window.Telegram.WebApp){
  const tg = window.Telegram.WebApp;
  tg.ready();
  tg.expand();
  const user = tg.initDataUnsafe?.user;
  if(user){
    initUser(user);
    if(!currentUser.is_active){
      document.body.innerHTML="<h2>You are banned</h2>";
    } else {
      document.getElementById("loginStatus").innerText="Logged in as "+currentUser.first_name;
      document.getElementById("main").classList.remove("hidden");
      renderCards();
    }
  }
} else {
  document.getElementById("loginStatus").innerText="Open inside Telegram";
}
