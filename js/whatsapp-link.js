/**
 * WhatsApp links + GTM (StickyButtons parity + Custom Event "Whatsapp Outbound").
 */
(function (global) {
  /** GTM Custom Event trigger name — must match exactly. */
  var GTM_EVENT_WHATSAPP_OUTBOUND = 'Whatsapp Outbound';
  var PHONE_E164 = '+919364898405';
  var PREFILL =
    (document.documentElement &&
      document.documentElement.getAttribute('data-whatsapp-prefill')) ||
    global.TACS_WHATSAPP_PREFILL ||
    'Admission details please!';

  function buildWhatsAppUrl() {
    var encoded = encodeURIComponent(PREFILL);
    return (
      'https://api.whatsapp.com/send/?phone=' +
      encodeURIComponent(PHONE_E164) +
      '&text=' +
      encoded +
      '&type=phone_number&app_absent=0'
    );
  }

  var URL = buildWhatsAppUrl();

  global.TACS_WHATSAPP = {
    phone: PHONE_E164,
    prefillText: PREFILL,
    url: URL,
  };

  function isWhatsAppAnchor(anchor) {
    var href = (anchor.getAttribute('href') || '').toLowerCase();
    return (
      href.indexOf('wa.me/919364898405') !== -1 ||
      href.indexOf('api.whatsapp.com') !== -1 ||
      href.indexOf('whatsapp.com/send') !== -1 ||
      anchor.classList.contains('whatsapp-button') ||
      anchor.classList.contains('mobile-whatsapp-section') ||
      anchor.classList.contains('side-action-wa') ||
      anchor.classList.contains('wa')
    );
  }

  function inferPlacement(anchor) {
    if (anchor.classList.contains('side-action-wa') || anchor.closest('.side-action-stack')) {
      return 'side_widget';
    }
    if (anchor.classList.contains('wa') || anchor.closest('.mobile-action-bar')) {
      return 'mobile_bar';
    }
    if (anchor.closest('.contact-section__ctas')) {
      return 'contact_section';
    }
    return 'other';
  }

  function pushWhatsappOutbound(anchor) {
    global.dataLayer = global.dataLayer || [];
    global.dataLayer.push({
      event: GTM_EVENT_WHATSAPP_OUTBOUND,
      link_url: URL,
      whatsapp_placement: inferPlacement(anchor),
      page_location: global.location.href,
      page_path: global.location.pathname,
    });
  }

  function applyGtmClasses(anchor) {
    if (anchor.classList.contains('side-action-wa') || anchor.closest('.side-action-stack')) {
      anchor.classList.add('whatsapp-button');
    }
    if (anchor.classList.contains('wa') || anchor.closest('.mobile-action-bar')) {
      anchor.classList.add('mobile-whatsapp-section');
    }
    if (anchor.closest('.contact-section__ctas--mobile')) {
      anchor.classList.add('mobile-whatsapp-section');
    }
    if (anchor.closest('.contact-section__ctas:not(.contact-section__ctas--mobile)')) {
      anchor.classList.add('whatsapp-button');
    }
  }

  function bindWhatsAppAnchor(anchor) {
    if (!isWhatsAppAnchor(anchor)) return;
    anchor.href = URL;
    applyGtmClasses(anchor);
    if (!anchor.getAttribute('rel')) {
      anchor.setAttribute('rel', 'noopener noreferrer');
    }
    if (anchor.dataset.gtmWaBound === '1') return;
    anchor.dataset.gtmWaBound = '1';
    anchor.addEventListener('click', function () {
      pushWhatsappOutbound(anchor);
    });
  }

  function wireWhatsAppLinks(scope) {
    var root = scope || document;
    root.querySelectorAll('a[href]').forEach(bindWhatsAppAnchor);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      wireWhatsAppLinks(document);
    });
  } else {
    wireWhatsAppLinks(document);
  }

  global.wireTacsWhatsAppLinks = wireWhatsAppLinks;
})(window);
