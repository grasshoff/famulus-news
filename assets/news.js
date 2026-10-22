/* Famulus News: pane paging, six languages, specimens. No dependencies. All text comes from #news-data (textContent only). */
(function () {
  "use strict";

  var DATA = JSON.parse(document.getElementById("news-data").textContent);
  var BASE = document.body.getAttribute("data-base") || "";
  var LANGS = DATA.languages;
  var ITEMS = DATA.items;
  var $ = function (id) { return document.getElementById(id); };
  var desk = window.matchMedia("(min-width: 960px)");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var S = { lang: DATA.default_language, i: 0, filter: "all", sheet: false, pushed: false, spec: {} };

  // ------------------------------------------------------------------ helpers
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function ui() { return DATA.ui[S.lang]; }
  function fill(s, o) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function metricText(v) { return typeof v === "number" ? (v >= 10000 ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f") : String(v)) : String(v); }
  function fmtDate(iso) {
    try { return new Date(iso + "T12:00:00").toLocaleDateString(S.lang, { day: "numeric", month: "short" }); }
    catch (e) { return iso; }
  }
  function fmtDateLong(iso) {
    try { return new Date(iso + "T12:00:00").toLocaleDateString(S.lang, { day: "numeric", month: "short", year: "numeric" }); }
    catch (e) { return iso; }
  }
  /* text with `code` spans, built as nodes */
  function rich(parent, text) {
    String(text).split("`").forEach(function (part, k) {
      if (!part) return;
      parent.appendChild(k % 2 ? el("code", null, part) : document.createTextNode(part));
    });
    return parent;
  }
  function tx(it) { return it.text[S.lang]; }
  /* "Famulus Reference": the family name in the text colour, the member in gold. */
  function famulusMark(node, text) {
    node.textContent = "";
    String(text).split(/(Famulus (?:Reference|Science|University|Visualization|News|Notebook|Lektor|Repro|Proof))/).forEach(function (part, k) {
      if (!part) return;
      if (k % 2) {
        var w = el("span", "fm-name");
        w.appendChild(el("span", "fm", "Famulus"));
        w.appendChild(document.createTextNode(" "));
        w.appendChild(el("span", "fm-sub", part.slice(8)));
        node.appendChild(w);
      } else node.appendChild(document.createTextNode(part));
    });
    return node;
  }
  function visible() {
    return ITEMS.map(function (it, k) { return k; }).filter(function (k) { return S.filter === "all" || ITEMS[k].pillar === S.filter; });
  }
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg; t.classList.add("on");
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("on"); }, 1800);
  }

  // ------------------------------------------------------------------ language
  function pickLanguage() {
    var q = new URLSearchParams(location.search).get("lang");
    if (q && LANGS.indexOf(q) >= 0) return q;
    try { var st = localStorage.getItem("famulus-news-lang"); if (st && LANGS.indexOf(st) >= 0) return st; } catch (e) {}
    var nav = navigator.languages || [navigator.language || ""];
    for (var k = 0; k < nav.length; k++) {
      var c = String(nav[k]).slice(0, 2).toLowerCase();
      if (LANGS.indexOf(c) >= 0) return c;
    }
    return DATA.default_language;
  }
  function setLang(l, fromUser) {
    S.lang = l;
    document.documentElement.lang = l;
    if (fromUser) {
      try { localStorage.setItem("famulus-news-lang", l); } catch (e) {}
    }
    syncUrl(true);
    renderAll();
  }
  function renderLangs() {
    var box = $("langs");
    box.textContent = "";
    box.setAttribute("aria-label", ui().language_name);
    LANGS.forEach(function (l) {
      var b = el("button", null, l.toUpperCase());
      b.type = "button";
      b.title = DATA.ui[l].language_name;
      b.lang = l;
      b.setAttribute("aria-pressed", l === S.lang ? "true" : "false");
      b.addEventListener("click", function () { setLang(l, true); });
      box.appendChild(b);
    });
  }

  // ------------------------------------------------------------------ url
  function syncUrl(langOnly) {
    var u = new URL(location.href);
    u.searchParams.set("lang", S.lang);
    var h = location.hash;
    if (!langOnly) h = (desk.matches || S.sheet) ? "#item-" + ITEMS[S.i].id : "";
    history.replaceState(history.state, "", u.pathname + u.search + h);
  }
  function itemUrl(it) {
    var u = new URL(location.href);
    u.search = "?issue=" + DATA.slug + "&lang=" + S.lang;
    u.hash = "#item-" + it.id;
    return u.toString();
  }

  // ------------------------------------------------------------------ chrome
  function renderChrome() {
    var u = ui();
    $("h-kicker").textContent = u.issue + " " + DATA.number + " · " + fmtDateLong(DATA.period.from) + " – " + fmtDateLong(DATA.period.to) + " · " + fill(u.n_items, { n: ITEMS.length });
    famulusMark($("h-title"), DATA.title[S.lang]);
    famulusMark($("h-lead"), DATA.lead[S.lang]);
    document.title = DATA.title[S.lang] + " | " + u.site_name;
    $("src-sum").textContent = u.sources;
    $("src-txt").textContent = u.sources_text;
    $("skip").textContent = u.list;
    $("nav-news").textContent = u.nav.news;
    $("nav-guide").textContent = u.nav.guide;
    $("nav-guide").href = BASE + "guide/?lang=" + S.lang;
  }
  // A link to the guide of this site is resolved from the page itself, so it works on the hub and on GitHub Pages.
  /* A link into this family (member page, guide, released paper) becomes relative to this page, with the language. */
  var ROOT = document.body.getAttribute("data-root") || "";
  function withLang(href) {
    var own = DATA.own || "/famulus-news/";
    if (href.indexOf(own) !== 0) return href;
    var rest = href.slice(own.length), hash = "";
    var h = rest.indexOf("#");
    if (h >= 0) { hash = rest.slice(h); rest = rest.slice(0, h); }
    if (/\.(pdf|json)$/.test(rest)) return ROOT + rest + hash;
    return ROOT + rest + (rest.indexOf("?") >= 0 ? "&" : "?") + "lang=" + S.lang + hash;
  }
  function renderPapers() {
    var box = $("papers");
    if (!box || !DATA.papers || !DATA.papers.length) return;
    var u = ui();
    box.hidden = false;
    box.textContent = "";
    box.appendChild(el("h2", null, u.family.branch.papers));
    var ul = el("ul", "paper-l");
    DATA.papers.forEach(function (p) {
      var li = el("li", p.causal ? "causal" : null);
      var a = el("a");
      a.href = withLang(p.href);
      a.appendChild(el("strong", null, p.title));
      if (p.subtitle) a.appendChild(el("span", "ps", p.subtitle));
      a.appendChild(el("span", "pm", "PDF" + (p.pages ? " · " + p.pages : "")));
      li.appendChild(a);
      ul.appendChild(li);
    });
    box.appendChild(ul);
    if (DATA.readings && DATA.readings.length) {
      box.appendChild(el("h2", "rd-h", u.family.branch.readings));
      var rl = el("ul", "reading-l");
      DATA.readings.forEach(function (r) { rl.appendChild(el("li", null, r)); });
      box.appendChild(rl);
    }
  }
  function renderFilters() {
    var box = $("filters");
    box.textContent = "";
    box.setAttribute("aria-label", ui().list);
    var mk = function (key, label, n) {
      var b = el("button", null, label);
      b.type = "button";
      b.appendChild(el("span", "c", String(n)));
      b.setAttribute("aria-pressed", S.filter === key ? "true" : "false");
      b.addEventListener("click", function () {
        S.filter = key;
        var vis = visible();
        if (vis.indexOf(S.i) < 0 && vis.length) S.i = vis[0];
        renderFilters(); renderCards(); renderStage(0);
        syncUrl();
      });
      box.appendChild(b);
    };
    mk("all", ui().all, ITEMS.length);
    DATA.pillars.forEach(function (p) {
      var n = ITEMS.filter(function (it) { return it.pillar === p; }).length;
      if (n) mk(p, ui().pillar[p], n);
    });
  }
  function accent(it) { return "var(--p-" + it.pillar + ")"; }
  function renderCards() {
    var ol = $("cards");
    ol.textContent = "";
    visible().forEach(function (k) {
      var it = ITEMS[k];
      var li = el("li");
      var b = el("button", "card");
      b.type = "button";
      b.style.setProperty("--accent", accent(it));
      if (k === S.i) b.setAttribute("aria-current", "true");
      b.dataset.k = k;
      var kk = el("div", "k");
      kk.appendChild(el("span", "n", pad(k + 1)));
      kk.appendChild(el("span", null, ui().pillar[it.pillar]));
      b.appendChild(kk);
      b.appendChild(rich(el("h3"), tx(it).headline));
      var m = el("div", "m");
      m.appendChild(el("span", "dot " + it.status));
      if (typeof it.metric !== "object") m.appendChild(el("b", null, metricText(it.metric)));
      m.appendChild(el("span", null, ui().status[it.status]));
      b.appendChild(m);
      b.addEventListener("click", function () { go(k, { open: true }); });
      li.appendChild(b);
      ol.appendChild(li);
    });
  }
  function markCards() {
    Array.prototype.forEach.call($("cards").querySelectorAll(".card"), function (b) {
      var on = +b.dataset.k === S.i;
      if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
      if (on) {
        var ol = $("cards"), r = b.getBoundingClientRect(), o = ol.getBoundingClientRect();
        var beh = reduce ? "auto" : "smooth";
        if (desk.matches) {
          if (r.top < o.top) ol.scrollTo({ top: ol.scrollTop + r.top - o.top - 8, behavior: beh });
          else if (r.bottom > o.bottom) ol.scrollTo({ top: ol.scrollTop + r.bottom - o.bottom + 8, behavior: beh });
        } else {
          ol.scrollTo({ left: ol.scrollLeft + r.left - o.left - 20, behavior: beh });
        }
      }
    });
  }

  // ------------------------------------------------------------------ stage
  function renderStage(dir) {
    var it = ITEMS[S.i], t = tx(it), u = ui();
    var vis = visible(), pos = vis.indexOf(S.i), n = vis.length;
    var st = $("stage");
    st.style.setProperty("--accent", accent(it));
    st.textContent = "";
    st.className = "stage" + (S.sheet ? " open" : "") + (dir > 0 ? " enter-next" : dir < 0 ? " enter-prev" : "");

    var top = el("div", "st-top");
    var close = el("button", "st-close", "\u00d7");
    close.type = "button"; close.setAttribute("aria-label", u.list);
    close.addEventListener("click", closeSheet);
    top.appendChild(close);
    var kick = el("div", "st-kick", u.pillar[it.pillar]);
    kick.appendChild(el("span", null, " · " + fmtDate(it.date)));
    top.appendChild(kick);
    var badge = el("span", "badge");
    badge.appendChild(el("span", "dot " + it.status));
    badge.appendChild(document.createTextNode(u.status[it.status]));
    top.appendChild(badge);
    top.appendChild(el("span", "st-prog", fill(u.item_of, { i: pad(k1(pos)), n: pad(n) })));
    st.appendChild(top);

    var bar = el("div", "st-bar");
    var fillb = el("i"); fillb.style.width = (n > 1 ? (pos / (n - 1)) * 100 : 100) + "%";
    bar.appendChild(fillb); st.appendChild(bar);

    var body = el("div", "st-body");
    body.appendChild(el("div", "st-num", pad(S.i + 1)));
    body.appendChild(rich(el("h2"), t.headline));
    if (typeof it.metric !== "object") {
      var m = el("div", "st-metric");
      m.appendChild(el("b", null, metricText(it.metric)));
      m.appendChild(el("span", null, t.metric_label));
      body.appendChild(m);
    }
    var txt = el("div", "st-text");
    t.body.forEach(function (p) { txt.appendChild(rich(el("p"), p)); });
    body.appendChild(txt);
    if (it.specimen) {
      var sp = specimen(it);
      if (sp) { var w = el("div", "st-spec"); w.appendChild(sp); body.appendChild(w); }
    }
    st.appendChild(body);

    var foot = el("div", "st-foot");
    var links = el("div", "links");
    it.links.forEach(function (l, k) {
      var a = el("a", k ? "quiet" : null);
      a.href = withLang(l.href);
      a.appendChild(el("span", "kd", "\u2197"));
      a.appendChild(document.createTextNode(l.name || u.link[l.kind]));
      if (l.name) a.title = u.link[l.kind];
      links.appendChild(a);
    });
    foot.appendChild(links);
    var nav = el("div", "nav");
    var prev = el("button", null, "\u2190 " + u.prev); prev.type = "button";
    var next = el("button", null, u.next + " \u2192"); next.type = "button";
    var copy = el("button", "copy", u.copy); copy.type = "button";
    prev.disabled = pos <= 0; next.disabled = pos >= n - 1;
    prev.addEventListener("click", function () { step(-1); });
    next.addEventListener("click", function () { step(1); });
    copy.addEventListener("click", function () { copyLink(it); });
    nav.appendChild(prev); nav.appendChild(copy); nav.appendChild(next);
    foot.appendChild(nav);
    if (!it.links.length) links.hidden = true;
    st.appendChild(foot);
  }
  function k1(pos) { return pos + 1; }

  function copyLink(it) {
    var url = itemUrl(it);
    var done = function () { toast(ui().copied); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { window.prompt(ui().copy, url); });
    else window.prompt(ui().copy, url);
  }

  // ------------------------------------------------------------------ navigation
  function go(k, opt) {
    opt = opt || {};
    var dir = k === S.i ? 0 : (visible().indexOf(k) > visible().indexOf(S.i) ? 1 : -1);
    S.i = k;
    if (opt.open && !desk.matches) openSheet(); 
    renderStage(opt.open && !desk.matches ? 1 : dir);
    markCards();
    syncUrl();
    var body = $("stage").querySelector(".st-body");
    if (body) body.scrollTop = 0;
  }
  function step(d) {
    var vis = visible(), pos = vis.indexOf(S.i) + d;
    if (pos < 0 || pos >= vis.length) return;
    go(vis[pos]);
  }
  function openSheet() {
    if (S.sheet) return;
    S.sheet = true;
    document.body.classList.add("sheet-open");
    try { history.pushState({ sheet: 1 }, "", location.href); S.pushed = true; } catch (e) { S.pushed = false; }
    requestAnimationFrame(function () {
      $("stage").classList.add("open");
      var c = $("stage").querySelector(".st-close"); if (c && !desk.matches) c.focus({ preventScroll: true });
    });
  }
  function closeSheet() {
    if (!S.sheet) return;
    S.sheet = false;
    document.body.classList.remove("sheet-open");
    $("stage").classList.remove("open");
    if (S.pushed) { S.pushed = false; history.back(); }
    else { history.replaceState(null, "", location.pathname + "?lang=" + S.lang); }
    var cur = $("cards").querySelector('[aria-current="true"]'); if (cur) cur.focus({ preventScroll: true });
  }

  // ------------------------------------------------------------------ specimens
  function specimen(it) {
    var sp = it.specimen;
    if (sp.kind === "normalkarte") return spNormalkarte(it, sp);
    if (sp.kind === "fr-address") return spFr();
    if (sp.kind === "needle") return spNeedle(sp.data || []);
    if (sp.kind === "locus") return spLocus();
    if (sp.kind === "intake") return spIntake(sp.data || []);
    if (sp.kind === "security") return spSecurity();
    return null;
  }
  function box(title) {
    var b = el("div", "spec");
    b.appendChild(el("h4", null, title));
    return b;
  }
  function segCtl(opts, current, onPick) {
    var c = el("div", "seg-ctl");
    c.setAttribute("role", "group");
    opts.forEach(function (o) {
      var b = el("button", null, o[1]);
      b.type = "button";
      b.setAttribute("aria-pressed", o[0] === current ? "true" : "false");
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(c.children, function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        onPick(o[0]);
      });
      c.appendChild(b);
    });
    return c;
  }

  /* normal form: nested marks, three views, one explanation card */
  function spNormalkarte(it, sp) {
    var u = ui().sp, why = tx(it).marks || {};
    var b = box(u.view.original + " \u00b7 " + u.view.normal + " \u00b7 " + u.view.interlinear);
    var view = S.spec.nkView || "original";
    var text = el("div", "nk-text");
    var card = el("div", "nk-card");
    function height(n) { return n.mark ? 1 + Math.max(0, Math.max.apply(null, (n.children || []).map(height).concat([0]))) : 0; }
    function showCard(id) {
      card.textContent = "";
      if (!id) { card.appendChild(el("span", "hint", u.hint_pointer)); return; }
      var m = sp.marks[id];
      var top = el("div");
      top.appendChild(el("b", "ph", textOfMark(sp.sentence, id)));
      top.appendChild(el("span", "chip", u.type[m.type]));
      top.appendChild(el("span", "chip " + m.state, u.state[m.state]));
      top.appendChild(el("span", "chip", u.grade_label + ": " + u.grade[m.grade]));
      card.appendChild(top);
      card.appendChild(el("div", "nf" + (m.state === "offen" ? " offen" : ""), m.normal));
      card.appendChild(el("div", null, why[id] || ""));
    }
    function render(nodes, parent, depthTop) {
      nodes.forEach(function (n) {
        if (!n.mark) { parent.appendChild(document.createTextNode(n.t)); return; }
        var m = sp.marks[n.mark], h = height(n);
        var s = el("span", "nk-ex " + m.state);
        s.tabIndex = 0; s.setAttribute("role", "button");
        s.style.paddingBottom = ((h - 1) * 4) + "px";
        if (view === "normal" && depthTop) {
          s.classList.add("nrm"); s.textContent = m.normal; s.style.paddingBottom = "";
        } else {
          render(n.children || [], s, false);
        }
        var on = function () { Array.prototype.forEach.call(text.querySelectorAll(".on"), function (x) { x.classList.remove("on"); }); s.classList.add("on"); showCard(n.mark); };
        s.addEventListener("mouseenter", on); s.addEventListener("focus", on); s.addEventListener("click", function (e) { e.stopPropagation(); on(); });
        parent.appendChild(s);
        if (view === "interlinear" && depthTop) parent.appendChild(el("span", "nk-il", "[" + m.normal.replace(/^\[|\]$/g, "") + "]"));
      });
    }
    render(sp.sentence, text, true);
    b.appendChild(segCtl([["original", u.view.original], ["normal", u.view.normal], ["interlinear", u.view.interlinear]], view, function (v) {
      S.spec.nkView = v; var nb = specimen(it); b.parentNode.replaceChild(nb, b);
    }));
    b.appendChild(text); b.appendChild(card);
    showCard(null);
    b.appendChild(el("p", "note", u.illustration));
    return b;
  }
  function textOfMark(nodes, id) {
    var out = null;
    (function walk(ns) {
      ns.forEach(function (n) {
        if (n.mark === id) out = flat(n); else if (n.children) walk(n.children);
      });
    })(nodes);
    return out || id;
    function flat(n) { return n.t != null ? n.t : (n.children || []).map(flat).join(""); }
  }

  /* fr: address anatomy */
  var FR_EX = {
    doc:      { parts: [["fr:", "scheme"], ["hartmann", "collection"], ["bsb00028171", "doc"]] },
    page:     { parts: [["fr:", "scheme"], ["hartmann", "collection"], ["bsb00028171", "doc"], ["0137", "page"]] },
    segment:  { parts: [["fr:", "scheme"], ["hartmann", "collection"], ["bsb00028171", "doc"], ["0137", "page"], ["print1", "segment"]] },
    sentence: { parts: [["fr:", "scheme"], ["hevelius", "collection"], ["korrespondenz", "doc"], ["0017", "page"], ["s004", "sentence"]] }
  };
  function spFr() {
    var u = ui().sp;
    var b = box(u.fr_title);
    var level = S.spec.frLevel || "segment";
    var sel = null;
    var addr = el("div", "fr-addr");
    function draw() {
      addr.textContent = "";
      FR_EX[level].parts.forEach(function (p, k) {
        var s = el("button", "seg" + (k === 0 ? " first" : "") + (sel === k ? " sel" : ""));
        s.type = "button";
        s.style.animationDelay = (k * 60) + "ms";
        s.appendChild(el("b", null, p[0]));
        s.appendChild(el("i", null, u.fr_part[p[1]]));
        s.addEventListener("click", function () {
          var lvls = { doc: "doc", page: "page", segment: "segment", sentence: "sentence" };
          sel = k; if (lvls[p[1]]) { level = lvls[p[1]]; S.spec.frLevel = level; }
          draw(); ctl.replaceWith((ctl = mkctl()));
        });
        addr.appendChild(s);
      });
    }
    function mkctl() {
      return segCtl(["doc", "page", "segment", "sentence"].map(function (l) { return [l, u.fr_level[l]]; }), level, function (l) {
        level = l; sel = null; S.spec.frLevel = l; draw();
      });
    }
    var ctl = mkctl();
    b.appendChild(ctl); b.appendChild(addr);
    draw();
    b.appendChild(el("p", "note", u.fr_hint));
    return b;
  }

  /* needle: strict / coarse bars */
  function spNeedle(rows) {
    var u = ui().sp;
    var b = box(u.needle_title);
    var key = S.spec.needleKey || "strict";
    var max = Math.max.apply(null, rows.map(function (r) { return r.n; }));
    var bars = el("div", "bars");
    function draw() {
      bars.textContent = "";
      rows.slice().sort(function (a, c) { return c[key] - a[key]; }).forEach(function (r, k) {
        var row = el("div", "bar" + (k === 0 ? " first" : ""));
        var nm = el("div", "nm", u.checker + " " + r.label);
        if (r.n !== max) nm.appendChild(el("small", null, r.n + " " + u.items));
        nm.title = r.n + " " + u.items;
        row.appendChild(nm);
        var tr = el("div", "tr"), rail = el("div", "rail2"), i = el("i");
        i.style.width = "0%"; rail.appendChild(i); tr.appendChild(rail);
        tr.appendChild(el("div", "v", r[key].toFixed(2)));
        row.appendChild(tr); bars.appendChild(row);
        requestAnimationFrame(function () { requestAnimationFrame(function () { i.style.width = (r[key] * 100) + "%"; }); });
      });
    }
    b.appendChild(segCtl([["strict", u.strict], ["coarse", u.coarse]], key, function (k) { key = k; S.spec.needleKey = k; draw(); }));
    b.appendChild(bars); draw();
    b.appendChild(el("p", "note", u.needle_note));
    return b;
  }

  /* three security levels */
  function spSecurity() {
    var s = ui().sp.sec;
    var b = box(s.title);
    var lvl = S.spec.secLevel || "2";
    var rows = el("dl", "sec-rows"), meter = el("div", "sec-meter"), name = el("div", "sec-name");
    function draw() {
      var L = s.level[lvl];
      meter.textContent = "";
      ["1", "2", "3"].forEach(function (k) { meter.appendChild(el("span", "pip" + (+k <= +lvl ? " on" : ""))); });
      name.textContent = L.name;
      rows.textContent = "";
      [["where", L.where], ["who", L.who], ["suited", L.suited]].forEach(function (r) {
        rows.appendChild(el("dt", null, s[r[0]]));
        rows.appendChild(el("dd", null, r[1]));
      });
    }
    b.appendChild(el("p", "note sec-hint", s.hint));
    b.appendChild(segCtl(["1", "2", "3"].map(function (k) { return [k, k + " \u00b7 " + s.level[k].name]; }), lvl, function (k) { lvl = k; S.spec.secLevel = k; draw(); }));
    var head = el("div", "sec-head"); head.appendChild(meter); head.appendChild(name);
    b.appendChild(head); b.appendChild(rows); draw();
    b.appendChild(el("p", "note", s.note));
    return b;
  }

  /* a finding location */
  function spLocus() {
    var u = ui().sp;
    var b = box(u.locus_title);
    var on = S.spec.locus !== false;
    var wrap = el("div", "locus-box");
    var sw = el("button", "switch");
    sw.type = "button"; sw.setAttribute("role", "switch");
    sw.appendChild(el("span", "t"));
    var lab = el("span");
    sw.appendChild(lab);
    var line = el("div", "locus-line");
    function draw() {
      sw.setAttribute("aria-checked", on ? "true" : "false");
      lab.textContent = on ? u.locus_on : u.locus_off;
      line.textContent = "";
      if (on) {
        line.appendChild(document.createTextNode("KGW 1, S. 277 "));
        line.appendChild(el("em", null, "[Bl. 288]"));
        line.appendChild(document.createTextNode(", s. 6"));
      } else {
        line.appendChild(el("em", null, "Bl. 302"));
        line.appendChild(document.createTextNode(", s. 3"));
      }
    }
    sw.addEventListener("click", function () { on = !on; S.spec.locus = on; draw(); });
    wrap.appendChild(sw); b.appendChild(wrap); b.appendChild(line); draw();
    b.appendChild(el("p", "note", u.locus_note));
    return b;
  }

  /* intake: collections by step */
  function spIntake(rows) {
    var u = ui().sp;
    var b = box(u.intake_title);
    var g = el("div", "intake");
    var steps = ["dtd", "segments", "config", "review", "db", "lake"];
    rows.forEach(function (r) {
      var row = el("div", "row");
      row.appendChild(el("b", null, r.collection));
      var ss = el("div", "steps");
      steps.forEach(function (s) {
        var v = r[s];
        ss.appendChild(el("span", "st" + (v === true ? " yes" : v == null ? " unk" : ""), u.step[s]));
      });
      row.appendChild(ss); g.appendChild(row);
    });
    b.appendChild(g);
    b.appendChild(el("p", "note", u.intake_note));
    return b;
  }

  // ------------------------------------------------------------------ gestures and keys
  function wireInput() {
    document.addEventListener("keydown", function (e) {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      var tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Escape" && S.sheet) { closeSheet(); return; }
      /* Up/down scroll line by line (the open item on a wide screen or in the sheet, else the page);
         left/right and Page Up/Page Down turn to the previous or next news item. */
      var body = $("stage").querySelector(".st-body");
      var inItem = (desk.matches || S.sheet) && body && body.scrollHeight > body.clientHeight + 4;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!inItem) return;                                    // the browser scrolls the page
        e.preventDefault();
        body.scrollBy({ top: e.key === "ArrowDown" ? 48 : -48, behavior: reduce ? "auto" : "smooth" });
        return;
      }
      if (!desk.matches && !S.sheet) return;
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === "j") { e.preventDefault(); step(1); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp" || e.key === "k") { e.preventDefault(); step(-1); }
      else if (e.key === "Home") { e.preventDefault(); var v = visible(); if (v.length) go(v[0]); }
      else if (e.key === "End") { e.preventDefault(); var w = visible(); if (w.length) go(w[w.length - 1]); }
    });
    var st = $("stage"), x0 = 0, y0 = 0, t0 = 0, tracking = false;
    st.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) { tracking = false; return; }
      tracking = true; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now();
    }, { passive: true });
    st.addEventListener("touchend", function (e) {
      if (!tracking) return; tracking = false;
      var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.6 && Date.now() - t0 < 700) step(dx < 0 ? 1 : -1);
      else if (dy > 110 && Math.abs(dy) > Math.abs(dx) * 1.6 && !desk.matches) {
        var body = st.querySelector(".st-body");
        if (body && body.scrollTop <= 0) closeSheet();
      }
    }, { passive: true });
    /* wheel paging only where the stage has nothing left to scroll */
    var cool = 0;
    st.addEventListener("wheel", function (e) {
      if (!desk.matches || Math.abs(e.deltaY) < 40 || Date.now() < cool) return;
      var body = st.querySelector(".st-body");
      if (!body) return;
      var scrollable = body.scrollHeight > body.clientHeight + 4;
      var atEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 2, atTop = body.scrollTop <= 0;
      if (scrollable && !((e.deltaY > 0 && atEnd) || (e.deltaY < 0 && atTop))) return;
      cool = Date.now() + 700; step(e.deltaY > 0 ? 1 : -1);
    }, { passive: true });
    window.addEventListener("popstate", function () {
      if (S.sheet) { S.sheet = false; S.pushed = false; document.body.classList.remove("sheet-open"); $("stage").classList.remove("open"); }
    });
    desk.addEventListener("change", function () {
      if (desk.matches && S.sheet) { S.sheet = false; S.pushed = false; document.body.classList.remove("sheet-open"); }
      renderStage(0); markCards();
    });
  }

  // ------------------------------------------------------------------ start
  function renderAll() {
    renderLangs(); renderChrome(); renderFilters(); renderCards(); renderStage(0); markCards();
    renderPapers();
  }
  function start() {
    var q = new URLSearchParams(location.search);
    var want = q.get("issue");
    if (want && want !== DATA.slug && DATA.issues.some(function (x) { return x.slug === want; })) {
      location.replace(BASE + "issues/" + encodeURIComponent(want) + "/" + location.search + location.hash);
      return;
    }
    S.lang = pickLanguage();
    document.documentElement.lang = S.lang;
    var m = /^#item-(.+)$/.exec(location.hash);
    var openIt = false;
    if (m) {
      var k = ITEMS.findIndex(function (it) { return it.id === decodeURIComponent(m[1]); });
      if (k >= 0) { S.i = k; openIt = true; }
    }
    renderAll();
    wireInput();
    if (openIt && !desk.matches) {
      S.sheet = true; S.pushed = false;
      document.body.classList.add("sheet-open");
      $("stage").classList.add("open");
    }
    if (!openIt && !desk.matches) { /* strip the hash on first paint of a plain visit */ }
    syncUrl(true);
    document.documentElement.classList.add("ready");
  }
  start();
})();
