/* Famulus principles: the general policy of the family, written once (ui.json `principles`), shown in full on the
   family landing and as a panel on every member page and guide. Also the slim banner of the member pages that leads to the highlights of the month.
   Follows the page language (the html lang attribute). Text only via textContent. */
(function () {
  "use strict";

  var box = document.getElementById("principles");
  var banner = document.getElementById("rv-banner");
  var why = document.getElementById("why-box");
  if (!box && !banner && !why) return;
  var DATA = JSON.parse(document.getElementById("news-data").textContent);
  var ROOT = document.body.getAttribute("data-root") || "";
  var KEYS = ["justified", "traceable", "validated", "data", "grounded"];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function lang() { var l = document.documentElement.lang; return DATA.ui[l] ? l : DATA.default_language; }
  function href(h) {
    if (h && DATA.own && h.indexOf(DATA.own) === 0) return ROOT + h.slice(DATA.own.length);
    return h;
  }

  function render() {
    var u = DATA.ui[lang()], p = u.principles, links = DATA.principle_links || {};
    if (box) {
      var full = box.getAttribute("data-mode") === "full";
      box.textContent = "";
      var head = el("header", "pr-head");
      var h = el("h2", null, full ? p.title : p.panel_title);
      h.id = full ? "p-title" : "pp-title";
      head.appendChild(h);
      if (full) head.appendChild(el("p", "pr-lead", p.lead));
      box.appendChild(head);
      var grid = el("div", "pr-grid");
      KEYS.forEach(function (k, i) {
        var it = p.items[k];
        var c = el("article", "pr-card");
        c.appendChild(el("span", "pr-n", String(i + 1)));
        c.appendChild(el("h3", null, it.name));
        c.appendChild(el("p", null, it.text));
        if (links[k]) {
          var a = el("a", "pr-more", p.more + " ↗");
          a.href = href(links[k]);
          c.appendChild(a);
        }
        grid.appendChild(c);
      });
      box.appendChild(grid);
      var foot = el("p", "pr-foot");
      if (links.paper) {
        var pa = el("a", null, p.paper + " ↗"); pa.href = href(links.paper); foot.appendChild(pa);
      }
      if (!full) {
        foot.appendChild(document.createTextNode(" · "));
        var all = el("a", null, p.all + " →"); all.href = ROOT + "?lang=" + lang() + "#principles"; foot.appendChild(all);
      }
      box.appendChild(foot);
    }
    if (why) {
      var only = why.getAttribute("data-only");
      if (!only || only === document.body.getAttribute("data-member")) {
        var w0 = u.reference_why;
        why.textContent = "";
        why.appendChild(el("p", "why-k", w0.kicker));
        var h2 = el("h2", null, w0.title); h2.id = "why-title";
        why.appendChild(h2);
        var body = el("div", "why-b");
        w0.paras.forEach(function (t) { body.appendChild(el("p", null, t)); });
        why.appendChild(body);
        why.hidden = false;
      }
    }
    if (banner) {
      var r = u.family;
      banner.textContent = "";
      var w = el("div", "wrap rv-banner-in");
      w.appendChild(el("span", "rv-star", "★"));
      w.appendChild(el("span", "rv-btext", r.banner));
      var a2 = el("a", null, r.banner_cta + " →");
      a2.href = ROOT + "?lang=" + lang() + "#highlights";
      w.appendChild(a2);
      banner.appendChild(w);
      banner.hidden = false;
    }
  }

  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  render();
})();
