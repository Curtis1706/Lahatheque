
# Feature Specification: Refonte de la Suite « Gestion des Finances »

**Feature Branch**: `003-finance-management-suite`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Demandes de Versement & Relevés de Redevances (4), pour cette partie là, on va créer une page pour appelé demande de versement on garde le data table et tout , on mets des kpi aussi, ce sera dans gestion des finances. sur la page, là il manque trop de détail surtout dans le data table et autre, on a 178000 de CA, on doit comprendre parfaitement d'où ça vient, on doit tout voir en détail, tout. Finances Globales de la Plateforme, la page là aussi j'ai l'impression ça suit pas bien les trucs surtout dans le data table, est ce vraiment les trucs,; les commandes , les taotaux, etc tout est bien suivi, dans les trucs il manque pas des détails, tout doit être bien compris on doit invetiguer tout ça et corriger , bien refaire la page. Gestion Globale des Redevances & Droits, cette page aussi je crois qu'on doit bien refaire ça, data tablme et tout, les trois boutons en haut en plus d'exporter le journal, je vois pas à quoi elles servent on va enlever ça, bien détaillé et tout. sur toutes ces pages et dans les data table on veut pas d'encombrement, on veut un truc qui répond aux normes du marché aussi"

## Clarifications

### Session 2026-09-08
- Q: Lors de la validation administrative d'une demande de versement sur la nouvelle page `/admin/payouts`, quelles informations et pièces justificatives l'administrateur doit-il renseigner pour acter le paiement ? → A: Option A - Saisie obligatoire d'une référence de transaction (ID Mobile Money ou n° de virement) et de la date effective de décaissement, avec téléversement facultatif d'une pièce justificative (reçu bancaire ou capture PDF/image).
- Q: Dans le tableau des transactions de la page « Ventes & Revenus » (`/admin/sales`), comment souhaitez-vous structurer l'affichage des commandes comportant plusieurs articles pour allier clarté, traçabilité et zéro encombrement ? → A: Option A - Une ligne principale par commande consolidée avec ligne ou tiroir dépliable (accordéon) pour afficher les articles et formats individuels, garantissant que la somme des montants de commandes égale directement le Chiffre d'Affaires total sans doublon.
- Q: Sur la page « Finances Globales de la Plateforme » (`/admin/finance`), comment le tableau récapitulatif des droits et créances doit-il être articulé pour couvrir l'ensemble des partenaires tout en évitant la surcharge ? → A: Option A enrichie - Tableau unifié multi-partenaires avec filtres par rôle (Tous, Auteurs, Éditeurs Tiers, Universités) et lignes dépliables (accordéons interactifs) permettant de déployer instantanément sous chaque partenaire le détail des ouvrages, volumes et formats sans surcharger l'écran principal.

