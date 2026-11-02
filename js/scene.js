// ================= 2D BATTLE SCENE (canvas) =================
// Stages listed in SCENES get an animated canvas scene; the others keep the emoji arena.
// boss.js calls: sceneStart, sceneHeroAttack, sceneBossAttack, sceneHeal, sceneBossDie, sceneHeroDie.
const SW=640,SH=320,GY=280,HX=150,BX=470; // logical canvas size, ground line, hero/boss x
const calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
let SC=null; // state of the running scene, null when the stage has no scene

// ---------- helpers ----------
const ease=k=>1-Math.pow(1-Math.min(1,Math.max(0,k)),3);
const rnd=(a,b)=>a+Math.random()*(b-a);
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function ell(c,x,y,rx,ry,fill,rot=0){c.beginPath();c.ellipse(x,y,rx,ry,rot,0,Math.PI*2);c.fillStyle=fill;c.fill()}
const FONT='"Be Vietnam Pro",system-ui,sans-serif';

// ---------- lifecycle ----------
function sceneStart(i){
  const def=SCENES[i];$('arena').classList.toggle('scene',!!def);
  if(!def){SC=null;return}
  const cv=$('scene'),dpr=Math.min(2,window.devicePixelRatio||1);
  cv.width=SW*dpr;cv.height=SH*dpr;
  const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
  const bg=document.createElement('canvas');bg.width=SW*dpr;bg.height=SH*dpr;
  const bc=bg.getContext('2d');bc.setTransform(dpr,0,0,dpr,0,0);def.bg(bc);
  const me=SC={def,c,bg,t:0,prev:performance.now(),shake:0,parts:[],shots:[],nums:[],
    hero:{cast:-9,hurt:-9,dead:0,win:0},boss:{atk:-9,hit:-9,dead:0,burst:false}};
  const frame=now=>{
    if(SC!==me||!$('battle').classList.contains('show'))return; // stops when the battle screen closes
    const dt=Math.min(.05,(now-me.prev)/1000);me.prev=now;me.t+=dt;
    sceneUpdate(me,dt);sceneDraw(me);requestAnimationFrame(frame)};
  requestAnimationFrame(frame);
}
const sceneRage=()=>B&&B.bossHp>0&&B.bossHp/B.c.hp<.3;

// ---------- events from the battle ----------
function sceneHeroAttack(word,dmg,power){ // power: 0 normal, 1 combo, 2 rage potion
  const s=SC;s.hero.cast=s.t;
  s.shots.push({k:'word',word,dmg,power,x0:HX+40,y0:GY-118,x1:BX-10,y1:GY-120,t0:s.t+.18,dur:.42});
}
function sceneBossAttack(dmg,blocked){
  const s=SC;s.boss.atk=s.t;
  for(let j=0;j<3;j++)s.shots.push({k:'paper',first:j===0,dmg,blocked,x0:BX-70,y0:GY-130,x1:HX+12+j*6,y1:GY-70-j*10,t0:s.t+.22+j*.09,dur:.48,spin:rnd(6,10)});
}
function sceneHeal(n){
  const s=SC;s.nums.push({txt:'+'+n,x:HX,y:GY-140,t0:s.t,color:'#22c55e'});
  for(let j=0;j<14;j++)s.parts.push({k:'plus',x:HX+rnd(-30,30),y:GY-rnd(10,110),vx:0,vy:rnd(-60,-30),g:0,life:1,max:1,size:rnd(5,9),color:'#22c55e'});
}
function sceneBossDie(){SC.boss.dead=SC.t}
function sceneHeroDie(){SC.hero.dead=SC.t}

