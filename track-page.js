(function () {
  var $ = function (s) { return document.querySelector(s); }, T = window.NFTrack, timer = null, cur = "";
  var res = $("#tres"), inp = $("#code");
  var SHOW = ["Город", "Позиции", "Доставка"];
  function msgBox(cls, html) { res.innerHTML = '<div class="panel t-msg ' + cls + '">' + html + "</div>"; }
  function render(st) {
    var e = st.embeds[0] || {}, s = T.STATUSES[st.idx], fields = (e.fields || []).filter(function (f) { return SHOW.indexOf(f.name) >= 0; });
    var total = String(e.description || "").replace(/\*/g, "");
    var t = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    res.innerHTML = '<div class="panel">' +
      '<div class="t-head"><div class="t-title">' + T.esc(String(e.title || "Заказ").replace(/^\S+\s*/, "").replace(/^Новый\s+/i, "")) + '</div><span class="st-badge ' + s.key + '">' + s.emoji + " " + T.esc(s.label) + "</span></div>" +
      T.stepper(st.idx) + '<p class="t-text">' + T.esc(s.text) + "</p>" +
      '<dl class="t-info">' + fields.map(function (f) { return "<div><dt>" + T.esc(f.name) + "</dt><dd>" + T.esc(f.value).replace(/\n/g, "<br>") + "</dd></div>"; }).join("") +
      (total ? "<div><dt>Сумма</dt><dd>" + T.esc(total.replace(/^К оплате:\s*/, "")) + "</dd></div>" : "") + "</dl>" +
      '<div class="t-upd">Обновлено в ' + t + (st.idx < 2 ? " · страница обновляется сама" : "") + "</div></div>";
  }
  function load(code, quiet) {
    cur = code; clearTimeout(timer);
    if (!quiet) msgBox("wait", "Ищем заказ…");
    T.get(code).then(function (st) {
      if (cur !== code) return;
      render(st);
      if (st.idx < 2) timer = setTimeout(function () { load(code, true); }, 15000);
    }).catch(function (e) {
      if (quiet && e.message !== "NOT_FOUND") { timer = setTimeout(function () { load(code, true); }, 30000); return; }
      msgBox("bad", e.message === "NOT_FOUND" ? "Заказ с таким кодом не найден. Проверьте код в чеке." :
        e.message === "RATE" ? "Слишком много запросов. Подождите минуту и попробуйте снова." :
        "Не удалось получить статус. Попробуйте позже или напишите нам: " + T.esc(typeof NF_CONTACT !== "undefined" ? NF_CONTACT : ""));
    });
  }
  if (!T.enabled()) { $("#tf").style.display = "none"; msgBox("bad", "Отслеживание сейчас не подключено. Свяжитесь с нами напрямую."); return; }
  inp.addEventListener("input", function () { var v = inp.value.replace(/\D+/g, ""); if (v !== inp.value) inp.value = v; });
  $("#tf").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var c = inp.value.trim();
    if (!T.valid(c)) return msgBox("bad", "Введите код отслеживания из чека — это число из 18–19 цифр.");
    try { history.replaceState(null, "", "track.html?code=" + c); } catch (e) {}
    load(c);
  });
  var q = new URLSearchParams(location.search).get("code");
  if (q) { inp.value = q.replace(/\D+/g, ""); if (T.valid(inp.value)) load(inp.value); else msgBox("bad", "Код в ссылке выглядит неверно."); }
})();
