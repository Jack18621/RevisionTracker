const $ = (sel) => document.querySelector(sel);

const state = { manifest:null, paper:null, topic:null, subtopic:null, mode:"MCQ", questions:[], i:0 };

function shuffle(arr){ const a=arr.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }
function toast(msg){ let t=document.querySelector(".toast"); if(!t){ t=document.createElement("div"); t.className="toast"; document.body.appendChild(t);} t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"), 1200); }
function confetti(){ const mount=document.createElement("div"); mount.className="confetti"; document.body.appendChild(mount);
  const colors=["#22c55e","#16a34a","#4ade80","#60a5fa","#a78bfa","#f472b6","#f59e0b"];
  for(let k=0;k<22;k++){ const i=document.createElement("i"); const startX=Math.random()*100; const endX=(Math.random()*200-100)+"vw"; i.style.background=colors[Math.floor(Math.random()*colors.length)]; i.style.left=startX+"vw"; i.style.top="-5vh"; i.style.setProperty("--x", endX); mount.appendChild(i); setTimeout(()=>i.remove(), 1400); }
  setTimeout(()=>mount.remove(), 1500);
}
function ripple(){ document.body.addEventListener("pointerdown",(e)=>{ const btn=e.target.closest(".btn"); if(!btn) return; const r=btn.getBoundingClientRect(); const x=((e.clientX-r.left)/r.width)*100; const y=((e.clientY-r.top)/r.height)*100; btn.style.setProperty("--rx",x+"%"); btn.style.setProperty("--ry",y+"%"); }); }
function observeReveal(){ const io=new IntersectionObserver((es)=>es.forEach(e=>{ if(e.isIntersecting) e.target.classList.add("in"); }),{threshold:.1}); document.querySelectorAll(".card").forEach(c=>{ c.classList.add("reveal"); io.observe(c); }); }

async function loadManifest(){
  const res=await fetch("./config/manifest.json"); state.manifest=await res.json();
  populatePapers(); observeReveal(); ripple();
}
function populatePapers(){ const s=$("#paperSel"); s.innerHTML=state.manifest.papers.map(p=>`<option value="${p.id}">${p.name}</option>`).join(""); s.onchange=()=>{ state.paper=s.value; populateTopics(); }; state.paper=state.manifest.papers[0]?.id||null; populateTopics(); }
function populateTopics(){ const topics=state.manifest.papers.find(p=>p.id===state.paper)?.topics||[]; const s=$("#topicSel"); s.innerHTML=topics.map(t=>`<option value="${t.id}">${t.name}</option>`).join(""); s.onchange=()=>{ state.topic=s.value; populateSubtopics(); }; state.topic=topics[0]?.id||null; populateSubtopics(); }
function populateSubtopics(){ const paper=state.manifest.papers.find(p=>p.id===state.paper); const topic=paper?.topics.find(t=>t.id===state.topic); const subs=topic?.subtopics||[]; const s=$("#subtopicSel"); s.innerHTML=subs.map(u=>`<option value="${u.id}">${u.name}</option>`).join(""); s.onchange=()=>state.subtopic=s.value; state.subtopic=subs[0]?.id||null; }

async function startSession(){
  state.mode=$("#modeSel").value;
  const paper=state.manifest.papers.find(p=>p.id===state.paper);
  const topic=paper.topics.find(t=>t.id===state.topic);
  const sub=topic.subtopics.find(s=>s.id===state.subtopic);
  const res=await fetch(sub.path); const json=await res.json(); const all=json.modes[state.mode]||[];
  state.questions=all.map(q=>{
    if(state.mode==="MCQ"){ const opts=q.options.map((o,i)=>({text:o,i})); const sh=shuffle(opts); const ci=sh.findIndex(o=>o.i===q.correctIndex); return {...q, options:sh.map(o=>o.text), correctIndex:ci}; }
    if(state.mode==="MATCH"){ const left=shuffle(q.pairs.map(p=>p[0])); const right=shuffle(q.pairs.map(p=>p[1])); return {...q,left,right,mapping:Object.fromEntries(q.pairs)}; }
    return q;
  });
  state.i=0; $("#playCard").classList.remove("hidden"); render(); toast("Session started");
}
function progress(){ const pct=((state.i+1)/Math.max(1,state.questions.length))*100; const bar=document.querySelector(".progress > b"); if(bar) bar.style.width=pct+"%"; }
function setupSwipe(node){ let sx=0, sy=0, moved=false; node.addEventListener("touchstart",(e)=>{const t=e.touches[0]; sx=t.clientX; sy=t.clientY; moved=false;},{passive:true}); node.addEventListener("touchmove",()=>{moved=true;},{passive:true}); node.addEventListener("touchend",(e)=>{ if(!moved) return; const t=e.changedTouches[0]; const dx=t.clientX-sx; const dy=t.clientY-sy; if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>40){ if(dx<0 && state.i<state.questions.length-1){ state.i++; render(); toast("Next"); } if(dx>0 && state.i>0){ state.i--; render(); toast("Prev"); } } }); }

