// ====== state & utils ======
const $ = q => document.querySelector(q);
const el = id => document.getElementById(id);
const KEY = 'revise:web:v2';
const DEFAULTS = {
  dailyTarget:45, includeWeekends:false,
  rangeStart:'2025-09-01', rangeEnd:'2026-07-31',
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
  proxyUrl:'',
  studentCode:'', studentDob:'',
  examDates:[
    {subject_id:'maths',date:'2026-05-19',label:'Maths P1 — JCQ'},
    {subject_id:'maths',date:'2026-06-03',label:'Maths P2 — JCQ'},
    {subject_id:'maths',date:'2026-06-12',label:'Maths P3 — JCQ'},
    {subject_id:'english',date:'2026-05-12',label:'English Lang P1 — JCQ'},
    {subject_id:'english',date:'2026-05-22',label:'English Lang P2 — JCQ'},
    {subject_id:'english',date:'2026-06-05',label:'English Lit P1 — JCQ'},
    {subject_id:'english',date:'2026-06-15',label:'English Lit P2 — JCQ'},
    {subject_id:'science',date:'2026-05-14',label:'Science P1 — JCQ'},
    {subject_id:'science',date:'2026-05-22',label:'Science P2 — JCQ'},
    {subject_id:'science',date:'2026-06-10',label:'Science P3 — JCQ'},
    {subject_id:'compsci',date:'2026-05-13',label:'OCR Comp Sci P1'},
    {subject_id:'compsci',date:'2026-05-19',label:'OCR Comp Sci P2'},
    {subject_id:'geog',date:'2026-05-13',label:'AQA Geog P1'},
    {subject_id:'geog',date:'2026-06-03',label:'AQA Geog P2'},
    {subject_id:'geog',date:'2026-06-11',label:'AQA Geog P3'},
  ],
};
let DATA = JSON.parse(localStorage.getItem(KEY) || 'null') || DEFAULTS;
const save = () => localStorage.setItem(KEY, JSON.stringify(DATA));
const fmt = s => String(s).padStart(2,'0');
const fmtTime = sec => `${fmt(Math.floor(sec/3600))}:${fmt(Math.floor((sec%3600)/60))}:${fmt(sec%60)}`;

// ====== nav ======
document.querySelectorAll('.nav-btn').forEach(b=> b.onclick = () => {
  document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active');
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('show')); el(b.dataset.tab).classList.add('show');
  if (b.dataset.tab==='home') drawChart();
  if (b.dataset.tab==='history') refreshHistory();
});

// ====== subjects ======
function fillSubjects(){
  const a = el('subjectSelect'), b = el('subjectSelectFocus');
  a.innerHTML = b.innerHTML = '';
  for(const s of DATA.subjects){ a.add(new Option(s.name,s.id)); b.add(new Option(s.name,s.id)); }
}

// ====== sessions/timer ======
let tick=null, elapsed=0;
function startSession(subjectId){
  stopSession();
  DATA.sessions.push({start:new Date().toISOString(), end:null, subject_id:subjectId});
  save(); elapsed=0;
  if (tick) clearInterval(tick);
  tick=setInterval(()=>{ elapsed++; el('focusTime').textContent=fmtTime(elapsed); updateRing(); el('streakLabel').textContent='Streak: '+computeStreak()+' 🔥'; },1000);
}
function pauseSession(){ stopSession(); }
function stopSession(){
  if (tick) { clearInterval(tick); tick=null; }
  for (let i=DATA.sessions.length-1;i>=0;i--) if(DATA.sessions[i].end==null){ DATA.sessions[i].end = new Date().toISOString(); break; }
  save(); drawChart(); refreshHistory(); renderToday();
}
el('startBtn').onclick = () => startSession(el('subjectSelect').value);
el('pauseBtn').onclick = () => pauseSession();
el('stopBtn').onclick = () => stopSession();
el('focusStart').onclick = () => startSession(el('subjectSelectFocus').value);
el('focusPause').onclick = () => pauseSession();
el('focusStop').onclick = () => stopSession();

// Focus ring
function updateRing(){
  const goal = parseInt(el('sessionGoal').value||'0',10);
  el('focusSub').textContent = goal>0 ? `${Math.floor(elapsed/60)}/${goal} min` : 'No goal set';
  const C=314, frac = goal>0 ? Math.min(1,(elapsed/60)/goal) : 0;
  document.querySelector('.ring-fg').style.strokeDashoffset = String(C*(1-frac));
}

