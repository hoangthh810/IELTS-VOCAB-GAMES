// ---------- leaderboard (Firestore leaderboard/{uid}, visible to signed-in players) ----------
// Doc: {name, xp, w_<week>: XP this week, updatedAt}. Only the current week's field is written, so the weekly
// board is orderBy('w_<week>') over the docs that have it (automatic single-field index, no composite index).
// st.lb = {name, on, t}: nickname, shown on the board or not, time of the last change (newest wins when merging).
let boardTab='week';
const lbOn=()=>!st.lb||st.lb.on!==false;
const lbName=()=>((st.lb&&st.lb.name)||((fbUser&&fbUser.displayName)||'Người chơi').trim().split(/\s+/).pop()).slice(0,20);
const lbRef=()=>firebase.firestore().collection('leaderboard').doc(fbUser.uid);
function lbUpload(){
  if(!fbUser)return Promise.resolve();
  if(!lbOn())return lbRef().delete();
  return lbRef().set({name:lbName(),xp:st.xp,['w_'+weekKey()]:weekXp(),updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
}
function openBoard(){show('board');renderBoard()}
async function renderBoard(){
  document.querySelectorAll('#boardTabs .chip').forEach(b=>b.classList.toggle('on',b.dataset.tab===boardTab));
  const me=$('boardMe'),list=$('boardList');list.innerHTML='';
  if(!syncable()){me.innerHTML=`<div class="empty">Bảng xếp hạng chỉ có trên bản web: <a href="https://ielts-vocab-b4905.web.app/">ielts-vocab-b4905.web.app</a></div>`;return}
  if(!fbUser){me.innerHTML=`<div class="acct-txt"><b>🔒 Đăng nhập để xem bảng xếp hạng</b><small>Đăng nhập Google, đặt biệt danh và thi đua XP với mọi người.</small></div><button class="btn gbtn" data-acct="in">Đăng nhập Google</button>`;return}
  me.innerHTML=`<label class="lb-name">Biệt danh <input id="lbName" maxlength="20" value="${esc(lbName())}"></label>
    <label class="lb-on"><input type="checkbox" id="lbOn" ${lbOn()?'checked':''}> Hiện tôi trên bảng</label><button class="btn" id="lbSave">Lưu</button>`;
  list.innerHTML='<li class="empty">Đang tải…</li>';
  try{
    await lbUpload().catch(e=>console.warn(e)); // make sure our own row is current
    const f=boardTab==='week'?'w_'+weekKey():'xp';
    const snap=await firebase.firestore().collection('leaderboard').orderBy(f,'desc').limit(50).get();
    const rows=snap.docs.map(d=>({id:d.id,...d.data(),v:d.data()[f]||0})).filter(r=>r.v>0);
    const mine=rows.findIndex(r=>r.id===fbUser.uid);
    list.innerHTML=rows.length?rows.map((r,j)=>`<li class="${r.id===fbUser.uid?'mine':''}"><span class="rk">${['🥇','🥈','🥉'][j]||j+1}</span><span class="nm">${esc(r.name)}${r.id===fbUser.uid?' <small>(bạn)</small>':''}</span><b>${r.v} XP</b></li>`).join('')
      :`<li class="empty">${boardTab==='week'?'Tuần này chưa ai có XP. Chơi một lượt để lên bảng!':'Chưa có ai trên bảng.'}</li>`;
    if(mine<0&&lbOn())list.innerHTML+=`<li class="mine"><span class="rk">…</span><span class="nm">${esc(lbName())} <small>(bạn)</small></span><b>${boardTab==='week'?weekXp():st.xp} XP</b></li>`;
  }catch(e){console.error(e);list.innerHTML='<li class="empty">Không tải được bảng xếp hạng. Kiểm tra mạng rồi thử lại.</li>'}
}
$('boardBtn').onclick=openBoard;
$('boardBack').onclick=()=>{show('home');renderHome()};
$('boardTabs').onclick=e=>{const b=e.target.closest('[data-tab]');if(!b)return;boardTab=b.dataset.tab;renderBoard()};
$('boardMe').onclick=e=>{
  if(e.target.closest('[data-acct=in]'))return signIn();
  if(!e.target.closest('#lbSave'))return;
  const name=$('lbName').value.trim().replace(/\s+/g,' ').slice(0,20);if(!name){toast('Biệt danh không được để trống');return}
  st.lb={name,on:$('lbOn').checked,t:Date.now()};save();toast(st.lb.on?'Đã lưu biệt danh ✅':'Đã ẩn bạn khỏi bảng xếp hạng');renderBoard();
};
