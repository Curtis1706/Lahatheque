# Tasks: Courriers Officiels de Redevances & Relances sur Papier à En-tête LAHAThèque

**Feature**: `008-courrier-redevances-relances`
**Spec**: [spec.md](file:///e:/Lahatheque/specs/008-courrier-redevances-relances/spec.md)
**Plan**: [plan.md](file:///e:/Lahatheque/specs/008-courrier-redevances-relances/plan.md)
**Devise Officielle**: FCFA exclusivement
**Gabarit Papier à En-tête**: `lahatheque-backend/static/Lahatheque-PapierEntete-SansNumero.pdf`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialisation des types et de la structure de base partagée.

- [X] T001 [P] Créer les interfaces TypeScript des courriers officiels dans lahatheque-frontend/lib/types/courrier.ts
- [X] T002 [P] Vérifier la présence et les constantes de dimensions du gabarit PDF dans lahatheque-backend/static/Lahatheque-PapierEntete-SansNumero.pdf
- [X] T003 [P] Initialiser le dictionnaire des modèles textuels types par défaut dans lahatheque-backend/apps/rights/letter_templates.py

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Modèle de données Django, migration, service PDF de base et client d'API nécessaires à toutes les User Stories.

- [X] T004 Créer le modèle CourrierOfficiel dans lahatheque-backend/apps/rights/models.py
- [X] T005 Créer et appliquer la migration Django pour CourrierOfficiel via lahatheque-backend/apps/rights/migrations/0007_courrierofficiel.py
- [X] T006 [P] Implémenter le serializer CourrierOfficielSerializer dans lahatheque-backend/apps/rights/serializers.py
- [X] T007 Implémenter le service PyMuPDF de fusion sur gabarit officiel dans lahatheque-backend/apps/rights/official_letter_service.py
- [X] T008 [P] Implémenter le client API frontend et fonctions de requêtes dans lahatheque-frontend/lib/services/courrier.ts

**Checkpoint**: Socle de données, service de génération PDF et client API prêts. L'implémentation des User Stories peut débuter.

---

## Phase 3: User Story 1 - Préparation d'un courrier officiel depuis Redevances ou Relances (Priority: P1)

**Goal**: Remplacer les boutons directs par "Préparer le courrier" et "Préparer les courriers de la période", initialiser le brouillon et rediriger vers la page dédiée.

**Independent Test**: Sur `/legal-reviewer/redevances` ou `/legal-reviewer/relances`, cliquer sur "Préparer le courrier" d'une ligne. Le système crée le brouillon avec texte pré-rempli et redirige vers `/legal-reviewer/courriers` où le courrier apparaît en tête de liste.

- [X] T009 [US1] Implémenter l'endpoint API de préparation unitaire POST /api/v1/rights/legal/courriers/prepare/ dans lahatheque-backend/apps/rights/views.py
- [X] T010 [US1] Implémenter l'endpoint API de préparation par lot POST /api/v1/rights/legal/courriers/prepare-batch/ dans lahatheque-backend/apps/rights/views.py
- [X] T011 [US1] Déclarer les routes d'API de préparation dans lahatheque-backend/apps/rights/urls.py
- [X] T012 [P] [US1] Remplacer le bouton "Envoyer Relevé" par "Préparer le courrier" avec redirection dans lahatheque-frontend/app/(dashboard)/legal-reviewer/redevances/page.tsx
- [X] T013 [P] [US1] Remplacer les boutons "Envoyer Relevé" et le bouton d'en-tête de période par "Préparer le courrier" et "Préparer les courriers de la période" dans lahatheque-frontend/app/(dashboard)/legal-reviewer/relances/page.tsx

**Checkpoint**: La préparation unitaire et groupée crée les brouillons et redirige correctement vers la page dédiée.

---

## Phase 4: User Story 2 - Consultation de l'historique et prévisualisation PDF dans le navigateur (Priority: P1)

**Goal**: Fournir la page dédiée `/legal-reviewer/courriers` sous forme de DataTable avec fil d'Ariane et permettre d'ouvrir le PDF généré en direct dans le navigateur via l'action "PDF".

**Independent Test**: Sur `/legal-reviewer/courriers`, la table liste les courriers avec filtres et statuts. Cliquer sur l'action "PDF" ouvre immédiatement le document avec le papier à en-tête LAHAThèque et le corps rédigé dans un nouvel onglet.

- [X] T014 [US2] Implémenter l'endpoint GET /api/v1/rights/legal/courriers/ pour lister les courriers avec filtres dans lahatheque-backend/apps/rights/views.py
- [X] T015 [US2] Implémenter l'endpoint de streaming PDF inline GET /api/v1/rights/legal/courriers/<uuid:id>/preview-pdf/ dans lahatheque-backend/apps/rights/views.py
- [X] T016 [US2] Enregistrer les routes de consultation et streaming PDF dans lahatheque-backend/apps/rights/urls.py
- [X] T017 [US2] Créer la page dédiée avec DataTable et fil d'Ariane dans lahatheque-frontend/app/(dashboard)/legal-reviewer/courriers/page.tsx
- [X] T018 [US2] Intégrer l'action "PDF" ouvrant l'aperçu dans un nouvel onglet dans lahatheque-frontend/app/(dashboard)/legal-reviewer/courriers/page.tsx

**Checkpoint**: Le tableau de bord affiche l'historique des courriers et la prévisualisation PDF fonctionne en direct pour les brouillons et validés.

---

## Phase 5: User Story 3 - Personnalisation contextuelle du texte du courrier via modale ("Corriger") (Priority: P2)

**Goal**: Permettre au juriste de corriger l'objet et le corps du courrier en brouillon via une modale dédiée sans impacter le modèle global ni les montants comptables.

**Independent Test**: Sur une ligne au statut "Brouillon", cliquer sur "Corriger". La modale affiche les montants et le destinataire en lecture seule et permet de modifier l'objet et le texte. Après enregistrement, le prochain aperçu PDF intègre ces modifications.

- [X] T019 [US3] Implémenter l'endpoint PATCH /api/v1/rights/legal/courriers/<uuid:id>/ pour modifier l'objet et le corps d'un brouillon dans lahatheque-backend/apps/rights/views.py
- [X] T020 [US3] Créer le composant de modale d'édition contextuelle dans lahatheque-frontend/components/features/legal/edit-courrier-modal.tsx
- [X] T021 [US3] Connecter l'action "Corriger" de la table à la modale d'édition dans lahatheque-frontend/app/(dashboard)/legal-reviewer/courriers/page.tsx

**Checkpoint**: La personnalisation du texte pour un destinataire donné est enregistrée en brouillon et visible immédiatement sur le PDF.

---

## Phase 6: User Story 4 - Validation formelle et figeage du PDF officiel (Priority: P2)

**Goal**: Verrouiller le texte du courrier, générer le document PDF final scellé sur papier à en-tête et basculer le statut vers "Validé".

**Independent Test**: Sur un brouillon, cliquer sur "Valider" et confirmer dans la modale d'avertissement. Le statut passe à "Validé", le PDF est scellé, les actions "Corriger" et "Valider" disparaissent au profit de "Envoyer par email".

- [X] T022 [US4] Implémenter l'endpoint POST /api/v1/rights/legal/courriers/<uuid:id>/validate/ avec scellement et stockage du PDF dans lahatheque-backend/apps/rights/views.py
- [X] T023 [US4] Créer la boîte de dialogue de confirmation de validation dans lahatheque-frontend/components/features/legal/courrier-action-dialogs.tsx
- [X] T024 [US4] Connecter l'action "Valider" de la table avec actualisation optimiste du statut dans lahatheque-frontend/app/(dashboard)/legal-reviewer/courriers/page.tsx

**Checkpoint**: Le document validé est scellé et immuable ; la table met à jour les boutons d'action en conséquence.

---

## Phase 7: User Story 5 - Envoi certifié par email avec PDF officiel en pièce jointe (Priority: P2)

**Goal**: Expédier l'email officiel au destinataire reprenant le texte rédigé dans le corps du message avec le PDF scellé en pièce jointe, et passer le statut à "Envoyé".

**Independent Test**: Sur un courrier "Validé", cliquer sur "Envoyer par email" et confirmer. L'email est transmis avec la pièce jointe, le statut passe à "Envoyé", l'horodatage d'expédition est affiché et aucune modification ultérieure n'est permise.

- [X] T025 [US5] Implémenter l'endpoint POST /api/v1/rights/legal/courriers/<uuid:id>/send-email/ reliant email_service et le PDF scellé dans lahatheque-backend/apps/rights/views.py
- [X] T026 [US5] Créer la boîte de confirmation d'expédition d'email dans lahatheque-frontend/components/features/legal/courrier-action-dialogs.tsx
- [X] T027 [US5] Connecter l'action "Envoyer par email" avec notification toast de succès dans lahatheque-frontend/app/(dashboard)/legal-reviewer/courriers/page.tsx

**Checkpoint**: L'email officiel est expédié avec le PDF scellé et l'historique d'envoi est certifié.

---

## Phase 8: User Story 6 - Annulation et traçabilité d'un courrier (Priority: P3)

**Goal**: Permettre d'annuler un courrier (depuis l'état Brouillon ou Validé avant envoi) via une confirmation simple sans motif obligatoire, en le conservant archivé dans la table.

**Independent Test**: Sur un courrier "Brouillon" ou "Validé", cliquer sur "Annuler" et valider la confirmation. Le statut passe à "Annulé" et la ligne reste consultable dans la table avec badge neutre.

- [X] T028 [US6] Implémenter l'endpoint POST /api/v1/rights/legal/courriers/<uuid:id>/cancel/ avec verrouillage d'annulation dans lahatheque-backend/apps/rights/views.py
- [X] T029 [US6] Créer la boîte de confirmation d'annulation simple dans lahatheque-frontend/components/features/legal/courrier-action-dialogs.tsx
- [X] T030 [US6] Connecter l'action "Annuler" dans la table avec mise à jour du statut vers "Annulé" dans lahatheque-frontend/app/(dashboard)/legal-reviewer/courriers/page.tsx

**Checkpoint**: L'annulation neutralise le document tout en maintenant la traçabilité intégrale dans l'historique.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Cohérence globale, vérification mobile-first, zéro émoji, formatage FCFA et journalisation granulaire.

- [X] T031 [P] Vérifier la conformité stricte de l'affichage des montants avec la devise FCFA sur tous les écrans et PDF dans lahatheque-frontend/app/(dashboard)/legal-reviewer/courriers/page.tsx
- [X] T032 [P] Ajouter les console logs structurés [COURRIERS API] et [COURRIER MODAL] avec horodatage et timings dans lahatheque-frontend/lib/services/courrier.ts
- [X] T033 Vérifier la réactivité mobile-first (largeurs 375px et 390px) sans défilement horizontal parasite sur lahatheque-frontend/app/(dashboard)/legal-reviewer/courriers/page.tsx
- [X] T034 Exécuter le guide de validation quickstart.md et vérifier le build de production frontend via npm run build dans lahatheque-frontend/

---

## Dependencies & Execution Order

```
[Phase 1: Setup] ──► [Phase 2: Foundational]
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [Phase 3: US1 - Préparer]        [Phase 4: US2 - DataTable & PDF]
            │                                 │
            └────────────────┬────────────────┘
                             ▼
                 [Phase 5: US3 - Corriger]
                             ▼
                 [Phase 6: US4 - Valider]
                             ▼
                 [Phase 7: US5 - Envoyer Email]
                             ▼
                 [Phase 8: US6 - Annuler]
                             ▼
                 [Phase 9: Polish & Validation]
```

### Parallel Opportunities

- **Setup & Base**: T001, T002, T003 en parallèle.
- **Foundational**: T006 et T008 en parallèle après T004/T005.
- **US1**: T012 (Redevances) et T013 (Relances) en parallèle côté frontend.
- **Polish**: T031 et T032 en parallèle.