### Session 2026-09-11
- Q: Comment enregistrer et distinguer les paniers abandonnés et tentatives de paiement non abouties dans la console d'administration ? → A: Statuts exhaustifs sur les commandes (`pending`, `paid`, `credit`, `failed`, `cancelled`, `abandoned`) avec bascule automatique des `pending` sans paiement après 24h vers `abandoned`, et exclusion stricte des commandes abandonnées/échouées du CA encaissé et de l'assiette des royalties.
- Q: Comment la Vue d'ensemble des Finances et Trésorerie (`/admin/finance`, `/admin/reports`) doit-elle consolider et afficher les différents flux de revenus de la plateforme ? → A: Consolidation multi-flux avec marge nette : Affichage du Chiffre d'Affaires global encaissé, ventilé par canal (Livres numériques/audio, Livres papier, Grossistes, Abonnements, Bouquets), créances à recouvrer (`credit`), et calcul en temps réel du Net conservé par la plateforme après déduction des redevances estimées et coûts.
- Q: À quel moment et sur quelle assiette financière exacte les redevances dues aux auteurs et éditeurs doivent-elles être validées pour le reversement ? → A: Conditionnées à l'encaissement effectif : Les redevances sont calculées et visibles en statut `En attente d'encaissement` sur les achats à crédit ou en cours, et basculent en statut `Eligible au versement` uniquement lorsque le statut de paiement de la commande est effectivement `paid`.
- Q: Quelles actions de gestion et d'intervention directe l'administrateur doit-il pouvoir exécuter sur une commande depuis `/admin/orders` ? → A: Console d'actions complètes : vérification Moneroo en un clic, confirmation manuelle tous modes (espèces au comptoir, transfert Mobile Money direct avec référence SMS, virement bancaire, chèque, achat à crédit), relance par email/contact pour les paniers abandonnés, téléchargement facture PDF acquittée ou bordereau, et annulation.
- Q: De quel niveau de détail et de format d'export l'administration financière a-t-elle besoin pour sa comptabilité et son rapprochement bancaire ? → A: Export Grand Livre Comptable complet (Excel/CSV + PDF officiel) avec montants bruts, commissions opérateurs estimées/réelles, montants nets encaissés, mode d'encaissement, référence de transaction, statut de livraison, et journal d'audit administratif.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Supervision Exhaustive et Justification Détaillée du Chiffre d'Affaires (Priority: P1)

En tant qu'administrateur de la plateforme LAHAThèque, je souhaite accéder à une page « Ventes & Revenus » claire, moderne et transparente afin de comprendre avec précision l'origine de chaque centime composant le Chiffre d'Affaires total consolidé (montant 100 % dynamique et évolutif calculé en temps réel à partir des transactions en base, dont les 178 000 FCFA constatés lors de la revue ne sont qu'un instantané ponctuel), sans commande manquante et sans calcul opaque.

**Why this priority**: La transparence financière est le socle de la confiance administrative. L'administrateur doit être en mesure d'auditer instantanément chaque franc encaissé par canal et de réconcilier les indicateurs de synthèse avec le tableau détaillé des transactions, de manière pérenne et évolutive au fur et à mesure des nouvelles ventes.

**Independent Test**: Naviguer sur `/admin/sales`, vérifier que le total consolidé affiché correspond exactement à la somme arithmétique dynamique des transactions réelles listées (B2C lecteurs, B2B universités, grossistes), filtrer par canal ou période et constater la cohérence immédiate des métriques et graphiques sans rupture d'affichage.

**Acceptance Scenarios**:

1. **Given** le Chiffre d'Affaires total consolidé dynamique (calculé en direct par la somme des commandes réelles payées), **When** l'administrateur consulte le tableau des transactions de `/admin/sales`, **Then** la totalité des commandes payées réelles en base de données (commandes unitaires B2C, commandes universitaires campus/bouquets et commandes grossistes) apparaît dans le tableau avec leur référence, acheteur, libellé du produit, montant net, mode de règlement et date précise, garantissant une égalité arithmétique parfaite avec le total consolidé.
2. **Given** la vue des transactions sur `/admin/sales`, **When** l'administrateur filtre par canal (ex: « Bouquets Universitaires » ou « Commandes Grossistes »), **Then** le tableau et les cartes de synthèse affichent uniquement le sous-ensemble sélectionné avec un compteur exact et une ventilation actualisée.
3. **Given** une commande dans la liste, **When** l'administrateur consulte la ligne, **Then** il distingue sans ambiguïté le type d'acheteur (Lecteur, Auteur, Université, Grossiste), le format d'article (Livre numérique, Livre papier, Livre audio, Bouquet documentaire) et le canal de paiement utilisé.

---

### User Story 2 - Gestion Dédiée des Demandes de Versement et Relevés de Redevances (Priority: P1)

En tant que responsable financier ou administrateur, je souhaite disposer d'une page autonome « Demandes de Versement » au sein du menu « Gestion des Finances » afin d'instruire, valider ou rejeter les demandes de retrait des auteurs, éditeurs tiers et universités partenaires avec des indicateurs clés (KPIs) de suivi et un tableau d'instruction sans encombrement.

**Why this priority**: La validation des reversements financiers engage la trésorerie de la plateforme et nécessite une interface sécurisée, dédiée, avec traçabilité et justificatifs, plutôt qu'une sous-section reléguée en bas d'une page de paramétrage de barèmes.

**Independent Test**: Accéder à `/admin/payouts` depuis la barre latérale, consulter les 4 KPIs de suivi (Total en attente, Versements validés, Déjà versé, Délai moyen), exécuter la validation d'une demande avec référence de paiement et vérifier son changement de statut et la mise à jour immédiate des totaux.

**Acceptance Scenarios**:

1. **Given** l'existence de demandes de retrait émises par des partenaires, **When** l'administrateur ouvre `/admin/payouts`, **Then** il visualise immédiatement les KPIs de synthèse (Montant global en attente, Nombre de requêtes, Montant liquidé sur la période, Délai moyen d'exécution) et un tableau épuré listant les demandes avec bénéficiaire, assiette brute, montant net dû, mode de versement (Mobile Money / Virement bancaire) et statut.
2. **Given** une demande en attente (`pending`), **When** l'administrateur clique sur « Valider », **Then** une modale de confirmation s'affiche demandant la référence de transaction et confirmant l'impact financier avant de passer la demande au statut « Validée / Payée ».
3. **Given** une demande non conforme, **When** l'administrateur clique sur « Rejeter », **Then** une modale impose la saisie d'un motif de rejet explicite transmis au bénéficiaire, et la demande est marquée « Rejetée » sans décaissement.

---

### User Story 3 - Consolidation 360° et Réconciliation sur Finances Globales (Priority: P2)

En tant que directeur financier ou administrateur, je souhaite avoir une vue réconciliée à 360° sur « Finances Globales de la Plateforme » pour suivre l'équilibre entre recettes encaissées, encours de crédits, redevances dues aux créateurs, montants liquidés et commissions nettes conservées par LAHAThèque.

**Why this priority**: L'administrateur doit disposer d'un état des lieux consolidé du compte de résultat d'exploitation de la plateforme pour piloter la santé financière globale.

**Independent Test**: Ouvrir `/admin/finance`, vérifier la réconciliation arithmétique : Chiffre d'Affaires Encaissé = Part Plateforme + Redevances Dues Partenaires (versées + solde restant). Vérifier que le tableau récapitulatif présente les différents partenaires (auteurs, éditeurs, universités) avec des filtres et une modale de détail d'audit claire.

**Acceptance Scenarios**:

1. **Given** les flux de vente de la plateforme, **When** l'administrateur consulte `/admin/finance`, **Then** les cartes de KPIs affichent avec exactitude le Chiffre d'Affaires Global réel et dynamique (calculé en temps réel sur l'ensemble des encaissements en base), les créances en cours, le total des redevances déjà liquidées, et le solde des redevances restant à verser.
2. **Given** le tableau récapitulatif des droits par partenaire, **When** l'administrateur filtre par rôle (Auteur, Éditeur tiers, Université), **Then** chaque ligne affiche les volumes vendus, le taux contractuel moyen, le montant brut généré, le montant déjà réglé et le solde exigible.
3. **Given** une ligne partenaire, **When** l'administrateur clique sur « Détails », **Then** un panneau latéral ou une modale affiche la décomposition par ouvrage, par format (papier, numérique, audio) et par canal (ventes directes vs part au prorata des bouquets).

---

### User Story 4 - Clarification et Épuration de la Gestion des Redevances & Droits (Priority: P2)

En tant qu'administrateur, je souhaite une page « Gestion des Redevances & Droits » recentrée sur le paramétrage des barèmes et des contrats conventionnés, débarrassée des boutons superflus et du bloc redondant des demandes de versement.

**Why this priority**: Éliminer l'encombrement cognitif et les liens orphelins (`Auteurs (2)`, `Éditeurs (0)`, `Universités (2)`) tout en garantissant un contrôle fluide sur les taux contractuels dérogatoires.

**Independent Test**: Ouvrir `/admin/royalties`, constater l'absence des 3 boutons superflus dans l'en-tête, vérifier que seul le bouton pertinent « Exporter le Journal » subsiste avec le formulaire des barèmes généraux et le tableau des contrats partenaires épuré et pagination fluide.

**Acceptance Scenarios**:

1. **Given** la page `/admin/royalties`, **When** elle se charge, **Then** les boutons superflus `Auteurs (2)`, `Éditeurs (0)` et `Universités (2)` ne sont plus affichés dans l'en-tête, libérant l'espace pour une présentation sobre et lisible.
2. **Given** la séparation des flux, **When** l'administrateur consulte `/admin/royalties`, **Then** la section des demandes de versement n'est plus présente (elle est accessible via sa page dédiée `/admin/payouts`), la page se concentre sur les barèmes globaux et les taux dérogatoires par partenaire.
3. **Given** le tableau des partenaires conventionnés, **When** l'administrateur clique sur « Modifier Taux », **Then** il ajuste le pourcentage contractuel qui se sauvegarde instantanément avec un toast de confirmation et un rafraîchissement sans rechargement lourd.

---

### User Story 5 - Navigation Unifiée dans le Menu « Gestion des Finances » (Priority: P3)

En tant qu'utilisateur du panneau d'administration, je souhaite que la barre latérale regroupe logiquement ces quatre piliers financiers sous le menu déroulant « Gestion des Finances ».

**Why this priority**: Cohérence ergonomique et rapidité d'accès aux différentes fonctionnalités financières de la plateforme.

**Independent Test**: Observer la sidebar admin, dérouler « Gestion des Finances » et naviguer successivement vers les 4 liens, en vérifiant que le menu reste actif et met en surbrillance la page courante.

**Acceptance Scenarios**:

1. **Given** la barre latérale du dashboard administrateur, **When** l'utilisateur visualise « Gestion des Finances », **Then** il retrouve les quatre sous-liens ordonnés :
   - Ventes & Revenus (`/admin/sales`)
   - Finances Globales (`/admin/finance`)
   - Redevances & Droits (`/admin/royalties`)
   - Demandes de Versement (`/admin/payouts`)
2. **Given** une navigation sur l'un de ces liens, **When** l'URL change, **Then** le menu parent reste déplié avec l'indicateur actif positionné sur l'élément courant.

---

### Edge Cases

- Que se passe-t-il si une commande comporte plusieurs lignes de natures différentes (ex: un livre papier et un livre numérique) ? Le tableau des transactions doit ventiler chaque ligne avec son propre format et sous-total tout en conservant la référence de la commande parente pour éviter tout double comptage du CA global.
- Comment le système réagit-il lorsqu'une demande de versement dépasse le solde disponible d'un partenaire ? L'interface et l'API backend bloquent la validation avec un message d'avertissement explicite indiquant l'écart entre montant réclamé et solde calculé.
- Que se passe-t-il si un utilisateur applique un filtre temporel ou un filtre par mot-clé ne renvoyant aucun résultat ? Les tableaux affichent un état vide soigné, informatif et actionnable (« Aucune transaction trouvée pour cette période », « Réinitialiser les filtres »), sans décalage de structure (zéro layout shift).
- Comment sont gérés les statuts de paiement en cours (ex: Mobile Money en attente) ? Ils sont clairement identifiés par un badge sémantique d'avertissement neutre et ne sont pas comptabilisés dans le CA encaissé ferme tant qu'ils ne sont pas validés.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT fournir une page dédiée `/admin/payouts` (« Demandes de Versement ») accessible depuis le menu « Gestion des Finances ».
- **FR-002**: La page `/admin/payouts` DOIT comporter au minimum quatre cartes de KPIs synthétiques : Montant total en attente de validation, Nombre de demandes en attente, Montant cumulé versé sur le mois en cours, et Nombre de bénéficiaires uniques rétribués.
- **FR-003**: Le tableau des demandes de versement sur `/admin/payouts` DOIT afficher pour chaque demande : l'identité et le type du bénéficiaire (Auteur, Éditeur, Université), l'ouvrage ou motif contractuel, la période couverte, l'assiette brute, le taux, le montant net dû, le mode de paiement prévu (avec coordonnées masquées/sécurisées), la date de dépôt et le statut actuel.
- **FR-004**: Toute action de validation d'une demande de versement DOIT exiger la saisie obligatoire d'une référence de transaction (ID Mobile Money ou n° de virement) et d'une date effective, avec possibilité de téléverser facultativement un justificatif de paiement (PDF ou capture d'écran). Le rejet d'une demande DOIT exiger la saisie d'un motif obligatoire consigné et notifié au bénéficiaire.
- **FR-005**: La page `/admin/sales` DOIT intégrer l'exhaustivité des transactions génératrices de revenus de la plateforme (commandes B2C lecteurs & auteurs, commandes institutionnelles papier / bouquets des universités, commandes de réassort et licences B2B des grossistes), assurant une réconciliation arithmétique stricte à 100 % avec le Chiffre d'Affaires consolidé dynamique affiché (somme arithmétique exacte et évolutive de toutes les commandes payées en base).
- **FR-006**: Le tableau de données de `/admin/sales` DOIT présenter chaque commande sur une ligne consolidée (N° commande, Date & heure, Acheteur avec badge de rôle, Canal de vente, Montant net encaissé, Mode de règlement, Statut) pour que la somme directe des montants égale le Chiffre d'Affaires. Chaque ligne DOIT être dépliable (accordéon interactif) pour dévoiler la décomposition exacte de la commande : liste des articles, format (numérique, papier, audio, bouquet), quantité, prix unitaire, remise et sous-total.
- **FR-007**: La page `/admin/finance` DOIT présenter un tableau de bord réconcilié à 360° distinguant les flux entrants encaissés par catégorie, les créances et encours, les redevances dues, les redevances payées et la commission nette conservée par la plateforme.
- **FR-008**: Le tableau récapitulatif des partenaires sur `/admin/finance` DOIT être unifié et couvrir l'ensemble des ayant-droits (auteurs, maisons d'édition tierces, universités partenaires) avec une barre d'onglets de filtrage par rôle (`Tous`, `Auteurs`, `Éditeurs`, `Universités`). Chaque ligne partenaire DOIT comporter une ligne dépliable (accordéon interactif) pour visualiser instantanément la ventilation des droits par ouvrage et par format (papier, numérique, audio, bouquet), complétée par un bouton de détails pour l'audit complet.
- **FR-009**: La page `/admin/royalties` DOIT être nettoyée de ses éléments superflus : suppression définitive des trois boutons orphelins `Auteurs (2)`, `Éditeurs (0)` et `Universités (2)` dans l'en-tête, et retrait de la section déplacée des demandes de versement.
- **FR-010**: La page `/admin/royalties` DOIT conserver le paramétrage des barèmes globaux et la table de gestion des taux contractuels dérogatoires avec modification immédiate des taux et audit des modifications.
- **FR-011**: Les tableaux de données sur l'ensemble de ces quatre écrans DOIVENT répondre aux standards modernes d'ergonomie : design aéré sans encombrement visuel, typographie Playfair Display pour les en-têtes et Poppins pour le corps/chiffres, absence totale d'émojis (icônes Lucide exclusives), classes sémantiques strictes (interdiction absolue de codes hexadécimaux en dur), et adaptabilité mobile-first (scroll horizontal contrôlé ou cartes empilées sur mobile).
- **FR-012**: La navigation dans `dashboard-sidebar.tsx` DOIT inclure les quatre sous-liens sous le groupe « Gestion des Finances » avec détection dynamique du sous-menu actif sur les routes correspondantes.
- **FR-013**: Le système DOIT gérer le cycle de vie exhaustif des commandes et tentatives de paiement (`pending`, `paid`, `credit`, `failed`, `cancelled`, `abandoned`). Toute commande initiée sans finalisation après 24 heures DOIT basculer automatiquement au statut `abandoned` (Panier abandonné).
- **FR-014**: Les commandes au statut `abandoned`, `failed` et `cancelled` DOIVENT être strictement exclues du Chiffre d'Affaires encaissé et de l'assiette de calcul des redevances, tout en restant visibles dans des vues et filtres dédiés sur `/admin/orders` et `/admin/sales` avec métrique du manque à gagner et déclencheur de relance client.
- **FR-015**: La page `/admin/orders` DOIT fournir une console d'actions administratives : (1) vérification instantanée auprès de Moneroo pour les commandes `pending`, (2) confirmation manuelle tous modes (espèces au comptoir, transfert Mobile Money direct avec référence SMS, virement bancaire, chèque, achat à crédit avec date d'échéance), (3) relance de panier abandonné par email/message, (4) téléchargement de la facture PDF acquittée officielle et du bordereau d'expédition, et (5) annulation administrative.
- **FR-016**: Le calcul des redevances et royalties dues aux auteurs et éditeurs DOIT être conditionné à l'encaissement effectif : les droits générés par des commandes à crédit restent en statut `En attente d'encaissement` et ne deviennent exigibles/reversibles (`Eligible au versement`) qu'après confirmation effective du paiement (`paid`).
- **FR-017**: Le système DOIT générer un export Grand Livre Comptable complet au format Excel/CSV et PDF officiel, intégrant les montants bruts, les commissions passerelles estimées/réelles, les montants nets encaissés, le canal de paiement, la référence de transaction et l'identifiant de l'administrateur ayant validé la transaction.

