# PLAN DE SPÉCIFICATIONS TECHNIQUES — LAHATHÈQUE v3.2

## Document Companion : Architecture & Spécifications Métier / API

Ce document constitue le **Plan de spécifications techniques** complet qui complète le document *LAHAThèque v3.2 — Architecture système*. Il définit le modèle de domaine PostgreSQL, l'arborescence des 10 applications Django du monolithe modulaire, les contrats d'API REST (endpoints, permissions, payloads), la matrice de sécurité, les propositions techniques soumises à arbitrage et les conflits identifiés.

---

## Table des matières

1. [Vue d'ensemble du monolithe modulaire Django](#1-vue-densemble-du-monolithe-modulaire-django)
2. [Modèle de Domaine & Apps Django](#2-modèle-de-domaine--apps-django)
   - [2.1 `accounts` — Identités, Rôles & Authentification](#21-accounts--identités-rôles--authentification)
   - [2.2 `partners` — Universités, Facultés & Affiliations](#22-partners--universités-facultés--affiliations)
   - [2.3 `catalog` — Fonds Numérique, Métadonnées & ONIX 3.0](#23-catalog--fonds-numérique-métadonnées--onix-30)
   - [2.4 `protection` — DRM LCP, Tatouage Invisible & Watermarking](#24-protection--drm-lcp-tatouage-invisible--watermarking)
   - [2.5 `publishers_portal` — Portail Éditeurs, Soumissions & Workflow](#25-publishers_portal--portail-éditeurs-soumissions--workflow)
   - [2.6 `rights` — Territoires d'Exploitation, Redevances & Licences](#26-rights--territoires-dexploitation-redevances--licences)
   - [2.7 `commerce` — Devises, Transactions & Abonnements](#27-commerce--devises-transactions--abonnements)
   - [2.8 `ai_engine` — Classification & Indexation IA](#28-ai_engine--classification--indexation-ia)
   - [2.9 `audio` — Livres Audio & Streaming Cloudflare](#29-audio--livres-audio--streaming-cloudflare)
   - [2.10 `reporting` — Analytics & Notifications](#210-reporting--analytics--notifications)
3. [Matrice des 10 Rôles & Permissions Granulaires](#3-matrice-des-10-rôles--permissions-granulaires)
4. [Répertoire Complet des Endpoints REST API](#4-répertoire-complet-des-endpoints-rest-api)
   - [4.1 Authentification & Comptes](#41-authentification--comptes-apiv1auth)
   - [4.2 Catalogue & Recherche](#42-catalogue--recherche-apiv1catalog)
   - [4.3 Protection & Lecteur LCP](#43-protection--lecteur-apiv1protection)
   - [4.4 Portail Éditeurs & Soumissions](#44-portail-éditeurs--soumissions-apiv1publishers)
   - [4.5 Droits & Redevances](#45-droits--redevances-apiv1rights)
   - [4.6 Commerce & Abonnements](#46-commerce--abonnements-apiv1commerce)
   - [4.7 OAuth2 & SSO Partenaires](#47-oauth2--sso-partenaires-apiv1oauth2--apiv1sso)
5. [Spécifications de Sécurité Transverse](#5-spécifications-de-sécurité-transverse)
6. [Propositions techniques pour arbitrage (à valider par LAHA Éditions)](#6-propositions-techniques-pour-arbitrage-à-valider-par-laha-éditions)
7. [Conflits identifiés](#7-conflits-identifiés)

---

## 1. Vue d'ensemble du monolithe modulaire Django

L'architecture backend de LAHAThèque v3.2 repose sur un **monolithe modulaire Django 5.2**, structuré en 10 applications métier indépendantes mais colocalisées dans le même dépôt et déployées au sein d'une instance unique (container Docker avec Gunicorn/WhiteNoise, PostgreSQL et Redis/Celery).

```
+-----------------------------------------------------------------------------------+
|                               NEXT.JS APP ROUTER                                  |
|               Client Side (Dashboards)  |  SSR/ISR (Pages Catalogue)              |
|               BFF API Routes (/api/auth/session/ -> HTTPOnly Cookies)             |
+-----------------------------------------------------------------------------------+
                                         | HTTP / REST (JWT Bearer)
+-----------------------------------------------------------------------------------+
|                             CLOUDFLARE EDGE (CDN / WAF)                           |
+-----------------------------------------------------------------------------------+
                                         | Proxy
+-----------------------------------------------------------------------------------+
|                        DJANGO REST API (Monolithe Modulaire)                      |
|                                                                                   |
|  [accounts]         [partners]          [catalog]          [protection]           |
|  Identity & MFA     Universities & Dep  Books & ONIX       Watermark & Traces     |
|                                                                                   |
|  [publishers_portal][rights]            [commerce]         [ai_engine]            |
|  Workflows & Review Rights & Royalties  Payments & Plans   AI Indexing            |
|                                                                                   |
|  [audio]            [reporting]                                                   |
|  Audiobooks & Stream Analytics & Notifs                                           |
+-----------------------------------------------------------------------------------+
           |                          |                         |
     +-----+-----+              +-----+-----+             +-----+-----+
     | PostgreSQL|              | Redis Cache|            | Celery    |
     | DB Unique |              | & Broker   |            | Workers   |
     +-----------+              +-----------+             +-----------+
                                                                |
                                                          +-----+-----+
                                                          |  Readium  |
                                                          | LCP Server| (Service Isolé)
                                                          +-----------+
```

---

## 2. Modèle de Domaine & Apps Django

### 2.1 `accounts` — Identités, Rôles & Authentification

Gère les utilisateurs, le contrôle d'accès, la session multi-appareils et l'authentification forte (MFA).

- **`User`** (`AbstractUser`, UUID pk)
  - `id`: UUID Primary Key
  - `email`: EmailField (unique)
  - `phone`: PhoneNumberField (null=True)
  - `country`: CharField(max_length=2) (Code ISO)
  - `role`: CharField (Rôle principal de démarrage)
  - `active_roles`: JSONField (Liste des rôles simultanés accordés)
  - `is_verified`: BooleanField (Validation OTP / email)
  - `session_version`: IntegerField (Incrémenté pour l'invalidation globale des sessions)
  - `last_active_at`: DateTimeField (Horodatage de présence)
  - `mfa_enabled`: BooleanField (Indique si le TOTP/MFA est actif)
  - `mfa_secret`: CharField (Clé secrète TOTP chiffrée au repos)
- **`MFAConfig`**
  - `user`: OneToOneField(User)
  - `backup_codes`: JSONField (Liste des codes de secours hachés)
  - `last_used_at`: DateTimeField
- **`OTP`**
  - `user`: ForeignKey(User)
  - `code`: CharField(max_length=6)
  - `channel`: CharField (sms / email)
  - `is_verified`: BooleanField
  - `expires_at`: DateTimeField

### 2.2 `partners` — Universités, Facultés & Affiliations

Gère le découpage académique institutionnel pour la gouvernance des bouquets et accès étudiants. te

- le role auteur, toutes let etc**`Institution`** (Université / École de Grande Envergure)
- `id`: UUID
- `name`: CharField (ex: "Université d'Abomey-Calavi")
- `code`: CharField(unique=True) (ex: "UAC-BJ")
- `country`: CharField(max_length=2)
- `domain_name`: CharField (Domaine email officiel pour auto-affiliation)
- `is_active`: BooleanField
- **`Faculty`** (Faculté / Institut)
  - `institution`: ForeignKey(Institution)
  - `name`: CharField (ex: "Faculté des Sciences Humaines")
  - `code`: CharField
- **`Department`** (Département Académique)
  - `faculty`: ForeignKey(Faculty)
  - `name`: CharField (ex: "Département de Sociologie")
- **`StudentAffiliation`** (Lien Étudiant ↔ Université)
  - `student`: ForeignKey(User)
  - `institution`: ForeignKey(Institution)
  - `department`: ForeignKey(Department)
  - `student_card_number`: CharField
  - `is_validated`: BooleanField (Validé par le bibliothécaire/admin)

### 2.3 `catalog` — Fonds Numérique, Métadonnées & ONIX 3.0

Catalogue central des ouvrages académiques et scientifiques (PDF, EPUB, Audio).

- **`Ouvrage`** (Livre numérique / Manuel / Monographie)
  - `id`: UUID
  - `isbn`: CharField(unique=True, max_length=17)
  - `title`: CharField
  - `subtitle`: CharField(blank=True)
  - `publisher`: ForeignKey('publishers_portal.Publisher')
  - `format_type`: CharField (pdf / epub / audio / print)
  - `file`: FileField (Stocké sur Cloudflare R2 via `R2MediaStorage`)
  - `file_size_bytes`: BigIntegerField
  - `page_count`: IntegerField
  - `publication_date`: DateField
  - `language`: CharField(default='fr')
  - `summary`: TextField (Description enrichie)
  - `table_of_contents`: JSONField
  - `status`: CharField (draft / pending_review / published / archived)
  - `protection_type`: CharField (none / watermark / lcp / invisible_tatouage)
- **`BookAuthor`** (Contributeur / Auteur de catalogue)
  - `id`: UUID
  - `first_name`: CharField
  - `last_name`: CharField
  - `email`: EmailField(blank=True, null=True)
  - `user`: ForeignKey('accounts.User', null=True, blank=True, on_delete=models.SET_NULL) # Lien optionnel avec un compte utilisateur
  - `biography`: TextField(blank=True)
- **`Discipline`** & **`Domain`**
  - `name`: CharField
  - `code_dewey`: CharField (Indexation Dewey académique)
- **`MetadataONIX`** (Fiche ONIX 3.0 sérialisée)
  - `ouvrage`: OneToOneField(Ouvrage)
  - `onix_xml`: TextField (Notice XML brute ONIX 3.0)
  - `onix_version`: CharField(default='3.0')
  - `last_imported_at`: DateTimeField

*Note de recherche (MVP)* : La recherche plein texte initiale s'appuiera sur PostgreSQL (`SearchVector` / `SearchRank`). L'évaluation d'un passage à Meilisearch est détaillée en §6.5.

### 2.4 `protection` — DRM LCP, Tatouage Invisible & Watermarking

Sécurisation des fichiers et journalisation légale des accès.

- **`ProtectionConfig`**
  - `ouvrage`: OneToOneField('catalog.Ouvrage')
  - `allow_print`: BooleanField(default=False)
  - `allow_copy`: BooleanField(default=False)
  - `allow_download`: BooleanField(default=False)
  - `watermark_visible`: BooleanField(default=True)
  - `watermark_text_template`: CharField (ex: "Licence accordée à {email} - {ip} le {date}")
  - `invisible_watermark_enabled`: BooleanField(default=False)
- **`TraceAcces`** (Journal d'audit légal d'accès aux ouvrages)
  - `id`: BigAutoField
  - `user`: ForeignKey(User, null=True, on_delete=SET_NULL)
  - `ouvrage`: ForeignKey('catalog.Ouvrage', on_delete=CASCADE)
  - `ip_address`: GenericIPAddressField
  - `country`: CharField(max_length=2)
  - `user_agent`: TextField
  - `device_fingerprint`: CharField(max_length=255)
  - `access_type`: CharField (read_online / download_lcp / audio_stream)
  - `page_number`: IntegerField(null=True)
  - `timestamp`: DateTimeField(auto_now_add=True, db_index=True)

### 2.5 `publishers_portal` — Portail Éditeurs, Soumissions & Workflow

Gestion des comptes éditeurs, du dépôt d'ouvrages et du circuit de validation multi-étapes.

- **`Publisher`** (Maison d'Édition partenaire)
  - `id`: UUID
  - `name`: CharField
  - `rccm_number`: CharField (Registre du commerce)
  - `country`: CharField(max_length=2)
  - `contact_email`: EmailField
  - `bank_iban`: CharField (Chiffré au repos)
- **`SubmissionDraft`** (Manuscrit / Fichier en cours de soumission)
  - `publisher`: ForeignKey(Publisher)
  - `uploaded_by`: ForeignKey(User)
  - `title`: CharField
  - `raw_file`: FileField
  - `status`: CharField (uploaded / in_legal_review / in_layout_review / approved / rejected)
- **`ValidationWorkflowStep`**
  - `submission`: ForeignKey(SubmissionDraft)
  - `step_name`: CharField (legal_review / layout_review / editorial_approval)
  - `assigned_to`: ForeignKey(User)
  - `status`: CharField (pending / approved / changes_requested / rejected)
  - `comments`: TextField
  - `completed_at`: DateTimeField(null=True)

### 2.6 `rights` — Territoires d'Exploitation, Redevances & Licences

Gestion des droits d'auteur, règles géographiques et calcul automatique des redevances par ayant droit.

- **`AuthorRight`** (Droits et ventilation par ayant droit / contributeur)

  - `ouvrage`: ForeignKey('catalog.Ouvrage', on_delete=models.CASCADE, related_name='author_rights')
  - `author`: ForeignKey('catalog.BookAuthor', null=True, blank=True, on_delete=models.SET_NULL) # Identité de l'auteur crédité sur l'ouvrage (crédits scientifiques/éditoriaux)
  - `user`: ForeignKey('accounts.User', null=True, blank=True, on_delete=models.SET_NULL) # Compte applicatif qui reçoit effectivement le versement/notification (ayant droit / héritier)
  - `role`: CharField(max_length=50) (auteur_principal / co_auteur / traducteur / prefacier)
  - `pool_share_percent`: DecimalField(max_digits=5, decimal_places=2) # Part de l'ayant droit à l'intérieur de l'enveloppe auteur (ex: 70.00%)

  *Arbitrage de modélisation (Option B appliquée)* :

  - `author` représente l'auteur crédité publiquement sur l'ouvrage (`BookAuthor`).
  - `user` représente le compte utilisateur recevant le versement financier (ex. héritier, mandataire ou compte utilisateur relié). Si `user` est `null`, le versement retombe par défaut sur `author.user`.
  - **Validation d'intégrité (100 % pool)** : La somme des `pool_share_percent` de tous les `AuthorRight` rattachés à un même `Ouvrage` doit égaler exactement 100,00 %. Cette contrainte est validée au niveau de la méthode `clean()` du modèle Django (garantie d'intégrité en base/Admin) ET au niveau du Serializer DRF (`serializers.ValidationError`) pour remonter des erreurs claires à l'API client.
- **`RightTerritory`** (Périmètre géographique autorisé)

  - `ouvrage`: ForeignKey('catalog.Ouvrage')
  - `allowed_countries`: JSONField (Liste des codes ISO autorisés, ex: `["BJ", "SN", "CI"]`)
  - `exclusive`: BooleanField(default=True)
- **`RoyaltyRate`** (Taux de rémunération global de l'ouvrage)

  - `ouvrage`: ForeignKey('catalog.Ouvrage')
  - `author_share_percent`: DecimalField(max_digits=5, decimal_places=2) (ex: 12.50% global sur le revenu total)
  - `publisher_share_percent`: DecimalField(max_digits=5, decimal_places=2) (ex: 40.00% global)
  - `platform_share_percent`: DecimalField(max_digits=5, decimal_places=2) (ex: 47.50% global)
- **`RoyaltyCalculation`** (Calcul mensuel global archivé par ouvrage)

  - `id`: UUID
  - `period_month`: DateField (Premier jour du mois)
  - `ouvrage`: ForeignKey('catalog.Ouvrage')
  - `total_reads_count`: IntegerField
  - `total_revenue`: DecimalField(max_digits=12, decimal_places=2)
  - `publisher_payout_amount`: DecimalField(max_digits=12, decimal_places=2)
  - `is_settled`: BooleanField(default=False)
  - `@property author_payout_total`: Calcule la somme de toutes les lignes `RoyaltyPayoutLine` associées
- **`RoyaltyPayoutLine`** (Ligne de paiement ventilée par ayant droit)

  - `calculation`: ForeignKey(RoyaltyCalculation, on_delete=models.CASCADE, related_name='payout_lines')
  - `author_right`: ForeignKey(AuthorRight, on_delete=models.PROTECT)
  - `payout_amount`: DecimalField(max_digits=12, decimal_places=2)
  - `is_settled`: BooleanField(default=False)

### 2.7 `commerce` — Devises, Transactions & Abonnements

Gestion des monnaies multi-pays, paiements Mobile Money (Moneroo) et Cartes (Stripe), formules d'abonnement et licences.

- **`Currency`** (Gestion des devises multi-pays)

  - `code`: CharField(max_length=3, unique=True) # Code ISO 4217 (ex: XOF, XAF, CDF, EUR, USD)
  - `is_pegged`: BooleanField(default=False) # True pour XOF et XAF (arrimées à l'Euro)
  - `peg_rate_to_eur`: DecimalField(max_digits=12, decimal_places=6, null=True, blank=True) # Ex: 655.957000 pour XOF et XAF
  - `last_updated_at`: DateTimeField(auto_now=True)

  *Note sur les devises* :

  - **XOF (BCEAO)** (Bénin, Sénégal, Niger, Togo, Côte d'Ivoire) et **XAF (BEAC)** (Gabon) sont deux devises distinctes malgré un taux fixe identique vis-à-vis de l'Euro (1 EUR = 655,957).
  - **CDF (Franc Congolais)** (RDC) est une devise flottante non arrimée. Une tâche Celery périodique met à jour son taux de change via un fournisseur externe `# TODO: choisir le fournisseur (ex. exchangerate.host)`.
- **`SubscriptionPlan`**

  - `name`: CharField (ex: "Pass Étudiant Annuel", "Bouquet Droit & Sciences Politiques")
  - `plan_type`: CharField (individual / institution_bouquet)
  - `price_amount`: DecimalField(max_digits=10, decimal_places=2)
  - `currency`: ForeignKey(Currency, on_delete=models.PROTECT) # Résolution dynamique selon le pays de l'institution/utilisateur (Pas de valeur par défaut 'XOF' en dur)
  - `duration_days`: IntegerField(default=365)
  - `max_concurrent_users`: IntegerField(default=1)
- **`Subscription`**

  - `user`: ForeignKey(User, null=True)
  - `institution`: ForeignKey('partners.Institution', null=True)
  - `plan`: ForeignKey(SubscriptionPlan)
  - `starts_at`: DateTimeField
  - `expires_at`: DateTimeField
  - `is_active`: BooleanField
- **`PaymentTransaction`**

  - `id`: UUID
  - `moneroo_id`: CharField(null=True, unique=True)
  - `stripe_payment_intent`: CharField(null=True, unique=True)
  - `user`: ForeignKey(User)
  - `amount`: DecimalField
  - `currency`: ForeignKey(Currency, on_delete=models.PROTECT)
  - `amount_converted_xof`: DecimalField(max_digits=12, decimal_places=2, null=True) # Équivalent pivot pour statistiques globales
  - `status`: CharField (pending / success / failed / refunded)
  - `raw_webhook_payload`: JSONField

### 2.8 `ai_engine` — Classification & Indexation IA

Abstraction du fournisseur IA pour l'indexation sémantique et la synthèse automatique.

- **`AiClassificationTask`**
  - `ouvrage`: ForeignKey('catalog.Ouvrage')
  - `status`: CharField (pending / processing / completed / failed)
  - `extracted_keywords`: JSONField
  - `suggested_category`: CharField
  - `summary_ai`: TextField
  - `processed_at`: DateTimeField

### 2.9 `audio` — Livres Audio & Streaming Cloudflare

Intégration Cloudflare Stream pour le streaming HLS fluide des livres audio.

- **`AudioTrack`**
  - `ouvrage`: ForeignKey('catalog.Ouvrage')
  - `chapter_number`: IntegerField
  - `title`: CharField
  - `duration_seconds`: IntegerField
  - `stream_id`: CharField (UID Cloudflare Stream)
  - `hls_manifest_url`: URLField
  - `captions_vtt_url`: URLField(null=True)

### 2.10 `reporting` — Analytics & Notifications

Tableaux de bord d'usage et système de notification multi-canaux.

- **`InstitutionAnalytics`**
  - `institution`: ForeignKey('partners.Institution')
  - `month`: DateField
  - `active_students_count`: IntegerField
  - `total_pages_read`: IntegerField
  - `most_read_disciplines`: JSONField
- **`Notification`** & **`NotificationPreference`** (Reprises de LahaAcademia)

---

## 3. Matrice des 10 Rôles & Permissions Granulaires


| Code Rôle       | Rôle                       | Description Métier                            | Scope des Permissions DRF                                            |
| ------------------ | ----------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| `student`        | Étudiant                   | Apprenant inscrit individuellement ou affilié | Consultation catalogue, lecture protégée selon abonnement          |
| `teacher`        | Enseignant / Chercheur      | Universitaire                                  | Consultation avancée, création de listes de lecture                |
| `librarian`      | Bibliothécaire             | Gestionnaire de l'institution                  | Validation des affiliations étudiants, stats d'usage établissement |
| `publisher`      | Éditeur                    | Représentant d'une maison d'édition          | Dépôt d'ouvrages, suivi des soumissions, consultation redevances   |
| `author`         | Auteur                      | Créateur de contenu scientifique              | Consultation de ses ouvrages publiés et de ses états de redevances |
| `legal_reviewer` | Juriste / Relecteur Droit   | Validateur de la conformité juridique         | Validation des contrats d'édition et territoires d'exploitation     |
| `layout_artist`  | Maquettiste / Éditeur Tech | Validateur technique du fichier                | Validation du format PDF/EPUB et de la qualité graphique            |
| `partner_api`    | Partenaire API / SSO        | Application cliente externe (API OAuth2)       | Lecture des métadonnées du catalogue et vérification de droits    |
| `admin`          | Administrateur Métier      | Équipe opérationnelle LAHAThèque            | Modération, gestion des utilisateurs, validation globale            |
| `super_admin`    | Super Administrateur        | Direction technique                            | Accès total, configuration des clés système et exports financiers |

---

## 4. Répertoire Complet des Endpoints REST API

### 4.1 Authentification & Comptes (`/api/v1/auth/`)

- `POST /api/v1/auth/login/` — Connexion initiale (Retourne l'état d'auth, BFF pose le cookie HttpOnly). *(Public)*
- `POST /api/v1/auth/logout/` — Déconnexion (Invalide le cookie HttpOnly). *(IsAuthenticated)*
- `POST /api/v1/auth/mfa/setup/` — Génération du QR Code TOTP secrète. *(IsAuthenticated)*
- `POST /api/v1/auth/mfa/verify/` — Validation de la configuration TOTP. *(IsAuthenticated)*
- `POST /api/v1/auth/otp/request/` — Demande d'envoi d'OTP SMS/Email. *(Public)*
- `POST /api/v1/auth/otp/verify/` — Vérification d'OTP. *(Public)*

### 4.2 Catalogue & Recherche (`/api/v1/catalog/`)

- `GET /api/v1/catalog/books/` — Recherche paginée & filtrée d'ouvrages (Filtres: discipline, pays, format). *(AllowAny)*
- `GET /api/v1/catalog/books/{id}/` — Détails complets d'un ouvrage et aperçu public. *(AllowAny)*
- `POST /api/v1/catalog/onix/import/` — Importation de notice ONIX 3.0 XML. *(IsPublisher / IsAdmin)*

### 4.3 Protection & Lecteur LCP (`/api/v1/protection/`)

- `GET /api/v1/protection/read/{book_id}/` — Vérifie l'abonnement/territoire et renvoie l'URL signée du flux ou le fichier tatoué. *(IsAuthenticated)*
- `GET /api/v1/protection/lcp/license/{book_id}/` — Émission du document de licence Readium LCP pour l'application cliente. *(IsAuthenticated)*
- `GET /api/v1/protection/lcp/content-key/{license_id}/` — Récupération sécurisée de la clé de contenu chiffrée. *(IsAuthenticated)*
- `GET /api/v1/protection/lcp/status/{license_id}/` — Consultation du statut de licence (License Status Document - LSD). *(IsAuthenticated)*
- `POST /api/v1/protection/lcp/renew/{license_id}/` — Renouvellement de la période de prêt LCP. *(IsAuthenticated)*
- `POST /api/v1/protection/lcp/return/{license_id}/` — Restitution/Retour anticipé d'un ouvrage (Early Return). *(IsAuthenticated)*
- `POST /api/v1/protection/traces/` — Enregistrement synchrone d'une empreinte de lecture `TraceAcces`. *(IsAuthenticated)*

### 4.4 Portail Éditeurs & Soumissions (`/api/v1/publishers/`)

- `POST /api/v1/publishers/submissions/` — Dépôt d'un nouveau manuscrit / document. *(IsPublisher)*
- `GET /api/v1/publishers/workflows/` — Liste des tâches de relecture en attente. *(IsLegalReviewer / IsLayoutArtist)*
- `PATCH /api/v1/publishers/workflows/{id}/approve/` — Validation d'une étape du workflow. *(IsLegalReviewer / IsLayoutArtist)*

### 4.5 Droits & Redevances (`/api/v1/rights/`)

- `GET /api/v1/rights/royalties/my-statements/` — Consultation des états de redevances ventilés par ayant droit (`RoyaltyPayoutLine`). *(IsAuthor / IsPublisher)*
- `POST /api/v1/rights/calculate-monthly/` — Déclenchement manuel/Celery du calcul mensuel des redevances. *(IsAdmin)*

### 4.6 Commerce & Abonnements (`/api/v1/commerce/`)

- `POST /api/v1/commerce/checkout/` — Initialisation de paiement (Moneroo / Stripe). *(IsAuthenticated)*
- `POST /api/v1/commerce/webhooks/moneroo/` — Réception webhook Moneroo (Idempotent). *(Public - IP Whitelisted)*
- `POST /api/v1/commerce/webhooks/stripe/` — Réception webhook Stripe. *(Public - Signature Verified)*

### 4.7 OAuth2 & SSO Partenaires (`/api/v1/oauth2/` & `/api/v1/sso/`)

Géré via l'application Django `accounts` (pour OAuth2 Provider) et `partners` (pour la fédération SSO institutionnelle).

- `POST /api/v1/oauth2/token/` — Obtention de token via Client Credentials Grant ou Authorization Code. *(Public - Authentification client_id / client_secret)*
- `POST /api/v1/oauth2/token/revoke/` — Révocation de token OAuth2 d'application partenaire. *(Partner authentifié)*
- `GET /api/v1/sso/saml2/login/` — Initialisation du flux SSO SAML 2.0 (Service Provider). *(Public)*
- `POST /api/v1/sso/saml2/acs/` — Assertion Consumer Service Endpoint SAML 2.0. *(Public - Signature IdP vérifiée)*

*Notes d'intégration SSO & Librairies* :

- **OAuth2 / OIDC** : Implémenté via la bibliothèque Python `django-oauth-toolkit` pour l'exposition d'API sécurisées aux applications partenaires.
- **SAML 2.0** : Implémenté via `djangosaml2` (basé sur PySAML2) pour l'interconnexion avec les fournisseurs d'identité (IdP) universitaires (Shibboleth, CAS, Microsoft Entra ID).
- **Flexibilité protocolaire** : Le protocole retenu (SAML 2.0 ou OAuth2/OIDC) dépend de ce que chaque institution partenaire peut fournir — le système supporte les deux approches.

---

## 5. Spécifications de Sécurité Transverse

1. **Isolation des Cookies JWT (BFF Pattern)**

   - Aucun token JWT brut n'est accessible via JavaScript (`document.cookie`).
   - Le cookie `laha_access` est posé avec `HttpOnly=True`, `Secure=True` (prod), `SameSite=Lax`.
   - Le rafraîchissement est géré en arrière-plan via la `Web Locks API` pour éviter les conditions de concurrence multi-onglets.
2. **Chiffrement des Données Sensibles en Base (Field-Level Encryption)**

   - Les champs bancaires (IBAN, numéros de compte) des éditeurs et auteurs sont chiffrés en base de données avec une clé AES-256 via `django-encrypted-model-fields`.
3. **Protection Anti-Bruteforce & Throttling**

   - Verification des tentatives infructueuses par IP/Username via `Django Axes` (Blocage 15 min après 5 échecs).
   - Rate Throttling strict : `10/min` sur les endpoints d'authentification et de paiement (`AuthThrottle`, `PaymentThrottle`).
4. **Traçabilité Légale (`TraceAcces`)**

   - Chaque ouverture de document génère une entrée non modifiable `TraceAcces` contenant l'IP, le pays résolu, le User-Agent, le fingerprint d'appareil et l'identifiant de la licence accordée.

---

## 6. Propositions techniques pour arbitrage (à valider par LAHA Éditions)

### 6.1 Serveur LCP : Self-Hosted vs Managé

- **Proposition (à valider par LAHA Éditions)** : Service séparé Go (Self-Hosted) basé sur le serveur v2 open-source officiel `edrlab/lcp-server` (v2.0.0+ par EDRLab).
- **Raisonment & Exigence Contractuelle** : Le serveur LCP doit être isolé sur son propre sous-domaine/container avec sa propre base PostgreSQL/SQLite et ses clés de chiffrement RSA. Le monolithe Django communique avec lui via une API REST interne sécurisée pour signer les licences de prêt sans exposer la clé maître LCP.
  - **Accréditation EDRLab Obligatoire** : Le passage en mode production nécessite obligatoirement de signer un contrat avec **EDRLab** afin d'obtenir les informations de certification et les identifiants de signature confidentiels. Il s'agit donc d'un mode self-hosted assorti d'une relation contractuelle EDRLab obligatoire pour la certification de production.
- **Supervision & Outillage** : Évaluer l'intégration du tableau de bord officiel `edrlab/lcp-dashboard` (SPA Node.js/React) pour fournir des métriques sur le serveur LCP et permettre aux administrateurs de révoquer les licences partagées de manière abusive.
- **Qui doit trancher** : Direction technique + Direction juridique / Contractuelle + Validation budgétaire.

### 6.2 Tatouage Invisible (Watermarking Numérique)

- **Proposition (à valider par LAHA Éditions)** : Combinaison PyMuPDF (Tampon visible) + Stéganographie PDF (Tatouage invisible stochastique en phase 2).
- **Raisonment** : En lancement, PyMuPDF appliquera un tatouage visible dynamique sur chaque page (nom, email, IP, horodatage) lors du rendu du flux. En phase 2, un script Celery insérera un tatouage stéganographique dans les métadonnées et la structure des objets PDF sans altérer la qualité visuelle.
- **Avertissement technique & Préalable** : La robustesse d'un tatouage stéganographique invisible face à la compression dégradante, l'impression physique et le re-scan optique (OCR) n'est démontrée par aucune source citée dans ce document. Un **Proof of Concept (POC) de validation technique** est un préalable non négociable avant tout engagement contractuel envers les éditeurs sur ce point.
- **Qui doit trancher** : Direction technique, après POC uniquement.

### 6.3 Gestion Multi-Devises Multi-Pays

- **Proposition (à valider par LAHA Éditions)** : Modèle `Currency` multi-devises, taux fixes pour devises arrimées à l'Euro (XOF, XAF) et mise à jour périodique par Celery pour devises flottantes (CDF).
- **Raisonment** :
  - **XOF** (Bénin, Sénégal, Niger, Togo, Côte d'Ivoire) et **XAF** (Gabon) sont deux devises distinctes malgré leur parité fixe identique (1 EUR = 655,957).
  - **CDF** (RDC) requiert une mise à jour dynamique de taux via une API externe.
  - Les transactions conservent la devise d'origine et enregistrent une conversion pivot pour les rapports financiers.
- **Qui doit trancher** : Direction technique + Finance.

### 6.4 Durée de Rétention RGPD des Logs (`TraceAcces`)

- **Proposition (à valider par LAHA Éditions)** : Rétention glissante de 24 mois (2 ans).
- **Raisonment** : Les logs `TraceAcces` sont conservés pendant 2 ans pour couvrir les besoins d'audit de contrefaçon et de vérification des droits d'auteur, puis automatiquement purgés ou anonymisés (suppression de l'IP et du User-Agent, conservation des métadonnées statistiques anonymes) via une tâche automatisée `Celery Beat`.
- **Qui doit trancher** : Responsable conformité / Juridique.

### 6.5 Moteur de Recherche : PostgreSQL Full-Text vs Meilisearch

- **Proposition (à valider par LAHA Éditions)** : Recherche initiale MVP avec PostgreSQL Full-Text (`SearchVector` / `SearchRank`), évaluation de la migration vers Meilisearch en Phase 2.
- **Raisonment** : PostgreSQL couvre les besoins de recherche initiaux sans ajouter la complexité d'un cluster d'indexation supplémentaire à l'ouverture. Si le volume d'ouvrages dépasse 50 000 références ou si la recherche multilingue/faute d'orthographe (fuzzy search) devient un critère clé, l'extraction vers Meilisearch sera activée.
- **Qui doit trancher** : Direction technique + Produit.

---

## 7. Conflits identifiés

Lors des passes de révision et d'intégration des corrections ciblées, les points de divergence suivants ont été relevés et traités :

1. **Montant agrégé des redevances vs Ventilation par Ayant Droit (`rights`)** :

   - *Initialement* : `RoyaltyCalculation` stockait un montant unique `author_payout_amount`.
   - *Conflit* : Ce schéma ne permettait pas de gérer les ouvrages multi-auteurs/contributeurs (ex: co-auteurs, traducteurs, préfaciers).
   - *Résolution* : Introduction des modèles `AuthorRight` (part de chaque auteur via `pool_share_percent` à 100 %) et `RoyaltyPayoutLine` (ligne de paiement par ayant droit). La propriété `author_payout_total` sur `RoyaltyCalculation` assure la rétro-compatibilité.
2. **Valeur par défaut 'XOF' en dur (`commerce`)** :

   - *Initialement* : `SubscriptionPlan.currency` possédait `default='XOF'` en dur.
   - *Conflit* : Incompatible avec la présence du Gabon (XAF) et de la RDC (CDF).
   - *Résolution* : Suppression de la valeur par défaut codée en dur. La devise est liée à une Clé Étrangère `Currency` résolue dynamiquement selon la zone géographique de l'utilisateur ou de l'institution.
3. **Passage de passe finale** :

   - *Aucun nouveau conflit identifié dans cette passe de correction finalisée.*
