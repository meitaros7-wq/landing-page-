/* Matsense guide pages: small, dependency-free enhancements. The page reads fully without this file. */
(function () {
  var doc = document.documentElement;
  var page = location.pathname.replace(/[^a-z0-9-]/gi, "") || "home";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem("ms:" + page + ":" + key) || "null");
      localStorage.setItem("ms:" + page + ":" + key, JSON.stringify(val));
    } catch (e) { return null; }
  }
  function track(name, detail) {
    try { (window.dataLayer = window.dataLayer || []).push({ event: "guide_" + name, guide_page: page, guide_detail: detail || "" }); } catch (e) {}
  }

  /* Reading progress */
  var bar = document.querySelector(".progress i");
  function onScroll() {
    var max = doc.scrollHeight - innerHeight;
    if (bar) bar.style.setProperty("--p", max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0);
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Contents: highlight the section in view, mark the ones passed */
  var links = [].slice.call(document.querySelectorAll(".toc a"));
  var secs = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
  function here() {
    var y = innerHeight * 0.35, cur = -1;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < y) cur = i; });
    links.forEach(function (a, i) {
      a.classList.toggle("is-here", i === cur);
      a.classList.toggle("is-done", i < cur);
    });
    var on = links[cur];
    if (on && on.parentNode.parentNode.scrollWidth > on.parentNode.parentNode.clientWidth) {
      var ol = on.parentNode.parentNode, l = on.offsetLeft - 16;
      if (l < ol.scrollLeft || l + on.offsetWidth > ol.scrollLeft + ol.clientWidth) ol.scrollTo({ left: l, behavior: reduce ? "auto" : "smooth" });
    }
  }
  addEventListener("scroll", here, { passive: true });
  here();

  /* Entrances */
  var rv = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("is-in"); });

  /* Checklists with a counter, kept on this device */
  document.querySelectorAll("[data-check]").forEach(function (tool) {
    var key = tool.getAttribute("data-check");
    var boxes = [].slice.call(tool.querySelectorAll("input[type=checkbox]"));
    var saved = store(key) || [];
    boxes.forEach(function (b, i) { b.checked = !!saved[i]; });
    var n = tool.querySelector(".count b"), meter = tool.querySelector(".meter"), done = tool.querySelector(".done-note");
    function sync() {
      var c = boxes.filter(function (b) { return b.checked; }).length;
      if (n) n.textContent = c;
      if (meter) meter.style.setProperty("--p", c / boxes.length);
      if (done) done.hidden = c < boxes.length;
      store(key, boxes.map(function (b) { return b.checked; }));
      return c;
    }
    boxes.forEach(function (b) { b.addEventListener("change", function () { var c = sync(); track("check", key + ":" + c + "/" + boxes.length); }); });
    var r = tool.querySelector(".reset");
    if (r) r.addEventListener("click", function () { boxes.forEach(function (b) { b.checked = false; }); sync(); });
    sync();
  });

  /* Picker: chips built from each item's bold title */
  document.querySelectorAll("[data-picker]").forEach(function (tool) {
    var items = [].slice.call(tool.querySelectorAll(".picker__items > li"));
    var row = document.createElement("div");
    row.className = "chips"; row.setAttribute("role", "tablist");
    row.setAttribute("aria-label", tool.getAttribute("data-picker"));
    var chips = items.map(function (li, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.setAttribute("role", "tab");
      b.textContent = li.querySelector("strong").textContent.replace(/[.,]\s*$/, "");
      li.id = li.id || "pick-" + i; li.setAttribute("role", "tabpanel"); b.setAttribute("aria-controls", li.id);
      b.addEventListener("click", function () { pick(i); track("pick", b.textContent); });
      b.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (d) { e.preventDefault(); var j = (i + d + items.length) % items.length; pick(j); chips[j].focus(); }
      });
      row.appendChild(b);
      return b;
    });
    function pick(i) {
      chips.forEach(function (c, j) { c.setAttribute("aria-selected", i === j); c.tabIndex = i === j ? 0 : -1; });
      items.forEach(function (li, j) { li.classList.toggle("is-on", i === j); });
    }
    tool.querySelector(".picker__items").before(row);
    pick(0);
  });

  /* Replay strip: each step lights up a part of the match */
  document.querySelectorAll(".replay").forEach(function (tool) {
    var steps = [].slice.call(tool.querySelectorAll(".replay__steps > li"));
    var timer = null, auto = !reduce;
    function go(i) {
      tool.setAttribute("data-step", i + 1);
      steps.forEach(function (s, j) { if (i === j) s.setAttribute("aria-current", "step"); else s.removeAttribute("aria-current"); });
    }
    function stop() { auto = false; clearInterval(timer); }
    steps.forEach(function (s, i) {
      s.tabIndex = 0;
      s.addEventListener("click", function () { stop(); go(i); track("replay", i + 1); });
      s.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); stop(); go(i); } });
    });
    go(0);
    if ("IntersectionObserver" in window && auto) {
      var cur = 0;
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          clearInterval(timer);
          if (e.isIntersecting && auto) timer = setInterval(function () { cur = (cur + 1) % steps.length; go(cur); }, 3200);
        });
      }, { threshold: 0.5 }).observe(tool);
    }
  });

  /* Camera diagram: a rule lights up its part of the picture */
  document.querySelectorAll(".cam").forEach(function (tool) {
    var rules = [].slice.call(tool.querySelectorAll(".cam__rules > li"));
    var parts = tool.querySelectorAll("svg [data-rule]");
    function show(n) {
      tool.classList.toggle("has-pick", n > 0);
      rules.forEach(function (r, i) { r.classList.toggle("is-on", i + 1 === n); r.setAttribute("aria-pressed", i + 1 === n); });
      parts.forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-rule").split(" ").indexOf(String(n)) > -1); });
    }
    rules.forEach(function (r, i) {
      r.tabIndex = 0; r.setAttribute("role", "button");
      function t() { var on = r.classList.contains("is-on"); show(on ? 0 : i + 1); if (!on) track("camera", i + 1); }
      r.addEventListener("click", t);
      r.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); t(); } });
    });
  });

  /* Scouting sheet: two sightings make a pattern */
  document.querySelectorAll("[data-sheet]").forEach(function (tool) {
    var key = tool.getAttribute("data-sheet");
    var rows = [].slice.call(tool.querySelectorAll(".row"));
    var saved = store(key) || [];
    rows.forEach(function (row, r) {
      var boxes = [].slice.call(row.querySelectorAll("input"));
      boxes.forEach(function (b, i) { b.checked = !!(saved[r] && saved[r][i]); b.addEventListener("change", sync); });
    });
    function sync() {
      var pat = 0;
      var state = rows.map(function (row) {
        var v = [].map.call(row.querySelectorAll("input"), function (b) { return b.checked; });
        var c = v.filter(Boolean).length, tag = row.querySelector(".row__tag");
        row.classList.toggle("is-once", c === 1);
        row.classList.toggle("is-pattern", c >= 2);
        if (tag) tag.textContent = c >= 2 ? "Pattern" : "Seen once";
        if (c >= 2) pat++;
        return v;
      });
      var n = tool.querySelector(".count b"); if (n) n.textContent = pat;
      store(key, state);
    }
    var r = tool.querySelector(".reset");
    if (r) r.addEventListener("click", function () { tool.querySelectorAll("input").forEach(function (b) { b.checked = false; }); sync(); });
    sync();
  });

  /* Journal: copy the prompts as a note */
  document.querySelectorAll(".journal").forEach(function (j) {
    var btn = j.querySelector(".copy"), date = j.querySelector(".journal__date");
    var d = new Date(), iso = d.toISOString().slice(0, 10);
    if (date) date.textContent = iso;
    if (!btn) return;
    btn.addEventListener("click", function () {
      var lines = ["Training journal " + iso, ""];
      j.querySelectorAll("li").forEach(function (li) { lines.push(li.textContent.replace(/[.,]\s*$/, "").trim() + ":", ""); });
      var text = lines.join("\n");
      var ok = function () { var t = btn.textContent; btn.textContent = "Copied"; setTimeout(function () { btn.textContent = t; }, 1800); track("copy_journal"); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(ok, function () {});
    });
  });
})();

