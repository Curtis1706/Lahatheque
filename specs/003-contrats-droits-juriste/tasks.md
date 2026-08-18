# Tasks: Module 3 - Contrats, Droits d'Auteur et Relances (Juriste)

**Branch**: `003-contrats-droits-juriste` | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

---

## Phase 1: Setup & Modeles

- [ ] T001 [P] Creer le module `apps/legal/` et enregistrer l'application dans `config/settings/base.py`
- [ ] T002 [P] Implementer les modeles `ContratLegal`, `RepartitionDroits`, `PreEditionDossier`, `RelanceEmailJournal`
- [ ] T003 Creer et appliquer les migrations (`makemigrations legal` et `migrate`)

---

## Phase 2: User Story 1 - Indexation et Recherche FTS (Priorite: P1 - MVP)

- [ ] T004 [P] [US1] Rediger les tests Pytest de recherche plein texte dans `tests/legal/test_contrat_search.py`
- [ ] T005 [US1] Implementer `TextExtractorService` pour PDF (`pypdf`) et Word (`python-docx`)
- [ ] T006 [US1] Ecrire le serializer `ContratLegalSerializer` avec extraction automatique a l'upload
- [ ] T007 [US1] Implementer la vue `ContratListCreateView` avec filtre FTS (`GET /api/v1/legal/contrats/?q=...`)

---

## Phase 3: User Story 2 - Attribution et Verrouillage des Droits (Priorite: P1 - MVP)

- [ ] T008 [P] [US2] Rediger les tests d'integration pour la validation de somme 100% dans `tests/legal/test_repartition_validation.py`
- [ ] T009 [US2] Ecrire `RepartitionDroitsBatchSerializer` validant que la somme des droits est strictement egale a 100.00%
- [ ] T010 [US2] Implementer `RepartitionDroitsUpdateView` (`POST /api/v1/legal/repartitions/`)

---

## Phase 4: User Story 4 - Moteur de Relances Automatiques (Priorite: P1 - MVP)

- [ ] T011 [P] [US4] Rediger les tests Pytest pour les relances dans `tests/legal/test_relances.py`
- [ ] T012 [US4] Implementer `RelanceEngineService` et la tache Celery `apps/legal/tasks.py` (relance impayes et rapports auteurs)
- [ ] T013 [US4] Implementer `RelanceJournalListView` (`GET /api/v1/legal/relances/`)

---

## Phase 5: Verification & Conformite

- [ ] T014 Verifier l'absence de requete N+1 avec `select_related("ouvrage", "beneficiaire", "destinataire")`
- [ ] T015 Executer la suite de tests Pytest (`pytest tests/legal/`)
- [ ] T016 Verifier la stricte conformite du format `{ "success": boolean, "data": {}, "error": null }`
