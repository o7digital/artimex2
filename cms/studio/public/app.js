import { createErpViews } from '/erp.js';
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const money = value => value === null || value === undefined ? 'Por confirmar' : new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(value / 100);
const date = value => value ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeZone: 'America/Los_Angeles' }).format(new Date(value)) : '—';
const labels = { draft: 'Borrador', published: 'Publicado', archived: 'Archivado', pending: 'Pendiente', approved: 'Aprobado', cancelled: 'Cancelado', blocked: 'Por configurar', processing: 'En proceso', completed: 'Completado', partial: 'Con incidencias', interrupted: 'Reenviar archivo', failed: 'Error', unpaid: 'Sin pago', personal: 'Particular', business: 'Profesional', pickup: 'Retiro', delivery: 'Entrega', export: 'Salida', import: 'Entrada', order: 'Pedido', stock: 'Stock', catalog: 'Catálogo' };
const badge = value => `<span class="badge ${esc(value)}">${esc(labels[value] || value || 'Pendiente')}</span>`;
const paths = {
  overview: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  products: '<path d="M5 20h14V9a3 3 0 0 0-2-5 5 5 0 0 0-10 0 3 3 0 0 0-2 5v11Z"/><path d="m9 9 2-3m2 6 2-3"/>',
  customers: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m0-16a3 3 0 0 1 0 6m3 3a5 5 0 0 1 3 5v2"/>',
  orders: '<path d="M6 3h12v19l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6m-6 4h6m-6 4h3"/>',
  imports: '<path d="M5 3h10l4 4v14H5V3Zm10 0v5h4M8 15h8m-4-4v8m-3-3 3 3 3-3"/>',
  sync: '<path d="M4 7h16l-4-4m4 14H4l4 4M20 7v6M4 17v-6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="m10 3-1 3-3 1-3 3v4l3 3 3 1 1 3h4l1-3 3-1 3-3v-4l-3-3-3-1-1-3h-4Z"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.overview}</svg>`;
const nav = [['overview', 'Resumen'], ['items', 'Referencial ERP'], ['recipes', 'Formulaciones'], ['workbook', 'Importar formulaciones'], ['products', 'Catálogo de la tienda'], ['customers', 'Clientes'], ['orders', 'Pedidos'], ['imports', 'Importar catálogo CSV'], ['sync', 'Intercambios XML'], ['settings', 'Mi espacio']];
const state = { user: null, import: null, jobTimer: null, renderId: 0 };
let toastTimer;
function toast(message) { $('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 6000); }
function showLogin() { state.user = null; state.import = null; state.renderId++; $('#studio-view').hidden = true; $('#login-view').hidden = false; $('#editor').close(); $('#editor-body').replaceChildren(); $('#page').replaceChildren(); clearTimeout(state.jobTimer); }
async function api(path, method = 'GET', data) {
  const response = await fetch(path, { method, headers: data === undefined ? {} : { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data), credentials: 'same-origin' });
  const result = await response.json();
  if (!response.ok) { if (response.status === 401) showLogin(); throw new Error(result.error || 'No se pudo completar la solicitud.'); }
  return result;
}
function header(kicker, title, description, action = '') { return `<section class="page-head"><div><p class="eyebrow">${kicker}</p><h1>${title}</h1><p>${description}</p></div>${action ? `<div class="head-actions">${action}</div>` : ''}</section>`; }
function empty(title, description, action = '') { return `<div class="empty"><span class="empty-symbol" aria-hidden="true">A</span><h2>${title}</h2><p>${description}</p>${action}</div>`; }
function notice(content) { return `<div class="notice"><span aria-hidden="true">i</span><div>${content}</div></div>`; }
function table(columns, rows) { return `<div class="table-wrap"><table><thead><tr>${columns.map(column => `<th scope="col">${column}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`; }
function dialog(title, html) { $('#editor-title').textContent = title; $('#editor-body').innerHTML = html; $('#editor').showModal(); }
function formError(form, error) { form.querySelector('.error').textContent = error.message; }
function toggleNav(open) { $('#sidebar').classList.toggle('open', open); $('#nav-backdrop').hidden = !open; $('#menu-toggle').setAttribute('aria-expanded', String(open)); }
$('#menu-toggle').onclick = () => toggleNav(!$('#sidebar').classList.contains('open'));
$('#nav-backdrop').onclick = () => toggleNav(false);
$('#close-editor').onclick = () => $('#editor').close();
$('#editor').addEventListener('click', event => { if (event.target === $('#editor')) { const r = $('#editor').getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) $('#editor').close(); } });
$('#login-form').onsubmit = async event => {
  event.preventDefault(); const form = event.currentTarget, button = form.querySelector('button'); button.disabled = true; $('#login-error').textContent = '';
  try { await api('/api/login', 'POST', Object.fromEntries(new FormData(form))); form.reset(); await initialize(); }
  catch (error) { $('#login-error').textContent = error.message; } finally { button.disabled = false; }
};
$('#logout').onclick = async () => { try { await api('/api/logout', 'POST', {}); showLogin(); } catch (error) { toast(error.message); } };
async function initialize() {
  try {
    state.user = await api('/api/me');
    $('#login-view').hidden = true; $('#studio-view').hidden = false;
    $('#account-name').textContent = state.user.name; $('#preview-link').href = state.user.preview + '/en/shop/';
    $('#navigation').innerHTML = nav.map(([key, name]) => `<a class="nav-item" href="#${key}" data-nav="${key}">${icon(key)}<span>${name}</span></a>`).join('');
    await render();
  } catch (error) { if (state.user) toast(error.message); else showLogin(); }
}
window.addEventListener('hashchange', () => { toggleNav(false); if (state.user) render(); });
async function render() {
  const section = (location.hash.slice(1) || 'overview').split('?')[0];
  const selected = nav.find(([key]) => key === section) || nav[0];
  const id = ++state.renderId; clearTimeout(state.jobTimer);
  $('#breadcrumb').textContent = selected[1];
  document.querySelectorAll('[data-nav]').forEach(link => { const active = link.dataset.nav === selected[0]; link.classList.toggle('active', active); if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
  $('#page').innerHTML = '<p class="loading" role="status">Cargando tu espacio…</p>';
  try {
    if (selected[0] === 'overview') await overview(id);
    else if (['items', 'recipes', 'workbook'].includes(selected[0])) await erpViews.render(selected[0], id);
    else if (['products', 'customers', 'orders'].includes(selected[0])) await list(selected[0], 1, '', id);
    else if (selected[0] === 'imports') await imports(id);
    else if (selected[0] === 'sync') await sync(id);
    else settings();
  } catch (error) { if (id === state.renderId) $('#page').innerHTML = notice(`<p>${esc(error.message)}</p><button class="button" id="retry">Reintentar</button>`); $('#retry')?.addEventListener('click', render); }
}
async function overview(id) {
  const [data, erp] = await Promise.all([api('/api/overview'), api('/api/erp/overview')]); if (id !== state.renderId) return;
  $('#page').innerHTML = header('TU PANADERÍA, CONECTADA', `Bienvenido, ${esc(state.user.name)}.`, 'El mismo cuidado de siempre, en cada detalle de tu negocio.', '<a class="button gold" href="#items">Ver referencial</a>') +
    erpViews.stats(erp) + erpViews.charts(erp) +
    `<div class="grid-two"><article class="panel intro-card">${icon('imports')}<p class="eyebrow">TODO EMPIEZA CON TUS PRODUCTOS</p><h2>Tu catálogo.<br>Con su propia historia.</h2><p>Importa el CSV de GlobalBake, revisa las columnas y prepara cada producto para tu tienda.</p><a class="button" href="#imports">Importar mi catálogo</a></article><article class="panel intro-card">${icon('sync')}<p class="eyebrow">EL SIGUIENTE PASO</p><h2>Un negocio.<br>Todo conectado.</h2><p>Catálogo y existencias de entrada. Pedidos de salida. Prepara la conexión XML con tu equipo GlobalBake.</p><a class="button" href="#sync">Ver los intercambios</a></article></div>` +
    notice('<p><strong>Estás en tu espacio de desarrollo.</strong> Puedes preparar el catálogo y registrar borradores. El pago y el envío de pedidos a GlobalBake todavía no están habilitados.</p>') +
    `<section class="panel"><div class="panel-header"><div><h2>Tu tienda y tus clientes</h2><p>${data.products} fichas de catálogo · ${data.published} publicadas · ${data.customers} clientes · ${data.orders} borradores</p></div><a class="text-button" href="#items">Explorar el referencial ERP</a></div>${erp.imports.length ? `<div class="panel-content"><p>Última fuente: ${esc(erp.imports[0].filename)} · ${date(erp.imports[0].date_created)}</p><a class="text-button" href="#recipes">Explorar las formulaciones privadas</a></div>` : empty('Un nuevo comienzo.', 'Importa tu informe para construir el referencial compartido.', '<a class="button" href="#workbook">Importar informe GB</a>')}</section>`;
  erpViews.bindCharts();
}
const listMeta = {
  products: ['TU COLECCIÓN', 'El pan que nos une.', 'Cuida cada ficha, su presentación y su disponibilidad.', 'Nuevo producto'],
  customers: ['RELACIONES QUE CRECEN', 'Cerca de tus clientes.', 'Particulares y profesionales, con sus datos y su vínculo GlobalBake.', 'Nuevo cliente'],
  orders: ['CADA PEDIDO, UN NUEVO MOMENTO', 'Lo que viene.', 'Prepara y consulta los borradores de pedido de tu panadería.', 'Nuevo borrador'],
};
async function list(name, page = 1, search = '', id = state.renderId) {
  const result = await api(`/api/${name}?page=${page}&search=${encodeURIComponent(search)}`); if (id !== state.renderId) return;
  const [kicker, title, description, action] = listMeta[name];
  const rows = result.data, total = result.meta?.filter_count ?? rows.length;
  let contents;
  if (!rows.length) contents = empty(search ? 'Sin resultados.' : 'Todo empieza aquí.', search ? 'Prueba con otro nombre o referencia.' : name === 'products' ? 'Importa tu CSV GlobalBake o crea tu primera ficha.' : name === 'customers' ? 'Registra tus clientes y aprueba sus cuentas cuando estén listas.' : 'Crea un borrador con un cliente aprobado y precios confirmados.');
  else if (name === 'products') contents = table(['Producto', 'SKU GlobalBake', 'Precio USD / pieza', 'Stock', 'Estado', ''], rows.map(row => `<tr><td><div class="cell-title">${row.image_url ? `<img class="product-photo" src="${esc(row.image_url)}" alt="" loading="lazy">` : '<span class="product-placeholder" aria-hidden="true">A</span>'}<div><strong>${esc(row.name_es || row.name_en)}</strong><small>${esc(row.name_en || 'Traducción por completar')}</small></div></div></td><td>${esc(row.globalbake_sku || 'Por confirmar')}</td><td>${money(row.price_cents)}</td><td>${row.stock_quantity ?? 'Por confirmar'}</td><td>${badge(row.status)}</td><td><button class="text-button" data-edit="${row.id}">Editar</button></td></tr>`));
  else if (name === 'customers') contents = table(['Cliente', 'Correo', 'Tipo', 'Estado', ''], rows.map(row => `<tr><td><div class="cell-title"><span class="product-placeholder" aria-hidden="true">${esc(row.name?.slice(0, 1))}</span><div><strong>${esc(row.name)}</strong><small>${esc(row.company)}</small></div></div></td><td>${esc(row.email)}</td><td>${badge(row.customer_type)}</td><td>${badge(row.status)}</td><td><button class="text-button" data-edit="${row.id}">Editar</button></td></tr>`));
  else contents = table(['Pedido', 'Fecha', 'Subtotal', 'Estado', 'Pago', 'GlobalBake', ''], rows.map(row => `<tr><td>${esc(row.number)}</td><td>${date(row.date_created)}</td><td>${money(row.subtotal_cents)}</td><td>${badge(row.status)}</td><td>${badge(row.payment_status)}</td><td>${badge(row.erp_status)}</td><td><button class="text-button" data-edit="${row.id}">Abrir</button></td></tr>`));
  $('#page').innerHTML = header(kicker, title, description, `<button class="button gold" id="create-item">${action}</button>`) +
    (name === 'orders' ? notice('<p>Los borradores no reservan stock, no cobran y no se envían al ERP. Los precios negociados B2B, impuestos y entrega están pendientes de configuración.</p>') : '') +
    `<section class="panel"><div class="toolbar"><form id="search-form" class="search-form"><label class="field-full" hidden for="list-search">Buscar</label><input id="list-search" name="search" type="search" value="${esc(search)}" placeholder="Buscar por nombre o referencia" aria-label="Buscar por nombre o referencia"><button class="button" type="submit">Buscar</button></form><span class="help">${total} ${name === 'products' ? 'productos' : name === 'customers' ? 'clientes' : 'pedidos'}</span></div>${contents}<div class="pagination"><span>Página ${page} · ${total} registros</span><div><button class="button" id="previous-page" ${page === 1 ? 'disabled' : ''}>Anterior</button><button class="button" id="next-page" ${page * 25 >= total ? 'disabled' : ''}>Siguiente</button></div></div></section>`;
  $('#search-form').onsubmit = event => { event.preventDefault(); list(name, 1, new FormData(event.currentTarget).get('search')).catch(error => toast(error.message)); };
  $('#previous-page').onclick = () => list(name, page - 1, search).catch(error => toast(error.message));
  $('#next-page').onclick = () => list(name, page + 1, search).catch(error => toast(error.message));
  $('#create-item').onclick = () => (name === 'orders' ? orderForm() : editForm(name, {})).catch(error => toast(error.message));
  document.querySelectorAll('[data-edit]').forEach(button => { button.onclick = async () => { try { const result = await api(`/api/${name}/${button.dataset.edit}`); if (name === 'orders') orderDetail(result.data); else await editForm(name, result.data); } catch (error) { toast(error.message); } }; });
}
const input = (name, label, value = '', options = '') => `<label>${label}<input name="${name}" value="${esc(value ?? '')}" ${options}></label>`;
function select(name, label, values, value) { return `<label>${label}<select name="${name}">${values.map(item => { const [key, text] = Array.isArray(item) ? item : [item, labels[item] || item]; return `<option value="${esc(key)}" ${key === value ? 'selected' : ''}>${esc(text)}</option>`; }).join('')}</select></label>`; }
async function editForm(name, row) {
  const product = name === 'products';
  let fields;
  if (product) fields = input('name_es', 'Nombre en español', row.name_es, 'maxlength="2000"') + input('name_en', 'Nombre en inglés', row.name_en, 'maxlength="2000"') +
    input('globalbake_sku', 'SKU GlobalBake', row.globalbake_sku, 'maxlength="120"') + select('status', 'Estado', row.id ? ['draft', 'published', 'archived'] : ['draft'], row.status || 'draft') +
    input('price', 'Precio B2C por pieza · USD', row.price_cents === null || row.price_cents === undefined ? '' : (row.price_cents / 100).toFixed(2), 'type="number" min="0" max="1000000" step="0.01"') + input('stock_quantity', 'Stock en piezas', row.stock_quantity, 'type="number" min="0" max="100000000" step="1"') +
    input('units_per_case', 'Piezas por caja', row.units_per_case, 'type="number" min="1" max="100000000" step="1"') + select('category', 'Familia', [['conchas', 'Conchas'], ['pastries', 'Pan dulce'], ['savory', 'Pan salado'], ['other', 'Otros']], row.category || 'other') +
    `<label class="field-full">Descripción en español<textarea name="description_es" maxlength="8000">${esc(row.description_es)}</textarea></label><label class="field-full">Descripción en inglés<textarea name="description_en" maxlength="8000">${esc(row.description_en)}</textarea></label>` +
    `<div class="field-full">${input('image_url', 'Fotografía · URL HTTPS', row.image_url, 'type="url" maxlength="2000"')}<p class="help">Usa una fotografía del producto alojada en una URL HTTPS.</p></div><div class="field-full"><label class="check-label"><input name="enabled_b2c" type="checkbox" ${row.enabled_b2c ? 'checked' : ''}><span>Mostrar en el catálogo para particulares</span></label><label class="check-label"><input name="enabled_b2b" type="checkbox" ${row.enabled_b2b ? 'checked' : ''}><span>Mostrar en el catálogo para profesionales</span></label></div>`;
  else fields = input('name', 'Nombre', row.name, 'required maxlength="2000"') + input('email', 'Correo electrónico', row.email, 'type="email" required maxlength="254"') + input('company', 'Empresa', row.company) + select('customer_type', 'Tipo de cliente', ['personal', 'business'], row.customer_type || 'personal') + select('status', 'Estado de la cuenta', ['pending', 'approved', 'archived'], row.status || 'pending') + input('globalbake_customer_id', 'Referencia cliente GlobalBake', row.globalbake_customer_id) + `<label class="field-full">Dirección de entrega<textarea name="delivery_address">${esc(row.delivery_address)}</textarea></label><label class="field-full">Notas privadas<textarea name="notes" maxlength="8000">${esc(row.notes)}</textarea></label>`;
  dialog(`${row.id ? 'Editar' : 'Nuevo'} ${product ? 'producto' : 'cliente'}`, `<form id="item-form"><div class="fields">${fields}</div><p class="error" role="alert"></p><div class="form-actions"><button type="button" class="button" id="cancel-edit">Cancelar</button><button type="submit" class="button primary">Guardar cambios</button></div></form>`);
  $('#cancel-edit').onclick = () => $('#editor').close();
  $('#item-form').onsubmit = async event => {
    event.preventDefault(); const form = event.currentTarget, button = form.querySelector('[type=submit]'), values = Object.fromEntries(new FormData(form)); button.disabled = true;
    if (product) { values.price_cents = values.price === '' ? null : Math.round(Number(values.price) * 100); delete values.price; for (const key of ['stock_quantity', 'units_per_case']) values[key] = values[key] === '' ? null : Number(values[key]); values.enabled_b2c = form.elements.enabled_b2c.checked; values.enabled_b2b = form.elements.enabled_b2b.checked; }
    try { await api(`/api/${name}${row.id ? `/${row.id}` : ''}`, row.id ? 'PATCH' : 'POST', values); $('#editor').close(); toast('Cambios guardados.'); await render(); } catch (error) { formError(form, error); } finally { button.disabled = false; }
  };
}
async function allItems(name) {
  const rows = []; let page = 1;
  for (;;) { const result = await api(`/api/${name}?page=${page}`); rows.push(...result.data); if (page * 25 >= (result.meta?.filter_count ?? result.data.length)) return rows; if (page >= 80) throw new Error('Hay más de 2.000 registros. Crea el borrador desde Directus.'); page++; }
}
async function orderForm() {
  const [products, customers] = await Promise.all([allItems('products'), allItems('customers')]);
  const available = products.filter(row => row.status !== 'archived' && row.price_cents !== null), approved = customers.filter(row => row.status === 'approved' && row.customer_type === 'personal');
  if (!available.length || !approved.length) { dialog('Prepara tu primer pedido', empty('Todo a su tiempo.', 'Necesitas un cliente particular aprobado y al menos un producto con precio confirmado. Los precios profesionales B2B se configurarán con GlobalBake.')); return; }
  const key = crypto.randomUUID();
  dialog('Nuevo borrador', notice('<p>Se calcula con los precios guardados. Sin pago, impuestos ni reserva de stock.</p>') + `<form id="order-form">${select('customer', 'Cliente particular aprobado', approved.map(row => [row.id, `${row.name} · ${row.email}`]), approved[0].id)}${select('fulfillment', 'Entrega', ['pickup', 'delivery'], 'pickup')}<label>Dirección de entrega (obligatoria si es entrega)<textarea name="delivery_address"></textarea></label><div id="order-lines"></div><button type="button" class="text-button" id="add-line">Agregar producto</button><label>Notas<textarea name="notes" maxlength="8000"></textarea></label><p class="error" role="alert"></p><div class="form-actions"><button type="submit" class="button primary">Guardar borrador</button></div></form>`);
  function addLine() {
    const div = document.createElement('div'); div.className = 'order-line'; div.innerHTML = select('product', 'Producto', available.map(row => [row.id, `${row.name_es || row.name_en} · ${money(row.price_cents)}`]), available[0].id) + input('quantity', 'Cantidad', '1', 'type="number" required min="1" max="999" step="1"') + '<button type="button" class="icon-button" aria-label="Quitar línea">×</button>';
    div.querySelector('button').onclick = () => div.remove(); $('#order-lines').append(div);
  }
  addLine(); $('#add-line').onclick = addLine;
  $('#order-form').onsubmit = async event => {
    event.preventDefault(); const form = event.currentTarget, button = form.querySelector('[type=submit]'); button.disabled = true;
    const values = { customer: form.elements.customer.value, fulfillment: form.elements.fulfillment.value, delivery_address: form.elements.delivery_address.value, notes: form.elements.notes.value, idempotency_key: key, lines: [...form.querySelectorAll('.order-line')].map(row => ({ product: row.querySelector('select').value, quantity: Number(row.querySelector('input').value) })) };
    try { await api('/api/orders', 'POST', values); $('#editor').close(); toast('Borrador registrado. No se ha cobrado ni enviado al ERP.'); await render(); } catch (error) { formError(form, error); } finally { button.disabled = false; }
  };
}
function orderDetail(row) {
  dialog(row.number, `<dl class="order-meta"><div><dt>Estado</dt><dd>${badge(row.status)}</dd></div><div><dt>Pago</dt><dd>${badge(row.payment_status)}</dd></div><div><dt>GlobalBake</dt><dd>${badge(row.erp_status)}</dd></div><div><dt>Entrega</dt><dd>${esc(labels[row.fulfillment])}</dd></div></dl>` + table(['Producto', 'SKU', 'Cantidad', 'Importe'], (row.lines || []).map(line => `<tr><td>${esc(line.name_snapshot)}</td><td>${esc(line.sku_snapshot || 'Pendiente')}</td><td>${line.quantity}</td><td>${money(line.line_total_cents)}</td></tr>`)) + `<div class="panel-content"><p>Subtotal: ${money(row.subtotal_cents)}</p><p>Impuestos y entrega: por configurar.</p><p>${esc(row.delivery_address)}</p><p>${esc(row.notes)}</p></div>` + notice('<p>El contrato XML GlobalBake está pendiente de validación. Este borrador no se ha transmitido.</p>') + (row.status === 'draft' ? '<button class="button danger" id="cancel-order">Cancelar borrador</button>' : ''));
  if ($('#cancel-order')) $('#cancel-order').onclick = async () => { try { await api(`/api/orders/${row.id}`, 'PATCH', { status: 'cancelled' }); $('#editor').close(); toast('Borrador cancelado.'); render(); } catch (error) { toast(error.message); } };
}
function importTable(rows) { return table(['Archivo', 'Fecha', 'Estado', 'Creados', 'Actualizados', 'Errores', ''], rows.map(row => `<tr><td>${esc(row.filename)}</td><td>${date(row.date_created)}</td><td>${badge(row.status)}</td><td>${row.created_count}</td><td>${row.updated_count}</td><td>${row.failed_count}</td><td><button class="text-button" data-import="${row.id}">Ver informe</button></td></tr>`)); }
async function imports(id) {
  const jobs = await api('/api/imports'); if (id !== state.renderId) return;
  $('#page').innerHTML = header('DE GLOBALBAKE A TU TIENDA', 'Cada producto cuenta.', 'Trae tu catálogo, elige las columnas y revisa el resultado antes de guardarlo.') +
    '<div class="steps"><span class="step active">Elegir archivo</span><span class="step">Relacionar columnas</span><span class="step">Revisar e importar</span></div><section class="panel"><div class="panel-content"><p class="eyebrow">TU CATÁLOGO ORIGINAL</p><div class="upload-zone"><h3>Hagamos espacio para tus productos.</h3><p>CSV GlobalBake · Hasta 2 MB y 2.000 filas · Coma, punto y coma o tabulación</p><label for="csv-file" class="help">Seleccionar CSV</label><input id="csv-file" type="file" accept=".csv,text/csv"></div><p class="help">Conserva los SKU exactamente como aparecen en GlobalBake. Los ceros iniciales forman parte de la referencia.</p><div id="import-work"></div></div></section>' +
    `<section class="panel"><div class="panel-header"><div><h2>Historial de importaciones</h2><p>Los informes permanecen guardados en tu espacio privado.</p></div></div>${jobs.data.length ? importTable(jobs.data) : empty('Tu catálogo empieza aquí.', 'El primer archivo importado aparecerá en este historial.')}</section>`;
  $('#csv-file').onchange = async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('El archivo supera los 2 MB.');
      const bytes = await file.arrayBuffer(); let csv;
      try { csv = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { csv = new TextDecoder('windows-1252').decode(bytes); }
      state.import = { csv, filename: file.name };
      const parsed = await api('/api/imports/inspect', 'POST', { csv }); mappingForm(parsed);
    } catch (error) { $('#import-work').innerHTML = `<p class="error" role="alert">${esc(error.message)}</p>`; }
  };
  document.querySelectorAll('[data-import]').forEach(button => { button.onclick = () => importReport(button.dataset.import).catch(error => toast(error.message)); });
}
function mappingForm(parsed) {
  const fields = [['globalbake_sku', 'SKU GlobalBake · obligatorio'], ['name_es', 'Nombre o descripción en español'], ['name_en', 'Nombre en inglés'], ['price_cents', 'Precio unitario en USD'], ['stock_quantity', 'Existencias en piezas'], ['units_per_case', 'Piezas por caja']];
  $('.steps').innerHTML = '<span class="step">Archivo elegido</span><span class="step active">Relacionar columnas</span><span class="step">Revisar e importar</span>';
  $('#import-work').innerHTML = `<form id="mapping-form"><div class="panel-header"><div><h2>Relaciona tus columnas.</h2><p>${parsed.count} filas · ${esc(state.import.filename)}</p></div></div><div class="mapping-grid">${fields.map(([key, name]) => select(key, name, [['', 'No importar esta columna'], ...parsed.headers.map(header => [header, header])], parsed.suggested[key] || '')).join('')}</div><label class="check-label"><input type="checkbox" name="price-confirm"><span>Confirmo que el precio seleccionado es por pieza y en USD; el stock está expresado en piezas.</span></label><p class="help">Los campos sin columna o vacíos conservan su valor anterior. Los nuevos productos se crean como borrador.</p><p class="error" role="alert"></p><div class="form-actions"><button class="button primary" type="submit">Revisar importación</button></div></form>`;
  $('#mapping-form').onsubmit = async event => {
    event.preventDefault(); const form = event.currentTarget, button = form.querySelector('[type=submit]'); button.disabled = true;
    const mapping = Object.fromEntries([...new FormData(form)].filter(([key, value]) => key !== 'price-confirm' && value));
    state.import.mapping = mapping; state.import.options = { delimiter: parsed.delimiter, priceUnit: form.elements['price-confirm'].checked ? 'usd' : '', stockUnit: form.elements['price-confirm'].checked ? 'piece' : '' };
    try { const preview = await api('/api/imports/preview', 'POST', state.import); previewForm(preview, parsed); } catch (error) { formError(form, error); } finally { button.disabled = false; }
  };
}
function previewForm(preview, parsed) {
  $('.steps').innerHTML = '<span class="step">Archivo elegido</span><span class="step">Columnas relacionadas</span><span class="step active">Revisar e importar</span>';
  $('#import-work').innerHTML = `<div class="panel-header"><h2>Un último vistazo.</h2></div><div class="import-counts"><span>${preview.count} filas</span><strong>${preview.valid} válidas</strong><span>${preview.invalid} con error</span></div>` +
    table(['Línea', 'SKU', 'Producto', 'Precio', 'Resultado'], preview.rows.slice(0, 50).map(row => `<tr><td>${row.line}</td><td>${esc(row.product?.globalbake_sku || '—')}</td><td>${esc(row.product?.name_es || row.product?.name_en || '—')}</td><td>${money(row.product?.price_cents)}</td><td>${row.valid ? badge('approved') : esc(row.error)}</td></tr>`)) +
    `<p class="help">Se muestran las primeras ${Math.min(50, preview.count)} filas. Se validaron las ${preview.count} filas del archivo.</p><p class="error" id="import-error" role="alert"></p><div class="form-actions"><button class="button" id="back-mapping">Ajustar columnas</button><button class="button primary" id="commit-import" ${preview.invalid ? 'disabled' : ''}>Importar ${preview.valid} productos</button></div>`;
  $('#back-mapping').onclick = () => mappingForm(parsed);
  $('#commit-import').onclick = async event => {
    event.currentTarget.disabled = true;
    try { const result = await api('/api/imports/commit', 'POST', state.import); toast('Importación iniciada. Puedes seguir su resultado.'); await importReport(result.job, true); } catch (error) { $('#import-error').textContent = error.message; event.target.disabled = false; }
  };
}
async function importReport(id, poll = false) {
  const result = await api(`/api/imports/${id}`), row = result.data;
  dialog('Informe de importación', `<p>${esc(row.filename)} · ${badge(row.status)}</p><div class="import-counts"><strong>${row.created_count} creados</strong><strong>${row.updated_count} actualizados</strong><span>${row.failed_count} errores</span></div>` + table(['Línea', 'SKU', 'Resultado'], (row.report || []).map(item => `<tr><td>${item.line}</td><td>${esc(item.sku)}</td><td>${esc(item.error || (item.status === 'created' ? 'Creado' : 'Actualizado'))}</td></tr>`)) + (row.status === 'processing' ? '<p class="help">El trabajo continúa en el servidor. Si el servicio se reinicia o la sesión vence, reenvía el mismo archivo para reanudar sin duplicar SKU.</p>' : '<p class="help">El informe está guardado. Los errores pueden retomarse reenviando el archivo.</p>'));
  if (poll && row.status === 'processing') state.jobTimer = setTimeout(() => { if ($('#editor').open) importReport(id, true).catch(error => toast(error.message)); }, 2000);
}
async function sync(id) {
  const jobs = await api('/api/sync'); if (id !== state.renderId) return;
  $('#page').innerHTML = header('DOS DIRECCIONES. UN MISMO NEGOCIO.', 'El vínculo con GlobalBake.', 'Prepara los intercambios de catálogo, existencias y pedidos con tu equipo ERP.') +
    notice('<p><strong>Formato XML pendiente de validación.</strong> Necesitamos ejemplos aceptados por tu instalación, su versión, el medio de transporte y los acuses de recepción.</p>') +
    `<div class="grid-two"><section class="panel intro-card">${icon('imports')}<p class="eyebrow">GLOBALBAKE A ARTIMEX</p><h2>Catálogo y stock.</h2><div class="flow"><p><strong>GlobalBake</strong></p><p>Archivo de productos y existencias</p><p>Revisión de SKU, unidades y precios</p><p><strong>Catálogo de la tienda</strong></p></div><span class="badge pending">CSV disponible · XML por configurar</span></section><section class="panel intro-card">${icon('orders')}<p class="eyebrow">ARTIMEX A GLOBALBAKE</p><h2>Pedidos y confirmaciones.</h2><div class="flow"><p><strong>Pedido validado</strong></p><p>Cola de exportación y contrato XML</p><p>Transmisión y acuse GlobalBake</p><p><strong>Referencia ERP confirmada</strong></p></div><span class="badge blocked">Envío pendiente del contrato XML</span></section></div>` +
    `<section class="panel"><div class="panel-header"><div><h2>Exploremos tu XML.</h2><p>Analiza su estructura. No se guarda ni se transmite a GlobalBake.</p></div></div><div class="panel-content"><label>Archivo XML de ejemplo<input id="xml-file" type="file" accept=".xml,text/xml,application/xml"></label><p class="help">Hasta 1 MB. El análisis no certifica compatibilidad con GlobalBake.</p><div id="xml-result"></div></div></section>` +
    `<section class="panel"><div class="panel-header"><h2>Lo que necesitamos del equipo GlobalBake</h2></div><div class="panel-content"><ul class="requirements"><li>Versión instalada y módulos de integración habilitados.</li><li>Ejemplo de catálogo y stock con SKU, unidades y precios.</li><li>Pedido XML aceptado, acuse positivo y ejemplo de rechazo.</li><li>Esquema XSD, si existe, y documentación de los campos.</li><li>Transporte, acceso de prueba y reglas de reintento.</li><li>Tarifas B2B, impuestos, mínimos y condiciones de entrega.</li></ul></div></section>` +
    `<section class="panel"><div class="panel-header"><h2>Cola de intercambios</h2></div>${jobs.data.length ? table(['Dirección', 'Entidad', 'Estado', 'Intentos', 'Detalle'], jobs.data.map(row => `<tr><td>${esc(labels[row.direction])}</td><td>${esc(labels[row.entity])}</td><td>${badge(row.status)}</td><td>${row.attempts}</td><td>${esc(row.last_error || '—')}</td></tr>`)) : empty('Conectemos cada paso.', 'Los borradores registrados tendrán una entrada de exportación pendiente de configurar.')}</section>`;
  $('#xml-file').onchange = async event => {
    const file = event.target.files[0]; if (!file) return;
    try { if (file.size > 1024 * 1024) throw new Error('El XML supera 1 MB.'); const result = await api('/api/xml/analyze', 'POST', { xml: await file.text() }); $('#xml-result').innerHTML = `<div class="import-counts"><strong>Elemento raíz: ${esc(result.root)}</strong><span>${result.paths.length} rutas detectadas</span></div><pre class="paths">${esc(result.paths.join('\n'))}</pre><p class="help">${esc(result.message)}</p>`; } catch (error) { $('#xml-result').innerHTML = `<p class="error" role="alert">${esc(error.message)}</p>`; }
  };
}
function settings() {
  $('#page').innerHTML = header('UN ESPACIO PARA CUIDAR LO NUESTRO', 'Tu Artimex Studio.', 'El punto de encuentro entre tu panadería y lo que viene.') + `<section class="panel"><div class="panel-header"><h2>Tu acceso</h2></div><div class="panel-content"><p><strong>${esc(state.user.name)}</strong></p><p>${esc(state.user.email)}</p><p>Entorno: desarrollo · Sitio conectado: vista previa.</p><div class="form-actions"><a class="button" href="${esc(state.user.preview)}/en/shop/" target="_blank" rel="noopener">Abrir mi tienda</a><a class="button" href="${esc(state.user.directus)}/admin/" target="_blank" rel="noopener">Abrir Directus</a></div></div></section>` + notice('<p>Los productos, clientes y borradores se guardan en tu base privada. Publicar una ficha la hace disponible en la API del catálogo; no activa pagos ni envía pedidos a GlobalBake.</p>');
}
const erpViews = createErpViews({ api, esc, badge, header, empty, notice, table, dialog, select, input, toast, state, date, render });
initialize();
