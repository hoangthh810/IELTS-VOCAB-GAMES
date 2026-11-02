// ================= BOSS ADVENTURE =================
const BOSSES=[
 {e:'🦉',n:'Cú Giáo Sư Khó Tính',l:'Ngươi đã học bài chưa mà dám vào lớp ta?'},
 {e:'🌋',n:'Núi Lửa Ô Nhiễm',l:'Khói bụi của ta sẽ làm ngươi quên sạch từ vựng!'},
 {e:'🤖',n:'Robot Hacker',l:'Đang tải virus... xoá sạch trí nhớ của ngươi!'},
 {e:'🦠',n:'Virus Lười Biếng',l:'Nằm xuống đi, học làm gì cho mệt...'},
 {e:'👔',n:'Sếp Deadline',l:'Báo cáo đâu? Hạn chót là 5 phút nữa!'},
 {e:'🐙',n:'Bạch Tuộc Thất Lạc Hành Lý',l:'Vali của ngươi giờ là của ta!'},
 {e:'🦹',n:'Siêu Trộm Bóng Đêm',l:'Ta sẽ trộm sạch điểm số của ngươi!'},
 {e:'🗿',n:'Golem Bê Tông',l:'Thành phố này là của ta, kẻ lạ mặt!'},
 {e:'👻',n:'Bóng Ma Cô Đơn',l:'Không ai làm bạn với ngươi đâu...'},
 {e:'🦁',n:'Lân Tinh Nghịch',l:'Muốn lì xì thì phải thắng ta trước!'},
 {e:'🕷️',n:'Nhện Bụi Bặm',l:'Nhà ngươi bừa quá, ta giăng tơ khắp nơi rồi!'},
 {e:'🐼',n:'Gấu Trúc Lười Nhác',l:'Cứ nằm xem phim cả ngày như ta đi...'},
 {e:'🦖',n:'Khủng Long Kẹt Xe',l:'Giờ cao điểm rồi, đừng hòng thoát!'},
 {e:'🐍',n:'Rắn Bất Công',l:'Khoảng cách giàu nghèo là sức mạnh của ta!'},
 {e:'🧌',n:'Troll Khoảng Cách Thế Hệ',l:'Thời của ta khác thời của ngươi!'},
 {e:'👾',n:'Quái Vật Đồ Ăn Nhanh',l:'Ăn thêm miếng nữa đi... rồi ngủ quên!'},
 {e:'🦊',n:'Cáo Tin Giả',l:'Tin ta đi, ta là nguồn tin đáng tin nhất!'},
 {e:'🐲',n:'Rồng IELTS Tối Thượng',l:'Ta là trùm cuối. Không 6.5 thì đừng mơ qua!'}];
const ITEMS={
 potion:{e:'🧪',n:'Bình máu',d:'Hồi 40 HP',price:50},
 shield:{e:'🛡️',n:'Khiên',d:'Chặn hoàn toàn đòn đánh kế tiếp của boss',price:60},
 half:{e:'💡',n:'Gợi ý 50/50',d:'Loại 2 đáp án sai, hoặc hiện nửa số chữ',price:40},
 rage:{e:'💢',n:'Thuốc cuồng nộ',d:'Đòn đúng kế tiếp gây x2 sát thương',price:70}};
const DMG={quiz:20,col:26,fill:36}, DLABEL={quiz:'Dễ',col:'Vừa',fill:'Khó'};
const RPG0={gold:50,cleared:{},inv:{potion:2,shield:1,half:1,rage:0},hpLv:0};
st.rpg=Object.assign(JSON.parse(JSON.stringify(RPG0)),st.rpg||{});
st.rpg.inv=Object.assign({...RPG0.inv},st.rpg.inv||{});
const maxHp=()=>100+st.rpg.hpLv*15;
const unlocked=i=>i===0||!!st.rpg.cleared[i-1];
const LAST=DATA.length; // index of final boss
function cfg(i){const final=i===LAST;return{i,final,b:BOSSES[i],topic:final?'Tất cả chủ đề':DATA[i].name,
  hp:final?600:120+i*20,atk:final?34:Math.round(12+i*1.2),tq:Math.max(9,16-Math.floor(i/4)),tf:Math.max(16,28-Math.floor(i/3))}}
