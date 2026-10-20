# Commerce preview and future backend

This iteration is frontend only, on `dev`, deployed with `vercel deploy --yes` (preview).
Never run `--prod`, promote a deployment, or update production aliases for this task.

## Implemented

- English `/en/shop/` and Spanish `/es/tienda/` storefronts.
- Personal (B2C) and business (B2B) journeys selected by `?customer=personal|business`.
- Search/filter, quantity controls, separate persistent demo carts, and a local checkout preview.
- Example USD prices for B2C; account pricing pending for B2B. Twelve-piece business cases are illustrative only.
- No order transmission, customer-data persistence, account authentication or payment capture.
- No XML is fabricated or sent. Catalog IDs are website IDs, not validated GlobalBake SKUs.
- `createPreviewDraft` in `src/data/commerce.ts` is an internal frontend model, not an ERP contract.
- Demo shop pages are always `noindex, nofollow`; Vercel preview builds also disable indexing and analytics for the main site.

## Proposed next phase (not installed)

Keep Astro for the storefront. A separate Next.js backend on VPS2 can expose authenticated commerce endpoints with PostgreSQL for accounts, catalog mapping and orders. Stripe can handle payments. This is an architecture proposal, not a claim that services, credentials or schemas are configured.

The backend must calculate prices, taxes and permitted quantities from authoritative data, verify B2B accounts and negotiated prices, and treat browser totals as untrusted. Use hosted payment pages, signed webhooks, idempotent order creation and a durable ERP export queue. Payment confirmation and ERP acknowledgement must be tracked independently; frontend success pages must not mark orders paid.

## GlobalBake XML prerequisites

Obtain the client's exact product/version, integration specification, example import/export files (and XSD if available), transport/authentication details, test environment, SKU/customer identifiers and acknowledgement/retry rules. Confirm source of truth for catalog, stock, pack sizes and B2B pricing. Also confirm taxes, pickup/delivery coverage, cutoffs, minimums and B2C refund rules.

Map an approved internal order to the **documented** XML contract server-side. Do not assume a SOAP endpoint, invent XML element names, expose ERP credentials in the browser, or claim compatibility until a round-trip passes in the client's test environment.

Official documentation starting point: https://www.globalbake.com.au/gbdoc.html

## Local validation

`npm run check`, `npm run build`, `npm test`.

Preview cart keys: `artimex-shop-preview-v1-personal` and `artimex-shop-preview-v1-business`. Only product IDs and quantities are stored locally. Entered checkout details are not saved or transmitted. Clearing a cart is available in the selection panel.
