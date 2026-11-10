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
  else act.innerHTML=`${tier(it.p)[1]?`<small class="tier-l">${tier(it.p)[1]}</small>`:''}<button class="btn" data-act="buy" ${st.rpg.gold<it.p?'disabled':''}>💰 Mua ${esc(name)} · ${it.p} vàng</button>${st.rpg.gold<it.p?`<small class="empty">Còn thiếu ${it.p-st.rpg.gold} vàng, đánh boss hoặc làm 🎯 nhiệm vụ hằng ngày để kiếm thêm nhé!</small>`:''}`;
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
  if(b.dataset.act==='buy'){if(st.rpg.gold<it.p)return;addGold(-it.p);st.closet.own=[...st.closet.own,slot+':'+id];toast(`🎉 Đã mua ${it.e} ${it.n}!`);confetti(40);beep('badge')}
  wearItem(slot,id);renderCloset()};
$('closetBack').onclick=()=>{tryOn=null;if(closetBack==='home'){show('home');renderHome()}else openMap()};
$('closetBtn').onclick=()=>openCloset('map');
$('homeClosetBtn').onclick=()=>openCloset('home');

// ---------- pet cat on the home screen: happier the more you study today, treats bought with gold add a heart ----------
// st.pet = {d: day, fed: treats given that day}. Mood hearts = today's XP level + treats (max 5); cat level = days studied.
const TREAT_P=20,TREAT_MAX=3;
const petDay=()=>{const d=dayKey();if(!st.pet||st.pet.d!==d)st.pet={d,fed:0};return st.pet};
const PET_MOOD=[['😿','Đói meo','Meo… cả ngày chưa học gì, mèo đói quá!'],['🐱','Hơi buồn','Học thêm chút nữa cho mèo vui nhé.'],['🐱','Bình thường','Mèo thấy ổn, học thêm để mèo vui hơn!'],
  ['😺','Vui vẻ','Hôm nay học chăm ghê, mèo vui lắm!'],['😸','Rất vui','Bạn giỏi quá, mèo muốn nhảy múa!'],['😻','Hạnh phúc','Mèo hạnh phúc tột đỉnh, band 9.0 tới nơi rồi!']];
const PET_LV=['Mèo con','Mèo nhỏ','Mèo tinh nghịch','Mèo học giả','Mèo thông thái','Mèo IELTS 9.0'];
function petState(){
  const x=dayGains()[dayKey()]||0,base=x>=200?4:x>=100?3:x>=50?2:x>0?1:0,h=Math.min(5,base+petDay().fed);
  const days=Object.values(dayGains()).filter(v=>v>0).length,lv=Math.floor(days/5);
  return{h,lv:lv+1,title:PET_LV[Math.min(lv,PET_LV.length-1)],next:5-days%5};
}
function renderPet(){
  const s=petState(),m=PET_MOOD[s.h],fed=petDay().fed,name=OUTFIT.pet[wearing().pet].n;
  $('petInfo').innerHTML=`<b>${m[0]} ${esc(name)} · ${m[1]}</b><div class="hearts" aria-label="${s.h}/5 tim">${'❤️'.repeat(s.h)}${'🤍'.repeat(5-s.h)}</div>
    <small>“${m[2]}”</small><small class="plv">🏅 Cấp ${s.lv} · ${s.title} · thêm ${s.next} ngày học để lên cấp</small>
    <div class="srs-btns"><button class="btn" data-pet="feed" ${fed>=TREAT_MAX||st.rpg.gold<TREAT_P?'disabled':''}>🐟 Cho ăn ${TREAT_P} 💰 (${fed}/${TREAT_MAX})</button><button class="btn ghost" data-pet="closet">🎀 Thay đồ</button></div>`;
  petLoop();
}
let petRun=false,petJump=0;
function petLoop(){
  if(petRun)return;petRun=true;
  const cv=$('petCv'),dpr=Math.min(2,window.devicePixelRatio||1),W=150,H=150;cv.width=W*dpr;cv.height=H*dpr;
  const c=cv.getContext('2d'),t0=performance.now();
  const frame=now=>{
    if(!$('home').classList.contains('show')){petRun=false;return}
    const t=(now-t0)/1000,h=petState().h,happy=h>=3,j=Math.max(0,petJump-now)/600;
    c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
    ell(c,W/2,H-12,34,7,'rgba(15,23,42,.14)');
    c.save();c.translate(W/2-4,H-12-(happy?Math.abs(Math.sin(t*4))*6:0)-Math.sin(j*Math.PI)*24);c.scale(.82,.82*(1+Math.sin(t*(h?3:1.5))*.015));
    drawCat(c,{t,arm:happy?-.9+Math.sin(t*6)*.3:-.25,casting:happy?(t%2)>1.2:j>0,blink:!h||(t%3.6)<.12},wearing());c.restore();
    if(!h){c.font='16px sans-serif';c.fillText('💤',W/2+22,34-(t%2)*6)}
    requestAnimationFrame(frame)};
  requestAnimationFrame(frame);
}
$('petBox').onclick=e=>{const b=e.target.closest('[data-pet]');if(!b||b.disabled)return;
  if(b.dataset.pet==='closet')return openCloset('home');
  const p=petDay();if(p.fed>=TREAT_MAX||st.rpg.gold<TREAT_P)return;
  addGold(-TREAT_P);p.fed++;save();beep('ok');petJump=performance.now()+600;plus('❤️',b);toast('🐟 Mèo ăn ngon lành, thêm 1 tim!');renderPet()};
