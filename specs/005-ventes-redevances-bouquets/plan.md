# Implementation Plan: Module 5 - Ventes, Redevances et Bouquets (Finance)

**Branch**: `005-ventes-redevances-bouquets` | **Date**: 2026-08-18 | **Spec**: [spec.md](spec.md)

---

## 1. Architecture Backend & Stack

- **Application Django**: `apps/finance/`
- **Calculs Financiers**: Moteur decimal haute precision (`decimal.Decimal`), sans flottants (`float`) pour eliminer les erreurs d'arrondi.
- **Taches Celery**:
  - `aggregate_monthly_usage_metrics` : Agregation periodique des traces d'usage des lecteurs.
  - `compute_bouquet_revenue_distribution` : Ventilation mathematique des revenus de bouquets et application des 15% de redevance universitaire.
- **Permissions**: `IsAdminUser`, `IsUniversityPartner`, `IsAuthorUser`, `IsPublisherUser`
- **Format JSON unifie**: `{ "success": boolean, "data": object|array, "error": string|null }`.

---

## 2. Structure des Fichiers

```text
lahatheque-backend/
├── apps/
│   └── finance/
│       ├── models/
│       │   ├── __init__.py
│       │   ├── vente.py
│       │   ├── bouquet.py
│       │   ├── metrique.py
│       │   └── redevance.py
│       ├── serializers/
│       │   ├── vente_serializer.py
│       │   ├── bouquet_serializer.py
│       │   └── redevance_serializer.py
│       ├── views/
│       │   ├── vente_views.py
│       │   ├── bouquet_views.py
│       │   ├── dashboard_views.py
│       │   └── export_comptable_views.py
│       ├── services/
│       │   ├── redevance_calculator_service.py
│       │   └── bouquet_distribution_service.py
│       ├── tasks.py
│       ├── permissions.py
│       └── urls.py
└── tests/
    └── finance/
        ├── test_redevance_universite.py
        ├── test_bouquet_distribution.py
        └── test_dashboard_stats.py
```
