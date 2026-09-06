# Tasks: Livres Audio et Lecteur Multi-Rôles

**Feature**: `017-livres-audio-lecteur-multi-roles`
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialisation des contrats TypeScript, types partagés et extensions de modèle

- [x] T001 [P] Mettre à jour les interfaces TypeScript pour les sessions audio et les pistes dans `lahatheque-frontend/lib/types/audio.ts`
- [x] T002 [P] Enrichir les types de l'ouvrage et de la bibliothèque avec `has_audio_version` et `price_audio` dans `lahatheque-frontend/lib/types/student.ts`
- [x] T003 [P] Enrichir les types du catalogue et de l'administration dans `lahatheque-frontend/lib/types/catalog.ts` et `lahatheque-frontend/lib/types/admin.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Socle d'API backend et service frontend indispensables avant l'implémentation des écrans

**CRITICAL**: Aucune tâche des User Stories ne peut débuter avant la complétion de cette phase

- [x] T004 Enrichir `AudioStreamSessionView` avec le support du paramètre `preview_mode` (180s) et le bypass des rôles dans `lahatheque-backend/apps/audio/views.py`
- [x] T005 [P] Ajouter la prise en charge du remplacement de piste audio (`replace=true`) dans `AudioTrackUploadView` dans `lahatheque-backend/apps/audio/views.py`
- [x] T006 [P] Mettre à jour `AccessService.check_user_book_access` pour accorder l'accès audio gratuit aux rôles admin, maquettistes et auteurs dans `lahatheque-backend/apps/protection/access_service.py`
- [x] T007 [P] Enrichir le service client `audio.ts` avec les fonctions d'écoute extrait, session complète et upload de remplacement dans `lahatheque-frontend/lib/services/audio.ts`
- [x] T008 Créer le contexte React global `AudioPlayerContext` pour piloter la lecture, le volume et la persistance dans `lahatheque-frontend/components/features/audio/audio-player-context.tsx`
- [x] T009 Intégrer `AudioPlayerProvider` dans le layout racine du tableau de bord dans `lahatheque-frontend/app/(dashboard)/layout.tsx`

**Checkpoint**: Socle backend et contexte frontend opérationnels. Les User Stories peuvent démarrer.

---

## Phase 3: User Story 1 - Écoute et Achat Client / Étudiant (Priority: P1) [MVP]

**Goal**: Permettre aux étudiants et clients d'écouter un extrait audio gratuit de 3 minutes sur le catalogue, d'acheter le format audio, et de retrouver le double bouton « Lire » et « Écouter » dans « Ma Bibliothèque » avec reprise de progression.

**Independent Test**: Un étudiant se rend sur `/student/catalog`, écoute 3 minutes d'extrait, achète la version audio via la modale, va sur `/student/library`, clique sur « Écouter » et reprend sa lecture audio complète.

### Implementation for User Story 1

- [x] T010 [P] [US1] Ajouter le badge visuel « Livre Audio » et le bouton « Écouter l'extrait » sur les cartes d'ouvrages dans `lahatheque-frontend/components/features/student/book-card.tsx`
- [x] T011 [US1] Intégrer la sélection du format audio avec calcul du prix dans la modale d'achat d'ouvrage dans `lahatheque-frontend/components/features/student/catalog-book-modal.tsx`
- [x] T012 [P] [US1] Ajouter le filtre de format « Audio » et la double action « Lire » / « Écouter » sur la grille de bibliothèque dans `lahatheque-frontend/app/(dashboard)/student/library/page.tsx`
- [x] T013 [P] [US1] Intégrer l'action « Écouter » dans le composant de carte de bibliothèque dans `lahatheque-frontend/components/features/student/library-book-card.tsx`
- [x] T014 [US1] Ajouter le bloc « Reprendre l'écoute audio » avec durée écoulée sur la vue d'ensemble étudiant dans `lahatheque-frontend/app/(dashboard)/student/page.tsx`
- [x] T015 [US1] Câbler la synchronisation automatique de progression d'écoute vers `/api/bff/audio/tracks/<id>/progress/` dans `lahatheque-frontend/components/features/audio/audio-player-context.tsx`

**Checkpoint**: User Story 1 pleinement fonctionnelle et testable indépendamment (MVP délivré).

---

## Phase 4: User Story 2 - Contrôle et Remplacement Audio par les Maquettistes et Administrateurs (Priority: P2)

**Goal**: Permettre aux maquettistes, chefs maquettistes et administrateurs d'écouter les pistes sans restriction d'achat et de remplacer le fichier audio d'un livre existant avec verrouillage automatique.

**Independent Test**: Un chef maquettiste ou administrateur ouvre un livre audio sur `/admin/catalog` ou `/chief-layout/deposit`, pré-écoute la piste, clique sur « Remplacer l'audio », dépose un nouveau fichier MP3, et constate la mise à jour immédiate du flux d'écoute.

### Implementation for User Story 2