/* Scoreboard, three-second hold and game-plan planner */
(function () {
  var page = location.pathname.replace(/[^a-z0-9-]/gi, "") || "home";
  function track(name, detail) { try { (window.dataLayer = window.dataLayer || []).push({ event: "guide_" + name, guide_page: page, guide_detail: detail || "" }); } catch (e) {} }

  document.querySelectorAll("[data-score]").forEach(function (tool) {
    var total = 0, log = [];
    var num = tool.querySelector(".score__num b"), out = tool.querySelector(".score__log");
    function show() { num.textContent = total; out.textContent = log.length ? log.join(" + ") : "Tap a move to add it"; }
    tool.querySelectorAll(".pts > li").forEach(function (li) {
      var n = +li.getAttribute("data-pts"), name = li.querySelector("strong").textContent.split(":")[0];
      var b = document.createElement("button");
      b.type = "button"; b.className = "add"; b.textContent = "+" + n + " " + name;
      b.addEventListener("click", function () {
        total += n; log.push(n); if (log.length > 8) log.shift();
        li.classList.add("is-hit"); setTimeout(function () { li.classList.remove("is-hit"); }, 500);
        show(); track("score", name);
      });
      li.appendChild(b);
    });
    tool.querySelector(".reset").addEventListener("click", function () { total = 0; log = []; show(); });
    show();
  });

  document.querySelectorAll(".hold").forEach(function (tool) {
    var btn = tool.querySelector(".hold__btn"), arc = tool.querySelector(".hold__arc"), sec = tool.querySelector(".hold__sec"), out = tool.querySelector(".hold__out");
    var t0 = 0, raf = 0, LEN = 452, NEED = 3000;
    function frame() {
      var ms = Math.min(NEED, performance.now() - t0);
      arc.style.strokeDashoffset = LEN * (1 - ms / NEED);
      sec.textContent = (ms / 1000).toFixed(1);
      if (ms >= NEED) { out.textContent = "Held for 3 seconds. The position scores."; out.className = "hold__out is-good"; track("hold", "scored"); return; }
      raf = requestAnimationFrame(frame);
    }
    function down(e) { e.preventDefault(); if (btn.classList.contains("is-down")) return; btn.classList.add("is-down"); out.textContent = ""; out.className = "hold__out"; t0 = performance.now(); raf = requestAnimationFrame(frame); }
    function up() {
      if (!btn.classList.contains("is-down")) return;
      btn.classList.remove("is-down"); cancelAnimationFrame(raf);
      var ms = performance.now() - t0;
      if (ms < NEED) { out.textContent = "Let go at " + (ms / 1000).toFixed(1) + " seconds. No points."; track("hold", "early"); }
      setTimeout(function () { if (!btn.classList.contains("is-down")) { arc.style.strokeDashoffset = LEN; sec.textContent = "0.0"; } }, 1400);
    }
    btn.addEventListener("pointerdown", down);
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { btn.addEventListener(ev, up); });
    btn.addEventListener("keydown", function (e) { if ((e.key === " " || e.key === "Enter") && !e.repeat) down(e); });
    btn.addEventListener("keyup", function (e) { if (e.key === " " || e.key === "Enter") up(); });
  });

  document.querySelectorAll("[data-plan]").forEach(function (tool) {
    var key = "ms:" + page + ":" + tool.getAttribute("data-plan");
    var items = [].slice.call(tool.querySelectorAll(".plan > li"));
    var saved = {}; try { saved = JSON.parse(localStorage.getItem(key) || "{}") || {}; } catch (e) {}
    var areas = items.map(function (li, i) {
      var ta = document.createElement("textarea");
      ta.id = "plan-" + i; ta.rows = 2; ta.placeholder = "Write yours";
      ta.setAttribute("aria-label", li.querySelector("strong").textContent.replace(/[.,]\s*$/, "") + ": your plan");
      ta.value = saved[i] || "";
      ta.addEventListener("input", function () { saved[i] = ta.value; try { localStorage.setItem(key, JSON.stringify(saved)); } catch (e) {} });
      li.appendChild(ta);
      return ta;
    });
    var copy = tool.querySelector(".copy-plan");
    if (copy) copy.addEventListener("click", function () {
      var text = ["My game plan", ""].concat(items.map(function (li, i) { return li.querySelector("strong").textContent.replace(/[.,]\s*$/, "") + ": " + (areas[i].value || "-"); })).join("\n");
      var t = copy.textContent;
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { copy.textContent = "Copied"; setTimeout(function () { copy.textContent = t; }, 1800); track("copy_plan"); }, function () {});
    });
    var r = tool.querySelector(".reset");
    if (r) r.addEventListener("click", function () { areas.forEach(function (a) { a.value = ""; }); saved = {}; try { localStorage.removeItem(key); } catch (e) {} });
  });
})();
