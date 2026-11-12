// ---------- home ----------
let sel=new Set(Array.isArray(st.topics)?st.topics.filter(t=>topicKeys().includes(t)):topicKeys());
let useWrong=false;
const wrongIds=()=>Object.keys(st.wrong).filter(id=>BYID[id]); // skips words of deleted decks
function renderChips(){
  const c=$('chips'),keys=topicKeys(),allOn=keys.every(k=>sel.has(k))&&!useWrong;
  const wn=wrongIds().length;
  c.innerHTML=`<button class="chip ${allOn?'on':''}" data-t="all">✨ Tất cả</button>`+
    keys.map(k=>`<button class="chip ${isDeck(k)?'deckchip':''} ${sel.has(k)&&!useWrong?'on':''}" data-t="${k}">${esc(topicName(k))}</button>`).join('')+
    (wn?`<button class="chip wrongbank ${useWrong?'on':''}" data-t="wrong">📕 Từ hay sai (${wn})</button>`:'');
}
$('chips').onclick=e=>{
  const b=e.target.closest('.chip');if(!b)return;const t=b.dataset.t;
  if(t==='wrong'){useWrong=!useWrong}
  else{useWrong=false;
    if(t==='all'){const keys=topicKeys();sel=keys.every(k=>sel.has(k))?new Set():new Set(keys)}
    else{const i=/^\d+$/.test(t)?+t:t;sel.has(i)?sel.delete(i):sel.add(i)}
    st.topics=[...sel];save()}
  renderChips();
};
function renderHome(){
  applyFreeze();
  if(useWrong&&!wrongIds().length)useWrong=false;
  $('sStreak').textContent=liveStreak();$('sXp').textContent=st.xp;$('sWrong').textContent=wrongIds().length;
  const lv=Math.floor(st.xp/300)+1, into=st.xp%300;
  $('lvName').textContent=`Level ${lv}`;$('lvNext').textContent=`${into}/300 XP`;$('lvBar').style.width=(into/300*100)+'%';
  $('soundBtn').textContent=st.sound?'🔊':'🔇';
  $('badges').innerHTML=BADGES.map(b=>`<div class="badge ${st.badges.includes(b.id)?'':'locked'}"><div class="e">${b.e}</div><b>${b.n}</b><small>${b.d}</small></div>`).join('');
  const nd=liveDecks().length;$('deckSub').textContent=nd?`${nd} bộ · ${deckCount()} từ · bấm để nhập thêm, đấu trường, tải về`:'Học từ vựng của bạn: dán từ Excel, Quizlet hoặc nhờ AI định dạng';
  renderChips();renderSrs();renderQuests();renderChBanner();renderStreak();renderPet();renderWotd();
}
// word of the day: one advanced (C1/C2) built-in word picked from the date, the same on every device
const wotd=()=>{const P=ALL.slice(0,CORE_N).filter(x=>x.lvl);let h=0;for(const ch of dayKey())h=(h*131+ch.charCodeAt(0))>>>0;return P[h%P.length]};
function renderWotd(){
  const it=wotd(),has=!!st.srs[it.id];
  $('wotdBox').innerHTML=`<div class="wt"><small>🌟 Từ của ngày · ${esc(topicName(it.ti))}</small><div class="ww">${termHtml(it)}${it.pos?` <small>(${esc(it.pos)})</small>`:''}</div>
    <div class="wm">${esc(it.mean)}</div><div class="ex">${exLine(it)}</div></div>
    <button class="btn ${has?'ghost':''}" data-wotd ${has?'disabled':''}>${has?'✅ Đã có trong lịch ôn':'📅 Thêm vào ôn tập'}</button>`;
}
$('wotdBox').onclick=e=>{if(!e.target.closest('[data-wotd]'))return;const it=wotd();if(st.srs[it.id])return;
  st.srs[it.id]={b:0,d:dayKey(),t:Date.now()};save();beep('ok');toast(`📅 Đã thêm "${it.term}" vào lịch ôn hôm nay!`);renderHome()};
$('streakBox').onclick=e=>{if(!e.target.closest('[data-frz]'))return;
  if(st.rpg.inv.freeze>=FREEZE_MAX)toast(`Bạn đang có tối đa ${FREEZE_MAX} bùa rồi 🧊`);
  else if(st.rpg.gold<FREEZE_P)toast(`Cần ${FREEZE_P} vàng (đang có ${st.rpg.gold}), làm 🎯 nhiệm vụ hằng ngày để kiếm thêm nhé!`);
  else if(buyFreeze())renderHome()};