function touchStreak(){const t=dayKey();if(st.last!==t){st.streak=(st.last===yesterday())?st.streak+1:1;st.last=t}
  if(st.streak>=3)unlock('streak3');if(st.streak>=7)unlock('streak7')}
function xpBadges(){if(st.xp>=500)unlock('xp500');if(st.xp>=2000)unlock('xp2000')}

// ---------- map & shop ----------
function openMap(){poolOverride=null;renderMap();show('map')}
function renderMap(){
  const r=st.rpg;
  $('mapbar').innerHTML=`<span class="pill">💰 ${r.gold}</span><span class="pill">❤️ ${maxHp()} HP</span>`+
    Object.entries(ITEMS).map(([k,v])=>`<span class="pill" title="${v.n}">${v.e} ${r.inv[k]}</span>`).join('');
  let cur=-1;for(let i=0;i<=LAST;i++){if(unlocked(i)&&!r.cleared[i]){cur=i;break}}
  let h='';for(let i=0;i<=LAST;i++){const c=cfg(i),lock=!unlocked(i),s=r.cleared[i]||0;
    h+=`<button class="stage ${lock?'locked':''} ${c.final?'final':''} ${i===cur?'cur':''}" data-i="${i}" ${lock?'disabled':''}>
      <div class="e">${lock?'🔒':c.b.e}</div><b>${c.final?'TRÙM CUỐI · ':'Màn '+(i+1)+' · '}${esc(c.b.n)}</b>
      <small>${esc(c.topic)}</small><small>❤️ ${c.hp} HP · ⚔️ ${c.atk}</small>
      <div class="stars">${'★'.repeat(s)}${'☆'.repeat(3-s)}</div></button>`}
  $('stages').innerHTML=h;
  const up=r.hpLv<5?120*(r.hpLv+1):null;
  $('shop').innerHTML=Object.entries(ITEMS).map(([k,v])=>`<div class="shopit"><div class="e">${v.e}</div><div><b>${v.n}</b> <small>${v.d} · Đang có: ${r.inv[k]}</small></div><button class="btn" data-buy="${k}" ${r.gold<v.price?'disabled':''}>💰 ${v.price}</button></div>`).join('')+
    `<div class="shopit"><div class="e">❤️</div><div><b>Bùa sinh lực</b> <small>+15 máu tối đa vĩnh viễn · Cấp ${r.hpLv}/5</small></div>${up?`<button class="btn" data-buy="hp" ${r.gold<up?'disabled':''}>💰 ${up}</button>`:'<span class="pill">MAX</span>'}</div>`;
}
$('advBtn').onclick=openMap;
$('mapBack').onclick=()=>{show('home');renderHome()};
$('stages').onclick=e=>{const b=e.target.closest('.stage');if(b&&!b.disabled)startBattle(+b.dataset.i)};
$('shop').onclick=e=>{const b=e.target.closest('[data-buy]');if(!b||b.disabled)return;const k=b.dataset.buy,r=st.rpg;
  if(k==='hp'){const p=120*(r.hpLv+1);if(r.gold<p||r.hpLv>=5)return;r.gold-=p;r.hpLv++;toast(`❤️ Máu tối đa tăng lên ${maxHp()}!`)}
  else{const v=ITEMS[k];if(r.gold<v.price)return;r.gold-=v.price;r.inv[k]++;toast(`Đã mua ${v.e} ${v.n}`)}
  save();beep('ok');renderMap()};

