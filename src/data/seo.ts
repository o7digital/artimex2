// Preview builds stay out of search; the public site is indexable after approval.
export const indexingEnabled = process.env.VERCEL_ENV !== 'preview' && process.env.SEO_NOINDEX !== 'true';
export const indexablePaths = ['/es/', '/en/', '/es/aviso-de-privacidad/', '/en/privacy-notice/'];
