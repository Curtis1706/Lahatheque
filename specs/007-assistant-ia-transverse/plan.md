# Implementation Plan: Module 7 - Assistant IA Transverse (AI Engine)

**Branch**: `007-assistant-ia-transverse` | **Date**: 2026-08-18 | **Spec**: [spec.md](spec.md)

---

## 1. Architecture Backend & Stack

- **Application Django**: `apps/ai_engine/`
- **Dependencies**: `python-docx` (export Word), `pypdf` (extraction texte), client LLM abstrait (connecteur Gemini API / Ollama / OpenAI interchangeable).
- **Resilience**: Mode degrade avec timeout strict (5000 ms) et cache SHA-256 local.
- **Format JSON unifie**: `{ "success": boolean, "data": object|array, "error": string|null }`.

---

## 2. Structure des Fichiers

```text
lahatheque-backend/
├── apps/
│   └── ai_engine/
│       ├── models/
│       │   ├── __init__.py
│       │   ├── cache.py
│       │   └── log.py
│       ├── serializers/
│       │   └── ai_serializers.py
│       ├── views/
│       │   ├── classify_views.py
│       │   └── docx_views.py
│       ├── services/
│       │   ├── llm_connector.py
│       │   ├── classification_service.py
│       │   └── docx_export_service.py
│       ├── permissions.py
│       └── urls.py
└── tests/
    └── ai_engine/
        ├── test_classification.py
        ├── test_docx_export.py
        └── test_fallback_resilience.py
```
