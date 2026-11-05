const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
    classifyZohoLandingPageLeadOutcome,
    CRM_OUTCOMES,
    parseDelugeOutput,
} = require('./zohoLeadOutcome');

const fixturesDir = path.join(__dirname, 'fixtures');

function loadFixture(name) {
    return JSON.parse(
        fs.readFileSync(path.join(fixturesDir, name), 'utf8'),
    );
}

describe('classifyZohoLandingPageLeadOutcome', () => {
    it('classifies sanitized production create fixture as created', () => {
        const body = loadFixture('zoho-execute-created.json');
        const result = classifyZohoLandingPageLeadOutcome(body);
        assert.equal(result.crm_outcome, CRM_OUTCOMES.CREATED);
        assert.equal(result.conversion_eligible, true);
        assert.equal(result.leadId, '5750000000000123456');
    });

    it('classifies sanitized production duplicate fixture as duplicate', () => {
        const body = loadFixture('zoho-execute-duplicate.json');
        const result = classifyZohoLandingPageLeadOutcome(body);
        assert.equal(result.crm_outcome, CRM_OUTCOMES.DUPLICATE);
        assert.equal(result.conversion_eligible, false);
        assert.equal(result.leadId, '5750000000000654321');
    });

    it('classifies CRM validation error without conversion', () => {
        const body = loadFixture('zoho-execute-crm-error.json');
        const result = classifyZohoLandingPageLeadOutcome(body);
        assert.equal(result.crm_outcome, CRM_OUTCOMES.CRM_ERROR);
        assert.equal(result.conversion_eligible, false);
        assert.equal(result.errorCode, 'MANDATORY_NOT_FOUND');
    });

    it('handles already-parsed object output (defensive)', () => {
        const inner = {
            id: '5750000000000999999',
            Created_Time: '2026-01-01T00:00:00+05:30',
        };
        const body = {
            code: 'success',
            details: { output_type: 'map', output: inner },
        };
        const result = classifyZohoLandingPageLeadOutcome(body);
        assert.equal(result.crm_outcome, CRM_OUTCOMES.CREATED);
        assert.equal(result.conversion_eligible, true);
    });

    it('rejects malformed JSON string output', () => {
        const body = {
            code: 'success',
            details: { output_type: 'string', output: '{not valid json' },
        };
        const result = classifyZohoLandingPageLeadOutcome(body);
        assert.equal(result.crm_outcome, CRM_OUTCOMES.MALFORMED);
        assert.equal(result.conversion_eligible, false);
    });

    it('rejects execute envelope failure', () => {
        const result = classifyZohoLandingPageLeadOutcome({
            code: 'INVALID_DATA',
            message: 'bad request',
        });
        assert.equal(result.crm_outcome, CRM_OUTCOMES.EXECUTE_FAILED);
        assert.equal(result.conversion_eligible, false);
    });

    it('rejects missing output', () => {
        const result = classifyZohoLandingPageLeadOutcome({
            code: 'success',
            details: { output_type: 'string' },
        });
        assert.equal(result.crm_outcome, CRM_OUTCOMES.MALFORMED);
    });
});

describe('parseDelugeOutput', () => {
    it('parses JSON string to object', () => {
        const parsed = parseDelugeOutput('{"id":"1"}');
        assert.equal(parsed.ok, true);
        assert.equal(parsed.inner.id, '1');
    });
});
