# Artimex Bakery — Code complet

Ce ZIP contient le projet Astro + React + TypeScript de la version premium, les textes espagnols et anglais, les dix images WebP et le site statique déjà compilé dans `dist/`.

## Lancer le site

Prérequis : Node.js 22 ou 24 et npm.

1. Décompresse le ZIP.
2. Ouvre le dossier `artimex-bakery-premium` dans ton éditeur ou dans Codex.
3. Dans le terminal de ce dossier, lance :

```sh
npm ci
npm run dev
```

Ouvre ensuite http://localhost:4174 dans ton navigateur.

## Vérifier et compiler

```sh
npm run check
npm run build
```

Le résultat de la compilation se trouve dans `dist/`. Pour un hébergement statique, publie le contenu de ce dossier à la racine du site. Le dossier `dist/` fourni dans le ZIP correspond à la version déjà compilée ; les commandes ci-dessus permettent de le recréer.

## Modifier le site

- Textes ES/EN et données produits : `src/data/content.ts`
- Mise en page : `src/layouts/Home.astro`
- Slider plein écran : `src/components/Hero.tsx`
- Collection et fiches produits : `src/components/Collection.tsx`
- Navigation : `src/components/Header.astro`
- Formulaire de contact : `src/components/Contact.astro`
- Styles et adaptation mobile : `src/styles/global.css`
- Images : `public/images/`

Les adresses `/` et `/es/` affichent l’espagnol. `/en/` affiche l’anglais.

Les photos sont des visuels illustratifs générés pour la maquette, avec leurs variantes optimisées pour le web et le mobile. Les polices sont installées avec les dépendances et intégrées lors de la compilation.

Le formulaire prépare un brouillon que le visiteur relit, puis ouvre explicitement dans sa propre application de messagerie. La démonstration de boîte existante reste accessible sur `/box/`. Il n’y a pas de soumission serveur ni de connexion au checkout GlobalBake dans cette version.

La configuration liée au compte Sites, les identifiants d’hébergement, les caches et `node_modules` sont exclus de cet export portable. Le code conserve la directive `noindex, nofollow` de la maquette privée ; sa modification relève d’une mise en ligne publique ultérieure.

La vérification TypeScript, la compilation et les interactions ES/EN ont été réalisées. Le contrôle visuel dans un navigateur n’était pas disponible dans l’environnement de création.
