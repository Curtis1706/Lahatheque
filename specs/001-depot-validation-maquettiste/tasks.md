# Tasks: Module 1 - Depot et Validation du Catalogue (Maquettiste & Chef Maquettiste)

**Branch**: `001-depot-validation-maquettiste` | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

---

## Phase 1: Setup & Infrastructure Partagee

- [ ] T001 Verifier et structurer les sous-dossiers de `lahatheque-backend/apps/catalog/` (`models/`, `serializers/`, `views/`, `services/`)
- [ ] T002 Configurer les permissions personnalisees `IsMaquettiste` et `IsChefMaquettisteOrAdmin` dans `apps/catalog/permissions.py`

---

## Phase 2: Fondations & Modeles de Donnees

- [ ] T003 [P] Implementer le modele `OuvrageDepot` dans `apps/catalog/models/depot.py` (UUIDv4, statut `en_attente`/`valide`/`rejete`, contraintes `check_statut_depot_valide`, indexes)
- [ ] T004 [P] Implementer le modele `FichierAudioOuvrage` dans `apps/catalog/models/audio.py` pour la gestion des pistes MP3/M4B
- [ ] T005 Creer et appliquer les migrations Django (`makemigrations catalog` et `migrate`)

---

## Phase 3: User Story 1 - Depot d'un Ouvrage par le Maquettiste (Priorite: P1 - MVP)

- [ ] T006 [P] [US1] Rediger le test d'integration `tests/catalog/test_depot_creation.py` (doit echouer avant implementation)
- [ ] T007 [US1] Ecrire le serializer `OuvrageDepotSerializer` dans `apps/catalog/serializers/depot_serializer.py` avec validation stricte
- [ ] T008 [US1] Implementer `StorageService` dans `apps/catalog/services/storage_service.py` pour le stockage securise R2 et la verification MIME
- [ ] T009 [US1] Implementer `DepotListCreateView` dans `apps/catalog/views/depot_views.py` (`POST /api/v1/catalog/depots/` et `GET /api/v1/catalog/depots/`) avec format unifie `{ success, data, error }`
- [ ] T010 [US1] Brancher le endpoint IA `POST /api/v1/ai/classify/` dans `apps/ai_engine/views.py`

---

## Phase 4: User Story 2 - Validation et Publication Automatique (Priorite: P1 - MVP)

- [ ] T011 [P] [US2] Rediger le test d'integration `tests/catalog/test_validation_workflow.py`
- [ ] T012 [US2] Implementer `PublicationService.publier_depot()` dans `apps/catalog/services/publication_service.py` avec `@transaction.atomic` (creation de l'entite `Ouvrage`, `ProtectionConfig` et trace d'audit)
- [ ] T013 [US2] Implementer `ValiderDepotView` dans `apps/catalog/views/validation_views.py` (`POST /api/v1/catalog/depots/{id}/valider/`)

---

## Phase 5: User Story 3 - Rejet avec Motif Obligatoire (Priorite: P2)

- [ ] T014 [P] [US3] Rediger le test d'integration `tests/catalog/test_rejet_workflow.py`
- [ ] T015 [US3] Implementer `RejetDepotSerializer` avec validation du motif non vide
- [ ] T016 [US3] Implementer `RejeterDepotView` dans `apps/catalog/views/validation_views.py` (`POST /api/v1/catalog/depots/{id}/rejeter/`)

---

## Phase 6: Qualite, Performance ORM & Verification de Conformite

- [ ] T017 [P] Verifier l'eradication complete des requetes SQL N+1 via `select_related("maquettiste", "validateur")` sur tous les querysets
- [ ] T018 Executer la suite complete de tests Pytest (`pytest tests/catalog/`)
- [ ] T019 Verifier la stricte conformite du format `{ "success": boolean, "data": {}, "error": null }` et l'absence absolue de tout emoji
