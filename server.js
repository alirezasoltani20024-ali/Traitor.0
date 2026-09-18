const http=require("http");
const fs=require("fs");
const path=require("path");
const {WebSocketServer}=require("ws");

const PORT=process.env.PORT||3000;
const server=http.createServer((req,res)=>{
  if(req.url==="/"||req.url==="/index.html"){
    res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});
    return res.end(fs.readFileSync(path.join(__dirname,"index.html")));
  }
  res.writeHead(404);res.end("Not found");
});
const wss=new WebSocketServer({server});
const rooms=new Map();

function code(){let s="";const a="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";for(let i=0;i<5;i++)s+=a[Math.floor(Math.random()*a.length)];return s}
function state(r){return {type:"state",players:[...r.players.values()].map(p=>({id:p.id,name:p.name,x:p.x,y:p.y,zombie:p.zombie})),running:r.running,winner:r.winner}}
function broadcast(r){const m=JSON.stringify(state(r));for(const p of r.players.values())if(p.ws.readyState===1)p.ws.send(m)}
function start(r){
 if(r.players.size<2)return;
 const arr=[...r.players.values()];
 arr.forEach(p=>p.zombie=false);
 arr[Math.floor(Math.random()*arr.length)].zombie=true;
 r.running=true;r.winner=null;broadcast(r);
}
function check(r){
 const arr=[...r.players.values()];
 const z=arr.filter(p=>p.zombie), h=arr.filter(p=>!p.zombie);

 // قانون برد خائن‌ها: وقتی تعداد خائن‌ها به تعداد خدمه برسد،
 // خائن‌ها برنده می‌شوند؛ انجام مأموریت به‌تنهایی برنده اعلام نمی‌کند.
 if(z.length > 0 && z.length >= h.length){
   r.winner = z.map(p=>p.id);
   r.running = false;
   broadcast(r);
   return;
 }

 for(const zp of z)for(const hp of h){
   const d=Math.hypot(zp.x-hp.x,zp.y-hp.y);
   if(d<6)hp.zombie=true;
 }
 const humans=arr.filter(p=>!p.zombie);
 if(humans.length===1){r.winner=humans[0].id;r.running=false}
 broadcast(r);
}
wss.on("connection",ws=>{
 const id=Math.random().toString(36).slice(2,9);
 ws.send(JSON.stringify({type:"welcome",id}));
 ws.on("message",raw=>{
  let m;try{m=JSON.parse(raw)}catch{return}
  if(m.type==="create"){
    let c=(m.room||"").toUpperCase()||code();while(rooms.has(c))c=code();
    const r={players:new Map(),running:false,winner:null};rooms.set(c,r);
    r.players.set(id,{id,name:String(m.name||"بازیکن").slice(0,12),x:20+Math.random()*60,y:20+Math.random()*60,zombie:false,ws});
    ws.room=c;ws.send(JSON.stringify({type:"room",room:c}));broadcast(r);
  }
  if(m.type==="join"){
    const c=String(m.room||"").toUpperCase(),r=rooms.get(c);
    if(!r)return ws.send(JSON.stringify({type:"error",message:"اتاق پیدا نشد"}));
    if(r.players.size>=8)return ws.send(JSON.stringify({type:"error",message:"اتاق پر است"}));
    r.players.set(id,{id,name:String(m.name||"بازیکن").slice(0,12),x:20+Math.random()*60,y:20+Math.random()*60,zombie:false,ws});
    ws.room=c;ws.send(JSON.stringify({type:"room",room:c}));start(r);broadcast(r);
  }
  if(m.type==="move"&&ws.room){
    const r=rooms.get(ws.room),p=r&&r.players.get(id);if(!p||!r.running)return;
    const dx=Math.max(-1,Math.min(1,Number(m.dx)||0)),dy=Math.max(-1,Math.min(1,Number(m.dy)||0));
    p.x=Math.max(3,Math.min(97,p.x+dx*1.8));p.y=Math.max(8,Math.min(92,p.y+dy*1.8));check(r);
  }
 });
 ws.on("close",()=>{
   if(!ws.room)return;const r=rooms.get(ws.room);if(!r)return;
   r.players.delete(id);if(r.players.size===0)rooms.delete(ws.room);else broadcast(r);
 });
});
server.listen(PORT,()=>console.log("Zombie game running on port "+PORT));