# Implementation Plan: Module 2 - Gestion des Stocks et Livraisons (Gestionnaire)

**Branch**: `002-gestion-stocks-livraisons` | **Date**: 2026-08-18 | **Spec**: [spec.md](spec.md)

---

## 1. Architecture Backend & Stack

- **Application Django**: `apps/logistics/`
- **Dependencies**: `openpyxl` (export Excel fluide), `reportlab` (export PDF), Celery pour les exports asynchrones volumineux.
- **Transactions & Concurrence**: `@transaction.atomic` et `select_for_update()` dans `StockService.ajuster_stock()` pour eliminer toute survente.
- **Permissions**: `IsGestionnaireOrAdmin` verifiant le role JWT.
- **Format JSON unifie**: `{ "success": boolean, "data": object|array, "error": string|null }`.

---

## 2. Structure Cible des Fichiers

```text
lahatheque-backend/
├── apps/
│   └── logistics/
│       ├── models/
│       │   ├── __init__.py
│       │   ├── entrepot.py
│       │   ├── stock.py
│       │   ├── mouvement.py
│       │   └── expedition.py
│       ├── serializers/
│       │   ├── entrepot_serializer.py
│       │   ├── stock_serializer.py
│       │   ├── mouvement_serializer.py
│       │   └── expedition_serializer.py
│       ├── views/
│       │   ├── stock_views.py
│       │   ├── mouvement_views.py
│       │   ├── expedition_views.py
│       │   └── export_views.py
│       ├── services/
│       │   ├── stock_service.py
│       │   └── export_service.py
│       ├── permissions.py
│       └── urls.py
└── tests/
    └── logistics/
        ├── test_stock_concurrency.py
        ├── test_mouvements.py
        └── test_expeditions.py
```
