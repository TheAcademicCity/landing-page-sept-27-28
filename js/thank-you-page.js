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
   * OpenAI Ads lead_created — only after a confirmed new CRM lead (conversion_eligible).
   * Uses conversion_event_id from /api/enquiry for Pixel ↔ CAPI deduplication.
   * GTM: do not fire a separate lead_created on thank-you; rely on this script or
   * gate GTM tags on absence of dataLayer event tacs_openai_lead_created_handled.
   */
  (function fireOpenAiLeadCreatedOnce() {
    var pendingKey = 'tacs_oai_lead_pending';
    var firedKey = 'tacs_oai_lead_fired';
    var pendingTtlMs = 30000;
    var pendingRaw;
    var pending;

    function clearPending() {
      try {
        sessionStorage.removeItem(pendingKey);
      } catch (e) {
        /* ignore */
      }
    }

    try {
      pendingRaw = sessionStorage.getItem(pendingKey);
    } catch (e) {
      return;
    }
    if (!pendingRaw) return;

    try {
      pending = JSON.parse(pendingRaw);
    } catch (parseErr) {
      clearPending();
      return;
    }

    if (!pending || !pending.eventId || !pending.at) {
      clearPending();
      return;
    }

    if (Date.now() - pending.at > pendingTtlMs) {
      clearPending();
      return;
    }

    try {
      if (sessionStorage.getItem(firedKey) === pending.eventId) return;
    } catch (e2) {
      return;
    }

    function notifyGtmHandled(eventId) {
      try {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'tacs_openai_lead_created_handled',
          tacs_conversion_event_id: eventId,
        });
      } catch (gtmErr) {
        /* ignore */
      }
    }

    function tryMeasure() {
      if (typeof window.oaiq !== 'function') return false;
      try {
        window.oaiq(
          'measure',
          'lead_created',
          { type: 'customer_action' },
          { event_id: pending.eventId },
        );
      } catch (measureErr) {
        return false;
      }
      try {
        sessionStorage.setItem(firedKey, pending.eventId);
        sessionStorage.removeItem(pendingKey);
      } catch (e3) {
        /* conversion call succeeded; storage cleanup best-effort */
      }
      notifyGtmHandled(pending.eventId);
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
