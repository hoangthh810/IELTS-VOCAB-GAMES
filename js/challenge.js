// ---------- challenge a friend: a link carries the round's seed, mode, topics and your score; no server needed ----------
// ?ch=<base64url JSON {s seed, m mode, t topic indexes, n name, p score, c correct, l questions}>. The friend's game uses
// the same seed and built-in words (start() in practice.js), so both get the same questions. Scores are not verified.
const CH_NAME_KEY='ielts-vocab-arena-chname';
const MODE_N={quiz:'🎯 Quiz nghĩa',fill:'✍️ Điền từ',col:'🧩 Collocation',mix:'🌀 Hỗn hợp',syn:'🔁 Đồng nghĩa'};
const b64u={enc:o=>btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''),
  dec:s=>JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))))};
const chInt=(v,lo,hi)=>Number.isInteger(v)&&v>=lo&&v<=hi;
function chParse(s){ // the link comes from anyone: check every field
  try{const o=b64u.dec(s);
    if(!chInt(o.s,0,2**31)||!Object.hasOwn(MODE_N,o.m)||!Array.isArray(o.t)||!o.t.length||!o.t.every(i=>chInt(i,0,DATA.length-1))||!chInt(o.l,1,LEN)||!chInt(o.c,0,o.l)||!chInt(o.p,0,o.l*40))return null;
    return{s:o.s,m:o.m,t:[...new Set(o.t)],n:String(o.n||'').trim().slice(0,20)||'Một người bạn',p:o.p,c:o.c,l:o.l};
  }catch(e){return null}
}
let chIn=chParse(new URLSearchParams(location.search).get('ch')||'');
const chClear=()=>{chIn=null;try{const u=new URL(location.href);u.searchParams.delete('ch');history.replaceState(null,'',u)}catch(e){}renderChBanner()};
const topicsTxt=t=>t.length>=DATA.length?'Tất cả chủ đề':t.length>3?`${t.length} chủ đề`:t.map(i=>DATA[i].name).join(', ');
function renderChBanner(){
  const b=$('chBanner');if(!chIn){b.hidden=true;return}b.hidden=false;
  b.innerHTML=`<div class="e">⚔️</div><div class="t"><b>${esc(chIn.n)} thách đấu bạn!</b><br><small>${MODE_N[chIn.m]} · ${esc(topicsTxt(chIn.t))} · ${chIn.l} câu<br>${esc(chIn.n)} được <b>${chIn.p} điểm</b> (đúng ${chIn.c}/${chIn.l}). Cùng đề, bạn có vượt qua không?</small></div>
    <div class="srs-btns"><button class="btn" data-ch="go">⚔️ Nhận thách đấu</button><button class="btn ghost" data-ch="no">Để sau</button></div>`;
}
$('chBanner').onclick=e=>{const b=e.target.closest('[data-ch]');if(!b)return;const c=chIn;chClear();if(b.dataset.ch==='go')start(c.m,c)};
function renderChResult(){
  const box=$('chBox'),c=G.ch;
  if(G.seed==null){box.innerHTML='';return}
  const vs=c?(G.score>c.p?`🏆 Bạn thắng ${esc(c.n)}!`:G.score<c.p?`😿 ${esc(c.n)} thắng rồi, thử lại nhé!`:'🤝 Hoà nhau!'):'';
  box.innerHTML=(c?`<div class="vs"><div><b>${G.score}</b><small>Bạn</small></div><span>VS</span><div><b>${c.p}</b><small>${esc(c.n)}</small></div></div><div class="vsr">${vs}</div>`:'')+
    `<button class="btn ghost" id="chSend">⚔️ ${c?'Gửi lại thách đấu':'Thách bạn bè cùng đề này'}</button>`;
  $('chSend').onclick=chShare;
}
async function chShare(){
  let name=(st.lb&&st.lb.name)||'';try{name=localStorage.getItem(CH_NAME_KEY)||name}catch(e){}
  name=prompt('Tên của bạn trong lời thách đấu:',name);if(name===null)return;name=name.trim().slice(0,20)||'Một người bạn';
  try{localStorage.setItem(CH_NAME_KEY,name)}catch(e){}
  const url=location.origin+location.pathname+'?ch='+b64u.enc({s:G.seed,m:G.mode,t:G.topics,n:name,p:G.score,c:G.correct,l:G.len});
  const text=`⚔️ ${name} được ${G.score} điểm ở Vocab Arena (${MODE_N[G.mode]}, ${G.len} câu). Bạn dám thử cùng đề không? 🐱`;
  if(navigator.share)try{await navigator.share({title:'Thách đấu Vocab Arena',text,url});return}catch(e){if(e.name==='AbortError')return}
  try{await navigator.clipboard.writeText(text+'\n'+url);toast('📋 Đã copy link thách đấu, gửi cho bạn bè nhé!')}catch(e){prompt('Copy link này gửi cho bạn bè:',url)}
}
