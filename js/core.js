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
const VOICE_KEY='ielts-vocab-arena-voice'; // voiceURI picked in "Nghe & viết" (per device: voices differ between devices)
let enVoice=null;
const enVoices=()=>canSpeak?speechSynthesis.getVoices().filter(v=>/^en[-_]/i.test(v.lang)):[];
function pickVoice(){let want=null;try{want=localStorage.getItem(VOICE_KEY)}catch(e){}
  const vs=enVoices();enVoice=vs.find(v=>v.voiceURI===want)||vs.find(v=>/GB/i.test(v.lang))||vs[0]||null;
  if(typeof renderVoices==='function')renderVoices()}
if(canSpeak){pickVoice();speechSynthesis.onvoiceschanged=pickVoice}
function speak(text,rate=.9){
  if(!canSpeak)return;speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);u.lang=enVoice?enVoice.lang.replace('_','-'):'en-GB';if(enVoice)u.voice=enVoice;u.rate=rate;
  speechSynthesis.speak(u);
}
const spk=text=>canSpeak?`<button class="spk" type="button" data-say="${esc(text)}" title="Nghe phát âm">🔊</button>`:'';
const ipaTag=it=>it.ipa?` <span class="ipa">${esc(it.ipa)}</span>`:'';
const termHtml=it=>`<b>${esc(it.term)}</b>${ipaTag(it)}${spk(it.term)}`;
const exLine=it=>it.ex?`📝 ${hlEx(it.ex,it.term)}`:''; // imported words may have no example
document.addEventListener('click',e=>{const b=e.target.closest('.spk');if(b)speak(b.dataset.say)});

// ---------- storage ----------
const KEY='ielts-vocab-arena-v1';
let st={xp:0,streak:0,last:null,badges:[],modes:[],wrong:{},fixed:0,best:0,sound:true,topics:null,srs:{},wk:null,lb:null,decks:{},closet:{own:[],wear:{},t:0}};
try{Object.assign(st,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
let onSaved=null; // set by sync.js while signed in, to push progress to the cloud
const save=()=>{rollWeek();try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}if(onSaved)onSaved()};
const dayKey=(d=new Date())=>d.toLocaleDateString('sv');
const yesterday=()=>{const d=new Date();d.setDate(d.getDate()-1);return dayKey(d)};
const liveStreak=()=>(st.last===dayKey()||st.last===yesterday())?st.streak:0;
// ISO week like '2026W45' (weeks start on Monday). st.wk = {k: week, base: st.xp when the week started}
function weekKey(d=new Date()){
  const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));t.setUTCDate(t.getUTCDate()+4-(t.getUTCDay()||7));
  const w=Math.ceil(((t-Date.UTC(t.getUTCFullYear(),0,1))/864e5+1)/7);return t.getUTCFullYear()+'W'+String(w).padStart(2,'0');
}
function rollWeek(){const k=weekKey();if(!st.wk||st.wk.k!==k)st.wk={k,base:st.xp}}
const weekXp=()=>{rollWeek();return st.xp-st.wk.base};
rollWeek();

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
  const cols=['#ff922b','#e64980','#fcc419','#51cf66','#339af0','#845ef7'];
  for(let i=0;i<n;i++){const c=document.createElement('i');c.className='cf';
    c.style.left=Math.random()*100+'vw';c.style.background=pick(cols);
    c.style.animationDuration=(1.2+Math.random()*1.3)+'s';c.style.animationDelay=Math.random()*.3+'s';
    document.body.appendChild(c);setTimeout(()=>c.remove(),3000)}
}
function plus(txt,el){const r=el.getBoundingClientRect();const p=document.createElement('div');p.className='plus';p.textContent=txt;
  p.style.left=(r.left+r.width/2-20)+'px';p.style.top=(r.top-10)+'px';document.body.appendChild(p);setTimeout(()=>p.remove(),900)}
// ---------- cat sounds (synthesised with WebAudio, no audio files) ----------
let actx;
// one "meow": a sawtooth voice through two vowel formants; pitch p and formant f glide [start, peak, end] (Hz) over dur seconds
function meow(a,out,t,dur,p,f,vol){
  const o=a.createOscillator(),vib=a.createOscillator(),vg=a.createGain(),f1=a.createBiquadFilter(),f2=a.createBiquadFilter(),g2=a.createGain(),g=a.createGain();
  o.type='sawtooth';o.frequency.setValueAtTime(p[0],t);o.frequency.linearRampToValueAtTime(p[1],t+dur*.35);o.frequency.exponentialRampToValueAtTime(p[2],t+dur);
  vib.frequency.value=6;vg.gain.value=p[1]*.015;vib.connect(vg);vg.connect(o.frequency); // a little vibrato
  [f1,f2].forEach((b,j)=>{const k=j?2.3:1;b.type='bandpass';b.Q.value=j?6:3.5;
    b.frequency.setValueAtTime(f[0]*k,t);b.frequency.linearRampToValueAtTime(f[1]*k,t+dur*.4);b.frequency.linearRampToValueAtTime(f[2]*k,t+dur)});
  g2.gain.value=.5;o.connect(f1);o.connect(f2);f2.connect(g2);f1.connect(g);g2.connect(g);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.05);g.gain.setValueAtTime(vol,t+dur*.55);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  g.connect(out);o.start(t);vib.start(t);o.stop(t+dur+.02);vib.stop(t+dur+.02);
}
// purr: low-passed noise pulsing ~24 times a second
function purr(a,out,t,dur,vol){
  const n=a.createBufferSource(),b=a.createBuffer(1,Math.ceil(a.sampleRate*dur),a.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const lp=a.createBiquadFilter(),am=a.createGain(),lfo=a.createOscillator(),lg=a.createGain(),g=a.createGain();
  n.buffer=b;lp.type='lowpass';lp.frequency.value=260;lfo.frequency.value=24;lg.gain.value=.5;am.gain.value=.5;lfo.connect(lg);lg.connect(am.gain);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.12);g.gain.setValueAtTime(vol,t+dur-.25);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  n.connect(lp);lp.connect(am);am.connect(g);g.connect(out);n.start(t);lfo.start(t);n.stop(t+dur);lfo.stop(t+dur);
}
const CAT={ // kind -> (context, output, start time)
  ok:(a,o,t)=>meow(a,o,t,.26,[760,1100,950],[1300,2300,1700],.9),                                      // short happy "mew"
  no:(a,o,t)=>meow(a,o,t,.55,[560,640,380],[900,1500,650],.8),                                         // sad "mraow"
  badge:(a,o,t)=>{meow(a,o,t,.16,[600,1000,1250],[1000,1900,2200],.7);meow(a,o,t+.2,.4,[820,1250,1000],[1300,2400,1600],.9)}, // "mrrp, meow!"
  end:(a,o,t)=>{meow(a,o,t,.45,[680,1000,760],[1100,2100,1300],.85);purr(a,o,t+.42,.9,.9)}};          // meow, then purr
function beep(kind){
  if(!st.sound)return;
  try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume();
    const m=actx.createGain();m.gain.value=.4;m.connect(actx.destination); // about as loud as the old beeps
    CAT[kind](actx,m,actx.currentTime+.01);setTimeout(()=>m.disconnect(),2500)}catch(e){}
}

// ---------- screens ----------
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('show',s.id===id));window.scrollTo(0,0)}
