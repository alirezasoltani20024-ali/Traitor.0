const s=io();let meId="",role="",players={},pos={x:520,y:320};const $=x=>document.getElementById(x);
const nm=()=>($("name").value||"Player").trim().slice(0,14);
$("create").onclick=()=>{if(!nm())return $("msg").textContent="نامت را وارد کن.";s.emit("create",{name:nm(),max:+$("max").value})};
$("join").onclick=()=>{let c=$("room").value.trim().toUpperCase();if(c.length!==5)return $("msg").textContent="کد باید ۵ حرف باشد.";s.emit("join",{name:nm(),code:c})};
s.on("connect",()=>meId=s.id);s.on("err",t=>{$("msg").textContent=t;$("create").disabled=false;$("join").disabled=false});
s.on("room",r=>{ $("menu").classList.add("hide");$("lobby").classList.remove("hide");$("code").textContent=r.code;$("invite").textContent=location.origin+location.pathname+"?room="+r.code;$("start").style.display=r.host===meId?"inline-block":"none";players={};r.players.forEach(p=>players[p.id]=p);$("players").innerHTML=r.players.map(p=>`<span class=p>${p.id===r.host?"👑 ":""}${p.name}</span>`).join("")});
let q=new URLSearchParams(location.search).get("room");if(q)$("room").value=q.toUpperCase();
$("copy").onclick=()=>{navigator.clipboard?.writeText($("invite").textContent);$("lmsg").textContent="لینک کپی شد."};$("start").onclick=()=>s.emit("start");
s.on("roles",d=>{role=d.role;$("lobby").classList.add("hide");$("game").classList.remove("hide");$("role").textContent=role==="impostor"?"🔪 شما خائن هستید":"👨‍🚀 شما خدمه هستید";$("kill").style.display=role==="impostor"?"inline-block":"none";players={};d.players.forEach(p=>players[p.id]=p);render()});
function render(){for(let k in players){if(k===meId)continue;let p=players[k],e=$("p"+k);if(!e){e=document.createElement("div");e.id="p"+k;e.className="other";e.innerHTML='<span class=tag></span>';$("map").appendChild(e)}e.style.left=(p.x??520)+"px";e.style.top=(p.y??320)+"px";e.style.background=p.color;e.classList.toggle("dead",p.alive===false);e.querySelector(".tag").textContent=p.name}$("me").style.left=pos.x+"px";$("me").style.top=pos.y+"px"}
function mv(x,y){pos.x=Math.max(20,Math.min(1040,pos.x+x));pos.y=Math.max(20,Math.min(610,pos.y+y));render();s.emit("move",pos)}
document.onkeydown=e=>{let k=e.key.toLowerCase();if(k==="w"||k==="arrowup")mv(0,-32);if(k==="s"||k==="arrowdown")mv(0,32);if(k==="a"||k==="arrowleft")mv(-32,0);if(k==="d"||k==="arrowright")mv(32,0)};
document.querySelectorAll("#pad button").forEach(b=>b.onclick=()=>{let d=b.dataset.d;if(d==="up")mv(0,-32);if(d==="down")mv(0,32);if(d==="left")mv(-32,0);if(d==="right")mv(32,0)});
$("task").onclick=()=>s.emit("task");s.on("taskOk",n=>$("tasks").textContent=`مأموریت: ${n}/4`);
function near(wantDead=false){let best=null,d=1e9;for(let k in players){let p=players[k];if(k===meId||p.alive===wantDead)continue;let z=Math.hypot((p.x??0)-pos.x,(p.y??0)-pos.y);if(z<d){d=z;best=k}}return[best,d]}
$("kill").onclick=()=>{let[t,d]=near(false);if(t&&d<115)s.emit("kill",{target:t});else alert("بازیکن نزدیک نیست.")};
$("report").onclick=()=>{let[t,d]=near(true);if(t&&d<125)s.emit("report",{id:t});else alert("جسد نزدیکی نیست.")};$("emergency").onclick=()=>s.emit("emergency");
s.on("move",d=>{if(players[d.id]){players[d.id].x=d.x;players[d.id].y=d.y;render()}});s.on("dead",d=>{if(players[d.id])players[d.id].alive=false;render()});
s.on("meeting",d=>{$("meeting").classList.remove("hide");$("meetingText").textContent=d.emergency?"جلسه اضطراری":"گزارش توسط "+d.reporter;let a=Object.values(players).filter(p=>p.alive);$("votes").innerHTML=a.map(p=>`<button onclick="vote('${p.id}')">🗳️ ${p.name}</button>`).join("")+'<button onclick="vote("skip")">⏭️ رد کردن</button>'});
window.vote=t=>{s.emit("vote",{target:t});$("meeting").classList.add("hide")};s.on("voteResult",d=>alert(d.ejected?`${d.name} اخراج شد. نقش: ${d.role==="impostor"?"خائن":"خدمه"}`:"رأی مساوی شد."));
s.on("ended",d=>{$("result").classList.remove("hide");$("result").innerHTML=`<h1>🏆 پایان</h1><p>${d.reason}</p><h2>${d.winner==="crew"?"👨‍🚀 خدمه":"🔪 خائن"} برنده شد</h2>`});