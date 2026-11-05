const axios = require('axios');
const {
    hashEmailForOpenAi,
    hashPhoneForOpenAi,
    hashExternalIdForOpenAi,
} = require('./openaiIdentityHash');

const OPENAI_EVENTS_URL = 'https://bzr.openai.com/v1/events';

function envFlag(name, defaultValue) {
    const raw = (process.env[name] || '').trim().toLowerCase();
    if (!raw) return defaultValue;
    return raw === '1' || raw === 'true' || raw === 'yes';
}

function getOpenAiCapiConfig() {
    return {
        enabled: envFlag('OPENAI_CAPI_ENABLED', false),
        validateOnly: envFlag('OPENAI_CAPI_VALIDATE_ONLY', false),
        pixelId: (process.env.OPENAI_PIXEL_ID || '').trim(),
        apiKey: (process.env.OPENAI_CAPI_KEY || '').trim(),
        integrationSource:
            (process.env.OPENAI_CAPI_INTEGRATION_SOURCE || '').trim() ||
            'tacs_admission_enquiry',
    };
}

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
        return forwarded.split(',')[0].trim();
    }
    if (req.ip) return String(req.ip);
    return undefined;
}

/**
 * Build a single lead_created event (no secrets in return value for logging).
 */
function buildLeadCreatedEvent(params) {
    const {
        eventId,
        timestampMs,
        sourceUrl,
        oppref,
        obref,
        phoneE164,
        email,
        zohoLeadId,
        ipAddress,
        userAgent,
    } = params;

    const user = {};
    const emailHash = hashEmailForOpenAi(email);
    if (emailHash) user.emails_sha256 = [emailHash];
    const phoneHash = hashPhoneForOpenAi(phoneE164);
    if (phoneHash) user.phone_numbers_sha256 = [phoneHash];
    const externalHash = hashExternalIdForOpenAi(zohoLeadId);
    if (externalHash) user.external_ids_sha256 = [externalHash];
    if (obref && String(obref).trim()) {
        user.obref = String(obref).trim();
    }
    if (ipAddress) user.ip_address = ipAddress;
    if (userAgent) user.user_agent = userAgent;
    user.countries = ['IN'];

    const event = {
        id: eventId,
        type: 'lead_created',
        timestamp_ms: timestampMs,
        source_url: sourceUrl || undefined,
        action_source: 'web',
        data: { type: 'customer_action' },
    };
    if (oppref && String(oppref).trim()) {
        event.oppref = String(oppref).trim();
    }
    if (Object.keys(user).length) {
        event.user = user;
    }
    return event;
}

function buildRequestBody(event, config) {
    return {
        validate_only: config.validateOnly,
        integration_source: config.integrationSource,
        events: [event],
    };
}

const sentEventIds = new Set();

async function postEvents(config, body) {
    const url = `${OPENAI_EVENTS_URL}?pid=${encodeURIComponent(config.pixelId)}`;
    return axios.post(url, body, {
        headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
        },
        timeout: 15000,
        validateStatus: () => true,
    });
}

function shouldRetry(status) {
    return status >= 500 && status <= 599;
}

/**
 * Send lead_created to OpenAI CAPI. Never throws to caller; logs safe metadata only.
 */
async function sendLeadCreatedConversion(params, options = {}) {
    const config = options.config || getOpenAiCapiConfig();
    if (!config.enabled) {
        return { skipped: true, reason: 'disabled' };
    }
    if (!config.pixelId || !config.apiKey) {
        console.warn(
            '[openai-capi] skipped: OPENAI_PIXEL_ID or OPENAI_CAPI_KEY missing',
        );
        return { skipped: true, reason: 'missing_credentials' };
    }

    const eventId = params.eventId;
    if (sentEventIds.has(eventId)) {
        return { skipped: true, reason: 'already_sent' };
    }

    const event = buildLeadCreatedEvent(params);
    const body = buildRequestBody(event, config);
    const httpPost = options.httpPost || postEvents;

    let lastStatus = 0;
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            const response = await httpPost(config, body);
            lastStatus = response.status;
            if (response.status >= 200 && response.status < 300) {
                sentEventIds.add(eventId);
                console.log(
                    `[openai-capi] event_id=${eventId} status=${response.status} validate_only=${config.validateOnly}`,
                );
                return { ok: true, status: response.status };
            }
            if (!shouldRetry(response.status) || attempt === maxAttempts) {
                console.warn(
                    `[openai-capi] event_id=${eventId} status=${response.status} attempt=${attempt}`,
                );
                return { ok: false, status: response.status };
            }
        } catch (err) {
            console.warn(
                `[openai-capi] event_id=${eventId} error attempt=${attempt}`,
            );
            if (attempt === maxAttempts) {
                return { ok: false, error: true };
            }
        }
    }
    return { ok: false, status: lastStatus };
}

function clearSentEventIdsForTests() {
    sentEventIds.clear();
}

module.exports = {
    getOpenAiCapiConfig,
    buildLeadCreatedEvent,
    buildRequestBody,
    sendLeadCreatedConversion,
    getClientIp,
    clearSentEventIdsForTests,
};