// ---------- simulation ----------
function burst(s,x,y,n,kind,colors,speed=220){
  for(let j=0;j<n;j++){const a=rnd(0,Math.PI*2),v=rnd(.3,1)*speed;
    s.parts.push({k:kind,x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-60,g:kind==='feather'?60:420,life:rnd(.5,1.1),max:1.1,size:rnd(3,7),color:pick(colors),rot:rnd(0,6),vr:rnd(-6,6)})}
}
function sceneUpdate(s,dt){
  s.shake=Math.max(0,s.shake-dt*30);
  for(const p of s.parts){p.life-=dt;p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.k==='feather'){p.vx*=.97;p.vy=Math.min(p.vy,40)}if(p.rot!=null)p.rot+=p.vr*dt}
  s.parts=s.parts.filter(p=>p.life>0);
  s.nums=s.nums.filter(n=>s.t-n.t0<1.1);
  for(const sh of s.shots){
    const k=(s.t-sh.t0)/sh.dur;if(k<0||sh.done)continue;
    if(sh.k==='word'&&Math.random()<.8)s.parts.push({k:'dot',x:shotX(sh,k),y:shotY(sh,k),vx:rnd(-20,20),vy:rnd(-20,20),g:0,life:.35,max:.35,size:rnd(2,4),color:['#c4b5fd','#fcd34d','#fca5a5'][sh.power]});
    if(k<1)continue;sh.done=true;
    if(sh.k==='word'){ // impact on the boss
      s.boss.hit=s.t;s.shake=calm?0:6+sh.power*4;
      burst(s,sh.x1,sh.y1,18+sh.power*10,'feather',['#8b5a2b','#a16207','#e9cfa3']);
      burst(s,sh.x1,sh.y1,14,'spark',['#fde68a','#ffffff',sh.power===2?'#ef4444':'#a78bfa'],320);
      s.nums.push({txt:'-'+sh.dmg+(sh.power?' 💥':''),x:BX-20,y:GY-160,t0:s.t,color:sh.power?'#f59e0b':'#ef4444',big:sh.power>0});
    }else if(sh.blocked){
      burst(s,HX+40,sh.y1,6,'spark',['#93c5fd','#ffffff'],200);
      if(sh.first)s.nums.push({txt:'🛡️ Chặn!',x:HX,y:GY-150,t0:s.t,color:'#3b82f6'});
    }else{
      if(sh.first){s.hero.hurt=s.t;s.shake=calm?0:7;s.nums.push({txt:'-'+sh.dmg,x:HX,y:GY-150,t0:s.t,color:'#ef4444'})}
      burst(s,sh.x1,sh.y1,8,'dot',['#ef4444','#ffffff'],180);
    }
  }
  s.shots=s.shots.filter(sh=>!sh.done);
  const b=s.boss;
  if(b.dead&&!b.burst&&s.t-b.dead>.75){b.burst=true;s.shake=calm?0:12;
    burst(s,BX,GY-90,50,'feather',['#8b5a2b','#a16207','#e9cfa3','#78350f'],300);
    burst(s,BX,GY-90,16,'smoke',['#e5e7eb','#d1d5db'],90);
    burst(s,BX,GY-90,24,'spark',['#fde68a','#f59e0b','#ffffff'],380);
    s.hero.win=s.t+.2}
  if(sceneRage()&&Math.random()<dt*6)s.parts.push({k:'smoke',x:BX+rnd(-40,40),y:GY-200,vx:rnd(-10,10),vy:rnd(-50,-30),g:0,life:.9,max:.9,size:rnd(3,6),color:'rgba(248,113,113,.55)'});
}
const shotX=(sh,k)=>sh.x0+(sh.x1-sh.x0)*k;
const shotY=(sh,k)=>sh.y0+(sh.y1-sh.y0)*k-Math.sin(k*Math.PI)*(sh.k==='word'?60:80);

// ---------- drawing ----------
function sceneDraw(s){
  const c=s.c;c.save();c.clearRect(0,0,SW,SH);
  if(s.shake)c.translate(rnd(-s.shake,s.shake),rnd(-s.shake,s.shake));
  c.drawImage(s.bg,-10,-10,SW+20,SH+20);
  s.def.live&&s.def.live(c,s);
  if(sceneRage()){const g=c.createRadialGradient(SW/2,SH/2,SH*.35,SW/2,SH/2,SH*.9);g.addColorStop(0,'rgba(239,68,68,0)');g.addColorStop(1,`rgba(239,68,68,${.22+Math.sin(s.t*5)*.08})`);c.fillStyle=g;c.fillRect(-10,-10,SW+20,SH+20)}
  s.def.boss(c,s);drawHero(c,s);
  for(const sh of s.shots){const k=(s.t-sh.t0)/sh.dur;if(k<0)continue;const x=shotX(sh,k),y=shotY(sh,k);
    sh.k==='word'?drawWordShot(c,sh,x,y):drawPaper(c,x,y,(s.t-sh.t0)*sh.spin)}
  for(const p of s.parts)drawPart(c,p);
  for(const n of s.nums){const k=(s.t-n.t0)/1.1;c.save();c.globalAlpha=1-Math.max(0,k-.6)/.4;
    c.font=`900 ${n.big?32:26}px ${FONT}`;c.textAlign='center';c.lineWidth=5;c.strokeStyle='rgba(15,23,42,.75)';
    const y=n.y-ease(k)*40;c.strokeText(n.txt,n.x,y);c.fillStyle=n.color;c.fillText(n.txt,n.x,y);c.restore()}
  c.restore();drawHud(c,s);
}

