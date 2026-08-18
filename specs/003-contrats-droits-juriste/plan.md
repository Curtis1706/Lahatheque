# Implementation Plan: Module 3 - Contrats, Droits d'Auteur et Relances (Juriste)

**Branch**: `003-contrats-droits-juriste` | **Date**: 2026-08-18 | **Spec**: [spec.md](spec.md)

---

## 1. Architecture Backend & Stack

- **Application Django**: `apps/legal/`
- **Dependencies**: PostgreSQL Full Text Search (`django.contrib.postgres.search`), `pypdf` (extraction texte PDF), `python-docx` (extraction Word), Celery beat pour taches planifiees nocturnes de relance.
- **Securite**: Chiffrement au repos sur Cloudflare R2 prive des documents legaux.
- **Permissions**: `IsJuristeOrAdmin`
- **Format JSON unifie**: `{ "success": boolean, "data": object|array, "error": string|null }`.

---

## 2. Structure des Fichiers

```text
lahatheque-backend/
├── apps/
│   └── legal/
│       ├── models/
│       │   ├── __init__.py
│       │   ├── contrat.py
│       │   ├── repartition.py
│       │   ├── pre_edition.py
│       │   └── relance.py
│       ├── serializers/
│       │   ├── contrat_serializer.py
│       │   ├── repartition_serializer.py
│       │   └── pre_edition_serializer.py
│       ├── views/
│       │   ├── contrat_views.py
│       │   ├── repartition_views.py
│       │   └── relance_views.py
│       ├── services/
│       │   ├── text_extractor_service.py
│       │   └── relance_engine_service.py
│       ├── tasks.py             # Taches Celery planifiees
│       ├── permissions.py
│       └── urls.py
└── tests/
    └── legal/
        ├── test_contrat_search.py
        ├── test_repartition_validation.py
        └── test_relances.py
```
