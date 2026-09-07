# Tasks: Harmonisation Universelle du PhoneInput

**Feature**: `018-harmonisation-phone-input`
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

---

## Phase 1: Setup (Shared Contracts & Types)

**Purpose**: Initialisation des contrats TypeScript et props de formulaire du composant téléphonique

- [x] T001 [P] Définir et exporter l'interface complète `PhoneInputProps` avec `id`, `name`, `placeholder`, `disabled`, `required`, `className` dans `lahatheque-frontend/components/ui/phone-input.tsx`

---

## Phase 2: Foundational (Enrichissement du Composant Central)

**Purpose**: Socle technique du composant `PhoneInput` avant déploiement dans les formulaires

**CRITICAL**: Le composant `PhoneInput` doit être pleinement enrichi et résilient avant son intégration dans les pages et modales

- [x] T002 Enrichir `PhoneInput` pour intégrer les props HTML standard (`id`, `name`, `placeholder`, `required`, `disabled`) sur l'input interne dans `lahatheque-frontend/components/ui/phone-input.tsx`
- [x] T003 Implémenter l'extraction et la sélection automatique du pays lors du collage ou du pré-remplissage d'un numéro international avec indicatif dans `lahatheque-frontend/components/ui/phone-input.tsx`
- [x] T004 Sécuriser le chargement asynchrone des pays actifs avec `getCountries(true)` et le repli silencieux et immédiat sur `AFRICAN_COUNTRIES_PRESET` dans `lahatheque-frontend/components/ui/phone-input.tsx`

**Checkpoint**: Composant `PhoneInput` polyvalent, testé et prêt pour l'intégration dans tous les formulaires.

---

## Phase 3: User Story 1 - Remplacement dans les Formulaires Métier (Priority: P1) [MVP]

**Goal**: Remplacer tous les champs de saisie manuelle `<input type="tel">` et `<input type="text">` bruts par le composant unifié `PhoneInput`.

**Independent Test**: Ouvrir chacun des 4 formulaires/modales cibles, constater la présence du drapeau, de l'indicatif et la bonne sauvegarde de la valeur téléphonique normalisée.

### Implementation for User Story 1

- [x] T005 [P] [US1] Remplacer le champ « Téléphone de la Partie Contractante » par `PhoneInput` dans `lahatheque-frontend/app/(dashboard)/legal-reviewer/contracts/new/page.tsx`
- [x] T006 [P] [US1] Remplacer le champ « Téléphone / WhatsApp » par `PhoneInput` dans `lahatheque-frontend/components/features/contacts/add-edit-contact-modal.tsx`
- [x] T007 [P] [US1] Remplacer le champ « Téléphone » par `PhoneInput` dans la modale d'administration `lahatheque-frontend/components/features/admin/create-account-modal.tsx`
- [x] T008 [P] [US1] Remplacer le champ « Numéro de téléphone du responsable logistique » par `PhoneInput` dans `lahatheque-frontend/components/features/wholesaler/wholesale-order-modal.tsx`

**Checkpoint**: User Story 1 achevée. 100% des formulaires cibles utilisent désormais le composant unifié.

---

## Phase 4: User Story 3 - Résilience et Éradication des Erreurs toLowerCase (Priority: P3)

**Goal**: Éliminer l'exception JavaScript `Cannot read properties of undefined (reading 'toLowerCase')` observée sur la console de la page nouveau contrat.

**Independent Test**: Charger `/legal-reviewer/contracts/new?book_id=...` avec un ouvrage rattaché et vérifier que la console navigateur reste à 0 erreur.

### Implementation for User Story 3

- [x] T009 [US3] Sécuriser défensivement tous les accès à `.toLowerCase()` sur `authorNameParam`, `a.label`, `a.name` et `b.title` dans `lahatheque-frontend/app/(dashboard)/legal-reviewer/contracts/new/page.tsx`

**Checkpoint**: Page nouveau contrat totalement stable et exempte de crash console.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validation globale, typage strict et conformité esthétique

- [x] T010 [P] Valider l'intégrité globale du typage TypeScript via `pnpm tsc --noEmit` dans `lahatheque-frontend`
- [x] T011 [P] Vérifier l'absence d'émojis et le respect des tokens sémantiques (`border-border`, `focus-within:ring-navy`, `text-navy`, police Poppins) sur tous les formulaires modifiés
- [x] T012 Exécuter les scénarios de test pas-à-pas décrits dans `specs/018-harmonisation-phone-input/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Démarre immédiatement.
- **Foundational (Phase 2)**: Dépend de la Phase 1. BLOQUE les User Stories.
- **User Story 1 (Phase 3 - MVP)**: Dépend de la Phase 2.
- **User Story 3 (Phase 4)**: Peut être réalisée en parallèle ou à la suite d'US1.
- **Polish (Phase 5)**: Dépend de la complétion des phases d'implémentation.

### Parallel Opportunities

- Les tâches T005, T006, T007 et T008 peuvent s'exécuter en parallèle une fois `PhoneInput` enrichi (Phase 2 terminée).
- Les tâches T010 et T011 de validation peuvent s'exécuter en parallèle.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Enrichir `PhoneInput` (Phases 1 et 2).
2. Remplacer les champs dans les 4 formulaires identifiés (Phase 3).
3. Corriger le bug `toLowerCase` sur la page contrat (Phase 4).
4. Valider le typage et le build (Phase 5).
