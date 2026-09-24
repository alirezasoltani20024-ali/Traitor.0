const socket=io();const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d'),bigMap=$('bigMap'),bctx=bigMap.getContext('2d');let myId=null,room='',players=[],me=null,role='crew',partners=[],tasksDone=[],sabotages=[],meeting=null,keys={},joy={x:0,y:0},mapOpen=false,sabotageOpen=false,roleTimer=0;const W=2400,H=1600,vision=9999;
const T=[{id:'wires',x:790,y:690,name:'سیم‌کشی برق',room:'برق',kind:'wires'},{id:'oxygen',x:2050,y:650,name:'رفع نشتی اکسیژن',room:'اکسیژن',kind:'oxygen'},{id:'mines',x:2050,y:290,name:'حدس مین',room:'ارتباطات',kind:'mines'},{id:'data',x:1570,y:290,name:'دریافت فایل',room:'ناوبری',kind:'data'}];
const S=[{id:'electric',x:790,y:650,name:'برق'},{id:'oxygen',x:2050,y:650,name:'اکسیژن'},{id:'reactorSab',x:350,y:1250,name:'راکتور'}];const wallRects=[[0,0,2400,45],[0,1555,2400,45],[0,0,45,1600],[2355,0,45,1600],[180,140,520,55],[180,140,55,350],[645,140,55,350],[1700,140,520,55],[1700,140,55,350],[2165,140,55,350],[180,1170,520,55],[180,1170,55,330],[645,1170,55,330],[1700,1170,520,55],[1700,1170,55,330],[2165,1170,55,330],[850,140,55,220],[850,455,55,430],[850,975,55,220],[1495,140,55,220],[1495,455,55,430],[1495,975,55,220],[700,570,150,55],[1550,570,150,55],[700,975,150,55],[1550,975,150,55],[1030,140,55,120],[1315,140,55,120],[1030,1180,55,265],[1315,1180,55,265]];
const table={x:1200,y:800};
const rooms=[['کافه',180,140,520,350],['برق',700,570,150,430],['موتور',180,1170,520,330],['راکتور',180,1030,520,120],['ناوبری',1700,140,520,350],['ارتباطات',1700,1170,520,330],['درمانگاه',1700,1030,520,120],['انبار',1000,570,400,430],['بال چپ',500,500,500,70],['بال راست',1400,500,500,70]];
const FREE_COLORS=[['قرمز','#e60012'],['آبی','#1264ff'],['سبز','#12b82d'],['زرد','#ffd400'],['نارنجی','#ff6b00'],['صورتی','#ff4bb3'],['بنفش','#6f20c9'],['قهوه‌ای','#6b2f00'],['فیروزه‌ای','#12d5e5'],['فسفری','#39e600'],['مشکی','#111827'],['سفید','#f7f9ff'],['خاکستری','#9ca3af'],['کرمی','#f6df9c'],['زرشکی','#9f0018'],['سرمه‌ای','#0d2a63'],['زیتونی','#617000'],['نیلی تیره','#1e5d60'],['آبی نفتی','#0e7c8f'],['یاسی','#b69af2']];
const CHARACTER_ART=new Image();CHARACTER_ART.src='assets/characters_reference.png';
const ART_COLS=[0,1,2,3,4,5,6,7,8,9,11];
const ART_X=[150,285,410,538,670,800,932,1081,1230,1368,1504,1640,1774];
const ART_Y=[45,100,139,181,224,261,301,342,382,429,474,522,567,600,640,684,729,767,804,843,887];
const ART_COLOR_INDEX=new Map(FREE_COLORS.map(([,c],i)=>[c.toLowerCase(),i]));
const FREE_SKINS=[['ساده','classic','🧑‍🚀'],['مربع','square','⬛'],['لوزی','diamond','🔶'],['شش‌ضلعی','hex','⬡'],['گربه','cat','🐱'],['ربات','robot','🤖'],['روح','ghost','👻'],['نینجا','ninja','🥷'],['ستاره','star','⭐'],['تاج','crown','👑'],['ماینکرفتی','minecraft','🟩']];
function initSkinShop(){const modal=$('skinShop'),colors=$('colorGrid'),grid=$('skinGrid'),open=$('skinShopBtn'),close=$('closeSkinShop');if(!modal||!grid||!colors||!open)return;colors.innerHTML='';grid.innerHTML='';const selectedColor=()=>localStorage.getItem('skinColor')||'#4fc3f7';const selectedShape=()=>localStorage.getItem('skinShape')||'classic';FREE_COLORS.forEach(([name,color])=>{const b=document.createElement('button');b.type='button';b.style.cssText='min-height:60px;background:'+color+';color:#fff;border:3px solid '+(selectedColor()===color?'#111':'#fff');b.textContent='🎨 '+name;b.onclick=()=>{localStorage.setItem('skinColor',color);if(socket.connected)socket.emit('setSkin',{color,shape:selectedShape()});initSkinShop();toast('✅ رنگ '+name+' انتخاب شد')};colors.appendChild(b)});FREE_SKINS.forEach(([name,shape,icon])=>{const b=document.createElement('button');b.type='button';b.style.cssText='min-height:85px;background:#24364a;color:#fff;border:3px solid '+(selectedShape()===shape?'#ffd166':'#ffffff55');b.textContent=icon+' '+name;b.onclick=()=>{localStorage.setItem('skinShape',shape);if(socket.connected)socket.emit('setSkin',{shape,color:selectedColor()});initSkinShop();toast('✅ اسکین '+name+' انتخاب شد')};grid.appendChild(b)});open.onclick=()=>{initSkinShop();modal.classList.remove('hidden')};close.onclick=()=>modal.classList.add('hidden')}
initSkinShop();
function resize(){const d=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.floor(innerWidth*d));canvas.height=Math.max(1,Math.floor(innerHeight*d));ctx.setTransform(d,0,0,d,0,0);const md=Math.min(devicePixelRatio||1,1.25);bigMap.width=Math.max(1,Math.floor(bigMap.clientWidth*md));bigMap.height=Math.max(1,Math.floor(bigMap.clientHeight*md));bctx.setTransform(md,0,0,md,0,0)}addEventListener('resize',resize);resize();
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2300)}function nm(){return($('name').value.trim()||'بازیکن').slice(0,18)}function showLobby(c){room=c;$('menu').classList.add('hidden');$('lobby').classList.remove('hidden');$('roomCode').textContent=c}
$('create').onclick=()=>socket.emit('createRoom',{name:nm()});$('join').onclick=()=>{const c=$('code').value.trim().toUpperCase();if(c.length<5){$('msg').textContent='کد اتاق را وارد کنید.';return}socket.emit('joinRoom',{name:nm(),code:c})};$('start').onclick=()=>socket.emit('startGame');$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(location.origin+'/?room='+room);toast('لینک دعوت کپی شد')}catch(e){toast(location.origin+'/?room='+room)}};
socket.on('connect',()=>myId=socket.id);socket.on('connect_error',()=>{$('msg').textContent='ارتباط با سرور برقرار نشد.'});socket.on('roomCreated',d=>{showLobby(d.code);history.replaceState(null,'','?room='+d.code);const c=localStorage.getItem('skinColor');const sh=localStorage.getItem('skinShape');if(c||sh)socket.emit('setSkin',{color:c,shape:sh})});socket.on('joined',d=>{showLobby(d.code);history.replaceState(null,'','?room='+d.code);const c=localStorage.getItem('skinColor');const sh=localStorage.getItem('skinShape');if(c||sh)socket.emit('setSkin',{color:c,shape:sh})});socket.on('errorMsg',t=>$('msg').textContent=t);socket.on('gameStarted',()=>{$('lobby').classList.add('hidden');$('hud').classList.remove('hidden');toast('بازی شروع شد')});
socket.on('roleSecret',d=>{role=d.role;partners=d.partners||[];$('role').textContent=role==='infiltrator'?'نقش: 🔴 خائن':'نقش: 🔵 خدمه';roleTimer=performance.now()+2000;if(role==='infiltrator')$('status').textContent=partners.length?'۲ خائن در بازی هستند':'خائن در بازی است';else $('status').textContent='خدمه؛ مأموریت‌ها را انجام بده'});
socket.on('state',s=>{players=s.players;me=players.find(p=>p.id===myId)||me;tasksDone=s.tasksDone||[];sabotages=s.sabotages||[];meeting=s.meeting||null;$('count').textContent=players.length;$('tasks').textContent=tasksDone.length+'/'+T.length;if(me&&!me.alive)$('deadBox').classList.remove('hidden');if(s.ended){$('meeting').classList.add('hidden');$('end').classList.remove('hidden');$('winner').textContent=s.winner==='crew'?'🎉 خدمه برنده شدند!':'🔪 خائن برنده شد!';$('status').textContent=s.winner==='crew'?'پایان بازی — خدمه':'پایان بازی — خائن'}renderContext()});
socket.on('killed',d=>toast('💀 '+d.victimName+' کشته شد — نقش: '+d.revealedRole));socket.on('notice',toast);
socket.on('meetingStart',d=>openMeeting('talk',d.endAt,d.reason,d.by));socket.on('meetingVote',d=>openMeeting('vote',d.endAt,'زمان رأی‌گیری',''));socket.on('meetingResult',d=>showMeetingResult(d));socket.on('voteAccepted',()=>toast('رأی شما ثبت شد'));
function openMeeting(phase,endAt,reason,by){$('meeting').classList.remove('hidden');$('meetingTitle').textContent=phase==='talk'?'📢 جلسه — زمان صحبت':'🗳️ رأی‌گیری';$('meetingReason').textContent=reason+(by?' توسط '+by:'');$('voteArea').classList.toggle('hidden',phase!=='vote');$('leaveMeeting').classList.add('hidden');$('meetingResult').innerHTML='';$('meetingClaims').innerHTML='';if(phase==='vote')buildVotes();tickMeeting(endAt,phase)}function tickMeeting(endAt,phase){clearInterval(window.meetTick);window.meetTick=setInterval(()=>{const sec=Math.max(0,Math.ceil((endAt-Date.now())/1000));$('meetingTimer').textContent=sec+' ثانیه';if(sec<=0){clearInterval(window.meetTick);if(phase==='talk')toast('وقت صحبت تمام شد؛ رأی بدهید')}},100);buildVotes()}
function buildVotes(){const area=$('voteList');area.innerHTML='';players.filter(p=>p.alive).forEach(p=>{const b=document.createElement('button');b.textContent='🗳️ '+p.name;b.className=p.id===myId?'self':'';b.onclick=()=>socket.emit('vote',{target:p.id});area.appendChild(b)})}$('skipVote').onclick=()=>socket.emit('vote',{target:'skip'});
function showMeetingResult(d){clearInterval(window.meetTick);$('meetingTitle').textContent='📊 نتیجه جلسه';$('meetingTimer').textContent='';$('voteArea').classList.add('hidden');$('meetingResult').innerHTML='<div class="resultLine">'+d.result+'</div>';const votes=d.votes||{};for(const [v,t] of Object.entries(votes)){const voter=players.find(p=>p.id===v)?.name||'玩家';const target=t==='skip'?'رد کردن':players.find(p=>p.id===t)?.name||'نامشخص';$('meetingResult').innerHTML+=`<div class="resultLine">${voter} ➜ ${target}</div>`}$('leaveMeeting').classList.remove('hidden')}$('leaveMeeting').onclick=()=>$('meeting').classList.add('hidden');
$('mapBtn').onclick=()=>{$('mapModal').classList.remove('hidden');mapOpen=true;drawBigMap()};$('closeMap').onclick=()=>{$('mapModal').classList.add('hidden');mapOpen=false};$('emergencyBtn').style.display='none';
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['z','x','c'].includes(k)){e.preventDefault();if(e.repeat)return;keyboardAction(k)}keys[k]=true});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
function keyboardAction(k){
 if(!me||!me.alive||meeting)return;
 if(k==='z'){
   const task=near(T.filter(t=>!tasksDone.includes(t.id)),125);
   if(task&&task.d<125){showMissionInfo(task);return}
   toast('🔧 برای انجام مأموریت به علامت قرمز نزدیک شوید.');
 }
 if(k==='x'){
   if(role!=='infiltrator'){toast('🔒 دکمه کشتن فقط برای خائن است.');return}
   const target=near(players.filter(p=>p.id!==myId&&p.alive),60);
   if(target&&target.d<=55){socket.emit('kill',{targetId:target.id});return}
   toast('🔪 برای کشتن باید خیلی نزدیک بازیکن باشید.');
 }
 if(k==='c'){
   const body=near(players.filter(p=>p.corpse),85);
   if(body&&body.d<75){socket.emit('report');return}
   if(Math.hypot(me.x-table.x,me.y-table.y)<115){socket.emit('emergency');return}
   toast('📢 برای جلسه کنار میز یا برای گزارش کنار جسد باشید.');
 }
}
function move(){if(!me||!me.alive)return;let x=0,y=0;if(keys.w||keys.arrowup)y--;if(keys.s||keys.arrowdown)y++;if(keys.a||keys.arrowleft)x--;if(keys.d||keys.arrowright)x++;x+=joy.x;y+=joy.y;let l=Math.hypot(x,y);if(l)socket.emit('move',{dx:x/Math.max(1,l),dy:y/Math.max(1,l)})}setInterval(move,100);
let drag=false;$('joystick').onpointerdown=e=>{drag=true;$('joystick').setPointerCapture(e.pointerId);jm(e)};$('joystick').onpointermove=e=>drag&&jm(e);$('joystick').onpointerup=()=>{drag=false;joy.x=joy.y=0;$('joy').style.transform='translate(0,0)'};function jm(e){let r=$('joystick').getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,l=Math.hypot(x,y),m=45;if(l>m){x=x/l*m;y=y/l*m}joy.x=x/m;joy.y=y/m;$('joy').style.transform=`translate(${x}px,${y}px)`}
function near(list,max){if(!me)return null;return list.map(x=>({...x,d:Math.hypot(me.x-x.x,me.y-x.y)})).sort((a,b)=>a.d-b.d)[0]||null}function worldToScreen(x,y,cam){return{x:x-cam.x,y:y-cam.y}}
function addBtn(text,cls,x,y,fn){const b=document.createElement('button');b.className='context '+cls;b.textContent=text;b.style.left=x+'px';b.style.top=y+'px';b.onclick=fn;$('contextButtons').appendChild(b)}
function renderContext(){if(!me||!me.alive){$('contextButtons').innerHTML='';return}const camx=Math.max(0,Math.min(W-innerWidth,me.x-innerWidth/2)),camy=Math.max(0,Math.min(H-innerHeight,me.y-innerHeight/2));$('contextButtons').innerHTML='';const task=near(T.filter(t=>!tasksDone.includes(t.id)),120);if(task&&task.d<125){
 const p=worldToScreen(task.x,task.y,{x:camx,y:camy});
 addBtn('🔧 انجام مأموریت','taskAction',p.x+18,p.y-48,()=>showMissionInfo(task));
}
const target=near(players.filter(p=>p.id!==myId&&p.alive),60);if(role==='infiltrator'&&target&&target.d<=55){const p=worldToScreen(target.x,target.y,{x:camx,y:camy});addBtn('🔪 کشتن','killAction',p.x,p.y,()=>socket.emit('kill',{targetId:target.id}))}
const body=near(players.filter(p=>p.corpse),85);if(body&&body.d<75){const p=worldToScreen(body.x,body.y,{x:camx,y:camy});addBtn('🚨 گزارش جسد','reportAction',p.x,p.y,()=>socket.emit('report'))}
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
    ctx.restore();
  }
});players.forEach(p=>{drawPlayer(p)});ctx.restore();if(!window._ctxStamp||performance.now()-window._ctxStamp>100){window._ctxStamp=performance.now();renderContext()}if(mapOpen&&(!window._mapStamp||performance.now()-window._mapStamp>180)){window._mapStamp=performance.now();drawBigMap()}}

