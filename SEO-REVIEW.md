# SEO Artimex Bakery

- Domaine de référence : https://www.artimexbakery.com (canonical, hreflang, sitemap, données structurées et partage social).
- L’accueil `/` est en anglais et utilise `/en/` comme URL canonical.
- Pages anglaises et espagnoles reliées par hreflang ; x-default renvoie à la version anglaise.
- HTML statique généré par Astro ; contenu principal présent avant les interactions React.
- Données structurées Bakery avec coordonnées, sans horaires ni avis inventés.
- Photos des pains en WebP 375 et 750 px, srcset responsive et chargement différé.
- Visuels du hero en WebP avec version mobile et préchargement de la première image.
- Production indexable ; previews Vercel en noindex et robots Disallow.
- Google Analytics activé dans les builds de production, désactivé dans les previews Vercel et le serveur de développement.
- La démonstration `/box/` reste en noindex et hors sitemap.

## Validation

`npm run check`, `npm run build`, `npm test`.
Pour une preview : build et tests avec `VERCEL_ENV=preview`.

## Limites

Les produits sont présentés dans la collection et les fenêtres de détails. La création de pages produit individuelles reste un travail de contenu distinct. Search Console et les performances réelles des visiteurs ne sont pas vérifiées par ces tests.
