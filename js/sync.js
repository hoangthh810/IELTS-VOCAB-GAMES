// ---------- cloud sync (optional: Google sign-in + Firestore) ----------
// Guest mode is the default. Signing in stores st in users/{uid} as a JSON string and keeps it in sync.
const OWNER_KEY='ielts-vocab-arena-owner'; // uid that the local progress belongs to (absent = guest)
const FB_VER='10.12.2';
let fbUser=null,syncT=null;
// Admin accounts (Google-verified email) see every adventure stage unlocked; their saved progress is not changed.
// Client-side only: it is a testing convenience, not a security boundary.
const ADMINS=['hoanglolthachdau@gmail.com'];
const isAdmin=()=>!!(fbUser&&fbUser.emailVerified&&ADMINS.includes((fbUser.email||'').toLowerCase()));
const syncable=()=>!!FIREBASE_CONFIG&&/^https?:$/.test(location.protocol); // Google sign-in does not work on file://
const userRef=uid=>firebase.firestore().collection('users').doc(uid);
// stable stringify (sorted keys and primitive arrays) so equal progress compares equal
const canon=o=>JSON.stringify(o,(k,v)=>Array.isArray(v)?(v.every(x=>typeof x!=='object')?[...v].sort():v):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort()):v);
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v);return localStorage.getItem(k)===v}catch(e){return false}};

