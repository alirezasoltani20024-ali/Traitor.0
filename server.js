const express=require("express"),http=require("http"),{Server}=require("socket.io"),path=require("path");
const app=express(),server=http.createServer(app),io=new Server(server),rooms=new Map();
app.use(express.static(path.join(__dirname,"public")));
const colors=["#20d6e8","#e74c3c","#9b59b6","#f1c40f","#2ecc71","#e67e22","#3498db","#ff66aa"];
const code=()=>{let c;do c=Math.random().toString(36).slice(2,7).toUpperCase();while(rooms.has(c));return c};
const pub=r=>({code:r.code,host:r.host,max:r.max,phase:r.phase,players:[...r.players.values()].map(p=>({id:p.id,name:p.name,color:p.color,x:p.x,y:p.y,alive:p.alive,tasksDone:p.tasksDone}))});
const send=r=>io.to(r.code).emit("room",pub(r));
function win(r){let a=[...r.players.values()].filter(p=>p.alive),i=a.filter(p=>p.role==="impostor").length,c=a.length-i;
 if(!i)return end(r,"crew","همه خائن‌ها حذف شدند!");
 if(i>=c)return end(r,"impostor","تعداد خائن‌ها با خدمه برابر شد!");
 if([...r.players.values()].filter(p=>p.role==="crew").every(p=>p.tasksDone>=4))end(r,"crew","تمام مأموریت‌ها انجام شد!")}
function end(r,w,reason){r.phase="ended";io.to(r.code).emit("ended",{winner:w,reason});send(r)}
io.on("connection",s=>{
s.on("create",d=>{let r={code:code(),host:s.id,max:Math.max(3,Math.min(8,+d.max||8)),phase:"lobby",players:new Map()};
r.players.set(s.id,{id:s.id,name:String(d.name||"Player").slice(0,14),color:colors[0],x:520,y:320,alive:true,tasksDone:0,role:null});
rooms.set(r.code,r);s.join(r.code);s.data.room=r.code;s.emit("created",{code:r.code});send(r)});
s.on("join",d=>{let r=rooms.get(String(d.code||"").trim().toUpperCase());if(!r)return s.emit("err","کد اتاق پیدا نشد.");if(r.phase!=="lobby")return s.emit("err","بازی شروع شده است.");if(r.players.size>=r.max)return s.emit("err","اتاق پر است.");
r.players.set(s.id,{id:s.id,name:String(d.name||"Player").slice(0,14),color:colors[r.players.size%8],x:520,y:320,alive:true,tasksDone:0,role:null});
s.join(r.code);s.data.room=r.code;s.emit("joined",{code:r.code});send(r)});
s.on("start",()=>{let r=rooms.get(s.data.room);if(!r||r.host!==s.id)return s.emit("err","فقط سازنده اتاق می‌تواند بازی را شروع کند.");if(r.players.size<3)return s.emit("err","حداقل ۳ بازیکن لازم است.");
let ids=[...r.players.keys()].sort(()=>Math.random()-.5),n=r.players.size>=7?2:1;for(let p of r.players.values()){p.role="crew";p.alive=true;p.tasksDone=0}for(let k=0;k<n;k++)r.players.get(ids[k]).role="impostor";
r.phase="playing";for(let [id,p] of r.players)io.to(id).emit("roles",{role:p.role,players:[...r.players.values()].map(x=>({id:x.id,name:x.name,color:x.color}))});send(r)});
s.on("move",d=>{let r=rooms.get(s.data.room),p=r?.players.get(s.id);if(!p||r.phase!=="playing"||!p.alive)return;p.x=Math.max(25,Math.min(1040,+d.x));p.y=Math.max(25,Math.min(610,+d.y));s.to(r.code).emit("move",{id:s.id,x:p.x,y:p.y})});
s.on("task",()=>{let r=rooms.get(s.data.room),p=r?.players.get(s.id);if(!p||r.phase!=="playing"||p.role!=="crew"||p.tasksDone>=4)return;p.tasksDone++;s.emit("taskOk",p.tasksDone);send(r);win(r)});
s.on("kill",d=>{let r=rooms.get(s.data.room),a=r?.players.get(s.id),p=r?.players.get(d.target);if(!a||!p||r.phase!=="playing"||a.role!=="impostor"||!a.alive||!p.alive||Math.hypot(a.x-p.x,a.y-p.y)>115)return;p.alive=false;io.to(r.code).emit("dead",{id:p.id,name:p.name});send(r);win(r)});
s.on("emergency",()=>{let r=rooms.get(s.data.room),p=r?.players.get(s.id);if(!p||r.phase!=="playing"||!p.alive)return;r.phase="meeting";r.votes=new Map;r.voters=new Set;io.to(r.code).emit("meeting",{reporter:p.name,emergency:true})});
s.on("report",d=>{let r=rooms.get(s.data.room),p=r?.players.get(s.id),b=r?.players.get(d.id);if(!p||!b||r.phase!=="playing"||!p.alive||b.alive)return;r.phase="meeting";r.votes=new Map;r.voters=new Set;io.to(r.code).emit("meeting",{reporter:p.name})});
s.on("vote",d=>{let r=rooms.get(s.data.room),p=r?.players.get(s.id);if(!p||r.phase!=="meeting"||!p.alive||r.voters.has(s.id))return;r.voters.add(s.id);r.votes.set(d.target,(r.votes.get(d.target)||0)+1);
let n=[...r.players.values()].filter(x=>x.alive).length;if(r.voters.size>=n){let a=[...r.votes.entries()].sort((x,y)=>y[1]-x[1]),out=null;if(a.length&&!(a[1]&&a[1][1]===a[0][1])&&a[0][0]!=="skip")out=r.players.get(a[0][0]);if(out)out.alive=false;r.phase="playing";io.to(r.code).emit("voteResult",{name:out?.name||"هیچ‌کس",ejected:!!out,role:out?.role});send(r);win(r)}});
s.on("disconnect",()=>{let r=rooms.get(s.data.room);if(!r)return;r.players.delete(s.id);if(r.host===s.id)r.host=r.players.keys().next().value;if(r.players.size)send(r);else rooms.delete(r.code)})});
server.listen(process.env.PORT||3000,()=>console.log("Space Mystery Pro running"));