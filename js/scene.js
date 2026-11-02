// ================= 2D BATTLE SCENE (canvas) =================
// Every stage is drawn on a canvas: the world (background) and the enemy kind come from BOSSES[i].w / .k.
// boss.js calls: sceneStart, sceneHeroAttack, sceneBossAttack, sceneHeal, sceneBossDie, sceneHeroDie.
const SW=640,SH=320,GY=280,HX=150,BX=470; // logical canvas size, ground line, hero/boss x
const calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
let SC=null; // state of the running scene, null when the stage has no scene (emoji arena fallback)

// ---------- helpers ----------
const ease=k=>1-Math.pow(1-Math.min(1,Math.max(0,k)),3);
const rnd=(a,b)=>a+Math.random()*(b-a);
const srand=seed=>()=>(seed=seed*16807%2147483647)/2147483647; // repeatable random for backgrounds
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function ell(c,x,y,rx,ry,fill,rot=0){c.beginPath();c.ellipse(x,y,rx,ry,rot,0,Math.PI*2);c.fillStyle=fill;c.fill()}
function lingrad(c,x0,y0,x1,y1,stops){const g=c.createLinearGradient(x0,y0,x1,y1);stops.forEach((s,j)=>g.addColorStop(j/(stops.length-1),s));return g}
const FONT='"Be Vietnam Pro",system-ui,sans-serif';

// ---------- lifecycle ----------
function sceneStart(i){
  const b=BOSSES[i],kind=KINDS[b&&b.k],world=WORLDS[b&&b.w];
  $('arena').classList.toggle('scene',!!(kind&&world));
  if(!kind||!world){SC=null;return}
  const cv=$('scene'),dpr=Math.min(2,window.devicePixelRatio||1);
  cv.width=SW*dpr;cv.height=SH*dpr;
  const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
  const bg=document.createElement('canvas');bg.width=SW*dpr;bg.height=SH*dpr;
  const bc=bg.getContext('2d');bc.setTransform(dpr,0,0,dpr,0,0);world.bg(bc,i);
  const me=SC={i,kind,world,c,bg,t:0,prev:performance.now(),shake:0,parts:[],shots:[],nums:[],
    hero:{cast:-9,hurt:-9,dead:0,win:0},boss:{atk:-9,hit:-9,dead:0,burst:false}};
  const frame=now=>{
    if(SC!==me||!$('battle').classList.contains('show'))return; // stops when the battle screen closes
    const dt=Math.min(.05,(now-me.prev)/1000);me.prev=now;me.t+=dt;
    sceneUpdate(me,dt);sceneDraw(me);requestAnimationFrame(frame)};
  requestAnimationFrame(frame);
}
const sceneRage=()=>B&&B.bossHp>0&&B.bossHp/B.c.hp<.3;
const kpt=(k,x,y)=>[BX+x*(k.scale||1),GY+y*(k.scale||1)]; // point on the enemy, relative to its feet

// ---------- events from the battle ----------
function sceneHeroAttack(word,dmg,power){ // power: 0 normal, 1 combo, 2 rage potion
  const s=SC,[x1,y1]=kpt(s.kind,-10,s.kind.cy);s.hero.cast=s.t;
  s.shots.push({k:'word',word,dmg,power,x0:HX+70,y0:GY-100,x1,y1,t0:s.t+.18,dur:.42});
}
function sceneBossAttack(dmg,blocked){
  const s=SC,k=s.kind,[x0,y0]=kpt(k,k.mx,k.my);s.boss.atk=s.t;
  if(k.shot==='fire')burst(s,x0,y0,16,'dot',['#f97316','#facc15','#ef4444'],160);
  for(let j=0;j<3;j++)s.shots.push({k:k.shot,first:j===0,dmg,blocked,x0,y0,x1:HX+12+j*6,y1:GY-70-j*10,t0:s.t+.22+j*.09,dur:.48,spin:rnd(6,10)});
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
  const k=s.kind;
  for(const sh of s.shots){
    const q=(s.t-sh.t0)/sh.dur;if(q<0||sh.done)continue;
    if(sh.k==='word'&&Math.random()<.8)s.parts.push({k:'dot',x:shotX(sh,q),y:shotY(sh,q),vx:rnd(-20,20),vy:rnd(-20,20),g:0,life:.35,max:.35,size:rnd(2,4),color:['#c4b5fd','#fcd34d','#fca5a5'][sh.power]});
    if(sh.k==='fire'&&Math.random()<.9)s.parts.push({k:'dot',x:shotX(sh,q),y:shotY(sh,q),vx:rnd(-30,30),vy:rnd(-40,0),g:0,life:.3,max:.3,size:rnd(3,6),color:pick(['#f97316','#facc15','#ef4444'])});
    if(q<1)continue;sh.done=true;
    if(sh.k==='word'){ // impact on the enemy
      s.boss.hit=s.t;s.shake=calm?0:6+sh.power*4;
      burst(s,sh.x1,sh.y1,18+sh.power*10,k.pk,k.parts);
      burst(s,sh.x1,sh.y1,14,'spark',['#fde68a','#ffffff',sh.power===2?'#ef4444':'#a78bfa'],320);
      s.nums.push({txt:'-'+sh.dmg+(sh.power?' 💥':''),x:sh.x1-10,y:Math.max(110,sh.y1-30),t0:s.t,color:sh.power?'#f59e0b':'#ef4444',big:sh.power>0});
    }else if(sh.blocked){
      burst(s,HX+40,sh.y1,6,'spark',['#93c5fd','#ffffff'],200);
      if(sh.first)s.nums.push({txt:'🛡️ Chặn!',x:HX,y:GY-150,t0:s.t,color:'#3b82f6'});
    }else{
      if(sh.first){s.hero.hurt=s.t;s.shake=calm?0:7;s.nums.push({txt:'-'+sh.dmg,x:HX,y:GY-150,t0:s.t,color:'#ef4444'})}
      burst(s,sh.x1,sh.y1,8,'dot',SHOT_FX[sh.k]||['#ef4444','#ffffff'],180);
    }
  }
  s.shots=s.shots.filter(sh=>!sh.done);
  const b=s.boss;
  if(b.dead&&!b.burst&&s.t-b.dead>.75){b.burst=true;s.shake=calm?0:12;const [x,y]=kpt(k,0,k.cy);
    burst(s,x,y,50,k.pk,k.parts,300);burst(s,x,y,16,'smoke',['#e5e7eb','#d1d5db'],90);
    burst(s,x,y,24,'spark',['#fde68a','#f59e0b','#ffffff'],380);s.hero.win=s.t+.2}
  if(sceneRage()&&Math.random()<dt*6){const [x,y]=kpt(k,rnd(-40,40),k.top);s.parts.push({k:'smoke',x,y,vx:rnd(-10,10),vy:rnd(-50,-30),g:0,life:.9,max:.9,size:rnd(3,6),color:'rgba(248,113,113,.55)'})}
}
const shotX=(sh,q)=>sh.x0+(sh.x1-sh.x0)*q;
const shotY=(sh,q)=>sh.y0+(sh.y1-sh.y0)*q-Math.sin(q*Math.PI)*(sh.k==='word'?60:sh.k==='zap'?10:80);
const SHOT_FX={goo:['#4ade80','#bbf7d0'],rock:['#9ca3af','#6b7280'],zap:['#fde047','#ffffff'],ink:['#581c87','#a855f7'],fire:['#f97316','#facc15']};

