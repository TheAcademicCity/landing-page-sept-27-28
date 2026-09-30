/**
 * WhatsApp links + GTM compatibility (school-story-makers StickyButtons / GTM click triggers).
 */
(function (global) {
  var PHONE_E164 = '+919364898405';
  var PREFILL = "Hi, I'm interested in TACS admissions for the 2027-28 session";

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

  /**
   * GTM: trigger "Custom Event - Whatsapp Outbound" is Click — Just Links,
   * condition Click URL contains "whatsapp". api.whatsapp.com matches; wa.me does not.
   */

  function bindWhatsAppAnchor(anchor) {
    if (!isWhatsAppAnchor(anchor)) return;
    anchor.href = URL;
    applyGtmClasses(anchor);
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
