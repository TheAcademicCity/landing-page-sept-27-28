/**
 * UTM parsing for enquiry → Zoho CRM (keep in sync with js/utm-attribution.js).
 *
 * Legacy Google Ads URLs often omit utm_medium and reuse utm_campaign / adgroup
 * for medium and campaign. OpenAI Ads uses standard utm_medium + utm_campaign + adgroup.
 */

function getParam(searchParams, key) {
    const value = searchParams.get(key);
    if (value == null) return '';
    const trimmed = String(value).trim();
    return trimmed;
}

/**
 * @param {URLSearchParams|{ get: (key: string) => string | null }} searchParams
 */
function parseUtmAttribution(searchParams) {
    const rawSource = getParam(searchParams, 'utm_source');
    const utm_source = rawSource || 'Direct-GAds';

    const rawMedium = getParam(searchParams, 'utm_medium');
    const rawCampaign = getParam(searchParams, 'utm_campaign');
    const adgroup = getParam(searchParams, 'adgroup');

    let utm_medium;
    let utm_campaign;

    if (rawMedium) {
        utm_medium = rawMedium;
        utm_campaign = rawCampaign || 'unknown';
    } else {
        utm_medium = rawCampaign || 'unknown';
        utm_campaign = adgroup || rawCampaign || 'unknown';
    }

    return {
        utm_source,
        utm_medium,
        utm_campaign,
        adgroup,
        utm_term: getParam(searchParams, 'utm_term') || 'none',
        utm_content: getParam(searchParams, 'utm_content') || 'none',
        utm_device: getParam(searchParams, 'utm_device'),
        A: getParam(searchParams, 'A'),
        G: getParam(searchParams, 'G'),
        HI: getParam(searchParams, 'HI'),
    };
}

function parseUtmFromPageUrl(pageUrl) {
    try {
        return parseUtmAttribution(new URL(pageUrl).searchParams);
    } catch {
        return parseUtmAttribution(new URLSearchParams());
    }
}

/** Mirrors buildZohoLeadPayload attribution fields (for tests). */
function toZohoAttributionFields(parsed) {
    const {
        utm_source,
        utm_medium,
        utm_campaign,
        adgroup,
        utm_term,
        utm_content,
        utm_device,
        A,
        G,
        HI,
    } = parsed;

    return {
        Lead_Source_Category: 'Digital Marketing',
        Lead_Source: utm_source || 'Direct',
        Lead_Sub_Source: utm_medium || 'NA',
        Lead_Super_Sub_Source: utm_campaign || 'NA',
        Ad_Group: adgroup || '',
        UTM_Source: utm_source || '',
        UTM_Medium: utm_medium || '',
        UTM_Term: utm_term || '',
        UTM_Content: utm_content || '',
        UTM_Device: utm_device || '',
        UTM_Age_Group: A || '',
        UTM_Gender_Group: G || '',
        House_Hold_Income_Group: HI || '',
    };
}

module.exports = {
    parseUtmAttribution,
    parseUtmFromPageUrl,
    toZohoAttributionFields,
};
