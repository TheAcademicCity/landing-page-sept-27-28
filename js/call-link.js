/**
 * Admissions call links + GTM (tel: link clicks + Custom Event "phone_click" in GTM-579PCB3X).
 */
(function (global) {
  /** GTM Custom Event — must match container trigger (same as leaders-batch FixedActionBar). */
  var GTM_EVENT_PHONE_CLICK = 'phone_click';
  var PHONE_TEL = '08047092273';
  var TEL_HREF = 'tel:' + PHONE_TEL;

  global.TACS_CALL = {
    phoneDisplay: '080-47092273',
    tel: PHONE_TEL,
    href: TEL_HREF,
  };

  function normalizeTelHref(href) {
    if (!href) return '';
    var raw = href.replace(/^tel:/i, '').replace(/\D/g, '');
    if (raw === '8047092273' || raw === '918047092273' || raw.endsWith('8047092273')) {
      return TEL_HREF;
    }
    return href;
  }

  function isCallAnchor(anchor) {
    var href = (anchor.getAttribute('href') || '').toLowerCase();
    if (href.indexOf('tel:') !== 0) return false;
    var normalized = normalizeTelHref(href);
    return normalized === TEL_HREF;
  }

  function inferPlacement(anchor) {
    if (
      (anchor.classList.contains('side-icon') && anchor.classList.contains('phone')) ||
      anchor.classList.contains('side-action-call')
    ) {
      return 'side_widget';
    }
    if (anchor.classList.contains('call') || anchor.closest('.mobile-action-bar')) {
      return 'mobile_bar';
    }
    if (anchor.closest('.contact-section__ctas')) {
      return 'contact_section';
    }
    if (anchor.closest('.site-util')) {
      return 'utility_bar';
    }
    if (anchor.closest('footer')) {
      return 'footer';
    }
    return 'other';
  }

  function pushPhoneClick(anchor) {
    global.dataLayer = global.dataLayer || [];
    global.dataLayer.push({
      event: GTM_EVENT_PHONE_CLICK,
      link_url: TEL_HREF,
      source: inferPlacement(anchor),
      call_placement: inferPlacement(anchor),
      page_location: global.location.href,
      page_path: global.location.pathname,
    });
  }

  function applyGtmClasses(anchor) {
    if (
      (anchor.classList.contains('side-icon') && anchor.classList.contains('phone')) ||
      anchor.classList.contains('side-action-call')
    ) {
      anchor.classList.add('call-button');
    }
    if (anchor.classList.contains('call') || anchor.closest('.mobile-action-bar')) {
      anchor.classList.add('mobile-call-section');
    }
    if (anchor.closest('.contact-section__ctas')) {
      anchor.classList.add('call-button');
    }
  }

  function bindCallAnchor(anchor) {
    if (!isCallAnchor(anchor)) return;
    anchor.href = TEL_HREF;
    applyGtmClasses(anchor);
    if (anchor.dataset.gtmCallBound === '1') return;
    anchor.dataset.gtmCallBound = '1';
    anchor.addEventListener('click', function () {
      pushPhoneClick(anchor);
    });
  }

  function wireCallLinks(scope) {
    var root = scope || document;
    root.querySelectorAll('a[href^="tel:"]').forEach(bindCallAnchor);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      wireCallLinks(document);
    });
  } else {
    wireCallLinks(document);
  }

  global.wireTacsCallLinks = wireCallLinks;
})(window);
