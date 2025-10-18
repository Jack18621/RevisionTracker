(function () {
  // ---------- helpers ----------
  function $(s) { return document.querySelector(s); }
  function $all(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  var state = {
    manifest: null,
    paper: null, topic: null, subtopic: null,
    mode: "QUIZ",        // QUIZ | DEFINE | EXAM
    questions: [], i: 0,
  };

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function toast(msg) {
    var t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(function () { t.classList.remove("show"); }, 1200);
  }
  function failDropdowns(msg) {
    ["paperSel", "topicSel", "subtopicSel"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = '<option disabled selected>' + msg + '</option>';
    });
  }

  // ---------- very light "routing" (pages) ----------
  function showHome() {
    $(".hero").classList.remove("hidden");
    $(".filters").classList.remove("hidden");
    $("#playCard").classList.add("hidden");
    ensureSettings(false);
    window.scrollTo(0, 0);
  }
  function showPlay() {
    $(".hero").classList.add("hidden");
    $(".filters").classList.add("hidden");
    $("#playCard").classList.remove("hidden");
    ensureSettings(false);
    window.scrollTo(0, 0);
  }
  function ensureSettings(show) {
    var id = "settingsPage";
    var node = document.getElementById(id);
    if (!node) {
      node = document.createElement("section");
      node.id = id;
      node.className = "card hidden";
      node.innerHTML =
        '<h2 style="margin-top:0">Settings</h2>' +
        '<div style="display:grid;gap:12px;max-width:680px">' +
        ' <label><input id="sfxToggle" type="checkbox"/> Enable sound effects</label>' +
        ' <label><input id="shuffleToggle" type="checkbox" checked/> Shuffle questions</label>' +
        ' <label>Questions per session: <input id="qCount" type="number" min="1" step="1" value="20" style="width:100px;margin-left:8px"></label>' +
        ' <button id="closeSettings" class="btn">Close</button>' +
        '</div>';
      $(".container").insertBefore(node, $(".how"));
      node.querySelector("#closeSettings").addEventListener("click", function(){ ensureSettings(false); showHome(); });
    }
    node.classList.toggle("hidden", !show);
    $(".hero").classList.toggle("hidden", show);
    $(".filters").classList.toggle("hidden", show);
    $("#playCard").classList.add("hidden");
  }

  // ---------- load manifest + populate dropdowns ----------
  async function loadManifest() {
    try {
      var res = await fetch("./config/manifest.json");
      if (!res.ok) throw new Error("HTTP " + res.status);
      state.manifest = await res.json();
      populatePapers();
    } catch (err) {
      console.error("Failed to load manifest.json:", err);
      var isFile = location.protocol === "file:";
      failDropdowns(isFile ? "Open via local server" : "manifest.json not found");
      toast(isFile ? "Run a local server (file:// blocks fetch)" : "Could not load manifest.json");
    }

    // Replace Mode options with the 3 new modes
    var modeSel = $("#modeSel");
    if (modeSel) {
      modeSel.innerHTML = ''
        + '<option value="QUIZ">Quiz</option>'
        + '<option value="DEFINE">Define</option>'
        + '<option value="EXAM">Exam</option>';
    }
  }

  // Group papers by subject (e.g. "Biology — Higher Paper 1" -> subject "Biology", label "Paper 1")
function groupPapersBySubject(papers){
  var groups = {}; // { subject: [{id, label, full}] }
  papers.forEach(function(p){
    var name = p.name || "";
    var parts = name.split("—");                // e.g. ["Biology ", " Higher Paper 1"]
    var subject = (parts[0] || "").trim() || "Other";

    // Everything after the first "—"
    var rest = parts.slice(1).join("—").trim(); // e.g. "Higher Paper 1"

    // Try to extract "Paper X" as the visible label
    var m = rest.match(/paper\s*\d+/i);
    var label = m ? m[0].replace(/\s+/g," ") : (rest || name); // "Paper 1" or fallback
    label = label.charAt(0).toUpperCase() + label.slice(1);    // capitalize P

    if(!groups[subject]) groups[subject] = [];
    groups[subject].push({ id: p.id, label: label, full: name });
  });

  // keep each subject's papers ordered by paper number if present
  Object.keys(groups).forEach(function(subj){
    groups[subj].sort(function(a,b){
      var na = (a.label.match(/\d+/)||[0])[0]*1;
      var nb = (b.label.match(/\d+/)||[0])[0]*1;
      return na - nb;
    });
  });

  return groups;
}

function populatePapers(){
  if (!state.manifest || !Array.isArray(state.manifest.papers) || !state.manifest.papers.length){
    failDropdowns("No papers in manifest");
    return;
  }

  var sel = $("#paperSel");
  var groups = groupPapersBySubject(state.manifest.papers);

  // Build <optgroup>…<option>… HTML
  var html = Object.keys(groups).sort().map(function(subject){
    var options = groups[subject].map(function(it){
      return '<option value="'+it.id+'">'+it.label+'</option>';
    }).join("");
    return '<optgroup label="'+subject+'">'+options+'</optgroup>';
  }).join("");

  sel.innerHTML = html;

  // Select first available option
  var first = sel.querySelector("option");
  state.paper = first ? first.value : null;

  sel.onchange = function(){
    state.paper = sel.value;
    populateTopics();
  };

  populateTopics();
}

  function populateTopics() {
    var paper = (state.manifest.papers || []).find(function (p) { return p.id === state.paper; }) || {};
    var topics = paper.topics || [];
    var sel = $("#topicSel");
    if (!topics.length) {
      sel.innerHTML = '<option disabled selected>No topics</option>';
      $("#subtopicSel").innerHTML = '<option disabled selected>No subtopics</option>';
      return;
    }
    sel.innerHTML = topics.map(function (t) { return '<option value="' + t.id + '">' + t.name + '</option>'; }).join("");
    sel.onchange = function () { state.topic = sel.value; populateSubtopics(); };
    state.topic = (topics[0] || {}).id || null;
    populateSubtopics();
  }
  function populateSubtopics() {
    var paper = (state.manifest.papers || []).find(function (p) { return p.id === state.paper; }) || {};
    var topic = (paper.topics || []).find(function (t) { return t.id === state.topic; }) || {};
    var subs = topic.subtopics || [];
    var sel = $("#subtopicSel");
    if (!subs.length) { sel.innerHTML = '<option disabled selected>No subtopics</option>'; return; }
    sel.innerHTML = subs.map(function (s) { return '<option value="' + s.id + '">' + s.name + '</option>'; }).join("");
    sel.onchange = function () { state.subtopic = sel.value; };
    state.subtopic = (subs[0] || {}).id || null;
  }

  // ---------- session (Quiz / Define / Exam) ----------
  function buildQuizQuestions(json) {
    var modes = json.modes || {};
    var out = [];

    // MCQ
    (modes.MCQ || []).forEach(function (q) {
      var opts = q.options.map(function (o, i) { return { text: o, i: i }; });
      var sh = shuffle(opts);
      var ci = sh.findIndex(function (o) { return o.i === q.correctIndex; });
      out.push({ type: "MCQ", prompt: q.prompt, options: sh.map(function (o) { return o.text; }), correctIndex: ci, explanation: q.explanation || "" });
    });
    // TF
    (modes.TF || []).forEach(function (q) {
      out.push({ type: "TF", prompt: q.prompt, answer: !!q.answer, explanation: q.explanation || "" });
    });
    // SHORT
    (modes.SHORT || []).forEach(function (q) {
      out.push({ type: "SHORT", prompt: q.prompt, acceptable: q.acceptable || [], explanation: q.explanation || "" });
    });
    // FILL
    (modes.FILL || []).forEach(function (q) {
      out.push({ type: "FILL", text: q.text, answers: q.answers || [], explanation: q.explanation || "" });
    });
    // MATCH
    (modes.MATCH || []).forEach(function (q) {
      var left = shuffle((q.pairs || []).map(function (p) { return p[0]; }));
      var right = shuffle((q.pairs || []).map(function (p) { return p[1]; }));
      var mapping = {}; (q.pairs || []).forEach(function (p) { mapping[p[0]] = p[1]; });
      out.push({ type: "MATCH", left: left, right: right, mapping: mapping, explanation: q.explanation || "" });
    });

    return out;
  }

  function buildDefineQuestions(json) {
    var modes = json.modes || {};
    var list = [];
    if (Array.isArray(modes.DEFINE) && modes.DEFINE.length) {
      modes.DEFINE.forEach(function (q) {
        list.push({ term: q.term, acceptable: q.acceptable || [], explanation: q.explanation || "" });
      });
    } else {
      // Fallback: use SHORT prompts as "term"
      (modes.SHORT || []).forEach(function (q) {
        list.push({ term: q.prompt, acceptable: q.acceptable || [], explanation: q.explanation || "" });
      });
    }
    return list;
  }

  function buildExamQuestions(json) {
    var modes = json.modes || {};
    var ex = Array.isArray(modes.EXAM) ? modes.EXAM : [];
    // expected item: { text, marks: 1|2|3|4|6|9, image? }
    return ex.map(function (q) {
      return { text: q.text, marks: q.marks || 1, image: q.image || null, number: q.number || null, explanation: q.explanation || "" };
    });
  }

  function startSession() {
    state.mode = $("#modeSel").value; // QUIZ | DEFINE | EXAM
    var paper = state.manifest.papers.find(function (p) { return p.id === state.paper; });
    var topic = paper.topics.find(function (t) { return t.id === state.topic; });
    var sub = topic.subtopics.find(function (s) { return s.id === state.subtopic; });

    fetch(sub.path).then(function (r) { return r.json(); }).then(function (json) {
      if (state.mode === "QUIZ") {
        state.questions = buildQuizQuestions(json);
      } else if (state.mode === "DEFINE") {
        state.questions = buildDefineQuestions(json);
      } else { // EXAM
        state.questions = buildExamQuestions(json);
      }
      state.i = 0;
      if (!state.questions.length) { toast("No questions for this mode"); return; }
      showPlay();
      render();
      toast("Session started");
    }).catch(function (e) {
      console.error("Failed to load questions.json:", e);
      toast("Could not load questions for this subtopic");
    });
  }

  function setProgress() {
    var pct = ((state.i + 1) / Math.max(1, state.questions.length)) * 100;
    var b = $("#pbar"); if (b) b.style.width = pct + "%";
  }
  function setupSwipe(node) {
    var sx = 0, sy = 0, moved = false;
    node.addEventListener("touchstart", function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; moved = false; }, { passive: true });
    node.addEventListener("touchmove", function () { moved = true; }, { passive: true });
    node.addEventListener("touchend", function (e) {
      if (!moved) return;
      var t = e.changedTouches[0]; var dx = t.clientX - sx; var dy = t.clientY - sy;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx < 0 && state.i < state.questions.length - 1) { state.i++; render(); toast("Next"); }
        if (dx > 0 && state.i > 0) { state.i--; render(); toast("Prev"); }
      }
    });
  }

  // ---------- renderers ----------
  function render() {
    var body = $("#questionBody");
    var ctrls = $("#controls");
    var ex = $("#explain");
    body.innerHTML = ""; ctrls.innerHTML = ""; ex.classList.add("hidden"); ex.textContent = "";
    setProgress(); setupSwipe(body);

    if (state.mode === "QUIZ") {
      renderQuizQuestion(body, ctrls, ex);
    } else if (state.mode === "DEFINE") {
      renderDefine(body, ctrls, ex);
    } else {
      renderExam(body, ctrls, ex);
    }

    $("#prevBtn").disabled = (state.i === 0);
    $("#nextBtn").disabled = (state.i >= state.questions.length - 1);
    $("#nextBtn").onclick = function () { if (state.i < state.questions.length - 1) { state.i++; render(); } };
    $("#prevBtn").onclick = function () { if (state.i > 0) { state.i--; render(); } };

    var meta = $("#questionMeta");
    meta.textContent = state.mode + " • Q " + (state.i + 1) + "/" + state.questions.length;
  }

  function renderQuizQuestion(body, ctrls, ex) {
    var q = state.questions[state.i];
    if (q.type === "MCQ") {
      var h = document.createElement("h3"); h.textContent = q.prompt; body.appendChild(h);
      var list = document.createElement("div"); list.className = "options";
      q.options.forEach(function (opt, idx) {
        var btn = document.createElement("button"); btn.className = "option"; btn.textContent = opt;
        btn.onclick = function () {
          if (btn.classList.contains("correct") || btn.classList.contains("wrong")) return;
          var ok = (idx === q.correctIndex);
          btn.classList.add(ok ? "correct" : "wrong");
          if (!ok) { list.children[q.correctIndex].classList.add("correct"); }
          ex.textContent = q.explanation || ""; ex.classList.remove("hidden");
        };
        list.appendChild(btn);
      });
      body.appendChild(list);
      return;
    }
    if (q.type === "TF") {
      var h2 = document.createElement("h3"); h2.textContent = q.prompt; body.appendChild(h2);
      var list2 = document.createElement("div"); list2.className = "options";
      ["True", "False"].forEach(function (label, idx) {
        var b = document.createElement("button"); b.className = "option"; b.textContent = label;
        b.onclick = function () {
          if (b.classList.contains("correct") || b.classList.contains("wrong")) return;
          var chosen = (idx === 0); var ok = (chosen === q.answer);
          b.classList.add(ok ? "correct" : "wrong");
          if (!ok) { list2.children[q.answer ? 0 : 1].classList.add("correct"); }
          ex.textContent = q.explanation || ""; ex.classList.remove("hidden");
        };
        list2.appendChild(b);
      });
      body.appendChild(list2);
      return;
    }
    if (q.type === "SHORT") {
      var h3 = document.createElement("h3"); h3.textContent = q.prompt; body.appendChild(h3);
      var input = document.createElement("input"); input.type = "text"; input.placeholder = "Type your answer…"; ctrls.appendChild(input);
      var submit = document.createElement("button"); submit.className = "btn primary"; submit.textContent = "Check"; ctrls.appendChild(submit);
      var check = function () {
        var ans = (input.value || "").trim().toLowerCase();
        var ok = (q.acceptable || []).some(function (a) { return ans === a.toLowerCase(); });
        input.style.boxShadow = ok ? "0 0 0 10px #22c55e33" : "0 0 0 10px #ef444433";
        input.style.borderColor = ok ? "var(--success)" : "var(--danger)";
        ex.textContent = q.explanation || ""; ex.classList.remove("hidden");
      };
      submit.onclick = check;
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") check(); });
      return;
    }
    if (q.type === "FILL") {
      var parts = q.text.split(/\{\{(.*?)\}\}/g);
      var inputs = []; var line = document.createElement("div"); line.style.margin = "8px 0"; line.style.lineHeight = "2.2";
      for (var i = 0; i < parts.length; i++) {
        if (i % 2 === 0) { var span = document.createElement("span"); span.textContent = parts[i]; line.appendChild(span); }
        else { var inp = document.createElement("input"); inp.type = "text"; inp.placeholder = parts[i]; inp.style.width = "180px"; inp.style.margin = "0 6px"; inputs.push(inp); line.appendChild(inp); }
      }
      body.appendChild(line);
      var btnC = document.createElement("button"); btnC.className = "btn primary"; btnC.textContent = "Check"; ctrls.appendChild(btnC);
      btnC.onclick = function () {
        inputs.forEach(function (inp, idx) {
          var acc = (q.answers[idx] || []).map(function (s) { return s.toLowerCase(); });
          var val = (inp.value || "").trim().toLowerCase();
          var ok = acc.indexOf(val) !== -1;
          inp.style.boxShadow = ok ? "0 0 0 10px #22c55e33" : "0 0 0 10px #ef444433";
          inp.style.borderColor = ok ? "var(--success)" : "var(--danger)";
        });
        ex.textContent = q.explanation || ""; ex.classList.remove("hidden");
      };
      return;
    }
    if (q.type === "MATCH") {
      var h4 = document.createElement("h3"); h4.textContent = "Match the pairs"; body.appendChild(h4);
      var grid = document.createElement("div"); grid.className = "match-grid";
      var left = document.createElement("div"); left.className = "match-col";
      var right = document.createElement("div"); right.className = "match-col";
      q.left.forEach(function (item) {
        var zone = document.createElement("div"); zone.className = "dropzone"; zone.dataset.key = item; zone.textContent = item; left.appendChild(zone);
      });
      q.right.forEach(function (def) {
        var chip = document.createElement("div"); chip.className = "chip draggable"; chip.draggable = true; chip.textContent = def;
        chip.addEventListener("dragstart", function (e) { chip.classList.add("dragging"); e.dataTransfer.setData("text/plain", def); });
        chip.addEventListener("dragend", function () { chip.classList.remove("dragging"); });
        right.appendChild(chip);
      });
      grid.appendChild(left); grid.appendChild(right); body.appendChild(grid);
      left.querySelectorAll(".dropzone").forEach(function (zone) {
        zone.addEventListener("dragover", function (e) { e.preventDefault(); });
        zone.addEventListener("drop", function (e) {
          e.preventDefault();
          var def = e.dataTransfer.getData("text/plain");
          zone.textContent = zone.dataset.key + " — " + def;
          zone.dataset.choice = def;
        });
      });
      var checkBtn = document.createElement("button"); checkBtn.className = "btn primary"; checkBtn.textContent = "Check"; ctrls.appendChild(checkBtn);
      checkBtn.onclick = function () {
        var score = 0;
        left.querySelectorAll(".dropzone").forEach(function (z) {
          var ok = q.mapping[z.dataset.key] === z.dataset.choice;
          z.style.boxShadow = ok ? "0 0 0 10px #22c55e33" : "0 0 0 10px #ef444433";
          z.style.borderColor = ok ? "var(--success)" : "var(--danger)";
          if (ok) score++;
        });
        ex.textContent = "Score: " + score + "/" + q.left.length + (q.explanation ? " — " + q.explanation : "");
        ex.classList.remove("hidden");
      };
      return;
    }
  }

  function renderDefine(body, ctrls, ex) {
    var q = state.questions[state.i]; // {term, acceptable[]}
    var h = document.createElement("h3"); h.textContent = "Define: " + q.term; body.appendChild(h);
    var input = document.createElement("textarea");
    input.rows = 4; input.placeholder = "Type a concise definition…";
    input.style.width = "100%"; input.style.borderRadius = "12px"; input.style.padding = "10px";
    ctrls.appendChild(input);
    var row = document.createElement("div");
    var show = document.createElement("button"); show.className = "btn"; show.textContent = "Show acceptable answers";
    var mark = document.createElement("button"); mark.className = "btn primary"; mark.textContent = "Mark as correct";
    row.style.display = "flex"; row.style.gap = "8px";
    row.appendChild(show); row.appendChild(mark);
    ctrls.appendChild(row);

    show.onclick = function () {
      ex.innerHTML = "<b>Acceptable:</b> " + (q.acceptable || []).join(", ");
      ex.classList.remove("hidden");
    };
    mark.onclick = function () {
      input.style.boxShadow = "0 0 0 10px #22c55e33";
      input.style.borderColor = "var(--success)";
      ex.textContent = q.explanation || "";
      ex.classList.remove("hidden");
    };
  }

  function renderExam(body, ctrls, ex) {
    var q = state.questions[state.i]; // {text, marks, image?}
    var head = document.createElement("div");
    head.className = "q-meta";
    head.textContent = (q.number ? ("Q" + q.number + " • ") : "") + (q.marks + " mark" + (q.marks > 1 ? "s" : ""));
    body.appendChild(head);

    var h = document.createElement("div"); h.innerHTML = "<h3 style='margin:.2rem 0 0'>" + (q.text || "Question") + "</h3>";
    body.appendChild(h);

    if (q.image) {
      var img = document.createElement("img");
      img.src = q.image;
      img.alt = "Question figure";
      img.style.maxWidth = "100%"; img.style.borderRadius = "12px"; img.style.margin = "10px 0";
      body.appendChild(img);
    }

    var rubric = document.createElement("div");
    rubric.style.display = "flex"; rubric.style.flexWrap = "wrap"; rubric.style.gap = "8px"; rubric.style.marginTop = "10px";
    for (var m = 1; m <= q.marks; m++) {
      var lab = document.createElement("label");
      lab.style.display = "inline-flex"; lab.style.alignItems = "center"; lab.style.gap = "6px";
      var cb = document.createElement("input"); cb.type = "checkbox"; cb.dataset.mark = "1";
      lab.appendChild(cb);
      lab.appendChild(document.createTextNode("Mark " + m));
      rubric.appendChild(lab);
    }
    ctrls.appendChild(rubric);

    var notes = document.createElement("textarea");
    notes.rows = 3; notes.placeholder = "Marker notes (optional)…";
    notes.style.width = "100%"; notes.style.borderRadius = "12px"; notes.style.padding = "10px"; notes.style.marginTop = "8px";
    ctrls.appendChild(notes);

    var total = document.createElement("div");
    total.className = "badge"; total.style.marginTop = "8px";
    total.textContent = "Awarded: 0 / " + q.marks;
    ctrls.appendChild(total);

    ctrls.addEventListener("change", function () {
      var aw = 0; $all('input[type="checkbox"][data-mark]').forEach(function (c) { if (c.checked) aw += 1; });
      if (aw > q.marks) aw = q.marks;
      total.textContent = "Awarded: " + aw + " / " + q.marks;
    }, { once: true });

    if (q.explanation) { ex.textContent = q.explanation; ex.classList.remove("hidden"); }
  }

  // ---------- wire up UI ----------
  $("#startBtn").addEventListener("click", startSession);
  document.querySelector(".brand").addEventListener("click", function () { showHome(); });
  $("#settingsBtn").addEventListener("click", function () { ensureSettings(true); });

  // keep play section off on load
  showHome();
  loadManifest();
}());
