// ---------- data ----------
const ALL = DATA.flatMap((t,ti)=>[
  ...t.words.map((w,i)=>({id:ti+'w'+i,ti,kind:'word',term:w[0],pos:w[1],mean:w[2],ex:w[3],ipa:w[4]||''})),
  ...t.cols.map((c,i)=>({id:ti+'c'+i,ti,kind:'col',term:c[0],pos:'',mean:c[1],ex:c[2]}))]);
const BYID = Object.fromEntries(ALL.map(x=>[x.id,x]));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const $=id=>document.getElementById(id);

function findMatch(ex,term){
  const skip=['the',"one's","someone's",'something','with'];
  const first=term.split(/[ ;\/]/).map(w=>w.replace(/'s$/,'')).find(w=>w.length>2&&!skip.includes(w.toLowerCase()))||'';
  const base=first.slice(0,Math.max(4,first.length-2));
  if(!base) return null;
  const m=new RegExp('\\b'+base.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[\\w-]*','i').exec(ex);
  return m?{i:m.index,t:m[0]}:null;
}
function hlEx(ex,term){
  const m=findMatch(ex,term); if(!m) return esc(ex);
  return esc(ex.slice(0,m.i))+'<b>'+esc(m.t)+'</b>'+esc(ex.slice(m.i+m.t.length));
}

// ---------- pronunciation ----------
const canSpeak='speechSynthesis' in window;
let enVoice=null;
function pickVoice(){const vs=speechSynthesis.getVoices().filter(v=>/^en[-_]/i.test(v.lang));enVoice=vs.find(v=>/GB/i.test(v.lang))||vs[0]||null}
if(canSpeak){pickVoice();speechSynthesis.onvoiceschanged=pickVoice}
function speak(text){
  if(!canSpeak)return;speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);u.lang=enVoice?enVoice.lang.replace('_','-'):'en-GB';if(enVoice)u.voice=enVoice;u.rate=.9;
  speechSynthesis.speak(u);
}
const spk=text=>canSpeak?`<button class="spk" type="button" data-say="${esc(text)}" title="Nghe phát âm">🔊</button>`:'';
const ipaTag=it=>it.ipa?` <span class="ipa">${esc(it.ipa)}</span>`:'';
const termHtml=it=>`<b>${esc(it.term)}</b>${ipaTag(it)}${spk(it.term)}`;
document.addEventListener('click',e=>{const b=e.target.closest('.spk');if(b)speak(b.dataset.say)});

// ---------- storage ----------
const KEY='ielts-vocab-arena-v1';
let st={xp:0,streak:0,last:null,badges:[],modes:[],wrong:{},fixed:0,best:0,sound:true,topics:null};
try{Object.assign(st,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
let onSaved=null; // set by sync.js while signed in, to push progress to the cloud
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}if(onSaved)onSaved()};
const dayKey=(d=new Date())=>d.toLocaleDateString('sv');
const yesterday=()=>{const d=new Date();d.setDate(d.getDate()-1);return dayKey(d)};
const liveStreak=()=>(st.last===dayKey()||st.last===yesterday())?st.streak:0;

// ---------- badges ----------
const BADGES=[
 {id:'first',e:'🚀',n:'Khởi động',d:'Hoàn thành lượt chơi đầu tiên'},
 {id:'combo5',e:'🔥',n:'Nóng tay',d:'Đạt combo 5'},
 {id:'combo10',e:'⚡',n:'Không thể cản',d:'Đạt combo 10'},
 {id:'perfect',e:'💯',n:'Hoàn hảo',d:'Đúng 12/12 câu trong một lượt'},
 {id:'allmodes',e:'🧠',n:'Toàn năng',d:'Chơi cả Quiz, Điền từ và Collocation'},
 {id:'fixer',e:'🩹',n:'Sửa sai',d:'Trả lời đúng 10 từ từng làm sai'},
 {id:'streak3',e:'📅',n:'Chăm chỉ',d:'Học 3 ngày liên tiếp'},
 {id:'streak7',e:'🏆',n:'Kỷ luật thép',d:'Học 7 ngày liên tiếp'},
 {id:'xp500',e:'⭐',n:'500 XP',d:'Tích luỹ 500 XP'},
 {id:'xp2000',e:'👑',n:'Cao thủ',d:'Tích luỹ 2000 XP'},
 {id:'boss1',e:'⚔️',n:'Thợ săn boss',d:'Hạ gục boss đầu tiên'},
 {id:'stars3',e:'🌟',n:'Ba sao',d:'Thắng một màn với 3 sao'},
 {id:'dragon',e:'🐲',n:'Huyền thoại',d:'Đánh bại Rồng IELTS Tối Thượng'}];
function unlock(id){
  if(st.badges.includes(id))return; st.badges.push(id); save();
  const b=BADGES.find(x=>x.id===id); toast(`${b.e} Mở khoá huy hiệu: ${b.n}!`); confetti(60); beep('badge');
}

// ---------- fx ----------
let toastT;
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2600)}
function confetti(n=30){
  const cols=['#6d28d9','#db2777','#f59e0b','#16a34a','#0ea5e9'];
  for(let i=0;i<n;i++){const c=document.createElement('i');c.className='cf';
    c.style.left=Math.random()*100+'vw';c.style.background=pick(cols);
    c.style.animationDuration=(1.2+Math.random()*1.3)+'s';c.style.animationDelay=Math.random()*.3+'s';
    document.body.appendChild(c);setTimeout(()=>c.remove(),3000)}
}
function plus(txt,el){const r=el.getBoundingClientRect();const p=document.createElement('div');p.className='plus';p.textContent=txt;
  p.style.left=(r.left+r.width/2-20)+'px';p.style.top=(r.top-10)+'px';document.body.appendChild(p);setTimeout(()=>p.remove(),900)}
let actx;
function beep(kind){
  if(!st.sound)return;
  try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();
    const seq={ok:[660,880],no:[220,170],badge:[523,659,784,1047],end:[392,523,659]}[kind];
    seq.forEach((f,i)=>{const o=actx.createOscillator(),g=actx.createGain();o.type='triangle';o.frequency.value=f;
      g.gain.setValueAtTime(.12,actx.currentTime+i*.09);g.gain.exponentialRampToValueAtTime(.001,actx.currentTime+i*.09+.18);
      o.connect(g);g.connect(actx.destination);o.start(actx.currentTime+i*.09);o.stop(actx.currentTime+i*.09+.2)})}catch(e){}
}

// ---------- screens ----------
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('show',s.id===id));window.scrollTo(0,0)}
