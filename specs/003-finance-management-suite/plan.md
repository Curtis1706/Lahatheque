# Implementation Plan: Refonte de la Suite « Gestion des Finances »

**Branch**: `003-finance-management-suite` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Spécification validée de la suite « Gestion des Finances » incluant la réconciliation arithmétique dynamique du Chiffre d'Affaires sur `/admin/sales`, la création de la page autonome `/admin/payouts`, la consolidation multi-partenaires sur `/admin/finance`, et l'épuration de `/admin/royalties`.

## Summary

Cette fonctionnalité restructure l'ensemble du pôle financier et de commande de la plateforme en 5 volets complémentaires et interconnectés :
1. **Gestion des Commandes & Panier Abandonnés (`/admin/orders`)** : Cycle de vie complet (`pending`, `paid`, `credit`, `failed`, `cancelled`, `abandoned`), bascule automatique des commandes sans paiement après 24h vers `abandoned`, filtres par statut et console d'actions opérationnelles (vérification Moneroo en 1 clic, validation manuelle tous modes dont espèces et MoMo direct, relance de panier abandonné, facture PDF acquittée, annulation).
2. **Ventes & Revenus (`/admin/sales`)** : Réconciliation arithmétique 100 % dynamique du Chiffre d'Affaires total consolidé en agrégeant en direct toutes les commandes payées en base (B2C, universités et grossistes). Tableau à lignes consolidées dépliables (accordéons) pour chaque commande afin de détailler les articles, formats, quantités et sous-totaux sans encombrement.
3. **Finances Globales & Trésorerie 360° (`/admin/finance` et `/admin/reports`)** : Tableau de bord consolidé multi-flux ventilant le CA brut encaissé par canal (Numérique/audio, Papier, Grossistes, Abonnements, Bouquets), encours de crédit/créances à recouvrer, manque à gagner des paniers abandonnés, et marge nette conservée par la plateforme après déduction des redevances estimées et coûts.
4. **Redevances, Droits & Demandes de Versement (`/admin/royalties` et `/admin/payouts`)** : Conditionnement strict de l'éligibilité des redevances à l'encaissement effectif (`paid`), épuration de `/admin/royalties` (suppression des 3 boutons orphelins), et page autonome `/admin/payouts` avec KPIs, tableau d'instruction des retraits et archivage des justificatifs.
5. **Grand Livre Comptable & Rapprochement Bancaire** : Export unifié multi-formats (Excel/CSV détaillé avec brut, commissions passerelles réelles/estimées, net, mode de paiement, référence et auditeur) et rapports PDF périodiques officiels.
6. **Sidebar (`dashboard-sidebar.tsx`)** : Intégration claire et structurée sous « Gestion des Finances » et « Commandes ».

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
│   ├── commerce/
│   │   ├── models.py                   # Order (cycle de vie complet), PaymentTransaction, LigneCommande
│   │   ├── views.py                    # VerifyOrderPaymentView, ManualPaymentConfirmView, AdminCreateOrderView
│   │   ├── services.py                 # reconcile_moneroo_payment, fulfill_credit_order, confirm_manual_payment
│   │   └── tasks.py                    # Tâche périodique d'auto-bascule 24h des pending vers abandoned
│   ├── partners/models.py              # UniversityPaperOrder
│   ├── rights/
│   │   ├── models.py                   # PayoutRequest, AuthorRight, ContratLegal
│   │   └── views.py                    # Endpoints PayoutRequest (validate, reject, kpis)
│   └── reporting/
│       ├── admin_views.py              # AdminSalesListAPIView, AdminGlobalFinanceView, PartnerRoyalties, AccountingLedgerExportView
│       └── urls.py                     # Déclaration des routes REST financières
lahatheque-frontend/
├── app/(dashboard)/admin/
│   ├── orders/page.tsx                 # Gestion des Commandes & Paniers abandonnés (console d'actions, filtres statuts)
│   ├── sales/page.tsx                  # Page Ventes & Revenus (réconciliation dynamique + accordéons)
│   ├── finance/page.tsx                # Page Finances Globales (synthèse 360° multi-flux + table multi-partenaires)
│   ├── royalties/page.tsx              # Page Redevances (épurée des 3 boutons et conditionnée au paiement)
│   └── payouts/page.tsx                # Nouvelle page Demandes de Versement (KPIs + data table + modales)
├── components/
│   ├── dashboard-sidebar.tsx           # Mise à jour du menu "Gestion des Finances" et "Commandes"
│   └── features/admin/
│       ├── order-action-modal.tsx      # Modale d'actions commandes (confirmation manuelle, vérification, relance)
│       ├── payout-validation-modal.tsx # Modale de validation (référence + justificatif facultatif)
│       └── payout-rejection-modal.tsx  # Modale de rejet avec motif obligatoire
├── lib/
│   ├── services/admin.ts               # Fonctions d'appels API BFF (commandes, payouts, sales, finance, exports)
│   └── types/admin.ts                  # Typage TypeScript strict des modèles financiers et statuts de commandes
```

---

## Complexity Tracking

Aucune déviation constitutionnelle requise. L'implémentation réutilise l'architecture éprouvée du projet (BFF Next.js proxy, Django REST Framework, tokens CSS existants).