// ---------- HUD on the canvas (HP bars, boss line), so the pinned scene shows everything ----------
function drawHud(c,s){
  if(!B)return;const dt=Math.min(.05,s.t-(s.hudT||0));s.hudT=s.t;
  const bars=[[B.hp/B.max,'hero'],[B.bossHp/B.c.hp,'boss']];
  for(const [v,k] of bars){s[k+'Hp']=s[k+'Hp']??v;s[k+'Ghost']=s[k+'Ghost']??v;
    s[k+'Hp']+=(v-s[k+'Hp'])*Math.min(1,dt*10);s[k+'Ghost']+=(Math.min(s[k+'Ghost'],v)===v?(v-s[k+'Ghost'])*Math.min(1,dt*2.2):(v-s[k+'Ghost']))}
  hpBar(c,s,14,12,'Bạn',`${B.hp}/${B.max}`,s.heroHp,s.heroGhost,['#22c55e','#84cc16'],'left');
  hpBar(c,s,SW-14,12,B.c.b.n+(sceneRage()?' 😡':''),`${B.bossHp}/${B.c.hp}`,s.bossHp,s.bossGhost,['#ef4444','#f97316'],'right');
  const bt=s.t-.9;if(bt>0&&bt<3.6){ // boss taunt bubble after it flies in
    c.save();c.globalAlpha=Math.min(1,bt*4,(3.6-bt)*3);c.font=`italic 600 14px ${FONT}`;
    const lines=wrapText(c,B.c.b.l,230),w=Math.max(...lines.map(l=>c.measureText(l).width))+24,h=lines.length*19+14,x=BX-110-w,y=GY-216;
    rr(c,x,y,w,h,12);c.fillStyle='rgba(255,255,255,.95)';c.fill();c.strokeStyle='#cbd5e1';c.lineWidth=1.5;c.stroke();
    c.beginPath();c.moveTo(x+w-18,y+h);c.lineTo(x+w+4,y+h+14);c.lineTo(x+w-34,y+h);c.closePath();c.fill();
    c.fillStyle='#1e1b2e';lines.forEach((l,j)=>c.fillText(l,x+12,y+24+j*19));c.restore()}
}
function hpBar(c,s,x,y,name,txt,v,ghost,cols,side){
  const w=200,h=12,x0=side==='left'?x:x-w;
  c.save();c.font=`800 14px ${FONT}`;c.textAlign=side;c.lineWidth=4;c.strokeStyle='rgba(255,255,255,.9)';
  c.strokeText(name,x,y+12);c.fillStyle='#1e1b2e';c.fillText(name,x,y+12);
  rr(c,x0-2,y+18,w+4,h+4,8);c.fillStyle='rgba(15,23,42,.55)';c.fill();
  rr(c,x0,y+20,Math.max(0,w*ghost),h,6);c.fillStyle='#fff';c.fill();
  const g=c.createLinearGradient(x0,0,x0+w,0);g.addColorStop(0,cols[0]);g.addColorStop(1,cols[1]);
  rr(c,x0,y+20,Math.max(0,w*v),h,6);c.fillStyle=g;c.fill();
  c.font=`700 11px ${FONT}`;c.textAlign=side;c.strokeText(txt,x,y+46);c.fillStyle='#334155';c.fillText(txt,x,y+46);c.restore();
}
function wrapText(c,txt,max){const out=[];let cur='';for(const w of txt.split(' ')){const n=cur?cur+' '+w:w;if(c.measureText(n).width>max&&cur){out.push(cur);cur=w}else cur=n}if(cur)out.push(cur);return out}
function drawPart(c,p){
  const a=Math.max(0,p.life/p.max);c.save();c.globalAlpha=Math.min(1,a*1.5);
  if(p.k==='feather'){c.translate(p.x,p.y);c.rotate(p.rot);ell(c,0,0,p.size*1.6,p.size*.6,p.color)}
  else if(p.k==='spark'){c.strokeStyle=p.color;c.lineWidth=2.5;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x-p.vx*.04,p.y-p.vy*.04);c.stroke()}
  else if(p.k==='smoke'){ell(c,p.x,p.y,p.size*(2.2-a),p.size*(2.2-a),p.color)}
  else if(p.k==='plus'){c.fillStyle=p.color;c.fillRect(p.x-p.size/2,p.y-1.5,p.size,3);c.fillRect(p.x-1.5,p.y-p.size/2,3,p.size)}
  else ell(c,p.x,p.y,p.size,p.size,p.color);
  c.restore();
}
function drawWordShot(c,sh,x,y){
  const col=['#7c3aed','#f59e0b','#ef4444'][sh.power],sz=[14,16,18][sh.power];
  c.save();c.font=`800 ${sz}px ${FONT}`;const w=c.measureText(sh.word).width+22,h=sz+14;
  c.shadowColor=col;c.shadowBlur=18;rr(c,x-w/2,y-h/2,w,h,h/2);c.fillStyle=col;c.fill();
  c.shadowBlur=0;c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';c.fillText(sh.word,x,y+1);c.restore();
}
function drawPaper(c,x,y,rot){
  c.save();c.translate(x,y);c.rotate(rot);c.fillStyle='#fff';c.strokeStyle='#cbd5e1';c.lineWidth=1;
  c.fillRect(-10,-13,20,26);c.strokeRect(-10,-13,20,26);c.fillStyle='#dc2626';c.font=`900 17px ${FONT}`;
  c.textAlign='center';c.textBaseline='middle';c.fillText('F',0,1);c.restore();
}

