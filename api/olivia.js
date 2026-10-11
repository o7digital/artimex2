export const config = { maxDuration: 60 };
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  const origin = req.headers.origin;
  const allowed = new Set(['https://www.artimexbakery.com', 'https://artimexbakery.com', 'https://artimex2.vercel.app', process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`, process.env.VERCEL_BRANCH_URL && `https://${process.env.VERCEL_BRANCH_URL}`].filter(Boolean));
  if (!allowed.has(origin)) return res.status(403).json({ error: 'Origin not allowed' });
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return res.status(415).json({ error: 'JSON required' });
  const body = req.body;
  if (!body || typeof body.message !== 'string' || !body.message.trim() || body.message.length > 2000 || !['es','en'].includes(body.language) || (body.conversation != null && (typeof body.conversation !== 'string' || body.conversation.length > 180))) return res.status(400).json({ error: 'Invalid message' });
  if (!process.env.OLIVIA_GATEWAY_KEY) return res.status(503).json({ error: 'Olivia unavailable' });
  try {
    const response = await fetch('https://olivia.o7digitalgroup.com/artimex/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OLIVIA_GATEWAY_KEY}`, 'X-Visitor-IP': req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown' },
      body: JSON.stringify({ message: body.message.trim(), language: body.language, conversation: body.conversation }), signal: AbortSignal.timeout(57000),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status === 429 ? 429 : 503).json({ error: 'Olivia unavailable' });
    if (typeof data.answer !== 'string' || typeof data.conversation !== 'string') throw new Error('Invalid response');
    return res.status(200).json({ answer: data.answer, conversation: data.conversation, version: '3.5' });
  } catch { return res.status(503).json({ error: 'Olivia unavailable' }); }
}
