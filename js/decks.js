// ---------- custom decks (imported vocabulary) ----------
// st.decks[did] = {n: name, t: last change (ms, newest wins when merging), items: [[term, mean, ex, ipa, pos], ...]}
// or {del: 1, t} once deleted (kept so another device's copy is not merged back). Items are only appended, never removed,
// because item ids are 'u<did>.<index>' (st.srs / st.wrong use them). Topic key (it.ti) of a deck is 'u<did>'.
const CORE_N=ALL.length; // built-in items come first in ALL, deck items after them
const DECK_MAX=2000, ST_MAX=900000; // items across all decks; max size of the saved progress in bytes (rules allow 950000 chars, a Firestore doc max 1 MiB)
const isDeck=ti=>typeof ti==='string';
const liveDecks=()=>Object.entries(st.decks).filter(([,d])=>!d.del).sort((a,b)=>a[1].n.localeCompare(b[1].n,'vi'));
const topicKeys=()=>[...DATA.map((_,i)=>i),...liveDecks().map(([k])=>'u'+k)];
const topicName=ti=>isDeck(ti)?'📁 '+((st.decks[ti.slice(1)]||{}).n||'Bộ từ'):DATA[ti].name;
const deckCount=()=>liveDecks().reduce((n,[,d])=>n+d.items.length,0);
function loadDecks(){
  ALL.slice(CORE_N).forEach(x=>delete BYID[x.id]);ALL.length=CORE_N;
  for(const [k,d] of liveDecks())d.items.forEach((w,i)=>{const ti='u'+k,term=w[0],col=term.includes(' ');
    const x={id:ti+'.'+i,ti,kind:col?'col':'word',term,pos:col?'':w[4]||'',mean:w[1],ex:w[2]||'',ipa:col?'':w[3]||''};ALL.push(x);BYID[x.id]=x});
}
loadDecks();

