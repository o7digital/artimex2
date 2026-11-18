# GlobalBake : catalogue, stocks et commandes

Périmètre demandé : travail sur `dev`, administration Directus sur Railway, import du catalogue et des stocks, export des commandes vers GlobalBake. Le site public reste distinct de cet environnement ; ne pas promouvoir la boutique ni modifier les alias de production dans ce chantier.

Ce document définit la préparation de l’intégration. Il ne certifie ni la compatibilité d’un XML ni une connexion opérationnelle à l’ERP. Le CSV Artimex, le contrat d’échange et les accès de test ne sont pas encore disponibles.

## Faits vérifiés et limites de la recherche

La présentation publiée par Foxware décrit des exports de données et des imports pouvant nécessiter une configuration initiale et une intervention du fournisseur. Elle mentionne les échanges de fichiers avec les caisses et la commande web, sans fournir de contrat XML pour Artimex. [GlobalBake Product Overview, pages 6–7](https://www.foxware.com.au/documents/IBS_GB_Product_Overview_Web.pdf).

Les groupes fonctionnels décrivent plusieurs emplacements de stock, des unités de tarification, des minimums et multiples de commande, ainsi que des formats EDI sélectionnés. Leur présence dans la gamme ne confirme pas leur activation chez Artimex. [GlobalBake Feature Groups](https://www.globalbake.com.au/documents/GB_Feature_Groups.pdf).

Le prix dépend notamment du prix de base client et de mécanismes de tarifs et de remises. Il faut obtenir les règles Artimex avant le calcul B2B. [Pricing Structure](https://www.globalbake.com/help/Downloads/Pricing/PricingStructure.pdf). Des concessions spécifiques aux commandes web sont également documentées. [Concessions, section Web Product Concessions](https://www.globalbake.com/help/Downloads/Pricing/Concessions.pdf).

Recherche officielle effectuée le 18 novembre 2026 : aucun XSD, WSDL, exemple d’import XML ou contrat d’API correspondant à Artimex n’a été identifié. Certaines pages d’aide expirent ou affichent une protection anti-robot. Cela ne démontre pas l’absence d’une interface disponible auprès du fournisseur. [Point d’entrée documentaire GlobalBake](https://www.globalbake.com.au/gbdoc.html).

## Répartition proposée des données

Cette architecture et les procédures ci-dessous sont des recommandations d’implémentation à valider avec Artimex et son interlocuteur GlobalBake.

| Donnée | Référence proposée | Traitement Directus |
| --- | --- | --- |
| Code produit ERP | GlobalBake | Texte stable, zéros initiaux et suffixes préservés |
| Unité, carton, multiples, minimums | GlobalBake ou règle Artimex validée | Valeurs explicites, aucun carton de douze supposé |
| Stock vendable | GlobalBake et règle de disponibilité convenue | Valeur datée par emplacement, avec provenance |
| Prix B2C et devise | Tarif Artimex validé | Prix serveur, aucun prix de démonstration pour une vente réelle |
| Comptes et tarifs B2B | GlobalBake et validation commerciale | Données privées, calcul selon le compte approuvé |
| Photos et descriptions ES/EN | Directus | Enrichissement éditorial préservé par les synchronisations |
| Commandes web | Backend de commerce | Lignes et montants figés au moment de la commande |
| Numéro et accusé ERP | GlobalBake | Mise à jour après réception de l’accusé métier |

Les identifiants actuels du site ne sont pas des SKU ERP validés. Chaque correspondance doit être explicite ; une ressemblance de nom ne suffit pas.

## Première étape : le CSV Artimex

1. Conserver le fichier source hors des dossiers publics et de Git ; enregistrer empreinte SHA-256, date, utilisateur et résultat.
2. Vérifier en-têtes, séparateur, encodage, décimales, codes et unités. Mapper les colonnes réelles sans inventer de champs GlobalBake.
3. Présenter un aperçu avant import : nouveautés, modifications, doublons et erreurs par numéro de ligne. Les codes restent des chaînes de caractères.
4. Importer en brouillon avec une clé ERP unique. Rejouer le fichier doit mettre à jour les mêmes produits sans doublons et préserver les enrichissements web.
5. Mettre en quarantaine prix absents, unités ambiguës ou codes manquants. Ne pas convertir un prix absent en zéro ou un stock inconnu en disponibilité illimitée. Une ligne absente d’un export partiel ne signifie pas suppression.
6. Valider prix, unités, canaux B2C/B2B et images avant publication.

Le CSV initial ne fournit pas à lui seul le futur contrat XML ni un stock vendable en temps réel.

## Flux entrant : GlobalBake vers Directus

Le transport dépend de l’interface réellement autorisée chez Artimex : export de fichiers, transfert sécurisé ou API documentée. Ne présumer ni endpoint SOAP ni disponibilité d’un serveur SFTP.

Recevoir le lot dans une zone de préparation, le valider, puis appliquer les modifications permises. Garder identifiant externe éventuel, empreinte, date métier, date de réception et rapport de traitement. Une reprise ne doit ni recréer les produits ni appliquer deux fois une opération de stock.

Distinguer niveau absolu et mouvement de stock : rejouer un niveau peut être idempotent ; additionner deux fois un mouvement ne l’est pas. Exiger les règles de séquence et refuser qu’un fichier ancien remplace un état récent. Confirmer ce que signifie « disponible » : physique, réservé, prévu, dépôt et date de livraison. Bloquer ou limiter les ventes si fraîcheur ou unité ne permettent pas de garantir la disponibilité.

Une application partielle doit rester visible comme telle. Les lignes rejetées et leur motif doivent être consultables avant toute automatisation.

## Flux sortant : boutique vers GlobalBake

Le navigateur transmet références et quantités. Le backend vérifie client, canal, autorisations B2B, prix, taxes, frais, unités, minimums et disponibilités. Les totaux reçus du navigateur ne font jamais référence.

Enregistrer la commande et son événement d’export de façon atomique, ou prévoir une réconciliation explicite. La file d’export est persistante. Le connecteur sérialise l’instantané validé selon le contrat ERP réel, puis vérifie le fichier avant transfert.

Garder un identifiant externe de commande stable à chaque tentative. Relier commande, fichier, empreinte, tentative et accusé par une référence de corrélation. Le fournisseur doit confirmer comment GlobalBake reconnaît une commande déjà importée.

Un transfert réussi, un HTTP 200 ou la présence d’un fichier ne prouvent pas l’import métier. Seul l’accusé convenu permet de marquer la commande comme reçue. Après un résultat ambigu, vérifier l’état distant ou demander une revue avant renvoi pour éviter un doublon.

## Statuts et reprises

Les états ci-dessous sont un modèle proposé, pas une déclaration de fonctionnalités déjà installées.

| Axe | États utiles | Preuve |
| --- | --- | --- |
| Commande | brouillon, à valider, approuvée, annulée | Validation serveur et règles commerciales |
| Paiement | non demandé, en attente, payé, échoué, remboursé | Événement authentifié du prestataire |
| Export ERP | bloqué par spécification, prêt, en cours, envoyé, accusé reçu, rejeté, à examiner | Tentatives et accusé métier corrélé |
| Import | reçu, validé, appliqué, partiel, rejeté | Rapport et modifications effectuées |

Paiement et acceptation ERP sont indépendants. Une page de succès navigateur ne prouve pas un paiement. Confirmer le moment d’export B2C et B2B, notamment pour les comptes à crédit.

Prévoir prise en charge atomique par un worker, échéance, nombre maximal de tentatives, délai croissant et revue manuelle après échec. Les annulations et modifications après export exigent des règles et messages dédiés ; ne pas réécrire silencieusement un fichier acquitté.

## Encadrement XML

- Aucun XML annoncé compatible avant réception du contrat et d’un exemple accepté. Un XML bien formé peut être incorrect pour l’ERP.
- Valider schéma ou règles fournis, version, encodage, espaces de noms, dates, fuseau, décimales et arrondis ; ne pas inventer de balises ou de XSD.
- Rejeter DTD et entités externes, interdire les schémas distants, limiter taille, profondeur et nombre d’éléments. Sérialiser et échapper les textes avec une bibliothèque dédiée.
- Garder les identifiants côté serveur. Utiliser une destination configurée et un transport autorisé, jamais une URL arbitraire de visiteur. Pour les fichiers déposés, convenir d’une écriture temporaire puis d’un renommage atomique.
- Restreindre commandes, clients, tarifs privés et journaux dans Directus. Aucune clé de service dans le JavaScript public.
- Définir rétention et accès pour les fichiers contenant des données clients ; ne pas journaliser leur contenu complet.

## Informations à obtenir du client et du fournisseur

1. **Installation** : produit, version, hébergement, contact et modules d’interface activés.
2. **Catalogue** : CSV réel, dictionnaire des colonnes, codes/suffixes, unités, cartons et produits actifs.
3. **Prix et stocks** : tarifs B2C/B2B, devise, taxes, emplacements, définition du vendable, réservations et fréquence/séquence des exports.
4. **Contrat XML** : spécification dans chaque sens, export réel catalogue/stock, commande d’import acceptée, exemples d’accusé/rejet et XSD s’il existe.
5. **Transport** : protocole, destinations et accès de test, authentification, nommage, collecte, archivage et filtrage réseau.
6. **Commandes** : identifiant externe reconnu, gestion/recherche des doublons, compte B2C ou générique, comptes B2B, tarifs imposés ou recalculés, dates/tournées et modifications après import.
7. **Exploitation** : validation, paiement, livraison, minimums, annulations, alertes et responsable des rejets.
8. **Recette** : environnement isolé et personne habilitée à vérifier le résultat dans GlobalBake. Aucune commande fictive contre la production.

## Critères avant activation

- Import réel : codes, unités et valeurs conformes ; second passage sans doublon ; enrichissements web préservés.
- Rejets explicites pour données invalides, unités inconnues et stock périmé.
- Une commande serveur valide importée une seule fois, avec numéro ERP et accusé corrélés.
- Rejet, coupure après transfert et relance testés sans double commande.
- Prix B2B privés et séparation paiement/ERP vérifiés.
- Produits et prix de démonstration exclus par défaut de la vente réelle.

## Validation du dépôt

Contrôles du site : `npm run check`, `npm run build`, `npm test`. Le panier de démonstration utilise les clés `artimex-shop-preview-v1-personal` et `artimex-shop-preview-v1-business` pour les seuls identifiants et quantités ; sa simulation ne transmet pas de commande à GlobalBake. Les contrôles du backend et preuves de déploiement sont à documenter avec son implémentation.