// ---------- hero: student with a giant pencil ----------
function drawHero(c,s){
  const h=s.hero,t=s.t;let x=HX,y=GY,rot=0,arm=-.25+Math.sin(t*3)*.06,breathe=1+Math.sin(t*3)*.015;
  const ck=(t-h.cast)/.5;if(ck>=0&&ck<1){const k=Math.sin(ck*Math.PI);x+=k*22;arm=-.25-k*1.9}
  const hk=(t-h.hurt)/.45,hurt=hk>=0&&hk<1;if(hurt)x-=Math.sin(hk*Math.PI)*18;
  if(h.win&&t>h.win)y-=Math.abs(Math.sin((t-h.win)*7))*22;
  if(h.dead)rot=-ease((t-h.dead)/.6)*1.45;
  const intro=ease(t/.6);x-=(1-intro)*120;
  ell(c,x,GY+4,34*(h.dead?1.4:1),7,'rgba(15,23,42,.18)');
  c.save();c.translate(x,y);c.rotate(rot);c.scale(1,breathe);c.globalAlpha=intro;
  // legs + shoes
  c.fillStyle='#334155';rr(c,-15,-32,12,32,5);c.fill();rr(c,3,-32,12,32,5);c.fill();
  ell(c,-9,-1,10,5,'#111827');ell(c,10,-1,10,5,'#111827');
  // hoodie
  c.fillStyle='#6d28d9';rr(c,-22,-78,44,50,14);c.fill();
  c.fillStyle='#8b5cf6';rr(c,-22,-44,44,10,4);c.fill();
  c.fillStyle='#ede9fe';c.font=`900 13px ${FONT}`;c.textAlign='center';c.fillText('6.5',0,-52);
  // back arm
  c.save();c.translate(-18,-70);c.rotate(.25+Math.sin(t*3)*.05);c.fillStyle='#5b21b6';rr(c,-5,0,10,28,5);c.fill();ell(c,0,30,6,6,'#f9d4b0');c.restore();
  // head
  ell(c,0,-100,24,24,'#f9d4b0');
  c.fillStyle='#3b2a20';c.beginPath();c.arc(0,-104,25,Math.PI*1.05,Math.PI*1.95);c.lineTo(18,-100);c.quadraticCurveTo(4,-112,-14,-100);c.closePath();c.fill();
  const blink=(t%3.6)<.12;
  if(hurt||h.dead){c.strokeStyle='#1f2937';c.lineWidth=2.5;for(const ex of[-8,9]){c.beginPath();c.moveTo(ex-4,-102);c.lineTo(ex+4,-96);c.moveTo(ex+4,-102);c.lineTo(ex-4,-96);c.stroke()}}
  else for(const ex of[-7,10])ell(c,ex,-99,3.2,blink?.6:3.6,'#1f2937');
  ell(c,-13,-91,4,2.5,'rgba(244,114,182,.5)');ell(c,17,-91,4,2.5,'rgba(244,114,182,.5)');
  c.strokeStyle='#7c2d12';c.lineWidth=2;c.beginPath();
  if(hurt||h.dead){c.arc(3,-86,3.5,0,Math.PI*2)}else if(ck>=0&&ck<1){c.moveTo(-2,-88);c.lineTo(8,-88)}else c.arc(3,-90,6,.2,Math.PI-.2);c.stroke();
  // graduation cap with tassel
  c.fillStyle='#1f2937';rr(c,-16,-128,32,10,3);c.fill();
  c.beginPath();c.moveTo(-32,-128);c.lineTo(0,-139);c.lineTo(32,-128);c.lineTo(0,-118);c.closePath();c.fill();
  const tz=Math.sin(t*2.5)*.25;c.strokeStyle='#f59e0b';c.lineWidth=2;c.beginPath();c.moveTo(0,-128);c.lineTo(24,-127);c.lineTo(24+Math.sin(tz)*10,-110);c.stroke();ell(c,24+Math.sin(tz)*10,-108,3,4,'#f59e0b');
  // front arm with the pencil
  c.save();c.translate(18,-70);c.rotate(arm);
  c.fillStyle='#6d28d9';rr(c,-5,0,10,28,5);c.fill();ell(c,0,30,6.5,6.5,'#f9d4b0');
  c.translate(0,30);c.rotate(-1.35);
  c.fillStyle='#f472b6';rr(c,-4,-6,10,12,3);c.fill();c.fillStyle='#9ca3af';c.fillRect(6,-6,5,12);
  c.fillStyle='#facc15';c.fillRect(11,-6,40,12);c.fillStyle='#eab308';c.fillRect(11,-1,40,2);
  c.fillStyle='#fde68a';c.beginPath();c.moveTo(51,-6);c.lineTo(63,0);c.lineTo(51,6);c.closePath();c.fill();
  if(ck>=0&&ck<1){c.shadowColor='#c4b5fd';c.shadowBlur=20}
  ell(c,61,0,2.5,2.5,ck>=0&&ck<1?'#ffffff':'#1f2937');c.restore();
  c.restore();
  if(B&&B.shield&&!h.dead){c.save();c.globalAlpha=.25+Math.sin(t*4)*.08;ell(c,x,GY-70,62,82,'#60a5fa');c.globalAlpha=.8;c.strokeStyle='#93c5fd';c.lineWidth=3;c.beginPath();c.ellipse(x,GY-70,62,82,0,0,Math.PI*2);c.stroke();c.restore()}
  if(B&&B.rage&&!h.dead){c.save();c.globalAlpha=.5+Math.sin(t*8)*.2;c.font=`22px ${FONT}`;c.textAlign='center';c.fillText('💢',x-30,GY-140);c.restore()}
}

