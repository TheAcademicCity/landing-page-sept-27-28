/**
 * Capture OpenAI Ads attribution cookies/params for server CAPI (oppref, obref).
 */
(function (global) {
  var STORAGE_KEY = 'tacs_oai_attribution';

  function readCookie(name) {
    var match = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'),
    );
    return match ? decodeURIComponent(match[1]) : '';
  }

  function captureFromLocation() {
    var params = new URLSearchParams(global.location.search);
    var oppref = params.get('oppref') || '';
    var obref = readCookie('__obref');
    var oppCookie = readCookie('__oppref');
    if (!oppref && oppCookie) {
      oppref = oppCookie;
    }
    return {
      oppref: oppref.trim(),
      obref: obref.trim(),
    };
  }

  function persistAttribution(attrs) {
    try {
      var existing = {};
      try {
        existing = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
      } catch (e) {
        existing = {};
      }
      if (attrs.oppref && !existing.oppref) {
        existing.oppref = attrs.oppref;
      } else if (attrs.oppref) {
        existing.oppref = attrs.oppref;
      }
      if (attrs.obref) {
        existing.obref = attrs.obref;
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch (err) {
      /* ignore */
    }
  }

  function getAttributionForEnquiry() {
    var fresh = captureFromLocation();
    persistAttribution(fresh);
    try {
      var stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
      return {
        oppref: (stored.oppref || fresh.oppref || '').trim(),
        obref: (stored.obref || fresh.obref || '').trim(),
      };
    } catch (e2) {
      return fresh;
    }
  }

  persistAttribution(captureFromLocation());

  global.TacsOaiAttribution = {
    getForEnquiry: getAttributionForEnquiry,
  };
})(window);
