const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    hashEmailForOpenAi,
    hashPhoneForOpenAi,
    hashExternalIdForOpenAi,
    normalizePhoneForOpenAi,
} = require('./openaiIdentityHash');

describe('openaiIdentityHash', () => {
    it('normalizes and hashes email deterministically', () => {
        const hash = hashEmailForOpenAi('  Jane@Company.COM ');
        assert.equal(hash, hashEmailForOpenAi('jane@company.com'));
        assert.match(hash, /^[a-f0-9]{64}$/);
    });

    it('normalizes Indian mobile from E.164', () => {
        assert.equal(normalizePhoneForOpenAi('+91 98765 43210'), '919876543210');
        const hash = hashPhoneForOpenAi('+919876543210');
        assert.ok(hash);
        assert.match(hash, /^[a-f0-9]{64}$/);
    });

    it('returns null for empty email', () => {
        assert.equal(hashEmailForOpenAi(''), null);
    });

    it('hashes external id with trim only', () => {
        const a = hashExternalIdForOpenAi(' 5750000000000123456 ');
        const b = hashExternalIdForOpenAi('5750000000000123456');
        assert.equal(a, b);
    });
});
