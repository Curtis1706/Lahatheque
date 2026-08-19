# Tasks: Module 009 - API Lecteur Heberge & Sessions Multi-Sources (Catalogue & SaaS Tiers)

**Feature Directory**: `specs/009-api-lecteur-heberge`  
**Spec File**: `specs/009-api-lecteur-heberge/spec.md`  
**Plan File**: `specs/009-api-lecteur-heberge/plan.md`  
**Data Model**: `specs/009-api-lecteur-heberge/data-model.md`  
**Status**: Implemented

---

## Phase 1: Setup & Data Model (Backend Django)

- [X] T001 [P] Creer les modeles `PartnerApp`, `PartnerEndUser`, `ReaderSession` (avec support de `source_type`, `custom_document_url`, `custom_document_title`, `custom_document_author`, `custom_audio_url`), `ResultatQuizSession`, `WebhookLog` dans `lahatheque-backend/apps/reader/models.py`
- [X] T002 Generer et appliquer les migrations Django pour l'application reader dans `lahatheque-backend/apps/reader/migrations/`
- [X] T003 [P] Enregistrer les modeles de l'application reader dans l'administration Django `lahatheque-backend/apps/reader/admin.py`

---

## Phase 2: Foundational Infrastructure (OAuth2 & Ingestion Multi-Sources)

- [X] T004 Configurer l'authentification machine-to-machine OAuth2 Client Credentials dans `lahatheque-backend/apps/reader/oauth.py`
- [X] T005 [P] Brancher `DocumentSourceAdapter` (`apps/protection/source_adapter.py`) pour normaliser les documents externes `external_url` et du catalogue `catalog_book` dans `lahatheque-backend/apps/reader/services/source_service.py`
- [X] T006 [P] Implementer le generateur et validateur de tokens JWT de session ephemere dans `lahatheque-backend/apps/reader/tokens.py`
- [X] T007 [P] Definir les permissions `IsValidReaderSession` et `IsAuthenticatedPartner` dans `lahatheque-backend/apps/reader/permissions.py`

---

## Phase 3: User Story 1 & 2 - Creation de Session Catalogue et Documents Externes SaaS (P1 - MVP)

- [X] T008 [P] [US1] Implementer les serializers de validation `ReaderSessionCreateSerializer` (support `oneOf` pour `book_id` ou `document_url` + `document_title`, validation anti-SSRF, validation `return_url`, `theme`, `quiz`) dans `lahatheque-backend/apps/reader/serializers.py`
- [X] T009 [US1] Implementer la vue de creation de session `POST /api/v1/reader/sessions/` retournant `session_id`, `reader_url` et `expires_at` dans `lahatheque-backend/apps/reader/views.py`
- [X] T010 [US1] Implementer la vue de validation de token pour le front-end `POST /api/v1/reader/sessions/validate-token/` dans `lahatheque-backend/apps/reader/views.py`
- [X] T011 [P] [US1] Declarer les routes d'API sessions dans `lahatheque-backend/apps/reader/urls.py`

---

## Phase 4: User Story 3 - Page Hebergee Autonome `/read/[token]` (P1 - MVP)

- [X] T012 [P] [US3] Creer le service client d'API de lecture hebergee dans `lahatheque-frontend/lib/services/hosted-reader.ts`
- [X] T013 [P] [US3] Creer le layout plein ecran sans barre de navigation publique avec injecteur de variables CSS du theme dans `lahatheque-frontend/app/read/[token]/layout.tsx`
- [X] T014 [US3] Implementer la page de lecture hebergee `/read/[token]` avec validation de token, montage de `ReaderSecurity`, et support des documents catalogue et externes dans `lahatheque-frontend/app/read/[token]/page.tsx`
- [X] T015 [US3] Integrer le double moteur bimodal (Mode Immersion 3D `FlipBookReader` + Mode Normal `@react-pdf-viewer`) avec filigrane nominatif dynamique et bouton Quitter vers `return_url` dans `lahatheque-frontend/app/read/[token]/page.tsx`

---

## Phase 5: User Story 4 - Module Quiz Dynamique et Webhooks Signes HMAC (P2)

- [X] T016 [P] [US4] Implementer le service de dispatching de webhooks Celery avec signature `HMAC-SHA256` et gestion de backoff dans `lahatheque-backend/apps/reader/tasks.py`
- [X] T017 [US4] Implementer l'endpoint de soumission de quiz `POST /api/v1/reader/sessions/quiz-submit/` avec calcul du score et emission du webhook `reader.quiz.completed` dans `lahatheque-backend/apps/reader/views.py`
- [X] T018 [US4] Integrer le composant `FlipBookQuiz` avec les questions injectees par l'API sur `/read/[token]` dans `lahatheque-frontend/app/read/[token]/page.tsx`
- [X] T019 [P] [US4] Implementer la synchronisation de progression `POST /api/v1/reader/sessions/progress/` avec emission du webhook `reader.progress.updated` dans `lahatheque-backend/apps/reader/views.py`

---

## Phase 6: User Story 5 - Polling, Supervision et Revocation de Session (P2)

- [X] T020 [P] [US5] Implementer l'endpoint de consultation d'etat `GET /api/v1/reader/sessions/[id]/` dans `lahatheque-backend/apps/reader/views.py`
- [X] T021 [US5] Implementer l'endpoint de revocation immediate `DELETE /api/v1/reader/sessions/[id]/` dans `lahatheque-backend/apps/reader/views.py`
- [X] T022 [US5] Creer la page de gestion des sessions et applications partenaires dans le dashboard administrateur `lahatheque-frontend/app/(dashboard)/admin/api/sessions/page.tsx`

---

## Phase 7: Polish, Robustesse & Tests

- [X] T023 [P] Executer les tests unitaires couvrant la creation de session externe/interne et la validation dans `lahatheque-backend/apps/reader/tests.py`
- [X] T024 Valider la compilation globale du front-end avec `pnpm build` et tester le scenario complet du `quickstart.md`
