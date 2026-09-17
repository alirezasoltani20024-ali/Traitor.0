const socket=io();let id="",room="",role="",players={},pos={x:520,y:320},reported=null;
const $=x=>document.getElementById(x);socket.on("connect",()=>id=socket.id);
const name=()=>($("name").value||"Player");
function create(){socket.emit("create",{name:name(),max:$("max").value})}function join(){socket.emit("join",{name:name(),code:$("codeIn").value})}
socket.on("err",x=>$("msg").textContent=x);socket.on("room",r=>{room=r.code;$("menu").classList.add("hide");$("lobby").classList.remove("hide");$("code").textContent=r.code;$("invite").textContent=location.origin+location.pathname+"?room="+r.code;$("start").style.display=r.host===id?"inline-block":"none";players={};r.players.forEach(p=>players[p.id]=p);$("plist").innerHTML=r.players.map(p=>`<span class=p>● ${p.name}</span>`).join("")});
const q=new URLSearchParams(location.search).get("room");if(q)$("codeIn").value=q;function copy(){navigator.clipboard?.writeText($("invite").textContent)}
function start(){socket.emit("start")}
socket.on("roles",d=>{role=d.role;$("lobby").classList.add("hide");$("game").classList.remove("hide");$("role").textContent=role==="impostor"?"🔪 خائن":"👨‍🚀 خدمه";players={};d.players.forEach(p=>players[p.id]=p);render()});
function render(){for(let k in players){if(k===id)continue;let p=players[k],e=$("p"+k);if(!e){e=document.createElement("div");e.id="p"+k;e.className="other";e.innerHTML='<span class=tag></span>';$("map").appendChild(e)}e.style.left=(p.x??500)+"px";e.style.top=(p.y??300)+"px";e.style.background=p.color;e.classList.toggle("dead",p.alive===false);e.querySelector(".tag").textContent=p.name} $("me").style.left=pos.x+"px";$("me").style.top=pos.y+"px"}
function move(dx,dy){pos.x=Math.max(20,Math.min(1040,pos.x+dx));pos.y=Math.max(20,Math.min(610,pos.y+dy));render();socket.emit("move",pos)}
document.onkeydown=e=>{let k=e.key.toLowerCase();if(k==="w"||k==="arrowup")move(0,-32);if(k==="s"||k==="arrowdown")move(0,32);if(k==="a"||k==="arrowleft")move(-32,0);if(k==="d"||k==="arrowright")move(32,0)};
document.querySelectorAll("#pad button").forEach(b=>b.onclick=()=>{let k=b.dataset.k;if(k==="up")move(0,-32);if(k==="down")move(0,32);if(k==="left")move(-32,0);if(k==="right")move(32,0)});
function doTask(){if(role!=="crew")return;socket.emit("task")}socket.on("taskOk",n=>$("taskText").textContent=`مأموریت: ${n}/4`);
function nearest(){let best=null,d=1e9;for(let k in players){if(k===id||!players[k].alive)continue;let p=players[k],z=Math.hypot((p.x??0)-pos.x,(p.y??0)-pos.y);if(z<d){d=z;best=k}}return [best,d]}
function kill(){let [t,d]=nearest();if(t&&d<110)socket.emit("kill",{target:t})}function report(){let [t,d]=nearest();if(t&&d<125&&players[t].alive===false)socket.emit("report",{id:t})}function emergency(){socket.emit("emergency")}
socket.on("move",d=>{if(players[d.id]){players[d.id].x=d.x;players[d.id].y=d.y;render()}});socket.on("dead",d=>{if(players[d.id])players[d.id].alive=false;render()});
socket.on("meeting",d=>{ $("meeting").classList.remove("hide");$("meetingInfo").textContent=d.emergency?"جلسه اضطراری!":`گزارش توسط ${d.reporter}`;let a=[...Object.values(players)].filter(p=>p.alive);$("votes").innerHTML=a.map(p=>`<button onclick="vote('${p.id}')">🗳️ ${p.name}</button>`).join("")+`<button onclick="vote('skip')">⏭️ رد کردن</button>`});
function vote(t){socket.emit("vote",{target:t});$("meeting").classList.add("hide")}socket.on("voteResult",d=>{alert(d.ejected?`${d.name} اخراج شد. نقش: ${d.role==="impostor"?"خائن":"خدمه"}`:"رأی مساوی شد؛ کسی اخراج نشد.")});
socket.on("ended",d=>{$("result").classList.remove("hide");$("result").innerHTML=`<h1>🏆 پایان بازی</h1><p>${d.reason}</p><h2>${d.winner==="crew"?"👨‍🚀 خدمه برنده شدند":"🔪 خائن برنده شد"}</h2>`});