function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
async function initSync(){
  if(!syncable())return;
  renderAcct('wait');
  try{if(!window.firebase)for(const m of ['app','auth','firestore'])await loadScript(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-${m}-compat.js`)}
  catch(e){renderAcct('');return} // offline: stay in guest mode
  firebase.initializeApp(FIREBASE_CONFIG);
  firebase.auth().onAuthStateChanged(u=>{fbUser=u;if($('map').classList.contains('show'))renderMap();if($('board').classList.contains('show'))renderBoard();if(u)pullAndMerge(u);else{onSaved=null;renderAcct('out')}});
}

// Combine cloud (a) and this device (b). Every rule is max/union, so merging again changes nothing.
function mergeSt(a,b){
  const r=JSON.parse(JSON.stringify(a)),ra=a.rpg||{},rb=b.rpg||{},mx=(x,y)=>Math.max(x||0,y||0);
  r.xp=mx(a.xp,b.xp);r.fixed=mx(a.fixed,b.fixed);r.best=mx(a.best,b.best);
  if((b.last||'')>(a.last||'')||(b.last===a.last&&(b.streak||0)>(a.streak||0))){r.last=b.last;r.streak=b.streak}
  r.badges=[...new Set([...(a.badges||[]),...(b.badges||[])])];
  r.modes=[...new Set([...(a.modes||[]),...(b.modes||[])])];
  r.wrong={...a.wrong};Object.entries(b.wrong||{}).forEach(([k,v])=>r.wrong[k]=mx(r.wrong[k],v));
  r.sound=b.sound;r.topics=b.topics; // device preferences
  const cl={...ra.cleared};Object.entries(rb.cleared||{}).forEach(([k,v])=>cl[k]=mx(cl[k],v));
  const inv={...ra.inv};Object.entries(rb.inv||{}).forEach(([k,v])=>inv[k]=mx(inv[k],v));
  r.rpg={gold:mx(ra.gold,rb.gold),cleared:cl,inv,hpLv:mx(ra.hpLv,rb.hpLv)};
  r.srs={...a.srs};Object.entries(b.srs||{}).forEach(([k,v])=>{if(!r.srs[k]||(v.t||0)>(r.srs[k].t||0))r.srs[k]=v}); // newest review wins
  r.wk=a.wk&&b.wk&&a.wk.k===b.wk.k?{k:a.wk.k,base:Math.min(a.wk.base,b.wk.base)}:(b.wk&&(!a.wk||b.wk.k>a.wk.k)?b.wk:a.wk)||null;
  r.lb=(b.lb&&(!a.lb||(b.lb.t||0)>(a.lb.t||0))?b.lb:a.lb)||null;
  r.decks={...a.decks};Object.entries(b.decks||{}).forEach(([k,v])=>{if(!r.decks[k]||(v.t||0)>(r.decks[k].t||0))r.decks[k]=v}); // newest copy of each deck wins
  const gone=id=>{const d=id[0]==='u'&&r.decks[id.slice(1,id.indexOf('.'))];return !!(d&&d.del)}; // review data of deleted decks
  for(const o of [r.wrong,r.srs])Object.keys(o).forEach(id=>{if(gone(id))delete o[id]});
  for(const k in b)if(!(k in r))r[k]=b[k]; // fields newer than the cloud copy (avoids a reload loop after app updates)
  return r;
}
const upload=s=>userRef(fbUser.uid).set({data:JSON.stringify(s),xp:s.xp,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});

async function pullAndMerge(u){
  renderAcct('sync');
  try{
    const snap=await userRef(u.uid).get(),cloud=snap.exists?JSON.parse(snap.data().data):null;
    const owner=lsGet(OWNER_KEY),local=(!owner||owner===u.uid)?st:null; // never merge another account's progress
    const merged=cloud?(local?mergeSt(cloud,local):cloud):st;
    if(!cloud||canon(cloud)!==canon(merged))await upload(merged);
    lsSet(OWNER_KEY,u.uid);
    if(canon(merged)!==canon(st)&&lsSet(KEY,JSON.stringify(merged))){location.reload();return} // restart with the account's progress
    onSaved=queueUpload;renderAcct('ok');lbUpload().catch(e=>console.warn(e));
  }catch(e){console.error(e);renderAcct('err');setTimeout(()=>{if(fbUser===u)pullAndMerge(u)},15000)}
}
function queueUpload(){clearTimeout(syncT);syncT=setTimeout(flushUpload,2000)}
function flushUpload(){
  clearTimeout(syncT);syncT=null;if(!fbUser)return Promise.resolve();
  renderAcct('sync');lbUpload().catch(e=>console.warn(e));return upload(st).then(()=>renderAcct('ok'),e=>{console.error(e);renderAcct('err')});
}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&syncT)flushUpload()});

function signIn(){
  const p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});
  firebase.auth().signInWithPopup(p).catch(e=>{
    if(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment')firebase.auth().signInWithRedirect(p);
    else if(e.code!=='auth/popup-closed-by-user'&&e.code!=='auth/cancelled-popup-request')toast('Đăng nhập thất bại ('+e.code+')')});
}
async function signOut(){
  if(!confirm('Đăng xuất? Tiến độ đã được lưu trong tài khoản. Máy này sẽ trở về chế độ khách.'))return;
  if(syncT)await flushUpload();
  onSaved=null;await firebase.auth().signOut();
  try{localStorage.removeItem(KEY);localStorage.removeItem(OWNER_KEY)}catch(e){}
  location.reload();
}

function renderAcct(state){
  const el=$('acct');
  if(!state||state==='wait'){el.innerHTML='';return}
  if(state==='out'||!fbUser){el.innerHTML=`<div class="acct-txt"><b>☁️ Lưu tiến độ lên tài khoản</b><small>Đăng nhập Google để chơi tiếp trên mọi thiết bị</small></div><button class="btn gbtn" data-acct="in">Đăng nhập Google</button>`;return}
  const msg={sync:'⏳ Đang đồng bộ…',ok:'✅ Đã đồng bộ',err:'⚠️ Chưa đồng bộ được, sẽ thử lại'}[state]||'';
  el.innerHTML=(fbUser.photoURL?`<img class="ava" src="${esc(fbUser.photoURL)}" alt="" referrerpolicy="no-referrer">`:'<div class="ava">🐱</div>')+
    `<div class="acct-txt"><b>${esc(fbUser.displayName||fbUser.email||'Bạn')}</b><small>${msg}${isAdmin()?' · 🛠️ Admin: mở mọi màn':''}</small></div><button class="btn ghost" data-acct="out">Đăng xuất</button>`;
}
$('acct').onclick=e=>{const b=e.target.closest('[data-acct]');if(!b)return;b.dataset.acct==='in'?signIn():signOut()};
