# Implementation Plan: Module 6 - Lecteur Heberge Autonome et DRM (Reader)

**Branch**: `006-lecteur-securise-drm-api` | **Date**: 2026-08-18 | **Spec**: [spec.md](spec.md)

---

## 1. Architecture Backend & Stack

- **Applications Django**: `apps/reader/` et `apps/protection/`
- **Dependencies**: `PyMuPDF` (`fitz` pour filigrane visible et invisible), `cryptography` (AES-256-GCM), `ffmpeg-python` (HLS audio), Celery pour webhooks signés HMAC.
- **BFF Next.js / Proxy Django**: Le navigateur requete exclusivement `/api/bff/catalog/books/{id}/stream/` avec Range RFC 7233 -> Django `BookStreamView` -> déchiffrement/dérivé chiffré en cache -> 206 Partial Content.
- **Audit**: Signal ou middleware garantissant l'insertion de chaque requête dans `TraceAcces`.
- **Format JSON unifie**: `{ "success": boolean, "data": object|array, "error": string|null }`.

---

## 2. Structure des Fichiers

```text
lahatheque-backend/
├── apps/
│   ├── reader/
│   │   ├── models/
│   │   │   ├── session.py
│   │   │   └── quiz.py
│   │   ├── views/
│   │   │   ├── session_views.py
│   │   │   ├── progression_views.py
│   │   │   └── quiz_views.py
│   │   ├── services/
│   │   │   ├── session_service.py
│   │   │   └── webhook_dispatcher_service.py
│   │   ├── permissions.py
│   │   └── urls.py
│   └── protection/
│       ├── models/
│       │   ├── config.py
│       │   └── trace.py
│       ├── services/
│       │   ├── encryption_service.py
│       │   ├── watermark_engine.py
│       │   └── derived_materializer.py
│       ├── views/
│       │   ├── stream_views.py      # BookStreamView (Range 206)
│       │   └── text_views.py        # BookTextView (Profil Renforcé)
│       └── urls.py
└── tests/
    ├── reader/
    │   ├── test_session_lifecycle.py
    │   └── test_quiz_webhook.py
    └── protection/
        ├── test_watermark_engine.py
        └── test_stream_range_206.py
```
