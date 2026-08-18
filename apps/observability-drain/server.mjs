import { createServer } from 'node:http';
import {
  parseDrainPayload,
  sanitizeSpeedInsight,
  verifyDrainSignature,
} from './lib/drain.mjs';

const PORT = Number(process.env.PORT ?? 3000);
const MAX_BODY_BYTES = Number(process.env.DRAIN_MAX_BODY_BYTES ?? 2_000_000);
const FORWARD_TIMEOUT_MS = Number(process.env.DRAIN_FORWARD_TIMEOUT_MS ?? 5_000);

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

  if (request.method === 'GET' && url.pathname === '/health') {
    return json(response, 200, {
      status: 'ok',
      service: 'mapable-observability-drain',
      forwardingConfigured: Boolean(process.env.DRAIN_FORWARD_URL),
    });
  }

  if (request.method !== 'POST' || url.pathname !== '/v1/vercel/speed-insights') {
    return json(response, 404, { error: 'not_found' });
  }

  const secret = process.env.VERCEL_DRAIN_SECRET;
  if (!secret) {
    console.error(JSON.stringify({ level: 'error', msg: 'drain_secret_missing' }));
    return json(response, 503, { error: 'receiver_not_configured' });
  }

  let rawBody;
  try {
    rawBody = await readRawBody(request, MAX_BODY_BYTES);
  } catch (error) {
    const code = error instanceof Error ? error.message : 'invalid_body';
    return json(response, code === 'body_too_large' ? 413 : 400, { error: code });
  }

  const signature = headerValue(request.headers['x-vercel-signature']);
  if (!verifyDrainSignature(rawBody, signature, secret)) {
    console.warn(JSON.stringify({ level: 'warning', msg: 'drain_signature_rejected' }));
    return json(response, 401, { error: 'invalid_signature' });
  }

  let events;
  try {
    const parsed = parseDrainPayload(rawBody, headerValue(request.headers['content-type']));
    if (parsed.length === 0) return json(response, 400, { error: 'empty_batch' });
    if (parsed.length > 10_000) return json(response, 413, { error: 'too_many_events' });
    const includePath = process.env.MAPABLE_DRAIN_INCLUDE_PATH === 'true';
    events = parsed.map((event) => sanitizeSpeedInsight(event, { includePath }));
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'invalid_payload';
    console.warn(JSON.stringify({ level: 'warning', msg: 'drain_payload_rejected', reason }));
    return json(response, 400, { error: reason });
  }

  const summary = summarize(events);
  console.log(JSON.stringify({
    level: 'info',
    msg: 'speed_insights_batch_accepted',
    eventCount: events.length,
    metricTypes: summary.metricTypes,
    projects: summary.projects,
    environments: summary.environments,
  }));

  if (process.env.DRAIN_FORWARD_URL) {
    try {
      const forwarded = await forwardBatch(events);
      if (!forwarded.ok) {
        console.error(JSON.stringify({
          level: 'error',
          msg: 'drain_forward_failed',
          status: forwarded.status,
        }));
        return json(response, 502, { error: 'forward_failed' });
      }
    } catch (error) {
      console.error(JSON.stringify({
        level: 'error',
        msg: 'drain_forward_exception',
        error: error instanceof Error ? error.name : 'unknown_error',
      }));
      return json(response, 502, { error: 'forward_failed' });
    }
  }

  return json(response, 202, {
    accepted: events.length,
    forwarded: Boolean(process.env.DRAIN_FORWARD_URL),
  });
});

server.listen(PORT, () => {
  console.log(JSON.stringify({ level: 'info', msg: 'drain_receiver_started', port: PORT }));
});

async function readRawBody(request, maxBytes) {
  const declared = Number(headerValue(request.headers['content-length']) || 0);
  if (declared > maxBytes) throw new Error('body_too_large');

  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > maxBytes) throw new Error('body_too_large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function forwardBatch(events) {
  const headers = { 'content-type': 'application/json' };
  if (process.env.DRAIN_FORWARD_AUTHORIZATION) {
    headers.authorization = process.env.DRAIN_FORWARD_AUTHORIZATION;
  }

  return fetch(process.env.DRAIN_FORWARD_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(events),
    signal: AbortSignal.timeout(FORWARD_TIMEOUT_MS),
  });
}

function summarize(events) {
  return {
    metricTypes: [...new Set(events.map((event) => event.metricType))].sort(),
    projects: [...new Set(events.map((event) => event.projectId))].slice(0, 20),
    environments: [...new Set(events.map((event) => event.vercelEnvironment).filter(Boolean))],
  };
}

function headerValue(value) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function json(response, status, body) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}
