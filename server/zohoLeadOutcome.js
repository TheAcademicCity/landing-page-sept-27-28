/**
 * Classify Zoho CRM Functions execute responses for landingpagecreatelead.
 * Verified: details.output is a JSON string of the Deluge return map.
 */

const CRM_OUTCOMES = Object.freeze({
    CREATED: 'created',
    DUPLICATE: 'duplicate',
    CRM_ERROR: 'crm_error',
    EXECUTE_FAILED: 'execute_failed',
    MALFORMED: 'malformed',
});

function parseDelugeOutput(rawOutput) {
    if (rawOutput == null) {
        return { ok: false, reason: 'missing_output' };
    }
    if (typeof rawOutput === 'object' && !Array.isArray(rawOutput)) {
        return { ok: true, inner: rawOutput };
    }
    if (typeof rawOutput !== 'string') {
        return { ok: false, reason: 'invalid_output_type' };
    }
    const trimmed = rawOutput.trim();
    if (!trimmed) {
        return { ok: false, reason: 'empty_output' };
    }
    if (trimmed.charAt(0) !== '{' && trimmed.charAt(0) !== '[') {
        return { ok: false, reason: 'non_json_output' };
    }
    try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            return { ok: false, reason: 'unexpected_json_shape' };
        }
        return { ok: true, inner: parsed };
    } catch (e) {
        return { ok: false, reason: 'json_parse_error' };
    }
}

function classifyDelugeMap(inner) {
    if (!inner || typeof inner !== 'object') {
        return { crm_outcome: CRM_OUTCOMES.MALFORMED, leadId: null };
    }

    const code = inner.code != null ? String(inner.code) : '';
    if (code === 'DUPLICATE_DATA') {
        const existingId =
            inner.details && inner.details.id != null
                ? String(inner.details.id)
                : null;
        return {
            crm_outcome: CRM_OUTCOMES.DUPLICATE,
            leadId: existingId,
        };
    }

    if (code && (inner.status === 'error' || code !== 'SUCCESS')) {
        return {
            crm_outcome: CRM_OUTCOMES.CRM_ERROR,
            leadId: null,
            errorCode: code,
        };
    }

    if (inner.id != null && String(inner.id).trim() !== '') {
        return {
            crm_outcome: CRM_OUTCOMES.CREATED,
            leadId: String(inner.id).trim(),
        };
    }

    return { crm_outcome: CRM_OUTCOMES.MALFORMED, leadId: null };
}

/**
 * @param {unknown} zohoExecuteBody - axios response.data from Functions execute
 * @returns {{ crm_outcome: string, conversion_eligible: boolean, leadId: string|null, errorCode?: string }}
 */
function classifyZohoLandingPageLeadOutcome(zohoExecuteBody) {
    if (!zohoExecuteBody || typeof zohoExecuteBody !== 'object') {
        return {
            crm_outcome: CRM_OUTCOMES.MALFORMED,
            conversion_eligible: false,
            leadId: null,
        };
    }

    const executeCode =
        zohoExecuteBody.code != null ? String(zohoExecuteBody.code) : '';
    if (executeCode !== 'success') {
        return {
            crm_outcome: CRM_OUTCOMES.EXECUTE_FAILED,
            conversion_eligible: false,
            leadId: null,
            errorCode: executeCode || undefined,
        };
    }

    const details = zohoExecuteBody.details;
    const rawOutput = details && details.output;
    const parsed = parseDelugeOutput(rawOutput);
    if (!parsed.ok) {
        return {
            crm_outcome: CRM_OUTCOMES.MALFORMED,
            conversion_eligible: false,
            leadId: null,
        };
    }

    const classified = classifyDelugeMap(parsed.inner);
    const conversion_eligible =
        classified.crm_outcome === CRM_OUTCOMES.CREATED;
    return {
        crm_outcome: classified.crm_outcome,
        conversion_eligible,
        leadId: classified.leadId,
        errorCode: classified.errorCode,
    };
}

module.exports = {
    CRM_OUTCOMES,
    classifyZohoLandingPageLeadOutcome,
    parseDelugeOutput,
    classifyDelugeMap,
};
