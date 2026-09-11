# Tasks: Formulaire Contact B2B & Tunnel d'Achat E-commerce

**Feature Branch**: `006-contact-b2b-checkout-flow`  
**Spec**: [`specs/006-contact-b2b-checkout-flow/spec.md`](file:///e:/Lahatheque/specs/006-contact-b2b-checkout-flow/spec.md)  
**Plan**: [`specs/006-contact-b2b-checkout-flow/plan.md`](file:///e:/Lahatheque/specs/006-contact-b2b-checkout-flow/plan.md)  
**Data Model**: [`specs/006-contact-b2b-checkout-flow/data-model.md`](file:///e:/Lahatheque/specs/006-contact-b2b-checkout-flow/data-model.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prérequis d'architecture et synchronisation des constantes partagées

- [X] T001 [P] Vérifier la configuration des constantes d'e-mails administratifs dans `lahatheque-backend/apps/communications/views.py`
- [X] T002 [P] Vérifier l'accès aux types d'utilisateurs et rôles dans `lahatheque-frontend/lib/types.ts`
- [X] T003 [P] Vérifier les jetons sémantiques CSS et styles des champs de sélection dans `lahatheque-frontend/app/globals.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Fondations bloquantes nécessaires aux formulaires de contact et au checkout

- [X] T004 Aligner la liste `ADMIN_NOTIFICATION_EMAILS` avec l'adresse exacte `alhtdharry7@gmail.com` dans `lahatheque-backend/apps/communications/views.py`
- [X] T005 [P] Définir les types TypeScript pour la soumission de contact B2B et les profils institutionnels dans `lahatheque-frontend/lib/types/contact.ts`
- [X] T006 [P] Définir les types TypeScript et contrats de commande multi-formats au checkout dans `lahatheque-frontend/lib/types/checkout.ts`

---

## Phase 3: User Story 1 - Formulaire de Contact B2B, Partenariats & Commandes en Gros (Priority: P1) - MVP

**Goal**: Permettre aux universités, éditeurs, grossistes et auteurs de soumettre leurs besoins institutionnels et notifier simultanément les 3 adresses e-mails désignées.

**Independent Test**: Remplir `/contact` avec le profil "Université" et les besoins "Partenariat" + "Commande en gros" ; vérifier l'enregistrement en base et la réception de la notification aux 3 e-mails (`lahaeditions1@gmail.com`, `firinzegbenitodossou@gmail.com`, `alhtdharry7@gmail.com`) et l'accusé de réception.

### Implementation for User Story 1

- [X] T007 [US1] Mettre à jour la liste des profils demandeurs dans `lahatheque-frontend/app/(public)/contact/page.tsx` pour restreindre aux rôles BD (`university`, `publisher`, `wholesaler`, `author`, `other`)
- [X] T008 [US1] Enrichir la sélection des besoins avec "Demande de partenariat institutionnel", "Commande en gros (gros volumes)", "Intégration API & Catalogue", prestations et option "Autre" avec texte d'aide dans `lahatheque-frontend/app/(public)/contact/page.tsx`
- [X] T009 [US1] Implémenter le dispatch et la validation des données de contact dans l'endpoint `submit_contact_view` de `lahatheque-backend/apps/communications/views.py`
- [X] T010 [US1] Vérifier le template HTML d'alerte interne pour inclure le profil B2B et les besoins cochés dans `lahatheque-backend/templates/emails/support/internal_alert.html`
- [X] T011 [US1] Valider l'accusé de réception automatique avec numéro de ticket dans `lahatheque-backend/templates/emails/support/contact_ack.html`

---

## Phase 4: User Story 2 - Tunnel d'Achat E-commerce & Étape Compte Client (Priority: P1)

**Goal**: Offrir un tunnel de commande e-commerce fluide avec panier local persistant, identification intégrée Option A sans redirection, et gestion étanche des formats papier, numérique et audio.

**Independent Test**: Ajouter un livre papier et un livre numérique en mode invité sur `/catalog`, accéder à `/checkout`, créer un compte client avec OTP directement dans le panneau Option A sans quitter la page, vérifier que le panier est conservé, finaliser la commande et vérifier la création de `PhysicalDelivery` et le déverrouillage dans `/student/books`.

### Implementation for User Story 2

- [X] T012 [P] [US2] Créer le composant de panneau d'authentification Option A à 2 onglets ("Déjà client ?" / "Nouveau client ?") avec OTP intégré dans `lahatheque-frontend/components/checkout/checkout-auth-panel.tsx`
- [X] T013 [US2] Intégrer `checkout-auth-panel.tsx` dans `lahatheque-frontend/app/(public)/checkout/page.tsx` pour bloquer la commande anonyme tout en préservant le panier
- [X] T014 [US2] Assurer la persistance du panier client dans `localStorage` lors des transitions de session dans `lahatheque-frontend/context/cart-context.tsx`
- [X] T015 [US2] Adapter le formulaire de livraison physique dans `lahatheque-frontend/app/(public)/checkout/page.tsx` pour collecter adresse, ville, pays, téléphone et créneau horaire
- [X] T016 [US2] Vérifier la création de l'enregistrement `PhysicalDelivery` et l'émission de la notification gestionnaire dans `lahatheque-backend/apps/commerce/views.py`
- [X] T017 [US2] Valider le déverrouillage automatique `ReadingProgress` pour les formats numérique et audio dans `lahatheque-backend/apps/commerce/services.py`
- [X] T018 [US2] Vérifier la génération de l'e-mail de confirmation avec facture PDF acquittée dans `lahatheque-backend/templates/emails/orders/confirmation_client.html`

---

## Phase 5: User Story 3 - Console Logs Granulaires & Observabilité du Tunnel (Priority: P2)

**Goal**: Garantir une traçabilité totale en console et côté serveur sur chaque étape du formulaire de contact et du tunnel de commande.

**Independent Test**: Ouvrir les DevTools Console lors de la soumission de contact et du checkout, et vérifier la présence des groupes `[CONTACT FORM]` et `[CHECKOUT FLOW]` avec les statuts et timings en millisecondes.

### Implementation for User Story 3

- [X] T019 [US3] Ajouter les logs détaillés balisés `[CONTACT FORM]` avec horodatage et temps de réponse dans `lahatheque-frontend/app/(public)/contact/page.tsx`
- [X] T020 [US3] Ajouter les logs détaillés balisés `[CHECKOUT FLOW]` traçant l'étape d'authentification, le panier et la passation dans `lahatheque-frontend/app/(public)/checkout/page.tsx`
- [X] T021 [US3] Ajouter les logs serveur explicites pour le suivi de commande et d'alerte dans `lahatheque-backend/apps/commerce/views.py` et `lahatheque-backend/apps/communications/views.py`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation globale, contrôles constitutionnels et tests de bout en bout

- [X] T022 Vérifier la conformité stricte aux tokens sémantiques CSS (`bg-navy`, `bg-gold`, etc.) avec zéro code hexadécimal en dur dans les pages modifiées
- [X] T023 Vérifier l'absence absolue de tout émoji dans les composants et templates e-mails modifiés
- [X] T024 Exécuter les scénarios de test complets décrits dans `specs/006-contact-b2b-checkout-flow/quickstart.md`
- [X] T025 Valider le build de production Next.js sans erreur (`npm run build` dans `lahatheque-frontend`)
- [X] T026 Mettre à jour la mémoire persistante du projet dans `.specify/memory/project_memory.md`

---

## Phase 7: Correctifs Filtre Papier, Disponibilité & Redirection Checkout (FR-011 à FR-014)

**Purpose**: Résolution des anomalies de disponibilité papier, saisie du téléphone de livraison et fluidité de la redirection post-connexion

- [X] T027 [P] [US2] Restreindre le filtrage `format=paper` et combinaisons papier (`pack_complet`, `paper_audio`, `paper_digital`) dans `lahatheque-backend/apps/catalog/views.py` strictement à `is_paper_available=True` de l'ouvrage maître
- [X] T028 [P] [US2] Corriger `lahatheque-frontend/components/catalog/book-action-buttons.tsx` pour afficher et rendre sélectionnable l'option "Livre papier" dès lors que `book.is_paper_available=True`, avec sélection de langue et repli gracieux de stock
- [X] T029 [US2] Dans `lahatheque-frontend/app/(auth)/login/page.tsx`, prendre en compte le paramètre d'URL `?redirect=` pour renvoyer directement vers `/checkout` dès la connexion réussie avec indicateur de transition éliminant tout écran blanc
- [X] T030 [US2] Dans `lahatheque-frontend/app/(public)/checkout/page.tsx`, ajouter le champ obligatoire du numéro de téléphone de contact pour la livraison physique et l'intégrer au payload
- [X] T031 [US2] Dans `lahatheque-backend/apps/commerce/serializers.py`, étendre les choix autorisés de `payment_provider` dans `CreateOrderSerializer` pour inclure `'mock'` et `'stripe'`
- [X] T032 Valider l'intégrité globale avec `python manage.py check` et `npx tsc --noEmit` sans aucune erreur

---

## Phase 8: Passation de Commande Administrateur via Combobox & Vente Comptoir Boutique (FR-015 à FR-017)

**Purpose**: Modernisation ergonomique de la sélection client via Combobox et gestion complète des ventes physiques au comptoir pour les clients sans compte

- [X] T033 [P] [US4] Étendre le modèle `Order` dans `lahatheque-backend/apps/commerce/models.py` (rendre `user` nullable `null=True, blank=True`, ajouter `is_pos_order`, `guest_name`, `guest_phone`, `guest_email`) et générer la migration Django associée
- [X] T034 [US4] Adapter le sérialiseur et l'endpoint de commande administrateur dans `lahatheque-backend/apps/commerce/manager_views.py` pour supporter `is_pos_order`, `guest_name`, `guest_phone`, `guest_email` et règlements comptoir immédiats (espèces, momo_direct)
- [X] T035 [P] [US4] Créer le composant Combobox de recherche client dans `lahatheque-frontend/components/admin/client-combobox.tsx` avec saisie réactive, menu déroulant flottant instantané (avatar, nom, rôle, téléphone) et fermeture automatique
- [X] T036 [US4] Dans `lahatheque-frontend/app/(dashboard)/admin/orders/page.tsx`, remplacer la liste statique volumineuse par `ClientCombobox` et intégrer la bascule « Compte existant » / « Client comptoir externe (sans compte) »
- [X] T037 [US4] Adapter le formulaire `OrderCreateForm` dans `lahatheque-frontend/components/student/OrderCreateForm.tsx` pour supporter le mode client comptoir externe (transmission des champs invités, modes de règlement comptoir et option remise immédiate en boutique)
- [X] T038 [US4] Dans la table des commandes `lahatheque-frontend/app/(dashboard)/admin/orders/page.tsx` et `/admin/sales`, afficher le badge « Vente Comptoir » et les coordonnées du client externe (`guest_name` • `guest_phone`)
- [X] T039 Valider l'intégrité globale du système avec `python manage.py check`, migration de base de données et `npx tsc --noEmit` sans erreur

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)** : Démarre immédiatement.
- **Foundational (Phase 2)** : Dépend de Phase 1 — BLOQUE l'implémentation des User Stories.
- **User Story 1 (Phase 3)** : Démarre dès la fin de Phase 2 — Indépendante de US2.
- **User Story 2 (Phase 4)** : Démarre dès la fin de Phase 2 — Peut être parallélisée ou exécutée après US1.
- **User Story 3 (Phase 5)** : S'intègre dans les composants US1 et US2.
- **Polish (Phase 6)** : Exécutée après achèvement de toutes les stories.

---

## Parallel Opportunities

- T001, T002, T003 peuvent être exécutées en parallèle.
- T005 et T006 peuvent être créées en parallèle.
- T012 (création du composant auth panel) peut être développé en parallèle de l'adaptation du backend.
- Les tests de validation du formulaire de contact (US1) et du tunnel checkout (US2) peuvent être réalisés de manière autonome.

---

## Implementation Strategy

### MVP First (User Story 1 & US2 Core)
1. Exécuter Phase 1 & Phase 2 (Fondations d'e-mails et types).
2. Compléter Phase 3 (Formulaire B2B & alertes 3 e-mails) → Valider immédiatement sur `/contact`.
3. Compléter Phase 4 (Identification checkout Option A, persistance panier & multi-formats) → Valider sur `/checkout`.
4. Compléter Phase 5 (Observabilité et console logs).
5. Exécuter Phase 6 (Validation finale et build Next.js).
