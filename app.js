// --- utilities & storage ---
const $ = (sel) => document.querySelector(sel);
const el = (id) => document.getElementById(id);
const storeKey = 'revise:data:v1';

const DEFAULTS = {
  theme:'dark',
  dailyTarget:45,
  includeWeekends:false,
  rangeStart:'2025-09-01',
  rangeEnd:'2026-07-31',
  subjects:[
    {id:'maths',name:'Maths',color:'#22d3ee',enabled:true},
    {id:'science',name:'Science',color:'#22c55e',enabled:true},
    {id:'english',name:'English',color:'#f97316',enabled:true},
    {id:'geog',name:'Geog',color:'#a855f7',enabled:true},
    {id:'compsci',name:'Comp Sci',color:'#60a5fa',enabled:true},
    {id:'business',name:'Business',color:'#e11d48',enabled:true},
  ],
  sessions:[],
  keywords:['revise','revision','study','prepare','practice'],
  homework:[],
  examDates:[
    // JCQ placeholders + your board choices
    {subject_id:'maths',date:'2026-05-19',label:'Maths Paper 1 — JCQ'},
    {subject_id:'maths',date:'2026-06-03',label:'Maths Paper 2 — JCQ'},
    {subject_id:'maths',date:'2026-06-12',label:'Maths Paper 3 — JCQ'},
    {subject_id:'english',date:'2026-05-12',label:'English Lang P1 — JCQ'},
    {subject_id:'english',date:'2026-05-22',label:'English Lang P2 — JCQ'},
    {subject_id:'english',date:'2026-06-05',label:'English Lit P1 — JCQ'},
    {subject_id:'english',date:'2026-06-15',label:'English Lit P2 — JCQ'},
    {subject_id:'science',date:'2026-05-14',label:'Science P1 — JCQ'},
    {subject_id:'science',date:'2026-05-22',label:'Science P2 — JCQ'},
    {subject_id:'science',date:'2026-06-10',label:'Science P3 — JCQ'},
    // OCR Comp Sci + AQA Geog
    {subject_id:'compsci',date:'2026-05-13',label:'OCR Comp Sci P1'},
    {subject_id:'compsci',date:'2026-05-19',label:'OCR Comp Sci P2'},
    {subject_id:'geog',date:'2026-05-13',label:'AQA Geog P1'},
    {subject_id:'geog',date:'2026-06-03',label:'AQA Geog P2'},
    {subject_id:'geog',date:'2026-06-11',label:'AQA Geog P3'},
  ],
};

let DATA = JSON.parse(localStorage.getItem(storeKey) || 'null') || DEFAULTS;
const save = () => localStorage.setItem(storeKey, JSON.stringify(DATA));

// --- navigation ---
document.querySelectorAll('.tab').forEach(btn=>{
  btn.onclick = () => {
    document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('show'));
    document.getElementById(tab).classList.add('show');
    if(tab==='home') drawChart();
    if(tab==='history') refreshHistory();
  };
});

// --- subjects into selects ---
function fillSubjects(){
  const sel = el('subjectSelect'); const sel2 = el('subjectSelectFocus'); sel.innerHTML=''; sel2.innerHTML='';
  DATA.subjects.forEach(s => {
    const o = new Option(s.name, s.id); const o2 = new Option(s.name, s.id);
    sel.add(o); sel2.add(o2);
  });
}

// --- timer/session handling ---
let tickTimer=null, elapsed=0;
function formatTime(sec){ const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), s=sec%60; return [h,m,s].map(n=>String(n).padStart(2,'0')).join(':'); }
function startSession(subjectId){
  stopSession(); // close any open session
  DATA.sessions.push({start:new Date().toISOString(), end:null, subject_id:subjectId});
  save();
  elapsed=0; if(tickTimer) clearInterval(tickTimer);
  tickTimer=setInterval(()=>{ elapsed++; el('focusTime').textContent=formatTime(elapsed); updateRing(); el('streakLabel').textContent = 'Streak: ' + computeStreak() + ' 🔥'; },1000);
}
function pauseSession(){ stopSession(); }
function stopSession(){
  if(tickTimer){ clearInterval(tickTimer); tickTimer=null; }
  // close last running session
  for(let i=DATA.sessions.length-1;i>=0;i--){
    if(DATA.sessions[i].end==null){ DATA.sessions[i].end=new Date().toISOString(); break; }
  }
  save(); drawChart(); refreshHistory();
}
el('startBtn').onclick = ()=> startSession(el('subjectSelect').value);
el('pauseBtn').onclick = ()=> pauseSession();
el('stopBtn').onclick = ()=> stopSession();
el('focusStart').onclick = ()=> startSession(el('subjectSelectFocus').value);
el('focusPause').onclick = ()=> pauseSession();
el('focusStop').onclick = ()=> stopSession();

