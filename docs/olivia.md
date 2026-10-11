# Olivia on Artimex

Olivia uses the running VPS Olivia V3.5 service, with a dedicated `artimex` tenant and service account. The English and Spanish home pages load the floating assistant. Its visual reference is `o7digital/suitesmine-bot`, particularly `components/O7Widget.jsx` and `public/olivia-floating-theme.js`: cream conversation area, dark header, gold detail, round launcher, layered shadows and subtle movement. Movement respects reduced-motion preferences.

Browser → `/api/olivia` (Vercel function) → authenticated `https://olivia.o7digitalgroup.com/artimex/chat` → private `olivia-v3:8093/v1/chat`.

`OLIVIA_GATEWAY_KEY` is a sensitive, production-only Vercel environment variable. The VPS gateway runs from `/opt/o7/apps/artimex-olivia`, using the versioned files in `infrastructure/olivia`. Its private `.env` holds `GATEWAY_KEY`, `OLIVIA_EMAIL` and `OLIVIA_PASSWORD`. Bootstrap owner credentials are stored separately on the VPS with mode 0600. Never commit these credentials. No core API, database port, JWT or password is exposed to the browser.

The gateway fixes the tenant, routing and approved business context; validates messages; rate-limits visitor IPs; and signs conversation identifiers. It exposes only `/chat` and a private `/health`. The proxy has one exact `/artimex/chat` ingress. Failed AI calls produce a visible retry state without a fabricated answer. Conversations are stored in Artimex's tenant on the VPS. Browser state lasts only for the current page.

The contact button opens Artimex's existing contact form and prefills the latest question when the message field is empty. The existing Formspree integration submits enquiries independently of the AI engine. Olivia cannot place orders or confirm prices, availability, allergens or appointments. Business knowledge is in `infrastructure/olivia/knowledge.txt`; keep it aligned with approved site content. The English and Spanish privacy notices describe AI processing.

Validation:

```sh
npm run build
npm run check
npm test
node --test infrastructure/olivia/api.test.mjs
```

Update the gateway by copying the three infrastructure files to its VPS directory and running `docker compose up -d --force-recreate` there. Validate its health with `docker exec artimex-olivia-gateway node -e 'fetch("http://localhost:3097/health").then(r=>r.text()).then(console.log)'`.

Rollback: remove `OliviaChat` from `src/layouts/Home.astro` and redeploy; the Artimex gateway can be stopped independently. Do not modify or restart other Olivia tenants or the shared V3 service.
