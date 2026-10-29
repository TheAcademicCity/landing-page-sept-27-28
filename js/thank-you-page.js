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

  /**
   * OpenAI Ads conversion (base pixel via GTM). Fires once per successful enquiry
   * redirect; not on direct visits or thank-you refresh. No oaiq in repo — confirm
   * GTM is not also firing lead_created on this page to avoid duplicates.
   */
  (function fireOpenAiLeadCreatedOnce() {
    var pendingKey = 'tacs_oai_lead_pending';
    var firedKey = 'tacs_oai_lead_fired';
    var pendingTtlMs = 30000;
    var pending;

    function clearPending() {
      try {
        sessionStorage.removeItem(pendingKey);
      } catch (e) {
        /* ignore */
      }
    }

    try {
      pending = sessionStorage.getItem(pendingKey);
    } catch (e) {
      return;
    }
    if (!pending) return;

    var pendingAt = parseInt(pending, 10);
    if (!pendingAt || Date.now() - pendingAt > pendingTtlMs) {
      clearPending();
      return;
    }

    try {
      if (sessionStorage.getItem(firedKey) === pending) return;
    } catch (e2) {
      return;
    }

    function tryMeasure() {
      if (typeof window.oaiq !== 'function') return false;
      try {
        window.oaiq('measure', 'lead_created', { type: 'customer_action' });
      } catch (measureErr) {
        return false;
      }
      try {
        sessionStorage.setItem(firedKey, pending);
        sessionStorage.removeItem(pendingKey);
      } catch (e3) {
        /* conversion call succeeded; storage cleanup best-effort */
      }
      return true;
    }

    if (tryMeasure()) return;

    var attempts = 0;
    var maxAttempts = 24;
    var waitMs = 250;
    var timer = setInterval(function () {
      attempts += 1;
      if (tryMeasure()) {
        clearInterval(timer);
        return;
      }
      if (attempts >= maxAttempts) {
        clearInterval(timer);
        clearPending();
      }
    }, waitMs);
  })();
})();
