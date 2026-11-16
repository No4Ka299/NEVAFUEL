/* Статусы заказов. Статус хранится в самом сообщении заказа в Discord. */
(function (w) {
  var STATUSES = [
    { key: "review", label: "На рассмотрении", emoji: "🟡", color: 0xF5C542, text: "Заявка получена и ждёт рассмотрения." },
    { key: "work",   label: "В работе",        emoji: "🔵", color: 0x3B82F6, text: "Мы приняли заказ и уже выезжаем к вам." },
    { key: "done",   label: "Закрыта",         emoji: "🟢", color: 0x22C55E, text: "Заказ выполнен. Спасибо, что выбрали Neva Fuel!" }
  ];
  function base() {
    var u = (typeof NF_WEBHOOK !== "undefined" && NF_WEBHOOK) ? String(NF_WEBHOOK) : "";
    return u.split("?")[0].replace(/\/+$/, "");
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function valid(code) { return /^\d{15,25}$/.test(String(code || "")); }
  function idxOf(embeds) {
    var f = (embeds && embeds[0] && embeds[0].fields) || [];
    for (var i = 0; i < f.length; i++) {
      if (f[i].name === "Статус") {
        var v = String(f[i].value);
        if (/закрыт/i.test(v)) return 2;
        if (/работ/i.test(v)) return 1;
        return 0;
      }
    }
    return 0;
  }
  function url(code) { return base() + "/messages/" + code; }
  function fail(r) {
    var e = new Error(r.status === 404 ? "NOT_FOUND" : r.status === 429 ? "RATE" : "HTTP " + r.status);
    e.status = r.status; return e;
  }
  function get(code) {
    if (!base()) return Promise.reject(new Error("NO_WEBHOOK"));
    if (!valid(code)) return Promise.reject(new Error("BAD_CODE"));
    return fetch(url(code), { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw fail(r);
      return r.json();
    }).then(function (msg) { return { msg: msg, idx: idxOf(msg.embeds), embeds: msg.embeds || [] }; });
  }
  function clean(e) {
    var o = {};
    ["title", "description", "color"].forEach(function (k) { if (e[k] !== undefined) o[k] = e[k]; });
    if (e.fields) o.fields = e.fields.map(function (f) { return { name: f.name, value: f.value, inline: !!f.inline }; });
    if (e.footer && e.footer.text) o.footer = { text: e.footer.text };
    if (e.image && e.image.url) {
      var fn = decodeURIComponent(String(e.image.url).split("?")[0].split("/").pop());
      o.image = { url: e.image.url.indexOf("attachment://") === 0 ? e.image.url : "attachment://" + fn };
    }
    return o;
  }
  function patch(code, mutate) {
    return get(code).then(function (st) {
      var embeds = st.embeds.map(clean);
      mutate(embeds);
      var body = { embeds: embeds, allowed_mentions: { parse: [] },
        attachments: (st.msg.attachments || []).map(function (a) { return { id: a.id }; }) };
      return fetch(url(code), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then(function (r) { if (!r.ok) throw fail(r); return r.json(); });
    });
  }
  function upsert(embed, name, value, inline, first) {
    embed.fields = embed.fields || [];
    for (var i = 0; i < embed.fields.length; i++) if (embed.fields[i].name === name) { embed.fields[i].value = value; return; }
    var f = { name: name, value: value, inline: !!inline };
    if (first) embed.fields.unshift(f); else embed.fields.push(f);
  }
  function setStatus(code, idx) {
    var s = STATUSES[idx];
    return patch(code, function (embeds) {
      embeds[0].color = s.color;
      upsert(embeds[0], "Статус", s.emoji + " " + s.label, false, true);
    });
  }
  function addCode(code) {
    return patch(code, function (embeds) { upsert(embeds[0], "Код отслеживания", "`" + code + "`", true, false); });
  }
  function stepper(idx) {
    var all = idx >= STATUSES.length - 1;
    return '<ol class="stepper' + (all ? " all-done" : "") + '">' + STATUSES.map(function (s, i) {
      var cls = i < idx ? "done" : i === idx ? (all ? "done" : "active") : "";
      return '<li class="' + cls + '"><i>' + (cls === "done" ? "✓" : i + 1) + "</i><span>" + esc(s.label) + "</span></li>";
    }).join("") + "</ol>";
  }
  function trackUrl(code) { return new URL("track.html?code=" + code, location.href).href; }
  w.NFTrack = { STATUSES: STATUSES, enabled: function () { return !!base(); }, valid: valid, get: get, setStatus: setStatus,
    addCode: addCode, stepper: stepper, trackUrl: trackUrl, esc: esc };
})(window);