// ---------- drawing ----------
function sceneDraw(s){
  const c=s.c;c.save();c.clearRect(0,0,SW,SH);
  if(s.shake)c.translate(rnd(-s.shake,s.shake),rnd(-s.shake,s.shake));
  c.drawImage(s.bg,-10,-10,SW+20,SH+20);
  s.world.live&&s.world.live(c,s);
  if(sceneRage()){const g=c.createRadialGradient(SW/2,SH/2,SH*.35,SW/2,SH/2,SH*.9);g.addColorStop(0,'rgba(239,68,68,0)');g.addColorStop(1,`rgba(239,68,68,${.22+Math.sin(s.t*5)*.08})`);c.fillStyle=g;c.fillRect(-10,-10,SW+20,SH+20)}
  const p=pose(c,s);if(p){s.kind.draw(c,s,p);c.restore()}
  drawHero(c,s);
  for(const sh of s.shots){const q=(s.t-sh.t0)/sh.dur;if(q<0)continue;const x=shotX(sh,q),y=shotY(sh,q);
    sh.k==='word'?drawWordShot(c,sh,x,y):drawEnemyShot(c,sh.k,x,y,(s.t-sh.t0)*sh.spin)}
  for(const pt of s.parts)drawPart(c,pt);
  for(const n of s.nums){const q=(s.t-n.t0)/1.1;c.save();c.globalAlpha=1-Math.max(0,q-.6)/.4;
    c.font=`900 ${n.big?32:26}px ${FONT}`;c.textAlign='center';c.lineWidth=5;c.strokeStyle='rgba(15,23,42,.75)';
    const y=n.y-ease(q)*40;c.strokeText(n.txt,n.x,y);c.fillStyle=n.color;c.fillText(n.txt,n.x,y);c.restore()}
  c.restore();drawHud(c,s);
}
// shared enemy motion: fly-in, idle bob, attack lunge, hit knockback + flash, rage tint, death spin.
// Leaves the context translated to the enemy's feet (caller restores); returns null once it has vanished.
function pose(c,s){
  const k=s.kind,b=s.boss,t=s.t,rage=sceneRage(),sp=rage?k.sp*2:k.sp;
  let x=BX,y=GY-(k.lift||0)-Math.sin(t*sp)*k.bob,rot=0,sc=k.scale||1;
  const ak=(t-b.atk)/.6,atk=ak>=0&&ak<1?Math.sin(ak*Math.PI):0;x-=atk*46;rot-=atk*.12;
  const hk=(t-b.hit)/.35,hit=hk>=0&&hk<1;if(hit){x+=Math.sin(hk*Math.PI)*16;rot+=Math.sin(hk*Math.PI)*.1}
  if(b.dead){const q=ease((t-b.dead)/.8);rot+=q*q*7;sc*=1-q;if(sc<=.01)return null}
  x+=(1-ease(t/.8))*240;
  ell(c,x,GY+2,k.shadow*sc,9*sc,'rgba(15,23,42,.2)');
  c.save();c.translate(x,y);c.rotate(rot);c.scale(sc,sc);
  if(hit)c.filter='brightness(2.2)';else if(rage)c.filter='saturate(1.5) hue-rotate(-12deg)';
  return {t,rage,atk,hit};
}
function drawPart(c,p){
  const a=Math.max(0,p.life/p.max);c.save();c.globalAlpha=Math.min(1,a*1.5);
  if(p.k==='feather'){c.translate(p.x,p.y);c.rotate(p.rot);ell(c,0,0,p.size*1.6,p.size*.6,p.color)}
  else if(p.k==='page'){c.translate(p.x,p.y);c.rotate(p.rot);c.fillStyle=p.color;c.fillRect(-p.size,-p.size*1.3,p.size*2,p.size*2.6)}
  else if(p.k==='rock'){c.translate(p.x,p.y);c.rotate(p.rot);c.fillStyle=p.color;c.beginPath();c.moveTo(-p.size,0);c.lineTo(0,-p.size);c.lineTo(p.size,-p.size*.3);c.lineTo(p.size*.6,p.size);c.closePath();c.fill()}
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
function drawEnemyShot(c,k,x,y,rot){
  c.save();c.translate(x,y);
  if(k==='paper'){c.rotate(rot);c.fillStyle='#fff';c.strokeStyle='#cbd5e1';c.lineWidth=1;c.fillRect(-10,-13,20,26);c.strokeRect(-10,-13,20,26);
    c.fillStyle='#dc2626';c.font=`900 17px ${FONT}`;c.textAlign='center';c.textBaseline='middle';c.fillText('F',0,1)}
  else if(k==='goo'){ell(c,0,0,11,9,'#22c55e',rot*.2);ell(c,-3,-3,4,3,'rgba(255,255,255,.7)')}
  else if(k==='rock'){c.rotate(rot);c.fillStyle='#78716c';c.beginPath();c.moveTo(-12,-4);c.lineTo(-4,-12);c.lineTo(10,-8);c.lineTo(12,6);c.lineTo(-2,12);c.lineTo(-12,6);c.closePath();c.fill();c.fillStyle='#a8a29e';c.fillRect(-4,-6,6,4)}
  else if(k==='zap'){c.shadowColor='#fde047';c.shadowBlur=14;c.strokeStyle='#fef08a';c.lineWidth=4;c.lineJoin='round';c.beginPath();c.moveTo(14,-10);c.lineTo(2,-2);c.lineTo(8,2);c.lineTo(-14,12);c.stroke()}
  else if(k==='ink'){ell(c,0,0,12,12,'#3b0764');ell(c,-4,-4,4,4,'rgba(255,255,255,.35)');c.fillStyle='#dc2626';c.font=`900 12px ${FONT}`;c.textAlign='center';c.textBaseline='middle';c.fillText('✗',1,1)}
  else if(k==='fire'){const g=c.createRadialGradient(0,0,2,0,0,15);g.addColorStop(0,'#fef9c3');g.addColorStop(.4,'#facc15');g.addColorStop(1,'rgba(239,68,68,0)');c.fillStyle=g;c.beginPath();c.arc(0,0,15,0,Math.PI*2);c.fill()}
  c.restore();
}

// ---------- HUD on the canvas (HP bars, enemy name, taunt), so the pinned scene shows everything ----------
function drawHud(c,s){
  if(!B)return;const dt=Math.min(.05,s.t-(s.hudT||0));s.hudT=s.t;
  for(const [v,k] of [[B.hp/B.max,'hero'],[B.bossHp/B.c.hp,'boss']]){s[k+'Hp']=s[k+'Hp']??v;s[k+'Ghost']=s[k+'Ghost']??v;
    s[k+'Hp']+=(v-s[k+'Hp'])*Math.min(1,dt*10);s[k+'Ghost']+=v<=s[k+'Ghost']?(v-s[k+'Ghost'])*Math.min(1,dt*2.2):v-s[k+'Ghost']}
  hpBar(c,s,14,12,'Bạn',`${B.hp}/${B.max}`,s.heroHp,s.heroGhost,['#22c55e','#84cc16'],'left');
  const tag=B.c.final?'🐲 TRÙM CUỐI · ':B.c.boss?'👑 BOSS · ':'';
  hpBar(c,s,SW-14,12,tag+B.c.b.n+(sceneRage()?' 😡':''),`${B.bossHp}/${B.c.hp}`,s.bossHp,s.bossGhost,['#ef4444','#f97316'],'right');
  const bt=s.t-.9;if(bt>0&&bt<3.6){ // taunt bubble after the enemy arrives
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
  rr(c,x0,y+20,Math.max(0,w*v),h,6);c.fillStyle=lingrad(c,x0,0,x0+w,0,cols);c.fill();
  c.font=`700 11px ${FONT}`;c.strokeText(txt,x,y+46);c.fillStyle='#334155';c.fillText(txt,x,y+46);c.restore();
}
function wrapText(c,txt,max){const out=[];let cur='';for(const w of txt.split(' ')){const n=cur?cur+' '+w:w;if(c.measureText(n).width>max&&cur){out.push(cur);cur=w}else cur=n}if(cur)out.push(cur);return out}
function fitText(c,txt,max){while(txt.length>3&&c.measureText(txt).width>max)txt=txt.slice(0,-2);return txt}

// ---------- hero: a cat dressed from the closet (closet.js) ----------
function drawHero(c,s){
  const h=s.hero,t=s.t;let x=HX,y=GY,rot=0,arm=-.25+Math.sin(t*3)*.06,breathe=1+Math.sin(t*3)*.015;
  const ck=(t-h.cast)/.5,casting=ck>=0&&ck<1;if(casting){const q=Math.sin(ck*Math.PI);x+=q*22;arm=-.25-q*1.9}
  const hk=(t-h.hurt)/.45,hurt=hk>=0&&hk<1;if(hurt)x-=Math.sin(hk*Math.PI)*18;
  if(h.win&&t>h.win)y-=Math.abs(Math.sin((t-h.win)*7))*22;
  if(h.dead)rot=-ease((t-h.dead)/.6)*1.45;
  const intro=ease(t/.6);x-=(1-intro)*120;
  ell(c,x,GY+4,34*(h.dead?1.4:1),7,'rgba(15,23,42,.18)');
  c.save();c.translate(x,y);c.rotate(rot);c.scale(1,breathe);c.globalAlpha=intro;
  drawCat(c,{t,arm,casting,sad:hurt||!!h.dead,blink:(t%3.6)<.12},wearing());
  c.restore();
  if(B&&B.shield&&!h.dead){c.save();c.globalAlpha=.25+Math.sin(t*4)*.08;ell(c,x,GY-70,62,82,'#60a5fa');c.globalAlpha=.8;c.strokeStyle='#93c5fd';c.lineWidth=3;c.beginPath();c.ellipse(x,GY-70,62,82,0,0,Math.PI*2);c.stroke();c.restore()}
  if(B&&B.rage&&!h.dead){c.save();c.globalAlpha=.5+Math.sin(t*8)*.2;c.font=`22px ${FONT}`;c.textAlign='center';c.fillText('💢',x-30,GY-140);c.restore()}
}
// fur: a main, b belly/muzzle, s stripes or patches, p second patch colour, pt: Siamese dark points
const FURS={ginger:{a:'#f59f4a',b:'#fde3c4',s:'#d9772b',tabby:1},grey:{a:'#9aa3ad',b:'#e9ecef',s:'#6b7480',tabby:1},black:{a:'#3a3337',b:'#55494f',s:'#2a2427'},
  white:{a:'#f7f3ef',b:'#ffffff',s:'#e2d8cd'},calico:{a:'#f7f3ef',b:'#ffffff',s:'#ec8f3c',p:'#3b3236'},siamese:{a:'#f1e4d1',b:'#faf3e8',s:'#5e4033',pt:1}};
// the cat stands on (0,0) facing right; o = {t, arm (front arm angle), casting, sad, blink}; w = {fur, hat, face, body, neck, hand}
function drawCat(c,o,w){
  const F=FURS[w.fur]||FURS.ginger,t=o.t,cl=OUTFIT.body[w.body],sleeve=cl&&cl.sleeve||F.a,dark=F.pt?F.s:F.a;
  // tail
  const sw=Math.sin(t*2.2)*7;c.lineCap='round';c.lineWidth=9;c.strokeStyle=F.a;c.beginPath();c.moveTo(-14,-24);c.quadraticCurveTo(-46,-34+sw*.3,-38+sw,-70);c.stroke();
  c.strokeStyle=F.pt?F.s:F.s;c.lineWidth=9;c.beginPath();c.moveTo(-39+sw*.9,-62);c.lineTo(-38+sw,-70);c.stroke();
  // back arm
  c.save();c.translate(-17,-62);c.rotate(.28+Math.sin(t*3)*.05);c.fillStyle=sleeve;rr(c,-5,0,10,24,5);c.fill();ell(c,0,25,6,6,F.pt?F.s:F.b);c.restore();
  // legs, body, belly
  ell(c,-9,-8,8,9,F.a);ell(c,9,-8,8,9,F.a);ell(c,-8,-2,9,5,F.pt?F.s:F.b);ell(c,11,-2,9,5,F.pt?F.s:F.b);
  ell(c,0,-42,21,28,F.a);ell(c,3,-37,12,19,F.b);
  if(F.tabby){c.strokeStyle=F.s;c.lineWidth=3;for(const yy of[-56,-44,-32]){c.beginPath();c.moveTo(-20,yy);c.quadraticCurveTo(-14,yy+3,-10,yy-1);c.stroke()}}
  if(F.p){ell(c,-11,-48,8,10,F.s);ell(c,12,-28,7,6,F.p)}
  if(cl&&cl.draw)cl.draw(c,t);
  const nk=OUTFIT.neck[w.neck];if(nk&&nk.draw)nk.draw(c,t);
  // head
  for(const sx of[-1,1]){c.fillStyle=F.pt?F.s:F.a;c.beginPath();c.moveTo(sx*26,-110);c.lineTo(sx*22,-142);c.lineTo(sx*5,-125);c.closePath();c.fill();
    c.fillStyle='#f9b4c8';c.beginPath();c.moveTo(sx*21,-115);c.lineTo(sx*19.5,-134);c.lineTo(sx*10,-124);c.closePath();c.fill()}
  ell(c,0,-102,29,25,F.a);
  if(F.pt)ell(c,3,-97,17,14,'rgba(94,64,51,.75)');
  if(F.tabby){c.strokeStyle=F.s;c.lineWidth=3;for(const dx of[-7,0,7]){c.beginPath();c.moveTo(dx,-126);c.lineTo(dx*.8,-117);c.stroke()}}
  if(F.p){ell(c,-14,-112,11,9,F.s);ell(c,15,-114,8,8,F.p)}
  ell(c,4,-92,13,9,F.pt?'rgba(94,64,51,.6)':F.b);
  ell(c,-14,-92,5,3,'rgba(244,114,182,.45)');ell(c,21,-92,5,3,'rgba(244,114,182,.45)');
  if(o.sad){c.strokeStyle='#2b2118';c.lineWidth=2.5;for(const ex of[-8,13]){c.beginPath();c.moveTo(ex-4,-108);c.lineTo(ex+4,-100);c.moveTo(ex+4,-108);c.lineTo(ex-4,-100);c.stroke()}}
  else for(const ex of[-8,13]){ell(c,ex,-104,4.4,o.blink?.7:5.6,'#2b2118');if(!o.blink)ell(c,ex+1.4,-106,1.5,1.7,'#fff')}
  c.fillStyle='#f06595';c.beginPath();c.moveTo(1,-96);c.lineTo(7,-96);c.lineTo(4,-92.5);c.closePath();c.fill();
  c.strokeStyle='#2b2118';c.lineWidth=1.6;c.beginPath();
  if(o.sad)c.arc(4,-87,2.6,0,Math.PI*2);else if(o.casting){c.moveTo(0,-89);c.quadraticCurveTo(4,-84,8,-89)}else{c.moveTo(4,-92.5);c.quadraticCurveTo(2,-88,-1,-90);c.moveTo(4,-92.5);c.quadraticCurveTo(6,-88,9,-90)}c.stroke();
  c.strokeStyle='rgba(43,33,24,.55)';c.lineWidth=1.2;c.beginPath();
  for(const [x0,x1,dy] of[[-10,-32,-3],[-10,-32,3],[18,40,-3],[18,40,3]]){c.moveTo(x0,-93);c.lineTo(x1,-93+dy*1.6)}c.stroke();
  const fc=OUTFIT.face[w.face];if(fc&&fc.draw)fc.draw(c,t);
  const ht=OUTFIT.hat[w.hat];if(ht&&ht.draw)ht.draw(c,t);
  // front arm with the weapon
  c.save();c.translate(17,-62);c.rotate(o.arm);c.fillStyle=sleeve;rr(c,-5,0,10,26,5);c.fill();ell(c,0,27,6.5,6.5,F.pt?F.s:F.b);
  c.translate(0,27);c.rotate(-.75+(-.25-o.arm)/1.9*2.6);const hd=OUTFIT.hand[w.hand]; /* up-right at rest, toward the enemy while casting */if(hd&&hd.draw)hd.draw(c,o.casting);c.restore();
}
const star=(c,x,y,r,col)=>{c.fillStyle=col;c.beginPath();for(let j=0;j<10;j++){const a=-Math.PI/2+j*Math.PI/5,q=j%2?r*.45:r;c.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q)}c.closePath();c.fill()};
const glint=(c,on)=>{if(on){c.shadowColor='#fde68a';c.shadowBlur=20}};
// every item: n name, e icon, p price in gold (0 = owned from the start); draw(c,t) at the cat's origin
const OUTFIT={
 fur:{ginger:{n:'Mèo mướp',e:'🧡',p:0},grey:{n:'Mèo xám',e:'🌫️',p:150},black:{n:'Mèo mun',e:'🖤',p:150},white:{n:'Mèo trắng',e:'🤍',p:150},calico:{n:'Mèo tam thể',e:'🎨',p:300},siamese:{n:'Mèo Xiêm',e:'🤎',p:300}},
 hat:{
  cap:{n:'Mũ tốt nghiệp',e:'🎓',p:0,draw:(c,t)=>{c.fillStyle='#1f2937';rr(c,-15,-131,30,9,3);c.fill();c.beginPath();c.moveTo(-31,-131);c.lineTo(0,-142);c.lineTo(31,-131);c.lineTo(0,-121);c.closePath();c.fill();
    const tz=Math.sin(t*2.5)*.25;c.strokeStyle='#f59e0b';c.lineWidth=2;c.beginPath();c.moveTo(0,-131);c.lineTo(23,-130);c.lineTo(23+Math.sin(tz)*10,-114);c.stroke();ell(c,23+Math.sin(tz)*10,-112,3,4,'#f59e0b')}},
  bow:{n:'Nơ hồng',e:'🎀',p:80,draw:c=>{ell(c,8,-131,9,6,'#f783ac',-.5);ell(c,24,-133,9,6,'#f783ac',.5);ell(c,16,-132,4,4,'#e64980')}},
  beanie:{n:'Mũ len',e:'🧶',p:120,draw:c=>{c.fillStyle='#4dabf7';c.beginPath();c.arc(0,-117,24,Math.PI,0);c.closePath();c.fill();c.fillStyle='#1c7ed6';rr(c,-26,-121,52,9,4);c.fill();
    c.fillStyle='rgba(255,255,255,.35)';for(const dx of[-12,0,12])c.fillRect(dx-1.5,-138,3,16);ell(c,0,-142,7,7,'#fff')}},
  nonla:{n:'Nón lá',e:'👒',p:200,draw:c=>{c.fillStyle='#e9c46a';c.beginPath();c.moveTo(-42,-118);c.lineTo(0,-150);c.lineTo(42,-118);c.quadraticCurveTo(0,-112,-42,-118);c.fill();
    c.strokeStyle='#c99a3a';c.lineWidth=1.2;for(const k of[.35,.6,.82]){c.beginPath();c.moveTo(-42*k,-150+32*k);c.quadraticCurveTo(0,-150+28*k,42*k,-150+32*k);c.stroke()}
    c.strokeStyle='#e64980';c.lineWidth=1.5;c.beginPath();c.moveTo(-22,-117);c.quadraticCurveTo(4,-70,26,-117);c.stroke()}},
  witch:{n:'Mũ phù thuỷ',e:'🧙',p:350,draw:(c,t)=>{ell(c,0,-124,36,7,'#3b2f6b');c.fillStyle='#4c3d8f';c.beginPath();c.moveTo(-17,-125);c.quadraticCurveTo(-4,-150,12+Math.sin(t*2)*2,-172);c.quadraticCurveTo(4,-146,17,-125);c.closePath();c.fill();
    c.fillStyle='#fcc419';c.fillRect(-16,-133,32,6);star(c,4,-150,5,'#fcc419')}},
  crown:{n:'Vương miện',e:'👑',p:500,draw:(c,t)=>{c.fillStyle='#fcc419';c.beginPath();c.moveTo(-18,-122);c.lineTo(-20,-146);c.lineTo(-10,-134);c.lineTo(0,-150);c.lineTo(10,-134);c.lineTo(20,-146);c.lineTo(18,-122);c.closePath();c.fill();
    c.fillStyle='#f59f00';c.fillRect(-18,-128,36,6);ell(c,0,-125,3,3,'#e03131');ell(c,-11,-125,2.5,2.5,'#339af0');ell(c,11,-125,2.5,2.5,'#2f9e44');
    c.globalAlpha=.5+Math.sin(t*4)*.5;star(c,14,-150,3.5,'#fff');c.globalAlpha=1}}},
 face:{
  round:{n:'Kính tròn',e:'👓',p:100,draw:c=>{c.strokeStyle='#2b2118';c.lineWidth=2.2;for(const ex of[-8,13]){c.beginPath();c.arc(ex,-104,8,0,Math.PI*2);c.stroke()}c.beginPath();c.moveTo(0,-105);c.lineTo(5,-105);c.moveTo(-16,-106);c.lineTo(-27,-109);c.stroke()}},
  sun:{n:'Kính râm',e:'🕶️',p:180,draw:c=>{c.fillStyle='#212529';rr(c,-18,-111,19,13,5);c.fill();rr(c,4,-111,19,13,5);c.fill();c.fillRect(0,-108,5,3);
    c.fillStyle='rgba(255,255,255,.4)';c.fillRect(-14,-108,6,2);c.fillRect(8,-108,6,2)}},
  heart:{n:'Kính trái tim',e:'💖',p:220,draw:c=>{c.fillStyle='rgba(240,101,149,.9)';for(const ex of[-8,13]){c.beginPath();c.moveTo(ex,-97);c.bezierCurveTo(ex-13,-106,ex-6,-115,ex,-108);c.bezierCurveTo(ex+6,-115,ex+13,-106,ex,-97);c.fill()}
    c.strokeStyle='#c2255c';c.lineWidth=2;c.beginPath();c.moveTo(-1,-106);c.lineTo(4,-106);c.stroke()}}},
 body:{
  hoodie:{n:'Áo hoodie 6.5',e:'🟣',p:0,sleeve:'#5b21b6',draw:c=>{c.fillStyle='#6d28d9';rr(c,-21,-68,42,46,14);c.fill();c.fillStyle='#8b5cf6';rr(c,-21,-30,42,9,4);c.fill();
    c.fillStyle='#ede9fe';c.font=`900 12px ${FONT}`;c.textAlign='center';c.fillText('6.5',2,-42)}},
  sailor:{n:'Áo thuỷ thủ',e:'⚓',p:200,sleeve:'#f8f9fa',draw:c=>{c.fillStyle='#f8f9fa';rr(c,-21,-68,42,46,14);c.fill();c.fillStyle='#4dabf7';for(const yy of[-48,-38,-28])c.fillRect(-20,yy,40,3.5);
    c.fillStyle='#1971c2';c.beginPath();c.moveTo(-18,-68);c.lineTo(20,-68);c.lineTo(2,-50);c.closePath();c.fill();ell(c,2,-52,4,3,'#e03131')}},
  robe:{n:'Áo choàng phù thuỷ',e:'🔮',p:350,sleeve:'#364fc7',draw:(c,t)=>{c.fillStyle='#3b5bdb';c.beginPath();c.moveTo(-15,-70);c.lineTo(17,-70);c.lineTo(27,-12);c.quadraticCurveTo(2,-6,-24,-12);c.closePath();c.fill();
    c.fillStyle='#fcc419';rr(c,-2,-70,6,58,3);c.fill();star(c,-12,-34,4,'#fff3bf');star(c,15,-46,3,'#fff3bf');c.globalAlpha=.6+Math.sin(t*3)*.4;star(c,12,-22,3.5,'#fff3bf');c.globalAlpha=1}},
  aodai:{n:'Áo dài',e:'👘',p:400,sleeve:'#c2255c',draw:c=>{c.fillStyle='#d6336c';rr(c,-19,-70,38,52,12);c.fill();c.beginPath();c.moveTo(-14,-24);c.lineTo(18,-24);c.lineTo(14,-4);c.lineTo(-10,-4);c.closePath();c.fill();
    c.fillStyle='#fcc419';rr(c,-6,-72,14,5,2);c.fill();for(const [px,py] of[[-8,-54],[10,-46],[-4,-34],[8,-16]]){ell(c,px,py,3,3,'#ffd43b');ell(c,px,py,1.3,1.3,'#d6336c')}}},
  armor:{n:'Áo giáp hiệp sĩ',e:'🛡️',p:600,sleeve:'#868e96',draw:c=>{c.fillStyle=lingrad(c,-21,0,21,0,['#adb5bd','#f1f3f5','#adb5bd']);rr(c,-21,-68,42,46,12);c.fill();
    ell(c,-19,-64,9,8,'#ced4da');ell(c,21,-64,9,8,'#ced4da');c.fillStyle='#e03131';c.beginPath();c.moveTo(-7,-56);c.lineTo(11,-56);c.lineTo(11,-42);c.quadraticCurveTo(2,-32,-7,-42);c.closePath();c.fill();
    c.fillStyle='#fcc419';c.fillRect(1,-54,2,14);c.fillRect(-4,-49,12,2)}}},
 neck:{
  bell:{n:'Chuông vàng',e:'🔔',p:60,draw:(c,t)=>{c.strokeStyle='#e03131';c.lineWidth=4;c.beginPath();c.arc(2,-96,25,Math.PI*.36,Math.PI*.64);c.stroke();
    const sw=Math.sin(t*5)*1.5;ell(c,3+sw,-68,5.5,5.5,'#fcc419');c.fillStyle='#b8860b';c.fillRect(1+sw,-68,4,1.5)}},
  bowtie:{n:'Nơ cổ',e:'🎩',p:90,draw:c=>{c.fillStyle='#e64980';c.beginPath();c.moveTo(3,-72);c.lineTo(-8,-78);c.lineTo(-8,-66);c.closePath();c.moveTo(3,-72);c.lineTo(14,-78);c.lineTo(14,-66);c.closePath();c.fill();ell(c,3,-72,3,3,'#c2255c')}},
  scarf:{n:'Khăn quàng đỏ',e:'🧣',p:120,draw:(c,t)=>{c.fillStyle='#e03131';rr(c,-18,-77,40,8,4);c.fill();const sw=Math.sin(t*3)*2;
    c.beginPath();c.moveTo(4,-72);c.lineTo(-4+sw,-50);c.lineTo(4+sw,-52);c.closePath();c.moveTo(6,-72);c.lineTo(14+sw,-52);c.lineTo(20+sw,-56);c.closePath();c.fill();ell(c,5,-72,4,4,'#c92a2a')}}},
 hand:{
  pencil:{n:'Bút chì phép',e:'✏️',p:0,draw:(c,on)=>{c.fillStyle='#f472b6';rr(c,-4,-6,10,12,3);c.fill();c.fillStyle='#9ca3af';c.fillRect(6,-6,5,12);
    c.fillStyle='#facc15';c.fillRect(11,-6,40,12);c.fillStyle='#eab308';c.fillRect(11,-1,40,2);c.fillStyle='#fde68a';c.beginPath();c.moveTo(51,-6);c.lineTo(63,0);c.lineTo(51,6);c.closePath();c.fill();
    glint(c,on);ell(c,61,0,2.5,2.5,on?'#ffffff':'#1f2937')}},
  fish:{n:'Cá khô',e:'🐟',p:150,draw:(c,on)=>{c.fillStyle='#74c0fc';c.beginPath();c.ellipse(32,0,22,9,0,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(10,0);c.lineTo(-2,-9);c.lineTo(-2,9);c.closePath();c.fill();
    c.strokeStyle='#4dabf7';c.lineWidth=1.5;for(const dx of[22,30,38]){c.beginPath();c.moveTo(dx,-6);c.lineTo(dx+3,6);c.stroke()}glint(c,on);ell(c,47,-2,2.5,2.5,on?'#fff':'#1f2937')}},
  wand:{n:'Đũa phép',e:'🪄',p:250,draw:(c,on)=>{c.fillStyle='#5c3d2e';rr(c,-2,-3,48,6,3);c.fill();c.fillStyle='#fcc419';c.fillRect(4,-3,6,6);glint(c,on);star(c,54,0,on?12:9,'#ffd43b')}}}};
const SLOTS=[['fur','🐱','Bộ lông'],['hat','🎩','Mũ'],['face','👓','Kính'],['body','👕','Áo'],['neck','🎀','Cổ'],['hand','🪄','Vũ khí']];
const WEAR0={fur:'ginger',hat:'cap',face:'',body:'hoodie',neck:'',hand:'pencil'}; // '' = nothing in that slot
const wearing=()=>({...WEAR0,...st.closet.wear});

// ================= WORLDS (backgrounds) =================
// bg(c,i) is drawn once per battle; live(c,s) adds the moving details every frame.
function bgSchool(c,i){
  c.fillStyle=lingrad(c,0,0,0,GY,['#fdf2e0','#f3dfc1']);c.fillRect(0,0,SW,SH);
  c.fillStyle='#e7c9a0';c.fillRect(0,GY-58,SW,6);c.fillStyle='#ecd3ae';c.fillRect(0,GY-52,SW,52);
  c.fillStyle='#8b6b4a';rr(c,22,34,112,112,6);c.fill();
  c.fillStyle=lingrad(c,0,40,0,140,['#7dd3fc','#e0f2fe']);c.fillRect(30,42,96,96);
  // chalkboard with this stage's topic words
  c.fillStyle='#8b6b4a';rr(c,170,26,300,136,8);c.fill();c.fillStyle='#2f5d50';c.fillRect(180,36,280,116);
  c.fillStyle='rgba(255,255,255,.07)';c.fillRect(180,36,280,116);
  c.fillStyle='rgba(255,255,255,.88)';c.font=`800 26px ${FONT}`;c.textAlign='center';c.fillText('IELTS 6.5 ✓',320,78);
  const T=DATA[i]||DATA[0],L=B&&B.c.board||[T.words.slice(0,3).map(w=>w[0]).join(' · '),T.cols[0][0]+' = '+T.cols[0][1]]; // arena: the deck's words
  c.font=`600 14px ${FONT}`;c.fillStyle='rgba(255,255,255,.55)';c.fillText(fitText(c,L[0],260),320,104);c.fillText(fitText(c,L[1],260),320,126);
  c.fillStyle='#a3825f';c.fillRect(176,150,288,7);c.fillStyle='#fff';c.fillRect(220,146,16,4);c.fillStyle='#fca5a5';c.fillRect(244,146,12,4);
  ell(c,560,72,30,30,'#8b6b4a');ell(c,560,72,25,25,'#fffbeb');
  c.fillStyle=lingrad(c,0,GY,0,SH,['#c58b55','#a8703f']);c.fillRect(0,GY,SW,SH-GY);
  c.strokeStyle='rgba(0,0,0,.12)';c.lineWidth=1.5;for(let x=-200;x<SW+200;x+=58){c.beginPath();c.moveTo(x,GY);c.lineTo(SW/2+(x-SW/2)*1.8,SH);c.stroke()}
  c.beginPath();c.moveTo(0,GY+18);c.lineTo(SW,GY+18);c.stroke();
  c.fillStyle='#9a6a3f';rr(c,560,GY-62,80,14,4);c.fill();c.fillStyle='#7c5230';c.fillRect(570,GY-48,10,48);c.fillRect(622,GY-48,10,48);
  ell(c,592,GY-70,12,9,'#ef4444');c.fillStyle='#16a34a';c.fillRect(590,GY-82,3,6);
}
function liveSchool(c,s){
  c.save();c.beginPath();c.rect(30,42,96,96);c.clip();
  for(const [o,y,r] of [[0,70,14],[60,105,11]]){const x=30+((s.t*8+o)%140)-20;ell(c,x,y,r*1.6,r,'#fff');ell(c,x+r,y-4,r,r*.9,'#fff')}
  c.restore();c.fillStyle='#8b6b4a';c.fillRect(77,42,3,96);c.fillRect(30,88,96,3);
  c.strokeStyle='#1f2937';c.lineWidth=3;c.beginPath();c.moveTo(560,72);c.lineTo(560+Math.cos(s.t*.2-1.6)*12,72+Math.sin(s.t*.2-1.6)*12);c.stroke();
  c.lineWidth=2;c.strokeStyle='#dc2626';c.beginPath();c.moveTo(560,72);c.lineTo(560+Math.cos(s.t*2-1.6)*20,72+Math.sin(s.t*2-1.6)*20);c.stroke();
}
function bgCity(c){
  const R=srand(7);
  c.fillStyle=lingrad(c,0,0,0,GY,['#312e81','#7e22ce','#f472b6','#fb923c']);c.fillRect(0,0,SW,SH);
  ell(c,420,GY-70,46,46,'rgba(254,215,170,.9)');
  c.fillStyle='rgba(76,29,149,.55)';for(let x=-10;x<SW;x+=46){const h=60+R()*90;c.fillRect(x,GY-30-h,40,h+30)}
  for(let x=-20;x<SW;x+=74){const h=80+R()*110,w=56+R()*16;c.fillStyle='#1e1b4b';c.fillRect(x,GY-24-h,w,h+24);
    for(let wy=GY-12-h;wy<GY-30;wy+=16)for(let wx=x+8;wx<x+w-10;wx+=14)if(R()<.45){c.fillStyle=R()<.8?'#fde68a':'#fdba74';c.fillRect(wx,wy,7,9)}}
  c.fillStyle='#9ca3af';c.fillRect(0,GY-24,SW,24);c.fillStyle='#6b7280';c.fillRect(0,GY-4,SW,4);
  c.fillStyle='#374151';c.fillRect(0,GY,SW,SH-GY);c.fillStyle='#f8fafc';for(let x=10;x<SW;x+=70)c.fillRect(x,GY+20,38,4);
  c.fillStyle='#1f2937';c.fillRect(46,GY-150,6,128);c.fillRect(46,GY-150,34,5);
}
function liveCity(c,s){
  const g=c.createRadialGradient(80,GY-136,2,80,GY-136,60);g.addColorStop(0,`rgba(254,240,138,${.75+Math.sin(s.t*9)*.05})`);g.addColorStop(1,'rgba(254,240,138,0)');
  c.fillStyle=g;c.fillRect(20,GY-200,120,140);ell(c,80,GY-140,8,5,'#fef9c3');
  const cx=((s.t*120)%(SW+400))-200; // a car crossing now and then
  c.fillStyle='#ef4444';rr(c,cx,GY+2,70,20,6);c.fill();c.fillStyle='#fca5a5';rr(c,cx+14,GY-10,40,14,5);c.fill();
  ell(c,cx+16,GY+22,7,7,'#111827');ell(c,cx+54,GY+22,7,7,'#111827');ell(c,cx+70,GY+10,3,3,'#fef08a');
}
function bgOcean(c){
  const R=srand(11);
  c.fillStyle=lingrad(c,0,0,0,SH,['#38bdf8','#0369a1','#1e3a8a']);c.fillRect(0,0,SW,SH);
  c.fillStyle='rgba(255,255,255,.08)';for(let j=0;j<5;j++){const x=60+j*130;c.beginPath();c.moveTo(x,0);c.lineTo(x+40,0);c.lineTo(x+120,GY);c.lineTo(x+40,GY);c.closePath();c.fill()}
  c.fillStyle='rgba(30,58,138,.5)';c.beginPath();c.moveTo(0,GY-20);for(let x=0;x<=SW;x+=40)c.lineTo(x,GY-40-R()*50);c.lineTo(SW,GY);c.lineTo(0,GY);c.closePath();c.fill();
  c.fillStyle=lingrad(c,0,GY-12,0,SH,['#fde68a','#d97706']);c.beginPath();c.moveTo(0,GY-6);c.quadraticCurveTo(SW/2,GY-18,SW,GY-6);c.lineTo(SW,SH);c.lineTo(0,SH);c.closePath();c.fill();
  for(let j=0;j<10;j++)ell(c,R()*SW,GY+R()*30,2+R()*3,1.5+R()*2,'rgba(146,64,14,.35)');
  for(const [x,col] of [[600,'#f472b6'],[30,'#fb7185']]){c.strokeStyle=col;c.lineWidth=6;c.lineCap='round';
    for(const a of[-.5,0,.5]){c.beginPath();c.moveTo(x,GY);c.quadraticCurveTo(x+a*30,GY-30,x+a*50,GY-60);c.stroke()}}c.lineCap='butt';
  ell(c,560,GY+8,12,8,'#fda4af');ell(c,90,GY+12,10,6,'#fef3c7');
}
function liveOcean(c,s){
  for(const [x,h,ph] of [[70,90,0],[110,60,1],[540,80,2],[580,110,.5]]){c.strokeStyle='#16a34a';c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(x,GY);
    for(let y=0;y<=h;y+=10)c.lineTo(x+Math.sin(s.t*1.6+ph+y*.05)*(y*.12),GY-y);c.stroke()}c.lineCap='butt';
  c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=1.5;for(let j=0;j<12;j++){const y=SH-((s.t*(26+j*3)+j*53)%(SH+20)),x=(j*67)%SW+Math.sin(s.t*2+j)*6;c.beginPath();c.arc(x,y,2+j%3,0,Math.PI*2);c.stroke()}
}
function bgCastle(c){
  const R=srand(23);
  c.fillStyle=lingrad(c,0,0,0,GY,['#0f0a2e','#3b0764','#7e22ce']);c.fillRect(0,0,SW,SH);
  for(let j=0;j<40;j++)ell(c,R()*SW,R()*170,R()*1.4+.4,R()*1.4+.4,'rgba(255,255,255,.8)');
  ell(c,520,80,34,34,'#fef3c7');ell(c,534,72,30,30,'#3b0764');
  c.fillStyle='#1e1033';
  for(const [x,w,h] of [[150,60,150],[230,90,110],[340,56,170],[420,80,120]]){c.fillRect(x,GY-30-h,w,h+30);c.beginPath();c.moveTo(x-8,GY-30-h);c.lineTo(x+w/2,GY-80-h);c.lineTo(x+w+8,GY-30-h);c.closePath();c.fill()}
  c.fillStyle='#f59e0b';for(const [x,y] of [[172,GY-140],[262,GY-100],[360,GY-170],[448,GY-110],[372,GY-120]])c.fillRect(x,y,10,16);
  c.fillStyle=lingrad(c,0,GY,0,SH,['#44403c','#1c1917']);c.fillRect(0,GY,SW,SH-GY);
  c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=2;for(let x=0;x<SW;x+=64){c.beginPath();c.moveTo(x,GY);c.lineTo(x-20,SH);c.stroke()}
  c.strokeStyle='#f97316';c.lineWidth=2;c.shadowColor='#f97316';c.shadowBlur=8;c.beginPath();c.moveTo(60,SH);c.lineTo(90,GY+22);c.lineTo(140,GY+30);c.moveTo(500,SH);c.lineTo(530,GY+18);c.lineTo(600,GY+26);c.stroke();c.shadowBlur=0;
  for(const x of[24,612]){c.fillStyle='#57534e';c.fillRect(x-4,GY-120,8,40)}
}
function liveCastle(c,s){
  for(const x of[24,612]){const f=Math.sin(s.t*14+x)*3;const g=c.createRadialGradient(x,GY-130,2,x,GY-130,40);g.addColorStop(0,'rgba(251,146,60,.6)');g.addColorStop(1,'rgba(251,146,60,0)');
    c.fillStyle=g;c.fillRect(x-40,GY-170,80,80);c.fillStyle='#f97316';c.beginPath();c.moveTo(x-8,GY-120);c.quadraticCurveTo(x+f,GY-150-f,x+8,GY-120);c.closePath();c.fill();
    c.fillStyle='#fde047';c.beginPath();c.moveTo(x-4,GY-120);c.quadraticCurveTo(x+f*.5,GY-138,x+4,GY-120);c.closePath();c.fill()}
  for(let j=0;j<10;j++){const y=SH-((s.t*(30+j*4)+j*41)%(SH-40)),x=(j*89)%SW+Math.sin(s.t+j)*10;ell(c,x,y,1.8,1.8,`rgba(251,146,60,${.4+.4*Math.sin(s.t*3+j)})`)}
}
const WORLDS={school:{bg:bgSchool,live:liveSchool},city:{bg:bgCity,live:liveCity},ocean:{bg:bgOcean,live:liveOcean},castle:{bg:bgCastle,live:liveCastle}};

// ================= ENEMY KINDS =================
// Each draw(c,s,p) paints with the origin at the enemy's feet, facing left (toward the hero).
// p = {t, rage, atk 0..1 (attack swing), hit}. Kind fields: cy/top = body centre/top y, mx,my = where attacks leave from,
// sp/bob/lift = idle motion, shadow, scale, shot = projectile type, pk/parts = particles when hit.
function drawOwl(c,s,p){
  const {t,rage,atk}=p,flap=Math.sin(t*(rage?9:5))*.12,raise=atk*.9;
  for(const fx of[-20,20]){c.fillStyle='#f59e0b';for(let j=-1;j<=1;j++){rr(c,fx+j*6-2.5,-6,5,12,2.5);c.fill()}}
  c.save();c.translate(52,-96);c.rotate(.25-flap);ell(c,10,30,22,46,'#6b4220',-.15);c.restore();
  ell(c,0,-88,64,82,'#8b5a2b');ell(c,0,-70,42,56,'#e9cfa3');
  c.strokeStyle='#c9a571';c.lineWidth=2;for(let r=0;r<4;r++)for(let j=-2;j<=2;j++){const px=j*14+(r%2?7:0),py=-100+r*16;if(Math.abs(px)>34-r*2)continue;c.beginPath();c.arc(px,py,6,.15*Math.PI,.85*Math.PI);c.stroke()}
  c.fillStyle='#6b4220';for(const sx of[-1,1]){c.beginPath();c.moveTo(sx*30,-150);c.lineTo(sx*52,-182);c.lineTo(sx*50,-140);c.closePath();c.fill()}
  ell(c,-25,-126,30,28,'#f4e4c4');ell(c,25,-126,30,28,'#f4e4c4');
  const blink=!rage&&(t%4.2)<.13;
  for(const ex of[-25,25]){
    if(blink){c.strokeStyle='#3f2a14';c.lineWidth=3;c.beginPath();c.moveTo(ex-14,-126);c.lineTo(ex+14,-126);c.stroke();continue}
    ell(c,ex,-126,19,19,'#fff');ell(c,ex-4,-125,11,11,rage?'#dc2626':'#f59e0b');ell(c,ex-6,-125,6,6,'#111');ell(c,ex-3,-129,2.5,2.5,'#fff')}
  c.strokeStyle='#111827';c.lineWidth=3.5;for(const ex of[-25,25]){c.beginPath();c.arc(ex,-126,23,0,Math.PI*2);c.stroke()}
  c.beginPath();c.moveTo(-3,-128);c.quadraticCurveTo(0,-133,3,-128);c.stroke();
  brows(c,rage,-44,10,-152,.3);
  c.fillStyle='#f59e0b';c.beginPath();c.moveTo(-9,-112);c.lineTo(9,-112);c.lineTo(0,-94+atk*4);c.closePath();c.fill();
  c.fillStyle='#1f2937';rr(c,-22,-178,44,14,3);c.fill();
  c.beginPath();c.moveTo(-50,-178);c.lineTo(0,-194);c.lineTo(50,-178);c.lineTo(0,-164);c.closePath();c.fill();
  const tz=Math.sin(t*2)*.3;c.strokeStyle='#facc15';c.lineWidth=2.5;c.beginPath();c.moveTo(0,-178);c.lineTo(-36,-176);c.lineTo(-36+Math.sin(tz)*12,-152);c.stroke();ell(c,-36+Math.sin(tz)*12,-150,4,5,'#facc15');
  c.save();c.translate(-52,-96);c.rotate(-.25+flap-raise);
  c.strokeStyle='#78350f';c.lineWidth=4;c.beginPath();c.moveTo(-8,40);c.lineTo(-58,-18);c.stroke();ell(c,-58,-18,4,4,'#dc2626');
  ell(c,-10,30,22,46,'#6b4220',.15);c.restore();
}
// angry eyebrows centred at x=0: outer x, inner x, y, base tilt
function brows(c,rage,ox,ix,y,tilt){const k=rage?tilt+.25:tilt;c.strokeStyle=rage?'#7f1d1d':'#3f2a14';c.lineWidth=5;c.lineCap='round';
  c.beginPath();c.moveTo(ox,y-k*14);c.lineTo(-ix,y+k*10);c.moveTo(-ox,y-k*14);c.lineTo(ix,y+k*10);c.stroke();c.lineCap='butt'}
function eyes(c,rage,xs,y,r,iris='#111'){for(const ex of xs){ell(c,ex,y,r,r*1.05,'#fff');ell(c,ex-r*.3,y+1,r*.5,r*.5,rage?'#dc2626':iris);ell(c,ex-r*.45,y-r*.25,r*.18,r*.18,'#fff')}}

function drawBook(c,s,p){ // chapter 1 boss: cursed dictionary
  const {t,rage,atk}=p;
  const pages=front=>{for(let j=0;j<4;j++){const a=t*(rage?3:1.6)+j*Math.PI/2,sn=Math.sin(a);if((sn>0)!==front)continue;
    c.save();c.translate(Math.cos(a)*108,-126+sn*26);c.rotate(Math.cos(a+t)*.4);c.fillStyle='#fffbeb';c.fillRect(-12,-15,24,30);
    c.strokeStyle='#d6d3d1';c.lineWidth=1.5;for(let l=0;l<4;l++){c.beginPath();c.moveTo(-8,-8+l*6);c.lineTo(8,-8+l*6);c.stroke()}c.restore()}};
  pages(false);
  c.fillStyle='#3f1d0b';rr(c,-40,-36,16,36,6);c.fill();rr(c,24,-36,16,36,6);c.fill();ell(c,-32,-2,15,6,'#1c0f06');ell(c,32,-2,15,6,'#1c0f06');
  c.fillStyle='#fef3c7';rr(c,-58,-214,140,184,10);c.fill();c.strokeStyle='#e7d7a8';c.lineWidth=1.5;for(let l=0;l<9;l++){c.beginPath();c.moveTo(68,-202+l*19);c.lineTo(80,-202+l*19);c.stroke()}
  c.fillStyle=lingrad(c,-70,0,70,0,['#7f1d1d','#b91c1c','#dc2626']);rr(c,-72,-220,140,188,12);c.fill();
  c.fillStyle='#7f1d1d';rr(c,-72,-220,22,188,10);c.fill();
  c.fillStyle='#fbbf24';for(const [x,y] of [[60,-212],[60,-40]])ell(c,x,y,7,7,'#fbbf24');
  c.strokeStyle='#fbbf24';c.lineWidth=3;rr(c,-36,-206,90,38,6);c.stroke();c.font=`900 22px ${FONT}`;c.textAlign='center';c.fillText('IELTS',9,-179);
  eyes(c,rage,[-14,36],-136,16);brows(c,rage,-34,2,-160,.35);
  const mo=10+atk*28+(rage?Math.abs(Math.sin(t*12))*5:0);
  c.fillStyle='#450a0a';rr(c,-28,-104,76,mo+8,8);c.fill();c.fillStyle='#fff';
  for(let j=0;j<6;j++){const x=-24+j*12;c.beginPath();c.moveTo(x,-104);c.lineTo(x+6,-94);c.lineTo(x+12,-104);c.fill();c.beginPath();c.moveTo(x,-96+mo);c.lineTo(x+6,-106+mo);c.lineTo(x+12,-96+mo);c.fill()}
  c.save();c.translate(-72,-130);c.rotate(-.3-atk*1.1+Math.sin(t*3)*.08);c.fillStyle='#7f1d1d';rr(c,-6,0,12,40,6);c.fill();ell(c,0,44,9,9,'#fef3c7');c.restore();
  pages(true);
}
function drawSlime(c,s,p){ // chapter 2 enemy: slime wearing a traffic cone
  const {t,rage,atk}=p,sq=Math.sin(t*(rage?9:4.5));
  c.save();c.translate(0,-Math.max(0,sq)*12);c.scale(1-sq*.07+atk*.15,1+sq*.07-atk*.1);
  const g=c.createRadialGradient(-22,-84,8,0,-50,96);g.addColorStop(0,'#bbf7d0');g.addColorStop(.5,'#4ade80');g.addColorStop(1,'#15803d');
  c.beginPath();c.moveTo(-64,0);c.bezierCurveTo(-74,-72,-42,-120,0,-120);c.bezierCurveTo(42,-120,74,-72,64,0);c.quadraticCurveTo(0,10,-64,0);c.closePath();c.fillStyle=g;c.fill();
  for(let j=0;j<4;j++)ell(c,-30+j*20,-14-((t*22+j*29)%80),3+j%2*2,3+j%2*2,'rgba(255,255,255,.35)');
  ell(c,-30,-92,13,7,'rgba(255,255,255,.65)',-.5);
  for(const ex of[-22,18]){ell(c,ex,-62,10,13,'#052e16');ell(c,ex-3,-67,3.5,4,'#fff')}
  if(rage)brows(c,true,-36,4,-82,.25);
  ell(c,-36,-46,7,4,'rgba(244,114,182,.55)');ell(c,32,-46,7,4,'rgba(244,114,182,.55)');
  c.strokeStyle='#052e16';c.lineWidth=3;c.beginPath();if(rage||atk>.1)ell(c,-2,-40,8,6+atk*6,'#052e16');else{c.arc(-2,-46,8,.2,Math.PI-.2);c.stroke()}
  c.fillStyle='#ea580c';rr(c,-30,-122,60,9,3);c.fill();c.fillStyle='#f97316';c.beginPath();c.moveTo(-20,-118);c.lineTo(0,-170);c.lineTo(20,-118);c.closePath();c.fill();
  c.fillStyle='#fff';c.fillRect(-12,-146,24,7);
  c.restore();
}
function drawGolem(c,s,p){ // chapter 2 boss: concrete golem
  const {t,rage,atk}=p,sw=Math.sin(t*1.6)*.05;
  const stone=(x,y,w,h,col)=>{c.fillStyle=col;rr(c,x,y,w,h,10);c.fill();c.fillStyle='rgba(0,0,0,.08)';c.fillRect(x+6,y+h-10,w-12,6)};
  c.save();c.translate(78,-170);c.rotate(.2-sw);stone(-20,0,40,90,'#78716c');stone(-26,84,52,38,'#57534e');c.restore();
  stone(-56,-56,42,56,'#6b7280');stone(14,-56,42,56,'#6b7280');
  stone(-80,-178,160,130,'#9ca3af');
  c.strokeStyle='#4b5563';c.lineWidth=2.5;c.beginPath();c.moveTo(-40,-170);c.lineTo(-24,-140);c.lineTo(-34,-110);c.moveTo(30,-120);c.lineTo(48,-96);c.lineTo(40,-70);c.stroke();
  ell(c,-60,-176,20,8,'#65a30d');ell(c,-44,-180,12,6,'#84cc16');
  c.strokeStyle='#92400e';c.lineWidth=4;c.beginPath();c.moveTo(70,-178);c.lineTo(86,-206);c.moveTo(56,-178);c.lineTo(60,-200);c.stroke();
  stone(-44,-236,88,62,'#a8a29e');
  c.save();c.shadowColor=rage?'#ef4444':'#facc15';c.shadowBlur=16;c.fillStyle=rage?'#ef4444':'#fde047';
  for(const ex of[-24,8]){rr(c,ex,-212,18,10,3);c.fill()}c.restore();
  c.fillStyle='#57534e';c.fillRect(-30,-222,62,6);c.fillStyle='#44403c';rr(c,-18,-192,36,8,3);c.fill();
  c.save();c.translate(-82,-170);c.rotate(-.15-atk*1.3+sw);stone(-20,0,40,90,'#9ca3af');stone(-28,84,56,40,'#78716c');c.restore();
}
function drawJelly(c,s,p){ // chapter 3 enemy: electric jellyfish
  const {t,rage,atk}=p,pulse=Math.sin(t*(rage?7:3.5));
  c.save();c.globalAlpha=.9;
  for(let j=0;j<6;j++){const bx=-38+j*15;c.strokeStyle=j%2?'#f0abfc':'#e879f9';c.lineWidth=4-j%2;c.lineCap='round';c.beginPath();c.moveTo(bx,-118);
    for(let k=1;k<=10;k++)c.lineTo(bx+Math.sin(t*3+k*.7+j)*(k*.9)-atk*k*2,-118+k*(9+pulse));c.stroke()}
  c.lineCap='butt';c.restore();
  c.save();c.shadowColor='#f0abfc';c.shadowBlur=rage?26:16;
  c.fillStyle=lingrad(c,0,-200,0,-110,['#f5d0fe','#c084fc','#a855f7']);c.beginPath();
  const rx=56+pulse*3,ry=52-pulse*3;c.ellipse(0,-122,rx,ry,0,Math.PI,0);
  for(let j=8;j>=0;j--){const x=-rx+j*(rx*2/8);c.quadraticCurveTo(x+rx/8,-112,x,-122)}c.closePath();c.fill();c.restore();
  ell(c,-22,-152,12,7,'rgba(255,255,255,.55)',-.4);
  for(const ex of[-16,16]){ell(c,ex,-136,6,8,'#3b0764');ell(c,ex-2,-139,2,2.5,'#fff')}
  if(rage){brows(c,true,-28,4,-150,.25);c.strokeStyle='#fde047';c.lineWidth=2.5;for(let j=0;j<3;j++){const a=t*6+j*2.1,x=Math.cos(a)*70,y=-130+Math.sin(a)*40;c.beginPath();c.moveTo(x,y);c.lineTo(x+6,y+6);c.lineTo(x-2,y+8);c.lineTo(x+4,y+16);c.stroke()}}
  c.strokeStyle='#3b0764';c.lineWidth=2.5;c.beginPath();c.arc(0,-124,5,.2,Math.PI-.2);c.stroke();
}
function drawOcto(c,s,p){ // chapter 3 boss: bureaucrat octopus with rubber stamps
  const {t,rage,atk}=p;
  const arm=(bx,by,dir,ph,stamp)=>{let x=bx,y=by,a=Math.PI/2+dir*.6;const pts=[];
    for(let k=0;k<13;k++){pts.push([x,y,15*(1-k/15)]);a+=Math.sin(t*2.2+k*.45+ph)*.18*dir-(stamp?atk*.16:0);x+=Math.cos(a)*10;y+=Math.sin(a)*10}
    for(const [px,py,r] of pts)ell(c,px,py,r,r,'#9333ea');for(let k=2;k<pts.length;k+=2)ell(c,pts[k][0]-2,pts[k][1]+3,pts[k][2]*.35,pts[k][2]*.3,'#f5d0fe');
    if(stamp){const [px,py]=pts[pts.length-1];c.fillStyle='#78350f';rr(c,px-5,py-26,10,20,4);c.fill();c.fillStyle='#dc2626';rr(c,px-13,py-8,26,10,3);c.fill()}};
  arm(40,-96,1,0);arm(60,-110,1,1.5);arm(-10,-90,1,3);
  ell(c,0,-150,82,74,'#a855f7');
  const g=c.createRadialGradient(-26,-186,6,0,-150,84);g.addColorStop(0,'#e9d5ff');g.addColorStop(.5,'#c084fc');g.addColorStop(1,'#7e22ce');ell(c,0,-150,80,72,g);
  for(const [x,y,r] of [[34,-190,8],[52,-160,6],[-46,-196,6],[20,-206,5]])ell(c,x,y,r,r,'rgba(126,34,206,.45)');
  eyes(c,rage,[-30,22],-142,18);brows(c,rage,-48,6,-170,.35);
  c.strokeStyle='#3b0764';c.lineWidth=3;c.beginPath();c.moveTo(-18,-106+atk*4);c.quadraticCurveTo(-4,-112-(rage?6:0),12,-106+atk*4);c.stroke();
  c.fillStyle='#1f2937';rr(c,-24,-232,48,18,4);c.fill();c.fillRect(-34,-216,68,5);
  arm(-40,-96,-1,2,true);arm(-62,-112,-1,.7,true);arm(-20,-88,-1,4);
}
function drawDragon(c,s,p,big){ // chapter 4: whelp (stage 19) and the final IELTS dragon
  const {t,rage,atk}=p,body=big?'#7c3aed':'#14b8a6',dark=big?'#4c1d95':'#0f766e',belly=big?'#fcd34d':'#fde68a',flap=Math.sin(t*(rage?10:5));
  c.save();c.fillStyle=dark;c.translate(10,-130);c.rotate(-.2+flap*.25);c.beginPath();c.moveTo(0,0);c.lineTo(70,-80);c.lineTo(100,-40);c.quadraticCurveTo(80,-30,92,-6);c.quadraticCurveTo(66,-10,64,10);c.quadraticCurveTo(40,0,30,24);c.closePath();c.fill();c.restore();
  c.strokeStyle=body;c.lineCap='round';for(let k=0;k<8;k++){c.lineWidth=22-k*2.4;c.beginPath();const x0=40+k*12,y0=-40+Math.sin(t*2+k*.6)*k*1.6;c.moveTo(x0,y0);c.lineTo(x0+12,-40+Math.sin(t*2+(k+1)*.6)*(k+1)*1.6);c.stroke()}c.lineCap='butt';
  c.fillStyle=belly;c.beginPath();c.moveTo(138,-40+Math.sin(t*2+8*.6)*13);c.lineTo(154,-52);c.lineTo(150,-30);c.closePath();c.fill();
  for(const lx of[-20,22]){c.fillStyle=dark;rr(c,lx-10,-40,22,40,8);c.fill();ell(c,lx,-2,15,6,dark)}
  ell(c,6,-84,52,58,body);ell(c,-4,-76,32,44,belly);c.strokeStyle='rgba(180,83,9,.35)';c.lineWidth=2;for(let j=0;j<4;j++){c.beginPath();c.moveTo(-28,-100+j*16);c.lineTo(20,-100+j*16);c.stroke()}
  c.fillStyle=belly;for(let j=0;j<4;j++){c.beginPath();c.moveTo(30+j*8,-138+j*10);c.lineTo(44+j*8,-150+j*10);c.lineTo(40+j*8,-130+j*10);c.closePath();c.fill()}
  c.save();c.translate(-26,-128);c.rotate(-.1-atk*.25);
  c.fillStyle=body;rr(c,-14,-36,32,50,14);c.fill();
  ell(c,-16,-52,38,30,body);ell(c,-52,-44,26,18,body);ell(c,-60,-48,3,2.5,'#111');ell(c,-66,-44,3,2.5,'#111');
  c.fillStyle='#fef3c7';for(const hx of[-6,10]){c.beginPath();c.moveTo(hx,-74);c.quadraticCurveTo(hx+18,-96,hx+30,-92);c.quadraticCurveTo(hx+14,-84,hx+8,-66);c.closePath();c.fill()}
  eyes(c,rage,[-22],-60,10,big?'#dc2626':'#f59e0b');
  c.strokeStyle=rage?'#7f1d1d':'#1f2937';c.lineWidth=4;c.lineCap='round';c.beginPath();c.moveTo(-36,-76);c.lineTo(-10,-68-(rage?4:0));c.stroke();c.lineCap='butt';
  const jaw=atk*16;c.fillStyle='#7f1d1d';c.beginPath();c.moveTo(-76,-38);c.lineTo(-36,-36);c.lineTo(-40,-30+jaw);c.lineTo(-72,-34+jaw);c.closePath();c.fill();
  c.fillStyle=body;rr(c,-76,-34+jaw,40,10,5);c.fill();c.fillStyle='#fff';for(let j=0;j<3;j++){c.beginPath();c.moveTo(-70+j*10,-38);c.lineTo(-66+j*10,-31);c.lineTo(-62+j*10,-38);c.fill()}
  if(big){c.fillStyle='#facc15';c.beginPath();c.moveTo(-40,-80);c.lineTo(-36,-104);c.lineTo(-26,-90);c.lineTo(-16,-108);c.lineTo(-6,-90);c.lineTo(4,-104);c.lineTo(8,-80);c.closePath();c.fill();
    c.fillStyle='#7c2d12';c.font=`900 11px ${FONT}`;c.textAlign='center';c.fillText('6.5',-16,-84)}
  c.restore();
  c.save();c.fillStyle=body;c.translate(-30,-90);c.rotate(.6-atk*.8);rr(c,-6,0,12,30,6);c.fill();c.restore();
  c.save();c.fillStyle=dark;c.globalAlpha=.9;c.translate(-10,-136);c.rotate(.15-flap*.25);c.beginPath();c.moveTo(0,0);c.lineTo(40,-96);c.lineTo(72,-60);c.quadraticCurveTo(52,-48,60,-24);c.quadraticCurveTo(36,-26,30,-4);c.closePath();c.fill();c.restore();
}
const KINDS={
  owl:{draw:drawOwl,cy:-120,top:-200,mx:-70,my:-130,sp:2.2,bob:7,lift:14,shadow:58,shot:'paper',pk:'feather',parts:['#8b5a2b','#a16207','#e9cfa3']},
  book:{draw:drawBook,cy:-130,top:-230,mx:0,my:-96,sp:1.8,bob:6,lift:8,shadow:72,shot:'paper',pk:'page',parts:['#fffbeb','#fef3c7','#dc2626']},
  slime:{draw:drawSlime,cy:-62,top:-170,mx:-40,my:-50,sp:2,bob:0,lift:0,shadow:62,shot:'goo',pk:'dot',parts:['#4ade80','#22c55e','#bbf7d0']},
  golem:{draw:drawGolem,cy:-130,top:-240,mx:-90,my:-60,sp:1.4,bob:2,lift:0,shadow:86,scale:.86,shot:'rock',pk:'rock',parts:['#9ca3af','#6b7280','#a8a29e']},
  jelly:{draw:drawJelly,cy:-120,top:-180,mx:-20,my:-130,sp:1.8,bob:12,lift:40,shadow:44,shot:'zap',pk:'dot',parts:['#f0abfc','#c084fc','#fde047']},
  octo:{draw:drawOcto,cy:-140,top:-240,mx:-70,my:-110,sp:1.6,bob:6,lift:6,shadow:90,shot:'ink',pk:'dot',parts:['#a855f7','#e9d5ff','#3b0764']},
  whelp:{draw:(c,s,p)=>drawDragon(c,s,p,false),cy:-100,top:-200,mx:-100,my:-150,sp:2.4,bob:10,lift:36,shadow:50,scale:.8,shot:'fire',pk:'dot',parts:['#14b8a6','#fde68a','#f97316']},
  dragon:{draw:(c,s,p)=>drawDragon(c,s,p,true),cy:-100,top:-210,mx:-100,my:-160,sp:1.6,bob:5,lift:6,shadow:80,scale:1,shot:'fire',pk:'dot',parts:['#7c3aed','#fcd34d','#f97316']}
};
