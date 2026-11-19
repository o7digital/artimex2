import http from 'node:http';
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { InputError, validateProduct, validateCustomer, readCsv, previewImport, inspectXml, makeOrder, stableId, checksum } from './commerce.mjs';
import { createErp } from './erp.mjs';
import { publicProduct, publicProductFields } from './catalog-contract.mjs';

const uuid = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const collections = { products: 'commerce_products', customers: 'commerce_customers', orders: 'commerce_orders', imports: 'commerce_imports', sync: 'commerce_sync_jobs' };
export function createStudioServer(options = {}) {
  const config = {
    cms: process.env.DIRECTUS_URL, cmsPublic: process.env.PUBLIC_DIRECTUS_URL, secret: process.env.STUDIO_SESSION_SECRET,
    origin: process.env.STUDIO_ORIGIN, adminEmail: process.env.STUDIO_ADMIN_EMAIL,
    editorRole: process.env.STUDIO_EDITOR_ROLE_ID, readToken: process.env.STOREFRONT_READ_TOKEN,
    preview: process.env.STUDIO_PREVIEW_URL || 'https://artimex2-git-dev-olivier-steineur.vercel.app',
    secure: process.env.NODE_ENV === 'production', fetch, ...options,
  };
  if (!config.cms || !config.origin || !config.secret || config.secret.length < 32 || !config.adminEmail) throw new Error('Configure DIRECTUS_URL, STUDIO_ORIGIN, STUDIO_ADMIN_EMAIL and STUDIO_SESSION_SECRET (32+ characters).');
  const key = createHash('sha256').update(config.secret).digest();
  const attempts = new Map(), refreshing = new Map();
  let importQueue = Promise.resolve();
  const activeImports = new Set();
  function seal(data) {
    const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(data)), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
  }
  function session(req) {
    try {
      const cookie = (req.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith('artimex_studio='))?.slice(15);
      if (!cookie || cookie.length > 3800) return null;
      const bytes = Buffer.from(cookie, 'base64url');
      const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
      decipher.setAuthTag(bytes.subarray(12, 28));
      const value = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString());
      return value.until > Date.now() ? value : null;
    } catch { return null; }
  }
  function cookie(res, value) {
    const encoded = value ? seal(value) : '';
    if (encoded.length > 3800) throw new InputError('No se pudo guardar la sesión.', 500);
    res.setHeader('Set-Cookie', `artimex_studio=${encoded}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${value ? 7 * 86400 : 0}${config.secure ? '; Secure' : ''}`);
  }
  async function api(path, token, method = 'GET', data) {
    const response = await config.fetch(config.cms.replace(/\/$/, '') + path, {
      method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(data === undefined || data instanceof FormData ? {} : { 'Content-Type': 'application/json' }) },
      body: data === undefined ? undefined : data instanceof FormData ? data : JSON.stringify(data), signal: AbortSignal.timeout(30000), redirect: 'error',
    });
    const payload = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const status = [401, 403, 404, 409, 429].includes(response.status) ? response.status : 502;
      throw new InputError(status === 401 ? 'Sesión terminada. Vuelve a entrar.' : status === 403 ? 'Tu cuenta no tiene acceso a esta acción.' : 'Directus no pudo completar la solicitud. Revisa los datos e inténtalo de nuevo.', status);
    }
    return payload;
  }
  const erp = createErp({ api });
  const owner = profile => profile?.email?.toLowerCase() === config.adminEmail.toLowerCase() || (config.editorRole && (profile?.role?.id || profile?.role) === config.editorRole);
  async function authenticate(req, res) {
    const s = session(req);
    if (!s) throw new InputError('Inicia sesión para continuar.', 401);
    if (s.accessUntil < Date.now() + 15000) {
      const refreshKey = checksum(s.refresh);
      let entry = refreshing.get(refreshKey);
      if (!entry || entry.until < Date.now()) {
        const promise = api('/auth/refresh', null, 'POST', { refresh_token: s.refresh, mode: 'json' }).then(result => result.data);
        entry = { promise, until: Date.now() + 10000 }; refreshing.set(refreshKey, entry);
        if (refreshing.size > 100) for (const [id, item] of refreshing) if (item.until < Date.now()) refreshing.delete(id);
      }
      const auth = await entry.promise;
      s.access = auth.access_token; s.refresh = auth.refresh_token; s.accessUntil = Date.now() + auth.expires;
      cookie(res, s);
    }
    const { data: profile } = await api('/users/me?fields=id,email,first_name,last_name,role.id', s.access);
    if (!owner(profile)) throw new InputError('Esta cuenta no tiene acceso al Studio Artimex.', 403);
    s.profile = profile;
    return s;
  }
  async function body(req) {
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) throw new InputError('Se requiere JSON.', 415);
    const limit = 3 * 1024 * 1024;
    if (Number(req.headers['content-length']) > limit) throw new InputError('Archivo demasiado grande.', 413);
    const chunks = []; let size = 0;
    for await (const chunk of req) { size += chunk.length; if (size > limit) throw new InputError('Archivo demasiado grande.', 413); chunks.push(chunk); }
    try { return JSON.parse(Buffer.concat(chunks).toString()); } catch { throw new InputError('JSON inválido.'); }
  }
  function send(res, data, status = 200) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); }
  async function getItem(name, id, access, fields = '*') {
    if (!uuid.test(id || '')) throw new InputError('Identificador inválido.');
    return (await api(`/items/${collections[name]}/${id}?fields=${fields}`, access)).data;
  }
  async function runImport(job, payload, token) {
    const report = []; let created = 0, updated = 0, failed = 0;
    try {
      const preview = previewImport(payload.csv, payload.mapping, payload.options);
      for (const row of preview.rows) {
        try {
          const filter = encodeURIComponent(JSON.stringify({ globalbake_sku: { _eq: row.product.globalbake_sku } }));
          const existing = (await api(`/items/commerce_products?filter=${filter}&fields=id&limit=1`, token)).data;
          if (existing.length) { await api(`/items/commerce_products/${existing[0].id}`, token, 'PATCH', { ...row.product, source: 'globalbake', erp_synced_at: new Date().toISOString() }); updated++; }
          else { await api('/items/commerce_products', token, 'POST', { ...row.product, id: stableId(`sku:${row.product.globalbake_sku}`), status: 'draft', source: 'globalbake', erp_synced_at: new Date().toISOString() }); created++; }
          report.push({ line: row.line, sku: row.product.globalbake_sku, status: existing.length ? 'updated' : 'created' });
        } catch (error) { failed++; report.push({ line: row.line, sku: row.product.globalbake_sku, status: 'failed', error: error.message }); }
        if (report.length % 25 === 0) await api(`/items/commerce_imports/${job.id}`, token, 'PATCH', { created_count: created, updated_count: updated, failed_count: failed, report });
      }
      await api(`/items/commerce_imports/${job.id}`, token, 'PATCH', { status: failed ? 'partial' : 'completed', created_count: created, updated_count: updated, failed_count: failed, report, completed_at: new Date().toISOString() });
    } catch { await api(`/items/commerce_imports/${job.id}`, token, 'PATCH', { status: 'interrupted', report, created_count: created, updated_count: updated, failed_count: failed }).catch(() => {}); }
    finally { activeImports.delete(job.id); }
  }
  return http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https: data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    try {
      const url = new URL(req.url, config.origin), path = url.pathname;
      if (!['GET', 'HEAD', 'POST', 'PATCH'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD, POST, PATCH'); throw new InputError('Método no permitido.', 405); }
      if (!['GET', 'HEAD'].includes(req.method) && req.headers.origin !== config.origin) throw new InputError('Origen no permitido.', 403);
      if (path === '/health' && req.method === 'GET') {
        const response = await config.fetch(`${config.cms.replace(/\/$/, '')}/server/ping`, { signal: AbortSignal.timeout(5000) });
        return send(res, { status: response.ok ? 'ok' : 'unavailable', environment: 'dev' }, response.ok ? 200 : 503);
      }
      if (path === '/catalog' && req.method === 'GET') {
        if (!config.readToken) throw new InputError('Catálogo no configurado.', 503);
        const filter = encodeURIComponent(JSON.stringify({ status: { _eq: 'published' } }));
        const result = await api(`/items/commerce_products?filter=${filter}&fields=${publicProductFields.join(',')}&limit=2001&sort=name_es`, config.readToken);
        if (result.data.length > 2000) throw new InputError('Catálogo demasiado grande. Configura paginación antes de publicar.', 503);
        return send(res, { products: result.data.map(publicProduct).filter(Boolean), currency: 'USD', checkoutEnabled: false });
      }
      if (path === '/api/login' && req.method === 'POST') {
        const ip = String(req.headers['x-railway-client-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress).split(',')[0].trim();
        const entry = attempts.get(ip) || { count: 0, until: Date.now() + 15 * 60000 };
        if (entry.until < Date.now()) { entry.count = 0; entry.until = Date.now() + 15 * 60000; }
        if (entry.count >= 8) throw new InputError('Demasiados intentos. Espera 15 minutos.', 429);
        entry.count++; attempts.set(ip, entry);
        if (attempts.size > 10000) for (const [id, value] of attempts) if (value.until < Date.now()) attempts.delete(id);
        const input = await body(req);
        if (typeof input.email !== 'string' || input.email.length > 254 || typeof input.password !== 'string' || !input.password || input.password.length > 1000) throw new InputError('Revisa tus credenciales.');
        const result = await api('/auth/login', null, 'POST', { email: input.email.trim(), password: input.password, mode: 'json' });
        const auth = result.data;
        const { data: profile } = await api('/users/me?fields=id,email,first_name,last_name,role.id', auth.access_token);
        if (!owner(profile)) { await api('/auth/logout', null, 'POST', { refresh_token: auth.refresh_token }).catch(() => {}); throw new InputError('Esta cuenta no tiene acceso al Studio Artimex.', 403); }
        attempts.delete(ip);
        cookie(res, { access: auth.access_token, refresh: auth.refresh_token, accessUntil: Date.now() + auth.expires, until: Date.now() + 7 * 86400000 });
        return send(res, { ok: true });
      }
      if (path === '/api/logout' && req.method === 'POST') {
        const s = session(req);
        if (s?.refresh) await api('/auth/logout', null, 'POST', { refresh_token: s.refresh }).catch(() => {});
        cookie(res, null); return send(res, { ok: true });
      }
      if (path.startsWith('/api/')) {
        const s = await authenticate(req, res), token = s.access;
        if (path.startsWith('/api/erp/')) return send(res, await erp.handle(path, req.method, url, token, ['POST', 'PATCH'].includes(req.method) ? await body(req) : undefined));
        if (path === '/api/me' && req.method === 'GET') return send(res, { name: s.profile.first_name || 'Olivier', email: s.profile.email, preview: config.preview, directus: config.cmsPublic || config.cms, environment: 'dev' });
        if (path === '/api/overview' && req.method === 'GET') {
          const [products, customers, orders, imports] = await Promise.all([
            api('/items/commerce_products?aggregate[count]=*&groupBy[]=status', token),
            api('/items/commerce_customers?aggregate[count]=*&groupBy[]=status', token),
            api('/items/commerce_orders?aggregate[count]=*&groupBy[]=status', token),
            api('/items/commerce_imports?limit=5&sort=-date_created&fields=id,filename,status,date_created,created_count,updated_count,failed_count', token),
          ]);
          const count = result => result.data.reduce((sum, item) => sum + Number(typeof item.count === 'object' ? item.count['*'] : item.count), 0);
          return send(res, { products: count(products), published: count({ data: products.data.filter(row => row.status === 'published') }), customers: count(customers), orders: count(orders), imports: imports.data, xmlConnected: false, checkoutEnabled: false });
        }
        if (path === '/api/imports/inspect' && req.method === 'POST') { const input = await body(req); const parsed = readCsv(input.csv, input.delimiter); return send(res, { headers: parsed.headers, suggested: parsed.suggested, delimiter: parsed.delimiter, count: parsed.rows.length, sample: parsed.rows.slice(0, 5) }); }
        if (path === '/api/imports/preview' && req.method === 'POST') { const input = await body(req); return send(res, previewImport(input.csv, input.mapping, input.options)); }
        if (path === '/api/imports/commit' && req.method === 'POST') {
          const input = await body(req), preview = previewImport(input.csv, input.mapping, input.options);
          if (preview.invalid) throw new InputError('Corrige todas las líneas antes de importar.');
          const signature = checksum(JSON.stringify([preview.checksum, Object.entries(input.mapping).sort(), input.options]));
          const id = stableId(`import:${signature}`);
          const existing = (await api(`/items/commerce_imports?filter[id][_eq]=${id}&limit=1`, token)).data[0];
          if (existing?.status === 'completed' || activeImports.has(id)) return send(res, { job: id, status: existing?.status || 'processing' }, 202);
          const job = { id, filename: typeof input.filename === 'string' ? input.filename.slice(0, 200) : 'catalog.csv', checksum: signature, status: 'processing', row_count: preview.count, created_count: 0, updated_count: 0, failed_count: 0, mapping: input.mapping, report: [] };
          await api(`/items/commerce_imports${existing ? `/${id}` : ''}`, token, existing ? 'PATCH' : 'POST', job);
          activeImports.add(id);
          importQueue = importQueue.then(() => runImport(job, input, token)).catch(() => activeImports.delete(id));
          return send(res, { job: id, status: 'processing' }, 202);
        }
        if (path === '/api/xml/analyze' && req.method === 'POST') { const input = await body(req); return send(res, inspectXml(input.xml)); }
        if (path === '/api/orders' && req.method === 'POST') {
          const input = await body(req);
          if (!uuid.test(input.idempotency_key || '')) throw new InputError('La clave de solicitud es obligatoria.');
          const id = stableId(`order:${s.profile.id}:${input.idempotency_key}`), requestHash = checksum(JSON.stringify(input));
          const previous = (await api(`/items/commerce_orders?filter[id][_eq]=${id}&limit=1`, token)).data[0];
          if (previous) { if (previous.request_hash !== requestHash) throw new InputError('Esta clave ya corresponde a otro borrador.', 409); return send(res, previous); }
          if (!Array.isArray(input.lines) || input.lines.some(line => !uuid.test(line?.product || ''))) throw new InputError('Productos inválidos.');
          const customer = await getItem('customers', input.customer, token);
          const filter = encodeURIComponent(JSON.stringify({ id: { _in: input.lines.map(line => line.product) } }));
          const products = (await api(`/items/commerce_products?filter=${filter}&limit=100`, token)).data;
          const order = makeOrder(input, products, customer);
          const payload = { ...order, id, number: `ART-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${id.slice(0, 8).toUpperCase()}`, request_hash: requestHash, lines: order.lines.map(line => ({ ...line, id: randomUUID() })), sync_jobs: [{ id: stableId(`export:${id}`), direction: 'export', entity: 'order', status: 'blocked', idempotency_key: `order:${id}`, last_error: 'Contrato XML, transporte y acuse GlobalBake pendientes.' }] };
          try { return send(res, (await api('/items/commerce_orders', token, 'POST', payload)).data, 201); }
          catch (error) { const retry = (await api(`/items/commerce_orders?filter[id][_eq]=${id}&limit=1`, token)).data[0]; if (retry?.request_hash === requestHash) return send(res, retry); throw error; }
        }
        const match = path.match(/^\/api\/(products|customers|orders|imports|sync)(?:\/([a-f\d-]+))?$/i);
        if (match) {
          const [, name, id] = match, collection = collections[name];
          if (req.method === 'GET') {
            if (id) {
              const item = await getItem(name, id, token, name === 'orders' ? '*,lines.*,sync_jobs.*' : '*');
              if (name === 'imports' && item.status === 'processing' && !activeImports.has(id)) item.status = 'interrupted';
              return send(res, { data: item });
            }
            const page = Math.max(1, Math.min(10000, Number(url.searchParams.get('page')) || 1));
            const search = (url.searchParams.get('search') || '').slice(0, 120);
            const params = new URLSearchParams({ limit: '25', page: String(page), sort: '-date_created', meta: 'filter_count' });
            if (search) params.set('search', search);
            const data = await api(`/items/${collection}?${params}`, token);
            if (name === 'imports') data.data = data.data.map(row => row.status === 'processing' && !activeImports.has(row.id) ? { ...row, status: 'interrupted' } : row);
            return send(res, data);
          }
          if (['products', 'customers'].includes(name) && ['POST', 'PATCH'].includes(req.method)) {
            if ((req.method === 'PATCH') !== Boolean(id)) throw new InputError('Identificador inválido.');
            const input = await body(req);
            const validated = name === 'products' ? validateProduct(input, !id) : validateCustomer(input, !id);
            if (id) {
              const current = await getItem(name, id, token);
              if (name === 'products' && !({ ...current, ...validated }.name_es || { ...current, ...validated }.name_en)) throw new InputError('Conserva al menos un nombre de producto.');
              if (name === 'customers' && !({ ...current, ...validated }.name && { ...current, ...validated }.email)) throw new InputError('Nombre y correo son obligatorios.');
              if (name === 'products' && validated.status === 'published') {
                const combined = { ...current, ...validated };
                // Catalog publication exposes a product sheet; it never enables checkout.
                // Unknown prices and pack sizes stay null and prevent cart selection.
                if (!combined.name_es && !combined.name_en) throw new InputError('Confirma el nombre antes de publicar.');
              }
            } else if (validated.status === 'published') throw new InputError('Guarda primero el producto como borrador.');
            return send(res, (await api(`/items/${collection}${id ? `/${id}` : ''}`, token, id ? 'PATCH' : 'POST', id ? validated : { id: randomUUID(), ...validated })).data, id ? 200 : 201);
          }
          if (name === 'orders' && id && req.method === 'PATCH') {
            const input = await body(req);
            if (input.status !== 'cancelled' || Object.keys(input).length !== 1) throw new InputError('Solo se puede cancelar un borrador desde el Studio.');
            const current = await getItem(name, id, token, '*,sync_jobs.id,sync_jobs.status');
            if (current.status !== 'draft') throw new InputError('Esta orden ya no es un borrador.', 409);
            return send(res, (await api(`/items/${collection}/${id}`, token, 'PATCH', { status: 'cancelled', sync_jobs: (current.sync_jobs || []).filter(job => job.status === 'blocked').map(job => ({ id: job.id, status: 'cancelled' })) })).data);
          }
        }
        throw new InputError('Ruta no encontrada.', 404);
      }
      if (!['GET', 'HEAD'].includes(req.method)) throw new InputError('Ruta no encontrada.', 404);
      const files = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/erp.js': ['erp.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'], '/favicon.svg': ['favicon.svg', 'image/svg+xml'], '/logo.png': ['logo.png', 'image/png'], '/bakery.webp': ['bakery.webp', 'image/webp'], '/sans.woff2': ['sans.woff2', 'font/woff2'], '/serif.woff2': ['serif.woff2', 'font/woff2'] };
      if (!files[path]) throw new InputError('Ruta no encontrada.', 404);
      const [file, type] = files[path];
      const bytes = await readFile(new URL(`./public/${file}`, import.meta.url));
      res.writeHead(200, { 'Content-Type': `${type}${type.startsWith('text/') ? '; charset=utf-8' : ''}` }); res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch (error) {
      if (error.status === 401) cookie(res, null);
      send(res, { error: error instanceof InputError ? error.message : 'El servicio no está disponible. Inténtalo de nuevo.' }, error.status || 503);
    }
  });
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.PORT || 4180);
  createStudioServer().listen(port, '0.0.0.0', () => console.log(`Artimex Studio listening on port ${port}`));
}
