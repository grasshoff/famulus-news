/* Famulus News, the family landing: the celebration of the month, the highlights, Scientific Discovery,
   the tree "Find your way" and the members. Six languages; all text from #news-data, set with textContent only. */
(function () {
  "use strict";

  var DATA = JSON.parse(document.getElementById("news-data").textContent);
  var ROOT = document.body.getAttribute("data-root") || "";
  var LANGS = DATA.languages;
  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var S = { lang: DATA.default_language, path: null };
  var MEMBERS = {};
  DATA.members.forEach(function (m) { MEMBERS[m.id] = m; });

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function ui() { return DATA.ui[S.lang]; }
  function fam() { return ui().family; }
  function fill(s, o) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }
  function mname(id) { return "Famulus " + ui().members[id].name; }
  function rich(parent, text) {
    String(text).split("`").forEach(function (part, k) {
      if (part) parent.appendChild(k % 2 ? el("code", null, part) : document.createTextNode(part));
    });
    return parent;
  }
  function fmtDate(iso) {
    try { return new Date(iso + "T12:00:00").toLocaleDateString(S.lang, { day: "numeric", month: "short", year: "numeric" }); }
    catch (e) { return iso; }
  }
  /* A link into this family becomes a link relative to this page, with the reader's language. */
  function own(href) {
    if (!href || href.indexOf(DATA.own) !== 0) return href;
    var rest = href.slice(DATA.own.length), hash = "";
    var h = rest.indexOf("#");
    if (h >= 0) { hash = rest.slice(h); rest = rest.slice(0, h); }
    if (/\.(pdf|json)$/.test(rest)) return ROOT + rest + hash;
    return ROOT + rest + (rest.indexOf("?") >= 0 ? "&" : "?") + "lang=" + S.lang + hash;
  }
  function linkLabel(l) { return l.name || ui().link[l.kind] || l.kind; }
  /* "Famulus Reference": the family name in the text colour, the member in gold. */
  function famulusMark(node, text) {
    node.textContent = "";
    String(text).split(/(Famulus (?:Reference|Science|University|Visualization|3D|News|Notebook|Lektor|Repro|Proof))/).forEach(function (part, k) {
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
  function setLang(l) {
    S.lang = l;
    document.documentElement.lang = l;
    try { localStorage.setItem("famulus-news-lang", l); } catch (e) {}
    var u = new URL(location.href); u.searchParams.set("lang", l);
    history.replaceState(null, "", u.pathname + u.search + location.hash);
    renderAll();
  }
  function renderLangs() {
    var box = $("langs");
    box.textContent = "";
    LANGS.forEach(function (l) {
      var b = el("button", null, l.toUpperCase());
      b.type = "button"; b.title = DATA.ui[l].language_name; b.lang = l;
      b.setAttribute("aria-pressed", l === S.lang ? "true" : "false");
      b.addEventListener("click", function () { setLang(l); });
      box.appendChild(b);
    });
  }

  // ------------------------------------------------------------------ 1. the celebration
  var frTimer = null;
  function renderHero() {
    var c = DATA.highlights.celebrate, t = c.text[S.lang];
    $("hx-kicker").textContent = t.kicker;
    famulusMark($("hx-title"), t.title);
    famulusMark($("hx-text"), t.text);
    $("hx-frcap").textContent = "";
    /* the five principles, in their rank, each with its one line */
    var ol = $("hx-points");
    ol.textContent = "";
    ["justified", "traceable", "validated", "data", "grounded"].forEach(function (k, i) {
      var li = el("li", "hx-p");
      li.style.animationDelay = (reduce ? 0 : 250 + i * 160) + "ms";
      li.appendChild(el("span", "hx-n", String(i + 1)));
      var b = el("span", "hx-b");
      b.appendChild(el("strong", null, ui().principles.items[k].name));
      b.appendChild(document.createTextNode(" – " + t.points[k]));
      li.appendChild(b);
      ol.appendChild(li);
    });
    document.title = t.title + " | " + ui().site_name;
    var cta = $("hx-cta");
    cta.textContent = "";
    c.links.forEach(function (l, k) {
      var a = el("a", k ? "fx-btn ghost" : "fx-btn", l.kind === "discover" ? t.cta_discover : l.kind === "news" ? t.cta_news : linkLabel(l));
      a.href = l.href.charAt(0) === "#" ? l.href : own(l.href);
      cta.appendChild(a);
    });
    var sc = $("hx-scroll"); sc.setAttribute("aria-label", fam().scroll); sc.title = fam().scroll;
    // the fr: address builds up part by part
    var box = $("hx-fr");
    box.textContent = "";
    clearTimeout(frTimer);
    var parts = [];
    var spans = parts.map(function (p, k) {
      var s = el("span", "fr-p" + (k === 0 ? " first" : ""));
      s.appendChild(el("b", null, p[0]));
      s.appendChild(el("i", null, ui().sp.fr_part[p[1]] || p[1]));
      box.appendChild(s);
      return s;
    });
    if (reduce) { spans.forEach(function (s) { s.classList.add("on"); }); return; }
    var k = 0;
    (function step() {
      if (k < spans.length) { spans[k].classList.add("on"); k++; frTimer = setTimeout(step, 420); }
    })();
  }

  // ------------------------------------------------------------------ 2. highlights of the month
  function accentOf(member) { return member && MEMBERS[member] ? MEMBERS[member].accent : "var(--gold-deep)"; }
  function renderHighlights() {
    $("hl-title").textContent = fam().highlights_title;
    $("hl-lead").textContent = fam().highlights_lead;
    var box = $("hl-tiles");
    box.textContent = "";
    DATA.highlights.items.forEach(function (it, k) {
      var t = it.text[S.lang];
      var a = el("article", "tile reveal");
      a.style.setProperty("--accent", accentOf(it.member));
      a.style.transitionDelay = (k * 90) + "ms";
      a.appendChild(famulusMark(el("p", "tile-k"), it.member ? mname(it.member) : ui().site_name));
      a.appendChild(famulusMark(el("h3"), t.title));
      a.appendChild(rich(el("p", "tile-t"), t.text));
      var ls = el("div", "tile-l");
      it.links.forEach(function (l, j) {
        var x = el("a", j ? "quiet" : null);
        x.href = l.href.charAt(0) === "#" ? l.href : own(l.href);
        x.appendChild(el("span", "kd", "↗"));
        x.appendChild(document.createTextNode(linkLabel(l)));
        ls.appendChild(x);
      });
      a.appendChild(ls);
      box.appendChild(a);
    });
  }

  // ------------------------------------------------------------------ 3. the tree
  function leaf(e) {
    var li = el("li", "leaf");
    var a = el("a");
    a.href = own(e.href);
    a.appendChild(el("strong", null, e.title));
    if (e.summary) a.appendChild(el("span", "leaf-s", e.summary[S.lang]));
    if (e.doc_lang) a.appendChild(el("span", "chip", ui().guide.written_in + " " + ui().guide.doclang[e.doc_lang]));
    li.appendChild(a);
    return li;
  }
  function sub(title, count, build, open) {
    var d = el("details", "sub");
    if (open) d.open = true;
    var s = el("summary");
    s.appendChild(el("span", "sub-t", title));
    if (count != null) s.appendChild(el("span", "sub-c", String(count)));
    d.appendChild(s);
    var body = el("div", "sub-b");
    build(body);
    d.appendChild(body);
    return d;
  }
  function renderBranch(p) {
    var f = fam(), b = f.branch, wrap = el("div", "branch");
    wrap.id = "branch-" + p.id;
    wrap.setAttribute("role", "region");
    wrap.setAttribute("aria-labelledby", "path-" + p.id);
    // What is new for you
    wrap.appendChild(sub(b.news, p.news.length, function (body) {
      if (!p.news.length) { body.appendChild(el("p", "none", b.none)); return; }
      var ul = el("ul", "news-l");
      p.news.forEach(function (n) {
        var li = el("li");
        li.style.setProperty("--accent", accentOf(n.member));
        var a = el("a");
        a.href = own(n.href);
        a.appendChild(rich(el("span", "nl-t"), n.title[S.lang]));
        a.appendChild(el("span", "nl-m", fill(b.from, { member: ui().members[n.member].name })));
        li.appendChild(a);
        ul.appendChild(li);
      });
      body.appendChild(ul);
    }, true));
    // Start here
    var starts = [];
    p.branches.forEach(function (br) { br.start.forEach(function (e) { starts.push([br, e]); }); });
    wrap.appendChild(sub(b.start, starts.length, function (body) {
      var ol = el("ol", "start-l");
      starts.forEach(function (x) { var li = leaf(x[1]); li.style.setProperty("--accent", accentOf(x[0].member)); ol.appendChild(li); });
      body.appendChild(ol);
    }, true));
    // Go deeper: the topics of each guide tab
    wrap.appendChild(sub(b.deeper, null, function (body) {
      p.branches.forEach(function (br) {
        var h = el("p", "deeper-h");
        h.style.setProperty("--accent", accentOf(br.member));
        h.appendChild(document.createTextNode(mname(br.member) + " · " + ui().guide.tab[br.tab].name + " "));
        var g = el("a", null, b.guide + " →"); g.href = own(br.guide); h.appendChild(g);
        body.appendChild(h);
        br.topics.forEach(function (tp) {
          body.appendChild(sub(ui().guide.topic[tp.topic] || tp.topic, tp.entries.length, function (inner) {
            var ul = el("ul", "leaves");
            tp.entries.forEach(function (e) { ul.appendChild(leaf(e)); });
            inner.appendChild(ul);
          }, false));
        });
      });
    }, false));
    if (p.papers && p.papers.length) {
      wrap.appendChild(sub(b.papers, p.papers.length, function (body) {
        var ul = el("ul", "leaves papers-l");
        p.papers.forEach(function (x) {
          ul.appendChild(leaf({ href: x.href, title: x.title, summary: null }));
          if (x.subtitle) ul.lastChild.querySelector("a").appendChild(el("span", "leaf-s", x.subtitle + (x.pages ? " · PDF " + x.pages : " · PDF")));
        });
        body.appendChild(ul);
      }, false));
    }
    return wrap;
  }
  function renderTree() {
    var f = fam();
    $("pa-title").textContent = f.paths_title;
    $("pa-lead").textContent = f.paths_lead;
    var box = $("tree");
    box.textContent = "";
    var grid = el("div", "paths");
    grid.setAttribute("role", "list");
    DATA.paths.forEach(function (p) {
      var btn = el("button", "path");
      btn.type = "button";
      btn.id = "path-" + p.id;
      btn.setAttribute("role", "listitem");
      btn.setAttribute("aria-expanded", S.path === p.id ? "true" : "false");
      btn.setAttribute("aria-controls", "branch-" + p.id);
      var acc = p.branches.length ? accentOf(p.branches[0].member) : "var(--oxford)";
      btn.style.setProperty("--accent", acc);
      btn.appendChild(el("span", "path-n", f.paths[p.id].name));
      btn.appendChild(el("span", "path-l", f.paths[p.id].line));
      btn.addEventListener("click", function () { openPath(S.path === p.id ? null : p.id, true); });
      grid.appendChild(btn);
    });
    box.appendChild(grid);
    var stage = el("div", "branch-stage");
    stage.id = "branch-stage";
    box.appendChild(stage);
    drawBranch(false);
  }
  function drawBranch(scroll) {
    var stage = $("branch-stage");
    stage.textContent = "";
    Array.prototype.forEach.call(document.querySelectorAll(".path"), function (b) {
      b.setAttribute("aria-expanded", b.id === "path-" + S.path ? "true" : "false");
    });
    if (!S.path) return;
    var p = DATA.paths.filter(function (x) { return x.id === S.path; })[0];
    if (!p) return;
    var br = renderBranch(p);
    if (!reduce) br.classList.add("grow");
    stage.appendChild(br);
    if (scroll) {
      var top = stage.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: top, behavior: reduce ? "auto" : "smooth" });
    }
  }
  function openPath(id, user) {
    S.path = id;
    try { if (id) localStorage.setItem("famulus-news-path", id); else localStorage.removeItem("famulus-news-path"); } catch (e) {}
    history.replaceState(null, "", location.pathname + location.search + (id ? "#path-" + id : ""));
    drawBranch(user && !!id);
  }

  // ------------------------------------------------------------------ 2b. Scientific Discovery
  var STEPS = ["causal", "hypotheses", "together", "publish", "review"];
  function renderDiscovery() {
    var d = fam().discovery;
    famulusMark($("dx-kicker"), d.kicker);
    $("dx-title").textContent = d.title;
    famulusMark($("dx-text"), d.text);
    var ol = $("dx-steps");
    ol.textContent = "";
    STEPS.forEach(function (k, i) {
      var li = el("li", "dx-step reveal");
      li.style.transitionDelay = (i * 110) + "ms";
      li.appendChild(el("span", "dx-n", String(i + 1)));
      li.appendChild(el("strong", null, d.steps[k].name));
      li.appendChild(el("span", "dx-l", d.steps[k].line));
      ol.appendChild(li);
    });
    var a = $("dx-cta");
    a.textContent = d.cta + " \u2192";
    a.href = own(DATA.own + "science/");
  }

  // ------------------------------------------------------------------ 6. the members
  function renderMembers() {
    var f = fam();
    $("m-title").textContent = f.members_title;
    $("m-lead").textContent = f.members_lead;
    var box = $("fam-cards");
    box.textContent = "";
    DATA.members.forEach(function (m, k) {
      var t = ui().members[m.id];
      var c = el("article", "mcard reveal");
      c.style.setProperty("--accent", m.accent);
      c.style.transitionDelay = (k * 90) + "ms";
      c.appendChild(famulusMark(el("h3"), "Famulus " + t.name));
      c.appendChild(el("p", "mc-a", t.audience));
      c.appendChild(el("p", "mc-t", t.tagline));
      var meta = el("p", "mc-m", f.latest + ": " + m.title[S.lang] + " · " + fill(ui().n_items, { n: m.n_items }));
      c.appendChild(meta);
      var ul = el("ul", "mc-h");
      m.headlines.forEach(function (x) {
        var li = el("li"); var a = el("a");
        a.href = own(DATA.own + m.id + "/#item-" + x.id);
        rich(a, x.title[S.lang]); li.appendChild(a); ul.appendChild(li);
      });
      c.appendChild(ul);
      var ls = el("div", "mc-l");
      var o = el("a", "fx-btn", f.open); o.href = own(DATA.own + m.href);
      var g = el("a", "fx-btn ghost", f.guide); g.href = own(DATA.own + m.guide);
      ls.appendChild(o); ls.appendChild(g);
      c.appendChild(ls);
      box.appendChild(c);
    });
  }

  // ------------------------------------------------------------------ motion
  var io = null;
  function reveal() {
    var els = document.querySelectorAll(".reveal:not(.shown)");
    if (reduce || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(els, function (e) { e.classList.add("shown"); });
      return;
    }
    if (!io) io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("shown"); io.unobserve(x.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    Array.prototype.forEach.call(els, function (e) { io.observe(e); });
  }

  // ------------------------------------------------------------------ paging: one band is one page
  /* On a wide screen every band of the landing is exactly one screen. Left/right, Page Up/Down and space turn
     whole pages; up/down scroll inside a page that holds more than one screen. The dots on the right show where
     one is and jump to any page. */
  var wide = window.matchMedia("(min-width: 960px) and (min-height: 560px)");
  function pages() { return Array.prototype.slice.call(document.querySelectorAll("main > section")); }
  function currentPage() {
    var ps = pages(), mid = window.innerHeight / 3, best = 0, bd = Infinity;
    ps.forEach(function (p, i) { var d = Math.abs(p.getBoundingClientRect().top - 60); if (p.getBoundingClientRect().top < mid && d < bd) { bd = d; best = i; } });
    ps.forEach(function (p, i) { var t = p.getBoundingClientRect().top; if (t >= 0 && t < mid && i > best) best = i; });
    return best;
  }
  function goPage(i) {
    var ps = pages();
    if (i < 0 || i >= ps.length) return;
    ps[i].scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    ps.forEach(function (p, k) { p.classList.toggle("turn-in", k === i); });
  }
  function renderDots() {
    var nav = $("page-dots");
    if (!nav) { nav = el("nav", "page-dots"); nav.id = "page-dots"; document.body.appendChild(nav); }
    nav.textContent = "";
    nav.setAttribute("aria-label", fam().pages);
    pages().forEach(function (p, i) {
      var b = el("button", "dot");
      b.type = "button";
      var h = p.querySelector("h1, h2");
      b.title = h ? h.textContent : String(i + 1);
      b.setAttribute("aria-label", b.title);
      b.addEventListener("click", function () { goPage(i); });
      nav.appendChild(b);
    });
    markDots();
  }
  function markDots() {
    var nav = $("page-dots"); if (!nav) return;
    var c = currentPage();
    Array.prototype.forEach.call(nav.children, function (b, i) { if (i === c) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
  }
  function wirePaging() {
    document.addEventListener("keydown", function (e) {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      var tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (tag === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
      var next = e.key === "ArrowRight" || e.key === "PageDown" || (e.key === " " && !e.shiftKey);
      var prev = e.key === "ArrowLeft" || e.key === "PageUp" || (e.key === " " && e.shiftKey);
      if (next || prev) { e.preventDefault(); goPage(currentPage() + (next ? 1 : -1)); }
      else if (e.key === "Home") { e.preventDefault(); goPage(0); }
      else if (e.key === "End") { e.preventDefault(); goPage(pages().length - 1); }
    });
    var t = null;
    window.addEventListener("scroll", function () { clearTimeout(t); t = setTimeout(markDots, 80); }, { passive: true });
  }

  function renderAll() {
    renderLangs(); renderHero(); renderHighlights(); renderDiscovery(); renderTree(); renderMembers();
    $("skip").textContent = fam().paths_title;
    reveal();
    if ($("page-dots")) renderDots();
  }

  function start() {
    S.lang = pickLanguage();
    document.documentElement.lang = S.lang;
    var m = /^#path-([\w-]+)$/.exec(location.hash);
    var ids = DATA.paths.map(function (p) { return p.id; });
    if (m && ids.indexOf(m[1]) >= 0) S.path = m[1];
    else { try { var st = localStorage.getItem("famulus-news-path"); if (st && ids.indexOf(st) >= 0) S.path = st; } catch (e) {} }
    renderAll();
    renderDots();
    wirePaging();
    if (m && S.path) setTimeout(function () { drawBranch(true); }, 60);
    document.documentElement.classList.add("ready");
  }
  start();
})();