// ---------- battle ----------
let B=null;
function startBattle(i){
  const c=cfg(i);poolOverride=c.final?ALL:ALL.filter(x=>x.ti===i);
  B={i,c,bossHp:c.hp,hp:maxHp(),max:maxHp(),combo:0,maxCombo:0,shield:false,rage:false,used:new Set(),
     correct:0,total:0,wrongList:[],xp0:st.xp,over:false,answered:false,halfUsed:false};
  $('bStage').textContent=(c.final?'Trùm cuối':'Màn '+(i+1))+' · '+c.topic;
  $('bossE').textContent=c.b.e;$('bossE').className='boss';$('bossN').textContent=c.b.n;
  $('bubble').textContent='💬 '+c.b.l;
  show('battle');updB();nextB();
}
function updB(){
  const c=B.c,enr=B.bossHp>0&&B.bossHp/c.hp<.3;
  $('bossBar').style.width=(B.bossHp/c.hp*100)+'%';$('bossTxt').textContent=`${B.bossHp} / ${c.hp} HP`;
  $('meBar').style.width=(B.hp/B.max*100)+'%';$('meTxt').textContent=`${B.hp} / ${B.max} HP`;
  $('rageTag').classList.toggle('show',enr);$('bossE').classList.toggle('enraged',enr);
  $('meStatus').textContent=(B.shield?'🛡️':'')+(B.rage?'💢':'');
  $('bCombo').textContent=`🔥 ${B.combo}`;
  $('items').innerHTML=Object.entries(ITEMS).map(([k,v])=>`<button class="itm" data-k="${k}" ${st.rpg.inv[k]?'':'disabled'} title="${v.d}">${v.e} ${st.rpg.inv[k]}<small>${v.n}</small></button>`).join('');
}
function nextB(){
  if(B.over)return;clearTimeout(B.auto);
  B.answered=false;B.halfUsed=false;
  if(B.used.size>=poolOverride.length-4)B.used.clear();
  const r=Math.random(),t=r<.4?'quiz':r<.7?'col':'fill';
  const q=t==='quiz'?makeQuiz(B.used):t==='fill'?makeFill(B.used):makeCol(B.used);
  B.q=q;B.used.add(q.it.id);
  $('bqType').textContent=q.label;$('bqDiff').textContent=`⚔️ ${DMG[q.type]} sát thương · Độ khó: ${DLABEL[q.type]}`;
  $('bqMain').innerHTML=q.main;$('bqMain').classList.toggle('sentence',!!q.sentence);
  $('bqSub').innerHTML=q.sub;$('bqHint').innerHTML=q.hint;$('bFb').className='feedback';
  if(q.options){$('bForm').style.display='none';
    $('bOpts').innerHTML=q.options.map((v,i)=>`<button class="opt" data-v="${esc(v)}"><span class="k">${i+1}</span><span>${esc(v)}</span></button>`).join('');
  }else{$('bOpts').innerHTML='';$('bForm').style.display='flex';const inp=$('bIn');inp.value='';inp.className='';inp.disabled=false;setTimeout(()=>inp.focus(),50)}
  startTimer(q.type==='fill'?B.c.tf:B.c.tq);
}
function startTimer(sec){stopTimer();B.tMax=sec*1000;B.t0=Date.now();const bar=$('tBar');bar.style.width='100%';bar.classList.remove('low');
  B.tick=setInterval(()=>{const left=Math.max(0,1-(Date.now()-B.t0)/B.tMax);bar.style.width=left*100+'%';bar.classList.toggle('low',left<.3);
    if(left<=0){stopTimer();answerB('',null,true)}},100)}
