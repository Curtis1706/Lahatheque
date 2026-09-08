# Implementation Plan: Refonte de la Suite « Gestion des Finances »

**Branch**: `003-finance-management-suite` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Spécification validée de la suite « Gestion des Finances » incluant la réconciliation arithmétique dynamique du Chiffre d'Affaires sur `/admin/sales`, la création de la page autonome `/admin/payouts`, la consolidation multi-partenaires sur `/admin/finance`, et l'épuration de `/admin/royalties`.

## Summary

Cette fonctionnalité restructure l'ensemble du pôle financier de la plateforme en 4 volets complémentaires :
1. **Ventes & Revenus (`/admin/sales`)** : Réconciliation arithmétique 100 % dynamique du Chiffre d'Affaires total consolidé en agrégeant en direct toutes les commandes payées en base (B2C, universités et grossistes). Tableau à lignes consolidées dépliables (accordéons) pour chaque commande afin de détailler les articles, formats, quantités et sous-totaux sans encombrement.
2. **Demandes de Versement (`/admin/payouts`)** : Création d'une page dédiée avec 4 KPIs de suivi, tableau des demandes d'auteurs, éditeurs et universités, et modales de validation (saisie référence transaction + justificatif facultatif) et de rejet (motif obligatoire).
3. **Finances Globales (`/admin/finance`)** : Tableau de bord consolidé 360° et tableau récapitulatif multi-partenaires enrichi avec filtres par rôle et accordéons dépliables par ayant-droit.
4. **Redevances & Droits (`/admin/royalties`)** : Suppression des 3 boutons orphelins dans l'en-tête, retrait du bloc de versement, recentrage sur la configuration des barèmes et des taux contractuels dérogatoires.
5. **Sidebar (`dashboard-sidebar.tsx`)** : Intégration des 4 sous-menus ordonnés sous le menu « Gestion des Finances ».

---

## Technical Context

**Language/Version**: Python 3.10+ (Backend Django 5), TypeScript 5.0+ (Frontend Next.js 14 App Router).

**Primary Dependencies**:
- Backend : Django REST Framework, Django ORM avec requêtes optimisées `select_related()` / `prefetch_related()`.
- Frontend : React 18, Next.js App Router, TailwindCSS avec tokens sémantiques, Lucide React (icônes exclusives), Sonner (toasts).

**Storage**: PostgreSQL (Neon Cloud) avec transactions atomiques `@transaction.atomic` pour toute mutation financière.

**Testing**: Pytest pour les tests unitaires / d'intégration backend (`pytest apps/reporting/` et `pytest apps/rights/`), vérification statique TypeScript (`tsc --noEmit`) pour le frontend.

**Target Platform**: Web responsive (Mobile-first garanti sous 400px, tablette et desktop).

**Project Type**: Application web modulaire SaaS (BFF Next.js + API REST Django).

**Performance Goals**: Restitution des tableaux de données et des KPIs en moins de 800 ms.

**Constraints**: Respect strict de la Constitution LAHAThèque (Zéro mock, Zéro code couleur hexadécimal en dur, Zéro émoji, Typographie officielle Playfair Display / Poppins).

**Scale/Scope**: 4 écrans d'administration financière, 3 endpoints backend REST, services API BFF dédiés.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

- [x] **I. Cadrage Métier & Lecture Intégrale** : Analyse exhaustive de `apps/reporting/admin_views.py`, `apps/rights/models.py`, `admin/sales/page.tsx`, `admin/finance/page.tsx`, `admin/royalties/page.tsx` et `dashboard-sidebar.tsx`.
- [x] **III. Rigueur Backend & Typage Statique** : Type hints stricts sur toutes les vues, méthodes et serializers Django.
- [x] **IV. Format de Réponse API Unifié** : Respect strict du format standard `{"success": true, "data": ..., "error": null}` sur tous les endpoints.
- [x] **V. Performance ORM & N+1** : Utilisation systématique de `select_related()` et `prefetch_related()`, aucune requête N+1 sur les commandes ou lignes d'articles.
- [x] **VI. Sécurité Réseau & HttpOnly** : Authentification par cookies de session sécurisés HttpOnly via le proxy BFF (`/api/bff/...`).
- [x] **VIII. Tokens Sémantiques & Typographie** : Classes `bg-navy`, `text-gold`, `border-border`, etc. exclusivement. Polices `Playfair Display` pour les en-têtes et `Poppins` pour le corps et les données.
- [x] **X. Interdiction Absolue de Tout Émoji** : Zéro émoji dans le code, les vues, les commentaires ou les modales. Icônes vectorielles Lucide React exclusives.
- [x] **XII. Interdiction des Mocks & Données Réelles** : Zéro mock, zéro bouchon. Connexion directe aux données réelles de la base via BFF.

---

## Project Structure

### Documentation (this feature)

```text
specs/003-finance-management-suite/
├── plan.md              # Ce document d'architecture et de planification
├── research.md          # Résultats de recherche technique et décisions (Phase 0)
├── data-model.md        # Modèles Django et interfaces TypeScript (Phase 1)
├── quickstart.md        # Guide de test et de validation end-to-end (Phase 1)
├── contracts/           # Spécifications détaillées des interfaces d'API (Phase 1)
│   ├── sales-api.md
│   ├── payouts-api.md
│   └── finance-api.md
└── tasks.md             # Découpage des tâches exécutables (/speckit-tasks)
```

### Source Code

```text
lahatheque-backend/
├── apps/
│   ├── commerce/models.py              # Order, LigneCommande, WholesaleOrder
│   ├── partners/models.py              # UniversityPaperOrder
│   ├── rights/
│   │   ├── models.py                   # PayoutRequest, AuthorRight, ContratLegal
│   │   └── views.py                    # Endpoints PayoutRequest (validate, reject, kpis)
│   └── reporting/
│       ├── admin_views.py              # AdminSalesListAPIView, AdminGlobalFinanceView, PartnerRoyalties
│       └── urls.py                     # Déclaration des routes REST

lahatheque-frontend/
├── app/(dashboard)/admin/
│   ├── sales/page.tsx                  # Page Ventes & Revenus (réconciliation dynamique + accordéons)
│   ├── finance/page.tsx                # Page Finances Globales (synthèse 360° + table multi-partenaires)
│   ├── royalties/page.tsx              # Page Redevances (épurée des 3 boutons et du bloc versements)
│   └── payouts/page.tsx                # Nouvelle page Demandes de Versement (KPIs + data table + modales)
├── components/
│   ├── dashboard-sidebar.tsx           # Mise à jour du menu "Gestion des Finances" (4 sous-liens)
│   └── features/admin/
│       ├── payout-validation-modal.tsx # Modale de validation (référence + justificatif facultatif)
│       └── payout-rejection-modal.tsx  # Modale de rejet avec motif obligatoire
├── lib/
│   ├── services/admin.ts               # Fonctions d'appels API BFF (payouts, sales, partner royalties)
│   └── types/admin.ts                  # Typage TypeScript strict des modèles financiers
```

---

## Complexity Tracking

Aucune déviation constitutionnelle requise. L'implémentation réutilise l'architecture éprouvée du projet (BFF Next.js proxy, Django REST Framework, tokens CSS existants).
