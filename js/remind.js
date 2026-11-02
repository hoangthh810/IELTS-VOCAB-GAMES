// ---------- daily study reminder in the user's own calendar ----------
// Google Calendar "add event" link or a downloadable .ics (iPhone, Outlook...). Both repeat daily; no server needed.
const REMIND_KEY='ielts-vocab-arena-remind'; // chosen time 'HH:MM', a per-device preference
const APP_URL=/^https?:$/.test(location.protocol)?location.origin+'/':'https://ielts-vocab-b4905.web.app/';
const R_TITLE='📚 Ôn từ vựng IELTS · Vocab Arena';
const R_DESC=`Mở app và làm "Ôn tập ngắt quãng" khoảng 10–15 phút: ${APP_URL}`;
const p2=n=>String(n).padStart(2,'0');
const calTime=d=>`${d.getFullYear()}${p2(d.getMonth()+1)}${p2(d.getDate())}T${p2(d.getHours())}${p2(d.getMinutes())}00`; // local time
function remindStart(hhmm){const [h,m]=hhmm.split(':').map(Number),d=new Date();d.setHours(h,m,0,0);if(d<=new Date())d.setDate(d.getDate()+1);return d}
function gcalUrl(hhmm){
  const s=remindStart(hhmm),e=new Date(s.getTime()+15*6e4);
  return 'https://calendar.google.com/calendar/render?'+new URLSearchParams({action:'TEMPLATE',text:R_TITLE,details:R_DESC,
    dates:calTime(s)+'/'+calTime(e),ctz:Intl.DateTimeFormat().resolvedOptions().timeZone,recur:'RRULE:FREQ=DAILY'});
}
// RFC 5545: escape text, fold lines at 75 bytes, CRLF line endings
const icsText=s=>s.replace(/[\\;,]/g,m=>'\\'+m).replace(/\n/g,'\\n');
function icsFold(line){const enc=new TextEncoder();let out='',cur='',n=0;
  for(const ch of line){const b=enc.encode(ch).length;if(n+b>73){out+=cur+'\r\n ';cur='';n=1}cur+=ch;n+=b}return out+cur}
function icsFile(hhmm){
  const s=remindStart(hhmm),now=new Date();
  const stamp=`${now.getUTCFullYear()}${p2(now.getUTCMonth()+1)}${p2(now.getUTCDate())}T${p2(now.getUTCHours())}${p2(now.getUTCMinutes())}${p2(now.getUTCSeconds())}Z`;
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Vocab Arena//VI','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
    `UID:vocab-arena-daily-${Date.now()}@ielts-vocab-b4905.web.app`,`DTSTAMP:${stamp}`,`DTSTART:${calTime(s)}`,'DURATION:PT15M','RRULE:FREQ=DAILY',
    `SUMMARY:${icsText(R_TITLE)}`,`DESCRIPTION:${icsText(R_DESC)}`,`URL:${APP_URL}`,
    'BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${icsText('Đến giờ ôn từ vựng IELTS rồi!')}`,'TRIGGER:-PT0M','END:VALARM','END:VEVENT','END:VCALENDAR']
    .map(icsFold).join('\r\n')+'\r\n';
}
function remindTime(){let t=null;try{t=localStorage.getItem(REMIND_KEY)}catch(e){}return /^\d\d:\d\d$/.test(t||'')?t:'20:00'}
function renderRemind(){const t=remindTime();$('remindTime').value=t;$('gcalLink').href=gcalUrl(t)}
$('remindBtn').onclick=()=>{const box=$('remindBox');box.hidden=!box.hidden;if(!box.hidden)renderRemind()};
$('remindTime').onchange=()=>{const t=$('remindTime').value;if(!/^\d\d:\d\d$/.test(t))return;try{localStorage.setItem(REMIND_KEY,t)}catch(e){}$('gcalLink').href=gcalUrl(t)};
$('gcalLink').onclick=()=>{$('gcalLink').href=gcalUrl($('remindTime').value||remindTime());toast('Bấm "Lưu" trong Google Calendar để tạo lời nhắc 📆')};
$('icsBtn').onclick=()=>{
  const url=URL.createObjectURL(new Blob([icsFile($('remindTime').value||remindTime())],{type:'text/calendar;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='vocab-arena-nhac-hoc.ics';document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Mở file vừa tải để thêm vào lịch 📆');
};
