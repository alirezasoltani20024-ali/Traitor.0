const socket=io();const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d'),bigMap=$('bigMap'),bctx=bigMap.getContext('2d');let myId=null,room='',players=[],me=null,role='crew',partners=[],tasksDone=[],sabotages=[],meeting=null,keys={},joy={x:0,y:0},mapOpen=false,sabotageOpen=false,roleTimer=0;const W=2400,H=1600,vision=9999;
const T=[{id:'wires',x:790,y:690,name:'سیم‌کشی برق',room:'برق',kind:'wires'},{id:'oxygen',x:2050,y:650,name:'رفع نشتی اکسیژن',room:'اکسیژن',kind:'oxygen'},{id:'mines',x:2050,y:290,name:'حدس مین',room:'ارتباطات',kind:'mines'},{id:'data',x:1570,y:290,name:'دریافت فایل',room:'ناوبری',kind:'data'}];
const V=[{id:'v1',name:'کافه',x:430,y:330},{id:'v2',name:'برق',x:780,y:800},{id:'v3',name:'موتور',x:430,y:1330},{id:'v4',name:'راکتور',x:430,y:1080},{id:'v5',name:'ناوبری',x:1960,y:330},{id:'v6',name:'ارتباطات',x:1960,y:1330},{id:'v7',name:'درمانگاه',x:1960,y:1080},{id:'v8',name:'انبار',x:1200,y:930}];
const S=[{id:'electric',x:790,y:650,name:'برق'},{id:'oxygen',x:2050,y:650,name:'اکسیژن'},{id:'reactorSab',x:350,y:1250,name:'راکتور'}];const wallRects=[[0,0,2400,45],[0,1555,2400,45],[0,0,45,1600],[2355,0,45,1600],[180,140,520,55],[180,140,55,350],[645,140,55,350],[1700,140,520,55],[1700,140,55,350],[2165,140,55,350],[180,1170,520,55],[180,1170,55,330],[645,1170,55,330],[1700,1170,520,55],[1700,1170,55,330],[2165,1170,55,330],[850,140,55,220],[850,455,55,430],[850,975,55,220],[1495,140,55,220],[1495,455,55,430],[1495,975,55,220],[700,570,150,55],[1550,570,150,55],[700,975,150,55],[1550,975,150,55],[1030,140,55,120],[1315,140,55,120],[1030,1180,55,265],[1315,1180,55,265]];
const table={x:1200,y:800};
const rooms=[['کافه',180,140,520,350],['برق',700,570,150,430],['موتور',180,1170,520,330],['راکتور',180,1030,520,120],['ناوبری',1700,140,520,350],['ارتباطات',1700,1170,520,330],['درمانگاه',1700,1030,520,120],['انبار',1000,570,400,430],['بال چپ',500,500,500,70],['بال راست',1400,500,500,70]];
const FREE_COLORS=[['قرمز','#ff5f6d'],['آبی','#4fc3f7'],['زرد','#ffd166'],['سبز','#55d68a'],['بنفش','#a78bfa'],['نارنجی','#ff9f43'],['آبی تیره','#4d96ff'],['مرجانی','#ff7f50'],['فیروزه‌ای','#00c2a8'],['صورتی','#e85dff']];
const FREE_SKINS=[['ساده','classic','🧑‍🚀'],['مربع','square','⬛'],['لوزی','diamond','🔶'],['شش‌ضلعی','hex','⬡'],['گربه','cat','🐱'],['ربات','robot','🤖'],['روح','ghost','👻'],['نینجا','ninja','🥷'],['ستاره','star','⭐'],['تاج','crown','👑'],['ماینکرفتی','minecraft','🟩']];
function initSkinShop(){const modal=$('skinShop'),colors=$('colorGrid'),grid=$('skinGrid'),open=$('skinShopBtn'),close=$('closeSkinShop');if(!modal||!grid||!open)return;colors.innerHTML='';grid.innerHTML='';const selectedColor=()=>localStorage.getItem('skinColor')||'#4fc3f7';const selectedShape=()=>localStorage.getItem('skinShape')||'classic';FREE_COLORS.forEach(([name,color])=>{const b=document.createElement('button');b.type='button';b.style.cssText='min-height:60px;background:'+color+';color:#fff;border:3px solid '+(selectedColor()===color?'#111':'#fff')+';border-radius:14px;text-shadow:0 1px 3px #000;font-size:15px;box-shadow:0 4px 12px #2345';b.textContent='🎨 '+name;b.onclick=()=>{localStorage.setItem('skinColor',color);if(socket.connected)socket.emit('setSkin',{color});initSkinShop();toast('✅ رنگ '+name+' انتخاب شد')};colors.appendChild(b)});FREE_SKINS.forEach(([name,shape,icon])=>{const b=document.createElement('button');b.type='button';b.style.cssText='min-height:85px;background:linear-gradient(135deg,#24364a,#14212d);color:#fff;border:3px solid '+(selectedShape()===shape?'#ffd166':'#ffffff55')+';border-radius:16px;font-size:16px;box-shadow:0 5px 16px #2345';b.textContent=icon+' '+name;b.onclick=()=>{localStorage.setItem('skinShape',shape);if(socket.connected)socket.emit('setSkin',{shape,color:selectedColor()});initSkinShop();toast('✅ اسکین '+name+' انتخاب شد')};grid.appendChild(b)});open.onclick=()=>{initSkinShop();modal.classList.remove('hidden')};close.onclick=()=>modal.classList.add('hidden')}

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
    ctx.fillStyle='#315765';ctx.font='bold 22px Tahoma';ctx.textAlign='center';
    ctx.fillText(r[0],r[1]+r[3]/2,r[2]+34);
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
function drawUndergroundTunnels(){if(role!=='infiltrator')return;const pts=V.map(v=>[v.x,v.y]);ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='rgba(35,28,52,.55)';ctx.lineWidth=70;[[0,1],[1,7],[7,5],[5,6],[6,4],[4,0],[1,2],[2,3],[3,7]].forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(pts[a][0],pts[a][1]);ctx.lineTo(pts[b][0],pts[b][1]);ctx.stroke()});ctx.strokeStyle='#9b35d6';ctx.lineWidth=10;[[0,1],[1,7],[7,5],[5,6],[6,4],[4,0],[1,2],[2,3],[3,7]].forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(pts[a][0],pts[a][1]);ctx.lineTo(pts[b][0],pts[b][1]);ctx.stroke()});V.forEach(v=>{ctx.fillStyle='#14101d';ctx.beginPath();ctx.arc(v.x,v.y,34,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#c05cff';ctx.lineWidth=6;ctx.stroke();ctx.fillStyle='#fff';ctx.font='bold 13px Tahoma';ctx.textAlign='center';ctx.fillText('🕳️',v.x,v.y+5);});ctx.restore()}
function drawSabotages(){sabotages.forEach(s=>{ctx.fillStyle='#e33e52';ctx.beginPath();ctx.arc(s.x||0,s.y||0,28,0,7);ctx.fill()})}
function drawPlayer(p){if(!p.alive){ctx.fillStyle='#9a9a9a';ctx.fillRect(p.x-25,p.y-8,50,16);ctx.fillStyle='#e33b4f';ctx.beginPath();ctx.arc(p.x,p.y-12,13,0,7);ctx.fill();return}ctx.save();ctx.translate(p.x,p.y);const sh=p.shape||'classic';ctx.fillStyle=p.color;ctx.strokeStyle='rgba(20,40,55,.35)';ctx.lineWidth=3;ctx.beginPath();if(sh==='square'){ctx.roundRect(-22,-26,44,52,7)}else if(sh==='diamond'){ctx.moveTo(0,-30);ctx.lineTo(25,0);ctx.lineTo(0,30);ctx.lineTo(-25,0);ctx.closePath()}else if(sh==='hex'){for(let i=0;i<6;i++){const a=Math.PI/6+i*Math.PI/3;const x=Math.cos(a)*27,y=Math.sin(a)*30;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath()}else if(sh==='cat'){ctx.moveTo(-22,18);ctx.lineTo(-24,-22);ctx.lineTo(-8,-14);ctx.quadraticCurveTo(0,-30,8,-14);ctx.lineTo(24,-22);ctx.lineTo(22,18);ctx.quadraticCurveTo(0,31,-22,18);ctx.closePath()}else if(sh==='robot'){ctx.roundRect(-23,-25,46,50,5)}else if(sh==='ghost'){ctx.moveTo(-23,18);ctx.lineTo(-23,-8);ctx.quadraticCurveTo(-23,-30,0,-30);ctx.quadraticCurveTo(23,-30,23,-8);ctx.lineTo(23,18);ctx.lineTo(12,10);ctx.lineTo(0,18);ctx.lineTo(-12,10);ctx.closePath()}else if(sh==='ninja'){ctx.moveTo(-20,22);ctx.lineTo(-27,-4);ctx.lineTo(-18,-28);ctx.lineTo(18,-28);ctx.lineTo(27,-4);ctx.lineTo(20,22);ctx.quadraticCurveTo(0,32,-20,22);ctx.closePath()}else if(sh==='star'){for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?13:29,x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath()}else if(sh==='crown'){ctx.moveTo(-25,18);ctx.lineTo(-28,-20);ctx.lineTo(-12,-7);ctx.lineTo(0,-25);ctx.lineTo(12,-7);ctx.lineTo(28,-20);ctx.lineTo(25,18);ctx.closePath()}else if(sh==='minecraft'){ctx.rect(-24,-27,48,54)}else{ctx.roundRect(-22,-26,44,52,18)}ctx.fill();ctx.stroke();ctx.fillStyle='#c9f1ff';ctx.beginPath();ctx.roundRect(-8,-17,25,15,8);ctx.fill();ctx.fillStyle='#16364b';ctx.beginPath();ctx.roundRect(-4,-14,19,9,5);ctx.fill();if(sh==='robot'){ctx.fillStyle='#fff';ctx.fillRect(-15,15,7,5);ctx.fillRect(8,15,7,5)}if(sh==='minecraft'){ctx.fillStyle='#5b3718';ctx.fillRect(-24,14,48,13);ctx.fillStyle='#75b943';ctx.fillRect(-24,-27,48,12);ctx.fillStyle='#8b5a2b';ctx.fillRect(-16,-15,10,9);ctx.fillRect(6,-15,10,9)}if(sh==='crown'){ctx.fillStyle='#ffe066';ctx.font='18px Arial';ctx.textAlign='center';ctx.fillText('♛',0,-31)}ctx.fillStyle='#fff';ctx.font='14px Tahoma';ctx.textAlign='center';ctx.fillText(p.name,0,-35);if(p.id===myId){ctx.strokeStyle='#23384a';ctx.lineWidth=3;ctx.stroke()}if(performance.now()<roleTimer&&p.id===myId){ctx.fillStyle=role==='infiltrator'?'#d92742':'#267ee8';ctx.font='bold 22px Tahoma';ctx.fillText(role==='infiltrator'?'خائن':'خدمه',0,-62)}if(role==='infiltrator'&&partners.includes(p.name)&&p.id!==myId){ctx.fillStyle='#e32643';ctx.font='bold 14px Tahoma';ctx.fillText(p.name,0,-52)}ctx.restore()}
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
