# Artimex Bakery — immersive premium preview

Astro + React + TypeScript integration of `Artimex_Bakery_Premium_Code.zip`, built from `src/` rather than the ZIP's compiled `dist/`.

The mockup's photography, typography (Cormorant Garamond and DM Sans), dark wood, warm light, section composition, responsive styles and ES/EN content are retained. Fontsource packages bundle local fonts; WebP images include mobile hero crops.

## Run and verify

Node.js 22.12+ or 24, npm, and Google Chrome for browser tests.

```sh
npm ci
npm run dev
npm run check
npm run build
npm test
npm run preview
```

Development and built preview: http://127.0.0.1:4174.

## Routes and interactions

- `/` and `/es/`: Spanish; `/en/`: English.
- Three fullscreen hero scenes: automatic rotation, manual selectors, arrows, pause/resume, keyboard and touch; respects reduced motion and background tabs.
- Mobile navigation, product filters, details dialogs and additional product families.
- Contact prepares a reviewable email draft. Opening the email application requires clicking the explicit link. No email is sent by the website, and no payment or checkout integration is added.
- `/box/` preserves the previous six-concha demonstration, surprise selection, counters and reset. A footer link makes it accessible; older `#masa-*` homepage anchors resolve to their new destinations.

The existing site had no backend, checkout, analytics or external service integration. Sales contact details and illustrative imagery come from the supplied ZIP. `noindex, nofollow` is retained for preview review.

## Hosting and tests

Vercel builds the static website into `dist/`. Publish preview deployments with `vercel deploy --target preview`; production is a separate action after review.

`npm test` validates the preserved concha demo and premium homepage at 1440, 768, 390 and 320 pixels, including navigation, languages, slider controls, filters, product-to-contact flow, draft preparation, local assets, mobile images, overflow and browser errors. To run against a deployed preview, set `PREVIEW_URL`.

Dependency note: Astro and its React integration were updated from the ZIP versions. `npm audit` still flags the transitive `http-cache-semantics@4.2.0`, for which the registry has no patched release. The deployed output is static; no Astro server or runtime HTTP cache is deployed.
