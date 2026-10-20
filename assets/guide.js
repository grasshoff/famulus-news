/* Famulus News guide: documentation sorted for four audiences, six languages. No dependencies. Text only via textContent. */
(function () {
  "use strict";

  var DATA = JSON.parse(document.getElementById("news-data").textContent);
  var BASE = document.body.getAttribute("data-base") || "";
  var LANGS = DATA.languages;
  var TABS = DATA.tabs.map(function (t) { return t.id; });
  var $ = function (id) { return document.getElementById(id); };
  var S = { lang: DATA.default_language, tab: "general" };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function ui() { return DATA.ui[S.lang]; }
  function g() { return ui().guide; }
  function fill(s, o) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }
  function entry(id) { return DATA.entries.filter(function (e) { return e.id === id; })[0]; }
  function inTab(tab) { return DATA.entries.filter(function (e) { return e.audiences.indexOf(tab) >= 0; }); }

  // ------------------------------------------------------------------ language and url
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
  function tabFromHash() {
    var m = /^#for-(\w+)$/.exec(location.hash);
    return m && TABS.indexOf(m[1]) >= 0 ? m[1] : null;
  }
  function syncUrl() {
    var u = new URL(location.href);
    u.searchParams.set("lang", S.lang);
    history.replaceState(null, "", u.pathname + u.search + "#for-" + S.tab);
  }
  function setLang(l) {
    S.lang = l;
    document.documentElement.lang = l;
    try { localStorage.setItem("famulus-news-lang", l); } catch (e) {}
    syncUrl();
    renderAll();
  }
  function renderLangs() {
    var box = $("langs");
    box.textContent = "";
    box.setAttribute("aria-label", ui().language_name);
    LANGS.forEach(function (l) {
      var b = el("button", null, l.toUpperCase());
      b.type = "button"; b.title = DATA.ui[l].language_name; b.lang = l;
      b.setAttribute("aria-pressed", l === S.lang ? "true" : "false");
      b.addEventListener("click", function () { setLang(l); });
      box.appendChild(b);
    });
  }

  // ------------------------------------------------------------------ page
  function renderChrome() {
    var u = ui();
    $("h-kicker").textContent = fill(g().n_docs, { n: DATA.entries.length });
    $("h-title").textContent = g().title;
    $("h-lead").textContent = g().lead;
    document.title = g().title + " | " + u.site_name;
    $("skip").textContent = u.nav.guide;
    $("nav-news").textContent = u.nav.news;
    $("nav-news").href = BASE + "?lang=" + S.lang;
    $("nav-guide").textContent = u.nav.guide;
  }

  function renderTabs() {
    var box = $("tabs");
    box.textContent = "";
    TABS.forEach(function (id) {
      var t = g().tab[id];
      var b = el("button", "tab");
      b.type = "button"; b.id = "tab-" + id;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", id === S.tab ? "true" : "false");
      b.setAttribute("aria-controls", "panel");
      b.tabIndex = id === S.tab ? 0 : -1;
      b.dataset.tab = id;
      b.appendChild(el("span", "tn", t.name));
      b.appendChild(el("span", "tc", String(inTab(id).length)));
      b.addEventListener("click", function () { selectTab(id); });
      b.addEventListener("keydown", function (e) {
        var i = TABS.indexOf(id), j = null;
        if (e.key === "ArrowRight") j = (i + 1) % TABS.length;
        else if (e.key === "ArrowLeft") j = (i + TABS.length - 1) % TABS.length;
        else if (e.key === "Home") j = 0;
        else if (e.key === "End") j = TABS.length - 1;
        if (j !== null) { e.preventDefault(); selectTab(TABS[j]); $("tab-" + TABS[j]).focus(); }
      });
      box.appendChild(b);
    });
    box.setAttribute("aria-label", g().title);
  }

  function card(e, num) {
    var a = el("a", "gcard");
    a.href = e.href;
    if (num) a.appendChild(el("span", "gnum", String(num)));
    var body = el("span", "gbody");
    body.appendChild(el("strong", null, e.title));
    body.appendChild(el("span", "gsum", e.summary[S.lang]));
    var meta = el("span", "gmeta");
    if (e.doc_lang) meta.appendChild(el("span", "chip", g().written_in + " " + g().doclang[e.doc_lang]));
    meta.appendChild(el("span", "go", g().open + " \u2197"));
    body.appendChild(meta);
    a.appendChild(body);
    return a;
  }

  function renderPanel() {
    var p = $("panel");
    p.textContent = "";
    p.setAttribute("aria-labelledby", "tab-" + S.tab);
    p.style.setProperty("--accent", "var(--a-" + S.tab + ")");
    var t = g().tab[S.tab];
    p.appendChild(el("p", "intro", t.intro));
    if (S.tab === "admin") p.appendChild(el("p", "admin-note", g().admin_note));

    var start = DATA.tabs.filter(function (x) { return x.id === S.tab; })[0].start;
    var sec = el("section", "start");
    sec.appendChild(el("h2", null, g().start));
    var ol = el("ol", "start-list");
    start.forEach(function (id, k) {
      var li = el("li");
      li.appendChild(card(entry(id), k + 1));
      ol.appendChild(li);
    });
    sec.appendChild(ol);
    p.appendChild(sec);

    var all = el("section", "all");
    all.appendChild(el("h2", null, g().all));
    DATA.topics.forEach(function (tp) {
      var es = inTab(S.tab).filter(function (e) { return e.topic === tp; });
      if (!es.length) return;
      var grp = el("div", "topic");
      grp.appendChild(el("h3", null, g().topic[tp]));
      var list = el("div", "gcards");
      es.forEach(function (e) { list.appendChild(card(e)); });
      grp.appendChild(list);
      all.appendChild(grp);
    });
    p.appendChild(all);
  }

  function selectTab(id) {
    if (id === S.tab) return;
    S.tab = id;
    syncUrl();
    renderTabs(); renderPanel();
    var p = $("panel"); p.classList.remove("swap"); void p.offsetWidth; p.classList.add("swap");
  }

  function renderAll() { renderLangs(); renderChrome(); renderTabs(); renderPanel(); }

  function start() {
    S.lang = pickLanguage();
    document.documentElement.lang = S.lang;
    S.tab = tabFromHash() || "general";
    renderAll();
    syncUrl();
    window.addEventListener("hashchange", function () {
      var t = tabFromHash();
      if (t && t !== S.tab) { S.tab = t; renderTabs(); renderPanel(); }
    });
    document.documentElement.classList.add("ready");
  }
  start();
})();
