// ---------- home ----------
let sel=new Set(Array.isArray(st.topics)?st.topics:DATA.map((_,i)=>i));
let useWrong=false;
function renderChips(){
  const c=$('chips');const allOn=sel.size===DATA.length&&!useWrong;
  const wn=Object.keys(st.wrong).length;
  c.innerHTML=`<button class="chip ${allOn?'on':''}" data-t="all">✨ Tất cả</button>`+
    DATA.map((t,i)=>`<button class="chip ${sel.has(i)&&!useWrong?'on':''}" data-t="${i}">${esc(t.name)}</button>`).join('')+
    (wn?`<button class="chip wrongbank ${useWrong?'on':''}" data-t="wrong">📕 Từ hay sai (${wn})</button>`:'');
}
$('chips').onclick=e=>{
  const b=e.target.closest('.chip');if(!b)return;const t=b.dataset.t;
  if(t==='wrong'){useWrong=!useWrong}
  else{useWrong=false;
    if(t==='all'){sel=sel.size===DATA.length?new Set():new Set(DATA.map((_,i)=>i))}
    else{const i=+t;sel.has(i)?sel.delete(i):sel.add(i)}
    st.topics=[...sel];save()}
  renderChips();
};
function renderHome(){
  if(useWrong&&!Object.keys(st.wrong).length)useWrong=false;
  $('sStreak').textContent=liveStreak();$('sXp').textContent=st.xp;$('sWrong').textContent=Object.keys(st.wrong).length;
  const lv=Math.floor(st.xp/300)+1, into=st.xp%300;
  $('lvName').textContent=`Level ${lv}`;$('lvNext').textContent=`${into}/300 XP`;$('lvBar').style.width=(into/300*100)+'%';
  $('soundBtn').textContent=st.sound?'🔊':'🔇';
  $('badges').innerHTML=BADGES.map(b=>`<div class="badge ${st.badges.includes(b.id)?'':'locked'}"><div class="e">${b.e}</div><b>${b.n}</b><small>${b.d}</small></div>`).join('');
  renderChips();
}
$('soundBtn').onclick=()=>{st.sound=!st.sound;save();renderHome()};

// ---------- game loop ----------
const LEN=12;
let G=null;
function start(mode){
  poolOverride=null;
  if(!useWrong&&!sel.size){toast('Hãy chọn ít nhất 1 chủ đề nhé!');return}
  G={mode,n:0,score:0,combo:0,maxCombo:0,correct:0,wrongList:[],used:new Set(),xp0:st.xp,typesPlayed:new Set()};
  show('game');next();
}
function next(){
  if(G.n>=LEN)return finish();
  const t=G.mode==='mix'?pick(['quiz','fill','col']):G.mode;
  const q=t==='quiz'?makeQuiz(G.used):t==='fill'?makeFill(G.used):makeCol(G.used);
  G.q=q;G.used.add(q.it.id);G.answered=false;G.typesPlayed.add(q.type);
  $('gBar').style.width=(G.n/LEN*100)+'%';
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
}
$('opts').onclick=e=>{const b=e.target.closest('.opt');if(!b||G.answered)return;answer(b.dataset.v,b)};
$('typeForm').onsubmit=e=>{e.preventDefault();if(G.answered){goNext();return}const v=$('typeIn').value.trim();if(!v)return;answer(v,$('typeIn'))};
$('skip').onclick=()=>{if(!G.answered)answer('',$('typeIn'))};
function answer(v,el){
  const q=G.q;G.answered=true;
  const ok=v.toLowerCase().replace(/[’]/g,"'")===q.answer.toLowerCase();
  if(q.options){document.querySelectorAll('.opt').forEach(b=>{b.disabled=true;
    if(b.dataset.v===q.answer)b.classList.add('right'); else if(b===el)b.classList.add('wrong')})}
  else{const i=$('typeIn');i.disabled=true;i.classList.add(ok?'right':'wrong');$('skip').style.display='none'}
  const id=q.it.id;
  if(ok){
    G.combo++;G.correct++;G.maxCombo=Math.max(G.maxCombo,G.combo);
    const mult=Math.min(4,1+Math.floor(G.combo/3)), pts=10*mult;
    G.score+=pts;st.xp+=pts;plus('+'+pts,el);beep('ok');
    if(st.wrong[id]){delete st.wrong[id];st.fixed=(st.fixed||0)+1;if(st.fixed>=10)unlock('fixer')}
    if(G.combo%5===0)confetti(35);
    if(G.combo>=5)unlock('combo5'); if(G.combo>=10)unlock('combo10');
    $('combo').classList.add('pop');setTimeout(()=>$('combo').classList.remove('pop'),160);
  }else{
    G.combo=0;st.wrong[id]=(st.wrong[id]||0)+1;G.wrongList.push(q);beep('no');
  }
  save();
  const mult=Math.min(4,1+Math.floor(G.combo/3));
  $('combo').textContent=`🔥 Combo ${G.combo} · x${mult}`;$('score').textContent=G.score;
  const praise=['Chuẩn luôn! 🎉','Xuất sắc! ✨','Quá đỉnh! 🚀','Giỏi lắm! 💪','Đúng rồi! 👏'];
  $('fbT').textContent=ok?pick(praise):(v?'Chưa đúng rồi 😅':'Đáp án là:');
  $('fbA').innerHTML=ok?'':`Đáp án đúng: <b>${esc(q.type==='col'?q.it.term:q.answer)}</b>`+(q.type==='quiz'?'':` (${esc(q.it.mean)})`);
  $('fbEx').innerHTML=`<b>${esc(q.it.term)}</b>: ${esc(q.it.mean)}<br>📝 ${hlEx(q.it.ex,q.it.term)}`;
  $('fb').className='feedback show '+(ok?'ok':'no');
  setTimeout(()=>$('next').focus(),30);
}
function goNext(){G.n++;next()}
$('next').onclick=goNext;
$('quit').onclick=()=>{if(confirm('Thoát lượt chơi này? Điểm XP đã nhận vẫn được giữ.')){show('home');renderHome()}};

