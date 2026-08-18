# Implementation Plan: Module 4 - Editeurs Tiers et ONIX (Publishers)

**Branch**: `004-depot-editeurs-tiers-onix` | **Date**: 2026-08-18 | **Spec**: [spec.md](spec.md)

---

## 1. Architecture Backend & Stack

- **Application Django**: `apps/publishers/`
- **Dependencies**: `lxml` (parseur XML ONIX 3.0 ultra-rapide), `django-oauth-toolkit` (OAuth 2.0 Client Credentials), Celery pour le traitement en file d'attente des flux volumineux.
- **Stockage**: Cloudflare R2 chiffre pour les fichiers numeriques et couvertures televerses par les editeurs.
- **Permissions**: `IsPublisherUser`, `IsAdminUser`
- **Format JSON unifie**: `{ "success": boolean, "data": object|array, "error": string|null }`.

---

## 2. Structure des Fichiers

```text
lahatheque-backend/
├── apps/
│   └── publishers/
│       ├── models/
│       │   ├── __init__.py
│       │   ├── compte.py
│       │   ├── depot.py
│       │   └── batch.py
│       ├── serializers/
│       │   ├── publisher_depot_serializer.py
│       │   └── batch_serializer.py
│       ├── views/
│       │   ├── depot_views.py
│       │   ├── onix_import_views.py
│       │   └── validation_views.py
│       ├── services/
│       │   ├── onix_parser_service.py
│       │   └── publisher_validation_service.py
│       ├── tasks.py
│       ├── permissions.py
│       └── urls.py
└── tests/
    └── publishers/
        ├── test_onix_parser.py
        ├── test_publisher_depot.py
        └── test_laha_validation.py
```
