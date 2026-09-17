const express=require("express");
const http=require("http");
const {Server}=require("socket.io");
const app=express();
const server=http.createServer(app);
const io=new Server(server);
app.use(express.static(__dirname+"/public"));
app.get("/health",(req,res)=>res.json({ok:true}));
const PORT=process.env.PORT||3000;
const rooms=new Map();
const colors=["#4fd1ff","#ff6b81","#ffd166","#7bed9f","#a78bfa","#ff9f43","#70a1ff","#ff7f50"];
const tasks=[
{id:"reactor",x:330,y:270,name:"راکتور"},{id:"comms",x:2070,y:270,name:"ارتباطات"},
{id:"engine",x:330,y:1330,name:"موتور"},{id:"medbay",x:2070,y:1330,name:"درمانگاه"},
{id:"storage",x:1200,y:800,name:"انبار"},{id:"nav",x:1200,y:270,name:"ناوبری"}];
const walls=[[0,0,2400,55],[0,1545,2400,55],[0,0,55,1600],[2345,0,55,1600],
[180,140,520,55],[180,140,55,330],[645,140,55,330],[1700,140,520,55],[1700,140,55,330],[2165,140,55,330],
[180,1170,520,55],[180,1170,55,300],[645,1170,55,300],[1700,1170,520,55],[1700,1170,55,300],[2165,1170,55,300],
[180,470,180,55],[470,470,225,55],[1700,470,180,55],[1970,470,250,55],
[850,140,55,220],[850,455,55,420],[850,970,55,220],[1495,140,55,220],[1495,455,55,420],[1495,970,55,220],
[700,570,150,55],[1550,570,150,55],[700,975,150,55],[1550,975,150,55],
[1030,140,55,120],[1315,140,55,120],[1030,1180,55,265],[1315,1180,55,265]];
function newCode(){let c;do{c=Math.random().toString(36).slice(2,7).toUpperCase()}while(rooms.has(c));return c}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function hit(x,y){return walls.some(w=>x+22>w[0]&&x-22<w[0]+w[2]&&y+22>w[1]&&y-22<w[1]+w[3])}
function publicPlayer(p){return{id:p.id,name:p.name,x:p.x,y:p.y,color:p.color,alive:p.alive,claimedRole:p.claimedRole||null}}
function send(code){const r=rooms.get(code);if(!r)return;io.to(code).emit("state",{started:r.started,ended:r.ended,winner:r.winner,players:[...r.players.values()].map(publicPlayer),tasksDone:[...r.tasksDone]})}
function checkWin(r){const alive=[...r.players.values()].filter(p=>p.alive),traitors=alive.filter(p=>p.role==="infiltrator").length;if(r.tasksDone.size===tasks.length){r.ended=true;r.winner="crew"}else if(traitors===0){r.ended=true;r.winner="crew"}else if(alive.filter(p=>p.role==="crew").length<=traitors){r.ended=true;r.winner="infiltrator"}}
io.on("connection",socket=>{
 socket.on("createRoom",data=>{
   const name=String(data?.name||"بازیکن").trim().slice(0,18)||"بازیکن";
   const code=newCode();
   const room={host:socket.id,started:false,ended:false,winner:null,players:new Map(),tasksDone:new Set()};
   room.players.set(socket.id,{id:socket.id,name,role:"crew",alive:true,x:1200,y:800,color:colors[0],claimedRole:null,lastKill:0});
   rooms.set(code,room);socket.join(code);socket.data.code=code;
   socket.emit("roomCreated",{code});send(code);
 });
 socket.on("joinRoom",data=>{
   const code=String(data?.code||"").trim().toUpperCase();
   const room=rooms.get(code);
   if(!room)return socket.emit("errorMsg","کد اتاق اشتباه است یا اتاق وجود ندارد.");
   if(room.started)return socket.emit("errorMsg","این بازی قبلاً شروع شده است.");
   if(room.players.size>=8)return socket.emit("errorMsg","اتاق پر است.");
   const name=String(data?.name||"بازیکن").trim().slice(0,18)||"بازیکن";
   const i=room.players.size;
   room.players.set(socket.id,{id:socket.id,name,role:"crew",alive:true,x:1200+Math.random()*80-40,y:800+Math.random()*80-40,color:colors[i],claimedRole:null,lastKill:0});
   socket.join(code);socket.data.code=code;socket.emit("joined",{code});send(code);
 });
 socket.on("startGame",()=>{
   const room=rooms.get(socket.data.code);
   if(!room||room.host!==socket.id||room.players.size<3)return;
   const list=[...room.players.values()],traitor=list[Math.floor(Math.random()*list.length)];
   list.forEach(p=>{p.role=p===traitor?"infiltrator":"crew";p.alive=true;p.claimedRole=null;p.lastKill=0});
   room.started=true;room.ended=false;room.winner=null;room.tasksDone.clear();
   list.forEach(p=>io.to(p.id).emit("roleSecret",{role:p.role}));
   io.to(socket.data.code).emit("gameStarted");send(socket.data.code);
 });
 socket.on("move",data=>{
   const room=rooms.get(socket.data.code),p=room?.players.get(socket.id);if(!p||!room.started||room.ended||!p.alive)return;
   let dx=Number(data?.dx)||0,dy=Number(data?.dy)||0,len=Math.hypot(dx,dy);if(len>1){dx/=len;dy/=len}
   const nx=Math.max(85,Math.min(2315,p.x+dx*5)),ny=Math.max(85,Math.min(1515,p.y+dy*5));
   if(!hit(nx,p.y))p.x=nx;if(!hit(p.x,ny))p.y=ny;send(socket.data.code);
 });
 socket.on("doTask",data=>{
   const room=rooms.get(socket.data.code),p=room?.players.get(socket.id),t=tasks.find(x=>x.id===data?.taskId);
   if(!p||!t||!p.alive||room.ended||dist(p,t)>95)return;room.tasksDone.add(t.id);io.to(socket.data.code).emit("notice",p.name+" یک مأموریت را کامل کرد.");checkWin(room);send(socket.data.code);
 });
 socket.on("kill",data=>{
   const room=rooms.get(socket.data.code),p=room?.players.get(socket.id),q=room?.players.get(data?.targetId);
   if(!p||!q||room.ended||!room.started||p.role!=="infiltrator"||!p.alive||!q.alive||dist(p,q)>105||Date.now()-p.lastKill<12000)return;
   p.lastKill=Date.now();q.alive=false;io.to(socket.data.code).emit("killed",{victimName:q.name,revealedRole:q.role==="infiltrator"?"خائن":"خدمه"});checkWin(room);send(socket.data.code);
 });
 socket.on("claimRole",data=>{
   const room=rooms.get(socket.data.code),p=room?.players.get(socket.id);if(!p||p.alive||!room.started)return;
   p.claimedRole=data?.claim==="infiltrator"?"خائن":"خدمه";io.to(socket.data.code).emit("claim",p.name+" ادعا کرد: «من "+p.claimedRole+" بودم!»");send(socket.data.code);
 });
 socket.on("report",()=>{const room=rooms.get(socket.data.code),p=room?.players.get(socket.id);if(!p?.alive||!room.started||room.ended)return;const dead=[...room.players.values()].find(q=>!q.alive&&dist(p,q)<180);if(dead)io.to(socket.data.code).emit("meeting",{by:p.name,reason:"گزارش جسد"})});
 socket.on("emergency",()=>{const room=rooms.get(socket.data.code),p=room?.players.get(socket.id);if(p?.alive&&room.started&&!room.ended)io.to(socket.data.code).emit("meeting",{by:p.name,reason:"جلسه اضطراری"})});
 socket.on("disconnect",()=>{const code=socket.data.code,room=rooms.get(code);if(!room)return;room.players.delete(socket.id);if(!room.players.size)rooms.delete(code);else{if(room.host===socket.id)room.host=[...room.players.keys()][0];send(code)}});
});
server.listen(PORT,"0.0.0.0",()=>console.log("Server listening on "+PORT));