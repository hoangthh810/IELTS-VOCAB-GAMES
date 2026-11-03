// ---------- listen & write (dictation): hear a word, type it back; no timer ----------
// Words come from a built-in topic, an imported deck, the topics picked on the home screen, or the wrong-answer bank.
// Settings {src, kind, len, rate} are a per-device preference; the voice is VOICE_KEY in core.js (used by every speaker button).
const DICT_KEY='ielts-vocab-arena-dict';
let D=null; // running session: {q, n, correct, xp0, missed, answered, hint}
const dictOk=x=>/^[a-z][a-z' -]*$/i.test(x.term.trim())&&x.term.length<=40; // things a voice can read and a learner can type
const normT=s=>s.toLowerCase().replace(/[’`]/g,"'").replace(/[.,!?;:]+$/,'').replace(/\s+/g,' ').trim();
function dictPrefs(){try{return JSON.parse(localStorage.getItem(DICT_KEY))||{}}catch(e){return{}}}
function dictPool(){
  const src=$('dSrc').value,k=$('dKind').value;
  const P=src==='home'?ALL.filter(x=>sel.has(x.ti)):src==='wrong'?wrongIds().map(id=>BYID[id]):ALL.filter(x=>String(x.ti)===src);
  return P.filter(x=>(k==='all'||x.kind===k)&&dictOk(x));
}
function renderVoices(){
  const s=$('dVoice'),vs=enVoices();if(!s)return;
  s.innerHTML=`<option value="">Tự động (ưu tiên Anh-Anh)</option>`+vs.map(v=>`<option value="${esc(v.voiceURI)}">${esc(v.name.replace(/^(Microsoft|Google)\s+/,''))} · ${esc(v.lang)}</option>`).join('');
  let want='';try{want=localStorage.getItem(VOICE_KEY)||''}catch(e){}s.value=vs.some(v=>v.voiceURI===want)?want:'';
  $('dVoiceNote').textContent=vs.length?`Máy bạn có ${vs.length} giọng tiếng Anh.`:canSpeak?'Đang tải danh sách giọng…':'Trình duyệt này không đọc được tiếng Anh, hãy thử Chrome hoặc Edge.';
}
function openDict(){
  const p=dictPrefs(),o=[['home',`🏠 Chủ đề đang chọn ở trang chủ`],...(wrongIds().length?[['wrong',`📕 Từ hay sai (${wrongIds().length})`]]:[]),...topicKeys().map(k=>[String(k),topicName(k)])];
  $('dSrc').innerHTML=o.map(([v,n])=>`<option value="${esc(v)}">${esc(n)}</option>`).join('');
  for(const [id,v] of [['dSrc',p.src],['dKind',p.kind],['dLen',p.len],['dRate',p.rate]])if(v&&[...$(id).options].some(x=>x.value===String(v)))$(id).value=v;
  renderVoices();dictCount();D=null;dictView('setup');show('dict');
}
function dictCount(){const n=dictPool().length;$('dAvail').textContent=n?`${n} từ có thể luyện`:'Không có từ nào phù hợp, hãy chọn nguồn khác nhé';$('dStart').disabled=!n}
const dictView=v=>{$('dBar').parentElement.hidden=v==='setup';$('dSetup').hidden=v!=='setup';$('dPlay').hidden=v!=='play';$('dDone').hidden=v!=='done';if(v!=='play'){$('dBar').style.width=v==='done'?'100%':'0';$('dCount').textContent=''}};
const dictRate=()=>+$('dRate').value||.9;
function startDict(){
  const P=dictPool();if(!P.length)return;
  try{localStorage.setItem(DICT_KEY,JSON.stringify({src:$('dSrc').value,kind:$('dKind').value,len:$('dLen').value,rate:$('dRate').value}))}catch(e){}
  // due/weak words first, then the rest at random
  const due=new Set(srsDue().map(x=>x.id)),weak=x=>(st.wrong[x.id]?2:0)+(due.has(x.id)?1:0);
  const q=shuffle(P).sort((a,b)=>weak(b)-weak(a)).slice(0,+$('dLen').value);
  D={q:shuffle(q),n:0,correct:0,xp0:st.xp,missed:[],answered:false,hint:0};dictView('play');nextDict();
}
function nextDict(){
  if(D.n>=D.q.length)return endDict();
  D.answered=false;D.hint=0;const it=D.q[D.n];
  $('dBar').style.width=(D.n/D.q.length*100)+'%';$('dCount').textContent=`${D.n+1}/${D.q.length}`;
  $('dKind2').textContent=it.kind==='col'?'Cụm từ':'Từ đơn';$('dHint').innerHTML='';$('dFb').className='feedback';
  const i=$('dIn');i.value='';i.className='';i.disabled=false;$('dHintBtn').disabled=false;$('dSkip').hidden=false;
  setTimeout(()=>{i.focus();speak(it.term,dictRate())},250);
}
function dictHint(){
  if(!D||D.answered||D.hint>=2)return;const it=D.q[D.n];D.hint++;
  const mask=it.term.split('').map((ch,j)=>ch===' '?'&nbsp;&nbsp;':j===0?esc(ch):'_').join(' ');
  $('dHint').innerHTML=`💡 Nghĩa: <b>${esc(it.mean)}</b>`+(D.hint>1?`<br><span class="dmask">${mask}</span> (${it.term.replace(/ /g,'').length} chữ cái)`:'');
  if(D.hint>=2)$('dHintBtn').disabled=true;
}
// letter diff (longest common subsequence): marks what was typed wrongly and what was missed
function diffHtml(typed,ans){
  const a=typed,b=ans,L=Array.from({length:a.length+1},()=>new Array(b.length+1).fill(0));
  for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)L[i][j]=a[i].toLowerCase()===b[j].toLowerCase()?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
  let i=0,j=0,u='',r='';
  while(i<a.length||j<b.length){
    if(i<a.length&&j<b.length&&a[i].toLowerCase()===b[j].toLowerCase()){u+=esc(a[i]);r+=esc(b[j]);i++;j++}
    else if(j<b.length&&(i>=a.length||L[i][j+1]>=L[i+1][j])){r+=`<mark class="miss">${b[j]===' '?'&nbsp;':esc(b[j])}</mark>`;j++}
    else{u+=`<del>${a[i]===' '?'&nbsp;':esc(a[i])}</del>`;i++}
  }
  return{u,r};
}
function checkDict(skip){
  if(!D||D.answered)return;const it=D.q[D.n],typed=$('dIn').value.trim();if(!typed&&!skip)return;
  D.answered=true;const ok=!skip&&normT(typed)===normT(it.term),id=it.id;
  const i=$('dIn');i.disabled=true;i.classList.add(ok?'right':'wrong');$('dHintBtn').disabled=true;$('dSkip').hidden=true;
  srsGrade(id,ok?1:0);
  if(ok){const pts=D.hint?5:10;D.correct++;st.xp+=pts;plus('+'+pts,i);beep('ok');if(st.wrong[id]){delete st.wrong[id];st.fixed=(st.fixed||0)+1;if(st.fixed>=10)unlock('fixer')}}
  else{st.wrong[id]=(st.wrong[id]||0)+1;D.missed.push(it);beep('no')}
  save();
  const d=typed&&!ok?diffHtml(typed,it.term):null;
  $('dFbT').textContent=ok?pick(['Chuẩn chính tả! 🎉','Nghe tốt lắm! 👂','Tai thính ghê! 🐱','Đúng rồi! 👏']):skip?'Đáp án là:':'Chưa đúng rồi 😅';
  $('dFbA').innerHTML=d?`<div class="ddiff">Bạn viết: <span>${d.u}</span></div><div class="ddiff">Đáp án: <span>${d.r}</span></div>`:'';
  $('dFbEx').innerHTML=`${termHtml(it)}: ${esc(it.mean)}<br>${exLine(it)}`;
  $('dFb').className='feedback show '+(ok?'ok':'no');setTimeout(()=>$('dNext').focus(),30);
}
function endDict(){
  touchStreak();save();xpBadges();
  const r=D.correct/D.q.length;
  $('dEmoji').textContent=r===1?'🏆':r>=.75?'🎉':r>=.5?'👍':'💪';
  $('dTitle').textContent=r===1?'Nghe chuẩn từng chữ!':r>=.75?'Tai thính lắm!':r>=.5?'Khá ổn, nghe thêm chút nữa nhé!':'Không sao, luyện tiếp nhé!';
  $('dSub').textContent=`Đúng ${D.correct}/${D.q.length} từ · +${st.xp-D.xp0} XP · Chuỗi ${st.streak} ngày 🔥`;
  $('dReview').innerHTML=D.missed.length?`<h2>📕 Từ cần nghe lại</h2>`+D.missed.map(it=>`<div class="it">${termHtml(it)}: ${esc(it.mean)}</div>`).join(''):'';
  dictView('done');beep('end');if(r>=.75)confetti(r===1?100:50);
}
$('dictBtn').onclick=openDict;
$('dSrc').onchange=$('dKind').onchange=dictCount;
$('dVoice').onchange=()=>{try{localStorage.setItem(VOICE_KEY,$('dVoice').value)}catch(e){}pickVoice();speak('Hello! Let\'s practise listening.',dictRate())};
$('dTry').onclick=()=>speak(pick(dictPool().map(x=>x.term).concat('sustainable development')),dictRate());
$('dStart').onclick=startDict;
$('dSay').onclick=()=>{if(D)speak(D.q[D.n].term,dictRate());$('dIn').focus()};
$('dSlow').onclick=()=>{if(D)speak(D.q[D.n].term,.6);$('dIn').focus()};
$('dHintBtn').onclick=dictHint;
$('dSkip').onclick=()=>checkDict(true);
$('dForm').onsubmit=e=>{e.preventDefault();D&&D.answered?($('dNext').click()):checkDict(false)};
$('dNext').onclick=()=>{if(D&&D.answered){D.n++;nextDict()}};
$('dAgain').onclick=startDict;
$('dSettings').onclick=()=>{D=null;dictView('setup');dictCount()};
$('dHome').onclick=$('dQuit').onclick=()=>{if(D&&!D.answered&&D.n>0&&!confirm('Dừng luyện nghe? XP đã nhận vẫn được giữ.'))return;D=null;if(canSpeak)speechSynthesis.cancel();show('home');renderHome()};
document.addEventListener('keydown',e=>{
  if(!D||!$('dict').classList.contains('show')||$('dPlay').hidden)return;
  if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();$('dSay').click();return}
  if(D.answered&&e.key==='Enter'){e.preventDefault();$('dNext').click()}
});