function stopTimer(){if(B)clearInterval(B.tick)}
function floatAt(txt,color,x,y){const d=document.createElement('div');d.className='dmg';d.textContent=txt;d.style.color=color;d.style.left=x+'px';d.style.top=y+'px';$('arena').appendChild(d);setTimeout(()=>d.remove(),1000)}
function anim(el,cls){el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),500)}
function bossAttack(){
  const enr=B.bossHp/B.c.hp<.3;const d=Math.round(B.c.atk*(enr?1.3:1)*(.85+Math.random()*.3));
  anim($('bossE'),'atk');
  if(B.shield){B.shield=false;floatAt('🛡️ Chặn!','var(--accent)',56,$('meE').offsetTop-8);return `🛡️ Khiên đã chặn đòn của boss!`}
  B.hp=Math.max(0,B.hp-d);
  setTimeout(()=>{$('flash').classList.add('on');anim($('meE'),'hurt');floatAt('-'+d,'var(--bad)',56,$('meE').offsetTop-8);setTimeout(()=>$('flash').classList.remove('on'),180)},200);
  return `${B.c.b.e} Boss phản đòn: <b>-${d} HP</b>${enr?' (đang nổi điên!)':''}`;
}
function answerB(v,el,timeout){
  if(!B||B.answered||B.over)return;B.answered=true;stopTimer();B.total++;
  const q=B.q,id=q.it.id;
  const ok=!timeout&&v.toLowerCase().replace(/[’]/g,"'")===q.answer.toLowerCase();
  if(q.options){document.querySelectorAll('#bOpts .opt').forEach(b=>{b.disabled=true;if(b.dataset.v===q.answer)b.classList.add('right');else if(b===el)b.classList.add('wrong')})}
  else{const i=$('bIn');i.disabled=true;i.classList.add(ok?'right':'wrong')}
  if(!st.modes.includes(q.type)){st.modes.push(q.type);if(st.modes.length>=3)unlock('allmodes')}
  let title,line='';
  if(ok){
    B.correct++;B.combo++;B.maxCombo=Math.max(B.maxCombo,B.combo);
    let dmg=DMG[q.type]*(1+Math.min(.5,(B.combo-1)*.1));const tags=[];
    if(B.combo>=3)tags.push(`Combo x${B.combo}`);
    if(B.rage){dmg*=2;B.rage=false;tags.push('Cuồng nộ x2')}
    dmg=Math.round(dmg);B.bossHp=Math.max(0,B.bossHp-dmg);st.xp+=10;
    if(st.wrong[id]){delete st.wrong[id];st.fixed=(st.fixed||0)+1;if(st.fixed>=10)unlock('fixer')}
    anim($('bossE'),'hit');floatAt('-'+dmg+(tags.length?' 💥':''),tags.length?'var(--yellow)':'var(--bad)',90,10);beep('ok');
    if(B.combo>=5)unlock('combo5');if(B.combo>=10)unlock('combo10');
    title=`💥 Trúng đòn! -${dmg} HP`+(tags.length?` (${tags.join(', ')})`:'');
  }else{
    B.combo=0;st.wrong[id]=(st.wrong[id]||0)+1;B.wrongList.push(q);beep('no');
    line=bossAttack();
    title=timeout?'⏰ Hết giờ!':(v?'❌ Sai rồi!':'🤷 Bỏ qua');
  }
  save();updB();xpBadges();
  $('bFbT').textContent=title;
  $('bFbA').innerHTML=(line?line+'<br>':'')+(ok?'':`Đáp án đúng: <b>${esc(q.type==='col'?q.it.term:q.answer)}</b>`);
  $('bFbEx').innerHTML=`<b>${esc(q.it.term)}</b>: ${esc(q.it.mean)}<br>📝 ${hlEx(q.it.ex,q.it.term)}`;
  $('bFb').className='feedback show '+(ok?'ok':'no');$('bNext').style.display='';
  if(B.bossHp<=0){B.over=true;$('bNext').style.display='none';setTimeout(()=>$('bossE').classList.add('dead'),400);setTimeout(victory,1500)}
  else if(B.hp<=0){B.over=true;$('bNext').style.display='none';setTimeout(defeat,1300)}
  else{if(ok)B.auto=setTimeout(goNextB,1800);setTimeout(()=>$('bNext').focus(),30)}
}
function goNextB(){clearTimeout(B.auto);if(!B.over&&B.answered)nextB()}
$('bOpts').onclick=e=>{const b=e.target.closest('.opt');if(b&&!b.disabled)answerB(b.dataset.v,b)};
$('bForm').onsubmit=e=>{e.preventDefault();if(B.answered){goNextB();return}const v=$('bIn').value.trim();if(v)answerB(v,$('bIn'))};
$('bNext').onclick=goNextB;
$('bQuit').onclick=()=>{if(confirm('Bỏ chạy khỏi trận đánh? Tiến độ trận này sẽ mất.')){stopTimer();clearTimeout(B.auto);B.over=true;openMap()}};
$('items').onclick=e=>{
  const b=e.target.closest('.itm');if(!b||!B||B.over)return;const k=b.dataset.k,inv=st.rpg.inv;if(!inv[k])return;
  if(k==='potion'){if(B.hp>=B.max){toast('Máu đang đầy rồi!');return}const h=Math.min(40,B.max-B.hp);B.hp+=h;floatAt('+'+h,'var(--good)',56,$('meE').offsetTop-8)}
  if(k==='shield'){if(B.shield){toast('Khiên đang được kích hoạt rồi');return}B.shield=true}
  if(k==='rage'){if(B.rage){toast('Cuồng nộ đang được kích hoạt rồi');return}B.rage=true}
  if(k==='half'){if(B.answered||B.halfUsed){toast('Dùng khi đang trả lời câu hỏi nhé');return}B.halfUsed=true;const q=B.q;
    if(q.options){shuffle([...document.querySelectorAll('#bOpts .opt')].filter(o=>o.dataset.v!==q.answer)).slice(0,2).forEach(o=>{o.classList.add('gone');o.disabled=true})}
    else{const n=Math.ceil(q.answer.length/2);$('bqHint').innerHTML=`💡 ${esc(q.answer.slice(0,n))}${'_'.repeat(q.answer.length-n)} (${q.answer.length} ký tự)`}}
  inv[k]--;save();beep('ok');updB();
};