- [x] T016 [P] [US2] Créer le composant d'upload et de remplacement audio `AudioReplacementDropzone` avec barre de progression dans `lahatheque-frontend/components/features/layout-artist/audio-replacement-dropzone.tsx`
- [x] T017 [US2] Intégrer l'écoute du master audio et la dropzone de remplacement audio dans l'édition de dépôt du maquettiste dans `lahatheque-frontend/app/(dashboard)/layout-artist/deposits/[id]/page.tsx`
- [x] T018 [US2] Intégrer la section audio (écoute + composant de remplacement `AudioReplacementDropzone`) dans la fiche de validation du chef maquettiste dans `lahatheque-frontend/app/(dashboard)/chief-layout/validation/[id]/page.tsx`
- [x] T019 [US2] Ajouter la colonne statut audio et le panneau d'édition audio (pré-écoute, remplacement du fichier et prix) dans le catalogue admin dans `lahatheque-frontend/app/(dashboard)/admin/catalog/page.tsx`
- [x] T020 [P] [US2] Intégrer le lecteur de pré-écoute audio pour le juriste avant validation finale dans `lahatheque-frontend/app/(dashboard)/legal-reviewer/publication-en-attente/[id]/page.tsx` et sur le contrat dans `lahatheque-frontend/app/(dashboard)/legal-reviewer/contracts/[id]/page.tsx`
- [x] T020b [P] [US2] Intégrer le bouton d'écoute de l'auteur sur ses propres livres dans `lahatheque-frontend/app/(dashboard)/author/books/page.tsx`

**Checkpoint**: User Story 2 pleinement fonctionnelle et testable indépendamment.

---

## Phase 5: User Story 3 - Expérience de Lecture Audio Immersive & Mini-Lecteur Persistant (Priority: P3)

**Goal**: Offrir une expérience d'écoute élégante via un composant haute fidélité adapté du modèle SpotifyCard aux tokens LAHAThèque (Navy, Gold, Playfair Display/Poppins, onde sonore dorée animée, sans émoji) et un mini-lecteur persistant en bas d'écran.

**Independent Test**: Un auditeur démarre une piste audio, observe le mini-lecteur persistant en bas de page pendant sa navigation, clique pour agrandir sur la vue immersive `/student/audio/[id]`, contrôle la vitesse (1x, 1.5x) et ajuste le volume sans aucune coupure.

### Implementation for User Story 3

- [x] T021 [P] [US3] Créer le composant haute fidélité `LahathequeAudioPlayerCard` reprenant l'architecture SpotifyCard adaptée aux tokens LAHAThèque dans `lahatheque-frontend/components/features/audio/lahatheque-audio-player-card.tsx`
- [x] T022 [P] [US3] Créer le composant de mini-lecteur persistant flottant en bas d'écran `PersistentAudioPlayer` dans `lahatheque-frontend/components/features/audio/persistent-audio-player.tsx`
- [x] T023 [US3] Intégrer `PersistentAudioPlayer` dans le shell principal du tableau de bord dans `lahatheque-frontend/components/dashboard-shell.tsx`
- [x] T024 [US3] Créer la page dédiée plein écran de lecture audio pour l'étudiant dans `lahatheque-frontend/app/(dashboard)/student/audio/[id]/page.tsx`
- [x] T025 [P] [US3] Créer la route publique/universelle du lecteur audio dans `lahatheque-frontend/app/listen/[id]/page.tsx`
- [x] T026 [US3] Ajouter les contrôles avancés (saut -15s/+15s, sélecteur de vitesse 0.75x à 2x, raccourcis clavier Espace/Flèches) dans `lahatheque-frontend/components/features/audio/lahatheque-audio-player-card.tsx`

**Checkpoint**: User Stories 1, 2 et 3 pleinement fonctionnelles et intégrées.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Vérification responsive mobile-first, audit de non-régression, élimination stricte des émojis et validation end-to-end

- [x] T027 [P] Vérifier la conformité mobile-first sur écrans étroits (< 400px) pour le mini-lecteur et la carte audio dans `lahatheque-frontend/components/features/audio/`
- [x] T028 [P] Effectuer l'audit de zéro émoji et de zéro couleur hexadécimale en dur (`#1ED760` banni) sur tous les composants audio
- [x] T029 Exécuter les scénarios de validation end-to-end du guide `quickstart.md`
- [x] T030 [P] Mettre à jour la documentation d'API et le guide utilisateur dans `docs/AUDIO_PLAYER_GUIDE.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Démarre immédiatement sans dépendance.
- **Foundational (Phase 2)**: Dépend de la Phase 1. BLOQUE toutes les User Stories.
- **User Story 1 (Phase 3 - MVP)**: Dépend de la Phase 2.
- **User Story 2 (Phase 4)**: Dépend de la Phase 2. Peut être réalisée en parallèle ou à la suite d'US1.
- **User Story 3 (Phase 5)**: Dépend de la Phase 2 et s'intègre avec le contexte d'US1.
- **Polish (Phase 6)**: Dépend de la complétion des User Stories.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Exécuter Phase 1 (Types) + Phase 2 (Foundational : Backend endpoints + Contexte React).
2. Exécuter Phase 3 (User Story 1 : Extrait 180s, Achat, double bouton Lire/Écouter dans Bibliothèque).
3. **VALIDATION MVP** : Tester le parcours complet catalogue -> écoute extrait -> achat -> bibliothèque -> écoute.

### Déploiement Complet
1. Phase 4 : Activer le bypass maquettiste/admin et le remplacement audio dans l'édition d'ouvrages.
2. Phase 5 : Déployer le lecteur immersif `LahathequeAudioPlayerCard` et le mini-lecteur persistant `PersistentAudioPlayer`.
3. Phase 6 : Polish responsive mobile et validation finale.
