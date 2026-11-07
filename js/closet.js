// ---------- closet: buy characters and outfits with gold and dress the hero (cosmetic only) ----------
// st.closet = {own: ['slot:id', ...] bought items, wear: {slot: id} ('' = nothing), t: last change (ms, newest wins when merging)}.
// Items, slots and drawings live in scene.js (OUTFIT, SLOTS, WEAR0, drawCat).
let closetSlot='pet',tryOn=null,closetBack='map'; // tryOn: item previewed on the cat, not bought/worn yet
const tier=p=>p>=1500?['legend','🌟 Huyền thoại']:p>=700?['rare','💎 Hiếm']:['','']; // rarity by price
const owns=(slot,id)=>!id||OUTFIT[slot][id].p===0||st.closet.own.includes(slot+':'+id);
function openCloset(from){closetBack=from||'map';tryOn=null;show('closet');renderCloset();closetLoop()}
function renderCloset(){
  const w=wearing(),cur=tryOn&&tryOn.slot===closetSlot?tryOn.id:w[closetSlot],it=cur&&OUTFIT[closetSlot][cur];
  $('closetGold').textContent=`💰 ${st.rpg.gold}`;
  $('closetTabs').innerHTML=SLOTS.map(([k,e,n])=>`<button class="chip ${k===closetSlot?'on':''}" data-slot="${k}">${e} ${n}</button>`).join('');
  const items=Object.entries(OUTFIT[closetSlot]),none=closetSlot!=='fur'&&closetSlot!=='pet'; // a hero always has a body and a fur
  $('closetItems').innerHTML=(none?[['',{n:'Không mặc',e:'🚫',p:0}],...items]:items).map(([id,o])=>{
    const on=w[closetSlot]===id,have=owns(closetSlot,id);
    const [tc,tl]=tier(o.p);
    return `<button class="citem ${tc} ${id===cur?'sel':''} ${on?'worn':''}" data-id="${id}">${tl?`<i class="tier">${tl}</i>`:''}<span class="e">${o.e}</span><b>${esc(o.n)}</b><small>${on?'✅ Đang mặc':have?'Đã có':`💰 ${o.p}`}</small></button>`}).join('');
  const act=$('closetAct'),name=it?it.n:'Không mặc';
  const pet=PETS[w.pet],pn=OUTFIT.pet[w.pet].n;
  if(!tryOn||tryOn.slot!==closetSlot){act.innerHTML=`<span class="empty">${closetSlot==='fur'&&pet.fur?`${esc(pn)} có bộ lông riêng, bộ lông chỉ đổi màu cho Mèo, Cún và Thỏ.`:'Bấm vào món đồ để mặc thử 😺'}</span>`;return}
  if(w[closetSlot]===cur)act.innerHTML=`<span class="empty">${closetSlot==='pet'?'Bạn đang chơi bằng':`${esc(pn)} đang mặc`} ${esc(name)}</span>`;
  else if(owns(closetSlot,cur))act.innerHTML=`<button class="btn" data-act="wear">👕 Mặc ${esc(name)}</button>`;
  else act.innerHTML=`${tier(it.p)[1]?`<small class="tier-l">${tier(it.p)[1]}</small>`:''}<button class="btn" data-act="buy" ${st.rpg.gold<it.p?'disabled':''}>💰 Mua ${esc(name)} · ${it.p} vàng</button>${st.rpg.gold<it.p?`<small class="empty">Còn thiếu ${it.p-st.rpg.gold} vàng, đánh boss để kiếm thêm nhé!</small>`:''}`;
}
function wearItem(slot,id){st.closet.wear={...st.closet.wear,[slot]:id};st.closet.t=Date.now();save()}
// preview canvas: the cat in what it wears, plus the item being tried on
function closetLoop(){
  const cv=$('closetCv'),dpr=Math.min(2,window.devicePixelRatio||1),W=320,H=250;cv.width=W*dpr;cv.height=H*dpr;
  const c=cv.getContext('2d'),t0=performance.now();
  const frame=now=>{
    if(!$('closet').classList.contains('show'))return;
    const t=(now-t0)/1000,w={...wearing(),...(tryOn?{[tryOn.slot]:tryOn.id}:{})};
    c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
    const g=c.createRadialGradient(W/2,H*.7,10,W/2,H*.7,W*.6);g.addColorStop(0,'rgba(255,146,43,.28)');g.addColorStop(1,'rgba(255,146,43,0)');c.fillStyle=g;c.fillRect(0,0,W,H);
    ell(c,W/2,H-22,46,9,'rgba(15,23,42,.16)');
    c.save();c.translate(W/2-6,H-22);c.scale(1.18,1.18*(1+Math.sin(t*3)*.015));
    drawCat(c,{t,arm:-.25+Math.sin(t*3)*.06,casting:(t%5)>4.4,blink:(t%3.6)<.12},w);c.restore();
    requestAnimationFrame(frame)};
  requestAnimationFrame(frame);
}
$('closetTabs').onclick=e=>{const b=e.target.closest('[data-slot]');if(!b)return;closetSlot=b.dataset.slot;renderCloset()};
$('closetItems').onclick=e=>{const b=e.target.closest('[data-id]');if(!b)return;tryOn={slot:closetSlot,id:b.dataset.id};
  if(owns(closetSlot,tryOn.id)&&wearing()[closetSlot]!==tryOn.id){wearItem(closetSlot,tryOn.id);beep('ok')} // owned: wear right away
  renderCloset()};
$('closetAct').onclick=e=>{const b=e.target.closest('[data-act]');if(!b||b.disabled||!tryOn)return;const {slot,id}=tryOn,it=OUTFIT[slot][id];
  if(b.dataset.act==='buy'){if(st.rpg.gold<it.p)return;st.rpg.gold-=it.p;st.closet.own=[...st.closet.own,slot+':'+id];toast(`🎉 Đã mua ${it.e} ${it.n}!`);confetti(40);beep('badge')}
  wearItem(slot,id);renderCloset()};
$('closetBack').onclick=()=>{tryOn=null;if(closetBack==='home'){show('home');renderHome()}else openMap()};
$('closetBtn').onclick=()=>openCloset('map');
$('homeClosetBtn').onclick=()=>openCloset('home');