// streak card: the cat fires an energy wave once you have studied today; this week's study days get a paw
function renderStreak(){
  const n=liveStreak(),today=dayKey(),done=st.last===today,g=dayGains(),mon=dayAgo((new Date().getDay()+6)%7);
  const from=n?dayKey(dayAgo(Math.round((new Date(today)-new Date(st.last))/864e5)+n)):'9'; // the streak covers (from, st.last]
  const days=['T2','T3','T4','T5','T6','T7','CN'].map((l,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);const k=dayKey(d),on=g[k]>0||(k>from&&k<=st.last);
    return `<div class="sd ${k===today?'today':''} ${k>today?'fut':''}"><small>${l}</small><i class="${on?'on':''}">${on?'🐾':''}</i></div>`}).join('');
  const lv=n>=30?3:n>=7?2:n?1:0;
  $('streakBox').className=`streak ${done?'lit':'off'} sl${lv}`;
  $('streakBox').innerHTML=`<div class="scat" aria-hidden="true"><span class="c">${done?'😼':n?'🐱':'😴'}</span><span class="orb"></span><span class="beam"></span></div>
    <div class="st"><b><span class="n">${n}</span> ngày học liên tiếp</b><small>${done?`Mèo đã tung chưởng hôm nay! Mai học tiếp để chuỗi lên ${n+1} ngày.`:n?`Học 1 lượt hôm nay để giữ chuỗi ${n} ngày, không là mất đó!`:'Học 1 lượt để mèo tung chưởng, bắt đầu chuỗi mới nhé!'}</small>
      <button class="frzbtn" data-frz title="Tự dùng khi bạn lỡ 1 ngày không học">🧊 Bùa giữ chuỗi: ${st.rpg.inv.freeze}/${FREEZE_MAX}${st.rpg.inv.freeze<FREEZE_MAX?` · Mua ${FREEZE_P} 💰`:''}</button></div>
    <div class="sweek">${days}</div>`;
}
$('soundBtn').onclick=()=>{st.sound=!st.sound;save();renderHome()};

// ---------- light / dark theme (per device, not synced; applied early by a script in <head>) ----------
const THEME_KEY='ielts-vocab-arena-theme',darkMq=matchMedia('(prefers-color-scheme: dark)');
const isDark=()=>{const t=document.documentElement.dataset.theme;return t?t==='dark':darkMq.matches};
function renderTheme(){const d=isDark();$('themeBtn').textContent=d?'☀️':'🌙';$('themeBtn').title=d?'Chuyển sang giao diện sáng':'Chuyển sang giao diện tối';
  document.querySelector('meta[name=theme-color]').content=d?'#17120e':'#fbf6f0'}
$('themeBtn').onclick=()=>{const t=isDark()?'light':'dark';document.documentElement.dataset.theme=t;try{localStorage.setItem(THEME_KEY,t)}catch(e){}renderTheme()};
darkMq.addEventListener('change',renderTheme);renderTheme();

