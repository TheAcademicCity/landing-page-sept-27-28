const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const {
    buildLeadCreatedEvent,
    buildRequestBody,
    sendLeadCreatedConversion,
    clearSentEventIdsForTests,
} = require('./openaiConversionsApi');

describe('openaiConversionsApi', () => {
    beforeEach(() => {
        clearSentEventIdsForTests();
    });

    const baseParams = {
        eventId: 'tacs-lead-test-event-001',
        timestampMs: 1730812800000,
        sourceUrl: 'https://example.com/page',
        oppref: 'oppref_sample',
        obref: 'obref-sample-uuid',
        phoneE164: '+919876543210',
        email: 'parent@example.com',
        zohoLeadId: '5750000000000123456',
        ipAddress: '203.0.113.1',
        userAgent: 'Mozilla/5.0 Test',
    };

    it('builds lead_created event with hashed user fields', () => {
        const event = buildLeadCreatedEvent(baseParams);
        assert.equal(event.id, baseParams.eventId);
        assert.equal(event.type, 'lead_created');
        assert.equal(event.timestamp_ms, baseParams.timestampMs);
        assert.equal(event.oppref, 'oppref_sample');
        assert.equal(event.data.type, 'customer_action');
        assert.ok(event.user.emails_sha256);
        assert.ok(event.user.phone_numbers_sha256);
        assert.ok(event.user.external_ids_sha256);
        assert.equal(event.user.obref, 'obref-sample-uuid');
        assert.equal(event.user.countries[0], 'IN');
    });

    it('includes validate_only when config says so', () => {
        const event = buildLeadCreatedEvent(baseParams);
        const body = buildRequestBody(event, {
            validateOnly: true,
            integrationSource: 'test',
        });
        assert.equal(body.validate_only, true);
        assert.equal(body.events.length, 1);
    });

    it('skips send when disabled', async () => {
        const result = await sendLeadCreatedConversion(baseParams, {
            config: {
                enabled: false,
                validateOnly: true,
                pixelId: 'px',
                apiKey: 'key',
                integrationSource: 'test',
            },
        });
        assert.equal(result.skipped, true);
        assert.equal(result.reason, 'disabled');
    });

    it('does not throw when HTTP post fails', async () => {
        const result = await sendLeadCreatedConversion(baseParams, {
            config: {
                enabled: true,
                validateOnly: true,
                pixelId: 'px_test',
                apiKey: 'sk_test',
                integrationSource: 'test',
            },
            httpPost: async () => {
                throw new Error('network down');
            },
        });
        assert.equal(result.ok, false);
        assert.equal(result.error, true);
    });

    it('retries on 503 with same event id', async () => {
        let calls = 0;
        const result = await sendLeadCreatedConversion(baseParams, {
            config: {
                enabled: true,
                validateOnly: true,
                pixelId: 'px_test',
                apiKey: 'sk_test',
                integrationSource: 'test',
            },
            httpPost: async () => {
                calls += 1;
                if (calls === 1) {
                    return { status: 503, data: {} };
                }
                return { status: 200, data: {} };
            },
        });
        assert.equal(result.ok, true);
        assert.equal(calls, 2);
    });
});