### Key Entities *(include if feature involves data)*

- **DemandeDeVersement (PayoutRequest)** : Représente une réclamation de liquidation financière initiée par un bénéficiaire ou générée par le système à la clôture de période. Attributs : bénéficiaire (User / Université / Éditeur), montant net réclamé, assiette brute correspondante, canal de paiement préféré (Virement bancaire, Mobile Money), statut (en_attente, valide, rejete, paye), référence transactionnelle externe (obligatoire à la validation), date effective de décaissement, justificatif_url (fichier de preuve facultatif téléversé), date de soumission, date de traitement, administrateur ayant instruit le dossier, motif de rejet le cas échéant.
- **TransactionVente (SaleTransaction)** : Représente une opération commerciale ayant généré un encaissement sur la plateforme. Attributs : référence de commande, type d'opération (vente unitaire lecteur, commande campus université, commande grossiste B2B), acheteur, articles concernés, format (papier, numérique, audio, bouquet), montant total, mode de règlement, statut de paiement, date et heure.
- **SyntheseDroitsPartenaire (PartnerRoyaltySummary)** : Agrégation des droits d'auteur ou de partenariat calculés sur une période ou en cumulé. Attributs : ayant-droit, type de contrat, nombre d'ouvrages commercialisés, nombre de ventes / lectures réelles, taux contractuel effectif, total des droits générés, total des versements déjà liquidés, solde restant exigible.
- **BaremeGlobalPlateforme (PlatformPricingPolicy)** : Configuration des taux standards par défaut appliqués aux ventes et consultations. Attributs : taux par défaut auteurs partenaires, taux par défaut éditeurs tiers, taux par défaut bouquets universitaires, commission standard plateforme.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Réconciliation financière dynamique à 100 % : 100 % du Chiffre d'Affaires total consolidé (quelle que soit son évolution et son montant en base) est vérifiable et traçable ligne à ligne dans le tableau de `/admin/sales` sans écart, la somme exacte des transactions filtrées ou globales égalant en permanence le montant affiché par les indicateurs.
- **SC-002**: L'instruction d'une demande de versement (consultation, vérification du mode de règlement et validation/rejet) s'effectue en moins de 3 clics et moins de 30 secondes par l'administrateur sur `/admin/payouts`.
- **SC-003**: Clarté visuelle et lisibilité : Réduction de 100 % des boutons parasites ou redondants sur `/admin/royalties`, avec un score d'encombrement visuel nul et une conformité stricte aux tokens sémantiques et à la charte typographique du projet (zéro hexadécimal en dur, zéro émoji).
- **SC-004**: Performance d'affichage : Chargement et restitution fluide des tableaux de données sur chacune des 4 pages financières en moins de 800 ms pour un volume standard de transactions.
- **SC-005**: Zéro régression mobile : L'ensemble des 4 pages (`/admin/sales`, `/admin/finance`, `/admin/royalties`, `/admin/payouts`) s'affiche sans débordement horizontal anarchique sur les écrans mobiles (< 400px) grâce à un agencement mobile-first rigoureux.

## Assumptions

- Les endpoints backend existants dans `apps/reporting` et `apps/rights` fournissent déjà la structure de données des commandes (`Order`, `UniversityPaperOrder`, `WholesaleOrder`) et des demandes de versement (`PayoutRequest`), mais nécessitaient une unification de l'exposition via les API BFF pour combler les écarts de réconciliation.
- Le format monétaire officiel reste le Franc CFA (XOF / FCFA) avec séparateur de milliers adapté aux standards francophones (`178 000 FCFA`).
- La validation d'une demande de versement par l'administrateur enregistre la référence de transaction fournie et met à jour les comptes sans déclencher d'appel bancaire direct non sécurisé (l'exécution du virement ou Mobile Money se fait via les passerelles ou les services financiers conventionnés).
- Tous les composants d'interface respecteront scrupuleusement la règle de non-utilisation des mocks, s'alimentant directement des données réelles retournées par les routes `/api/bff/...`.
