# Implementation Tasks: Création et Gestion des Livres Audio Multi-Rôles (Studio Audio & Commande Multi-Formats)

**Feature**: `019-creation-gestion-livres-audio` | **Date**: 2026-09-07 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Phase 1: Setup (Shared Infrastructure & Types)

**Purpose**: Initialisation des contrats de types et de la configuration partagée pour le Studio Audio et les commandes multi-formats.

- [X] T001 Définir les types TypeScript complets pour le Studio Audio (AudioTrack, AudioBookForm, VoiceGender, TrackType, AudioTrackSet) dans `lahatheque-frontend/lib/types/audio.ts`
- [X] T002 [P] Mettre à jour les types TypeScript du catalogue pour supporter les attributs audio (`price_audio`, `has_audio_version`, `has_audio`, `is_digital_available`, `format_type`) dans `lahatheque-frontend/lib/types/catalog.ts`
- [X] T003 [P] Configurer les constantes de conversion et de validation audio (formats autorisés `.mp3`, `.m4a`, taille max 500 Mo) dans `lahatheque-frontend/lib/config/audio-constants.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Socle de données et d'API bloquant nécessaire avant l'implémentation des parcours utilisateurs.

**CRITICAL**: Aucun parcours utilisateur ne peut fonctionner de manière robuste sans ce socle validé.

- [X] T004 [P] Étendre le modèle `AudioTrack` (champs `voice_gender`, `track_type`, `file_size_bytes`, `bitrate_kbps`, `order_index`) dans `lahatheque-backend/apps/audio/models.py`
- [X] T005 [P] Ajouter les champs `price_audio_eur` et `audio_status` au modèle `Ouvrage` dans `lahatheque-backend/apps/catalog/models.py`
- [X] T006 Exécuter les migrations Django pour appliquer les évolutions des modèles `audio` et `catalog` via `lahatheque-backend/manage.py`
- [X] T007 Implémenter le service d'upload direct ou de génération d'URL présignée Cloudflare R2 pour les pistes audio dans `lahatheque-backend/apps/audio/views.py`
- [X] T008 [P] Implémenter le client API frontend pour le téléversement et la persistance des pistes audio dans `lahatheque-frontend/lib/services/audio.ts`
- [X] T009 Étendre le contexte de panier pour supporter le format `"audio"` aux côtés de `"digital"` et `"paper"` dans `lahatheque-frontend/context/cart-context.tsx`

**Checkpoint**: Socle prêt — l'implémentation des User Stories peut débuter.

---

## Phase 3: User Story 1 - Studio Audio : Création autonome ou Rattachement (Priority: P1) MVP

**Goal**: Permettre aux maquettistes et administrateurs de créer un livre audio soit rattaché à un livre existant (réutilisation automatique du titre, de la couverture et des métadonnées), soit en mode autonome, avec le Studio Audio double voix (Homme/Femme, Livre complet et chapitres).

**Independent Test**:
1. Ouvrir le formulaire du Studio Audio, cocher "Rattacher à un ouvrage existant" et sélectionner un livre.
2. Vérifier que la couverture, le titre, les auteurs et la catégorie se pré-remplissent sans upload d'image.
3. Déposer un fichier MP3 pour la voix masculine (livre complet) et ajouter un chapitre.
4. Enregistrer : le livre audio est sauvegardé avec succès avec le statut "En attente de validation maquette".

### Implementation for User Story 1

- [X] T010 [P] [US1] Créer l'endpoint API de recherche d'ouvrages éligibles au rattachement audio (`/api/v1/audio/eligible-books/`) dans `lahatheque-backend/apps/catalog/views.py`
- [X] T011 [P] [US1] Créer les serializers de validation pour la soumission d'un livre audio (`AudioStudioSubmitSerializer`) dans `lahatheque-backend/apps/audio/serializers.py`
- [X] T012 [US1] Implémenter la vue de création et mise à jour de livre audio (`AudioStudioCreateOrUpdateView`) dans `lahatheque-backend/apps/audio/views.py`
- [X] T013 [P] [US1] Créer le composant de sélection d'ouvrage existant avec prévisualisation 3D / couverture dans `lahatheque-frontend/components/features/audio/book-attachment-selector.tsx`
- [X] T014 [P] [US1] Créer le composant de gestion des pistes d'une voix (Livre complet + liste dynamique de chapitres) dans `lahatheque-frontend/components/features/audio/voice-track-manager.tsx`
- [X] T015 [US1] Assembler le composant maître du Studio Audio à deux colonnes (`AudioStudioForm`) reproduisant fidèlement le modèle LAHA Éditions dans `lahatheque-frontend/components/features/audio/audio-studio-form.tsx`
- [X] T016 [US1] Intégrer la page de création de livre audio pour le Maquettiste dans `lahatheque-frontend/app/(dashboard)/layout-artist/audio/new/page.tsx`
- [X] T017 [US1] Intégrer la page de création de livre audio pour l'Administrateur dans `lahatheque-frontend/app/(dashboard)/admin/audio/new/page.tsx`

**Checkpoint**: User Story 1 fonctionnelle et testable de bout en bout (création avec rattachement ou autonome).

---

## Phase 4: User Story 2 - Workflow de Validation Multi-Rôles (Priority: P1)

**Goal**: Assurer le workflow éditorial complet (Maquettiste -> Chef Maquettiste -> Juriste -> Administrateur) avec des interfaces de gestion dédiées pour chaque rôle.

**Independent Test**:
1. Soumettre un livre audio en tant que Maquettiste.
2. Se connecter en Chef Maquettiste sur `/chief-layout/audio`, écouter les pistes, et valider techniquement.
3. Se connecter en Juriste sur `/legal-reviewer/audio`, vérifier les taux de redevance audio et approuver.
4. Se connecter en Admin sur `/admin/audio`, constater le statut "Validé / Prêt pour publication" et publier.

### Implementation for User Story 2

- [X] T018 [P] [US2] Implémenter les transitions de statut du workflow audio (`submit_layout`, `approve_layout`, `reject_layout`, `approve_legal`, `publish_admin`) dans `lahatheque-backend/apps/audio/views.py`
- [X] T019 [P] [US2] Mettre à jour `dashboard-sidebar.tsx` pour ajouter l'onglet "Livres audio" avec icône Lucide Headphones pour Maquettiste, Chef Maquettiste, Juriste et Admin dans `lahatheque-frontend/components/dashboard-sidebar.tsx`
- [X] T020 [P] [US2] Créer la table de gestion des livres audio du Maquettiste dans `lahatheque-frontend/app/(dashboard)/layout-artist/audio/page.tsx`
- [X] T021 [P] [US2] Créer l'interface de validation technique du Chef Maquettiste avec écoute des pistes et modale de rejet motivé dans `lahatheque-frontend/app/(dashboard)/chief-layout/audio/page.tsx`
- [X] T022 [P] [US2] Créer l'interface de validation juridique des contrats audio du Juriste dans `lahatheque-frontend/app/(dashboard)/legal-reviewer/audio/page.tsx`
- [X] T023 [US2] Créer le tableau de bord de supervision et publication globale des livres audio de l'Administrateur dans `lahatheque-frontend/app/(dashboard)/admin/audio/page.tsx`

**Checkpoint**: User Stories 1 et 2 complètes : cycle de création et de validation opérationnel.

---

## Phase 5: User Story 5 - Catalogue Public : Découverte des Livres Audio & Combinaisons de Formats (Priority: P1)

**Goal**: Exposer clairement sur le catalogue public les formats disponibles pour chaque ouvrage (badges combinés Papier • Numérique • Audio, etc.), filtrer par livres audio ou audio seul, et proposer l'accès direct aux extraits adaptés.

**Independent Test**:
1. Se rendre sur `/catalog` et utiliser le filtre de format "Livres audio (tous)" ou "Audio seul".
2. Vérifier que chaque carte affiche la combinaison de formats exacte avec les icônes correspondantes.
3. Cliquer sur le bouton extrait d'un livre audio : constater l'ouverture de `SampleChoiceModal` (ou redirection directe vers `/listen/[id]?mode=sample` si audio seul).

### Implementation for User Story 5

- [X] T024 [P] [US5] Ajouter les options de filtrage audio ("Livres audio", "Audio seul", "Pack complet") dans la barre latérale du catalogue public dans `lahatheque-frontend/app/(public)/catalog/page.tsx`
- [X] T025 [US5] Implémenter le calcul dynamique et l'affichage des badges de formats combinés (`Papier • Numérique • Audio`, `Numérique • Audio`, `Papier • Audio`, `Audio Seul`, `Papier • Numérique`, etc.) sur les cartes du catalogue dans `lahatheque-frontend/app/(public)/catalog/page.tsx`
- [X] T026 [US5] Brancher l'interaction d'extrait (`SampleChoiceModal`) sur le catalogue public pour permettre le choix entre liseuse 3D et écoute audio dans `lahatheque-frontend/app/(public)/catalog/page.tsx`
- [X] T027 [P] [US5] Mettre à jour l'affichage des caractéristiques de formats et badges sur la fiche détaillée d'ouvrage dans `lahatheque-frontend/app/(public)/catalog/[id]/page.tsx`

**Checkpoint**: Le catalogue public reflète fidèlement toutes les combinaisons de formats et met en valeur l'audio.

---

## Phase 6: User Story 3 - Commande Multi-Formats Flexible (Priority: P2)

**Goal**: Permettre aux lecteurs d'acheter sur un même ouvrage n'importe quelle combinaison de formats (papier pour livraison, numérique pour lecture, audio pour écoute, ou les trois réunis) sans restriction radio mutuellement exclusive.

**Independent Test**:
1. Ouvrir la fiche d'un ouvrage disposant des 3 formats (`/catalog/[id]`).
2. Cocher "Livre Papier" (choisir quantité 2) et "Livre Audio".
3. Vérifier que le montant total cumulé s'actualise en temps réel en FCFA et EUR.
4. Cliquer sur "Ajouter au panier" : vérifier que les 2 lignes distinctes s'ajoutent au tiroir panier avec leurs icônes respectives.
5. Procéder au checkout : vérifier la commande consolidée.

### Implementation for User Story 3

- [X] T028 [P] [US3] Refondre `BookActionButtons` pour remplacer les boutons radio mutuellement exclusifs par des cartes de sélection multi-formats combinables (cases à cocher Papier, Numérique, Audio) avec calcul de prix agrégé dans `lahatheque-frontend/components/catalog/book-action-buttons.tsx`
- [X] T029 [US3] Intégrer l'action d'extrait intelligent dans `BookActionButtons` (ouverture de `SampleChoiceModal` pour double format ou redirection directe) dans `lahatheque-frontend/components/catalog/book-action-buttons.tsx`
- [X] T030 [P] [US3] Mettre à jour le tiroir panier (`CartDrawer`) pour afficher l'icône `Headphones` et le libellé "Livre audio" pour les articles au format audio dans `lahatheque-frontend/components/cart/cart-drawer.tsx`
- [X] T031 [P] [US3] Adapter le récapitulatif de commande de la page checkout pour mentionner le format "Audio" dans `lahatheque-frontend/app/(public)/checkout/page.tsx`

**Checkpoint**: La commande multi-formats combinée est pleinement opérationnelle du catalogue au checkout.

---

## Phase 7: User Story 4 - Vue d'Ensemble & Progression Audio (Priority: P2)

**Goal**: Afficher sur la vue d'ensemble de l'apprenant/étudiant (`/student`) les écoutes audio en cours avec la jauge de progression, le chapitre actuel et un bouton de reprise instantanée vers `/listen/[id]`.

**Independent Test**:
1. Lancer l'écoute d'un livre audio et avancer de quelques minutes.
2. Revenir sur le dashboard étudiant `/student`.
3. Constater le widget "Mes Écoutes Audio en Cours" avec le titre, la pochette, le pourcentage et le bouton "Reprendre".
4. Cliquer sur "Reprendre" : navigation immédiate vers `/listen/[id]` avec reprise de la lecture à la seconde exacte.

### Implementation for User Story 4

- [X] T032 [P] [US4] Créer le composant de widget de reprise d'écoute audio (`RecentAudioWidget`) avec barre de progression et lien direct dans `lahatheque-frontend/components/features/student/recent-audio-widget.tsx`
- [X] T033 [US4] Intégrer `RecentAudioWidget` dans la vue d'ensemble du Dashboard Étudiant dans `lahatheque-frontend/app/(dashboard)/student/page.tsx`

**Checkpoint**: Continuité d'écoute transparente entre le lecteur universel `/listen/[id]` et le dashboard.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Finitions chic, vérification de l'accessibilité, typographie et absence de régression.

- [X] T034 [P] Vérifier l'absence totale de tout émoji dans tous les nouveaux fichiers et écrans créés (conformité règle constitutionnelle X)
- [X] T035 [P] Vérifier l'absence totale de codes couleurs hexadécimaux en dur et l'utilisation exclusive des tokens sémantiques `navy`, `gold`, `border-border`
- [X] T036 Valider l'adaptation responsive mobile-first (< 400px) sur le Studio Audio et les fiches catalogue
- [X] T037 Exécuter la vérification du typage TypeScript frontend via `pnpm tsc --noEmit` avec 0 erreur
- [X] T038 Valider le scénario de bout en bout décrit dans `specs/019-creation-gestion-livres-audio/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Aucune dépendance — démarre immédiatement.
- **Foundational (Phase 2)**: Dépend de la Phase 1 — BLOQUE les user stories.
- **User Story 1 (Phase 3 - P1)**: Dépend de la Phase 2.
- **User Story 2 (Phase 4 - P1)**: Dépend de la Phase 3 (workflow de validation des livres créés).
- **User Story 5 (Phase 5 - P1)**: Dépend de la Phase 2 (affichage public des livres et formats).
- **User Story 3 (Phase 6 - P2)**: Dépend de la Phase 5 (commande multi-formats sur la fiche produit).
- **User Story 4 (Phase 7 - P2)**: Dépend de la Phase 2 (widget d'écoute sur le dashboard).
- **Polish (Phase 8)**: Dépend de la complétion des user stories.

### Parallel Opportunities

- T002, T003 peuvent être exécutés en parallèle de T001.
- T004, T005, T008, T009 peuvent être exécutés en parallèle au sein de la Phase 2.
- T010, T011, T013, T014 peuvent avancer en parallèle dans la Phase 3.
- T019, T020, T021, T022 peuvent avancer en parallèle dans la Phase 4.
- T024, T027 peuvent avancer en parallèle dans la Phase 5.
- T028, T030, T031 peuvent avancer en parallèle dans la Phase 6.
- T034, T035, T036, T037 peuvent avancer en parallèle dans la Phase 8.

---

## Implementation Strategy

### MVP First (User Story 1 & 5)
1. Compléter Phase 1 (Setup) et Phase 2 (Foundational).
2. Compléter Phase 3 (Studio Audio & Rattachement).
3. Compléter Phase 5 (Catalogue Public & Formats Audio).
4. **Valider** : Créer un livre audio avec rattachement catalogue, vérifier sa visibilité sur `/catalog`.

### Incremental Delivery
1. Phase 1 + 2 : Socle commun et modèles prêts.
2. Phase 3 : Studio Audio utilisable par Maquettiste et Admin.
3. Phase 4 : Workflow de validation Chef Maquettiste & Juriste.
4. Phase 5 : Découverte sur le catalogue public avec badges combinés.
5. Phase 6 : Panier et commande multi-formats sans exclusivité.
6. Phase 7 : Suivi de progression sur le dashboard étudiant.
7. Phase 8 : Finitions esthétiques et validation globale.
