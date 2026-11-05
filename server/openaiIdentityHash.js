const crypto = require('crypto');

function sha256Hex(value) {
    return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

/** OpenAI Ads: trim, lowercase, SHA-256 hex. */
function hashEmailForOpenAi(email) {
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized) return null;
    return sha256Hex(normalized);
}

/** OpenAI Ads: digits only (after stripping +, spaces, punctuation), drop leading zeros, 8–15 digits. */
function normalizePhoneForOpenAi(phoneE164) {
    let digits = String(phoneE164 || '')
        .replace(/[\s().\-]/g, '')
        .replace(/^\+/, '')
        .replace(/\D/g, '');
    digits = digits.replace(/^0+/, '');
    if (digits.length < 8 || digits.length > 15) return null;
    return digits;
}

function hashPhoneForOpenAi(phoneE164) {
    const normalized = normalizePhoneForOpenAi(phoneE164);
    if (!normalized) return null;
    return sha256Hex(normalized);
}

/** OpenAI Ads external id: trim whitespace, preserve case, SHA-256 hex. */
function hashExternalIdForOpenAi(externalId) {
    const normalized = String(externalId || '').trim();
    if (!normalized) return null;
    return sha256Hex(normalized);
}

module.exports = {
    hashEmailForOpenAi,
    hashPhoneForOpenAi,
    hashExternalIdForOpenAi,
    normalizePhoneForOpenAi,
    sha256Hex,
};
