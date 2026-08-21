# Tasks: Module 8 - Espace Administration Globale, Tarification, Supervision & Relances

**Feature**: `008-administration-supervision-globale`  
**Status**: Completed  
**Dependencies**: Django 5.2, Celery 5.4 / Redis 7, Next.js 16 App Router, TailwindCSS  
**Constitution**: `.specify/memory/constitution.md`

---

## Phase 1 : Modélisation Backend & Migrations (Django & Celery)

- [x] **T-801** : Créer et enregistrer les modèles `ConfigurationPlateformeGlobale`, `RelanceAutomatiqueLog`, et `JournalAuditAdmin` dans [apps/reporting/models.py](file:///e:/Lahatheque/lahatheque-backend/apps/reporting/models.py).
- [x] **T-802** : Implémenter les 3 tâches Celery Beat dans [apps/reporting/tasks.py](file:///e:/Lahatheque/lahatheque-backend/apps/reporting/tasks.py) :
  - `task_scan_and_send_deposit_reminders` (relance des maquettes en attente > 7 jours).
  - `task_scan_and_send_unpaid_reminders` (relance des commandes impayées avec lien Mobile Money).
  - `task_scan_and_send_subscription_expiry_reminders` (relance à J-15 et J-3 de fin de validité).
- [x] **T-803** : Générer et exécuter les migrations Django (`python manage.py makemigrations reporting` et `python manage.py migrate`).

---

## Phase 2 : Endpoints REST & Logique Métier DRF

- [x] **T-804** : Créer `apps/reporting/admin_views.py` avec les endpoints d'administration protégés par `IsAdminUser` / `IsSuperAdminUser` :
  - `GET /api/v1/admin/stats/panoramic/` (agrégation SQL optimisée du chiffre d'affaires, ventes, ventilations pays et rôles).
  - `GET/PATCH /api/v1/admin/settings/global/` (consultation et mutation de la configuration globale et cascade tarifaire).
  - `GET/POST /api/v1/admin/users/` (annuaire paginé et création manuelle de comptes avec rôles).
  - `PATCH /api/v1/admin/users/{id}/status/` (activation, désactivation, suspension motivée).
  - `GET/PATCH /api/v1/admin/catalog/pricing/` (grille des prix par défaut et spécifiques).
  - `POST /api/v1/admin/catalog/{id}/reset-pricing/` (réalignement 1 clic sur le tarif global).
  - `GET /api/v1/admin/royalties/payouts/` & `POST /api/v1/admin/royalties/payouts/{id}/process/` (validation/rejet des versements).
  - `GET /api/v1/admin/reminders/` & `POST /api/v1/admin/reminders/trigger-now/` (déclenchement forcé et audit des relances).
- [x] **T-805** : Enregistrer les routes d'administration dans [apps/reporting/urls.py](file:///e:/Lahatheque/lahatheque-backend/apps/reporting/urls.py) et [config/urls.py](file:///e:/Lahatheque/lahatheque-backend/config/urls.py).

---

## Phase 3 : Types TypeScript & Couche Services / Mocks Frontend

- [x] **T-806** : Mettre à niveau [lib/types/admin.ts](file:///e:/Lahatheque/lahatheque-frontend/lib/types/admin.ts) avec les interfaces complètes de l'administration (`AdminKpi`, `AdminSale`, `AdminReminder`, `AdminUser`, `GlobalPricingConfig`, `PartnerRoyaltyConfig`, `PayoutRequest`, `AuditLogEntry`).
- [x] **T-807** : Compléter [lib/mock/admin.ts](file:///e:/Lahatheque/lahatheque-frontend/lib/mock/admin.ts) avec des données réalistes couvrant l'ensemble des pays d'Afrique de l'Ouest/Centrale (Bénin, Sénégal, Côte d'Ivoire, Togo, Niger, Gabon, RDC) et les 11 rôles.
- [x] **T-808** : Enrichir [lib/services/admin.ts](file:///e:/Lahatheque/lahatheque-frontend/lib/services/admin.ts) avec toutes les fonctions asynchrones de gestion (`getAdminKpis`, `updateGlobalPricing`, `updatePartnerRoyaltyRate`, `processRoyaltyPayout`, `triggerAdminRemindersNow`, `resetBookPricing`, `updateBookPricing`).

---

## Phase 4 : Écrans & Tableaux de Bord Frontend (Next.js 16)

- [x] **T-809** : Finaliser le Tableau de bord panoramique 360° dans [app/(dashboard)/admin/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/page.tsx) avec filtres pays, périodes, Donut Charts et courbes de ventes.
- [x] **T-810** : Implémenter l'Annuaire & Gestion des Utilisateurs dans [app/(dashboard)/admin/users/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/users/page.tsx) avec modale de création d'utilisateurs et modale de suspension motivée.
- [x] **T-811** : Implémenter la Cascade Tarifaire dans [app/(dashboard)/admin/catalog/pricing/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/catalog/pricing/page.tsx) avec édition des prix par défaut et bouton de réalignement en 1 clic.
- [x] **T-812** : Implémenter la Validation des Redevances dans [app/(dashboard)/admin/royalties/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/royalties/page.tsx), [authors/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/royalties/authors/page.tsx), [publishers/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/royalties/publishers/page.tsx) et [universities/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/royalties/universities/page.tsx) avec modale de modification des taux et saisie de référence de virement / Mobile Money.
- [x] **T-813** : Implémenter la Supervision des Relances dans [app/(dashboard)/admin/reminders/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/reminders/page.tsx) avec métriques de délivrabilité et déclenchement manuel immédiat.
- [x] **T-814** : Implémenter les Clés API et Logs d'Audit dans [app/(dashboard)/admin/api/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/api/page.tsx) et [logs/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/logs/page.tsx).

---

## Phase 5 : Validation de Conformité, Règles & Build

- [x] **T-815** : Vérifier la stricte conformité visuelle : 0 émoji, 0 couleur hexadécimale en dur, 100% tokens CSS sémantiques.
- [x] **T-816** : Vérifier le comportement Mobile-First (test de rendu sous 400px de large avec `DataTable` responsive et zones tactiles >= 44px).
- [x] **T-817** : Valider la compilation complète du frontend avec `pnpm build` (Exit Code 0).

---

## Phase 6 : Sous-Modules Dédiés Admin & Synchronisation Bidirectionnelle

- [x] **T-818** : Backend Django — Endpoints REST pour la validation Maquettisme (`/api/v1/admin/validation/`), Contrats Juridiques (`/api/v1/admin/contracts/`), Stocks Physiques & Entrepôts (`/api/v1/admin/stock/`) dans [apps/reporting/admin_views.py](file:///e:/Lahatheque/lahatheque-backend/apps/reporting/admin_views.py) et [admin_urls.py](file:///e:/Lahatheque/lahatheque-backend/apps/reporting/admin_urls.py).
- [x] **T-819** : Frontend Services & Types — Étendre [lib/types/admin.ts](file:///e:/Lahatheque/lahatheque-frontend/lib/types/admin.ts) et [lib/services/admin.ts](file:///e:/Lahatheque/lahatheque-frontend/lib/services/admin.ts) avec les types et fonctions de gestion des épreuves maquettes, contrats, mouvements de stock et entrepôts.
- [x] **T-820** : Frontend Module Validation Maquettisme — Construire les pages dédiées [app/(dashboard)/admin/validation/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/validation/page.tsx) et [[id]/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/validation/%5Bid%5D/page.tsx) avec traçabilité complète de l'intervenant (qui/quand), modale d'approbation et modale de rejet avec motif obligatoire.
- [x] **T-821** : Frontend Module Contrats & Arbitrage Juridique — Construire les pages dédiées [app/(dashboard)/admin/contracts/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/contracts/page.tsx) et [[id]/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/contracts/%5Bid%5D/page.tsx) avec suivi des statuts, gestion des barèmes dérogatoires et modales d'approbation/rejet.
- [x] **T-822** : Frontend Module Stock & Entrepôts Physiques — Construire les pages dédiées [app/(dashboard)/admin/stock/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/stock/page.tsx), [movements/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/stock/movements/page.tsx) et [warehouses/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/stock/warehouses/page.tsx) avec validation des régularisations exceptionnelles de stock.
- [x] **T-823** : Frontend Module Catalogue & Lecteur Souverain — Enrichir [app/(dashboard)/admin/catalog/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/catalog/page.tsx) et [[id]/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/catalog/%5Bid%5D/page.tsx) avec le bouton d'action "Lire l'ouvrage" connectant l'Admin au lecteur officiel sécurisé sans barrière d'achat.
- [x] **T-824** : Validation Globale — Compiler avec `pnpm build`, vérifier l'absence totale d'emojis, de codes hexadécimaux et la conformité Mobile-First.

