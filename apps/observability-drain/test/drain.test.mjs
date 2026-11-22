import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import {
  parseDrainPayload,
  sanitizeSpeedInsight,
  verifyDrainSignature,
} from '../lib/drain.mjs';

const baseEvent = {
  schema: 'vercel.speed_insights.v1',
  timestamp: '2026-08-18T00:00:00.000Z',
  projectId: 'prj_test',
  deviceId: 12345,
  metricType: 'LCP',
  value: 2.1,
  origin: 'https://mapable.com.au/path?secret=1',
  path: '/participant/abc?token=nope',
  route: '/participant/[id]',
  city: 'Sydney',
  country: 'AU',
  attribution: 'sensitive-ish-data',
};

test('verifies the Vercel drain HMAC over the raw body', () => {
  const raw = JSON.stringify([baseEvent]);
  const secret = 'test-secret';
  const signature = createHmac('sha1', secret).update(raw).digest('hex');
  assert.equal(verifyDrainSignature(raw, signature, secret), true);
  assert.equal(verifyDrainSignature(raw, 'bad', secret), false);
});

test('parses JSON arrays and NDJSON', () => {
  assert.equal(parseDrainPayload(JSON.stringify([baseEvent]), 'application/json').length, 1);
  const ndjson = `${JSON.stringify(baseEvent)}\n${JSON.stringify(baseEvent)}`;
  assert.equal(parseDrainPayload(ndjson, 'application/x-ndjson').length, 2);
});

test('drops device id, city, attribution and path by default', () => {
  const sanitized = sanitizeSpeedInsight(baseEvent);
  assert.equal('deviceId' in sanitized, false);
  assert.equal('city' in sanitized, false);
  assert.equal('attribution' in sanitized, false);
  assert.equal('path' in sanitized, false);
  assert.equal(sanitized.route, '/participant/[id]');
  assert.equal(sanitized.origin, 'https://mapable.com.au');
});

test('can include a query-free path only when explicitly enabled', () => {
  const sanitized = sanitizeSpeedInsight(baseEvent, { includePath: true });
  assert.equal(sanitized.path, '/participant/abc');
});

test('rejects unsupported schemas and invalid metric values', () => {
  assert.throws(() => sanitizeSpeedInsight({ ...baseEvent, schema: 'other' }), /unsupported_schema/);
  assert.throws(() => sanitizeSpeedInsight({ ...baseEvent, value: Number.NaN }), /invalid_metric_value/);
});
