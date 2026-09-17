# Spécification Fonctionnelle : Distinction Universités Partenaires vs Universités Clientes

**Feature Branch** : `009-university-partner-client-split`

**Created** : 2026-09-17

**Status** : Draft

**Input** : Description utilisateur : "C'est qu'il y a deux style d'université distinguées. Vous allez avoir du mal à comprendre. Il y a les universités qui sont juste là pour regarder leurs droits, les pourcentages qu'ils gagnent. Il y a les universités qui ont la possibilité de souscrire. Donc pour les universités ont la possibilité de voir leurs droits, il y en a que quatre pour l'instant. On a UAC, up, unstim, una. Ça, c'est des gens à qui on doit. Mais des universités lambda, eux, ils n'ont pas besoin de voir leurs droits, tout ça, parce qu'on leur doit rien du tout. Donc sinon, ça peut embrouiller les gens, en fait. Je pense que c'est mieux qu'on distingue deux styles de comptes pour les universités : celles à qui on doit et celles qui sont vraiment clientes. Donc du coup il y a des universités partenaires et des universités clientes."

---

## 1. Contexte et Problématique Métier

Dans l'état actuel de la plateforme, tous les comptes universitaires accèdent indistinctement au même portail universitaire (`/university`). Ce portail présente des fonctionnalités avancées de gestion des droits d'auteur institutionnels : suivi des redevances (15 %), répartition des revenus des bouquets documentaires, camembert de consultation, et bordereaux officiels de reversement.

Or, la réalité métier impose une distinction nette et étanche entre deux profils d'établissements :

1. **Les Universités Partenaires (Ayants droit / Conventionnées)** :
   - Établissements fondateurs qui ont confié leurs fonds documentaires à la plateforme sous convention-cadre (actuellement les 4 universités publiques béninoises : **UAC, UP, UNSTIM, UNA**).
   - La plateforme leur reverse des redevances financières basées sur la consultation de leurs ouvrages.
   - Elles ont un besoin impératif d'auditer leurs droits, de suivre leurs statistiques de consultation et de demander leurs reversements de fonds.

2. **Les Universités Clientes (Souscriptrices / Acheteuses)** :
   - Établissements d'enseignement supérieur (universités privées, instituts spécialisés, écoles professionnelles, universités étrangères) qui n'ont déposé aucun ouvrage propre.
   - La plateforme ne leur doit aucune redevance.
   - Elles viennent sur LAHAThèque pour souscrire des abonnements aux bouquets documentaires pour leurs étudiants, passer des commandes groupées de manuels physiques, et administrer leurs accès étudiants.
   - L'affichage de métriques de redevance, de pourcentages d'ayants droit ou de montants de reversement est non pertinent, source de confusion et inadapté à leur statut de client payeur.

---

## 2. User Scenarios & Testing *(mandatory)*

### User Story 1 - Expérience dédiée pour les Universités Clientes (Priorité : P1)

En tant qu'administrateur d'une Université Cliente (ex: un institut privé souscripteur), je souhaite accéder à un tableau de bord épuré axé sur mes abonnements, mes étudiants et mes commandes, sans voir aucune section de redevance ou de créance, afin de gérer facilement l'accès de mes apprenants sans confusion.

**Pourquoi cette priorité** : C'est le cœur du besoin utilisateur : éliminer immédiatement toute friction et toute incompréhension pour les établissements clients.

**Test Indépendant** : Peut être validé en connectant un compte d'université cliente et en vérifiant que le menu, les cartes d'accueil et les pages sont exempts de toute notion de redevance, de répartition de CA ou de bordereaux financiers sortants.

**Acceptance Scenarios** :

1. **Given** un compte rattaché à une Université Cliente, **When** il se connecte à son espace établissement, **Then** son tableau de bord affiche ses abonnements actifs, le nombre d'étudiants connectés, les ouvrages les plus consultés par ses étudiants et ses commandes physiques.
2. **Given** un compte d'Université Cliente, **When** il consulte la barre de navigation latérale (Sidebar), **Then** les entrées "Redevances & Droits", "Répartition Multi-Campus" et "Bordereaux de Reversement" sont totalement absentes.
3. **Given** un utilisateur d'une Université Cliente, **When** il tente d'accéder directement par URL à `/university/royalties`, **Then** il est redirigé vers son tableau de bord avec un message d'information lui indiquant que cette section est réservée aux universités partenaires conventionnées.