// ---------- parsing pasted text / files ----------
const VN=/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const POS=/^\(?(n|v|adj|adv|prep|conj|pron|phr|phrase|idiom|noun|verb|adjective|adverb|n\.|v\.|adj\.|adv\.)(\s*[\/,]\s*(n|v|adj|adv)\.?)*\)?$/i;
function csvRow(line,sep){ // one line, quotes allowed ("a, b" and "" for a quote)
  const r=[];let cur='',q=false;
  for(let i=0;i<line.length;i++){const ch=line[i];
    if(q){if(ch==='"'){if(line[i+1]==='"'){cur+='"';i++}else q=false}else cur+=ch}
    else if(ch==='"'&&!cur.trim())q=true;else if(line.startsWith(sep,i)){r.push(cur);cur='';i+=sep.length-1}else cur+=ch}
  r.push(cur);return r.map(s=>s.trim());
}
function guessSep(lines){
  const score=s=>lines.filter(l=>csvRow(l,s).filter(Boolean).length>=2).length;
  let best='\t',n=-1;for(const s of ['\t','|',';',',',' - ',' : ',':','='])if(score(s)>n){n=score(s);best=s}
  return best;
}
// -> {rows: [[term, mean, ex, ipa, pos]], bad: [line numbers], dup: count}
function parseDeck(text,sep,have=new Set()){
  const lines=text.replace(/^﻿/,'').split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!/^```/.test(l)); // also drops code fences copied from a chatbot
  if(!sep||sep==='auto')sep=guessSep(lines.slice(0,50));
  let rows=(sep==='|'?lines.filter(l=>!/^[\s|:-]+$/.test(l)).map(l=>l.replace(/^\||\|$/g,'')):lines).map(l=>csvRow(l,sep)); // | also reads markdown tables
  const HEAD=/^(term|terms|word|words|english|vocabulary|vocab|meaning|definition|vietnamese|từ|từ vựng|tiếng anh|tiếng việt|nghĩa)$/i;
  if(rows.length&&(HEAD.test(rows[0][0])||HEAD.test(rows[0][1]||'')))rows.shift(); // header row
  // Vietnamese first? (most "terms" have Vietnamese letters, most "meanings" don't) -> swap
  const vn=rows.filter(r=>VN.test(r[0])&&r[1]&&!VN.test(r[1])).length;if(vn>rows.length/2)rows=rows.map(r=>[r[1],r[0],...r.slice(2)]);
  const out=[],bad=[],seen=new Set(have);let dup=0;
  rows.forEach((r,j)=>{
    const term=(r[0]||'').replace(/\s+/g,' ').slice(0,60),mean=(r[1]||'').replace(/\s+/g,' ').slice(0,80);
    if(!term||!mean||!/[a-z]/i.test(term)){bad.push(j+1);return}
    const k=term.toLowerCase();if(seen.has(k)){dup++;return}seen.add(k);
    let ex='',ipa='',pos='';
    for(const v of r.slice(2)){if(!v)continue;
      if(!ipa&&/^[\/\[].*[\/\]]/.test(v))ipa=v.slice(0,50);else if(!pos&&POS.test(v))pos=v.replace(/[()]/g,'').slice(0,12);else if(!ex)ex=v.slice(0,200)}
    out.push([term,mean,ex,ipa,pos]);
  });
  return{rows:out,bad,dup,sep};
}
async function readText(file){ // UTF-8, or Windows-1258 (Excel "CSV" on Vietnamese Windows)
  const buf=await file.arrayBuffer();
  try{return new TextDecoder('utf-8',{fatal:true}).decode(buf)}catch(e){return new TextDecoder('windows-1258').decode(buf)}
}
function download(name,text,type='text/csv'){
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+text],{type:type+';charset=utf-8'}));
  a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
}
const csvCell=s=>/[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
const toCsv=items=>['term,meaning,example,ipa,pos',...items.map(w=>[0,1,2,3,4].map(j=>csvCell(w[j]||'')).join(','))].join('\r\n');
const SAMPLE=[["mitigate","giảm nhẹ","Governments must act to mitigate the effects of climate change.","/ˈmɪtɪɡeɪt/","v"],
  ["sustainable","bền vững","Cycling is a sustainable way to travel.","/səˈsteɪnəbl/","adj"],
  ["take into account","cân nhắc, tính đến","Planners should take into account the needs of elderly people.","",""]];

// ---------- deck screen ----------
let imp=null; // parsed import waiting to be saved
function openDecks(){show('decks');renderDecks()}
function renderDecks(){
  const ds=liveDecks();
  $('deckList').innerHTML=ds.length?ds.map(([k,d])=>{const w=d.items.filter(x=>!x[0].includes(' ')).length;
    return `<div class="deck" data-d="${k}"><div class="deck-h"><div><b>📁 ${esc(d.n)}</b><small>${w} từ đơn · ${d.items.length-w} cụm từ</small></div>
      <button class="btn" data-a="fight">⚔️ Đấu</button></div>
      <div class="deck-acts"><button class="chip" data-a="study">🎯 Luyện tập</button><button class="chip" data-a="add">➕ Thêm từ</button><button class="chip" data-a="view">👁️ Xem</button><button class="chip" data-a="rename">✏️ Đổi tên</button><button class="chip" data-a="csv">⬇️ Tải về</button><button class="chip" data-a="del">🗑️ Xoá</button></div>
      <ol class="deck-items" hidden></ol></div>`}).join('')
    :'<div class="empty">Chưa có bộ từ nào. Nhập bộ đầu tiên ở bên dưới nhé 👇</div>';
  $('impTo').innerHTML='<option value="">➕ Bộ mới</option>'+ds.map(([k,d])=>`<option value="${k}">Thêm vào: ${esc(d.n)}</option>`).join('');
  $('impName').hidden=!!$('impTo').value;$('deckUsed').textContent=`Đã dùng ${deckCount()}/${DECK_MAX} từ`;
  previewImport();
}
function previewImport(){
  const to=$('impTo').value,d=to&&st.decks[to];
  imp=$('impText').value.trim()?parseDeck($('impText').value,$('impSep').value,new Set(d?d.items.map(w=>w[0].toLowerCase()):[])):null;
  const p=$('impPrev');$('impSave').disabled=!imp||!imp.rows.length;$('impCancel').hidden=!$('impText').value.trim()&&!$('impName').value.trim();
  if(!imp){p.innerHTML='';return}
  const sepName={'\t':'Tab','|':'dấu |',';':'dấu chấm phẩy',',':'dấu phẩy',' - ':'gạch ngang',' : ':'dấu hai chấm',':':'dấu hai chấm','=':'dấu bằng'}[imp.sep];
  p.innerHTML=`<p class="empty">✅ <b>${imp.rows.length}</b> từ hợp lệ${imp.dup?` · ${imp.dup} từ trùng (bỏ qua)`:''}${imp.bad.length?` · ⚠️ ${imp.bad.length} dòng lỗi, thiếu từ hoặc nghĩa (dòng ${imp.bad.slice(0,8).join(', ')}${imp.bad.length>8?'…':''})`:''} · Ngăn cách bằng ${sepName}</p>`+
    (imp.rows.length?`<div class="tbl"><table><tr><th>Từ</th><th>Nghĩa</th><th>Ví dụ</th><th>Phiên âm</th></tr>${imp.rows.slice(0,8).map(r=>`<tr><td><b>${esc(r[0])}</b>${r[4]?` <small>(${esc(r[4])})</small>`:''}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join('')}</table></div>${imp.rows.length>8?`<p class="empty">… và ${imp.rows.length-8} từ nữa</p>`:''}`:'');
}
function saveImport(){
  if(!imp||!imp.rows.length)return;
  const to=$('impTo').value,name=$('impName').value.trim().replace(/\s+/g,' ').slice(0,40);
  if(!to&&!name){toast('Đặt tên cho bộ từ nhé');$('impName').focus();return}
  if(deckCount()+imp.rows.length>DECK_MAX){toast(`Tối đa ${DECK_MAX} từ cho tất cả bộ từ, còn trống ${DECK_MAX-deckCount()} từ`);return}
  const prev=JSON.stringify(st.decks),did=to||Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  const d=st.decks[did]||{n:name,items:[]};st.decks[did]={n:d.n,t:Date.now(),items:[...d.items,...imp.rows]};
  if(new TextEncoder().encode(JSON.stringify(st)).length>ST_MAX){st.decks=JSON.parse(prev);toast('Bộ từ quá lớn để đồng bộ, hãy bớt câu ví dụ dài hoặc chia nhỏ');return}
  if(!to){sel.add('u'+did);st.topics=[...sel]}
  loadDecks();save();toast(`📁 Đã lưu ${imp.rows.length} từ vào "${st.decks[did].n}"`);beep('ok');
  clearImport();
}
function clearImport(){$('impText').value='';$('impFile').value='';$('impName').value='';$('impTo').value='';renderDecks()}
function deleteDeck(k){
  const ti='u'+k;st.decks[k]={del:1,t:Date.now()};
  for(const o of [st.srs,st.wrong])Object.keys(o).forEach(id=>{if(id.startsWith(ti+'.'))delete o[id]});
  sel.delete(ti);st.topics=[...sel];loadDecks();save();renderDecks();
}
$('deckBtn').onclick=openDecks;
$('decksBack').onclick=()=>{show('home');renderHome()};
let impT;$('impText').oninput=()=>{clearTimeout(impT);impT=setTimeout(previewImport,250)};
$('impSep').onchange=$('impTo').onchange=()=>{$('impName').hidden=!!$('impTo').value;previewImport()};
$('impFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;
  if(/\.xlsx?$/i.test(f.name)){toast('Hãy lưu file Excel thành CSV UTF-8, hoặc copy bảng rồi dán vào ô bên dưới');e.target.value='';return}
  $('impText').value=await readText(f);if(!$('impTo').value&&!$('impName').value)$('impName').value=f.name.replace(/\.[^.]+$/,'').slice(0,40);previewImport()};
$('impSave').onclick=saveImport;
$('impCancel').onclick=clearImport;
$('impName').oninput=()=>{$('impCancel').hidden=!$('impText').value.trim()&&!$('impName').value.trim()};
// prompt for ChatGPT/Gemini/Claude: turns any notes or worksheet into lines this importer reads
const AI_PROMPT=`Hãy chuyển tài liệu từ vựng tôi gửi kèm (file hoặc đoạn văn bản bên dưới) thành danh sách để nhập vào app học từ vựng IELTS, theo đúng định dạng sau:

- Mỗi dòng một từ hoặc cụm từ, 4 cột ngăn cách bằng dấu |
  từ tiếng Anh | nghĩa tiếng Việt ngắn gọn | một câu ví dụ tiếng Anh có chứa đúng từ đó | phiên âm IPA Anh-Anh dạng /.../
- Cột 1 chỉ ghi từ hoặc cụm từ cần học (không ghi cả câu, không đánh số, không ghi từ loại).
- Phiên âm chỉ ghi cho từ đơn; với cụm từ để trống cột này.
- Nếu tài liệu là bài tập điền vào chỗ trống, hãy lấy đáp án làm từ cần học và dùng câu đã điền đáp án làm câu ví dụ.
- Nếu tài liệu chưa có nghĩa tiếng Việt hoặc câu ví dụ, hãy tự bổ sung cho chính xác, tự nhiên.
- Bỏ các từ trùng lặp. Không thêm dòng tiêu đề, không giải thích gì thêm.
- Trả toàn bộ kết quả trong MỘT khối code để tôi copy.

Ví dụ:
mitigate | giảm nhẹ | Governments must act to mitigate the effects of climate change. | /ˈmɪtɪɡeɪt/
extended family | đại gia đình | My extended family gets together every Lunar New Year. |`;
$('aiPrompt').textContent=AI_PROMPT;
$('aiCopy').onclick=()=>{
  const ok=()=>toast('📋 Đã copy prompt, dán vào ChatGPT / Gemini / Claude kèm file của bạn nhé!');
  (navigator.clipboard?navigator.clipboard.writeText(AI_PROMPT):Promise.reject()).then(ok,()=>{
    const r=document.createRange();r.selectNodeContents($('aiPrompt'));const s=getSelection();s.removeAllRanges();s.addRange(r);
    try{document.execCommand('copy');ok()}catch(e){toast('Hãy bôi đen đoạn prompt rồi copy nhé')}});
};
$('impSample').onclick=()=>download('mau-bo-tu-vung.csv',toCsv(SAMPLE));
$('deckList').onclick=e=>{
  const b=e.target.closest('[data-a]'),box=e.target.closest('.deck');if(!b||!box)return;
  const k=box.dataset.d,d=st.decks[k],a=b.dataset.a;
  if(a==='fight')startArena(k);
  else if(a==='study'){useWrong=false;sel=new Set(['u'+k]);st.topics=[...sel];save();show('home');renderHome();$('modes').scrollIntoView({behavior:'smooth'});toast(`Đã chọn "${d.n}", chọn trò chơi nhé!`)}
  else if(a==='add'){$('impTo').value=k;$('impName').hidden=true;previewImport();$('impText').focus()}
  else if(a==='view'){const ol=box.querySelector('.deck-items');ol.hidden=!ol.hidden;
    if(!ol.hidden)ol.innerHTML=d.items.map((w,i)=>`<li><span class="n">${i+1}</span><span class="t" lang="en"><b>${esc(w[0])}</b>${w[3]?`<small class="ipa">${esc(w[3])}</small>`:''}</span><span class="m">${esc(w[1])}</span>${spk(w[0])}</li>`).join('')}
  else if(a==='rename'){const n=(prompt('Tên mới cho bộ từ:',d.n)||'').trim().replace(/\s+/g,' ').slice(0,40);if(n){d.n=n;d.t=Date.now();save();renderDecks()}}
  else if(a==='csv')download(d.n.replace(/[\\\/:*?"<>|]/g,'_')+'.csv',toCsv(d.items));
  else if(a==='del'&&confirm(`Xoá bộ "${d.n}"? Lịch ôn và từ hay sai của bộ này cũng bị xoá.`))deleteDeck(k);
};
