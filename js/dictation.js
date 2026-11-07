// ---------- listen & write (dictation): hear a word, type it back; no timer ----------
// The same screen runs 🎤 speaking practice (DM='say'): see the word, say it, the browser's speech recognition checks it.
// Words come from a built-in topic, an imported deck, the topics picked on the home screen, or the wrong-answer bank.
// Settings {src, kind, len, rate} are a per-device preference; the voice is VOICE_KEY in core.js (used by every speaker button).
const DICT_KEY='ielts-vocab-arena-dict';
let D=null; // running session: {q, n, correct, xp0, missed, answered, hint, tries, heard}
let DM='write'; // 'write' (listen & write) or 'say' (speaking)
const dictOk=x=>/^[a-z][a-z' -]*$/i.test(x.term.trim())&&x.term.length<=40; // things a voice can read and a learner can type
const normT=s=>s.toLowerCase().replace(/[’`]/g,"'").replace(/[.,!?;:]+$/,'').replace(/\s+/g,' ').trim();
function dictPrefs(){try{return JSON.parse(localStorage.getItem(DICT_KEY))||{}}catch(e){return{}}}
function dictPool(){
  const src=$('dSrc').value,k=$('dKind').value;
  const P=src==='home'?ALL.filter(x=>sel.has(x.ti)):src==='wrong'?wrongIds().map(id=>BYID[id]):ALL.filter(x=>String(x.ti)===src);
  return P.filter(x=>(k==='all'||x.kind===k)&&dictOk(x));
}
// accents by region code of the voice's lang (en-GB, en_IN...); the browser only offers the voices installed on the device
const ACCENTS={GB:'Anh-Anh',US:'Anh-Mỹ',AU:'Anh-Úc',IN:'Anh-Ấn',SG:'Anh-Singapore',CA:'Anh-Canada',IE:'Anh-Ireland',NZ:'Anh-New Zealand',ZA:'Anh-Nam Phi',PH:'Anh-Philippines',HK:'Anh-Hồng Kông',NG:'Anh-Nigeria',KE:'Anh-Kenya',TZ:'Anh-Tanzania'};
const accentOf=v=>((v.lang.split(/[-_]/)[1]||'').toUpperCase());
const voiceName=v=>v.name.replace(/^(Microsoft|Google)\s+/,'').replace(/\s*[-–]\s*English.*$/,'').replace(/\s*Online \(Natural\)/,' ✨');
function renderVoices(){
  const s=$('dVoice'),vs=enVoices();if(!s)return;
  const order=Object.keys(ACCENTS),groups={};for(const v of vs)(groups[accentOf(v)]=groups[accentOf(v)]||[]).push(v);
  const keys=Object.keys(groups).sort((a,b)=>(order.indexOf(a)+1||99)-(order.indexOf(b)+1||99));
  s.innerHTML=`<option value="">Tự động (ưu tiên Anh-Anh)</option>`+keys.map(k=>`<optgroup label="${esc(ACCENTS[k]||'Tiếng Anh '+k)}">`+
    groups[k].map(v=>`<option value="${esc(v.voiceURI)}">${esc(ACCENTS[k]||k)} · ${esc(voiceName(v))}</option>`).join('')+'</optgroup>').join('');
  let want='';try{want=localStorage.getItem(VOICE_KEY)||''}catch(e){}s.value=vs.some(v=>v.voiceURI===want)?want:'';
  const missing=['US','GB','AU','IN','SG','CA'].filter(k=>!groups[k]).map(k=>ACCENTS[k]);
  $('dVoiceNote').textContent=!vs.length?(canSpeak?'Đang tải danh sách giọng…':'Trình duyệt này không đọc được tiếng Anh, hãy thử Chrome hoặc Edge.')
    :`Máy bạn có ${vs.length} giọng: ${keys.map(k=>ACCENTS[k]||k).join(', ')}.`+(missing.length?` Muốn thêm giọng ${missing.join(', ')}: mở web bằng Microsoft Edge (có sẵn rất nhiều giọng ✨ tự nhiên), hoặc cài thêm giọng tiếng Anh trong Cài đặt › Thời gian & ngôn ngữ › Giọng nói của Windows / điện thoại.`:'');
}
const DTXT={write:{t:'🎧 <span>Nghe & viết</span>',i:'Nghe từ rồi gõ lại cho đúng chính tả. Không giới hạn thời gian, nghe lại bao nhiêu lần cũng được.',
    f:'Đúng +10 XP (dùng gợi ý +5 XP). Từ viết sai vào "Từ hay sai" và lịch ôn tập.<br>Phím tắt: Enter để kiểm tra / sang từ tiếp, Ctrl + Enter để nghe lại.'},
  say:{t:'🎤 <span>Luyện nói</span>',i:'Nhìn từ, bấm 🎤 rồi đọc to. Máy nghe và chấm phát âm của bạn, sai thì đọc lại (tối đa 3 lần). Bấm 🔊 để nghe giọng mẫu.',
    f:'Đúng lần đầu +10 XP, đọc lại mới đúng +5 XP. Đọc sai 3 lần thì từ vào "Từ hay sai".<br>Cần micro và trình duyệt Chrome / Edge (có mạng). Phím tắt: Enter để bắt đầu nói / sang từ tiếp, Ctrl + Enter để nghe mẫu.'}};
function openDict(mode='write'){
  DM=mode;$('dTitle0').innerHTML=DTXT[mode].t;$('dIntro').textContent=DTXT[mode].i;$('dFoot').innerHTML=DTXT[mode].f+'<br>Giọng đọc lấy từ trình duyệt và máy của bạn; Chrome và Edge thường có nhiều giọng nhất. Giọng bạn chọn cũng dùng cho mọi nút 🔊 trong app.';
  const say=mode==='say';$('dForm').hidden=$('dHintBtn').hidden=say;$('dMic').hidden=$('dWord').hidden=$('dHeard').hidden=!say;
  $('dSkip').textContent=say?'Bỏ qua ⏭️':'Xem đáp án 🤷';$('dQ').textContent=say?'🎤 Đọc to từ này':'🎧 Nghe và viết lại';
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
  D={q:shuffle(q),n:0,correct:0,xp0:st.xp,missed:[],answered:false,hint:0,tries:0};dictView('play');nextDict();
}
function nextDict(){
  if(D.n>=D.q.length)return endDict();
  D.answered=false;D.hint=0;D.tries=0;D.heard='';stopListen();const it=D.q[D.n];
  $('dBar').style.width=(D.n/D.q.length*100)+'%';$('dCount').textContent=`${D.n+1}/${D.q.length}`;
  $('dKind2').textContent=it.kind==='col'?'Cụm từ':'Từ đơn';$('dHint').innerHTML='';$('dFb').className='feedback';
  const i=$('dIn');i.value='';i.className='';i.disabled=false;$('dHintBtn').disabled=false;$('dSkip').hidden=false;
  if(DM==='say'){$('dWord').innerHTML=`<div class="qmain">${esc(it.term)}</div><div class="qsub">${ipaTag(it)}${it.pos?` (${esc(it.pos)})`:''} · ${esc(it.mean)}</div>`;
    $('dHeard').textContent='Bấm 🎤 rồi đọc to từ trên nhé';$('dMic').disabled=false;setTimeout(()=>$('dMic').focus(),50);return}
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
  if(!D||D.answered)return;const typed=DM==='say'?'':$('dIn').value.trim();if(!typed&&!skip)return;
  settleDict(!skip&&normT(typed)===normT(D.q[D.n].term),typed,skip);
}
function settleDict(ok,typed,skip){
  const it=D.q[D.n],id=it.id,say=DM==='say';D.answered=true;stopListen();
  const i=$('dIn');i.disabled=true;i.classList.add(ok?'right':'wrong');$('dHintBtn').disabled=true;$('dSkip').hidden=true;$('dMic').disabled=true;
  srsGrade(id,ok?1:0);
  if(ok){const pts=D.hint||D.tries>1?5:10;D.correct++;st.xp+=pts;plus('+'+pts,say?$('dMic'):i);beep('ok');if(!say)quest('dict');if(st.wrong[id]){delete st.wrong[id];st.fixed=(st.fixed||0)+1;if(st.fixed>=10)unlock('fixer')}}
  else{st.wrong[id]=(st.wrong[id]||0)+1;D.missed.push(it);beep('no')}
  save();
  const d=typed&&!ok?diffHtml(typed,it.term):null;
  $('dFbT').textContent=ok?pick(say?['Phát âm chuẩn! 🎤','Nói hay lắm! 🗣️','Chuẩn bản xứ luôn! 🐱','Đúng rồi! 👏']:['Chuẩn chính tả! 🎉','Nghe tốt lắm! 👂','Tai thính ghê! 🐱','Đúng rồi! 👏']):skip?(say?'Bỏ qua, nghe mẫu nhé:':'Đáp án là:'):say?'Chưa nhận ra từ này 😅':'Chưa đúng rồi 😅';
  $('dFbA').innerHTML=d?`<div class="ddiff">Bạn viết: <span>${d.u}</span></div><div class="ddiff">Đáp án: <span>${d.r}</span></div>`:say&&!ok&&D.heard?`<div class="ddiff">Máy nghe thành: <span>${esc(D.heard)}</span></div>`:'';
  if(say&&!ok)speak(it.term,dictRate());
  $('dFbEx').innerHTML=`${termHtml(it)}: ${esc(it.mean)}<br>${exLine(it)}`;
  $('dFb').className='feedback show '+(ok?'ok':'no');setTimeout(()=>$('dNext').focus(),30);
}
function endDict(){
  touchStreak();save();xpBadges();
  const r=D.correct/D.q.length;
  $('dEmoji').textContent=r===1?'🏆':r>=.75?'🎉':r>=.5?'👍':'💪';
  $('dTitle').textContent=DM==='say'?(r===1?'Phát âm chuẩn từng từ!':r>=.75?'Nói hay lắm!':r>=.5?'Khá ổn, luyện thêm chút nữa nhé!':'Không sao, luyện tiếp nhé!'):r===1?'Nghe chuẩn từng chữ!':r>=.75?'Tai thính lắm!':r>=.5?'Khá ổn, nghe thêm chút nữa nhé!':'Không sao, luyện tiếp nhé!';
  $('dxSub').textContent=`Đúng ${D.correct}/${D.q.length} từ · +${st.xp-D.xp0} XP · Chuỗi ${st.streak} ngày 🔥`;
  $('dxReview').innerHTML=D.missed.length?`<h2>📕 Từ cần ${DM==='say'?'luyện đọc':'nghe'} lại</h2>`+D.missed.map(it=>`<div class="it">${termHtml(it)}: ${esc(it.mean)}</div>`).join(''):'';
  dictView('done');beep('end');if(r>=.75)confetti(r===1?100:50);
}
$('dictBtn').onclick=()=>openDict('write');$('speakBtn').onclick=()=>openDict('say');
$('dSrc').onchange=$('dKind').onchange=dictCount;
$('dVoice').onchange=()=>{try{localStorage.setItem(VOICE_KEY,$('dVoice').value)}catch(e){}pickVoice();speak('Hello! Let\'s practise listening.',dictRate())};
$('dTry').onclick=()=>speak(pick(dictPool().map(x=>x.term).concat('sustainable development')),dictRate());
$('dStart').onclick=startDict;
$('dSay').onclick=()=>{if(D)speak(D.q[D.n].term,dictRate());if(DM==='write')$('dIn').focus()};
$('dSlow').onclick=()=>{if(D)speak(D.q[D.n].term,.6);if(DM==='write')$('dIn').focus()};
$('dMic').onclick=listen;
$('dHintBtn').onclick=dictHint;
$('dSkip').onclick=()=>checkDict(true);
$('dForm').onsubmit=e=>{e.preventDefault();D&&D.answered?($('dNext').click()):checkDict(false)};
$('dNext').onclick=()=>{if(D&&D.answered){D.n++;nextDict()}};
$('dAgain').onclick=startDict;
$('dSettings').onclick=()=>{D=null;dictView('setup');dictCount()};
$('dHome').onclick=$('dQuit').onclick=()=>{if(D&&!D.answered&&D.n>0&&!confirm('Dừng luyện tập? XP đã nhận vẫn được giữ.'))return;stopListen();D=null;if(canSpeak)speechSynthesis.cancel();show('home');renderHome()};
document.addEventListener('keydown',e=>{
  if(!D||!$('dict').classList.contains('show')||$('dPlay').hidden)return;
  if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();$('dSay').click();return}
  if(D.answered&&e.key==='Enter'){e.preventDefault();$('dNext').click()}
  else if(DM==='say'&&e.key==='Enter'&&!e.target.closest('#dSay,#dSlow,#dSkip')){e.preventDefault();listen()}
});

// ---------- speaking: Web Speech API recognition (Chrome / Edge send the audio to their speech service) ----------
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let rec=null;
const sayNorm=s=>normT(s).replace(/-/g,' ');
const stopListen=()=>{if(rec){rec.onresult=rec.onerror=null;try{rec.abort()}catch(e){}rec=null}$('dMic').classList.remove('on')};
function listen(){
  if(!D||D.answered||DM!=='say')return;
  if(!SR){$('dHeard').textContent='😿 Trình duyệt này chưa nhận được giọng nói. Hãy mở web bằng Chrome hoặc Edge nhé.';return}
  if(rec){stopListen();$('dHeard').textContent='Bấm 🎤 rồi đọc to từ trên nhé';return}
  if(canSpeak)speechSynthesis.cancel();
  const r=rec=new SR();r.lang=enVoice?enVoice.lang.replace('_','-'):'en-GB';r.maxAlternatives=5;r.interimResults=false;
  $('dMic').classList.add('on');$('dHeard').textContent='🎙️ Đang nghe… đọc to từ này nhé';
  r.onresult=e=>sayCheck([...e.results[0]].map(a=>a.transcript));
  r.onerror=e=>{$('dHeard').textContent=e.error==='not-allowed'||e.error==='service-not-allowed'?'🔒 Hãy cho phép web dùng micro (bấm biểu tượng bên trái thanh địa chỉ) rồi thử lại.'
    :e.error==='no-speech'?'🤫 Chưa nghe thấy gì, bấm 🎤 và đọc to hơn nhé.':e.error==='network'?'📶 Cần có mạng để nhận giọng nói.':`⚠️ Không nhận được giọng nói (${e.error}), thử lại nhé.`};
  r.onend=()=>{if(rec===r){rec=null;$('dMic').classList.remove('on')}};
  try{r.start()}catch(e){rec=null;$('dMic').classList.remove('on')}
}
function sayCheck(alts){
  if(!D||D.answered)return;const want=sayNorm(D.q[D.n].term);D.tries++;D.heard=alts[0]||'';
  if(alts.some(a=>` ${sayNorm(a)} `.includes(` ${want} `)))return settleDict(true,'',false); // "the curriculum" still counts
  beep('no');if(D.tries>=3)return settleDict(false,'',false);
  $('dHeard').innerHTML=`👂 Máy nghe thành: <b>${esc(D.heard||'…')}</b>. Còn ${3-D.tries} lần, bấm 🔊 nghe mẫu rồi 🎤 đọc lại nhé!`;
}