function render(){
  const q=state.questions[state.i]; const meta=$("#questionMeta"); meta.innerHTML=`<span class="badge">${state.mode}</span> &nbsp; Q ${state.i+1} / ${state.questions.length}`;
  const body=$("#questionBody"); const ctrls=$("#controls"); const ex=$("#explain"); ex.classList.add("hidden"); ex.textContent=q.explanation||""; body.innerHTML=""; ctrls.innerHTML=""; progress(); setupSwipe(body);

  if(state.mode==="MCQ"){
    body.insertAdjacentHTML("beforeend", `<h3>${q.prompt}</h3>`);
    const list=document.createElement("div"); list.className="options";
    q.options.forEach((opt,idx)=>{ const btn=document.createElement("button"); btn.className="option"; btn.textContent=opt; btn.onclick=()=>{ if(btn.classList.contains("correct")||btn.classList.contains("wrong")) return; const ok=idx===q.correctIndex; btn.classList.add(ok?\"correct\":\"wrong\"); if(!ok){ list.children[q.correctIndex].classList.add(\"correct\"); } ex.classList.remove(\"hidden\"); if(ok) confetti(); }; list.appendChild(btn); });
    body.appendChild(list);
    const onKey=(e)=>{ const n=parseInt(e.key,10); if(!isNaN(n)&&n>=1&&n<=q.options.length){ list.children[n-1].click(); }};
    window.addEventListener(\"keydown\", onKey, { once:true });
  }
  if(state.mode==="TF"){
    body.insertAdjacentHTML(\"beforeend\", `<h3>${q.prompt}</h3>`);
    const list=document.createElement(\"div\"); list.className=\"options\";
    [\"True\",\"False\"].forEach((label,idx)=>{ const b=document.createElement(\"button\"); b.className=\"option\"; b.textContent=label; b.onclick=()=>{ if(b.classList.contains(\"correct\")||b.classList.contains(\"wrong\")) return; const chosen=(idx===0); const ok=chosen===q.answer; b.classList.add(ok?\"correct\":\"wrong\"); if(!ok){ list.children[q.answer?0:1].classList.add(\"correct\"); } else { confetti(); } ex.classList.remove(\"hidden\"); }; list.appendChild(b); });
    body.appendChild(list);
    const onKey=(e)=>{ if(e.key.toLowerCase()===\"t\") list.children[0].click(); if(e.key.toLowerCase()===\"f\") list.children[1].click(); };
    window.addEventListener(\"keydown\", onKey, { once:true });
  }
  if(state.mode==="SHORT"){
    body.insertAdjacentHTML(\"beforeend\", `<h3>${q.prompt}</h3>`);
    const input=document.createElement(\"input\"); input.type=\"text\"; input.placeholder=\"Type your answer…\"; ctrls.appendChild(input);
    const submit=document.createElement(\"button\"); submit.className=\"btn primary\"; submit.textContent=\"Check\"; ctrls.appendChild(submit);
    const check=()=>{ const ans=(input.value||\"\").trim().toLowerCase(); const ok=(q.acceptable||[]).some(a=>ans===a.toLowerCase()); input.style.boxShadow= ok?\"0 0 0 10px #22c55e33\":\"0 0 0 10px #ef444433\"; input.style.borderColor= ok?\"var(--success)\":\"var(--danger)\"; if(ok) confetti(); ex.classList.remove(\"hidden\"); };
    submit.onclick=check; input.addEventListener(\"keydown\", (e)=>{ if(e.key===\"Enter\") check(); });
  }
  if(state.mode==="FILL"){
    const parts=q.text.split(/\\{\\{(.*?)\\}\\}/g); const inputs=[]; const line=document.createElement(\"div\"); line.style.margin=\"8px 0\"; line.style.lineHeight=\"2.2\";
    for(let i=0;i<parts.length;i++){ if(i%2===0){ const s=document.createElement(\"span\"); s.textContent=parts[i]; line.appendChild(s);} else { const inp=document.createElement(\"input\"); inp.type=\"text\"; inp.placeholder=parts[i]; inp.style.width=\"180px\"; inp.style.margin=\"0 6px\"; inputs.push(inp); line.appendChild(inp);} }
    body.appendChild(line);
    const submit=document.createElement(\"button\"); submit.className=\"btn primary\"; submit.textContent=\"Check\"; ctrls.appendChild(submit);
    submit.onclick=()=>{ let allOk=true; inputs.forEach((inp,idx)=>{ const acc=(q.answers[idx]||[]).map(s=>s.toLowerCase()); const val=(inp.value||\"\").trim().toLowerCase(); const ok=acc.includes(val); allOk=allOk&&ok; inp.style.boxShadow= ok?\"0 0 0 10px #22c55e33\":\"0 0 0 10px #ef444433\"; inp.style.borderColor= ok?\"var(--success)\":\"var(--danger)\"; }); if(allOk) confetti(); ex.classList.remove(\"hidden\"); };
  }
  if(state.mode==="MATCH"){
    body.insertAdjacentHTML(\"beforeend\", `<h3>Match the pairs</h3><p class=\"q-meta\">${q.explanation||\"\"}</p>`);
    const grid=document.createElement(\"div\"); grid.className=\"match-grid\"; const left=document.createElement(\"div\"); left.className=\"match-col\"; const right=document.createElement(\"div\"); right.className=\"match-col\";
    q.left.forEach(item=>{ const z=document.createElement(\"div\"); z.className=\"dropzone\"; z.dataset.key=item; z.textContent=item; left.appendChild(z); });
    q.right.forEach(def=>{ const chip=document.createElement(\"div\"); chip.className=\"chip draggable\"; chip.draggable=true; chip.textContent=def; chip.addEventListener(\"dragstart\",(e)=>{ chip.classList.add(\"dragging\"); e.dataTransfer.setData(\"text/plain\", def);}); chip.addEventListener(\"dragend\",()=>chip.classList.remove(\"dragging\")); right.appendChild(chip); });
    grid.appendChild(left); grid.appendChild(right); body.appendChild(grid);
    left.querySelectorAll(\".dropzone\").forEach(zone=>{ zone.addEventListener(\"dragover\",(e)=>e.preventDefault()); zone.addEventListener(\"drop\",(e)=>{ e.preventDefault(); const def=e.dataTransfer.getData(\"text/plain\"); zone.textContent=zone.dataset.key+\" — \"+def; zone.dataset.choice=def; zone.style.background=\"#fff\"; }); });
    const submit=document.createElement(\"button\"); submit.className=\"btn primary\"; submit.textContent=\"Check\"; ctrls.appendChild(submit);
    submit.onclick=()=>{ let score=0; left.querySelectorAll(\".dropzone\").forEach(z=>{ const ok=q.mapping[z.dataset.key]===z.dataset.choice; z.style.boxShadow= ok?\"0 0 0 10px #22c55e33\":\"0 0 0 10px #ef444433\"; z.style.borderColor= ok?\"var(--success)\":\"var(--danger)\"; if(ok) score++; }); ex.classList.remove(\"hidden\"); ex.textContent=(q.explanation||\"\")+`  —  Score: ${score}/${q.left.length}`; if(score===q.left.length) confetti(); };
  }

  // nav
  $("#prevBtn").disabled = state.i===0;
  $("#nextBtn").disabled = state.i>=state.questions.length-1;
  $("#nextBtn").onclick = ()=>{ if(state.i<state.questions.length-1){ state.i++; render(); } };
  $("#prevBtn").onclick = ()=>{ if(state.i>0){ state.i--; render(); } };
}
$("#startBtn").addEventListener("click", startSession);
loadManifest();
// gradient layer
if(!document.querySelector(".canvas-gradient")){ const g=document.createElement("div"); g.className="canvas-gradient"; document.body.appendChild(g); }
