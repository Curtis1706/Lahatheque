# Implementation Plan: Module 009 - API Lecteur Heberge & Sessions Multi-Sources

**Feature Directory**: `specs/009-api-lecteur-heberge`  
**Date**: 2026-08-19  
**Status**: Ready for Tasks

---

## 1. Technical Context

- **Backend** : Django 5.x + Django REST Framework (Python 3.12+)
- **Frontend** : Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Moteur d'Ingestion Multi-Sources** : `apps/protection/source_adapter.py` (`DocumentSourceAdapter`) avec support de `catalog_book`, `external_url` (téléchargement et vérification anti-SSRF de documents distants) et `direct_upload`.
- **Authentification** : `django-oauth-toolkit` (OAuth2 Client Credentials) pour les partenaires + Tokens JWT courts pour la page de lecture
- **Stockage & Flux** : Cloudflare R2 (fichiers privés) + Range Requests 206 via le proxy BFF Next.js
- **Lecteur Front-End** : Mode Immersion 3D (`react-pageflip`) + Mode Normal vertical (`@react-pdf-viewer`) + Moteur Audio & TTS (`useAudioPlayer`, Web Speech API) + Module Quiz (`FlipBookQuiz`)
- **Tâches Asynchrones & Webhooks** : Celery + Redis + `requests` avec signature HMAC-SHA256
- **Sécurité & Traçabilité** : Tatouage dynamique PyMuPDF + Audit immuable `TraceAcces`

---

## 2. Constitution Check

- [x] **Principe I & II (Cadrage & Non-dits)** : Analyse exhaustive basée sur `KIT_PORTAGE_LECTEUR/GUIDE_API_LECTEUR.md` avec support de `external_url` (BYOD / Reader-as-a-Service).
- [x] **Principe III (Typage Statique Strict)** : Type Hints stricts sur l'ensemble des modules Django, serializers, services et vues.
- [x] **Principe IV (Format de Réponse Unifié)** : Structure uniforme `{ "success": boolean, "data": {}, "error": null }` respectée sur tous les endpoints REST.
- [x] **Principe V (Performance ORM & N+1)** : UUIDv4 partout, index explicites sur les clés et statuts, usage systématique de `select_related('partner', 'ouvrage', 'end_user')`.
- [x] **Principe VII (Protection DRM & Streaming)** : Aucun PDF brut accessible, téléchargement et impression bloqués, filigrane dynamique nominatif actif sur catalogue et documents distants.
- [x] **Principe VIII (Webhooks Signés & Idempotence)** : Signature HMAC-SHA256, en-tête `X-Lahatheque-Delivery` UUID et politique de retry Celery.
- [x] **Principe X (Zéro Émoji)** : Aucun émoji présent dans le code, la base de données, l'API ou les logs.

---

## 3. Architecture & Séparation des Composants

### Backend (`lahatheque-backend/apps/reader/`)
- `models.py` : `PartnerApp`, `PartnerEndUser`, `ReaderSession` (avec `source_type`, `custom_document_url`, `custom_document_title`, `custom_document_author`, `custom_audio_url`), `ResultatQuizSession`, `WebhookLog`.
- `serializers.py` : Serializers de création de session avec validation croisée `oneOf` (`book_id` ou `document_url` + `document_title`), validation de `return_url`, du `theme`, du `quiz` et des permissions.
- `views.py` : ViewSets pour `/api/v1/reader/sessions/`, validation de token `/api/v1/reader/sessions/validate-token/`, streaming fragmenté branché sur `DocumentSourceAdapter`.
- `services/webhook_dispatcher.py` : Service Celery de signature et d'émission des webhooks HMAC-SHA256.

### Frontend (`lahatheque-frontend/`)
- `app/read/[token]/layout.tsx` : Layout plein écran isolé, sans navigation LAHAThèque, avec injecteur de variables CSS du thème partenaire (`--partner-primary`, `--partner-accent`, etc.).
- `app/read/[token]/page.tsx` : Validation du token, chargement sécurisé du document (interne ou externe), bascule bimodale 3D/Normal, quiz de validation, redirection `return_url`.
- `lib/services/hosted-reader.ts` : Client d'API pour la validation de session et la synchronisation de progression / quiz.
