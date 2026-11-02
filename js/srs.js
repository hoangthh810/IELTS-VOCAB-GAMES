// ---------- spaced repetition (Leitner boxes) ----------
// st.srs[id] = {b: box 0..7, d: due day 'YYYY-MM-DD', t: last review time in ms (newest wins when devices merge)}.
// Every answer in practice, boss battles and reviews calls srsGrade; only due (or new) cards move up a box.
const SRS_DAYS=[0,1,3,7,14,30,60,120]; // days until the next review, per box
const SRS_MAX=20,SRS_NEW=10; // cards per review session, new cards added when few are due
const addDays=n=>{const d=new Date();d.setDate(d.getDate()+n);return dayKey(d)};
const dayLabel=n=>n===0?'hôm nay':n===1?'1 ngày':n<30?n+' ngày':Math.round(n/30)+' tháng';

function srsGrade(id,g){ // g: 0 forgot, 1 remembered, 2 easy
  const r=st.srs[id],today=dayKey();
  if(g===0)st.srs[id]={b:0,d:today,t:Date.now()};
  else if(!r||r.d<=today){const b=Math.min(7,(r?r.b:0)+g);st.srs[id]={b,d:addDays(SRS_DAYS[b]),t:Date.now()}}
}
const srsNextBox=(id,g)=>{const r=st.srs[id];return g===0?0:Math.min(7,(r?r.b:0)+g)};
function srsDue(){const today=dayKey();
  return ALL.filter(x=>st.srs[x.id]&&st.srs[x.id].d<=today).sort((a,b)=>st.srs[a.id].d.localeCompare(st.srs[b.id].d)||st.srs[a.id].b-st.srs[b.id].b)}
function srsStats(){let due=0,learning=0,known=0;const today=dayKey();
  for(const [id,r] of Object.entries(st.srs)){if(!BYID[id])continue;if(r.d<=today)due++;if(r.b>=5)known++;else learning++}return{due,learning,known}}
// due cards first, then a few new cards from the selected topics
function srsSession(){
  const q=srsDue().slice(0,SRS_MAX);
  if(q.length<SRS_MAX){const topics=sel.size?sel:new Set(topicKeys());
    q.push(...shuffle(ALL.filter(x=>!st.srs[x.id]&&topics.has(x.ti))).slice(0,Math.min(SRS_NEW,SRS_MAX-q.length)))}
  return q;
}
// question type for a review card in the quiz-based session
const srsType=it=>it.kind==='word'?(findMatch(it.ex,it.term)?pick(['quiz','fill']):'quiz'):(it.term.includes(' ')&&colTokens(it.term).length?pick(['quiz','col']):'quiz');

function renderSrs(){
  const s=srsStats(),tomorrow=Object.entries(st.srs).filter(([id,r])=>BYID[id]&&r.d===addDays(1)).length;
  $('srsBox').innerHTML=`<div class="srs-stats"><div><b>${s.due}</b><small>đến hạn hôm nay</small></div><div><b>${s.learning}</b><small>đang học</small></div><div><b>${s.known}</b><small>đã thuộc</small></div></div>
    <div class="srs-btns"><button class="btn" data-srs="quiz">🧠 Ôn bằng câu hỏi</button><button class="btn ghost" data-srs="cards">🃏 Flashcard</button></div>
    <small class="empty">${s.due?`Có ${s.due} từ cần ôn hôm nay.`:'Không có từ đến hạn.'} Mỗi lượt ôn tối đa ${SRS_MAX} thẻ, thêm tối đa ${SRS_NEW} từ mới từ chủ đề đang chọn. Nhớ đúng thì lần ôn sau giãn dần: 1 → 3 → 7 → 14 → 30 ngày.${tomorrow?` Ngày mai: ${tomorrow} từ.`:''}</small>`;
}
$('srsBox').onclick=e=>{const b=e.target.closest('[data-srs]');if(!b)return;b.dataset.srs==='quiz'?start('srs'):startCards()};

