# Tasks: Module 6 - Lecteur Heberge Autonome et DRM (Reader)

**Branch**: `006-lecteur-securise-drm-api` | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

---

## Phase 1: Setup & Modeles

- [ ] T001 [P] Creer/structurer `apps/reader/` et `apps/protection/`
- [ ] T002 [P] Implementer les modeles `ProtectionConfig`, `SessionLectureSecurisee`, `TraceAcces`, `ResultatQuizSession`
- [ ] T003 Creer et appliquer les migrations (`makemigrations reader protection` et `migrate`)

---

## Phase 2: User Story 1 - Moteur de Chiffrement, Filigrane et Streaming 206 (Priorite: P1 - MVP)

- [ ] T004 [P] [US1] Rediger les tests Pytest de streaming Range 206 et filigrane dans `tests/protection/test_stream_range_206.py`
- [ ] T005 [US1] Implementer `EncryptionService` (AES-256-GCM) pour Cloudflare R2
- [ ] T006 [US1] Implementer `WatermarkEngine` (PyMuPDF - filigrane visible parametrable et tatouage invisible)
- [ ] T007 [US1] Implementer `DerivedMaterializerService` pour generer et cacher le derive propre a `(user, book, config)`
- [ ] T008 [US1] Implementer `BookStreamView` dans `apps/protection/views/stream_views.py` avec Range RFC 7233 et insertion dans `TraceAcces`

---

## Phase 3: User Story 3 - Sessions API Partenaires, Quiz et Webhooks (Priorite: P1 - MVP)

- [ ] T009 [P] [US3] Rediger les tests d'integration pour le cycle de session et quiz dans `tests/reader/test_session_lifecycle.py`
- [ ] T010 [US3] Implementer `SessionCreateView` (`POST /api/v1/reader/sessions/`) avec personnalisation de theme et quiz
- [ ] T011 [US3] Implementer `ProgressionSyncView` et `QuizSubmitView` (`POST /api/v1/reader/sessions/{token}/quiz/submit/`)
- [ ] T012 [US3] Implementer `WebhookDispatcherService` avec signature HMAC-SHA256 et idempotence `X-Lahatheque-Delivery`

---

## Phase 4: Audio HLS et Profil Renforce

- [ ] T013 [US1] Implementer le pipeline HLS audio (`ffmpeg`)
- [ ] T014 [US1] Implementer `BookTextView` pour le service de texte securise page par page en profil Renforce

---

## Phase 5: Verification & Conformite

- [ ] T015 Verifier qu'aucun octet clair ou URL R2 brute ne fuit vers le client
- [ ] T016 Executer la suite de tests Pytest (`pytest tests/protection/ tests/reader/`)
- [ ] T017 Verifier la stricte conformite du format `{ "success": boolean, "data": {}, "error": null }`
