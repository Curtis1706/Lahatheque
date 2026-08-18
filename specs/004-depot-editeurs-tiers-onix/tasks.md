# Tasks: Module 4 - Editeurs Tiers et ONIX (Publishers)

**Branch**: `004-depot-editeurs-tiers-onix` | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

---

## Phase 1: Setup & Modeles

- [ ] T001 [P] Creer le module `apps/publishers/` et enregistrer l'application dans `config/settings/base.py`
- [ ] T002 [P] Implementer les modeles `CompteEditeurTiers`, `DepotEditeurTiers`, `ImportBatchLog`
- [ ] T003 Creer et appliquer les migrations (`makemigrations publishers` et `migrate`)

---

## Phase 2: User Story 1 - Parseur et Import ONIX 3.0 (Priorite: P1 - MVP)

- [ ] T004 [P] [US1] Rediger les tests Pytest de parsing ONIX dans `tests/publishers/test_onix_parser.py`
- [ ] T005 [US1] Implementer `OnixParserService` (`lxml`) validant les balises `Product`, `DescriptiveDetail`, `Price`
- [ ] T006 [US1] Implementer la tache Celery d'import asynchrone `process_onix_import_task`
- [ ] T007 [US1] Implementer la vue `OnixImportUploadView` (`POST /api/v1/publishers/imports/onix/`)

---

## Phase 3: User Story 2 - API REST Editeur Tiers (Priorite: P1 - MVP)

- [ ] T008 [P] [US2] Configurer l'authentification OAuth2 Client Credentials
- [ ] T009 [US2] Ecrire `PublisherDepotSerializer` avec validation des prix par devise
- [ ] T010 [US2] Implementer `PublisherDepotCreateView` (`POST /api/v1/publishers/depots/`)

---

## Phase 4: User Story 3 - Validation et Publication par l'equipe LAHA (Priorite: P1 - MVP)

- [ ] T011 [P] [US3] Rediger les tests Pytest du workflow de validation dans `tests/publishers/test_laha_validation.py`
- [ ] T012 [US3] Implementer `PublisherValidationService.valider_et_publier()` avec transaction atomique
- [ ] T013 [US3] Implementer `LahaValidationView` (`POST /api/v1/publishers/depots/{id}/valider/` et `.../demande-correction/`)

---

## Phase 5: Verification & Conformite

- [ ] T014 Verifier l'absence de requete N+1 avec `select_related("editeur", "ouvrage_publie")`
- [ ] T015 Executer la suite de tests Pytest (`pytest tests/publishers/`)
- [ ] T016 Verifier la stricte conformite du format `{ "success": boolean, "data": {}, "error": null }`
