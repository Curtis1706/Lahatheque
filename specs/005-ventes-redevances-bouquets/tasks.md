# Tasks: Module 5 - Ventes, Redevances et Bouquets (Finance)

**Branch**: `005-ventes-redevances-bouquets` | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

---

## Phase 1: Setup & Modeles

- [ ] T001 [P] Creer le module `apps/finance/` et enregistrer l'application dans `config/settings/base.py`
- [ ] T002 [P] Implementer les modeles `VenteTransaction`, `BouquetDocumentaire`, `MetriqueUsageLivre`, `RedevanceUniversite` avec devises locales (`XOF`, `XAF`, `CDF`, `USD`)
- [ ] T003 Creer et appliquer les migrations (`makemigrations finance` et `migrate`)

---

## Phase 2: User Story 1 - Calcul de la Redevance Universitaire de 15% (Priorite: P1 - MVP)

- [ ] T004 [P] [US1] Rediger les tests Pytest pour la redevance automatique 15% (UAC, UNA, Parakou, UCAD) dans `tests/finance/test_redevance_universite.py`
- [ ] T005 [US1] Implementer `RedevanceCalculatorService.calculer_vente_unitaire()`
- [ ] T006 [US1] Brancher le calcul lors de la validation du paiement Mobile Money ou Carte (`orders/services.py`)

---

## Phase 3: User Story 2 - Ventilation des Bouquets a l'Usage (Priorite: P1 - MVP)

- [ ] T007 [P] [US2] Rediger les tests d'integration reproduisant au Franc CFA pres l'exemple a 10 000 000 XOF du cahier des charges dans `tests/finance/test_bouquet_distribution.py`
- [ ] T008 [US2] Implementer `BouquetDistributionService.calculer_distribution_bouquet()`
- [ ] T009 [US2] Implementer la tache Celery `compute_bouquet_revenue_distribution` dans `apps/finance/tasks.py`

---

## Phase 4: User Story 3 - Tableaux de Bord Financiers (Priorite: P1 - MVP)

- [ ] T010 [P] [US3] Ecrire les serializers de reporting financier multi-devises (`UniversiteDashboardSerializer`, `AuteurDashboardSerializer`)
- [ ] T011 [US3] Implementer `FinanceDashboardView` (`GET /api/v1/finance/dashboard/`) avec filtres par pays africains, universite et periode
- [ ] T012 [US3] Implementer les exports de releves financiers en PDF (`reportlab`) et Excel (`openpyxl`)

---

## Phase 5: Verification & Conformite

- [ ] T013 Verifier l'absence de requete N+1 avec `select_related("client", "ouvrage", "bouquet")`
- [ ] T014 Executer la suite de tests Pytest (`pytest tests/finance/`)
- [ ] T015 Verifier la stricte conformite du format `{ "success": boolean, "data": {}, "error": null }`
