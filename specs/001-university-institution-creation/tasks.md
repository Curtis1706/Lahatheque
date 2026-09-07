# Tasks: Création et Rattachement des Universités Partenaires

**Feature**: `001-university-institution-creation`
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Phase 1: Setup & Typage Frontend

**Purpose**: Initialisation des contrats de typage et des fonctions de service client.

- [x] T001 [P] Enrichir les types d'utilisateurs et de payload de création dans lahatheque-frontend/lib/types/admin.ts
- [x] T002 [P] Étendre le service d'administration frontend lahatheque-frontend/lib/services/admin.ts avec la fonction updateAdminUser et le support étendu d'institution dans createAdminUser

---

## Phase 2: Foundational (Backend Transaction & Serializers)

**Purpose**: Socle transactionnel et validation côté serveur requis avant toute interaction d'interface.

- [x] T003 Mettre à jour AdminUserCreateSerializer dans lahatheque-backend/apps/accounts/serializers.py pour valider institution_id et les champs de nouvelle institution (nom, code, pays)
- [x] T004 Mettre à jour AdminUserViewSet.create dans lahatheque-backend/apps/accounts/admin_views.py avec transaction atomique pour créer l'entité Institution si demandée et synchroniser la liaison bidirectionnelle
- [x] T005 Mettre à jour AdminUserViewSet.partial_update dans lahatheque-backend/apps/accounts/admin_views.py pour permettre la réassignation de institution_id et la mise à jour des coordonnées mandataire

---

## Phase 3: User Story 1 & 2 - Création Conjointe ou Rattachement d'Institution (Priority: P1) [MVP]

**Goal**: Permettre à l'administrateur de créer un compte université en le rattachant à une université existante (UAC, UP, UNA, UNSTIM...) OU en créant immédiatement une nouvelle institution partenaire officielle en base de données.

**Independent Test**: Ouvrir la modale d'ajout de compte sur `/admin/users/universities`, créer un compte avec une nouvelle université "Université de Lomé (UL)", vérifier que l'institution est créée en base et liée au compte.

- [x] T006 [US1] Charger dynamiquement la liste des institutions partenaires actives depuis l'API dans lahatheque-frontend/components/features/admin/create-account-modal.tsx
- [x] T007 [US1] Intégrer un commutateur ergonomique (Rattacher à une université existante vs Créer une nouvelle institution partenaire) dans lahatheque-frontend/components/features/admin/create-account-modal.tsx
- [x] T008 [US1] Intégrer les champs de saisie de nouvelle institution (nom officiel, sigle/code, pays) avec validation inline dans lahatheque-frontend/components/features/admin/create-account-modal.tsx
- [x] T009 [US1] Relier la soumission de la modale au service createAdminUser avec transmission des données institutionnelles dans lahatheque-frontend/components/features/admin/create-account-modal.tsx

---

## Phase 4: User Story 3 - Affichage Exhaustif sur le Tableau Administratif (Priority: P2)

**Goal**: Afficher sur la table `/admin/users/universities` le nom complet et le sigle officiel de l'institution liée à chaque compte mandataire.

**Independent Test**: Charger `/admin/users/universities` et vérifier que la colonne Établissement affiche le nom réel de l'Université plutôt qu'un fallback générique.

- [x] T010 [US3] Mettre à jour la colonne Établissement & Contact dans lahatheque-frontend/app/(dashboard)/admin/users/[role]/page.tsx pour afficher le nom officiel de l'institution et son sigle
- [x] T011 [US3] Ajouter un badge d'avertissement visuel "Sans institution liée" pour les comptes orphelins dans lahatheque-frontend/app/(dashboard)/admin/users/[role]/page.tsx

---

## Phase 5: User Story 4 - Modification et Rattachement des Comptes Existants (Priority: P1)

**Goal**: Permettre de régulariser les comptes existants (comme orphelin@test.bj) en leur assignant une institution de la base de données via un bouton d'action d'édition dédié.

**Independent Test**: Cliquer sur l'action d'édition sur la ligne `orphelin@test.bj`, sélectionner "Université de Parakou (UP)", enregistrer et vérifier la mise à jour immédiate.

