const express=require("express"),http=require("http"),{Server}=require("socket.io"),path=require("path");
const app=express(),server=http.createServer(app),io=new Server(server);
app.use(express.static(path.join(__dirname,"public")));
const rooms=new Map(), colors=["#20d6e8","#e74c3c","#9b59b6","#f1c40f","#2ecc71","#e67e22","#3498db","#ff66aa"];
const rand=a=>a[Math.floor(Math.random()*a.length)];
function makeCode(){let c;do c=Math.random().toString(36).slice(2,7).toUpperCase();while(rooms.has(c));return c}
function pub(r){return {code:r.code,host:r.host,max:r.max,phase:r.phase,players:[...r.players.values()].map(p=>({id:p.id,name:p.name,color:p.color,x:p.x,y:p.y,alive:p.alive,tasks:p.tasks}))}}
function send(r){io.to(r.code).emit("room",pub(r))}
function checkWin(r){
 const alive=[...r.players.values()].filter(p=>p.alive), imp=alive.filter(p=>p.role==="impostor").length, crew=alive.length-imp;
 if(imp===0)return end(r,"crew","همه خائن‌ها حذف شدند!");
 if(imp>=crew)return end(r,"impostor","تعداد خائن‌ها با خدمه برابر شد!");
 if([...r.players.values()].filter(p=>p.role==="crew").every(p=>p.tasksDone===p.tasks))return end(r,"crew","تمام مأموریت‌ها انجام شد!");
}
function end(r,w,reason){r.phase="ended";io.to(r.code).emit("ended",{winner:w,reason});send(r)}
io.on("connection",s=>{
 s.on("create",d=>{let r={code:makeCode(),host:s.id,max:Math.max(3,Math.min(8,+d.max||8)),phase:"lobby",players:new Map(),meeting:null};
 r.players.set(s.id,{id:s.id,name:String(d.name||"Player").slice(0,14),color:colors[0],x:520,y:320,alive:true,tasks:4,tasksDone:0,role:null});
 rooms.set(r.code,r);s.join(r.code);s.data.room=r.code;send(r)});
 s.on("join",d=>{let r=rooms.get(String(d.code||"").toUpperCase());if(!r)return s.emit("err","کد اتاق اشتباه است.");if(r.phase!=="lobby")return s.emit("err","بازی شروع شده است.");if(r.players.size>=r.max)return s.emit("err","اتاق پر است.");
 r.players.set(s.id,{id:s.id,name:String(d.name||"Player").slice(0,14),color:colors[r.players.size%colors.length],x:520+r.players.size*18,y:320+r.players.size*10,alive:true,tasks:4,tasksDone:0,role:null});s.join(r.code);s.data.room=r.code;send(r)});
 s.on("start",()=>{let r=rooms.get(s.data.room);if(!r||r.host!==s.id||r.players.size<3)return s.emit("err","حداقل ۳ بازیکن لازم است.");
 let ids=[...r.players.keys()],n=ids.length>=7?2:1;for(let p of r.players.values()){p.role="crew";p.alive=true;p.tasksDone=0}while(n--){r.players.get(rand(ids)).role="impostor"}r.phase="playing";
 io.to(r.code).emit("roles",{role:r.players.get(s.id).role,players:[...r.players.values()].map(p=>({id:p.id,name:p.name,color:p.color}))});send(r)});
 s.on("move",d=>{let r=rooms.get(s.data.room),p=r?.players.get(s.id);if(!p||r.phase!=="playing"||!p.alive)return;p.x=Math.max(25,Math.min(1030,+d.x));p.y=Math.max(25,Math.min(600,+d.y));s.to(r.code).emit("move",{id:s.id,x:p.x,y:p.y})});
 s.on("task",()=>{let r=rooms.get(s.data.room),p=r?.players.get(s.id);if(!p||r.phase!=="playing"||p.role!=="crew"||p.tasksDone>=p.tasks)return;p.tasksDone++;s.emit("taskOk",p.tasksDone);send(r);checkWin(r)});
 s.on("kill",d=>{let r=rooms.get(s.data.room),a=r?.players.get(s.id),p=r?.players.get(d.target);if(!a||!p||r.phase!=="playing"||a.role!=="impostor"||!a.alive||!p.alive)return;if(Math.hypot(a.x-p.x,a.y-p.y)>105)return;p.alive=false;io.to(r.code).emit("dead",{id:p.id,name:p.name});send(r);checkWin(r)});
 s.on("report",d=>{let r=rooms.get(s.data.room),p=r?.players.get(s.id);if(!p||r.phase!=="playing")return;let body=[...r.players.values()].find(x=>!x.alive&&x.id===d.id);if(!body)return;r.phase="meeting";r.meeting={votes:new Map(),voters:new Set()};io.to(r.code).emit("meeting",{reporter:p.name})});
 s.on("emergency",()=>{let r=rooms.get(s.data.room),p=r?.players.get(s.id);if(!p||r.phase!=="playing"||!p.alive)return;r.phase="meeting";r.meeting={votes:new Map(),voters:new Set()};io.to(r.code).emit("meeting",{reporter:p.name,emergency:true})});
 s.on("vote",d=>{let r=rooms.get(s.data.room),p=r?.players.get(s.id);if(!p||r.phase!=="meeting"||!p.alive||r.meeting.voters.has(s.id))return;r.meeting.voters.add(s.id);r.meeting.votes.set(d.target,(r.meeting.votes.get(d.target)||0)+1);
 let alive=[...r.players.values()].filter(x=>x.alive).length;if(r.meeting.voters.size>=alive){let arr=[...r.meeting.votes.entries()].sort((a,b)=>b[1]-a[1]);let top=arr[0],tie=arr[1]&&arr[1][1]===top[1];let out=tie||!top?null:r.players.get(top[0]);if(out)out.alive=false;r.phase="playing";io.to(r.code).emit("voteResult",{name:out?.name||"هیچ‌کس",ejected:!!out,role:out?.role});send(r);checkWin(r)}});
 s.on("disconnect",()=>{let r=rooms.get(s.data.room);if(!r)return;r.players.delete(s.id);if(r.host===s.id)r.host=r.players.keys().next().value;if(!r.players.size)rooms.delete(r.code);else send(r)});
});
server.listen(process.env.PORT||3000,()=>console.log("Space Mystery Pro running"));