const missionHelp={
card:["کارت دسترسی","کارت خودت را دو بار به چپ و راست بکش تا دستگاه چهره کارت را شناسایی کند.","وقتی شناسایی شد، روی «دریافت فایل» بزن؛ نوار دریافت ۱۰ ثانیه طول می‌کشد."],
wires:["سیم‌کشی برق","۵ سیم رنگی را به هم‌رنگ خود وصل کن.","سر سیم را با ماوس/لمس بگیر و بکش تا به سر سیم هم‌رنگ برسد."],
oxygen:["رفع نشتی اکسیژن","۳ لوله نشتی دارند. روی محل نشتی هر لوله بزن تا سوراخ بسته شود.","هر لوله فقط یک نشتی دارد؛ هر سه نشتی را پیدا و با کلیک تعمیر کن."],
mines:["حدس مین","از ۱۰ دایره، دقیقاً ۲ دایره مین هستند. هر دایره‌ای را که کلیک کنی یعنی حدس می‌زنی مین است.","اگر هر دو مین را درست حدس بزنی مأموریت تمام می‌شود؛ اگر روی دایره اشتباه بزنی مأموریت را می‌بازی و می‌توانی دوباره امتحان کنی."],
data:["دریافت فایل","اول کارت دارای صورت خودت را دو بار چپ و راست بکش تا دستگاه شناسایی‌ات کند. سپس فایل را دریافت کن.","نوار دریافت از ۰ تا ۱۰۰ در ۱۰ ثانیه پر می‌شود و با رسیدن به ۱۰۰٪ مأموریت تمام می‌شود."],
reactor:["راکتور","راکتور را پایدار کن.","عددها را به ترتیب درست فشار بده."],comms:["ارتباطات","ارتباط رادیویی را تنظیم کن.","موج‌ها را روی نقطه سبز قرار بده."],fuel:["سوخت موتور","مخزن موتور را پر کن.","اهرم انتقال سوخت را فعال کن و تا پر شدن مخزن صبر کن."],med:["اسکن پزشکی","نمونه را اسکن کن.","نمونه را داخل اسکنر بگذار و صبر کن نوار کامل شود."],nav:["ناوبری","مسیر سفینه را تنظیم کن.","نقطه مسیر را به مقصد مشخص‌شده بکش."]};
function showMissionInfo(t){let box=document.getElementById('missionInfo');if(!box){box=document.createElement('div');box.id='missionInfo';document.body.appendChild(box)}const h=missionHelp[t.kind]||['مأموریت','این مأموریت را انجام بده.','دستورهای روی پنجره را دنبال کن.'];box.innerHTML='<h2>🔧 '+h[0]+'</h2><p>'+h[1]+'</p><div class="hint">💡 راهنما: '+h[2]+'</div><button id="miStart">شروع مأموریت</button><button id="miClose">بستن</button>';box.classList.add('show');$('miStart').onclick=()=>{box.classList.remove('show');startMission(t)};$('miClose').onclick=()=>box.classList.remove('show')}
function closeMission(){const e=$('missionGame');if(e)e.remove()}
function missionOverlay(title,html){closeMission();const e=document.createElement('div');e.id='missionGame';e.className='missionGame';e.innerHTML='<div class="missionPanel"><button class="missionX" id="mx">✕</button><h2>'+title+'</h2><div class="missionContent">'+html+'</div></div>';document.body.appendChild(e);$('mx').onclick=closeMission;return e}
function doneTask(id){socket.emit('doTask',{taskId:id,proof:id});closeMission();toast('✅ مأموریت انجام شد')}
function startMission(t){
 if(!me||!me.alive)return;
 if(t.kind==='wires')return wiresMission(t);
 if(t.kind==='oxygen')return oxygenMission(t);
 if(t.kind==='mines')return minesMission(t);
 if(t.kind==='data')return dataMission(t);
 const e=missionOverlay('🔧 '+t.name,'<p>این مأموریت در نسخه بعدی جزئیات بیشتری خواهد داشت.</p><button id="genericDone">انجام شد</button>');$('genericDone').onclick=()=>doneTask(t.id);
}
function wiresMission(t){const colors=['قرمز','آبی','زرد','سبز','بنفش'],cs=['#ef476f','#118ab2','#ffd166','#06d6a0','#9b5de5'];let paired=0,selected=null,dragging=null;const e=missionOverlay('⚡ سیم‌کشی برق','<p>📱 گوشی: روی یک سیم بزن، سپس روی سیم هم‌رنگ در طرف مقابل بزن. با کشیدن انگشت هم می‌شود.</p><div id="wireBoard" class="wireBoard"></div>');const b=$('wireBoard');let left=[0,1,2,3,4],right=[0,1,2,3,4];left.sort(()=>Math.random()-.5);right.sort(()=>Math.random()-.5);function clearSel(){b.querySelectorAll('.wireNode').forEach(x=>x.classList.remove('selected'));selected=null;dragging=null}function finish(i){if(!Number.isInteger(i))return;const nodes=[...b.querySelectorAll('.wireNode')];nodes.filter(x=>+x.dataset.i===i).forEach(x=>x.classList.add('matched'));paired++;clearSel();if(paired>=5)setTimeout(()=>doneTask(t.id),250)}function choose(d){if(d.classList.contains('matched'))return;if(!selected){selected=d;d.classList.add('selected');return}if(selected!==d&&selected.dataset.side!==d.dataset.side&&+selected.dataset.i===+d.dataset.i){finish(+d.dataset.i)}else{clearSel();selected=d;d.classList.add('selected')}}function add(i,id){const d=document.createElement('button');d.type='button';d.className='wireNode';d.dataset.i=i;d.dataset.side=id;d.style.borderColor=cs[i];d.style.color=cs[i];d.textContent='● '+colors[i];d.addEventListener('click',()=>choose(d));d.addEventListener('pointerdown',ev=>{if(d.classList.contains('matched'))return;dragging=d;try{d.setPointerCapture(ev.pointerId)}catch(_){} });d.addEventListener('pointerup',ev=>{if(!dragging||dragging===d){dragging=null;return}choose(d);dragging=null});return d}function render(){b.innerHTML='<div class="wireCol" id="wl"></div><div class="wireCol" id="wr"></div>';left.forEach(i=>$('wl').appendChild(add(i,'left')));right.forEach(i=>$('wr').appendChild(add(i,'right')))}render()}
function oxygenMission(t){const leaks=[{x:20,y:42},{x:52,y:58},{x:78,y:35}];const e=missionOverlay('🫧 رفع نشتی اکسیژن','<p>روی هر سه نشتی کلیک کن تا لوله بسته شود.</p><div id="pipes" class="pipes"></div>');const p=$('pipes');leaks.forEach((q,i)=>{const d=document.createElement('button');d.className='leak';d.style.left=q.x+'%';d.style.top=q.y+'%';d.textContent='💧';d.onclick=()=>{if(d.classList.contains('fixed'))return;d.classList.add('fixed');d.textContent='✓';if(p.querySelectorAll('.fixed').length===3)setTimeout(()=>doneTask(t.id),300)};p.appendChild(d)})}
function minesMission(t){if(!lastMinePositions||lastMinePositions.size!==2){lastMinePositions=new Set();while(lastMinePositions.size<2)lastMinePositions.add(Math.floor(Math.random()*10))}const mines=new Set(lastMinePositions);let hits=0;const e=missionOverlay('💣 حدس مین','<p>۲ مین را از بین ۱۰ دایره پیدا کن.</p><div id="mineGrid" class="mineGrid"></div><div id="mineMsg"></div>');const g=$('mineGrid');for(let i=0;i<10;i++){const b=document.createElement('button');b.className='mineCircle';b.textContent=i+1;b.onclick=()=>{if(b.disabled)return;if(mines.has(i)){b.disabled=true;b.classList.add('good');b.textContent='💣';hits++;if(hits===2){setTimeout(()=>doneTask(t.id),500)}}else{b.disabled=true;b.classList.add('bad');b.textContent='✕';$('mineMsg').textContent='❌ این دایره مین نبود؛ این مرحله را دوباره امتحان کن.';setTimeout(()=>{closeMission();minesMission(t)},700)}};g.appendChild(b)}}
function dataMission(t){let swipes=0,lastDir=0,phase='scan';const e=missionOverlay('📁 دریافت فایل','<div id="dataStage"><div class="faceCard" id="faceCard">🙂<b>'+escapeHtml(me?.name||'بازیکن')+'</b><span>← بکش →</span></div><p>کارت را دو بار به چپ و راست بکش.</p><div id="dataMsg"></div></div>');const card=$('faceCard');let sx=0,down=false;function finishScan(){phase='ready';$('dataStage').innerHTML='<div class="deviceOk">✅ چهره شناسایی شد</div><button id="downloadFile">📥 دریافت فایل</button><div id="progressWrap" class="progressWrap hidden"><div id="progressBar"></div></div><div id="fileResult"></div>';$('downloadFile').onclick=download}card.onpointerdown=ev=>{down=true;sx=ev.clientX;card.setPointerCapture(ev.pointerId)};card.onpointerup=ev=>{if(!down)return;const dx=ev.clientX-sx;down=false;if(Math.abs(dx)>70&&Math.sign(dx)!==lastDir){lastDir=Math.sign(dx);swipes++;card.style.transform='translateX('+Math.sign(dx)*45+'px)';setTimeout(()=>card.style.transform='',120);if(swipes>=2)finishScan()}};function download(){if(phase!=='ready')return;phase='downloading';$('downloadFile').disabled=true;$('progressWrap').classList.remove('hidden');$('progressBar').style.width='0%';$('fileResult').innerHTML='';const st=performance.now();function prog(now){const pct=Math.min(100,((now-st)/10000)*100);$('progressBar').style.width=pct.toFixed(2)+'%';if(pct<100)requestAnimationFrame(prog);else{phase='done';doneTask(t.id)}}requestAnimationFrame(prog)} }
function escapeHtml(x){return String(x).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
let lastMinePositions=null;

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
    // نام بخش‌ها فقط داخل نقشه نمایش داده می‌شود.
  });

  // درهای روشن در نقاط اتصال
  const doors=[[700,700,0,90],[700,900,0,90],[1700,700,0,90],[1700,900,0,90],
               [1050,350,90,0],[1350,350,90,0],[1050,1250,90,0],[1350,1250,90,0]];
  ctx.fillStyle='#72b8c9';doors.forEach(d=>{
    if(d[2])ctx.fillRect(d[0],d[1],d[2],10);else ctx.fillRect(d[0],d[1],10,d[3]);
  });

  ctx.save();ctx.strokeStyle='#000';ctx.fillStyle='rgba(0,0,0,.9)';ctx.lineWidth=12;wallRects.forEach(w=>{ctx.fillRect(w[0],w[1],w[2],w[3]);});ctx.restore();

  // میز جلسه
  ctx.fillStyle='#536c78';ctx.beginPath();ctx.arc(table.x,table.y,70,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffd34d';ctx.beginPath();ctx.arc(table.x,table.y,47,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.font='bold 15px Tahoma';ctx.fillText('میز جلسه',table.x,table.y+5);
}
function drawSabotages(){sabotages.forEach(s=>{ctx.fillStyle='#e33e52';ctx.beginPath();ctx.arc(s.x||0,s.y||0,28,0,7);ctx.fill()})}
function drawPlayer(p){
  if(!p.alive && !p.corpse)return;
  ctx.save();ctx.translate(p.x,p.y);
  if(p.corpse){
    ctx.rotate(-0.18);
    ctx.fillStyle='#8b3f4b';ctx.strokeStyle='#3b2026';ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(0,10,25,13,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(-8,-3,12,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#c9f1ff';ctx.beginPath();ctx.roundRect(-5,-7,16,9,5);ctx.fill();
    ctx.fillStyle='#16364b';ctx.beginPath();ctx.roundRect(-3,-5,12,6,3);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='13px Tahoma';ctx.textAlign='center';ctx.fillText(p.name,0,34);
    ctx.restore();return;
  }

  // شخصیت‌ها مستقیماً از تصویر مرجع ساخته‌شده برای بازی استفاده می‌شوند.
  const shape=p.shape||'classic';
  const shapeIndex=Math.max(0,FREE_SKINS.findIndex(x=>x[1]===shape));
  const artCol=ART_COLS[Math.min(shapeIndex,ART_COLS.length-1)];
  const colorIndex=ART_COLOR_INDEX.get(String(p.color||'').toLowerCase());
  const row=Number.isInteger(colorIndex)?colorIndex:1;
  const sx=ART_X[artCol], sy=ART_Y[row], sw=ART_X[artCol+1]-sx, sh=ART_Y[row+1]-sy;
  const dw=72, dh=62;
  if(CHARACTER_ART.complete && CHARACTER_ART.naturalWidth){
    ctx.imageSmoothingEnabled=true;
    ctx.drawImage(CHARACTER_ART,sx,sy,sw,sh,-dw/2,-dh/2,dw,dh);
  }else{
    ctx.fillStyle=p.color||'#4fc3f7';ctx.beginPath();ctx.roundRect(-22,-26,44,52,18);ctx.fill();
  }

  ctx.fillStyle='#fff';ctx.font='14px Tahoma';ctx.textAlign='center';ctx.fillText(p.name,0,-42);
  if(performance.now()<roleTimer&&p.id===myId){ctx.fillStyle=role==='infiltrator'?'#d92742':'#267ee8';ctx.font='bold 22px Tahoma';ctx.fillText(role==='infiltrator'?'خائن':'خدمه',0,-63)}
  if(role==='infiltrator'&&partners.includes(p.name)&&p.id!==myId){ctx.fillStyle='#e32643';ctx.font='bold 14px Tahoma';ctx.fillText(p.name,0,-56)}
  ctx.restore();
}
function drawBigMap(){
 if(!bigMap.clientWidth||!bigMap.clientHeight)return;
 const w=bigMap.clientWidth,h=bigMap.clientHeight,dpr=window.devicePixelRatio||1;
 const rw=Math.round(w*dpr),rh=Math.round(h*dpr);
 if(bigMap.width!==rw||bigMap.height!==rh){bigMap.width=rw;bigMap.height=rh;}
 bctx.setTransform(dpr,0,0,dpr,0,0);
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
