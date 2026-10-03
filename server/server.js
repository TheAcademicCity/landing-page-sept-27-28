require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3010;
const STATIC_ROOT = path.join(__dirname, '..');
/** Optional, e.g. /best-boarding-school-india when the landing is not at domain root */
const LANDING_BASE_PATH = (process.env.LANDING_BASE_PATH || '').replace(/\/$/, '');
/** Comma-separated extra slugs, e.g. /best-boarding-school-india-v1 (folder name must match slug) */
const LANDING_VARIANT_PATHS = (process.env.LANDING_VARIANT_PATHS || '')
    .split(',')
    .map((p) => p.trim().replace(/\/$/, ''))
    .filter(Boolean);

function collectLandingPaths() {
    const paths = new Set();
    if (LANDING_BASE_PATH) paths.add(LANDING_BASE_PATH);
    LANDING_VARIANT_PATHS.forEach((p) => paths.add(p));
    return [...paths];
}

function mountLandingAt(basePath) {
    const slug = basePath.replace(/^\//, '');
    const variantDir = path.join(STATIC_ROOT, slug);
    const hasVariantDir =
        fs.existsSync(variantDir) && fs.statSync(variantDir).isDirectory();

    if (hasVariantDir) {
        app.use(
            basePath,
            express.static(variantDir, { index: 'index.html', fallthrough: true }),
        );
    }
    app.use(basePath, express.static(STATIC_ROOT, { index: 'index.html' }));
}
const PUBLIC_SITE_URL = (
    process.env.PUBLIC_SITE_URL ||
    'https://admission-enquiry.theacademiccity.com'
).replace(/\/$/, '');

const ZOHO_ENDPOINT =
    'https://www.zohoapis.in/crm/v2/functions/landingpagecreatelead/actions/execute';
const ZOHO_ZAPIKEY = (process.env.ZOHO_ZAPIKEY || '').trim();

if (!ZOHO_ZAPIKEY) {
    console.error(
        'Fatal: ZOHO_ZAPIKEY is not set. Add it to server/.env (see server/env.example).',
    );
    process.exit(1);
}

const corsOrigins = new Set([
    PUBLIC_SITE_URL,
    'http://localhost:8765',
    'http://localhost:3010',
    'http://127.0.0.1:8765',
]);
if (process.env.CLIENT_URL) {
    corsOrigins.add(process.env.CLIENT_URL.replace(/\/$/, ''));
}

app.use(
    cors({
        origin(origin, callback) {
            if (!origin) return callback(null, true);
            const normalized = origin.replace(/\/$/, '');
            if (
                corsOrigins.has(normalized) ||
                /^https:\/\/([a-z0-9-]+\.)?theacademiccity\.com$/i.test(normalized)
            ) {
                return callback(null, true);
            }
            return callback(null, false);
        },
    }),
);
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

function parseUtmFromPageUrl(pageUrl) {
    try {
        const queryParams = new URL(pageUrl).searchParams;
        return {
            utm_source: queryParams.get('utm_source') || 'Direct-GAds',
            utm_medium: queryParams.get('utm_campaign') || 'unknown',
            utm_campaign: queryParams.get('adgroup') || 'unknown',
            utm_term: queryParams.get('utm_term') || 'none',
            utm_content: queryParams.get('utm_content') || 'none',
            utm_device: queryParams.get('utm_device') || '',
            A: queryParams.get('A') || '',
            G: queryParams.get('G') || '',
            HI: queryParams.get('HI') || '',
        };
    } catch {
        return {
            utm_source: 'Direct-GAds',
            utm_medium: 'unknown',
            utm_campaign: 'unknown',
            utm_term: 'none',
            utm_content: 'none',
            utm_device: '',
            A: '',
            G: '',
            HI: '',
        };
    }
}

function buildZohoLeadPayload(body, req) {
    const {
        studentFirstName,
        studentLastName,
        parentGuardianName,
        parentName,
        email,
        phone,
        preferredCampus,
        classLookingFor,
        questions,
        childAge,
        visitDate,
        selectedReasons,
        formType,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
        utm_device,
        A,
        G,
        HI,
        currentURL,
        countryCode,
    } = body;

    return {
        params: {
            First_Name: studentFirstName || '',
            Last_Name: studentLastName || '',
            Parent_Guardian_Name: parentGuardianName || parentName || '',
            Email: email || '',
            Country_Code: countryCode || '',
            Mobile: phone || '',
            Preferred_Campus: preferredCampus || 'Not Specified',
            Class_Looking_For: classLookingFor || '',
            Child_Age: childAge || '',
            Visit_Date: visitDate || '',
            Selected_Reasons: selectedReasons
                ? Array.isArray(selectedReasons)
                    ? selectedReasons.join(', ')
                    : selectedReasons
                : '',
            Lead_stage1: 'Untouched',
            Lead_Sub_Stage: 'New Lead',
            Lead_Super_Sub_Stage: 'NA',
            Lead_Source_Category: 'Digital Marketing',
            Lead_Source: utm_source || 'Direct',
            Lead_Sub_Source: utm_medium || 'NA',
            Lead_Super_Sub_Source: utm_campaign || 'NA',
            URL: currentURL || req.headers.referer || 'Unknown',
            UTM_Source: utm_source || '',
            UTM_Medium: utm_medium || '',
            Ad_Group: utm_campaign || '',
            UTM_Device: utm_device || '',
            UTM_Term: utm_term || '',
            UTM_Content: utm_content || '',
            UTM_Age_Group: A || '',
            UTM_Gender_Group: G || '',
            House_Hold_Income_Group: HI || '',
            Questions: questions || '',
            Form_Type: formType || 'General Inquiry',
        },
    };
}

async function submitLeadToZoho(body, req) {
    const leadData = buildZohoLeadPayload(body, req);
    const response = await axios.post(ZOHO_ENDPOINT, leadData, {
        headers: { 'Content-Type': 'application/json' },
        params: { auth_type: 'apikey', zapikey: ZOHO_ZAPIKEY },
    });
    return response.data;
}

function handleZohoError(error, res, format) {
    if (error.response) {
        const payload =
            format === 'enquiry'
                ? {
                      success: false,
                      message: 'Error adding lead',
                      error: error.response.data,
                  }
                : {
                      status: 'error',
                      message: 'Error adding lead',
                      error: error.response.data,
                  };
        res.status(error.response.status).json(payload);
        return;
    }

    const payload =
        format === 'enquiry'
            ? { success: false, message: 'Internal server error', error: error.message }
            : { status: 'error', message: 'Internal server error', error: error.message };
    res.status(500).json(payload);
}

app.get('/test', (req, res) => {
    res.json({ status: 'success', message: 'Server is running!' });
});

app.post('/addleads', async (req, res) => {
    try {
        const data = await submitLeadToZoho(req.body, req);
        res.status(200).json({
            status: 'success',
            message: 'Lead added successfully',
            data,
        });
    } catch (error) {
        handleZohoError(error, res, 'addleads');
    }
});

function normalizeCountryCode(countryCode) {
    const raw = (countryCode || '+91').trim().replace(/\s+/g, '');
    if (!raw) return '+91';
    return raw.startsWith('+') ? raw : `+${raw.replace(/\D/g, '')}`;
}

function normalizeEnquiryPhone(mobile, countryCode) {
    const raw = (mobile || '').trim();
    if (!raw) return '';
    if (raw.startsWith('+')) return raw.replace(/\s+/g, '');
    const dial = normalizeCountryCode(countryCode);
    const national = raw.replace(/\D/g, '');
    return `${dial}${national}`;
}

/** National number for Zoho Mobile when Country_Code is sent separately */
function nationalMobileForCrm(phoneE164, countryCode) {
    const dial = normalizeCountryCode(countryCode);
    const full = (phoneE164 || '').replace(/\s+/g, '');
    if (!full) return '';
    if (full.startsWith(dial)) return full.slice(dial.length);
    const digits = full.replace(/\D/g, '');
    const dialDigits = dial.replace(/\D/g, '');
    if (dialDigits && digits.startsWith(dialDigits)) {
        return digits.slice(dialDigits.length);
    }
    return digits;
}

/** Landing Page 1 — enquiry modal + inline form */
app.post('/api/enquiry', async (req, res) => {
    const {
        fname,
        lname,
        mobile,
        country_code,
        selectclass,
        campus,
        email,
        intent,
        page_url,
    } = req.body;

    const pageUrl = page_url || req.headers.referer || '';
    const utmFromUrl = parseUtmFromPageUrl(pageUrl);
    const formType =
        intent === 'brochure' ? 'Brochure Download' : 'General Inquiry';
    const dialForCrm = normalizeCountryCode(country_code);
    const phoneE164 = normalizeEnquiryPhone(mobile, dialForCrm);
    const mobileForCrm = nationalMobileForCrm(phoneE164, dialForCrm);

    const leadBody = {
        studentFirstName: fname || '',
        studentLastName: lname || '',
        email: (email || '').trim(),
        countryCode: dialForCrm,
        phone: mobileForCrm,
        preferredCampus: campus || 'Bangalore',
        classLookingFor: selectclass || '',
        formType,
        currentURL: pageUrl,
        utm_source: req.body.utm_source || utmFromUrl.utm_source,
        utm_medium: req.body.utm_medium || utmFromUrl.utm_medium,
        utm_campaign: req.body.utm_campaign || utmFromUrl.utm_campaign,
        utm_term: req.body.utm_term || utmFromUrl.utm_term,
        utm_content: req.body.utm_content || utmFromUrl.utm_content,
        utm_device: req.body.utm_device || utmFromUrl.utm_device,
        A: req.body.A || utmFromUrl.A,
        G: req.body.G || utmFromUrl.G,
        HI: req.body.HI || utmFromUrl.HI,
    };

    try {
        const data = await submitLeadToZoho(leadBody, req);
        res.status(200).json({
            success: true,
            message: 'Lead added successfully',
            data,
        });
    } catch (error) {
        handleZohoError(error, res, 'enquiry');
    }
});

const landingPaths = collectLandingPaths();
if (landingPaths.length) {
    landingPaths.forEach(mountLandingAt);
} else {
    app.use(express.static(STATIC_ROOT, { index: 'index.html' }));
}

app.listen(PORT, () => {
    const landingUrl = LANDING_BASE_PATH
        ? `${PUBLIC_SITE_URL}${LANDING_BASE_PATH}/`
        : `${PUBLIC_SITE_URL}/`;
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`Enquiry API: http://localhost:${PORT}/api/enquiry`);
    console.log(`Configured public site: ${PUBLIC_SITE_URL}`);
    if (landingPaths.length) {
        console.log(`Static landing paths: ${landingPaths.join(', ')}`);
    }
    console.log(`Expected live landing URL (set PUBLIC_SITE_URL): ${landingUrl}`);
    LANDING_VARIANT_PATHS.forEach((variantPath) => {
        console.log(`Variant URL: ${PUBLIC_SITE_URL}${variantPath}/`);
    });
});