// ---------- game loop ----------
const LEN=12;
let G=null;
// ch = a friend's challenge {s: seed, m: mode, t: topic indexes, n, p, c, l} (challenge.js)
function start(mode,ch=null){
  poolOverride=null;let queue=null;
  if(mode==='srs'){queue=srsSession();if(!queue.length){toast('Chưa có từ nào để ôn, hãy chọn chủ đề nhé!');return}}
  const P=ch?ALL.filter(x=>ch.t.includes(x.ti)):pool();
  if(!queue){
    if(!P.length){toast('Hãy chọn ít nhất 1 chủ đề nhé!');return}
    if(mode==='syn'&&!P.some(canSyn)){toast('Từ đồng nghĩa chỉ có ở 19 chủ đề có sẵn, hãy chọn ít nhất 1 chủ đề đó nhé!');return}
    if(mode!=='quiz'&&mode!=='mix'&&mode!=='syn'&&!poolTypes(P).includes(mode)){toast(mode==='fill'?'Các từ đã chọn chưa có câu ví dụ chứa từ đó, thử Quiz nhé!':'Các từ đã chọn chưa có cụm từ (collocation), thử Quiz nhé!');return}}
  const n=mode==='fill'?P.filter(canFill).length:mode==='col'?P.filter(canCol).length:mode==='syn'?P.filter(canSyn).length:P.length; // small decks: shorter round
  // rounds of built-in topics are seeded, so the same questions can be sent to a friend as a challenge
  const seed=ch?ch.s:!queue&&!useWrong&&P.every(x=>!isDeck(x.ti))?Math.floor(Math.random()*2**31):null;
  G={mode,types:poolTypes(P),queue,pool:queue?null:P,len:queue?queue.length:Math.min(LEN,n),n:0,score:0,combo:0,maxCombo:0,correct:0,wrongList:[],used:new Set(),xp0:st.xp,typesPlayed:new Set(),
    seed,rng:seed==null?null:seeded(seed),topics:[...new Set(P.map(x=>x.ti))],ch};
  show('game');next();
}
function next(){
  if(G.n>=G.len)return finish();
  poolOverride=G.queue?[G.queue[G.n]]:G.pool; // review session: ask about this exact card
  if(G.rng){qrnd=G.rng;qBase=ALL.slice(0,CORE_N)}
  let q;try{const t=G.queue?srsType(G.queue[G.n]):G.mode==='mix'?pick(G.types):G.mode;
    q=t==='quiz'?makeQuiz(G.used):t==='fill'?makeFill(G.used):t==='syn'?makeSyn(G.used):makeCol(G.used)}
  finally{poolOverride=null;qrnd=Math.random;qBase=null}
  G.q=q;G.used.add(q.it.id);G.answered=false;G.typesPlayed.add(q.type);
  $('gBar').style.width=(G.n/G.len*100)+'%';
  $('qType').textContent=q.label;$('qMain').innerHTML=q.main;$('qMain').classList.toggle('sentence',!!q.sentence);
  $('qSub').innerHTML=q.sub;$('qHint').innerHTML=q.hint;
  $('fb').className='feedback';
  const o=$('opts');
  if(q.options){
    $('typeForm').style.display='none';$('skip').style.display='none';
    o.innerHTML=q.options.map((v,i)=>`<button class="opt" data-v="${esc(v)}"><span class="k">${i+1}</span><span>${esc(v)}</span></button>`).join('');
  }else{
    o.innerHTML='';$('typeForm').style.display='flex';$('skip').style.display='inline-block';
    const inp=$('typeIn');inp.value='';inp.className='';inp.disabled=false;setTimeout(()=>inp.focus(),50);
  }
  startQTimer();
}
// Q_TIME seconds per question; running out counts as a wrong answer (boss.js has its own timer with the same limit)
function startQTimer(){stopQTimer();const t0=Date.now(),bar=$('gtBar');bar.style.width='100%';bar.classList.remove('low');
  G.tick=setInterval(()=>{const left=Math.max(0,1-(Date.now()-t0)/(Q_TIME*1000));bar.style.width=left*100+'%';bar.classList.toggle('low',left<.3);
    if(left<=0){stopQTimer();if(!G.answered)answer('',null,true)}},100)}
