import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudioServer } from './server.mjs';

test('private Studio isolates tokens, rejects cross-origin writes and authenticates every access', async t => {
  const calls = [];
  const server = createStudioServer({ cms: 'http://cms.test', origin: 'http://studio.test', adminEmail: 'owner@example.com', secret: 's'.repeat(48), secure: true,
    fetch: async (url, options = {}) => {
      calls.push({ url, options });
      if (url.endsWith('/auth/login')) return Response.json({ data: { access_token: 'private-access', refresh_token: 'private-refresh', expires: 900000 } });
      if (url.includes('/users/me')) return Response.json({ data: { id: '00000000-0000-4000-a000-000000000001', email: 'owner@example.com', first_name: 'Owner', role: { id: 'admin-role' } } });
      if (url.endsWith('/auth/logout')) return Response.json({ data: null });
      return Response.json({ data: [] });
    },
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  let response = await fetch(base + '/api/products'); assert.equal(response.status, 401);
  response = await fetch(base + '/api/login', { method: 'POST', headers: { Origin: 'https://attacker.test', 'Content-Type': 'application/json' }, body: '{}' }); assert.equal(response.status, 403); assert.equal(calls.length, 0);
  response = await fetch(base + '/api/login', { method: 'POST', headers: { Origin: 'http://studio.test', 'Content-Type': 'text/plain' }, body: '{}' }); assert.equal(response.status, 415);
  response = await fetch(base + '/api/login', { method: 'POST', headers: { Origin: 'http://studio.test', 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'owner@example.com', password: 'secret' }) });
  assert.equal(response.status, 200);
  const raw = response.headers.get('set-cookie'), cookie = raw.split(';')[0];
  assert(raw.includes('HttpOnly')); assert(raw.includes('SameSite=Strict')); assert(raw.includes('Secure'));
  assert(!raw.includes('private-access')); assert(!raw.includes('private-refresh'));
  assert(!JSON.stringify(await response.json()).includes('private-'));
  response = await fetch(base + '/api/me', { headers: { Cookie: cookie } }); assert.equal(response.status, 200);
  response = await fetch(base + '/api/products', { headers: { Cookie: cookie } }); assert.equal(response.status, 200);
  response = await fetch(base + '/api/products', { method: 'POST', headers: { Cookie: cookie, Origin: 'http://studio.test', 'Content-Type': 'application/json' }, body: JSON.stringify({ name_es: 'X', source: 'malicious' }) }); assert.equal(response.status, 400);
  response = await fetch(base + '/api/orders', { method: 'POST', headers: { Cookie: cookie, Origin: 'http://studio.test', 'Content-Type': 'application/json' }, body: JSON.stringify({ payment_status: 'paid' }) }); assert.equal(response.status, 400);
  const profiles = calls.filter(call => call.url.includes('/users/me')); assert(profiles.length >= 4);
  response = await fetch(base + '/api/me', { headers: { Cookie: cookie + 'tampered' } }); assert.equal(response.status, 401);
  response = await fetch(base + '/server.mjs'); assert.equal(response.status, 404);
  response = await fetch(base + '/'); assert.equal(response.status, 200); assert(response.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
});

test('a valid Directus account outside the allowed Studio identity is refused', async t => {
  const server = createStudioServer({ cms: 'http://cms.test', origin: 'http://studio.test', adminEmail: 'owner@example.com', secret: 's'.repeat(48),
    fetch: async url => Response.json({ data: url.includes('/users/me') ? { id: 'stranger', email: 'stranger@example.com', role: { id: 'other' } } : { access_token: 'token', refresh_token: 'refresh', expires: 900000 } }),
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); t.after(() => new Promise(resolve => server.close(resolve)));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/login`, { method: 'POST', headers: { Origin: 'http://studio.test', 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'stranger@example.com', password: 'secret' }) });
  assert.equal(response.status, 403); assert(!response.headers.get('set-cookie'));
});
