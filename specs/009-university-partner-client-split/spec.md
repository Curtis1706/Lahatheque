# Spécification Fonctionnelle : Distinction Étanche Universités Partenaires vs Universités Clientes

**Feature Branch** : `009-university-partner-client-split`  
**Created** : 2026-09-17  
**Status** : Draft  
**Input** : Prise en compte rigoureuse de la réalité du portail universitaire existant, de la gestion administrative des comptes (création et édition), de l'absence de redevance pour les universités clientes et de l'interdiction de souscription pour les universités partenaires ayants droit (UAC, UP, UNSTIM, UNA).

---

## 1. Contexte et Problématique Métier

Dans l'état actuel de la plateforme LAHAThèque, toutes les universités connectées partagent une même interface générale (`/university`), qui mélange des fonctionnalités contradictoires :
- Des bannières et cartes pour souscrire à des bouquets documentaires payants.
- Des calculs complexes de droits d'auteur, de redevances conventionnées (15 %), de parts d'audience et de reversements financiers.

Cette situation crée une confusion majeure :
1. **Les Universités Partenaires (Ayants droit / Conventionnées)** :
   - Actuellement au nombre de 4 (les universités publiques béninoises fondatrices : **UAC, UP, UNSTIM, UNA**).
   - Elles ont déposé leur fonds documentaire académique au catalogue LAHAThèque.
   - Elles sont présentes sur la plateforme **strictement pour auditer leurs droits** : consulter leurs volumes de lecture, vérifier leurs parts d'audience (sur les bouquets thématiques et le Bouquet Général), examiner leurs bordereaux de redevances et demander leurs reversements bancaires.
   - **Elles n'ont aucune vocation à souscrire à des bouquets documentaires** : elles ne sont pas clientes acheteuses. L'affichage d'un bouton "Souscrire un Bouquet" ou d'une liste de bouquets à acheter est inapproprié.

2. **Les Universités Clientes (Souscriptrices / Acheteuses)** :
   - Universités privées, instituts supérieurs, écoles de commerce, établissements panafricains ou internationaux n'ayant confié aucun fonds documentaire à la plateforme.
   - Elles viennent sur LAHAThèque **strictement pour consommer des ressources** : souscrire des abonnements annuels à des bouquets documentaires campus et commander des exemplaires papier de manuels pour leurs bibliothèques (`/university/purchases`).
   - La plateforme ne leur doit absolument rien. Tout affichage de redevance, de répartition de chiffre d'affaires, de taux contractuel ou de bordereau de créance leur est totalement étranger et suscite de fausses attentes ou de la confusion comptable.

3. **L'Administration Centrale LAHAThèque** :
   - L'équipe administrative et juridique doit pouvoir qualifier explicitement chaque établissement lors de sa création (ou mise à jour) en tant qu'Université Partenaire ou Université Cliente.
   - Les bilans administratifs de reversement de redevances institutionnelles doivent isoler uniquement les 4 partenaires créanciers.

4. **Distinction Fondamentale entre l'Établissement (Institution) et le Compte Modérateur (User)** :
   - **L'Institution (`Institution`)** : C'est l'entité morale (personne morale) qui possède le statut juridique, le type (`institution_type: 'partner' | 'client'`), les coordonnées bancaires, les contrats de co-édition et les abonnements bouquets du campus.
   - **Le Compte Modérateur / Gestionnaire Universitaire (`User` avec rôle `university`)** : C'est la personne physique (responsable documentaire, délégué rectoral, administrateur local) qui dispose d'identifiants de connexion personnels (email, mot de passe, nom, prénom, téléphone) et qui est **rattachée** à l'institution (`user.institution = institution`).
   - **Héritage Dynamique des Droits** : Le compte modérateur n'a pas de type figé dans son compte personnel : il hérite automatiquement et dynamiquement de la typologie (`partner` ou `client`) de son institution de rattachement. Si l'institution est de type partenaire, le modérateur accède aux redevances et au suivi des droits ; si l'institution est de type cliente, le modérateur accède à la souscription de bouquets et aux achats papier.
   - **Unicité Stricte du Compte Modérateur** : Chaque institution dispose d'exactement un seul compte utilisateur modérateur officiel (`OneToOneField` entre `Institution` et `User`). L'accès à l'espace de l'établissement s'effectue via ce compte modérateur unique officiel.

---

## Clarifications

### Session 2026-09-17

