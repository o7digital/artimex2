# Corrections SEO sur dev

Commit et push sur dev autorisés par le propriétaire.
La fusion de main reste en attente : cette branche n'existe pas dans le dépôt local ni sur origin.

## Changements

- Pages publiques indexables ; la démonstration /box/ reste en noindex.
- Canonical espagnol /es/ : / et /es/ présentent le même contenu, / renvoie donc vers /es/ dans sa balise canonical.
- Hreflang es, en et x-default en URL absolues, cohérents avec le sitemap.
- robots.txt et sitemap.xml générés pendant le build, sans la démonstration ni l'accueil dupliqué.
- Métadonnées Open Graph et Twitter, URL et image de partage absolues.
- Données structurées Bakery avec les coordonnées affichées. Aucun horaire, prix ou avis inventé.
- Douze photos de pains en WebP (375 et 750 px), dimensions exactes et srcset responsive. Les JPG originaux restent dans public/fotos.

## Domaine et indexation

Le domaine configuré est https://artimex2.vercel.app. La variable PUBLIC_SITE_URL permet de le remplacer avant un build destiné au domaine final.
Les builds Vercel preview restent en noindex. SEO_NOINDEX=true permet de désactiver l'indexation sur une installation de validation.
L’indexation est active dans les builds de production et désactivée dans les previews Vercel.

## Vérification locale

npm run check
npm run build
npm test
npm run preview

Puis ouvrir http://127.0.0.1:4174/es/, /en/, /robots.txt et /sitemap.xml.

## Limites

Ces corrections préparent l'indexation et optimisent les images ; elles ne garantissent pas un classement Google.
Les produits restent présentés dans la collection et les fenêtres de détails. Des pages produit individuelles pourront faire l'objet d'un travail séparé.
Le domaine final et la connexion à Search Console ne sont pas configurés par ces changements.

## Trois pains ajoutés à la collection

La quatrième ligne contient Niño envuelto, Elote fino et Pan relleno, avec les trois photos fournies. Le nom et le type de garniture du troisième pain restent à confirmer ; la fiche utilise une description générale.
