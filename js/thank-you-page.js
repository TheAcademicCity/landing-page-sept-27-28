(function () {
  var BROCHURE_URL = 'https://www.theacademiccity.com/downloads/tac-brochure-2026.pdf';
  var params = new URLSearchParams(window.location.search);
  var brochureNote = document.getElementById('thankYouBrochureNote');

  if (params.get('brochure') === '1') {
    if (brochureNote) brochureNote.hidden = false;
    var link = document.createElement('a');
    link.href = BROCHURE_URL;
    link.download = 'TAC Brochure 2026.pdf';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  var yearEl = document.getElementById('thankYouYear');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  if (window.LandingAnalytics && window.LandingAnalytics.sendPageView) {
    window.LandingAnalytics.sendPageView('thank_you');
  }
})();
