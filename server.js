const express=require('express');const http=require('http');const {Server}=require('socket.io');
const app=express(),server=http.createServer(app),io=new Server(server);app.use(express.static(__dirname+'/public'));app.get('/health',(q,s)=>s.json({ok:true}));const PORT=process.env.PORT||3000;
const rooms=new Map();const colors=['#4fc3f7','#ff5f6d','#ffd166','#55d68a','#a78bfa','#ff9f43','#4d96ff','#ff7f50'];
const tasks=[
{id:'wires',x:790,y:690,name:'سیم‌کشی برق',room:'برق',kind:'wires'},
{id:'oxygen',x:2050,y:650,name:'رفع نشتی اکسیژن',room:'اکسیژن',kind:'oxygen'},
{id:'mines',x:2050,y:290,name:'حدس مین',room:'ارتباطات',kind:'mines'},
{id:'data',x:1570,y:290,name:'دریافت فایل',room:'ناوبری',kind:'data'}];const stations=[{id:'electric',x:790,y:650,name:'برق'},{id:'oxygen',x:2050,y:650,name:'اکسیژن'},{id:'reactorSab',x:350,y:1250,name:'راکتور'}];
const walls=[[0,0,2400,45],[0,1555,2400,45],[0,0,45,1600],[2355,0,45,1600],[180,140,520,55],[180,140,55,350],[645,140,55,350],[1700,140,520,55],[1700,140,55,350],[2165,140,55,350],[180,1170,520,55],[180,1170,55,330],[645,1170,55,330],[1700,1170,520,55],[1700,1170,55,330],[2165,1170,55,330],[850,140,55,220],[850,455,55,430],[850,975,55,220],[1495,140,55,220],[1495,455,55,430],[1495,975,55,220],[700,570,150,55],[1550,570,150,55],[700,975,150,55],[1550,975,150,55],[1030,140,55,120],[1315,140,55,120],[1030,1180,55,265],[1315,1180,55,265]];
const table={x:1200,y:800};
const vents=[
{id:'v1',name:'کافه',x:430,y:330},
{id:'v2',name:'برق',x:780,y:800},
{id:'v3',name:'موتور',x:430,y:1330},
{id:'v4',name:'راکتور',x:430,y:1080},
{id:'v5',name:'ناوبری',x:1960,y:330},
{id:'v6',name:'ارتباطات',x:1960,y:1330},
{id:'v7',name:'درمانگاه',x:1960,y:1080},
{id:'v8',name:'انبار',x:1200,y:930}
];
const ventById=id=>vents.find(v=>v.id===id);
const ventDist=(a,v)=>Math.hypot(a.x-v.x,a.y-v.y);function code(){let c;do{c=Math.random().toString(36).slice(2,7).toUpperCase()}while(rooms.has(c));return c}function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}function hit(x,y){return walls.some(w=>x+22>w[0]&&x-22<w[0]+w[2]&&y+22>w[1]&&y-22<w[1]+w[3])}
function pub(p){return{id:p.id,name:p.name,x:p.x,y:p.y,color:p.color,alive:p.alive,claimedRole:p.claimedRole||null}}function send(c){const r=rooms.get(c);if(!r)return;io.to(c).emit('state',{started:r.started,ended:r.ended,winner:r.winner,players:[...r.players.values()].map(pub),tasksDone:[...r.tasksDone],sabotages:r.sabotages,meeting:r.meeting?{phase:r.meeting.phase,endAt:r.meeting.endAt,reason:r.meeting.reason,by:r.meeting.by,votes:r.meeting.phase==='vote'?Object.keys(r.meeting.votes).length:0}:null})}
function checkWin(r){if(!r.started||r.ended)return;const alive=[...r.players.values()].filter(p=>p.alive),tr=alive.filter(p=>p.role==='infiltrator').length;const allTasksDone=tasks.length===4&&r.tasksDone.size===4&&tasks.every(t=>r.tasksDone.has(t.id));if(allTasksDone||tr===0){r.ended=true;r.winner='crew'}else if(alive.filter(p=>p.role==='crew').length<=tr){r.ended=true;r.winner='infiltrator'}
if(r.ended){r.meeting=null;io.to(r.code).emit('gameEnded',{winner:r.winner});send(r.code)}}
function startMeeting(r,by,reason){if(r.meeting||r.ended)return;r.meeting={phase:'talk',endAt:Date.now()+30000,by,reason,votes:{}};io.to([...r.players.keys()]).emit('meetingStart',{phase:'talk',endAt:r.meeting.endAt,reason,by});send(r.code)}
function finishTalk(c){const r=rooms.get(c);if(!r||!r.meeting||r.meeting.phase!=='talk')return;r.meeting.phase='vote';r.meeting.endAt=Date.now()+10000;io.to(c).emit('meetingVote',{endAt:r.meeting.endAt});send(c);setTimeout(()=>finishVote(c),10050)}
function finishVote(c){const r=rooms.get(c);if(!r||!r.meeting)return;const counts={};for(const id of Object.values(r.meeting.votes))counts[id]=(counts[id]||0)+1;let top=null,max=0,tie=false;for(const [id,n] of Object.entries(counts)){if(n>max){top=id;max=n;tie=false}else if(n===max&&n>0){tie=true}}let result='هیچ‌کس اخراج نشد';if(top&&!tie){const p=r.players.get(top);if(p){p.alive=false;result=`${p.name} با ${max} رأی اخراج شد — نقش: ${p.role==='infiltrator'?'خائن':'خدمه'}`}}else if(tie)result='رأی‌ها مساوی شد؛ کسی اخراج نشد';r.meeting={phase:'result',endAt:Date.now()+6500,reason:r.meeting.reason,by:r.meeting.by,votes:r.meeting.votes,result};io.to(c).emit('meetingResult',{result,votes:r.meeting.votes,players:[...r.players.values()].map(pub)});checkWin(r);send(c);setTimeout(()=>{if(rooms.has(c)){r.meeting=null;send(c)}},6600)}
setInterval(()=>{for(const [c,r] of rooms){if(r.meeting&&Date.now()>=r.meeting.endAt&&r.meeting.phase==='talk')finishTalk(c);for(const s of r.sabotages){if(s.until<Date.now())r.sabotages=r.sabotages.filter(x=>x!==s)}}},1000);
io.on('connection',socket=>{
socket.on('createRoom',d=>{if(!socket.connected)return;const c=code();const r={code:c,host:socket.id,started:false,ended:false,winner:null,players:new Map(),tasksDone:new Set(),sabotages:[],meeting:null};r.players.set(socket.id,{id:socket.id,name:String(d?.name||'بازیکن').trim().slice(0,18)||'بازیکن',role:'crew',alive:true,x:1200,y:800,color:colors[0],claimedRole:null,lastKill:0,lastSab:0});rooms.set(c,r);socket.join(c);socket.data.code=c;socket.emit('roomCreated',{code:c});send(c)});
socket.on('joinRoom',d=>{const c=String(d?.code||'').trim().toUpperCase(),r=rooms.get(c);if(!r)return socket.emit('errorMsg','کد اتاق اشتباه است.');if(r.started)return socket.emit('errorMsg','بازی شروع شده است.');if(r.players.size>=8)return socket.emit('errorMsg','اتاق پر است.');const i=r.players.size;r.players.set(socket.id,{id:socket.id,name:String(d?.name||'بازیکن').trim().slice(0,18)||'بازیکن',role:'crew',alive:true,x:1200+(Math.random()*120-60),y:800+(Math.random()*120-60),color:colors[i],claimedRole:null,lastKill:0,lastSab:0});socket.join(c);socket.data.code=c;socket.emit('joined',{code:c});send(c)});
socket.on('startGame',()=>{const r=rooms.get(socket.data.code);if(!r){socket.emit('errorMsg','اتاق پیدا نشد.');return;}if(r.host!==socket.id){socket.emit('errorMsg','فقط سازنده اتاق می‌تواند بازی را شروع کند.');return;}if(r.players.size<2){socket.emit('errorMsg','برای شروع بازی حداقل ۲ بازیکن لازم است.');return;}const ps=[...r.players.values()];const n=ps.length>=7?2:1;ps.forEach(p=>{p.role='crew';p.alive=true;p.lastKill=0;p.lastSab=0});for(let i=0;i<n;i++){const candidates=ps.filter(p=>p.role==='crew');const chosen=candidates[Math.floor(Math.random()*candidates.length)];chosen.role='infiltrator';}r.started=true;r.ended=false;r.winner=null;r.tasksDone.clear();r.sabotages=[];const tr=ps.filter(p=>p.role==='infiltrator');[...r.players.values()].forEach(p=>io.to(p.id).emit('roleSecret',{role:p.role,partners:p.role==='infiltrator'?tr.filter(q=>q.id!==p.id).map(q=>q.name):[]}));io.to(r.code).emit('gameStarted');send(r.code)});
socket.on('move',d=>{const r=rooms.get(socket.data.code),p=r?.players.get(socket.id);if(!p||!r.started||r.ended||r.meeting)return;let dx=+d?.dx||0,dy=+d?.dy||0,l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}const nx=Math.max(80,Math.min(2320,p.x+dx*5)),ny=Math.max(80,Math.min(1520,p.y+dy*5));if(!hit(nx,p.y))p.x=nx;if(!hit(p.x,ny))p.y=ny;send(r.code)});
socket.on('doTask',d=>{const r=rooms.get(socket.data.code),p=r?.players.get(socket.id),t=tasks.find(x=>x.id===d?.taskId);if(!p||!t||!p.alive||r.ended||dist(p,t)>125)return;if(d?.proof!==t.id)return;r.tasksDone.add(t.id);io.to(r.code).emit('notice',`✅ ${p.name} مأموریت «${t.name}» را انجام داد.`);checkWin(r);send(r.code)});
socket.on('kill',d=>{const r=rooms.get(socket.data.code),p=r?.players.get(socket.id),q=r?.players.get(d?.targetId);if(!p||!q||r.ended||!r.started||p.role!=='infiltrator'||!p.alive||!q.alive||dist(p,q)>55||Date.now()-p.lastKill<12000)return;p.lastKill=Date.now();q.alive=false;io.to(r.code).emit('killed',{victimName:q.name,revealedRole:q.role==='infiltrator'?'خائن':'خدمه'});checkWin(r);send(r.code)});
socket.on('report',()=>{const r=rooms.get(socket.data.code),p=r?.players.get(socket.id);if(!p?.alive||!r.started||r.ended)return;const body=[...r.players.values()].find(q=>!q.alive&&dist(p,q)<75);if(body)startMeeting(r,p.name,'گزارش جسد')});
socket.on('emergency',()=>{const r=rooms.get(socket.data.code),p=r?.players.get(socket.id);if(p?.alive&&r.started&&!r.ended&&dist(p,table)<115)startMeeting(r,p.name,'جلسه اضطراری')});
socket.on('vote',d=>{const r=rooms.get(socket.data.code),p=r?.players.get(socket.id);if(!r?.meeting||r.meeting.phase!=='vote'||!p?.alive)return;const target=String(d?.target||'skip');if(target!=='skip'&&!r.players.get(target)?.alive)return;r.meeting.votes[socket.id]=target;io.to(socket.id).emit('voteAccepted');send(r.code);if(Object.keys(r.meeting.votes).length===[...r.players.values()].filter(x=>x.alive).length)finishVote(r.code)});
socket.on('vent',d=>{const r=rooms.get(socket.data.code),p=r?.players.get(socket.id),v=ventById(d?.ventId);if(!p||!v||!r.started||r.ended||r.meeting||p.role!=='infiltrator'||!p.alive||ventDist(p,v)>80)return;const dest=ventById(d?.destId);if(!dest||dest.id===v.id)return;p.x=dest.x;p.y=dest.y;io.to(socket.id).emit('vented',{from:v.name,to:dest.name});send(r.code)});
socket.on('sabotage',d=>{const r=rooms.get(socket.data.code),p=r?.players.get(socket.id),s=stations.find(x=>x.id===d?.stationId);if(!p||!s||p.role!=='infiltrator'||!p.alive||r.ended||Date.now()-p.lastSab<120000||dist(p,s)>115)return;p.lastSab=Date.now();r.sabotages.push({id:s.id,name:s.name,until:Date.now()+30000});io.to(r.code).emit('notice',`⚠️ خرابی در ${s.name}!`);send(r.code)});

socket.on('emergencyCall',()=>{
 const room=rooms.get(socket.data.room);
 if(!room||room.phase!=='playing')return;
 const caller=room.players.find(p=>p.id===socket.id);
 if(!caller||!caller.alive)return;
 if(room.emergencyCooldown&&Date.now()-room.emergencyCooldown<20000)return;
 room.emergencyCooldown=Date.now();
 room.phase='meeting';
 room.players.filter(p=>p.alive).forEach(p=>{p.x=1200;p.y=800;});
 io.to(room.code).emit('emergencyAlarm',{callerName:caller.name});
 io.to(room.code).emit('state',publicState(room));
 io.to(room.code).emit('meetingStart',{duration:30000,reason:'emergency'});
});

socket.on('disconnect',()=>{const c=socket.data.code,r=rooms.get(c);if(!r)return;r.players.delete(socket.id);if(!r.players.size)rooms.delete(c);else{if(r.host===socket.id)r.host=[...r.players.keys()][0];send(c)}});
});server.listen(PORT,'0.0.0.0',()=>console.log('Server listening on '+PORT));