const stopQTimer=()=>{if(G)clearInterval(G.tick)};
$('opts').onclick=e=>{const b=e.target.closest('.opt');if(!b||G.answered)return;answer(b.dataset.v,b)};
$('typeForm').onsubmit=e=>{e.preventDefault();if(G.answered){goNext();return}const v=$('typeIn').value.trim();if(!v)return;answer(v,$('typeIn'))};
$('skip').onclick=()=>{if(!G.answered)answer('',$('typeIn'))};
function answer(v,el,timeout){
  const q=G.q;G.answered=true;stopQTimer();
  const ok=v.toLowerCase().replace(/[’]/g,"'")===q.answer.toLowerCase();
  if(q.options){document.querySelectorAll('.opt').forEach(b=>{b.disabled=true;
    if(b.dataset.v===q.answer)b.classList.add('right'); else if(b===el)b.classList.add('wrong')})}
  else{const i=$('typeIn');i.disabled=true;i.classList.add(ok?'right':'wrong');$('skip').style.display='none'}
  const id=q.it.id;srsGrade(id,ok?1:0);if(G.queue)quest('review');
  if(ok){quest('answer');if(q.type==='syn')quest('syn');
    G.combo++;G.correct++;G.maxCombo=Math.max(G.maxCombo,G.combo);
    const mult=Math.min(4,1+Math.floor(G.combo/3)), pts=10*mult;
    G.score+=pts;st.xp+=pts;plus('+'+pts,el);beep('ok');
    if(st.wrong[id]){delete st.wrong[id];st.fixed=(st.fixed||0)+1;if(st.fixed>=10)unlock('fixer')}
    if(G.combo%5===0)confetti(35);
    if(G.combo>=5)unlock('combo5'); if(G.combo>=10)unlock('combo10');quest('combo',G.combo);
    $('combo').classList.add('pop');setTimeout(()=>$('combo').classList.remove('pop'),160);
  }else{
    G.combo=0;st.wrong[id]=(st.wrong[id]||0)+1;G.wrongList.push(q);beep('no');
  }
  save();
  const mult=Math.min(4,1+Math.floor(G.combo/3));
  $('combo').textContent=`🔥 Combo ${G.combo} · x${mult}`;$('score').textContent=G.score;
  const praise=['Chuẩn luôn! 🎉','Xuất sắc! ✨','Quá đỉnh! 🚀','Giỏi lắm! 💪','Đúng rồi! 👏'];
  $('fbT').textContent=ok?pick(praise):timeout?'⏰ Hết giờ!':(v?'Chưa đúng rồi 😅':'Đáp án là:');
  $('fbA').innerHTML=ok?'':`Đáp án đúng: <b>${esc(q.type==='col'?q.it.term:q.answer)}</b>`+(q.type==='quiz'?'':` (${esc(q.it.mean)})`);
  $('fbEx').innerHTML=`${termHtml(q.it)}: ${esc(q.it.mean)}<br>${exLine(q.it)}`;
  $('fb').className='feedback show '+(ok?'ok':'no');
  setTimeout(()=>$('next').focus(),30);
}
function goNext(){G.n++;next()}
$('next').onclick=goNext;
$('quit').onclick=()=>{stopQTimer();if(confirm('Thoát lượt chơi này? Điểm XP đã nhận vẫn được giữ.')){show('home');renderHome()}else if(!G.answered)startQTimer()};

function finish(){
  stopQTimer();$('gBar').style.width='100%';
  const today=dayKey();
  if(st.last!==today){st.streak=(st.last===yesterday())?st.streak+1:1;st.last=today}
  const newBest=G.score>(st.best||0); if(newBest)st.best=G.score;
  ['quiz','fill','col'].forEach(t=>{if(G.typesPlayed.has(t)&&!st.modes.includes(t))st.modes.push(t)});
  quest('round');save();
  unlock('first');
  if(G.len>=LEN&&G.correct===G.len)unlock('perfect');
  if(st.modes.length>=3)unlock('allmodes');
  if(st.streak>=3)unlock('streak3'); if(st.streak>=7)unlock('streak7');
  if(st.xp>=500)unlock('xp500'); if(st.xp>=2000)unlock('xp2000');
  const r=G.correct/G.len;
  $('rEmoji').textContent=r===1?'🏆':r>=.75?'🎉':r>=.5?'👍':'💪';
  $('rTitle').textContent=r===1?'Hoàn hảo tuyệt đối!':r>=.75?'Làm tốt lắm!':r>=.5?'Khá ổn, cố thêm chút nữa!':'Không sao, luyện tiếp nhé!';
  $('rSub').textContent=`+${st.xp-G.xp0} XP · Chuỗi ${st.streak} ngày 🔥`+(newBest?' · Kỷ lục mới! 🥇':` · Kỷ lục: ${st.best}`);
  $('rScore').textContent=G.score;$('rAcc').textContent=`${G.correct}/${G.len}`;$('rCombo').textContent=G.maxCombo;
  $('review').innerHTML=G.wrongList.length?`<h2>📕 Từ cần ôn lại</h2>`+G.wrongList.map(q=>`<div class="it">${termHtml(q.it)}: ${esc(q.it.mean)}<br><span class="empty">${exLine(q.it)}</span></div>`).join(''):'';
  renderChResult();show('result');beep('end');if(r>=.75)confetti(r===1?120:60);
}
$('again').onclick=()=>start(G.mode);
$('toHome').onclick=()=>{show('home');renderHome()};

document.querySelectorAll('.mode').forEach(b=>b.onclick=()=>start(b.dataset.mode));
document.addEventListener('keydown',e=>{
  if(!$('game').classList.contains('show'))return;
  if(G.answered&&e.key==='Enter'&&e.target.id!=='typeIn'){e.preventDefault();goNext();return}
  if(!G.answered&&G.q.options&&/^[1-4]$/.test(e.key)){const b=document.querySelectorAll('.opt')[+e.key-1];if(b)b.click()}
});
