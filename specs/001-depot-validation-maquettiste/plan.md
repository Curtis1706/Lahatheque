# Implementation Plan: Module 1 - Depot et Validation du Catalogue (Maquettiste & Chef Maquettiste)

**Branch**: `001-depot-validation-maquettiste` | **Date**: 2026-08-18 | **Spec**: [spec.md](spec.md)

---

## 1. Summary

Implementation du pipeline complet de gestion du cycle de vie des maquettes d'ouvrages :
- Depot securise des fichiers (PDF/EPUB/Audio/Couverture) avec chiffrement au repos AES-256-GCM sur Cloudflare R2.
- Assistant IA pour la classification automatique (discipline, langue, pays, universite, faculte, resume).
- Workflow de validation et publication atomique par le Chef Maquettiste (mise en ligne vitrine + creation `ProtectionConfig`).
- Workflow de rejet avec motif obligatoire.
- Respect strict du standard DRM, du format JSON unifie `{ success, data, error }`, zero requete N+1 et zero emoji.

---

## 2. Technical Context & Stack

- **Backend Framework**: Django 5.x & Django REST Framework (Python 3.12+)
- **Base de Donnees**: PostgreSQL (UUIDv4, `db_index=True`, `Meta.constraints`)
- **Stockage Cloud**: Cloudflare R2 prive (chiffrement AES-256-GCM, jamais d'URL publique)
- **Traitement Asynchrone**: Celery + Redis pour generation de derives et notifications
- **Testing**: `pytest-django`, `APITestCase`, `factory_boy`
- **Securite & Auth**: Cookies `HttpOnly`, `SameSite='Lax'`, `CORS_ALLOW_CREDENTIALS = True`, `CSRF_TRUSTED_ORIGINS`

---

## 3. Constitution Check (10 Gates)

- [x] **I. Cadrage Metier & Documentation** : Conforme au cahier des charges section 2 et `docs/drm/`.
- [x] **II. Traque des Non-Dits & Scalabilite** : Non-dits adresses (MIME types, quotas, verrouillage optimiste, timeout IA).
- [x] **III. PEP 8 & Typage Statique** : Type Hints stricts sur 100% du code.
- [x] **IV. Format JSON Unifie** : `{ "success": boolean, "data": object|array, "error": string|null }`.
- [x] **V. Performance ORM** : UUIDv4, `select_related("maquettiste", "validateur")`, contraintes d'integrite.
- [x] **VI. Securite & Cookies** : Tokens JWT en cookies HttpOnly, pas de token dans le body JSON.
- [x] **VII. Protection DRM** : Chiffrement R2 AES-256-GCM, streaming 206, audit `TraceAcces`.
- [x] **VIII. Webhooks & Idempotence** : Celery, signature HMAC-SHA256, `event_id`.
- [x] **IX. Code Commente** : Docstrings exhaustives et explications techniques.
- [x] **X. Zero Emoji** : Aucun emoji dans le code, la documentation ou les messages.

---

## 4. Structure du Code Source Cible

```text
lahatheque-backend/
├── apps/
│   ├── catalog/
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── depot.py             # OuvrageDepot
│   │   │   ├── audio.py             # FichierAudioOuvrage
│   │   │   └── book.py              # Ouvrage (vitrine)
│   │   ├── serializers/
│   │   │   ├── __init__.py
│   │   │   ├── depot_serializer.py  # Creation et lecture detaillee
│   │   │   └── validation_serializer.py
│   │   ├── views/
│   │   │   ├── __init__.py
│   │   │   ├── depot_views.py       # DepotListCreateView, DepotDetailView
│   │   │   └── validation_views.py  # ValiderDepotView, RejeterDepotView
│   │   ├── permissions.py           # IsMaquettiste, IsChefMaquettisteOrAdmin
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── storage_service.py   # Upload & verification MIME Cloudflare R2
│   │   │   └── publication_service.py # Publication atomique sur vitrine
│   │   └── urls.py                  # Routage /api/v1/catalog/...
│   └── ai_engine/
│       ├── services/
│       │   └── classification_service.py # Classification IA transverse
│       └── views.py                 # POST /api/v1/ai/classify/
└── tests/
    └── catalog/
        ├── test_depot_models.py
        ├── test_depot_views.py
        └── test_validation_workflow.py
```