// ====== streak calc ======
function minutesPerDay(start, end){
  const out={};
  for(const s of DATA.sessions){
    const s1=new Date(s.start), s2=new Date(s.end || new Date()); if(s2<s1) continue;
    for(let d=new Date(s1.toDateString()); d<=s2; d.setDate(d.getDate()+1)){
      const key=d.toISOString().slice(0,10);
      const dayStart=new Date(key+'T00:00:00'), dayEnd=new Date(key+'T23:59:59');
      const segStart = new Date(Math.max(s1, dayStart));
      const segEnd   = new Date(Math.min(s2, dayEnd));
      const mins = Math.max(0, (segEnd - segStart)/60000);
      if(mins>0){ (out[key] ||= {}); out[key][s.subject_id] = (out[key][s.subject_id]||0)+mins; }
    }
  }
  return out;
}
function computeStreak(){
  const includeW = el('streakWeekends').checked || DATA.includeWeekends;
  const target = DATA.dailyTarget;
  const start = new Date(DATA.rangeStart), end = new Date(DATA.rangeEnd);
  const per = minutesPerDay(start,end);
  let streak=0;
  for(let d=new Date(end); d>=start; d.setDate(d.getDate()-1)){
    if(!includeW && (d.getDay()==0||d.getDay()==6)) continue;
    const k=d.toISOString().slice(0,10);
    const mins = per[k] ? Object.values(per[k]).reduce((a,b)=>a+b,0) : 0;
    if(mins>=target) streak++; else break;
  }
  return streak;
}
el('streakWeekends').onchange = () => { save(); el('streakLabel').textContent='Streak: '+computeStreak()+' 🔥'; };

// ====== chart ======
let chart;
function drawChart(){
  const ctx = el('chart').getContext('2d');
  if(chart) chart.destroy();
  const start = new Date(DATA.rangeStart), end = new Date(DATA.rangeEnd);
  const days=[]; for(let d=new Date(start); d<=end; d.setDate(d.getDate()+1)) days.push(d.toISOString().slice(0,10));
  const per=minutesPerDay(start,end);

  const datasets = DATA.subjects.filter(s=>s.enabled).map(s=>{
    let total=0; const arr = days.map(day => { total+=(per[day]?.[s.id]||0); return total/60; });
    return {label:s.name, data:arr, borderColor:s.color, pointRadius:0, tension:.25, borderWidth:2};
  });
  const totalArr = days.map((_,i)=> datasets.reduce((acc,ds)=>acc+(ds.data[i]||0),0));
  datasets.push({label:'Total (hrs)', data:totalArr, borderColor:'#e5e7eb', pointRadius:0, tension:.25, borderWidth:3});

  chart = new Chart(ctx, {
    type:'line',
    data:{ labels:days, datasets },
    options:{
      animation:{ duration: 900, easing:'easeOutCubic' },
      maintainAspectRatio:false, responsive:true,
      scales:{
        x:{ ticks:{ color:'#c9d4e0', maxRotation:0, autoSkip:true, maxTicksLimit:10 } },
        y:{ beginAtZero:true, ticks:{ color:'#c9d4e0' }, title:{display:true, text:'Cumulative hours', color:'#c9d4e0'} }
      },
      plugins:{ legend:{ labels:{ color:'#e9eef5' } } }
    }
  });

  // markers
  chart.options.animation.onComplete = () => {
    const scale = chart.scales.x, ctx2 = chart.ctx;
    const addLines = (dates, cssVar) => {
      dates.forEach(d => {
        const idx = days.indexOf(d);
        if(idx>=0){
          const x = scale.getPixelForValue(idx);
          ctx2.save(); ctx2.setLineDash([6,6]);
          ctx2.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue(cssVar);
          ctx2.beginPath(); ctx2.moveTo(x, chart.chartArea.top); ctx2.lineTo(x, chart.chartArea.bottom); ctx2.stroke(); ctx2.restore();
        }
      });
    };
    addLines(DATA.examDates.map(e=>e.date), '--orange');
    const kw = DATA.keywords.map(k=>k.toLowerCase());
    const hwDates = DATA.homework.filter(h=>{
      const t=(h.title||'')+' '+(h.description||'');
      return kw.some(k => t.toLowerCase().includes(k));
    }).map(h=>h.due_date);
    addLines(hwDates, '--purple');
  };
  chart.update();
}