function finish(){
  $('gBar').style.width='100%';
  const today=dayKey();
  if(st.last!==today){st.streak=(st.last===yesterday())?st.streak+1:1;st.last=today}
  const newBest=G.score>(st.best||0); if(newBest)st.best=G.score;
  ['quiz','fill','col'].forEach(t=>{if(G.typesPlayed.has(t)&&!st.modes.includes(t))st.modes.push(t)});
  save();
  unlock('first');
  if(G.correct===LEN)unlock('perfect');
  if(st.modes.length>=3)unlock('allmodes');
  if(st.streak>=3)unlock('streak3'); if(st.streak>=7)unlock('streak7');
  if(st.xp>=500)unlock('xp500'); if(st.xp>=2000)unlock('xp2000');
  const r=G.correct/LEN;
  $('rEmoji').textContent=r===1?'🏆':r>=.75?'🎉':r>=.5?'👍':'💪';
  $('rTitle').textContent=r===1?'Hoàn hảo tuyệt đối!':r>=.75?'Làm tốt lắm!':r>=.5?'Khá ổn, cố thêm chút nữa!':'Không sao, luyện tiếp nhé!';
  $('rSub').textContent=`+${st.xp-G.xp0} XP · Chuỗi ${st.streak} ngày 🔥`+(newBest?' · Kỷ lục mới! 🥇':` · Kỷ lục: ${st.best}`);
  $('rScore').textContent=G.score;$('rAcc').textContent=`${G.correct}/${LEN}`;$('rCombo').textContent=G.maxCombo;
  $('review').innerHTML=G.wrongList.length?`<h2>📕 Từ cần ôn lại</h2>`+G.wrongList.map(q=>`<div class="it"><b>${esc(q.it.term)}</b>: ${esc(q.it.mean)}<br><span class="empty">${hlEx(q.it.ex,q.it.term)}</span></div>`).join(''):'';
  show('result');beep('end');if(r>=.75)confetti(r===1?120:60);
}
$('again').onclick=()=>start(G.mode);
$('toHome').onclick=()=>{show('home');renderHome()};

document.querySelectorAll('.mode').forEach(b=>b.onclick=()=>start(b.dataset.mode));
document.addEventListener('keydown',e=>{
  if(!$('game').classList.contains('show'))return;
  if(G.answered&&e.key==='Enter'&&e.target.id!=='typeIn'){e.preventDefault();goNext();return}
  if(!G.answered&&G.q.options&&/^[1-4]$/.test(e.key)){const b=document.querySelectorAll('.opt')[+e.key-1];if(b)b.click()}
});
