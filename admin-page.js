(function () {
  var $ = function (s) { return document.querySelector(s); }, T = window.NFTrack, cur = "";
  var out = $("#aout"), inp = $("#acode");
  function info(cls, html) { out.innerHTML = '<div class="panel t-msg ' + cls + '">' + html + "</div>"; }
  function render(st, note) {
    var e = st.embeds[0] || {}, f = (e.fields || []).filter(function (x) { return x.name !== "Статус" && x.name !== "Код отслеживания"; });
    out.innerHTML = '<div class="panel">' +
      '<div class="t-head"><div class="t-title">' + T.esc(e.title || "Заказ") + '</div><span class="st-badge ' + T.STATUSES[st.idx].key + '">' + T.STATUSES[st.idx].emoji + " " + T.esc(T.STATUSES[st.idx].label) + "</span></div>" +
      T.stepper(st.idx) +
      '<dl class="t-info">' + f.map(function (x) { return "<div><dt>" + T.esc(x.name) + "</dt><dd>" + T.esc(x.value).replace(/\n/g, "<br>") + "</dd></div>"; }).join("") + "</dl>" +
      '<div class="a-btns">' + T.STATUSES.map(function (s, i) {
        return '<button type="button" class="opt" data-i="' + i + '" aria-pressed="' + (i === st.idx) + '">' + s.emoji + " " + T.esc(s.label) + "</button>"; }).join("") + "</div>" +
      '<div class="t-upd" id="anote">' + (note || "Выберите новый статус — клиент увидит его в течение 15 секунд.") + "</div>" +
      '<div class="t-upd"><a href="' + T.esc(T.trackUrl(cur)) + '" target="_blank" rel="noopener">Открыть страницу клиента →</a></div></div>';
    out.querySelectorAll(".a-btns .opt").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = +b.dataset.i; out.querySelectorAll(".a-btns .opt").forEach(function (x) { x.disabled = true; });
        $("#anote").textContent = "Сохраняем…";
        T.setStatus(cur, i).then(function () { return T.get(cur); }).then(function (s2) { render(s2, "✓ Статус обновлён: " + T.STATUSES[i].label); })
          .catch(function (e) { render(st, "Не удалось сохранить (" + (e.message || "ошибка") + "). Попробуйте ещё раз."); });
      });
    });
  }
  if (!T.enabled()) { $("#af").style.display = "none"; info("bad", "Вебхук не задан в config.js."); return; }
  inp.addEventListener("input", function () { var v = inp.value.replace(/\D+/g, ""); if (v !== inp.value) inp.value = v; });
  $("#af").addEventListener("submit", function (ev) {
    ev.preventDefault(); cur = inp.value.trim();
    if (!T.valid(cur)) return info("bad", "Введите код отслеживания из сообщения в Discord (число из 18–19 цифр).");
    info("wait", "Загружаем заказ…");
    T.get(cur).then(render.bind(null)).catch(function (e) { info("bad", e.message === "NOT_FOUND" ? "Заказ не найден. Проверьте код." : "Ошибка: " + T.esc(e.message)); });
  });
})();
