# Tâches d'Implémentation : Recherche Full-Text & Pipeline OCR Haute Performance

**Entrées** : Spécifications et documents de conception dans [`specs/016-recherche-fulltext-contrats-ocr/`](./)
**Prérequis** : [`plan.md`](./plan.md), [`spec.md`](./spec.md), [`research.md`](./research.md), [`data-model.md`](./data-model.md), [`contracts/search-api.md`](./contracts/search-api.md)

---

## Phase 1 : Setup (Infrastructure Commune)

**Objectif** : Initialisation des dépendances logicielles d'OCR et de traitement PDF sans bloquer l'environnement.

- [x] T001 Vérifier et déclarer la dépendance `pytesseract` dans `lahatheque-backend/requirements/base.txt`
- [x] T002 [P] Créer le module de service OCR dans `lahatheque-backend/apps/rights/services/ocr_service.py`
- [x] T003 [P] Étendre les interfaces TypeScript des contrats dans `lahatheque-frontend/lib/types/legal.ts`

---

## Phase 2 : Fondations (Prérequis Bloquants)

**Objectif** : Modèle de données, index de base de données GIN et service d'extraction en streaming.

- [x] T004 Étendre le modèle `ContratLegal` avec les champs `indexing_status`, `ocr_engine_used` et `indexed_at` dans `lahatheque-backend/apps/rights/models.py`
- [x] T005 [P] Ajouter l'index PostgreSQL GIN sur le vecteur de recherche plein texte dans `lahatheque-backend/apps/rights/models.py`
- [x] T006 Générer et appliquer la migration Django correspondante dans `lahatheque-backend/apps/rights/migrations/`
- [x] T007 Implémenter l'extraction de texte en streaming page par page dans `lahatheque-backend/apps/rights/services/ocr_service.py`

---

## Phase 3 : User Story 1 - Recherche plein texte PDF natifs (Priorité : P1) 🎯 MVP

**Objectif** : Permettre la recherche instantanée de tout mot-clé ou clause dans les PDF informatiques natifs.
**Critère de validation indépendant** : Un document PDF contenant une clause textuelle rare ressort immédiatement avec son extrait en recherchant ce terme.

- [x] T008 [P] [US1] Implémenter le service de requête FTS hybride dans `lahatheque-backend/apps/rights/services/search_service.py`
- [x] T009 [US1] Brancher la recherche plein texte et le calcul de pertinence dans `LegalContractsListView.get` dans `lahatheque-backend/apps/rights/views.py`
- [x] T010 [US1] Mettre à jour `LegalContractSerializer` pour exposer le snippet de contexte et le statut d'indexation dans `lahatheque-backend/apps/rights/serializers.py`
- [x] T011 [US1] Intégrer l'affichage de l'extrait en surbrillance dans le tableau des contrats dans `lahatheque-frontend/app/(dashboard)/legal-reviewer/contracts/page.tsx`

---

## Phase 4 : User Story 2 - Pipeline OCR pour contrats scannés / images (Priorité : P1)

**Objectif** : Reconnaissance optique automatique des documents physiques scannés sans blocage de l'interface.
**Critère de validation indépendant** : Un scan d'acte ou de convention sans texte sélectionnable est retranscrit en tâche de fond et devient recherchable.

- [x] T012 [P] [US2] Implémenter la détection de document scanné (< 50 caractères natifs) dans `lahatheque-backend/apps/rights/services/ocr_service.py`
- [x] T013 [US2] Créer la tâche asynchrone d'exécution OCR non-bloquante dans `lahatheque-backend/apps/rights/tasks/ocr_tasks.py`
- [x] T014 [US2] Connecter le déclenchement de la tâche de fond après téléversement dans `LegalContractsListView.post` dans `lahatheque-backend/apps/rights/views.py`
- [x] T015 [US2] Créer l'endpoint de réindexation manuelle de secours `ContractReindexView` dans `lahatheque-backend/apps/rights/views.py`
- [x] T016 [US2] Ajouter le badge d'état d'indexation (*Indexé*, *Analyse OCR en cours*) sur les cartes et lignes dans `lahatheque-frontend/app/(dashboard)/legal-reviewer/contracts/page.tsx`

---

## Phase 5 : User Story 3 - Filtrage multicritère combiné et acronymes (Priorité : P2)

**Objectif** : Garantir que les sigles d'universités (UNSTIM, UAC) et les numéros de référence partiels ne soient jamais exclus par le FTS.
**Critère de validation indépendant** : La recherche "UNSTIM" combinée au filtre "Universités" retourne les résultats sous 100ms.

- [x] T017 [P] [US3] Intégrer le fallback insensible aux acronymes (`unaccent` + `icontains`) dans `lahatheque-backend/apps/rights/services/search_service.py`
- [x] T018 [US3] Optimiser le composant barre de recherche avec debounce anti-rebond (300ms) dans `lahatheque-frontend/components/features/legal/contract-search-bar.tsx`
- [x] T019 [US3] Synchroniser les filtres de catégories et de statuts avec la recherche FTS dans `lahatheque-frontend/lib/services/legal.ts`

---

## Phase 6 : Finitions, Performance & Zéro Régression

**Objectif** : Validation rigoureuse de la non-régression, du respect des quotas de mémoire et des temps de réponse.

- [x] T020 Configurer la mise en cache mémoire (Redis / Django cache 60s) des requêtes de recherche fréquentes dans `lahatheque-backend/apps/rights/services/search_service.py`
- [x] T021 [P] Valider la compilation stricte TypeScript via `npx tsc --noEmit` sur `lahatheque-frontend`
- [x] T022 [P] Valider la compilation Python via `python -m py_compile` sur les fichiers backend modifiés
- [x] T023 Exécuter les 3 scénarios de validation de bout en bout du guide `quickstart.md`

---

## Dépendances & Ordre d'Exécution

```text
[Phase 1: Setup] ──► [Phase 2: Fondations GIN & Modèle]
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
[Phase 3: US1 - Plein texte PDF natif]          [Phase 4: US2 - Pipeline OCR Scans]
         │                                                 │
         └────────────────────────┬────────────────────────┘
                                  ▼
                    [Phase 5: US3 - Filtres & Acronymes]
                                  │
                                  ▼
                    [Phase 6: Finitions & Performance]
```
