/**
 * Early Bird countdown — deadline end of 30 Nov (IST), i.e. 1 Dec 00:00 IST.
 * Updates all [data-eb-days] elements (hero, inline form, modal).
 */
(function () {
  var end = Date.parse('2026-12-01T00:00:00+05:30');

  function tick() {
    var ms = end - Date.now();
    if (ms <= 0) {
      document.documentElement.classList.add('eb-expired');
      return;
    }
    var d = Math.floor(ms / 86400000);
    var txt =
      d >= 2 ? 'Only ' + d + ' days left' : d === 1 ? 'Only 1 day left' : 'Last day today!';
    var els = document.querySelectorAll('[data-eb-days]');
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = txt;
    }
  }

  tick();
  setInterval(tick, 60000);
})();