---

### User Story 2 - Conservation intégrale des outils de gestion des droits pour les Universités Partenaires (Priorité : P1)

En tant qu'administrateur d'une Université Partenaire (UAC, UP, UNSTIM, UNA), je souhaite continuer à visualiser mon suivi détaillé de redevances, mes parts d'audience dans les bouquets, mes bordereaux officiels et mon solde disponible, tout en pouvant également souscrire ou commander pour mes étudiants.

**Pourquoi cette priorité** : Garantir la continuité opérationnelle et la conformité contractuelle pour les 4 universités publiques partenaires.

**Test Indépendant** : Se connecter avec un compte UAC, UP, UNSTIM ou UNA et vérifier que l'ensemble des modules de redevance, de camembert d'audience et de retrait bancaire restent accessibles avec leurs données certifiées.

**Acceptance Scenarios** :

1. **Given** un compte rattaché à l'UAC, **When** il accède à son espace établissement, **Then** il dispose d'un badge distinctif "Université Partenaire Conventionnée" et de l'accès complet au module "Redevances & Droits".
2. **Given** un gestionnaire d'une Université Partenaire, **When** il consulte ses bouquets, **Then** il peut visualiser à la fois ses ouvrages au catalogue, ses parts d'usage réel et les redevances générées par ses consultations.

---

### User Story 3 - Qualification et Bascule du Type d'Établissement par l'Administrateur LAHA (Priorité : P2)

En tant que Super Administrateur de la plateforme, je souhaite pouvoir classer explicitement chaque institution comme "Partenaire" ou "Cliente" lors de sa création ou modification, afin de contrôler quel établissement a le statut d'ayant droit.

**Pourquoi cette priorité** : Permet à l'équipe de direction d'accueillir de nouvelles universités clientes ou de signer de nouvelles conventions de partenariat sans modifier le code source.

**Test Indépendant** : Depuis le panneau de gestion des institutions, modifier le statut d'une université de "Partenaire" à "Cliente" et constater le masquage immédiat des volets de redevances sur son portail.

**Acceptance Scenarios** :

1. **Given** l'interface d'administration des institutions, **When** l'administrateur crée ou édite un établissement, **Then** un sélecteur permet de choisir le type : "Partenaire (Ayant droit éditorial)" ou "Cliente (Souscriptrice uniquement)".
2. **Given** une université nouvellement créée avec le type "Cliente", **When** son premier gestionnaire est invité et se connecte, **Then** son environnement est automatiquement configuré en mode client sans redevances.
3. **Given** les 4 universités historiques (UAC, UP, UNSTIM, UNA), **When** le système initialise la fonctionnalité, **Then** ces 4 universités sont automatiquement qualifiées avec le type "Partenaire".

---

### User Story 4 - Segmentation dans les Rapports Administratifs Globaux (Priorité : P3)

En tant que Responsable Administratif et Juriste LAHA, je souhaite que la liste des redevances consolidées n'inclue que les Universités Partenaires éligibles, afin que les bilans financiers reflètent uniquement les vrais créanciers de la plateforme.

**Pourquoi cette priorité** : Évite de polluer les tableaux de bord comptables et les relances officielles avec des institutions clientes qui n'ont aucune redevance à percevoir.

**Test Indépendant** : Consulter la vue globale d'administration des redevances et constater que seules les institutions de type "Partenaire" y figurent.

**Acceptance Scenarios** :

1. **Given** le tableau d'administration globale des redevances universitaires, **When** la liste est chargée, **Then** seules les Universités Partenaires (UAC, UP, UNSTIM, UNA) apparaissent comme bénéficiaires potentielles.
2. **Given** une Université Cliente active, **When** les tâches de calcul mensuel de redevances s'exécutent, **Then** cette université est ignorée et ne reçoit aucun relevé de redevances vide.

---

## 3. Cas Limites (Edge Cases)