// ====== history & today ======
function refreshHistory(){
  const list = el('historyList'); list.innerHTML=''; let total=0, count=0;
  for(let i=DATA.sessions.length-1;i>=0;i--){
    const s=DATA.sessions[i]; if(!s.end) continue;
    const mins = Math.max(0, (new Date(s.end)-new Date(s.start))/60000); total+=mins; count++;
    const li=document.createElement('li'); li.textContent=`${new Date(s.start).toLocaleString()} • ${s.subject_id} • ${Math.round(mins)} min`; list.appendChild(li);
  }
  el('historySummary').textContent=`Sessions: ${count} • Total: ${Math.round(total)} min (${Math.floor(total/60)}h ${Math.round(total%60)}m)`;
}
function renderToday(){
  const list = el('todayList'); if(!list) return; list.innerHTML='';
  const today = new Date().toISOString().slice(0,10);
  const todays = DATA.sessions.filter(s => (s.end||'').slice(0,10)===today);
  if(!todays.length){ list.innerHTML='<li class="muted">No sessions yet today.</li>'; return; }
  todays.reverse().forEach(s=>{
    const mins = Math.max(0, (new Date(s.end)-new Date(s.start))/60000);
    const li=document.createElement('li'); li.textContent = `${new Date(s.start).toLocaleTimeString()} • ${s.subject_id} • ${Math.round(mins)} min`; list.appendChild(li);
  });
}

// ====== settings bind ======
function bindSettings(){
  el('dailyTarget').value = DATA.dailyTarget;
  el('includeWeekends').checked = DATA.includeWeekends;
  el('rangeStart').value = DATA.rangeStart; el('rangeEnd').value = DATA.rangeEnd;
  el('keywords').value = DATA.keywords.join(', ');
  el('proxyUrl').value = DATA.proxyUrl; el('studentCode').value = DATA.studentCode; el('studentDob').value = DATA.studentDob;

  el('dailyTarget').onchange = ()=>{ DATA.dailyTarget=+el('dailyTarget').value||45; save(); };
  el('includeWeekends').onchange = ()=>{ DATA.includeWeekends=el('includeWeekends').checked; save(); };
  el('rangeStart').onchange = ()=>{ DATA.rangeStart=el('rangeStart').value; save(); drawChart(); };
  el('rangeEnd').onchange = ()=>{ DATA.rangeEnd=el('rangeEnd').value; save(); drawChart(); };
  el('keywords').onchange = ()=>{ DATA.keywords = el('keywords').value.split(',').map(s=>s.trim()).filter(Boolean); save(); drawChart(); };

  // exam CRUD
  const list = el('examList');
  function refreshExamList(){
    list.innerHTML='';
    DATA.examDates.sort((a,b)=>a.date.localeCompare(b.date));
    DATA.examDates.forEach((ex,i)=>{
      const li=document.createElement('li');
      const del = document.createElement('button'); del.className='btn ghost'; del.textContent='Delete';
      del.onclick = ()=>{ DATA.examDates.splice(i,1); save(); refreshExamList(); drawChart(); };
      li.textContent = `${ex.date} • ${ex.subject_id} • ${ex.label}`; li.appendChild(del); list.appendChild(li);
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
    try{ const arr = JSON.parse(el('hwJson').value || '[]'); if(!Array.isArray(arr)) throw new Error('JSON must be an array');
      DATA.homework = arr; save(); drawChart(); alert(`Imported ${arr.length} homework item(s).`);
    }catch(e){ alert('Invalid JSON: '+e.message); }
  };

  // homework sync via proxy
  el('syncHw').onclick = async ()=>{
    DATA.proxyUrl = el('proxyUrl').value.trim();
    DATA.studentCode = el('studentCode').value.trim();
    DATA.studentDob = el('studentDob').value.trim();
    save();
    if(!DATA.proxyUrl || !DATA.studentCode || !/^\d{4}-\d{2}-\d{2}$/.test(DATA.studentDob)){
      alert('Set Proxy URL, Student Code, and DOB (YYYY-MM-DD).'); return;
    }
    try{
      const res = await fetch(DATA.proxyUrl+'/homework', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({code:DATA.studentCode, dob:DATA.studentDob})});
      if(!res.ok) throw new Error('Proxy error '+res.status);
      const items = await res.json();
      if(!Array.isArray(items)) throw new Error('Unexpected response');
      DATA.homework = items; save(); drawChart(); alert(`Synced ${items.length} homework item(s).`);
    }catch(e){ alert('Sync failed: '+e.message); }
  };
}

// ====== boot ======
function boot(){
  fillSubjects(); bindSettings(); drawChart(); refreshHistory(); renderToday();
  el('streakLabel').textContent = 'Streak: '+computeStreak()+' 🔥';
}
boot();
