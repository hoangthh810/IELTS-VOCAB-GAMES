// ---------- questions ----------
const Q_TIME=15; // seconds to answer each question (practice, review and boss battles)
const STOP=['the','and','with',"one's","someone's",'something','a','an'];
function colTokens(term){return term.split(' ').map((w,i)=>({w,i})).filter(o=>o.w.replace(/[^a-z-]/gi,'').length>2&&!STOP.includes(o.w.toLowerCase()))}
const canFill=x=>x.kind==='word'&&!!findMatch(x.ex,x.term), canCol=x=>x.kind==='col'&&x.term.includes(' ')&&colTokens(x.term).length>0;
// question types the pool can make (imported decks may lack examples or phrases)
const poolTypes=P=>['quiz',...(P.some(canFill)?['fill']:[]),...(P.some(canCol)?['col']:[])];
let poolOverride=null;
let qBase=null; // words to borrow distractors from; built-in words only in a challenge-able round (a friend has no copy of your decks)
const base=()=>qBase||ALL;
const canSyn=x=>x.kind==='word'&&!!synOf(x.term);
const pool=()=>poolOverride||(useWrong?Object.keys(st.wrong).map(id=>BYID[id]).filter(Boolean):ALL.filter(x=>sel.has(x.ti)));
function choose(list,used,fallback){
  let c=list.filter(x=>!used.has(x.id)); if(!c.length)c=list; // small pools (imported decks) repeat instead of borrowing other topics
  if(!c.length)c=fallback.filter(x=>!used.has(x.id)); if(!c.length)c=fallback;
  return pick(c);
}
function makeQuiz(used){
  const P=pool(), it=choose(P,used,base()); const enToVi=qrnd()<.6;
  const same=(isDeck(it.ti)?[...shuffle(P),...shuffle(base())]:shuffle([...P,...shuffle(base())])).filter(x=>x.kind===it.kind&&x.id!==it.id); // imported decks: distractors from the deck first
  const ds=[]; for(const x of same){const v=enToVi?x.mean:x.term; const cur=enToVi?it.mean:it.term;
    if(v!==cur&&!ds.includes(v))ds.push(v); if(ds.length===3)break}
  const ans=enToVi?it.mean:it.term;
  return {type:'quiz',it,label:enToVi?'🎯 Nghĩa tiếng Việt là gì?':'🎯 Từ tiếng Anh nào?',
    main:enToVi?esc(it.term)+spk(it.term):esc(it.mean),sub:(enToVi?ipaTag(it):'')+(it.pos?` (${it.pos})`:(it.kind==='col'?' collocation':'')),hint:'',
    options:shuffle([ans,...ds]),answer:ans};
}
function makeFill(used){
  const P=pool().filter(canFill), F=base().filter(canFill);
  const it=choose(P,used,F); const m=findMatch(it.ex,it.term);
  const sent=esc(it.ex.slice(0,m.i))+'<span class="blank">&nbsp;</span>'+esc(it.ex.slice(m.i+m.t.length));
  return {type:'fill',it,label:'✍️ Điền từ còn thiếu',main:sent,sentence:true,sub:'Nghĩa: '+esc(it.mean),
    hint:`Gợi ý: bắt đầu bằng “${esc(m.t[0].toLowerCase())}”, gồm ${m.t.length} ký tự`,answer:m.t};
}
function makeCol(used){
  const P=pool().filter(canCol), F=base().filter(canCol); const it=choose(P,used,F);
  const tok=pick(colTokens(it.term)); const words=it.term.split(' ');
  const shown=words.map((w,i)=>i===tok.i?'<span class="blank">&nbsp;</span>':esc(w)).join(' ');
  const inPhrase=new Set(words.map(w=>w.toLowerCase()));
  const ds=[];for(const x of shuffle(F)){for(const o of colTokens(x.term)){const w=o.w.toLowerCase();
    if(!inPhrase.has(w)&&!ds.includes(w)&&w!==tok.w.toLowerCase())ds.push(w)} if(ds.length>=3)break}
  return {type:'col',it,label:'🧩 Hoàn thành collocation',main:shown,sub:'Nghĩa: '+esc(it.mean),hint:'',
    options:shuffle([tok.w.toLowerCase(),...ds.slice(0,3)]),answer:tok.w.toLowerCase()};
}
function makeSyn(used){ // pick the synonym; distractors are synonyms of other words, same part of speech first
  const P=pool().filter(canSyn),F=base().filter(canSyn),it=choose(P,used,F),mine=synOf(it.term),ans=pick(mine),ds=[];
  for(const x of shuffle([...P,...F]).sort((a,b)=>(b.pos===it.pos)-(a.pos===it.pos))){if(x.term===it.term)continue;
    const w=pick(synOf(x.term));if(!mine.includes(w)&&!ds.includes(w))ds.push(w);if(ds.length===3)break}
  return {type:'syn',it,label:'🔁 Từ / cụm nào đồng nghĩa?',main:esc(it.term)+spk(it.term),sub:ipaTag(it)+(it.pos?` (${esc(it.pos)})`:''),hint:'',
    options:shuffle([ans,...ds]),answer:ans};
}
