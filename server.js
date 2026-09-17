const express=require("express"),http=require("http");const{Server}=require("socket.io");const app=express(),server=http.createServer(app),io=new Server(server);app.use(express.static("public"));app.get("/health",(q,s)=>s.json({ok:true}));const rooms=new Map(),PORT=process.env.PORT||3000;const colors=["#4fd1ff","#ff6b81","#ffd166","#7bed9f","#a78bfa","#ff9f43","#70a1ff","#ff7f50"];const tasks=[["reactor",330,270,"راکتور"],["comms",2070,270,"ارتباطات"],["engine",330,1330,"موتور"],["medbay",2070,1330,"درمانگاه"],["storage",1200,800,"انبار"],["nav",1200,270,"ناوبری"]].map(a=>({id:a[0],x:a[1],y:a[2],name:a[3]}));
// Walls form rooms around a wide central hall and connecting corridors.
const walls=[
[0,0,2400,55],[0,1545,2400,55],[0,0,55,1600],[2345,0,55,1600],
// top-left room
[180,140,520,55],[180,140,55,330],[645,140,55,330],
// top-right room
[1700,140,520,55],[1700,140,55,330],[2165,140,55,330],
// bottom-left room
[180,1170,520,55],[180,1170,55,300],[645,1170,55,300],
// bottom-right room
[1700,1170,520,55],[1700,1170,55,300],[2165,1170,55,300],
// room dividers with door gaps are represented by separate wall pieces
[180,470,180,55],[470,470,225,55],
[1700,470,180,55],[1970,470,250,55],
[180,1170,180,55],[470,1170,225,55],
[1700,1170,180,55],[1970,1170,250,55],
// central hall side walls, with broad openings at top/bottom
[850,140,55,220],[850,455,55,420],[850,970,55,220],
[1495,140,55,220],[1495,455,55,420],[1495,970,55,220],
// horizontal connectors / side corridors
[700,570,150,55],[1550,570,150,55],[700,975,150,55],[1550,975,150,55],
// small control-room walls
[1030,140,55,120],[1315,140,55,120],
[1030,1180,55,265],[1315,1180,55,265]
];
function code(){let x;do{x=Math.random().toString(36).slice(2,7).toUpperCase()}while(rooms.has(x));return x}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const hit=(x,y)=>walls.some(w=>x+22>w[0]&&x-22<w[0]+w[2]&&y+22>w[1]&&y-22<w[1]+w[3]);
function pub(p){return{id:p.id,name:p.name,x:p.x,y:p.y,color:p.color,alive:p.alive,claimedRole:p.claimedRole||null}}
function send(c){const r=rooms.get(c);if(r)io.to(c).emit("state",{started:r.started,ended:r.ended,winner:r.winner,players:[...r.players.values()].map(pub),tasksDone:[...r.tasksDone]})}
function win(r){let a=[...r.players.values()].filter(p=>p.alive),t=a.filter(p=>p.role==="infiltrator").length;if(r.tasksDone.size===tasks.length){r.ended=true;r.winner="crew"}else if(t===0){r.ended=true;r.winner="crew"}else if(a.filter(p=>p.role==="crew").length<=t){r.ended=true;r.winner="infiltrator"}}
io.on("connection",s=>{
s.on("createRoom",({name})=>{let c=code(),r={host:s.id,started:false,ended:false,winner:null,players:new Map(),tasksDone:new Set()};r.players.set(s.id,{id:s.id,name:(name||"بازیکن").slice(0,18),role:"crew",alive:true,x:1200,y:800,color:colors[0],claimedRole:null,lastKill:0});rooms.set(c,r);s.join(c);s.data.code=c;s.emit("roomCreated",{code:c});send(c)});
s.on("joinRoom",({code:c,name})=>{c=(c||"").toUpperCase().trim();let r=rooms.get(c);if(!r)return s.emit("errorMsg","اتاق پیدا نشد.");if(r.started)return s.emit("errorMsg","بازی شروع شده است.");if(r.players.size>=8)return s.emit("errorMsg","اتاق پر است.");let i=r.players.size;r.players.set(s.id,{id:s.id,name:(name||"بازیکن").slice(0,18),role:"crew",alive:true,x:1200+Math.random()*100-50,y:800+Math.random()*100-50,color:colors[i],claimedRole:null,lastKill:0});s.join(c);s.data.code=c;s.emit("joined",{code:c});send(c)});
s.on("startGame",()=>{let r=rooms.get(s.data.code);if(!r||r.host!==s.id||r.players.size<3)return;let a=[...r.players.values()],t=a[Math.floor(Math.random()*a.length)];a.forEach(p=>{p.role=p===t?"infiltrator":"crew";p.alive=true;p.claimedRole=null;p.lastKill=0});r.started=true;r.ended=false;r.winner=null;r.tasksDone.clear();io.to(s.data.code).emit("gameStarted");a.forEach(p=>io.to(p.id).emit("roleSecret",{role:p.role}));send(s.data.code)});
s.on("move",({dx,dy})=>{let r=rooms.get(s.data.code),p=r?.players.get(s.id);if(!p||!r.started||r.ended||!p.alive)return;let nx=Math.max(85,Math.min(2315,p.x+dx*5)),ny=Math.max(85,Math.min(1515,p.y+dy*5));if(!hit(nx,p.y))p.x=nx;if(!hit(p.x,ny))p.y=ny;send(s.data.code)});
s.on("doTask",({taskId})=>{let r=rooms.get(s.data.code),p=r?.players.get(s.id),t=tasks.find(x=>x.id===taskId);if(!p||!t||!p.alive||r.ended||dist(p,t)>95)return;r.tasksDone.add(taskId);io.to(s.data.code).emit("notice",p.name+" یک مأموریت را کامل کرد.");win(r);send(s.data.code)});
s.on("kill",({targetId})=>{let r=rooms.get(s.data.code),p=r?.players.get(s.id),q=r?.players.get(targetId);if(!p||!q||r.ended||!r.started||p.role!=="infiltrator"||!p.alive||!q.alive||dist(p,q)>105||Date.now()-p.lastKill<12000)return;p.lastKill=Date.now();q.alive=false;io.to(s.data.code).emit("killed",{victimName:q.name,revealedRole:q.role==="infiltrator"?"خائن":"خدمه"});win(r);send(s.data.code)});
s.on("claimRole",({claim})=>{let r=rooms.get(s.data.code),p=r?.players.get(s.id);if(!p||p.alive||!r.started)return;p.claimedRole=claim==="infiltrator"?"خائن":"خدمه";io.to(s.data.code).emit("claim",p.name+" ادعا کرد: «من "+p.claimedRole+" بودم!»");send(s.data.code)});
s.on("report",()=>{let r=rooms.get(s.data.code),p=r?.players.get(s.id);if(!p?.alive||!r.started||r.ended)return;let q=[...r.players.values()].find(x=>!x.alive&&dist(p,x)<180);if(q)io.to(s.data.code).emit("meeting",{by:p.name,reason:"گزارش جسد"})});
s.on("emergency",()=>{let r=rooms.get(s.data.code),p=r?.players.get(s.id);if(p?.alive&&r.started&&!r.ended)io.to(s.data.code).emit("meeting",{by:p.name,reason:"جلسه اضطراری"})});
s.on("disconnect",()=>{let c=s.data.code,r=rooms.get(c);if(!r)return;r.players.delete(s.id);if(!r.players.size)rooms.delete(c);else{if(r.host===s.id)r.host=[...r.players.keys()][0];send(c)}})});
server.listen(PORT,"0.0.0.0",()=>console.log("running",PORT));