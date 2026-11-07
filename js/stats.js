// ---------- stats screen: totals, XP per day (st.xl), study calendar, progress per topic, most-missed words ----------
function dayGains(){ // {day: XP gained that day}; the first entry is only a baseline
  const ks=Object.keys(st.xl||{}).sort(),g={};ks.forEach((d,i)=>{if(i)g[d]=Math.max(0,st.xl[d]-st.xl[ks[i-1]])});return g;
}
const dayAgo=n=>{const d=new Date();d.setDate(d.getDate()-n);return d};
function renderStats(){
  const g=dayGains(),s=srsStats(),days=Object.values(g).filter(v=>v>0).length,lv=Math.floor(st.xp/300)+1;
  const tiles=[['⭐',st.xp,'tổng XP'],['🏅',lv,'level'],['🔥',liveStreak(),'chuỗi ngày'],['📆',days,'ngày đã học'],
    ['📚',s.known,'từ đã thuộc'],['📖',s.learning,'từ đang học'],['⚔️',`${Object.keys(st.rpg.cleared).length}/${LAST+1}`,'màn đã thắng'],['🏆',`${st.badges.length}/${BADGES.length}`,'huy hiệu']];
  $('stTiles').innerHTML=tiles.map(([e,v,n])=>`<div class="stat"><b>${e} ${v}</b><small>${n}</small></div>`).join('');
  // last 14 days
  const last=Array.from({length:14},(_,i)=>{const d=dayAgo(13-i);return{d,k:dayKey(d),v:g[dayKey(d)]||0}}),mx=Math.max(50,...last.map(x=>x.v));
  const wk=last.slice(7).reduce((a,x)=>a+x.v,0);
  $('stWeek').textContent=`7 ngày qua: ${wk} XP · tuần này (từ thứ Hai): ${weekXp()} XP`;
  $('stBars').innerHTML=last.map(x=>`<div class="sb ${x.k===dayKey()?'today':''}" title="${x.k}: ${x.v} XP"><span>${x.v||''}</span><i style="height:${x.v/mx*100}%"></i><small>${x.d.getDate()}</small></div>`).join('');
  // calendar: 18 weeks, columns start on Monday
  const W=18,start=dayAgo(((new Date().getDay()+6)%7)+(W-1)*7),lvl=v=>!v?0:v<50?1:v<150?2:v<300?3:4;let cells='';
  for(let i=0;i<W*7;i++){const d=new Date(start);d.setDate(start.getDate()+i);const k=dayKey(d),v=g[k]||0;
    cells+=d>new Date()?'<i class="fut"></i>':`<i class="l${lvl(v)}" title="${k}: ${v} XP"></i>`}
  $('stCal').innerHTML=cells;
  // per topic: learned (box 5+) and learning
  $('stTopics').innerHTML=topicKeys().map(k=>{const its=ALL.filter(x=>x.ti===k),n=its.length;if(!n)return'';
    let kn=0,le=0;for(const x of its){const r=st.srs[x.id];if(r)r.b>=5?kn++:le++}
    return `<div class="tp"><div class="row"><span>${esc(topicName(k))}</span><small>${kn} thuộc · ${le} đang học / ${n}</small></div><div class="bar2"><i class="k" style="width:${kn/n*100}%"></i><i class="l" style="width:${le/n*100}%"></i></div></div>`}).join('');
  const top=wrongIds().sort((a,b)=>st.wrong[b]-st.wrong[a]).slice(0,10);
  $('stWrong').innerHTML=top.length?top.map(id=>{const it=BYID[id];return `<div class="it"><span class="cnt">${st.wrong[id]}×</span> ${termHtml(it)}: ${esc(it.mean)}</div>`}).join(''):'<p class="empty">Chưa có từ nào sai, giỏi quá! 🐱</p>';
}
$('statsBtn').onclick=()=>{renderStats();show('stats')};
$('statsBack').onclick=()=>{show('home');renderHome()};