// Focus ring
function updateRing(){
  const goal = parseInt(el('sessionGoal').value||'0',10);
  el('focusSub').textContent = goal>0 ? `${Math.floor(elapsed/60)}/${goal} min` : 'No goal set';
  const C=314; // circumference
  const frac = goal>0 ? Math.min(1, (elapsed/60)/goal) : 0;
  $('.ring-fg').style.strokeDashoffset = String(C*(1-frac));
}

// --- streak calc ---
function computeStreak(){
  const includeWeekends = el('streakWeekends').checked || DATA.includeWeekends;
  const target = DATA.dailyTarget;
  const start = new Date(DATA.rangeStart); const end = new Date(DATA.rangeEnd);
  const per = minutesPerDay(start,end);
  let streak=0; for(let d=new Date(end); d>=start; d.setDate(d.getDate()-1)){
    if(!includeWeekends && (d.getDay()==0 || d.getDay()==6)) continue;
    const key=d.toISOString().slice(0,10); const mins = per[key] ? Object.values(per[key]).reduce((a,b)=>a+b,0) : 0;
    if(mins>=target) streak++; else break;
  }
  return streak;
}
el('streakWeekends').onchange = ()=> { save(); el('streakLabel').textContent = 'Streak: ' + computeStreak() + ' 🔥'; };

// --- minutes per day ---
function minutesPerDay(start, end){
  const out={};
  for(const s of DATA.sessions){
    const s1=new Date(s.start), s2=new Date(s.end || new Date());
    if(s2<s1) continue;
    for(let d=new Date(s1.toDateString()); d<=s2; d.setDate(d.getDate()+1)){
      const dayKey=d.toISOString().slice(0,10);
      const dayStart=new Date(dayKey+'T00:00:00'), dayEnd=new Date(dayKey+'T23:59:59');
      const segStart = new Date(Math.max(s1, dayStart));
      const segEnd   = new Date(Math.min(s2, dayEnd));
      const mins = Math.max(0, (segEnd - segStart)/60000);
      if(mins>0){ (out[dayKey] ||= {}); out[dayKey][s.subject_id] = (out[dayKey][s.subject_id]||0)+mins; }
    }
  }
  return out;
}

// --- chart ---
let chart;
function drawChart(){
  const ctx = el('chart').getContext('2d');
  if(chart){ chart.destroy(); }
  const start = new Date(DATA.rangeStart); const end = new Date(DATA.rangeEnd);
  const days=[]; for(let d=new Date(start); d<=end; d.setDate(d.getDate()+1)) days.push(d.toISOString().slice(0,10));
  const per=minutesPerDay(start,end);
  // per-subject cumulative hours
  const subjectDatasets = DATA.subjects.filter(s=>s.enabled).map(s=>{
    let total=0; const arr = days.map(day=>{ total += (per[day]?.[s.id]||0); return total/60; });
    return {label:s.name, data:arr, borderColor:s.color, pointRadius:0, tension:.25};
  });
  // total
  const totalArr = days.map((day,i)=> subjectDatasets.reduce((acc,ds)=> acc+(ds.data[i]||0),0));
  subjectDatasets.push({label:'Total (hrs)', data:totalArr, borderColor:'#cbd5e1', pointRadius:0, tension:.25, borderWidth:3});

  // markers (exams orange, homework purple)
  const annotations = [];
  for(const ex of DATA.examDates){
    const idx = days.indexOf(ex.date); if(idx>=0){ annotations.push({idx, color:'var(--orange)'}); }
  }
  for(const hw of DATA.homework){
    const kw = DATA.keywords.map(k=>k.toLowerCase());
    const text=(hw.title||'')+' '+(hw.description||'');
    if(kw.some(k => text.toLowerCase().includes(k))){
      const idx = days.indexOf(hw.due_date); if(idx>=0){ annotations.push({idx, color:'var(--purple)'}); }
    }
  }

  chart = new Chart(ctx, {
    type:'line',
    data:{ labels:days, datasets:subjectDatasets },
    options:{
      animation:{ duration: 900, easing:'easeOutCubic' },
      responsive:true, maintainAspectRatio:false,
      scales:{ y:{ beginAtZero:true, title:{display:true,text:'Cumulative hours'} } },
      plugins:{
        legend:{ labels:{ color:'#e9eef5' } },
      }
    }
  });

  // draw markers
  const scale = chart.scales.x;
  const ctx2 = chart.ctx;
  chart.options.animation.onComplete = () => {
    annotations.forEach(a=>{
      const x = scale.getPixelForValue(a.idx);
      ctx2.save();
      ctx2.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue(a.color? a.color : '--orange') || a.color;
      ctx2.setLineDash([6,6]);
      ctx2.beginPath(); ctx2.moveTo(x, chart.chartArea.top); ctx2.lineTo(x, chart.chartArea.bottom); ctx2.stroke(); ctx2.restore();
    });
  };
  chart.update();
}

