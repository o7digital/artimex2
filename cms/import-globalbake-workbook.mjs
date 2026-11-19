// Import the explicitly supplied source into Artimex dev. No workbook is copied to Git.
import { readFile } from 'node:fs/promises';
import { createStudioServer } from './studio/server.mjs';
import deployment from './deployment.json' with { type: 'json' };

if (process.env.CMS_ENVIRONMENT !== 'dev' || process.env.PUBLIC_URL !== deployment.directusUrl || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.argv[2]) throw new Error('Use Artimex Directus dev variables and the workbook path.');
const bytes = await readFile(process.argv[2]);
const payload = { filename: process.argv[2].split(/[\\/]/).pop(), base64: bytes.toString('base64') };
const server = createStudioServer({ cms: deployment.directusUrl, origin: 'http://127.0.0.1:4191', adminEmail: process.env.ADMIN_EMAIL, secret: process.env.SECRET, secure: false });
await new Promise(resolve => server.listen(4191, '127.0.0.1', resolve));
let cookie = '';
async function api(path, method = 'GET', body) {
  const response = await fetch('http://127.0.0.1:4191' + path, { method, headers: { Origin: 'http://127.0.0.1:4191', Cookie: cookie, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
  const data = await response.json(); if (!response.ok) throw new Error(`${path}: ${data.error}`); return data;
}
try {
  await api('/api/login', 'POST', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  const preview = await api('/api/erp/workbook/preview', 'POST', payload);
  console.log('Validated source:', JSON.stringify(preview.summary));
  const job = await api('/api/erp/workbook/commit', 'POST', payload);
  console.log('Import job:', job.job);
  let previous = '';
  for (let count = 0; count < 240; count++) {
    const result = (await api(`/api/erp/imports/${job.job}`)).data;
    const progress = JSON.stringify(result.progress);
    if (progress !== previous) { console.log('Progress:', progress); previous = progress; }
    if (result.status === 'completed') { console.log('Import completed:', JSON.stringify(result.summary)); break; }
    if (result.status === 'interrupted') throw new Error(`Import interrupted: ${result.last_error}`);
    if (count === 239) throw new Error('Import still processing after two minutes. Check the stored job before retrying.');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  const replay = await api('/api/erp/workbook/commit', 'POST', payload);
  if (replay.job !== job.job || replay.status !== 'completed') throw new Error('Replay verification failed.');
  const stats = await api('/api/erp/overview');
  console.log('Replay verified without duplicate writes. ERP overview:', JSON.stringify(stats));
} finally { await new Promise(resolve => server.close(resolve)); }
