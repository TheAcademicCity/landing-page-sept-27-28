/**
 * Google Ads website call conversion — DOM updates for forwarding numbers.
 *
 * Requires the direct Google tag in index.html/thank-you.html (AW-10985996264)
 * to run before this script. This file only calls:
 *   gtag('config', 'AW-10985996264/aNWMCIjT94wdEOj_w_Yo', { phone_conversion_* })
 *
 * The callback applies Google's forwarding number to the page. It does not
 * record a completed-call conversion; Google attributes calls when the user
 * dials the forwarding number.
 */
(function (global) {
  var AW_ID = 'AW-10985996264';
  var CONVERSION_SEND_TO = AW_ID + '/aNWMCIjT94wdEOj_w_Yo';
  var FALLBACK_DISPLAY = '080-47092273';
  var FALLBACK_TEL = '08047092273';
  var DISPLAY_PATTERN = /080[\s-]?47092273/g;
  var ADMISSIONS_TAIL = '8047092273';

  var state = {
    display: FALLBACK_DISPLAY,
    tel: FALLBACK_TEL,
    href: 'tel:' + FALLBACK_TEL,
  };

  var isApplyingDom = false;

  global.TACS_ADS_CALL = {
    getDisplay: function () {
      return state.display;
    },
    getTel: function () {
      return state.tel;
    },
    getHref: function () {
      return state.href;
    },
  };

  function digitsOnly(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function isFallbackAdmissionsTel(href) {
    if (!href || href.toLowerCase().indexOf('tel:') !== 0) return false;
    var d = digitsOnly(href);
    return d === ADMISSIONS_TAIL || d === '91' + ADMISSIONS_TAIL || d.slice(-10) === ADMISSIONS_TAIL;
  }

  function isTrackedCallAnchor(anchor) {
    return anchor.dataset.tacsAdmissionsCall === '1' || isFallbackAdmissionsTel(anchor.getAttribute('href'));
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

  function updateTitleAndAria(anchor) {
    ['title', 'aria-label'].forEach(function (attr) {
      var value = anchor.getAttribute(attr);
      if (!value) return;
      if (DISPLAY_PATTERN.test(value)) {
        anchor.setAttribute(attr, value.replace(DISPLAY_PATTERN, state.display));
        return;
      }
      if (anchor.dataset.tacsAdmissionsCall === '1' && state.display) {
        anchor.setAttribute(attr, 'Call ' + state.display);
      }
    });
  }

  function replaceFallbackDisplayInTextNodes(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      if (!DISPLAY_PATTERN.test(node.textContent)) continue;
      var parent = node.parentElement;
      if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) continue;
      node.textContent = node.textContent.replace(DISPLAY_PATTERN, state.display);
    }
  }

  function applyToTelAnchor(anchor) {
    if (!isTrackedCallAnchor(anchor)) return;
    anchor.setAttribute('href', state.href);
    anchor.dataset.tacsAdmissionsCall = '1';
    applyGtmClasses(anchor);
    updateTitleAndAria(anchor);
    replaceFallbackDisplayInTextNodes(anchor);
  }

  function applyPhonesToDocument(root) {
    if (isApplyingDom) return;
    isApplyingDom = true;
    try {
      var scope = root || document;
      scope.querySelectorAll('a[href^="tel:"]').forEach(applyToTelAnchor);
      scope.querySelectorAll('[data-tacs-admissions-phone-display]').forEach(function (el) {
        replaceFallbackDisplayInTextNodes(el);
      });
    } finally {
      isApplyingDom = false;
    }
  }

  function setForwardingNumber(formattedNumber, mobileNumber) {
    if (formattedNumber) {
      state.display = formattedNumber;
    }
    if (mobileNumber) {
      var dial = digitsOnly(mobileNumber);
      if (dial) {
        state.tel = dial;
        state.href = 'tel:' + dial;
      }
    }
    applyPhonesToDocument(document);
  }

  global.__tacsApplyCallForwarding = setForwardingNumber;

  function configureWebsiteCallConversion() {
    if (typeof global.gtag !== 'function') {
      console.error(
        '[TACS] gtag is not defined. Add the Google tag (AW-10985996264) in the document head before this script.',
      );
      return;
    }
    global.gtag('config', CONVERSION_SEND_TO, {
      phone_conversion_number: FALLBACK_DISPLAY,
      phone_conversion_callback: setForwardingNumber,
    });
  }

  function startDomObserver() {
    if (!global.MutationObserver || !document.body) return;
    var scheduled = false;
    var observer = new MutationObserver(function (mutations) {
      if (isApplyingDom) return;
      var added = false;
      for (var i = 0; i < mutations.length; i += 1) {
        var nodes = mutations[i].addedNodes;
        if (!nodes || !nodes.length) continue;
        for (var j = 0; j < nodes.length; j += 1) {
          if (nodes[j].nodeType === 1) {
            added = true;
            break;
          }
        }
        if (added) break;
      }
      if (!added) return;
      if (scheduled) return;
      scheduled = true;
      global.requestAnimationFrame(function () {
        scheduled = false;
        if (isApplyingDom) return;
        for (var k = 0; k < mutations.length; k += 1) {
          var list = mutations[k].addedNodes;
          if (!list) continue;
          for (var n = 0; n < list.length; n += 1) {
            if (list[n].nodeType === 1) {
              applyPhonesToDocument(list[n]);
            }
          }
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    applyPhonesToDocument(document);
    configureWebsiteCallConversion();
    startDomObserver();
    global.addEventListener('hashchange', function () {
      applyPhonesToDocument(document);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.wireTacsCallLinks = applyPhonesToDocument;
})(window);
