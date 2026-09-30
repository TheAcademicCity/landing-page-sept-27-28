(function (global) {
  var PHONE = '919364898405';
  var PREFILL = "Hi, I'm interested in TACS admissions for the 2027-28 session";
  var URL = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(PREFILL);

  global.TACS_WHATSAPP = {
    phone: PHONE,
    prefillText: PREFILL,
    url: URL,
  };

  function wireWhatsAppLinks(scope) {
    var root = scope || document;
    root.querySelectorAll('a[href*="wa.me/' + PHONE + '"], a[href*="api.whatsapp.com/send"]').forEach(function (anchor) {
      anchor.href = URL;
    });
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