// ---------- flashcards ----------
let C=null;
function startCards(){
  const q=srsSession();if(!q.length){toast('Chưa có thẻ nào để ôn, hãy chọn chủ đề nhé!');return}
  C={q,n:0,total:q.length,remembered:0,again:new Set(),xp0:st.xp};show('cards');showCard();
}
function showCard(){
  if(C.n>=C.q.length)return endCards();
  const it=C.q[C.n],r=st.srs[it.id];C.flipped=false;
  $('cBar').style.width=(C.n/C.q.length*100)+'%';$('cCount').textContent=`${C.n+1}/${C.q.length}`;
  $('cFront').innerHTML=`<div class="qtype">${r?'🔁 Ôn lại':'✨ Từ mới'} · ${esc(topicName(it.ti))}</div><div class="qmain">${esc(it.term)}${spk(it.term)}</div><div class="qsub">${ipaTag(it)}${it.pos?` (${esc(it.pos)})`:it.kind==='col'?' collocation':''}</div>`;
  $('cBack').innerHTML=`<div class="qtype">Nghĩa</div><div class="qmain small">${esc(it.mean)}</div>${it.ex?`<div class="ex">${exLine(it)}</div>`:''}`;
  $('card').classList.remove('flip');$('cBack').hidden=true;$('cFlipRow').hidden=false;$('cGrades').hidden=true;
  [0,1,2].forEach(g=>document.querySelector(`#cGrades [data-g="${g}"] small`).textContent=g===0?'ôn lại ngay':dayLabel(SRS_DAYS[srsNextBox(it.id,g)]));
}
function flipCard(){if(!C||C.flipped)return;C.flipped=true;$('card').classList.add('flip');$('cBack').hidden=false;$('cFlipRow').hidden=true;$('cGrades').hidden=false}
function gradeCard(g){
  if(!C||!C.flipped)return;const it=C.q[C.n];srsGrade(it.id,g);
  if(g===0){if(!C.again.has(it.id)){C.again.add(it.id);C.q.push(it)}st.wrong[it.id]=(st.wrong[it.id]||0)+1;beep('no')}
  else{if(!C.again.has(it.id))C.remembered++;st.xp+=5;beep('ok')}
  save();C.n++;showCard();
}
function endCards(){
  touchStreak();save();xpBadges();
  const s=srsStats();$('cBar').style.width='100%';$('cCount').textContent='';
  $('cFront').innerHTML=`<div class="big">🎉</div><div class="qmain small">Xong lượt ôn!</div><div class="qsub">Nhớ ngay ${C.remembered}/${C.total} thẻ · +${st.xp-C.xp0} XP · Chuỗi ${st.streak} ngày 🔥</div><div class="qsub">Còn ${s.due} thẻ đến hạn hôm nay.</div>`;
  $('cBack').hidden=true;$('cFlipRow').hidden=true;$('cGrades').hidden=true;$('card').classList.remove('flip');$('cDone').hidden=false;
  confetti(50);beep('end');C=null;
}
$('card').onclick=e=>{if(!e.target.closest('.spk'))flipCard()};
$('cFlip').onclick=flipCard;
$('cGrades').onclick=e=>{const b=e.target.closest('[data-g]');if(b)gradeCard(+b.dataset.g)};
const leaveCards=()=>{C=null;$('cDone').hidden=true;show('home');renderHome()};
$('cQuit').onclick=()=>{if(!C||confirm('Dừng lượt ôn? Các thẻ đã chấm vẫn được lưu.'))leaveCards()};
$('cHome').onclick=leaveCards;
document.addEventListener('keydown',e=>{
  if(!C||!$('cards').classList.contains('show')||(e.target.closest&&e.target.closest('input')))return;
  if(!C.flipped&&(e.key===' '||e.key==='Enter')){e.preventDefault();flipCard()}
  else if(C.flipped&&/^[1-3]$/.test(e.key))gradeCard(+e.key-1);
});
