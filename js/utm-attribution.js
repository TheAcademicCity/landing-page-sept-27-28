/**
 * UTM parsing for enquiry → Zoho CRM (keep in sync with server/utmAttribution.js).
 */
(function (global) {
  function getParam(searchParams, key) {
    var value = searchParams.get(key);
    if (value == null) return '';
    var trimmed = String(value).trim();
    return trimmed;
  }

  function parseUtmAttribution(searchParams) {
    var rawSource = getParam(searchParams, 'utm_source');
    var utm_source = rawSource || 'Direct-GAds';

    var rawMedium = getParam(searchParams, 'utm_medium');
    var rawCampaign = getParam(searchParams, 'utm_campaign');
    var adgroup = getParam(searchParams, 'adgroup');

    var utm_medium;
    var utm_campaign;

    if (rawMedium) {
      utm_medium = rawMedium;
      utm_campaign = rawCampaign || 'unknown';
    } else {
      utm_medium = rawCampaign || 'unknown';
      utm_campaign = adgroup || rawCampaign || 'unknown';
    }

    return {
      utm_source: utm_source,
      utm_medium: utm_medium,
      utm_campaign: utm_campaign,
      adgroup: adgroup,
      utm_term: getParam(searchParams, 'utm_term') || 'none',
      utm_content: getParam(searchParams, 'utm_content') || 'none',
      utm_device: getParam(searchParams, 'utm_device'),
      A: getParam(searchParams, 'A'),
      G: getParam(searchParams, 'G'),
      HI: getParam(searchParams, 'HI'),
    };
  }

  global.TacsUtmAttribution = {
    parse: parseUtmAttribution,
  };
})(window);