// --- history ---
function refreshHistory(){
  const list = el('historyList'); list.innerHTML=''; let total=0;
  for(let i=DATA.sessions.length-1; i>=0; i--){
    const s=DATA.sessions[i]; if(!s.end){ continue; }
    const mins = Math.max(0, (new Date(s.end)-new Date(s.start))/60000); total+=mins;
    const li=document.createElement('li'); li.textContent=`${new Date(s.start).toLocaleString()} • ${s.subject_id} • ${Math.round(mins)} min`; list.appendChild(li);
  }
  el('historySummary').textContent = `Sessions: ${DATA.sessions.length} • Total: ${Math.round(total)} min (${Math.floor(total/60)}h ${Math.round(total%60)}m)`;
}

// --- settings bindings ---
function bindSettings(){
  el('dailyTarget').value = DATA.dailyTarget;
  el('includeWeekends').checked = DATA.includeWeekends;
  el('rangeStart').value = DATA.rangeStart;
  el('rangeEnd').value = DATA.rangeEnd;
  el('sessionGoal').value = DATA.dailyTarget;

  el('dailyTarget').onchange = ()=>{ DATA.dailyTarget=parseInt(el('dailyTarget').value,10)||45; save(); };
  el('includeWeekends').onchange = ()=>{ DATA.includeWeekends=el('includeWeekends').checked; save(); };
  el('rangeStart').onchange = ()=>{ DATA.rangeStart=el('rangeStart').value; save(); drawChart(); };
  el('rangeEnd').onchange = ()=>{ DATA.rangeEnd=el('rangeEnd').value; save(); drawChart(); };

  el('keywords').value = DATA.keywords.join(', ');
  el('keywords').onchange = ()=>{ DATA.keywords = el('keywords').value.split(',').map(s=>s.trim()).filter(Boolean); save(); drawChart(); };

  // exam CRUD
  const list = el('examList'); list.innerHTML='';
  function refreshExamList(){
    list.innerHTML='';
    DATA.examDates.sort((a,b)=>a.date.localeCompare(b.date));
    DATA.examDates.forEach((ex, idx)=>{
      const li=document.createElement('li');
      const btn=document.createElement('button'); btn.textContent='Delete'; btn.onclick=()=>{ DATA.examDates.splice(idx,1); save(); refreshExamList(); drawChart(); };
      li.textContent=`${ex.date} • ${ex.subject_id} • ${ex.label}`; li.appendChild(btn); list.appendChild(li);
    });
  }
  refreshExamList();
  const examSub = el('examSubject'); examSub.innerHTML=''; DATA.subjects.forEach(s=> examSub.add(new Option(s.name,s.id)));
  el('addExam').onclick = ()=>{
    const s=examSub.value, lbl=el('examLabel').value.trim(), d=el('examDate').value;
    if(!s||!lbl||!d) return;
    DATA.examDates.push({subject_id:s, date:d, label:lbl}); save(); refreshExamList(); drawChart(); el('examLabel').value='';
  };

  // homework import
  el('importHw').onclick = ()=>{
    try{
      const arr = JSON.parse(el('hwJson').value || '[]');
      if(!Array.isArray(arr)) throw new Error('JSON must be an array');
      DATA.homework = arr; save(); drawChart(); alert(`Imported ${arr.length} homework item(s).`);
    }catch(e){ alert('Invalid JSON: '+e.message); }
  };
}

// --- init ---
fillSubjects();
bindSettings();
drawChart();
refreshHistory();
el('streakLabel').textContent = 'Streak: ' + computeStreak() + ' 🔥';
