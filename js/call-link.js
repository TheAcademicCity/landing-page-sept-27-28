/**
 * Legacy entry — website call tracking lives in google-ads-call-conversion.js.
 * Kept so old cache-bust URLs still load; re-applies tel/class wiring only.
 */
(function (global) {
  function refresh() {
    if (typeof global.wireTacsCallLinks === 'function') {
      global.wireTacsCallLinks(document);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refresh);
  } else {
    refresh();
  }
})(window);