// ---------- stage 1: classroom + owl professor ----------
function bgClassroom(c){
  let g=c.createLinearGradient(0,0,0,GY);g.addColorStop(0,'#fdf2e0');g.addColorStop(1,'#f3dfc1');c.fillStyle=g;c.fillRect(0,0,SW,SH);
  c.fillStyle='#e7c9a0';c.fillRect(0,GY-58,SW,6);c.fillStyle='#ecd3ae';c.fillRect(0,GY-52,SW,52);
  // window
  c.fillStyle='#8b6b4a';rr(c,22,34,112,112,6);c.fill();
  g=c.createLinearGradient(0,40,0,140);g.addColorStop(0,'#7dd3fc');g.addColorStop(1,'#e0f2fe');c.fillStyle=g;c.fillRect(30,42,96,96);
  // chalkboard
  c.fillStyle='#8b6b4a';rr(c,170,26,300,136,8);c.fill();c.fillStyle='#2f5d50';c.fillRect(180,36,280,116);
  c.fillStyle='rgba(255,255,255,.07)';c.fillRect(180,36,280,116);
  c.fillStyle='rgba(255,255,255,.88)';c.font=`800 26px ${FONT}`;c.textAlign='center';c.fillText('IELTS 6.5 ✓',320,78);
  c.font=`600 14px ${FONT}`;c.fillStyle='rgba(255,255,255,.55)';c.fillText('curriculum · tuition · literacy',320,104);c.fillText('acquire knowledge = tiếp thu kiến thức',320,126);
  c.fillStyle='#a3825f';c.fillRect(176,150,288,7);c.fillStyle='#fff';c.fillRect(220,146,16,4);c.fillStyle='#fca5a5';c.fillRect(244,146,12,4);
  // clock face (hands drawn live)
  ell(c,560,72,30,30,'#8b6b4a');ell(c,560,72,25,25,'#fffbeb');
  // floor
  g=c.createLinearGradient(0,GY,0,SH);g.addColorStop(0,'#c58b55');g.addColorStop(1,'#a8703f');c.fillStyle=g;c.fillRect(0,GY,SW,SH-GY);
  c.strokeStyle='rgba(0,0,0,.12)';c.lineWidth=1.5;for(let x=-200;x<SW+200;x+=58){c.beginPath();c.moveTo(x,GY);c.lineTo(SW/2+(x-SW/2)*1.8,SH);c.stroke()}
  c.beginPath();c.moveTo(0,GY+18);c.lineTo(SW,GY+18);c.stroke();
  // desk on the far right
  c.fillStyle='#9a6a3f';rr(c,560,GY-62,80,14,4);c.fill();c.fillStyle='#7c5230';c.fillRect(570,GY-48,10,48);c.fillRect(622,GY-48,10,48);
  ell(c,592,GY-70,12,9,'#ef4444');c.fillStyle='#16a34a';c.fillRect(590,GY-82,3,6);
}
function liveClassroom(c,s){
  // clouds drifting in the window, clock hands
  c.save();c.beginPath();c.rect(30,42,96,96);c.clip();
  for(const [o,y,r] of [[0,70,14],[60,105,11]]){const x=30+((s.t*8+o)%140)-20;ell(c,x,y,r*1.6,r,'#fff');ell(c,x+r,y-4,r,r*.9,'#fff')}
  c.restore();c.strokeStyle='#8b6b4a';c.lineWidth=2;c.fillStyle='#8b6b4a';c.fillRect(77,42,3,96);c.fillRect(30,88,96,3);
  c.strokeStyle='#1f2937';c.lineWidth=3;c.beginPath();c.moveTo(560,72);c.lineTo(560+Math.cos(s.t*.2-1.6)*12,72+Math.sin(s.t*.2-1.6)*12);c.stroke();
  c.lineWidth=2;c.strokeStyle='#dc2626';c.beginPath();c.moveTo(560,72);c.lineTo(560+Math.cos(s.t*2-1.6)*20,72+Math.sin(s.t*2-1.6)*20);c.stroke();
}
function drawOwl(c,s){
  const b=s.boss,t=s.t,rage=sceneRage();
  let x=BX,y=GY-14-Math.sin(t*(rage?4.5:2.2))*7,rot=0,sc=1;
  const ak=(t-b.atk)/.6;if(ak>=0&&ak<1){const k=Math.sin(ak*Math.PI);x-=k*46;rot=-k*.14}
  const hk=(t-b.hit)/.35,hit=hk>=0&&hk<1;if(hit){x+=Math.sin(hk*Math.PI)*16;rot+=Math.sin(hk*Math.PI)*.1}
  if(b.dead){const k=ease((t-b.dead)/.8);rot+=k*k*7;sc=1-k;if(sc<=.01)return}
  x+=(1-ease(t/.8))*220; // fly in
  ell(c,x,GY+2,58*sc,9*sc,'rgba(15,23,42,.2)');
  c.save();c.translate(x,y);c.rotate(rot);c.scale(sc,sc);
  if(hit)c.filter='brightness(2.2)';else if(rage)c.filter='saturate(1.5) hue-rotate(-12deg)';
  const flap=Math.sin(t*(rage?9:5))*.12,raise=ak>=0&&ak<1?Math.sin(ak*Math.PI)*.9:0;
  // feet
  for(const fx of[-20,20]){c.fillStyle='#f59e0b';for(let j=-1;j<=1;j++){rr(c,fx+j*6-2.5,-6,5,12,2.5);c.fill()}}
  // wings (right one behind)
  c.save();c.translate(52,-96);c.rotate(.25-flap);ell(c,10,30,22,46,'#6b4220',-.15);c.restore();
  // body + belly with feather scallops
  ell(c,0,-88,64,82,'#8b5a2b');ell(c,0,-70,42,56,'#e9cfa3');
  c.strokeStyle='#c9a571';c.lineWidth=2;for(let r=0;r<4;r++)for(let j=-2;j<=2;j++){const px=j*14+(r%2?7:0),py=-100+r*16;if(Math.abs(px)>34-r*2)continue;c.beginPath();c.arc(px,py,6,.15*Math.PI,.85*Math.PI);c.stroke()}
  // ear tufts
  c.fillStyle='#6b4220';for(const sx of[-1,1]){c.beginPath();c.moveTo(sx*30,-150);c.lineTo(sx*52,-182);c.lineTo(sx*50,-140);c.closePath();c.fill()}
  // face discs, eyes (look at the hero), glasses, brows, beak
  ell(c,-25,-126,30,28,'#f4e4c4');ell(c,25,-126,30,28,'#f4e4c4');
  const blink=!rage&&(t%4.2)<.13;
  for(const ex of[-25,25]){
    if(blink){c.strokeStyle='#3f2a14';c.lineWidth=3;c.beginPath();c.moveTo(ex-14,-126);c.lineTo(ex+14,-126);c.stroke();continue}
    ell(c,ex,-126,19,19,'#fff');ell(c,ex-4,-125,11,11,rage?'#dc2626':'#f59e0b');ell(c,ex-6,-125,6,6,'#111');ell(c,ex-3,-129,2.5,2.5,'#fff')}
  c.strokeStyle='#111827';c.lineWidth=3.5;for(const ex of[-25,25]){c.beginPath();c.arc(ex,-126,23,0,Math.PI*2);c.stroke()}
  c.beginPath();c.moveTo(-3,-128);c.quadraticCurveTo(0,-133,3,-128);c.stroke();
  const tilt=rage?.55:.3;c.strokeStyle=rage?'#7f1d1d':'#3f2a14';c.lineWidth=5;c.lineCap='round';
  c.beginPath();c.moveTo(-44,-156+tilt*-14);c.lineTo(-10,-150+tilt*10);c.moveTo(44,-156+tilt*-14);c.lineTo(10,-150+tilt*10);c.stroke();c.lineCap='butt';
  c.fillStyle='#f59e0b';c.beginPath();c.moveTo(-9,-112);c.lineTo(9,-112);c.lineTo(0,-94+(ak>=0&&ak<1?4:0));c.closePath();c.fill();
  // mortarboard with swinging tassel
  c.fillStyle='#1f2937';rr(c,-22,-178,44,14,3);c.fill();
  c.beginPath();c.moveTo(-50,-178);c.lineTo(0,-194);c.lineTo(50,-178);c.lineTo(0,-164);c.closePath();c.fill();
  const tz=Math.sin(t*2)*.3;c.strokeStyle='#facc15';c.lineWidth=2.5;c.beginPath();c.moveTo(0,-178);c.lineTo(-36,-176);c.lineTo(-36+Math.sin(tz)*12,-152);c.stroke();ell(c,-36+Math.sin(tz)*12,-150,4,5,'#facc15');
  // front wing holding a pointer stick (raised when attacking)
  c.save();c.translate(-52,-96);c.rotate(-.25+flap-raise);
  c.strokeStyle='#78350f';c.lineWidth=4;c.beginPath();c.moveTo(-8,40);c.lineTo(-58,-18);c.stroke();ell(c,-58,-18,4,4,'#dc2626');
  ell(c,-10,30,22,46,'#6b4220',.15);c.restore();
  c.restore();c.filter='none';
}

const SCENES={0:{bg:bgClassroom,live:liveClassroom,boss:drawOwl}};
