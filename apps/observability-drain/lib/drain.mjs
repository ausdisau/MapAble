import { createHmac, timingSafeEqual } from 'node:crypto';

export const SPEED_INSIGHTS_SCHEMA = 'vercel.speed_insights.v1';
export const ALLOWED_METRIC_TYPES = new Set(['CLS', 'LCP', 'FID', 'FCP', 'TTFB', 'INP']);

export function verifyDrainSignature(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) return false;
  const expected = createHmac('sha1', secret).update(rawBody).digest('hex');
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function parseDrainPayload(rawBody, contentType = '') {
  const trimmed = rawBody.trim();
  if (!trimmed) return [];

  const looksNdjson = contentType.includes('ndjson') || (!trimmed.startsWith('[') && trimmed.includes('\n'));
  if (looksNdjson) {
    return trimmed
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }

  const parsed = JSON.parse(trimmed);
  return Array.isArray(parsed) ? parsed : [parsed];
}

export function sanitizeSpeedInsight(event, { includePath = false } = {}) {
  if (!event || typeof event !== 'object') throw new Error('invalid_event');
  if (event.schema !== SPEED_INSIGHTS_SCHEMA) throw new Error('unsupported_schema');
  if (!ALLOWED_METRIC_TYPES.has(event.metricType)) throw new Error('unsupported_metric_type');
  if (typeof event.value !== 'number' || !Number.isFinite(event.value)) throw new Error('invalid_metric_value');
  if (typeof event.timestamp !== 'string' || Number.isNaN(Date.parse(event.timestamp))) throw new Error('invalid_timestamp');
  if (typeof event.projectId !== 'string' || event.projectId.length < 1) throw new Error('invalid_project_id');

  const sanitized = {
    schema: SPEED_INSIGHTS_SCHEMA,
    timestamp: event.timestamp,
    projectId: event.projectId,
    metricType: event.metricType,
    value: event.value,
    origin: safeOrigin(event.origin),
    route: safeString(event.route, 500),
    country: safeString(event.country, 8),
    region: safeString(event.region, 32),
    osName: safeString(event.osName, 80),
    osVersion: safeString(event.osVersion, 80),
    clientName: safeString(event.clientName, 80),
    clientType: safeString(event.clientType, 40),
    clientVersion: safeString(event.clientVersion, 80),
    deviceType: safeString(event.deviceType, 40),
    deviceBrand: safeString(event.deviceBrand, 80),
    connectionSpeed: safeString(event.connectionSpeed, 40),
    browserEngine: safeString(event.browserEngine, 80),
    browserEngineVersion: safeString(event.browserEngineVersion, 80),
    scriptVersion: safeString(event.scriptVersion, 80),
    sdkVersion: safeString(event.sdkVersion, 80),
    sdkName: safeString(event.sdkName, 120),
    vercelEnvironment: safeString(event.vercelEnvironment, 40),
    deploymentId: safeString(event.deploymentId, 160),
  };

  if (includePath) sanitized.path = safePath(event.path);

  return Object.fromEntries(Object.entries(sanitized).filter(([, value]) => value !== undefined));
}

function safeString(value, maxLength) {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  return value.slice(0, maxLength);
}

function safeOrigin(value) {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return undefined;
  }
}

function safePath(value) {
  if (typeof value !== 'string' || !value.startsWith('/')) return undefined;
  const pathOnly = value.split(/[?#]/, 1)[0];
  return pathOnly.slice(0, 500);
}
