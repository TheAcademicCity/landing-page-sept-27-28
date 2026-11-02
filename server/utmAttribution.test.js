const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
    parseUtmAttribution,
    parseUtmFromPageUrl,
    toZohoAttributionFields,
} = require('./utmAttribution');

function fromQuery(queryString) {
    return parseUtmAttribution(new URLSearchParams(queryString));
}

function zoho(queryString) {
    return toZohoAttributionFields(fromQuery(queryString));
}

test('OpenAI template 1 — Awareness / Bengaluru / T1', () => {
    const q =
        'utm_source=OpenAI&utm_medium=Ads&utm_campaign=CBSEAdmissionAwareness&adgroup=ParentsBengaluru&utm_content=T1';
    const z = zoho(q);
    assert.equal(z.Lead_Source, 'OpenAI');
    assert.equal(z.Lead_Sub_Source, 'Ads');
    assert.equal(z.Lead_Super_Sub_Source, 'CBSEAdmissionAwareness');
    assert.equal(z.Ad_Group, 'ParentsBengaluru');
    assert.equal(z.UTM_Content, 'T1');
});

test('OpenAI template 2 — Awareness / India / T2', () => {
    const q =
        'utm_source=OpenAI&utm_medium=Ads&utm_campaign=CBSEAdmissionAwareness&adgroup=ParentsIndia&utm_content=T2';
    const z = zoho(q);
    assert.equal(z.Lead_Source, 'OpenAI');
    assert.equal(z.Ad_Group, 'ParentsIndia');
    assert.equal(z.UTM_Content, 'T2');
});

test('OpenAI template 3 — Reach / Bengaluru / T3', () => {
    const q =
        'utm_source=OpenAI&utm_medium=Ads&utm_campaign=CBSEAdmissionAwareness-Reach&adgroup=ParentsBengaluru&utm_content=T3';
    const z = zoho(q);
    assert.equal(z.Lead_Super_Sub_Source, 'CBSEAdmissionAwareness-Reach');
    assert.equal(z.Ad_Group, 'ParentsBengaluru');
    assert.equal(z.UTM_Content, 'T3');
});

test('OpenAI template 4 — Reach / India / T1', () => {
    const q =
        'utm_source=OpenAI&utm_medium=Ads&utm_campaign=CBSEAdmissionAwareness-Reach&adgroup=ParentsIndia&utm_content=T1';
    const z = zoho(q);
    assert.equal(z.Lead_Super_Sub_Source, 'CBSEAdmissionAwareness-Reach');
    assert.equal(z.Ad_Group, 'ParentsIndia');
});

test('OpenAI template 5 — Awareness / India / T3 (alternate content)', () => {
    const q =
        'utm_source=OpenAI&utm_medium=Ads&utm_campaign=CBSEAdmissionAwareness&adgroup=ParentsIndia&utm_content=T3';
    const z = zoho(q);
    assert.equal(z.Lead_Sub_Source, 'Ads');
    assert.equal(z.UTM_Content, 'T3');
});

test('legacy Google Ads URL without utm_medium', () => {
    const q =
        'utm_source=GoogleAds&utm_campaign=SearchBrand&adgroup=Admission2027&utm_term=boarding';
    const parsed = fromQuery(q);
    assert.equal(parsed.utm_source, 'GoogleAds');
    assert.equal(parsed.utm_medium, 'SearchBrand');
    assert.equal(parsed.utm_campaign, 'Admission2027');
    assert.equal(parsed.adgroup, 'Admission2027');
    const z = toZohoAttributionFields(parsed);
    assert.equal(z.Lead_Source, 'GoogleAds');
    assert.equal(z.Lead_Sub_Source, 'SearchBrand');
    assert.equal(z.Lead_Super_Sub_Source, 'Admission2027');
    assert.equal(z.Ad_Group, 'Admission2027');
});

test('modern Google Ads URL with utm_medium and utm_campaign', () => {
    const q =
        'utm_source=GoogleAds&utm_medium=cpc&utm_campaign=Admission2027&adgroup=BrandExact';
    const z = zoho(q);
    assert.equal(z.Lead_Sub_Source, 'cpc');
    assert.equal(z.Lead_Super_Sub_Source, 'Admission2027');
    assert.equal(z.Ad_Group, 'BrandExact');
});

test('missing UTM parameters defaults to Direct-GAds', () => {
    const z = zoho('');
    assert.equal(z.Lead_Source, 'Direct-GAds');
    assert.equal(z.Lead_Sub_Source, 'unknown');
    assert.equal(z.Lead_Super_Sub_Source, 'unknown');
    assert.equal(z.Ad_Group, '');
});

test('empty utm_source falls back to Direct-GAds', () => {
    const z = zoho('utm_source=&utm_medium=Ads');
    assert.equal(z.Lead_Source, 'Direct-GAds');
    assert.equal(z.Lead_Sub_Source, 'Ads');
});

test('parseUtmFromPageUrl uses query on page_url', () => {
    const parsed = parseUtmFromPageUrl(
        'https://admission-enquiry.theacademiccity.com/best-boarding-school-india/?utm_source=OpenAI&utm_medium=Ads&utm_campaign=CBSEAdmissionAwareness&adgroup=ParentsBengaluru',
    );
    assert.equal(parsed.utm_source, 'OpenAI');
    assert.equal(parsed.adgroup, 'ParentsBengaluru');
});