// ---------- end of battle ----------
function victory(){
  stopTimer();const r=st.rpg,ratio=B.hp/B.max,stars=ratio>=.7?3:ratio>=.4?2:1;
  const first=!r.cleared[B.i];r.cleared[B.i]=Math.max(stars,r.cleared[B.i]||0);
  touchStreak();save();unlock('boss1');if(stars===3)unlock('stars3');if(B.c.final)unlock('dragon');xpBadges();
  B.reward={stars,first,opened:false};
  $('vTitle').textContent=`Đã hạ ${B.c.b.n}!`;
  $('vStars').innerHTML=[1,2,3].map(n=>n<=stars?'★':'<span class="off">★</span>').join('');
  $('vSub').textContent=`Đúng ${B.correct}/${B.total} câu · Combo cao nhất ${B.maxCombo} · Còn ${B.hp}/${B.max} HP · +${st.xp-B.xp0} XP`+(first?' · Lần đầu chiến thắng!':'');
  const ch=$('chest');ch.className='chest'+(stars===3?' gold':'');ch.style.display='';
  $('chestHint').style.display='';$('chestHint').textContent=stars===3?'✨ Rương vàng! Chạm để mở!':'Chạm vào rương để mở!';
  $('rewards').innerHTML='';$('vActions').style.display='none';
  $('vNext').style.display=B.i<LAST?'':'none';
  show('victory');confetti(90);beep('badge');
}
$('chest').onclick=()=>{
  const R=B.reward;if(!R||R.opened)return;R.opened=true;const r=st.rpg;
  $('chest').classList.add('open');$('chestHint').style.display='none';
  const gold=25+B.i*4+R.stars*10+(R.first?30:0);r.gold+=gold;
  const got={};const n=R.stars+(R.first?1:0);
  if(R.first)got.potion=1;
  for(let j=0;j<n-(R.first?1:0);j++){const x=Math.random();const k=x<.4?'potion':x<.65?'shield':x<.9?'half':'rage';got[k]=(got[k]||0)+1}
  Object.entries(got).forEach(([k,c])=>r.inv[k]+=c);save();
  setTimeout(()=>{$('chest').style.display='none';
    $('rewards').innerHTML=`<div class="reward"><span class="e">💰</span>+${gold} vàng</div>`+
      Object.entries(got).map(([k,c],j)=>`<div class="reward" style="animation-delay:${(j+1)*.15}s"><span class="e">${ITEMS[k].e}</span>${ITEMS[k].n} x${c}</div>`).join('');
    $('vActions').style.display='';confetti(50);beep('end')},450);
};
$('vNext').onclick=()=>startBattle(B.i+1);
$('vMap').onclick=openMap;
function defeat(){
  stopTimer();st.rpg.gold+=10;touchStreak();save();
  $('dSub').innerHTML=`${B.c.b.e} ${esc(B.c.b.n)} còn ${B.bossHp}/${B.c.hp} HP.<br>Bạn nhận 10 💰 an ủi và +${st.xp-B.xp0} XP. Mẹo: mua thêm 🧪 Bình máu hoặc 🛡️ Khiên trong cửa hàng, và ôn lại các từ bên dưới.`;
  $('dReview').innerHTML=B.wrongList.length?`<h2>📕 Từ cần ôn lại</h2>`+B.wrongList.map(q=>`<div class="it"><b>${esc(q.it.term)}</b>: ${esc(q.it.mean)}<br><span class="empty">${hlEx(q.it.ex,q.it.term)}</span></div>`).join(''):'';
  show('defeat');beep('no');
}
$('dRetry').onclick=()=>startBattle(B.i);
$('dMap').onclick=openMap;
document.addEventListener('keydown',e=>{
  if(!B||!$('battle').classList.contains('show'))return;
  if(B.answered&&e.key==='Enter'&&e.target.id!=='bIn'){e.preventDefault();goNextB();return}
  if(!B.answered&&B.q&&B.q.options&&/^[1-4]$/.test(e.key)){const b=document.querySelectorAll('#bOpts .opt')[+e.key-1];if(b&&!b.disabled)b.click()}
});
