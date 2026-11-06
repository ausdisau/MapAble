import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TppWholesaleClient, normaliseTppDomain, TPP_WHOLESALE_ORIGIN,
} from '../../lib/provider-cloud/tpp-wholesale/client.ts';
import { isTppWholesaleReadOnlyEnabled } from '../../lib/provider-cloud/tpp-wholesale/config.ts';

const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.signature';
const result = { domain: 'my-provider.com.au', available: true,
  premium: false, prices: [{ years: 1, price: 11.95 }] };
function transport(override = result) {
  const calls = [];
  const fetchMock = async (url, options) => {
    calls.push({ url, options });
    if (url === TPP_WHOLESALE_ORIGIN + '/jwt/auth/token/') {
      return new Response(jwt, { status: 200 });
    }
    if (url === TPP_WHOLESALE_ORIGIN + '/domains/my-provider.com.au/check-availability') {
      return new Response(JSON.stringify(override), { status: 200 });
    }
    throw new Error('unexpected destination');
  };
  return { calls, fetchMock };
}

test('default disabled', () => assert.equal(isTppWholesaleReadOnlyEnabled({}), false));
test('fixed egress is mandatory', () => assert.equal(isTppWholesaleReadOnlyEnabled({
  MAPABLE_PROVIDER_CLOUD_ENABLED: 'true', MAPABLE_TPP_WHOLESALE_READONLY_ENABLED: 'true',
}), false));
test('production hard denied', () => assert.equal(isTppWholesaleReadOnlyEnabled({
  MAPABLE_PROVIDER_CLOUD_ENABLED: 'true', MAPABLE_TPP_WHOLESALE_READONLY_ENABLED: 'true',
  MAPABLE_TPP_WHOLESALE_FIXED_EGRESS_VERIFIED: 'true', VERCEL_ENV: 'production',
}), false));
test('preview requires three affirmative gates', () => assert.equal(isTppWholesaleReadOnlyEnabled({
  MAPABLE_PROVIDER_CLOUD_ENABLED: 'true', MAPABLE_TPP_WHOLESALE_READONLY_ENABLED: 'true',
  MAPABLE_TPP_WHOLESALE_FIXED_EGRESS_VERIFIED: 'true', VERCEL_ENV: 'preview',
  NODE_ENV: 'production',
}), true));
for (const bad of ['https://evil.com', 'example.com', 'www.example.org', 'a.test',
  'localhost', '127.0.0.1', 'evil.internal', 'bad..com.au', 'x.com.au:443',
  'x.com.au/path', 'a_b.com.au', 'a..com']) {
  test('invalid domains cannot trigger outbound traffic: ' + bad, async () => {
    const mock = transport();
    const client = new TppWholesaleClient({apiKey:'key',secretKey:'secret',transport:mock.fetchMock});
    await assert.rejects(() => client.checkAvailability(bad), {code:'INVALID_DOMAIN'});
    assert.equal(mock.calls.length, 0);
  });
}
test('canonical domain lowercased', () => assert.equal(normaliseTppDomain('My-Provider.COM.AU.'),'my-provider.com.au'));
test('real auth, bearer GET and bounded response fields', async () => {
  const mock = transport({ ...result, unexpected:'private' });
  const client = new TppWholesaleClient({apiKey:'key',secretKey:'secret',transport:mock.fetchMock});
  const out = await client.checkAvailability('MY-PROVIDER.COM.AU');
  assert.equal(mock.calls.length, 2);
  assert.equal(mock.calls[0].options.method, 'POST');
  assert.deepEqual(JSON.parse(mock.calls[0].options.body), {apiKey:'key',secretKey:'secret'});
  assert.equal(mock.calls[1].options.method, 'GET');
  assert.equal(mock.calls[1].options.headers.Authorization, 'Bearer ' + jwt);
  assert.equal(out.domain, 'my-provider.com.au');
  assert.equal(out.orderStatus, 'not_requested');
  assert.equal(out.currency, 'unconfirmed');
  assert.equal('unexpected' in out, false);
});
test('jwt cached', async () => {
  const mock = transport();
  const client = new TppWholesaleClient({apiKey:'key',secretKey:'secret',transport:mock.fetchMock});
  await client.checkAvailability('my-provider.com.au');
  await client.checkAvailability('my-provider.com.au');
  assert.equal(mock.calls.length, 3);
});
test('reject mismatched domain responses', async () => {
  const mock = transport({...result,domain:'other.com.au'});
  const client = new TppWholesaleClient({apiKey:'key',secretKey:'secret',transport:mock.fetchMock});
  await assert.rejects(() => client.checkAvailability('my-provider.com.au'), {code:'TPP_INVALID_RESPONSE'});
});
test('missing credentials fail closed', () => {
  assert.throws(() => new TppWholesaleClient({apiKey:'',secretKey:''}),{code:'TPP_CONFIGURATION_MISSING'});
});
test('a single 401 reauth succeeds without extra retries', async () => {
  let requests = 0;
  const fetchMock = async (url) => {
    requests++;
    if (url.endsWith('/jwt/auth/token/')) return new Response(jwt, {status:200});
    if (requests === 2) return new Response('', {status:401});
    return new Response(JSON.stringify(result), {status:200});
  };
  const client = new TppWholesaleClient({apiKey:'key',secretKey:'secret',transport:fetchMock});
  assert.equal((await client.checkAvailability('my-provider.com.au')).available,true);
  assert.equal(requests,4);
});
