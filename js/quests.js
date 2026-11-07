// ---------- daily quests: 3 a day, the same on every device; gold is paid once when a quest is done ----------
// st.dq = {d: day, p: {quest: progress}, c: [quests paid]}; devices merge it per day (sync.js)
const QUESTS={
 answer:{e:'🎯',n:'Trả lời đúng 20 câu hỏi',goal:20,g:40},
 combo:{e:'🔥',n:'Đạt combo 8',goal:8,g:50,max:1}, // progress = best combo today
 round:{e:'🏁',n:'Hoàn thành 2 lượt chơi',goal:2,g:40},
 review:{e:'📅',n:'Ôn 15 thẻ (ôn tập hoặc flashcard)',goal:15,g:40},
 dict:{e:'🎧',n:'Viết đúng 10 từ ở Nghe & viết',goal:10,g:50},
 syn:{e:'🔁',n:'Đúng 8 câu Đồng nghĩa',goal:8,g:50},
 win:{e:'⚔️',n:'Thắng 1 trận đánh boss',goal:1,g:60}};
function todayQuests(){ // picked from the date, so every device shows the same three
  let h=0;for(const ch of dayKey())h=(h*31+ch.charCodeAt(0))>>>0;
  const k=Object.keys(QUESTS),out=[];while(out.length<3){h=(Math.imul(h,1103515245)+12345)>>>0;const q=k[(h>>>16)%k.length];if(!out.includes(q))out.push(q)}return out;
}
function questDay(){const d=dayKey();if(!st.dq||st.dq.d!==d)st.dq={d,p:{},c:[]};return st.dq}
// count progress on quest k (callers save afterwards)
function quest(k,v=1){
  const q=questDay(),Q=QUESTS[k];if(!todayQuests().includes(k)||q.c.includes(k))return;
  q.p[k]=Q.max?Math.max(q.p[k]||0,v):(q.p[k]||0)+v;
  if(q.p[k]>=Q.goal){q.c.push(k);addGold(Q.g);toast(`${Q.e} Xong nhiệm vụ: ${Q.n} · +${Q.g} 💰`);beep('badge')}
}
function renderQuests(){
  const q=questDay(),ks=todayQuests(),done=ks.filter(k=>q.c.includes(k)).length;
  $('questSub').textContent=`${done}/3 xong`;
  $('questBox').innerHTML=ks.map(k=>{const Q=QUESTS[k],v=Math.min(Q.goal,q.p[k]||0),ok=q.c.includes(k);
    return `<div class="quest ${ok?'done':''}"><span class="e">${Q.e}</span><div class="qt"><b>${esc(Q.n)}</b><div class="bar"><i style="width:${v/Q.goal*100}%"></i></div></div><span class="qg">${ok?'✅':`${v}/${Q.goal}`}<small>${ok?'Đã nhận':`+${Q.g} 💰`}</small></span></div>`}).join('');
}
