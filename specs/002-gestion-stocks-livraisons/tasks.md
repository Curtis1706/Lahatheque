# Tasks: Module 2 - Gestion des Stocks et Livraisons (Gestionnaire)

**Branch**: `002-gestion-stocks-livraisons` | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

---

## Phase 1: Setup & Modeles de Donnees

- [ ] T001 [P] Creer le module `apps/logistics/` et enregistrer l'application dans `config/settings/base.py`
- [ ] T002 [P] Implementer les modeles `Entrepot`, `StockOuvrage`, `MouvementStock`, `ExpeditionCommande`
- [ ] T003 Creer et appliquer les migrations (`makemigrations logistics` et `migrate`)

---

## Phase 2: User Story 1 & 2 - Gestion des Stocks et Reassorts (Priorite: P1 - MVP)

- [ ] T004 [P] [US1] Rediger les tests Pytest de concurrence et verrouillage pessimiste dans `tests/logistics/test_stock_concurrency.py`
- [ ] T005 [US1] Implementer `StockService.ajuster_stock()` avec `@transaction.atomic` et `select_for_update()`
- [ ] T006 [US1] Ecrire les serializers `StockOuvrageSerializer` et `MouvementStockSerializer`
- [ ] T007 [US1] Implementer les vues API `StockListView` et `MouvementStockCreateView` (`POST /api/v1/logistics/mouvements/`)

---

## Phase 3: User Story 3 - Suivi et Expedition des Commandes (Priorite: P1 - MVP)

- [ ] T008 [P] [US3] Rediger les tests d'integration pour l'expedition dans `tests/logistics/test_expeditions.py`
- [ ] T009 [US3] Implementer `ExpeditionUpdateView` (`POST /api/v1/logistics/expeditions/{id}/expedier/`)
- [ ] T010 [US3] Emettre la notification d'expedition au client

---

## Phase 4: User Story 4 - Exports Excel et PDF (Priorite: P2)

- [ ] T011 [US4] Implementer `ExportService.exporter_stock_excel()` avec `openpyxl`
- [ ] T012 [US4] Implementer `ExportService.exporter_stock_pdf()` avec `reportlab`
- [ ] T013 [US4] Implementer `StockExportView` (`GET /api/v1/logistics/stocks/export/`)

---

## Phase 5: Verification & Conformite

- [ ] T014 Verifier l'absence de requete N+1 avec `select_related("ouvrage", "entrepot")`
- [ ] T015 Executer la suite de tests Pytest (`pytest tests/logistics/`)
- [ ] T016 Verifier la stricte conformite du format `{ "success": boolean, "data": {}, "error": null }`
