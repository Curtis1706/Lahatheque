# Tasks: Module 7 - Assistant Intelligence Artificielle Transverse

**Feature**: `007-assistant-ia-transverse`  
**Status**: Completed  
**Source Métier**: Cahier des charges LAHAThèque v3.2 (Section C & Section 14)

---

## Phase 1 : Services d'Analyse et Modèles Backend (Django)

- [x] **T-701** : Service d'extraction textuelle ciblée `extract_text_sample_from_bytes` via `PyMuPDF` (`fitz`) pour PDF et EPUB.
- [x] **T-702** : Service d'analyse par OpenAI `analyze_document_with_openai` (`apps/ai_engine/services/openai_service.py`) avec `gpt-4o-mini` couvrant tous les genres (Romans, Mangas, BD, Scolaire, Universitaire, Droit OHADA, Économie UEMOA, Médecine, Sciences, etc.).
- [x] **T-703** : Génération automatique de l'arborescence XML standard **ONIX 3.0 Release 3.0** (`generate_onix_3_xml`).
- [x] **T-704** : Mode dégradé heuristique sans crash (`_fallback_heuristic_analysis`).

---

## Phase 2 : Détection d'Incohérences & Endpoints DRF

- [x] **T-705** : Endpoint `POST /api/v1/ai/extract-metadata/` dans `apps/ai_engine/views.py` avec support multipart/form-data et JSON.
- [x] **T-706** : Endpoint `POST /api/v1/ai/check-consistency/` pour la détection d'incohérences entre titre, discipline et faculté.

---

## Phase 3 : Connexion Frontend & Expérience Utilisateur

- [x] **T-707** : Service frontend `lib/services/ai.ts` pour Next.js 16.
- [x] **T-708** : Intégration en direct dans le formulaire de dépôt maquettiste (`/layout-artist/deposits/new`) avec bouton d'auto-complétion en 1 clic.
- [x] **T-709** : Validation `npm run build` et `python manage.py check` avec 0 erreur.