- **Université Partenaire qui souscrit également à des bouquets tiers** : Une université partenaire (ex: UAC) peut avoir des livres au catalogue ET souscrire à d'autres bouquets pour ses étudiants. Son profil doit donc combiner les deux capacités (portail partenaire complet avec onglets de redevance ET souscriptions).
- **Université Cliente qui signe ultérieurement une convention d'édition** : Si un institut privé signe un accord de co-édition et dépose des ouvrages, l'administrateur peut basculer son statut en "Partenaire". Le module de redevances s'active immédiatement pour ce compte sans aucune perte de données d'abonnement antérieures.
- **Accès par lien direct (Deep Link)** : Si un administrateur d'université cliente clique sur un lien reçu par email ou mis en favori vers `/university/royalties`, l'application intercepte la requête, empêche le rendu du module et affiche une explication claire.

---

## 4. Requirements *(mandatory)*

### Functional Requirements

- **FR-001** : Le système DOIT classifier chaque institution universitaire selon l'un des deux types exclusifs : `partner` (Université Partenaire conventionnée / ayant droit) ou `client` (Université Cliente souscriptrice).
- **FR-002** : Par défaut, toute nouvelle institution créée DOIT être configurée avec le type `client`, sauf désignation explicite du type `partner` par un administrateur autorisé.
- **FR-003** : Les institutions existantes UAC, UP, UNSTIM et UNA DOIVENT être automatiquement et irrévocablement initialisées avec le type `partner`.
- **FR-004** : Le menu de navigation du portail universitaire DOIT adapter dynamiquement ses entrées : les rubriques "Redevances & Droits", "Répartition Multi-Campus" et "Demandes de Retrait" DOIVENT être masquées pour les institutions de type `client`.
- **FR-005** : Les points de terminaison de l'API REST liés aux redevances et aux quotes-parts de CA (`/api/v1/partners/university/royalties/...`) DOIVENT interdire l'accès aux utilisateurs rattachés à une institution de type `client` (retour d'une réponse claire avec code HTTP 403 Forbidden).
- **FR-006** : La page d'accueil du portail universitaire (`/university`) DOIT présenter deux configurations visuelles distinctes :
  - Pour les Universités Partenaires : métriques de livres au catalogue, consultations reçues, solde de redevances disponible, bouquets souscrits et raccourcis de retrait.
  - Pour les Universités Clientes : métriques d'abonnements actifs, nombre d'étudiants enregistrés, consultations effectuées par les étudiants et commandes physiques en cours.
- **FR-007** : Le sélecteur d'institutions dans le module d'administration globale des redevances DOIT filtrer par défaut pour n'afficher que les institutions de type `partner`.
- **FR-008** : Les bordereaux officiels de redevances périodiques et courriers de relance NE DOIVENT JAMAIS être adressés à des institutions de type `client`.

---

## 5. Entités Clés

### Institution
- **type / category** : Classification métier de l'établissement (`partner` ou `client`).
- **has_catalog_rights** : Indicateur booléen dérivé indiquant si l'établissement est titulaire d'un fonds documentaire générant des droits.
- **royalty_rate** : Taux de redevance conventionné (applicable uniquement aux institutions de type `partner`).

---

## 6. Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** : 100 % des universités clientes connectées visualisent une interface strictement dépourvue de termes, tableaux ou graphiques relatifs aux redevances.
- **SC-002** : 100 % des 4 universités partenaires (UAC, UP, UNSTIM, UNA) conservent un accès direct et ininterrompu à leurs historiques de redevances et leurs données de répartition.
- **SC-003** : Le basculement de profil entre Partenaire et Client par un administrateur prend effet immédiatement sans redémarrage ni délai de propagation.
- **SC-004** : Zéro incident de confusion ou de ticket support émis par un établissement client s'interrogeant sur des redevances qu'il ne perçoit pas.

---

## 7. Assumptions

- Les 4 universités historiques (UAC, UP, UNSTIM, UNA) sont les seuls ayants droit institutionnels actifs identifiés à ce jour.
- Les universités clientes sont des payeurs nets (achat d'abonnements ou d'ouvrages) et ne sont jamais créancières de la plateforme.
- L'infrastructure d'authentification existante basée sur les affiliations institutionnelles est réutilisée sans modification de schéma utilisateur.
