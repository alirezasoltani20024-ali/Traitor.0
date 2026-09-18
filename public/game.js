const socket=io();const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d'),bigMap=$('bigMap'),bctx=bigMap.getContext('2d');let myId=null,room='',players=[],me=null,role='crew',partners=[],tasksDone=[],sabotages=[],meeting=null,keys={},joy={x:0,y:0},mapOpen=false,sabotageOpen=false,roleTimer=0;const W=2400,H=1600,vision=9999;
const T=[{id:'card',x:470,y:290,name:'کارت دسترسی',room:'کافه'},{id:'wires',x:790,y:690,name:'سیم‌کشی',room:'برق'},{id:'reactor',x:350,y:1320,name:'راکتور',room:'راکتور'},{id:'comms',x:2050,y:290,name:'تنظیم ارتباطات',room:'ارتباطات'},{id:'fuel',x:350,y:720,name:'سوخت موتور',room:'موتور'},{id:'med',x:2050,y:1320,name:'اسکن پزشکی',room:'درمانگاه'},{id:'nav',x:1570,y:290,name:'هدایت سفینه',room:'ناوبری'}];
const S=[{id:'electric',x:790,y:650,name:'برق'},{id:'oxygen',x:2050,y:650,name:'اکسیژن'},{id:'reactorSab',x:350,y:1250,name:'راکتور'}];const table={x:1200,y:800};
const rooms=[['کافه',180,140,520,350],['برق',700,570,150,430],['موتور',180,1170,520,330],['راکتور',180,1030,520,120],['ناوبری',1700,140,520,350],['ارتباطات',1700,1170,520,330],['درمانگاه',1700,1030,520,120],['انبار',1000,570,400,430],['بال چپ',500,500,500,70],['بال راست',1400,500,500,70]];
function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);bigMap.width=bigMap.clientWidth*devicePixelRatio;bigMap.height=bigMap.clientHeight*devicePixelRatio;bctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}addEventListener('resize',resize);resize();
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2300)}function nm(){return($('name').value.trim()||'بازیکن').slice(0,18)}function showLobby(c){room=c;$('menu').classList.add('hidden');$('lobby').classList.remove('hidden');$('roomCode').textContent=c}
$('create').onclick=()=>socket.emit('createRoom',{name:nm()});$('join').onclick=()=>{const c=$('code').value.trim().toUpperCase();if(c.length<5){$('msg').textContent='کد اتاق را وارد کنید.';return}socket.emit('joinRoom',{name:nm(),code:c})};$('start').onclick=()=>socket.emit('startGame');$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(location.origin+'/?room='+room);toast('لینک دعوت کپی شد')}catch(e){toast(location.origin+'/?room='+room)}};
socket.on('connect',()=>myId=socket.id);socket.on('connect_error',()=>{$('msg').textContent='ارتباط با سرور برقرار نشد.'});socket.on('roomCreated',d=>{showLobby(d.code);history.replaceState(null,'','?room='+d.code)});socket.on('joined',d=>{showLobby(d.code);history.replaceState(null,'','?room='+d.code)});socket.on('errorMsg',t=>$('msg').textContent=t);socket.on('gameStarted',()=>{$('lobby').classList.add('hidden');$('hud').classList.remove('hidden');toast('بازی شروع شد')});
socket.on('roleSecret',d=>{role=d.role;partners=d.partners||[];$('role').textContent=role==='infiltrator'?'نقش: 🔴 خائن':'نقش: 🔵 خدمه';roleTimer=performance.now()+2000;if(role==='infiltrator')$('status').textContent=partners.length?'۲ خائن در بازی هستند':'خائن در بازی است';else $('status').textContent='خدمه؛ مأموریت‌ها را انجام بده'});
socket.on('state',s=>{players=s.players;me=players.find(p=>p.id===myId)||me;tasksDone=s.tasksDone||[];sabotages=s.sabotages||[];meeting=s.meeting||null;$('count').textContent=players.length;$('tasks').textContent=tasksDone.length+'/'+T.length;if(me&&!me.alive)$('deadBox').classList.remove('hidden');if(s.ended){$('end').classList.remove('hidden');$('winner').textContent=s.winner==='crew'?'🎉 خدمه برنده شدند!':'🔪 خائن برنده شد!'}renderContext()});
socket.on('killed',d=>toast('💀 '+d.victimName+' کشته شد — نقش: '+d.revealedRole));socket.on('notice',toast);
socket.on('meetingStart',d=>openMeeting('talk',d.endAt,d.reason,d.by));socket.on('meetingVote',d=>openMeeting('vote',d.endAt,'زمان رأی‌گیری',''));socket.on('meetingResult',d=>showMeetingResult(d));socket.on('voteAccepted',()=>toast('رأی شما ثبت شد'));
function openMeeting(phase,endAt,reason,by){$('meeting').classList.remove('hidden');$('meetingTitle').textContent=phase==='talk'?'📢 جلسه — زمان صحبت':'🗳️ رأی‌گیری';$('meetingReason').textContent=reason+(by?' توسط '+by:'');$('voteArea').classList.toggle('hidden',phase!=='vote');$('leaveMeeting').classList.add('hidden');$('meetingResult').innerHTML='';$('meetingClaims').innerHTML='';if(phase==='vote')buildVotes();tickMeeting(endAt,phase)}function tickMeeting(endAt,phase){clearInterval(window.meetTick);window.meetTick=setInterval(()=>{const sec=Math.max(0,Math.ceil((endAt-Date.now())/1000));$('meetingTimer').textContent=sec+' ثانیه';if(sec<=0){clearInterval(window.meetTick);if(phase==='talk')toast('وقت صحبت تمام شد؛ رأی بدهید')}},100);buildVotes()}
function buildVotes(){const area=$('voteList');area.innerHTML='';players.filter(p=>p.alive).forEach(p=>{const b=document.createElement('button');b.textContent='🗳️ '+p.name;b.className=p.id===myId?'self':'';b.onclick=()=>socket.emit('vote',{target:p.id});area.appendChild(b)})}$('skipVote').onclick=()=>socket.emit('vote',{target:'skip'});
function showMeetingResult(d){clearInterval(window.meetTick);$('meetingTitle').textContent='📊 نتیجه جلسه';$('meetingTimer').textContent='';$('voteArea').classList.add('hidden');$('meetingResult').innerHTML='<div class="resultLine">'+d.result+'</div>';const votes=d.votes||{};for(const [v,t] of Object.entries(votes)){const voter=players.find(p=>p.id===v)?.name||'玩家';const target=t==='skip'?'رد کردن':players.find(p=>p.id===t)?.name||'نامشخص';$('meetingResult').innerHTML+=`<div class="resultLine">${voter} ➜ ${target}</div>`}$('leaveMeeting').classList.remove('hidden')}$('leaveMeeting').onclick=()=>$('meeting').classList.add('hidden');
$('mapBtn').onclick=()=>{$('mapModal').classList.remove('hidden');mapOpen=true;drawBigMap()};$('closeMap').onclick=()=>{$('mapModal').classList.add('hidden');mapOpen=false};$('emergencyBtn').style.display='none';
addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true);addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);function move(){if(!me)return;let x=0,y=0;if(keys.w||keys.arrowup)y--;if(keys.s||keys.arrowdown)y++;if(keys.a||keys.arrowleft)x--;if(keys.d||keys.arrowright)x++;x+=joy.x;y+=joy.y;let l=Math.hypot(x,y);if(l)socket.emit('move',{dx:x/Math.max(1,l),dy:y/Math.max(1,l)})}setInterval(move,55);
let drag=false;$('joystick').onpointerdown=e=>{drag=true;$('joystick').setPointerCapture(e.pointerId);jm(e)};$('joystick').onpointermove=e=>drag&&jm(e);$('joystick').onpointerup=()=>{drag=false;joy.x=joy.y=0;$('joy').style.transform='translate(0,0)'};function jm(e){let r=$('joystick').getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,l=Math.hypot(x,y),m=45;if(l>m){x=x/l*m;y=y/l*m}joy.x=x/m;joy.y=y/m;$('joy').style.transform=`translate(${x}px,${y}px)`}
function near(list,max){if(!me)return null;return list.map(x=>({...x,d:Math.hypot(me.x-x.x,me.y-x.y)})).sort((a,b)=>a.d-b.d)[0]||null}function worldToScreen(x,y,cam){return{x:x-cam.x,y:y-cam.y}}
function addBtn(text,cls,x,y,fn){const b=document.createElement('button');b.className='context '+cls;b.textContent=text;b.style.left=x+'px';b.style.top=y+'px';b.onclick=fn;$('contextButtons').appendChild(b)}
function renderContext(){if(!me||!me.alive){$('contextButtons').innerHTML='';return}const camx=Math.max(0,Math.min(W-innerWidth,me.x-innerWidth/2)),camy=Math.max(0,Math.min(H-innerHeight,me.y-innerHeight/2));$('contextButtons').innerHTML='';const task=near(T.filter(t=>!tasksDone.includes(t.id)),120);if(task&&task.d<125){
 const p=worldToScreen(task.x,task.y,{x:camx,y:camy});
 addBtn('🔧 انجام مأموریت','taskAction',p.x+18,p.y-48,()=>showMissionInfo(task));
}
const target=near(players.filter(p=>p.id!==myId&&p.alive),60);if(role==='infiltrator'&&target&&target.d<=55){const p=worldToScreen(target.x,target.y,{x:camx,y:camy});addBtn('🔪 کشتن','killAction',p.x,p.y,()=>socket.emit('kill',{targetId:target.id}))}
const body=near(players.filter(p=>!p.alive),85);if(body&&body.d<75){const p=worldToScreen(body.x,body.y,{x:camx,y:camy});addBtn('🚨 گزارش جسد','reportAction',p.x,p.y,()=>socket.emit('report'))}
if(Math.hypot(me.x-table.x,me.y-table.y)<115){const p=worldToScreen(table.x,table.y,{x:camx,y:camy});addBtn('📢 جلسه اضطراری','meetAction',p.x,p.y,()=>socket.emit('emergency'))}
if(role==='infiltrator'){const st=near(S,130);if(st&&st.d<115){const p=worldToScreen(st.x,st.y,{x:camx,y:camy});addBtn('⚠️ خرابکاری','sabotageAction',p.x,p.y,()=>showSabMenu(p.x,p.y))}}
}
function showSabMenu(x,y){if(sabotageOpen)return;sabotageOpen=true;const wrap=document.createElement('div');wrap.id='sabMenu';wrap.style.cssText=`position:absolute;left:${x}px;top:${y+45}px;z-index:12;background:#fff;border:2px solid #c7dce8;border-radius:12px;padding:6px;box-shadow:0 10px 25px #2345;`;S.forEach(s=>{const b=document.createElement('button');b.textContent='⚡ '+s.name;b.className='sabotageAction';b.onclick=()=>{socket.emit('sabotage',{stationId:s.id});wrap.remove();sabotageOpen=false};wrap.appendChild(b)});$('contextButtons').appendChild(wrap);setTimeout(()=>{if(wrap.isConnected){wrap.remove();sabotageOpen=false}},5000)}
function draw(){requestAnimationFrame(draw);ctx.clearRect(0,0,innerWidth,innerHeight);if(!me)return;const camx=Math.max(0,Math.min(W-innerWidth,me.x-innerWidth/2)),camy=Math.max(0,Math.min(H-innerHeight,me.y-innerHeight/2));ctx.save();ctx.translate(-camx,-camy);ctx.fillStyle='#d7f4ff';ctx.fillRect(0,0,W,H);drawShip();drawSabotages();T.forEach(t=>{
  if(!tasksDone.includes(t.id)){
    const pulse=15+Math.sin(performance.now()/180)*4;
    ctx.save();ctx.globalAlpha=.25;ctx.fillStyle='#e63950';ctx.beginPath();ctx.arc(t.x,t.y,pulse+8,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;ctx.fillStyle='#e63950';ctx.beginPath();ctx.arc(t.x,t.y,pulse,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 13px Tahoma';ctx.textAlign='center';ctx.fillText('!',t.x,t.y+5);
    ctx.fillStyle='#7b2430';ctx.font='bold 12px Tahoma';ctx.fillText(t.name,t.x,t.y+31);ctx.restore();
  }
});players.forEach(p=>{drawPlayer(p)});ctx.restore();renderContext();if(mapOpen)drawBigMap()}

const missionHelp={
card:["کارت دسترسی","به دستگاه کارت دسترسی برو.","کارت را از سمت چپ به راست بکش تا نوار سبز شود."],
wires:["سیم‌کشی","سیم‌های هم‌رنگ را به هم وصل کن.","هر سیم را بگیر و به سیم هم‌رنگ در طرف مقابل وصل کن."],
lights:["تنظیم برق","برق این بخش را دوباره فعال کن.","کلیدهای خاموش را روشن کن تا همه چراغ‌ها فعال شوند."],
fuel:["سوخت موتور","مخزن موتور را پر کن.","اهرم انتقال سوخت را فعال کن و تا پر شدن مخزن صبر کن."],
engine:["راه‌اندازی موتور","موتور را دوباره روشن کن.","کلیدها را به ترتیب فعال کن و سپس START را بزن."],
reactor:["راکتور","راکتور را پایدار کن.","عددها را به ترتیب درست فشار بده."],
comms:["ارتباطات","ارتباط رادیویی را تنظیم کن.","موج‌ها را روی نقطه سبز قرار بده."],
oxygen:["اکسیژن","فیلتر اکسیژن را پاک‌سازی کن.","ذرات قرمز را بگیر و داخل خروجی بینداز."],
med:["اسکن پزشکی","نمونه را اسکن کن.","نمونه را داخل اسکنر بگذار و صبر کن نوار کامل شود."],
nav:["ناوبری","مسیر سفینه را تنظیم کن.","نقطه مسیر را به مقصد مشخص‌شده بکش."],
storage:["انبار","جعبه‌ها را مرتب کن.","هر جعبه را به جای هم‌رنگ خودش منتقل کن."],
data:["آپلود داده","داده‌ها را به سیستم مرکزی بفرست.","Upload را بزن و تا کامل شدن نوار صبر کن."]
};
function showMissionInfo(t){
 const h=missionHelp[t.kind]||["مأموریت","این مأموریت را انجام بده.","دستورهای روی پنجره مأموریت را دنبال کن."];
 let box=document.getElementById("missionInfo");
 if(!box){box=document.createElement("div");box.id="missionInfo";document.body.appendChild(box);}
 box.innerHTML='<h2>🔧 '+h[0]+'</h2><p>'+h[1]+'</p><div class="hint">💡 راهنمای دقیق: '+h[2]+'</div><button id="miStart">شروع مأموریت</button><button id="miClose">بستن</button>';
 box.classList.add("show");
 document.getElementById("miStart").onclick=()=>{box.classList.remove("show"); if(typeof startMission==="function")startMission(t);};
 document.getElementById("miClose").onclick=()=>box.classList.remove("show");
}

function drawShip(){
  // روشن، خوانا و با دیوارهای ضخیم؛ کف سالن‌ها از اتاق‌ها قابل تشخیص است.
  ctx.fillStyle='#cfeaf3';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#f5fbfd';ctx.strokeStyle='#274b5a';ctx.lineWidth=16;
  ctx.beginPath();ctx.roundRect(45,45,W-90,H-90,80);ctx.fill();ctx.stroke();

  // راهروهای اصلی
  ctx.fillStyle='#d8e9ee';ctx.fillRect(700,520,1000,500);
  ctx.fillRect(850,250,700,100);ctx.fillRect(850,1250,700,100);
  ctx.strokeStyle='#52717d';ctx.lineWidth=10;
  ctx.strokeRect(700,520,1000,500);
  ctx.strokeRect(850,250,700,100);ctx.strokeRect(850,1250,700,100);

  rooms.forEach(r=>{
    ctx.fillStyle='#ffffff';ctx.strokeStyle='#203f4b';ctx.lineWidth=9;
    ctx.beginPath();ctx.roundRect(r[1],r[2],r[3],r[4],28);ctx.fill();ctx.stroke();
    ctx.fillStyle='#315765';ctx.font='bold 22px Tahoma';ctx.textAlign='center';
    ctx.fillText(r[0],r[1]+r[3]/2,r[2]+34);
  });

  // درهای روشن در نقاط اتصال
  const doors=[[700,700,0,90],[700,900,0,90],[1700,700,0,90],[1700,900,0,90],
               [1050,350,90,0],[1350,350,90,0],[1050,1250,90,0],[1350,1250,90,0]];
  ctx.fillStyle='#72b8c9';doors.forEach(d=>{
    if(d[2])ctx.fillRect(d[0],d[1],d[2],10);else ctx.fillRect(d[0],d[1],10,d[3]);
  });

  // میز جلسه
  ctx.fillStyle='#536c78';ctx.beginPath();ctx.arc(table.x,table.y,70,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffd34d';ctx.beginPath();ctx.arc(table.x,table.y,47,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.font='bold 15px Tahoma';ctx.fillText('میز جلسه',table.x,table.y+5);
}
function drawSabotages(){sabotages.forEach(s=>{ctx.fillStyle='#e33e52';ctx.beginPath();ctx.arc(s.x||0,s.y||0,28,0,7);ctx.fill()})}
function drawPlayer(p){if(!p.alive){ctx.fillStyle='#9a9a9a';ctx.fillRect(p.x-25,p.y-8,50,16);ctx.fillStyle='#e33b4f';ctx.beginPath();ctx.arc(p.x,p.y-12,13,0,7);ctx.fill();return}ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle=p.color;ctx.beginPath();ctx.roundRect(-22,-26,44,52,18);ctx.fill();ctx.fillStyle='#c9f1ff';ctx.beginPath();ctx.roundRect(-8,-17,25,15,8);ctx.fill();ctx.fillStyle='#16364b';ctx.beginPath();ctx.roundRect(-4,-14,19,9,5);ctx.fill();ctx.fillStyle='#fff';ctx.font='14px Tahoma';ctx.textAlign='center';ctx.fillText(p.name,0,-35);if(p.id===myId){ctx.strokeStyle='#23384a';ctx.lineWidth=3;ctx.stroke()}if(performance.now()<roleTimer&&p.id===myId){ctx.fillStyle=role==='infiltrator'?'#d92742':'#267ee8';ctx.font='bold 22px Tahoma';ctx.fillText(role==='infiltrator'?'خائن':'خدمه',0,-62)}if(role==='infiltrator'&&partners.includes(p.name)&&p.id!==myId){ctx.fillStyle='#e32643';ctx.font='bold 14px Tahoma';ctx.fillText(p.name,0,-52)}ctx.restore()}
function drawBigMap(){
 if(!bigMap.clientWidth)return;
 const w=bigMap.clientWidth,h=bigMap.clientHeight;
 bctx.clearRect(0,0,w,h);bctx.fillStyle='#dff6ff';bctx.fillRect(0,0,w,h);
 const sx=w/W,sy=h/H;
 rooms.forEach(r=>{
   bctx.fillStyle='#fff';bctx.strokeStyle='#294c59';bctx.lineWidth=3;
   bctx.beginPath();bctx.roundRect(r[1]*sx,r[2]*sy,r[3]*sx,r[4]*sy,8);bctx.fill();bctx.stroke();
   bctx.fillStyle='#365c68';bctx.font='bold 10px Tahoma';bctx.textAlign='center';
   bctx.fillText(r[0],(r[1]+r[3]/2)*sx,(r[2]+18)*sy);
 });
 bctx.fillStyle='#d0e4ea';bctx.fillRect(700*sx,520*sy,1000*sx,500*sy);
 T.forEach(t=>{
   if(!tasksDone.includes(t.id)){
     const pulse=8+Math.sin(performance.now()/180)*2;
     bctx.fillStyle='#e63950';bctx.beginPath();bctx.arc(t.x*sx,t.y*sy,pulse+3,0,Math.PI*2);bctx.fill();
     bctx.fillStyle='#fff';bctx.font='bold 9px Arial';bctx.fillText('!',t.x*sx,t.y*sy+3);
   }
 });
 if(me){
   bctx.fillStyle=me.color;bctx.beginPath();bctx.arc(me.x*sx,me.y*sy,8,0,Math.PI*2);bctx.fill();
   bctx.strokeStyle='#163b49';bctx.lineWidth=2;bctx.stroke();
 }
}
function loopRole(){if(roleTimer&&performance.now()>roleTimer)roleTimer=0;requestAnimationFrame(loopRole)}loopRole();draw();const q=new URLSearchParams(location.search).get('room');if(q)$('code').value=q.toUpperCase();