- Q: Comment le portail doit-il gérer la page « Bouquets Documentaires » (`/university/bouquets`) pour les Universités Partenaires (UAC, UP, UNSTIM, UNA) ? → A: Option A (Masquage complet du menu « Bouquets » pour les partenaires et redirection vers `/university/royalties` en cas d'accès direct, car l'audit des ouvrages en bouquets et des redevances se fait sur `/university/royalties`).
- Q: Que doit afficher la page « Catalogue Universitaire » (`/university/catalog`) pour une Université Cliente n'ayant aucun livre propre déposé ? → A: Option A (Afficher l'ensemble des ouvrages numériques inclus dans les bouquets documentaires activement souscrits par le campus, formant la bibliothèque numérique accessible de l'établissement).
- Q: Un administrateur doit-il pouvoir modifier librement le type d'une institution existante (passer de « Partenaire » à « Cliente » ou inversement) ? → A: Option A (Bascule réversible pour les établissements généraux sans perte de données, avec verrouillage protecteur sur les 4 universités publiques historiques UAC, UP, UNSTIM, UNA pour empêcher toute rétrogradation accidentelle en compte client).
- Q: Une institution (qu'elle soit Partenaire ou Cliente) peut-elle posséder plusieurs comptes modérateurs/gestionnaires distincts, ou doit-elle être limitée à un compte d'accès unique ? → A: Option B (Compte unique strict : exactement un seul compte utilisateur officiel par institution via une relation un-à-un stricte).

---

## 2. User Scenarios & Testing

### User Story 1 - Parcours Épuré pour l'Université Cliente (Priorité : P1)

En tant qu'administrateur d'une Université Cliente (ex: un institut privé souscripteur), je souhaite accéder à un portail centré exclusivement sur mes bouquets souscrits, les ouvrages accessibles à mon campus et mes commandes physiques, sans aucune mention ni indicateur de redevances, afin de gérer efficacement mes ressources documentaires.

**Pourquoi cette priorité** : C'est le prérequis fondamental pour commercialiser la plateforme auprès d'établissements privés et tiers sans confusion sur leur statut juridique et financier.

**Test Indépendant** : Connecter un compte d'université cliente et vérifier visuellement et fonctionnellement :
- Absence totale de l'onglet "Redevances" dans la barre latérale.
- Remplacement des KPI de redevances par les KPI de bouquets souscrits et d'ouvrages accessibles.
- Absence totale du graphique camembert/donut de répartition de chiffre d'affaires.
- Présence active des fonctionnalités de découverte et de souscription de bouquets.

**Acceptance Scenarios** :

1. **Given** un compte d'Université Cliente connecté, **When** il arrive sur `/university`, **Then** son tableau de bord affiche les 4 KPI suivants :
   - Bouquets Souscrits (nombre de packs campus actifs).
   - Ouvrages Accessibles (total des titres inclus dans ses souscriptions).
   - Lectures Campus (total des consultations réalisées par ses usagers).
   - Commandes Physiques (total des commandes de livres papier passées).
2. **Given** un compte d'Université Cliente, **When** il consulte son tableau de bord, **Then** la section "Répartition des Revenus" (DonutChart) est totalement absente du DOM.
3. **Given** un compte d'Université Cliente, **When** il consulte le menu de navigation (Sidebar et barre mobile), **Then** le lien `/university/royalties` est masqué.
4. **Given** un utilisateur d'Université Cliente, **When** il tente de forcer l'URL `/university/royalties` dans son navigateur, **Then** il est automatiquement redirigé vers `/university` et l'appel API sous-jacent renvoie une erreur HTTP 403 Forbidden.
5. **Given** un compte d'Université Cliente, **When** il consulte `/university/bouquets`, **Then** il peut parcourir les bouquets disponibles, voir leurs fiches et déclencher la souscription annuelle.

---

### User Story 2 - Portail Focalisé Droits & Redevances pour l'Université Partenaire (Priorité : P1)

En tant que responsable d'une Université Partenaire (UAC, UP, UNSTIM, UNA), je souhaite accéder à un tableau de bord strictement dédié à la valorisation de mon fonds documentaire, au contrôle de mes parts d'audience et au suivi de mes redevances, sans aucune proposition d'achat de bouquets qui ne me concerne pas.

**Pourquoi cette priorité** : Offrir aux partenaires étatiques un espace institutionnel digne, transparent et conforme aux conventions de co-édition signées, sans bruit promotionnel non sollicité.

**Test Indépendant** : Connecter un compte UAC, UP, UNSTIM ou UNA et vérifier que :
- Les boutons et sections de souscription de bouquets sont totalement absents.
- Le suivi des redevances, les parts d'audience et le DonutChart de répartition du chiffre d'affaires sont pleinement opérationnels et alimentés par les données réelles.

**Acceptance Scenarios** :

1. **Given** un compte d'Université Partenaire connecté, **When** il arrive sur `/university`, **Then** le titre et le badge indiquent "Portail Université Partenaire (Ayant droit conventionné)".
2. **Given** un compte d'Université Partenaire, **When** il consulte ses KPI principaux, **Then** les cartes affichent :
   - Vos Ouvrages au Catalogue (nombre de livres déposés par l'institution).
   - Part d'Audience Réelle (% de consultation au prorata officiel).
   - Lectures Enregistrées (volume mensuel de lectures sur le fonds de l'université).
   - Redevances Disponibles (solde en FCFA éligible au virement bancaire).
3. **Given** un compte d'Université Partenaire, **When** il consulte la page d'accueil ou le menu, **Then** les boutons "Souscrire un Bouquet", la section "Bouquets Documentaires Disponibles" et le lien de menu `/university/bouquets` sont rigoureusement masqués.
4. **Given** un compte d'Université Partenaire, **When** il accède à `/university/royalties`, **Then** il visualise le détail de ses relevés périodiques, l'historique de ses virements et le formulaire de demande de reversement vers son compte bancaire ou Trésor Public.
5. **Given** un compte d'Université Partenaire, **When** il consulte la section "Répartition des Revenus", **Then** le DonutChart affiche la part revenant à l'établissement (redevances à 15 %) et la part LAHAThèque (85 %).

---

### User Story 3 - Gestion Administrative de la Typologie lors de la Création et Modification (Priorité : P1)

En tant qu'administrateur de LAHAThèque (Super Admin ou Responsable Administratif), je souhaite pouvoir classifier clairement chaque établissement comme "Partenaire" ou "Cliente" lors de la création d'un compte ou de son édition, afin que le système applique automatiquement les droits et vues correspondants.

**Pourquoi cette priorité** : Fournir à l'administration le levier de contrôle complet sur la qualification juridique des comptes sans intervention technique sur la base de données.

**Test Indépendant** : Dans l'espace administrateur (`/admin/users`), créer un compte d'université cliente puis vérifier son statut dans la table des utilisateurs et son comportement à la connexion.

**Acceptance Scenarios** :

1. **Given** la modale de création d'un compte utilisateur (`CreateAccountModal`) avec le rôle "Université / Établissement", **When** l'administrateur choisit de créer une nouvelle institution, **Then** un sélecteur permet de choisir entre :
   - "Université Cliente (Souscriptrice d'abonnements)" (option recommandée par défaut).
   - "Université Partenaire (Ayant droit conventionné - UAC, UP, UNSTIM, UNA)".
2. **Given** la sélection du type "Université Partenaire", **Then** le champ du taux de redevance conventionné (par défaut 15.00 %) est affiché et éditable.
3. **Given** la sélection du type "Université Cliente", **Then** aucun taux de redevance n'est requis ni affiché.
4. **Given** la modale d'édition d'un compte existant (`EditUniversityUserModal`), **When** l'administrateur ouvre la fiche, **Then** le type actuel de l'institution (`partner` ou `client`) est clairement affiché et modifiable.
5. **Given** la table de gestion des universités dans l'administration (`/admin/users/universities`), **When** la liste s'affiche, **Then** :
   - Une colonne de badge indique distinctement le statut : "Partenaire" ou "Cliente".
   - La colonne "Taux Conventionné" affiche le pourcentage pour les partenaires et "Non applicable" pour les clientes.
   - La colonne "Bouquets Actifs" affiche le décompte des abonnements souscrits pour les clientes.

---

### User Story 4 - Étanchéité des Rapports Financiers et Relevés de Redevances (Priorité : P2)

En tant que Responsable Administratif et Financier LAHAThèque, je souhaite que les écrans d'administration des redevances et les tâches de génération de bordereaux filtrent strictement sur les Universités Partenaires, afin d'exclure tout risque d'émission de bordereau ou de virement erroné vers une université cliente.

**Pourquoi cette priorité** : Sécuriser la chaîne comptable et légale en évitant toute incohérence dans les bilans financiers.

**Test Indépendant** : Vérifier la page `/admin/royalties/universities` et s'assurer qu'aucune université cliente n'est listée parmi les bénéficiaires de reversements institutionnels.

**Acceptance Scenarios** :

1. **Given** l'écran d'administration `/admin/royalties/universities`, **When** les bénéficiaires sont listés, **Then** seules les universités de type `partner` sont retournées par l'API.
2. **Given** le script ou la tâche asynchrone de clôture de relevés de redevances périodiques, **When** elle s'exécute, **Then** elle ignore systématiquement toutes les institutions de type `client`.

---

## 3. Matrice de Visibilité par Type d'Établissement

| Élément d'interface / Fonctionnalité | Université Partenaire (Ayant droit) | Université Cliente (Souscriptrice) | Règle Métier & Justification |
| :--- | :--- | :--- | :--- |
| **Badge En-tête** | "Portail Université Partenaire" | "Portail Université Cliente" | Identification immédiate du cadre contractuel |
| **Bouton En-tête : Passer Commande** | Visible (`/university/purchases/new`) | Visible (`/university/purchases/new`) | Les deux peuvent commander des exemplaires physiques |
| **Bouton En-tête : Souscrire un Bouquet** | **Masqué** | Visible (`/university/bouquets`) | Le partenaire ne souscrit à aucun bouquet payant |
| **KPI 1** | "Vos Ouvrages au Catalogue" | "Bouquets Souscrits" | Partenaire suit son fonds, cliente suit ses packs |
| **KPI 2** | "Part d'Audience Réelle (%)" | "Ouvrages Accessibles" | Partenaire audite sa quote-part, cliente voit son offre |
| **KPI 3** | "Lectures Enregistrées" | "Lectures Campus" | Volume de lecture sur fonds propre vs sur bouquets souscrits |
| **KPI 4** | "Redevances Disponibles (FCFA)" | "Commandes Physiques" | Redevances dues au partenaire, commandes pour la cliente |
| **Section : Répartition des Revenus (Donut)** | **Visible** (Transparence CA / 15 %) | **Masquée** | La cliente ne perçoit aucune redevance sur le CA |
| **Section : Bouquets Disponibles (Accueil)** | **Masquée** | **Visible** (Offres à souscrire) | Seule la cliente souscrit des bouquets |
| **Menu Sidebar : Bouquets Documentaires** | **Masqué** | **Visible** (`/university/bouquets`) | Accès aux offres d'abonnement |
| **Menu Sidebar : Catalogue Universitaire** | **Visible** (`/university/catalog`) | **Visible** (`/university/catalog`) | Partenaire voit ses livres, cliente voit ses livres souscrits |
| **Menu Sidebar : Commandes Papier** | **Visible** (`/university/purchases`) | **Visible** (`/university/purchases`) | Gestion des commandes de livres physiques |
| **Menu Sidebar : Redevances** | **Visible** (`/university/royalties`) | **Masqué** (Interdit) | Réservé aux ayants droit conventionnés |
| **Menu Sidebar : Profil & Paramètres** | **Visible** (`/university/profile`) | **Visible** (`/university/profile`) | Paramètres d'établissement |
| **Affiliations Étudiants** | **Désactivé pour les deux** | **Désactivé pour les deux** | Conformité avec la décision CDC v3.2 (Fiches X1-X4) |

---

## 4. Cas Limites (Edge Cases)

- **Tentative d'accès direct par URL (Deep Link)** :
  - Si un utilisateur d'une Université Cliente saisit manuellement l'URL `/university/royalties`, le composant Next.js vérifie le type de l'institution et redirige immédiatement vers `/university` avec un avertissement poli.
  - Côté backend, l'API `/api/v1/partners/university/royalties/` renvoie un code HTTP 403 Forbidden avec le message explicite : "Cet espace est réservé aux universités partenaires dépositaires de fonds documentaires."
- **Tentative de souscription ou d'accès aux bouquets par URL pour un Partenaire** :
  - Si un utilisateur d'une Université Partenaire tente d'accéder directement à `/university/bouquets`, le frontend le redirige automatiquement vers `/university/royalties` (onglet bouquets) avec une notification explicite indiquant que le suivi des ouvrages conventionnés s'effectue dans l'espace des redevances. Côté backend, l'endpoint de souscription `/api/v1/partners/university/bouquets/<id>/subscribe/` bloque toute tentative de souscription avec une erreur HTTP 400/403.
- **Migration des Institutions Existantes** :
  - Les 4 institutions historiques identifiées par leurs codes : `UAC`, `UP`, `UNSTIM`, `UNA` sont automatiquement assignées au type `partner`.
  - Toutes les autres institutions déjà présentes en base reçoivent la valeur `client`.
- **Évolution d'une Université de Cliente à Partenaire (et réversibilité)** :
  - Si un établissement client signe une convention d'apport de fonds documentaire, l'administrateur peut passer son statut de `client` à `partner` dans l'interface admin, ce qui active instantanément ses modules de redevances et désactive les boutons de souscription de bouquets.
  - La bascule inverse est également permise pour corriger une erreur sur les établissements généraux.
  - En revanche, les 4 universités publiques fondatrices (`UAC`, `UP`, `UNSTIM`, `UNA`) bénéficient d'un verrouillage d'intégrité en base et dans l'interface : leur statut `partner` ne peut pas être modifié en `client`.

---

## 5. Exigences Fonctionnelles (Functional Requirements)

- **FR-001** : Le modèle de données `Institution` DOIT comporter un champ catégoriel `institution_type` prenant pour valeurs exclusives `partner` (Université Partenaire conventionnée) et `client` (Université Cliente souscriptrice).
- **FR-002** : Par défaut, toute nouvelle institution créée lors de l'enregistrement d'un utilisateur DOIT être assignée au type `client`, sauf sélection explicite du type `partner` par l'administrateur.
- **FR-003** : Une migration de données DOIT initialiser irrévocablement les institutions `UAC`, `UP`, `UNSTIM` et `UNA` avec la valeur `institution_type='partner'`.
- **FR-004** : L'API de récupération des informations de l'établissement connecté (`/api/v1/partners/university/profile/` et `/api/v1/partners/university/kpis/`) DOIT inclure le champ `institution_type` dans la charge utile de réponse.
- **FR-005** : L'API `/api/v1/partners/university/kpis/` DOIT adapter sa charge utile selon le type d'établissement :
  - Pour un établissement `partner` : calcul et renvoi des métriques de redevances disponibles, part d'audience, volume de consultations du fonds et objet `revenue_split`.
  - Pour un établissement `client` : renvoi de `total_royalties_available: 0`, `revenue_split: null`, et calcul des métriques de bouquets actifs, ouvrages inclus dans ses bouquets et consultations de ses étudiants.
- **FR-006** : Les endpoints de gestion des redevances (`/api/v1/partners/university/royalties/` et `/api/v1/partners/university/royalties/withdraw/`) DOIVENT renvoyer une réponse HTTP 403 Forbidden si l'institution de l'utilisateur n'est pas de type `partner`.
- **FR-007** : L'endpoint de souscription de bouquet (`/api/v1/partners/university/bouquets/<pk>/subscribe/`) DOIT renvoyer une erreur HTTP 400 ou 403 si l'institution de l'utilisateur est de type `partner`, rappelant que les partenaires ne souscrivent pas d'abonnements.
- **FR-008** : Le composant de navigation latérale (`DashboardSidebar`) et la barre mobile (`MobileBottomNav`) DOIVENT masquer conditionnellement l'entrée "Redevances" pour les établissements clients, et masquer l'entrée "Bouquets Documentaires" pour les établissements partenaires.
- **FR-009** : La page d'accueil `/university` DOIT afficher les cartes de KPI et les sections appropriées selon la matrice de visibilité définie au chapitre 3.
- **FR-010** : La modale de création d'utilisateur dans l'administration (`CreateAccountModal`) DOIT proposer un sélecteur du type d'institution avec les deux choix explicites, et n'afficher le champ de taux de redevance que pour le type `partner`.
- **FR-011** : La modale d'édition d'utilisateur dans l'administration (`EditUniversityUserModal`) DOIT permettre de visualiser et de modifier le type d'institution (`partner` ou `client`), tout en interdisant toute modification pour les 4 universités partenaires protégées (`UAC`, `UP`, `UNSTIM`, `UNA`).
- **FR-012** : La vue d'administration des utilisateurs de type université (`/admin/users/[role]`) DOIT afficher un badge distinctif clair ("Partenaire" ou "Cliente") et n'afficher le taux conventionné que pour les partenaires.
- **FR-013** : L'écran d'administration des reversements institutionnels (`/admin/royalties/universities`) DOIT filtrer les données pour ne présenter que les institutions de type `partner`.
- **FR-014** : La page `/university/catalog` DOIT adapter le filtrage des ouvrages affichés selon le type d'institution :
  - Pour un établissement `partner` : affichage des ouvrages déposés par l'université dans le fonds documentaire (`ouvrage.institution = inst`).
  - Pour un établissement `client` : affichage des ouvrages numériques accessibles au campus via ses abonnements bouquets actifs (`UniversityBouquetSubscription`), avec un état vide invitant à la souscription si aucun bouquet n'est souscrit.
- **FR-015** : La qualification `partner` ou `client` DOIT être portée exclusivement par l'entité `Institution`. Tout compte modérateur (`User` avec `role='university'`) rattaché à une institution hérite dynamiquement de sa typologie. Lors de la création ou modification d'un compte modérateur par l'administrateur, le système doit dissocier rigoureusement les données d'identité du modérateur (nom, prénom, email, téléphone) et les attributs institutionnels de l'établissement auquel il est rattaché (nom, code, pays, statut partenaire/client).
- **FR-016** : Chaque institution (`Institution`) DOIT être associée à un compte modérateur officiel unique (`User` avec `role='university'`) via une relation un-à-un (`OneToOneField`). Lors de la création d'un utilisateur dans l'administration, si une institution sélectionnée possède déjà un compte modérateur actif, le système doit bloquer la création de doublon et orienter l'administrateur vers l'édition du compte existant.

---

## 6. Entités Clés et Données

### Institution (Modèle `apps.partners.models.Institution`)
- `institution_type` : Chaîne de caractères (`CharField`, max_length=20, choices=[('partner', 'Université Partenaire'), ('client', 'Université Cliente')], default='client', indexé).
- `royalty_rate` : Pourcentage contractuel de redevance (ex: 15.00 %). Applicable et affiché uniquement pour les partenaires.
- `contract_reference` : Référence de la convention-cadre institutionnelle.

### Compte Modérateur Universitaire (Modèle `apps.accounts.models.User`)
- `role` : Fixé à `'university'`.
- `institution` / `university_profile` : Relation un-à-un stricte (`OneToOneField` sur `Institution.user`) garantissant un compte officiel unique par établissement.
- `email`, `first_name`, `last_name`, `phone` : Données d'identité de la personne physique gestionnaire.
- Résolution des droits : Le portail et les API résolvent l'institution liée (`user.university_profile` ou `user.institution`) pour conditionner dynamiquement le profil rendu (`partner` vs `client`).

### UniversityKpis (Structure de réponse API)
- `institution_type` : `"partner"` ou `"client"`.
- `institution_name` : Nom officiel de l'établissement.
- `institution_code` : Sigle officiel (ex: UAC, UP, UNSTIM, UNA).
- `active_bouquets_count` : Décompte des abonnements bouquets actifs (pour les clientes).
- `catalog_books_count` : Décompte des livres au catalogue déposés par l'institution (pour les partenaires).
- `accessible_books_count` : Décompte des livres accessibles via les abonnements (pour les clientes).
- `total_royalties_available` : Montant disponible au reversement (pour les partenaires, 0 pour les clientes).
- `revenue_split` : Objet contenant la répartition du chiffre d'affaires (présent uniquement pour les partenaires).

---

## 7. Critères de Succès et Validation (Success Criteria)

- **SC-001** : 100 % des utilisateurs connectés avec un compte d'Université Cliente ne voient aucune mention de redevance, de pourcentage de droits d'auteur, ni de graphique de répartition de chiffre d'affaires sur aucune page.
- **SC-002** : 100 % des 4 universités partenaires historiques (UAC, UP, UNSTIM, UNA) conservent l'intégralité de leurs outils de suivi de redevances et n'ont aucun bouton de souscription à des bouquets.
- **SC-003** : Toute tentative d'accès direct par URL à `/university/royalties` par un compte client est bloquée côté frontend (redirection) et côté backend (HTTP 403).
- **SC-004** : L'administrateur peut créer une nouvelle université cliente en moins de 30 secondes sans qu'aucun taux de redevance ne lui soit imposé.
- **SC-005** : Zéro régression sur la gestion des commandes papier (`/university/purchases`) qui reste accessible aux deux types d'universités.
