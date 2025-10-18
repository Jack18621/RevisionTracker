(function () {
  function $(s) { return document.querySelector(s); }
  var state = { manifest: null, paper: null, topic: null, subtopic: null, mode: "MCQ", questions: [], i: 0 };

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

  // NEW: helper to show a placeholder in the dropdowns on failure
  function failDropdowns(msg) {
    ["paperSel", "topicSel", "subtopicSel"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = '<option disabled selected>' + msg + '</option>';
    });
  }

  // REPLACED: robust loader with clear errors for file:// vs http(s)
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
      toast(isFile
        ? "Browser blocked local file fetch. Run a local server."
        : "Could not load ./config/manifest.json");
    }
  }

  // REPLACED: guarded populatePapers
  function populatePapers() {
    if (!state.manifest || !Array.isArray(state.manifest.papers) || !state.manifest.papers.length) {
      failDropdowns("No papers in manifest");
      return;
    }
    var sel = $("#paperSel");
    sel.innerHTML = state.manifest.papers
      .map(function (p) { return '<option value="' + p.id + '">' + p.name + '</option>'; })
      .join("");
    sel.onchange = function () { state.paper = sel.value; populateTopics(); };
    state.paper = (state.manifest.papers[0] || {}).id || null;
    populateTopics();
  }

  // REPLACED: guarded populateTopics
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

  // REPLACED: guarded populateSubtopics
  function populateSubtopics() {
    var paper = (state.manifest.papers || []).find(function (p) { return p.id === state.paper; }) || {};
    var topic = (paper.topics || []).find(function (t) { return t.id === state.topic; }) || {};
    var subs = topic.subtopics || [];
    var sel = $("#subtopicSel");
    if (!subs.length) {
      sel.innerHTML = '<option disabled selected>No subtopics</option>';
      return;
    }
    sel.innerHTML = subs.map(function (s) { return '<option value="' + s.id + '">' + s.name + '</option>'; }).join("");
    sel.onchange = function () { state.subtopic = sel.value; };
    state.subtopic = (subs[0] || {}).id || null;
  }

  function startSession() {
    state.mode = $("#modeSel").value;
    var paper = state.manifest.papers.find(function (p) { return p.id === state.paper; });
    var topic = paper.topics.find(function (t) { return t.id === state.topic; });
    var sub = topic.subtopics.find(function (s) { return s.id === state.subtopic; });
    fetch(sub.path).then(function (r) { return r.json(); }).then(function (json) {
      var all = (json.modes || {})[state.mode] || [];
      state.questions = all.map(function (q) {
        if (state.mode === "MCQ") {
          var opts = q.options.map(function (o, i) { return { text: o, i: i }; });
          var sh = shuffle(opts);
          var ci = sh.findIndex(function (o) { return o.i === q.correctIndex; });
          return { prompt: q.prompt, options: sh.map(function (o) { return o.text; }), correctIndex: ci, explanation: q.explanation || "" };
        }
        if (state.mode === "MATCH") {
          var left = shuffle(q.pairs.map(function (p) { return p[0]; }));
          var right = shuffle(q.pairs.map(function (p) { return p[1]; }));
          var map = {}; q.pairs.forEach(function (p) { map[p[0]] = p[1]; });
          return { left: left, right: right, mapping: map, explanation: q.explanation || "" };
        }
        return q;
      });
      state.i = 0;
      $("#playCard").classList.remove("hidden");
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

  function render() {
    var q = state.questions[state.i];
    var meta = $("#questionMeta");
    meta.textContent = state.mode + " • Q " + (state.i + 1) + "/" + state.questions.length;
    var body = $("#questionBody"); var ctrls = $("#controls"); var ex = $("#explain");
    ex.classList.add("hidden"); ex.textContent = (q.explanation || "");
    body.innerHTML = ""; ctrls.innerHTML = ""; setProgress(); setupSwipe(body);

    if (state.mode === "MCQ") {
      var h = document.createElement("h3"); h.textContent = q.prompt; body.appendChild(h);
      var list = document.createElement("div"); list.className = "options";
      q.options.forEach(function (opt, idx) {
        var btn = document.createElement("button"); btn.className = "option"; btn.textContent = opt;
        btn.onclick = function () {
          if (btn.classList.contains("correct") || btn.classList.contains("wrong")) return;
          var ok = (idx === q.correctIndex);
          btn.classList.add(ok ? "correct" : "wrong");
          if (!ok) { list.children[q.correctIndex].classList.add("correct"); }
          ex.classList.remove("hidden");
        };
        list.appendChild(btn);
      });
      body.appendChild(list);
    }

    if (state.mode === "TF") {
      var h2 = document.createElement("h3"); h2.textContent = q.prompt; body.appendChild(h2);
      var list2 = document.createElement("div"); list2.className = "options";
      ["True", "False"].forEach(function (label, idx) {
        var b = document.createElement("button"); b.className = "option"; b.textContent = label;
        b.onclick = function () {
          if (b.classList.contains("correct") || b.classList.contains("wrong")) return;
          var chosen = (idx === 0); var ok = (chosen === q.answer);
          b.classList.add(ok ? "correct" : "wrong");
          if (!ok) { list2.children[q.answer ? 0 : 1].classList.add("correct"); }
          ex.classList.remove("hidden");
        };
        list2.appendChild(b);
      });
      body.appendChild(list2);
    }

    if (state.mode === "SHORT") {
      var h3 = document.createElement("h3"); h3.textContent = q.prompt; body.appendChild(h3);
      var input = document.createElement("input"); input.type = "text"; input.placeholder = "Type your answer…"; ctrls.appendChild(input);
      var submit = document.createElement("button"); submit.className = "btn primary"; submit.textContent = "Check"; ctrls.appendChild(submit);
      var check = function () {
        var ans = (input.value || "").trim().toLowerCase();
        var ok = (q.acceptable || []).some(function (a) { return ans === a.toLowerCase(); });
        input.style.boxShadow = ok ? "0 0 0 10px #22c55e33" : "0 0 0 10px #ef444433";
        input.style.borderColor = ok ? "var(--success)" : "var(--danger)";
        ex.classList.remove("hidden");
      };
      submit.onclick = check;
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") check(); });
    }

    if (state.mode === "FILL") {
      var parts = q.text.split(/\{\{(.*?)\}\}/g);
      var inputs = []; var line = document.createElement("div"); line.style.margin = "8px 0"; line.style.lineHeight = "2.2";
      for (var i = 0; i < parts.length; i++) {
        if (i % 2 === 0) { var span = document.createElement("span"); span.textContent = parts[i]; line.appendChild(span); }
        else { var inp = document.createElement("input"); inp.type = "text"; inp.placeholder = parts[i]; inp.style.width = "180px"; inp.style.margin = "0 6px"; inputs.push(inp); line.appendChild(inp); }
      }
      body.appendChild(line);
      var btnC = document.createElement("button"); btnC.className = "btn primary"; btnC.textContent = "Check"; ctrls.appendChild(btnC);
      btnC.onclick = function () {
        var allOk = true;
        inputs.forEach(function (inp, idx) {
          var acc = (q.answers[idx] || []).map(function (s) { return s.toLowerCase(); });
          var val = (inp.value || "").trim().toLowerCase();
          var ok = acc.indexOf(val) !== -1;
          allOk = allOk && ok;
          inp.style.boxShadow = ok ? "0 0 0 10px #22c55e33" : "0 0 0 10px #ef444433";
          inp.style.borderColor = ok ? "var(--success)" : "var(--danger)";
        });
        ex.classList.remove("hidden");
      };
    }

    if (state.mode === "MATCH") {
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
        ex.classList.remove("hidden");
        ex.textContent = "Score: " + score + "/" + q.left.length;
      };
    }

    $("#prevBtn").disabled = (state.i === 0);
    $("#nextBtn").disabled = (state.i >= state.questions.length - 1);
    $("#nextBtn").onclick = function () { if (state.i < state.questions.length - 1) { state.i++; render(); } };
    $("#prevBtn").onclick = function () { if (state.i > 0) { state.i--; render(); } };
  }

  $("#startBtn").addEventListener("click", startSession);
  loadManifest();
}());
