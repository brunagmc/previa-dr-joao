/* IAgo · main.js
 * Só interação real: menu mobile, mega menu no toque/teclado, formulários, obrigado,
 * aviso de cookies (Consent Mode v2) e eventos de conversão. Todo conteúdo existe sem JS.
 * IDs de medição ficam em <meta name="iago:ga4|iago:clarity|iago:pixel"> no partial head.
 */
(function () {
  "use strict";
  var d = document;
  var meta = function (n) { var m = d.querySelector('meta[name="iago:' + n + '"]'); return m ? m.getAttribute("content") || "" : ""; };
  window.dataLayer = window.dataLayer || [];
  function evento(nome, dados) { var o = { event: nome }; for (var k in dados || {}) o[k] = dados[k]; window.dataLayer.push(o); }

  /* ---------------- menu mobile ---------------- */
  var nav = d.getElementById("menu-principal");
  var abrir = d.querySelector(".nav-toggle");
  function fecharMenu() {
    if (!nav) return;
    nav.classList.remove("open");
    if (abrir) abrir.setAttribute("aria-expanded", "false");
    d.body.style.overflow = "";
  }
  if (nav && abrir) {
    abrir.addEventListener("click", function () {
      var aberto = nav.classList.toggle("open");
      abrir.setAttribute("aria-expanded", String(aberto));
      d.body.style.overflow = aberto ? "hidden" : "";
      if (aberto) { var f = nav.querySelector("a,button"); if (f) f.focus(); }
    });
    nav.querySelectorAll(".nav-close").forEach(function (b) { b.addEventListener("click", function () { fecharMenu(); abrir.focus(); }); });
  }

  /* ---------------- mega menu (toque e teclado) ---------------- */
  d.querySelectorAll(".has-mega").forEach(function (li) {
    var bt = li.querySelector(".mega-toggle");
    if (!bt) return;
    bt.addEventListener("click", function (ev) {
      ev.preventDefault();
      var aberto = li.classList.toggle("open");
      bt.setAttribute("aria-expanded", String(aberto));
    });
    li.addEventListener("focusout", function (ev) {
      if (!li.contains(ev.relatedTarget) && window.matchMedia("(min-width:1024px)").matches) {
        li.classList.remove("open"); bt.setAttribute("aria-expanded", "false");
      }
    });
  });
  d.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape") return;
    d.querySelectorAll(".has-mega.open").forEach(function (li) {
      li.classList.remove("open");
      var bt = li.querySelector(".mega-toggle");
      if (bt) { bt.setAttribute("aria-expanded", "false"); bt.focus(); }
    });
    if (nav && nav.classList.contains("open")) { fecharMenu(); if (abrir) abrir.focus(); }
  });

  /* ---------------- UTMs (primeiro toque da sessão) ---------------- */
  var CHAVES_UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"];
  try {
    var q = new URLSearchParams(location.search);
    CHAVES_UTM.forEach(function (k) { if (q.get(k) && !sessionStorage.getItem("iago_" + k)) sessionStorage.setItem("iago_" + k, q.get(k)); });
  } catch (e) {}

  /* ---------------- formulários ---------------- */
  var ENDPOINT = meta("api") || "/api/lead";
  d.querySelectorAll("form[data-iago-form]").forEach(function (form) {
    var inicio = Date.now();
    var iniciou = false;
    form.addEventListener("input", function () {
      if (!iniciou) { iniciou = true; evento("form_start", { form_id: form.id || form.getAttribute("data-iago-form") }); }
    });
    var origem = form.querySelector('input[name="pagina_origem"]');
    if (origem) origem.value = location.pathname;
    CHAVES_UTM.forEach(function (k) {
      var c = form.querySelector('input[name="' + k + '"]');
      try { if (c) c.value = sessionStorage.getItem("iago_" + k) || ""; } catch (e) {}
    });
    var tel = form.querySelector('input[type="tel"]');
    if (tel) tel.addEventListener("input", function () {
      var n = tel.value.replace(/\D/g, "").slice(0, 11);
      tel.value = n.length > 10 ? n.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
        : n.length > 6 ? n.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
        : n.length > 2 ? n.replace(/(\d{2})(\d{0,5})/, "($1) $2") : n;
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var ok = true;
      form.querySelectorAll("input,select,textarea").forEach(function (c) {
        var erro = c.id ? d.getElementById(c.id + "-erro") : null;
        if (!c.checkValidity()) {
          ok = false; c.setAttribute("aria-invalid", "true");
          if (erro) erro.textContent = c.getAttribute("data-erro") || c.validationMessage;
        } else { c.removeAttribute("aria-invalid"); if (erro) erro.textContent = ""; }
      });
      if (!ok) { var inv = form.querySelector('[aria-invalid="true"]'); if (inv) inv.focus(); return; }

      var bt = form.querySelector('[type="submit"]');
      var status = form.querySelector(".form-status");
      if (bt) bt.setAttribute("aria-busy", "true");
      var dados = {};
      new FormData(form).forEach(function (v, k) { dados[k] = v; });
      dados._t = Date.now() - inicio;
      dados.form_id = form.id || form.getAttribute("data-iago-form");

      fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) })
        .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
        .then(function () {
          try {
            sessionStorage.setItem("iago_lead", JSON.stringify({
              nome: String(dados.nome || "").split(" ")[0],
              servico: dados.servico || "",
              form_id: dados.form_id,
              enviado: Date.now()
            }));
          } catch (e) {}
          location.href = form.getAttribute("data-obrigado") || "/obrigado/";
        })
        .catch(function () {
          if (bt) bt.removeAttribute("aria-busy");
          if (status) {
            status.setAttribute("data-tipo", "erro");
            var wa = meta("whatsapp");
            status.innerHTML = "Não conseguimos enviar agora." + (wa ? ' <a href="https://wa.me/' + wa + '">Fale com a gente pelo WhatsApp</a>.' : " Tente de novo em instantes.");
          }
        });
    });
  });

  /* ---------------- página de obrigado ---------------- */
  var obrigado = d.querySelector("[data-iago-obrigado]");
  if (obrigado) {
    var lead = null;
    try { lead = JSON.parse(sessionStorage.getItem("iago_lead") || "null"); } catch (e) {}
    if (lead && Date.now() - lead.enviado < 30 * 60 * 1000) {
      d.querySelectorAll("[data-iago-nome]").forEach(function (el) { if (lead.nome) el.textContent = lead.nome; });
      d.querySelectorAll("[data-iago-servico]").forEach(function (el) { if (lead.servico) el.textContent = lead.servico; });
      d.querySelectorAll("[data-iago-wa]").forEach(function (a) {
        var href = a.getAttribute("href") || "";
        if (lead.servico && href.indexOf("wa.me") > -1) a.setAttribute("href", href.split("?")[0] + "?text=" + encodeURIComponent("Olá! Acabei de pedir atendimento sobre " + lead.servico + "."));
      });
      evento("generate_lead", { service_name: lead.servico || "", form_id: lead.form_id || "" });
      try { sessionStorage.removeItem("iago_lead"); } catch (e) {}
    }
  }

  /* ---------------- cliques de contato ---------------- */
  d.addEventListener("click", function (ev) {
    var a = ev.target.closest ? ev.target.closest("a[href]") : null;
    if (!a) return;
    var h = a.getAttribute("href");
    if (/wa\.me|api\.whatsapp/.test(h)) evento("click_whatsapp", { page_path: location.pathname });
    else if (/^tel:/.test(h)) evento("click_phone", { page_path: location.pathname });
  });

  /* ---------------- cookies + Consent Mode v2 ---------------- */
  var CHAVE = "iago_consent_v1";
  var banner = d.getElementById("cookie");
  function gtag() { window.dataLayer.push(arguments); }
  function lerConsent() { try { return JSON.parse(localStorage.getItem(CHAVE) || "null"); } catch (e) { return null; } }
  function carregar(src) { var s = d.createElement("script"); s.async = true; s.src = src; d.head.appendChild(s); return s; }
  var carregados = {};
  function aplicar(c) {
    gtag("consent", "update", {
      analytics_storage: c.analise ? "granted" : "denied",
      ad_storage: c.marketing ? "granted" : "denied",
      ad_user_data: c.marketing ? "granted" : "denied",
      ad_personalization: c.marketing ? "granted" : "denied"
    });
    var ga = meta("ga4"), cl = meta("clarity"), px = meta("pixel");
    if (c.analise && ga && !carregados.ga) {
      carregados.ga = 1;
      carregar("https://www.googletagmanager.com/gtag/js?id=" + ga);
      gtag("js", new Date()); gtag("config", ga);
    }
    if (c.analise && cl && !carregados.cl) {
      carregados.cl = 1;
      (function (c2, l, a, r, i) { c2[a] = c2[a] || function () { (c2[a].q = c2[a].q || []).push(arguments); }; var t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i; var y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, d, "clarity", "script", cl);
    }
    if (c.marketing && px && !carregados.px) {
      carregados.px = 1;
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, d, "script", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", px); window.fbq("track", "PageView");
      if (d.querySelector("[data-iago-obrigado]")) {
        var gerou = window.dataLayer.some(function (x) { return x && x.event === "generate_lead"; });
        if (gerou) window.fbq("track", "Lead");
      }
    }
  }
  function salvar(c) { try { localStorage.setItem(CHAVE, JSON.stringify(c)); } catch (e) {} aplicar(c); if (banner) banner.hidden = true; }
  var atual = lerConsent();
  if (atual) aplicar(atual); else if (banner) banner.hidden = false;
  if (banner) {
    banner.addEventListener("click", function (ev) {
      var acao = ev.target.getAttribute && ev.target.getAttribute("data-cookie");
      if (!acao) return;
      if (acao === "aceitar") salvar({ analise: true, marketing: true });
      else if (acao === "recusar") salvar({ analise: false, marketing: false });
      else if (acao === "personalizar") { var p = banner.querySelector(".cookie-prefs"); if (p) p.hidden = !p.hidden; }
      else if (acao === "salvar") salvar({
        analise: !!(banner.querySelector('[name="cookie_analise"]') || {}).checked,
        marketing: !!(banner.querySelector('[name="cookie_marketing"]') || {}).checked
      });
    });
  }
  d.querySelectorAll("[data-cookie-prefs]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!banner) return;
      var c = lerConsent() || {};
      var a = banner.querySelector('[name="cookie_analise"]'), m = banner.querySelector('[name="cookie_marketing"]');
      if (a) a.checked = !!c.analise; if (m) m.checked = !!c.marketing;
      var p = banner.querySelector(".cookie-prefs"); if (p) p.hidden = false;
      banner.hidden = false;
    });
  });
})();
