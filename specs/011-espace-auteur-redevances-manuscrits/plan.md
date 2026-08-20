# Implementation Plan: Module 011 — Espace Auteur, Redevances & Dépôts de Manuscrits

## 1. Architecture Backend (Django DRF)

- **Application `apps/rights`** :
  - Modèle `PayoutRequest` : `id (UUID)`, `author (User)`, `amount (Decimal)`, `payment_method (momo/moov/orange/wave/bank)`, `account_details (String)`, `status (pending/approved/rejected/processed)`, `admin_notes (Text)`, `transaction_reference (String)`, `created_at`, `processed_at`, `processed_by (User)`.
  - Vues DRF :
    - `AuthorDashboardKPIsView` (`GET /api/v1/rights/author/kpis/`)
    - `AuthorBooksListView` (`GET /api/v1/rights/author/books/`)
    - `AuthorBookDetailView` (`GET /api/v1/rights/author/books/<id>/`)
    - `AuthorRoyaltiesStatementsView` (`GET /api/v1/rights/author/royalties/`)
    - `AuthorPayoutRequestView` (`GET / POST /api/v1/rights/author/payout-request/`)
    - `AdminAuthorPayoutsViewSet` (`GET / PATCH /api/v1/rights/admin/payouts/<id>/approve/` & `reject/`)
    - `AuthorSubmissionsView` (`GET / POST /api/v1/rights/author/submissions/`)

## 2. Architecture Frontend (Next.js 16 App Router)

- **Service Frontend (`lib/services/author.ts`)** :
  - Connecté à 100% sur `/api/bff/rights/author/...` sans aucun import de données mockées.
- **Pages & Composants (`app/(dashboard)/author/`)** :
  - `page.tsx` : Dashboard KPIs réels, graphiques sparklines dynamiques avec `ProgressMetricCard`.
  - `books/page.tsx` & `books/[id]/page.tsx` : Liste et statistiques par format/pays.
  - `royalties/page.tsx` & `royalties/[id]/page.tsx` : Relevés certifiés, modale de retrait MoMo/Banque, audit des versements passés.
  - `submissions/page.tsx`, `submissions/new/page.tsx` & `submissions/[id]/page.tsx` : Circuit 2 étapes avec IA PyMuPDF.
  - `profile/page.tsx` : Profil, coordonnées financières et changement de mot de passe.
