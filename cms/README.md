# Artimex Commerce Studio

Backend de développement sur Railway, avec PostgreSQL 18, Directus 12.6.1 et un Studio privé dédié. La branche `dev` et les prévisualisations Vercel consomment ce backend ; la production artimexbakery.com n’est pas raccordée.

- Studio : https://studio-dev-037f6348.up.railway.app
- Administration Directus : https://directus-dev-d1145f5f.up.railway.app/admin/
- [Projet Railway](https://railway.com/project/6ff86a60-1430-4cee-825b-e3238ff78075)
- Identifiants non sensibles de déploiement : [deployment.json](deployment.json).

## Accès et interface

Le Studio reprend le principe de Nathalie Studio : connexion privée, navigation latérale, tableau de bord et formulaires dédiés. L’identité visuelle reprend Artimex : vert profond, laiton, typographie éditoriale et photo de boulangerie existante. L’interface est en espagnol ; les produits sont éditables en espagnol et en anglais.

Le compte initial utilise l’adresse `ADMIN_EMAIL` de Directus. Son mot de passe initial est conservé dans **Railway → environnement dev → service directus → Variables → ADMIN_PASSWORD**. Ne pas copier les mots de passe ou jetons dans Git, les captures ou les journaux. Après un changement de mot de passe dans Directus, cette variable initiale ne met pas à jour le compte existant.

Seule l’adresse `STUDIO_ADMIN_EMAIL`, ou un rôle explicitement désigné par `STUDIO_EDITOR_ROLE_ID`, peut ouvrir le Studio. Aucun compte client de boutique n’a encore de connexion personnelle.

## Données et fonctionnalités installées

| Collection | Utilisation |
| --- | --- |
| `commerce_products` | SKU ERP unique, noms/descriptions ES/EN, catégorie, photo HTTPS, prix par pièce en cents USD, stock en pièces, conditionnement, canaux B2C/B2B, état et provenance |
| `commerce_customers` | Particuliers/professionnels, coordonnées privées, approbation et référence client ERP |
| `commerce_orders` | Brouillons internes, client, livraison, montant calculé et états distincts de paiement/ERP |
| `commerce_order_lines` | Instantanés des produits, références, quantités et prix |
| `commerce_imports` | Empreinte, mapping, progression et rapport par ligne |
| `commerce_sync_jobs` | File persistante des échanges ERP ; exports bloqués tant que le contrat réel est absent |

Les créations de brouillons utilisent les prix conservés dans Directus et un identifiant d’idempotence. Commande, lignes et événement d’export sont créés par **une écriture relationnelle Directus**. Un même identifiant rejoué ne crée pas une deuxième commande. Le Studio refuse les prix B2B tant que les règles de tarifs négociés ne sont pas définies. Les brouillons ne réservent pas de stock ; taxes et frais restent inconnus, distincts d’un montant zéro.

L’interface permet de créer/éditer les produits et clients, publier ou archiver une fiche, créer et consulter un brouillon B2C, puis le désactiver par annulation. Elle ne permet pas de marquer un paiement comme reçu. Le paiement, les comptes clients et le checkout réel sont une phase ultérieure.

## CSV GlobalBake

Importer le fichier dans **Importar GlobalBake** : choisir le CSV, confirmer les colonnes, vérifier toutes les lignes, puis lancer l’import. Limites : 2 Mo, 2 000 produits, 80 colonnes ; virgule, point-virgule ou tabulation. Le navigateur accepte UTF-8 et les fichiers Windows-1252 habituels. Les SKU restent du texte, zéros initiaux compris. Prix en dollars USD par pièce et stock en pièces nécessitent une confirmation explicite. Les nombres avec séparateurs de milliers sont rejetés.

Les nouvelles fiches sont des brouillons, avec canaux désactivés. L’import ne remplace que les colonnes réellement sélectionnées et renseignées : photos, descriptions et traductions non mappées sont préservées. Un prix vide reste inconnu, un stock de zéro reste zéro. Un SKU absent du fichier n’est jamais supprimé.

Le serveur revalide le fichier avant toute écriture et refuse un fichier contenant des erreurs. Ensuite chaque ligne valide est appliquée individuellement : l’import complet n’est pas une transaction globale. Les résultats et compteurs sont sauvegardés toutes les 25 lignes, puis à la fin. Les erreurs sont visibles et un même SKU n’est pas recréé. L’empreinte du fichier, de son mapping et de ses options empêche de relancer un import terminé à l’identique. Pour réappliquer un fichier après une correction manuelle, fournir un nouvel export ou un mapping modifié ; les imports partiels/interrompus peuvent être repris avec le même fichier.

La file d’exécution CSV est sérialisée dans **une seule instance Studio**. Après redémarrage, expiration de la session ou interruption, renvoyer le fichier original : les références stables reprennent sans doublons. Le CSV brut n’est pas conservé. Les rapports durables contiennent SKU, numéros de ligne et résultat. Ce mécanisme ne constitue pas un worker XML ni une synchronisation automatique de stock.

## Boutique de prévisualisation

`/admin/` ouvre le Studio. `/api/commerce/catalog` est un proxy Vercel de lecture, configuré avec `COMMERCE_STUDIO_URL` uniquement pour les prévisualisations. Le proxy refuse l’environnement Vercel `production`. Aucun jeton Directus n’est envoyé au navigateur.

Le Studio expose `/catalog` : uniquement les produits publiés et une liste explicite de champs publics. Son compte technique peut lire la collection produits entière ; les filtres de publication et la projection publique sont imposés côté serveur. Ce choix utilise les permissions par collection prises en charge par Directus Core, sans dépendre des règles de permissions avancées. Le compte n’a aucun accès aux clients, commandes ou imports. Aucun accès anonyme Directus n’est accordé.

La boutique charge le catalogue publié au démarrage et utilise les vrais prix et conditionnements renseignés pour sa **simulation**. Les canaux non activés, les prix manquants, les conditionnements B2B inconnus et les stocks de zéro empêchent la sélection correspondante. Les brouillons importés restent privés. Si le catalogue est vide ou indisponible, la boutique de démonstration reste explicitement identifiée comme telle. Les paniers se conservent entre langues ; aucune donnée de checkout n’est transmise ou stockée.

Après publication, le catalogue du proxy peut être en cache jusqu’à 90 secondes. Recharger la boutique pour actualiser une session déjà ouverte.

## XML : ce qui est prêt et ce qui manque

Le Studio affiche les deux flux, les prérequis et la file. Il analyse un exemple XML jusqu’à 1 Mo pour montrer sa racine et ses chemins, sans afficher ses valeurs ni le conserver. DTD/entités externes et profondeur excessive sont refusés. Cette analyse ne vérifie **aucune compatibilité GlobalBake**.

Aucun XML n’est fabriqué et aucune transmission n’est activée. Chaque brouillon enregistre un événement d’export bloqué. Le contrat XML accepté, XSD éventuel, transport, environnement de test et règles d’accusé sont nécessaires pour développer puis activer le connecteur. Le [guide GlobalBake](../docs/globalbake-integration.md) détaille les deux sens et les sources officielles.

## Exploitation et sécurité

Directus et PostgreSQL ont des volumes persistants Railway. Le service Studio est sans état disque. Les jetons de session Directus sont chiffrés en AES-256-GCM dans un cookie `HttpOnly`, `Secure` et `SameSite=Strict`, jamais en localStorage. Chaque accès privé vérifie l’identité Directus courante ; les mutations exigent l’origine du Studio. Le formulaire de connexion limite les essais par IP dans cette instance. Une politique CSP interdit l’embarquement et les scripts tiers.

L’identité de lecture du catalogue est distincte de l’administrateur. Les opérations privées utilisent le jeton de l’utilisateur connecté ; le Studio n’élève pas ses permissions avec un jeton administrateur partagé. Les clés de chiffrement et identifiants restent dans les variables Railway. La rotation de `STUDIO_SESSION_SECRET` invalide les sessions Studio existantes.

Les volumes assurent la persistance, pas une politique de sauvegarde indépendante. Définir rétention, sauvegardes PostgreSQL/fichiers et test de restauration avant ouverture commerciale. Les fiches photos acceptent des URL HTTPS ; l’upload de médias au travers du Studio n’est pas encore inclus. L’administration Directus reste disponible pour les fonctions techniques.

## Développement, vérification et déploiement

```sh
npm ci --prefix cms/studio
npm run check --prefix cms/studio
npm test --prefix cms/studio
npm run check
npm run build
npm test
```

Initialisation additive du modèle, avec les variables du service Directus **dev** :

```sh
railway run --service directus --environment dev -- node cms/bootstrap.mjs
```

Recette explicite contre le dev : elle crée uniquement ses propres données `QA-*`, vérifie les écritures réelles, la confidentialité, l’idempotence, le CSV et l’interface responsive, puis supprime ses données de test. Les captures restent dans `cms/.local/qa/`, ignoré de Git.

```sh
railway run --service directus --environment dev -- node cms/studio/live-check.mjs
```

Déploiement du Studio depuis la racine du dépôt :

```sh
railway up cms/studio --path-as-root --service studio --environment dev --detach
```

Le Dockerfile exécute `npm ci --omit=dev`, avec dépendances verrouillées. `/health` contrôle la disponibilité Directus. Le déploiement du site utilise `vercel deploy --target preview`. Ne pas lancer `--prod`, promouvoir la branche ni changer les alias de production dans ce chantier.

Pour un développement local séparé : copier `cms/.env.example` vers un fichier ignoré, générer des secrets uniques, lancer `docker compose --env-file cms/.env -f cms/compose.yaml up -d`, initialiser le modèle, puis exécuter `cms/studio/server.mjs` avec l’origine locale et l’URL Directus. Ne jamais réutiliser les secrets ou la base de production.
