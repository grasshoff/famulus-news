/* Famulus News: the subscribe box. Posts the address to the platform; the platform answers the same for every address
   and sends a confirmation mail (double opt-in). Texts come from #news-data in the language of the page. */
(function () {
  "use strict";

  var form = document.getElementById("sub-form");
  if (!form) return;
  var DATA = JSON.parse(document.getElementById("news-data").textContent);
  var url = document.body.getAttribute("data-subscribe") || form.getAttribute("action");
  var $ = function (id) { return document.getElementById(id); };
  var msg = $("sub-msg"), btn = $("sub-btn"), input = $("sub-email");

  function lang() {
    var l = document.documentElement.lang;
    return DATA.ui[l] ? l : DATA.default_language;
  }
  function t() { return DATA.ui[lang()].subscribe; }
  function render() {
    var s = t();
    $("sub-title").textContent = s.title;
    $("sub-label").textContent = s.label;
    input.placeholder = s.placeholder;
    btn.textContent = s.button;
    $("sub-note").textContent = s.privacy;
    $("sub-lang").value = lang();
    if (msg.getAttribute("data-key")) msg.textContent = s[msg.getAttribute("data-key")];
  }
  function say(key, ok) {
    msg.setAttribute("data-key", key);
    msg.className = "sub-msg " + (ok ? "ok" : "bad");
    msg.textContent = t()[key];
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var email = input.value.trim();
    if (!input.checkValidity() || !email) { say("invalid", false); input.focus(); return; }
    var body = new URLSearchParams();
    body.set("email", email);
    body.set("lang", lang());
    body.set("website", form.elements.website.value);
    btn.disabled = true;
    fetch(url, { method: "POST", body: body, headers: { Accept: "application/json" } })
      .then(function (r) { return r.json().catch(function () { return { ok: false, msg: "error" }; }); })
      .then(function (d) {
        if (d && d.ok) { say("sent", true); input.value = ""; }
        else say(d && d.msg === "invalid" ? "invalid" : "error", false);
      })
      .catch(function () { say("error", false); })
      .then(function () { btn.disabled = false; });
  });

  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  render();
})();