- [x] T012 [P] [US4] Créer le composant modal d'édition lahatheque-frontend/components/features/admin/edit-university-user-modal.tsx avec sélecteur d'institution et modification des coordonnées
- [x] T013 [US4] Ajouter le bouton d'action d'édition (icône crayon/sliders) sur chaque ligne du rôle université dans lahatheque-frontend/app/(dashboard)/admin/users/[role]/page.tsx
- [x] T014 [US4] Connecter la modale d'édition à updateAdminUser et rafraîchir réactivement le tableau dans lahatheque-frontend/app/(dashboard)/admin/users/[role]/page.tsx

---

## Phase 6: Polish & Validation de Bout en Bout

**Purpose**: Vérifications de qualité, non-régression et exécution des scénarios du quickstart.

- [x] T015 [P] Vérifier la conformité stricte aux 11 principes de la Constitution LAHAThèque (zéro émoji, tokens sémantiques bg-navy/bg-gold, format API standardisé)
- [x] T016 Exécuter le contrôle de typage TypeScript complet via npx tsc --noEmit dans lahatheque-frontend
- [x] T017 Valider les 4 scénarios de test de bout en bout décrits dans specs/001-university-institution-creation/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Démarrage immédiat sans dépendance.
- **Phase 2 (Foundational)**: Dépend de Phase 1. Bloque l'exécution des User Stories.
- **Phase 3 (User Story 1 & 2 - MVP)**: Dépend de Phase 2. Peut démarrer dès que le backend est prêt.
- **Phase 4 (User Story 3)**: Dépend de Phase 2 et Phase 3.
- **Phase 5 (User Story 4)**: Dépend de Phase 2 et Phase 3.
- **Phase 6 (Polish & Validation)**: Dépend de toutes les User Stories précédentes.

### Opportunités de Parallélisation

- `T001` et `T002` (Setup frontend) peuvent s'exécuter en parallèle.
- `T012` (Création du composant modal d'édition) peut être développé en parallèle de `T008`/`T009`.
- `T015` et `T016` peuvent s'exécuter simultanément lors de la phase finale.

---

## Implementation Strategy

### MVP Scope (Phases 1, 2 et 3)
1. Permettre la création d'un compte mandataire avec création/rattachement direct d'institution en base de données.
2. Garantir l'intégrité transactionnelle (aucun compte orphelin).
3. Rendre l'institution immédiatement visible dans le combobox de dépôt d'ouvrages.

### Livrable Complet (Phases 4 et 5)
1. Possibilité d'éditer et régulariser tous les comptes existants (notamment `orphelin@test.bj`).
2. Affichage propre du sigle et de la convention sur le tableau d'administration.

---

## Phase 7: Convergence

**Findings**: 5 gaps identifiés entre le code livré et la spec/constitution après `/speckit-converge` (2026-09-08) — tous résolus.

- [x] T018 Normaliser les réponses HTTP success de `AdminUserManagementViewSet.create` et `partial_update` dans `lahatheque-backend/apps/accounts/admin_views.py` au format canonique `{ "success": true, "data": { "user": ... }, "error": null }` per Constitution IV / FR-004 (partial)
- [x] T019 Retourner une `400` avec `error` explicite et `suggestion_id` de l'institution existante quand le nom d'institution soumis en création est un doublon exact, au lieu de l'auto-suffixe silencieux — dans `create` et `partial_update` de `lahatheque-backend/apps/accounts/admin_views.py` per spec.md Edge Case L81 (missing)
- [x] T020 Créer la route BFF `lahatheque-frontend/app/api/bff/partners/institutions/route.ts` qui proxifie `GET /api/v1/partners/institutions/` avec les cookies `credentials: include` pour alimenter les sélecteurs d'institution dans `create-account-modal.tsx` et `edit-university-user-modal.tsx` per FR-006 (missing)
- [x] T021 Ajouter dans `partial_update` de `lahatheque-backend/apps/accounts/admin_views.py` une validation finale : si le rôle de l'utilisateur est `university` et qu'aucune institution n'est liée après le PATCH, retourner une `400` avec message explicite per SC-001 (partial)
- [x] T022 Délier `institution.user = None` et sauvegarder l'institution avant `user.delete()` dans `AdminUserManagementViewSet.destroy` de `lahatheque-backend/apps/accounts/admin_views.py` pour éviter un FK dangling per spec.md Edge Case L82 (partial)

