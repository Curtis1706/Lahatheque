# Tasks: Refonte de la Suite « Gestion des Finances »

**Feature**: Refonte de la Suite « Gestion des Finances »
**Branch**: `003-finance-management-suite`
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialisation du socle commun de typage TypeScript et de services API

- [x] T001 [P] Déclarer les interfaces TypeScript des ventes, versements et récapitulatif multi-partenaires dans lahatheque-frontend/lib/types/admin-finance.ts
- [x] T002 [P] Mettre à jour lahatheque-frontend/lib/types/admin.ts pour réexporter les types financiers unifiés

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Endpoints backend Django et connecteurs BFF requis avant toute interface

- [x] T003 Étendre le modèle PayoutRequest dans lahatheque-backend/apps/rights/models.py avec transaction_reference, payout_date, receipt_file, et rejection_reason
- [x] T004 Exécuter les migrations Django pour PayoutRequest dans lahatheque-backend/apps/rights/migrations/
- [x] T005 [P] Implémenter l'endpoint backend d'agrégation exhaustive et dynamique du Chiffre d'Affaires dans lahatheque-backend/apps/reporting/admin_views.py
- [x] T006 [P] Implémenter les endpoints de gestion des versements (liste paginée, KPIs, validate, reject) dans lahatheque-backend/apps/rights/views.py
- [x] T007 Déclarer les URLs de l'API de versement et de ventes dans lahatheque-backend/apps/reporting/urls.py et lahatheque-backend/apps/rights/urls.py

**Checkpoint**: Socle backend opérationnel - l'implémentation des pages frontend peut commencer.

---

## Phase 3: User Story 1 - Supervision Exhaustive & Justification Dynamique du CA (Priority: P1) - MVP

**Goal**: Réconcilier 100 % du Chiffre d'Affaires dynamique sur `/admin/sales` avec tableau à lignes de commandes dépliables en accordéon pour afficher les articles/formats individuels sans encombrement.

**Independent Test**: Ouvrir `/admin/sales`, vérifier que la somme arithmétique directe des lignes de commandes payées égale exactement le montant consolidé affiché dans l'en-tête, et déployer l'accordéon d'une commande pour afficher ses articles.

- [x] T008 [P] [US1] Implémenter la fonction de service API getAdminConsolidatedSales(params) dans lahatheque-frontend/lib/services/admin.ts
- [x] T009 [P] [US1] Créer le composant d'accordéon de détail d'une commande (OrderItemsAccordionRow) dans lahatheque-frontend/components/features/admin/order-items-accordion-row.tsx
- [x] T010 [US1] Refactoriser lahatheque-frontend/app/(dashboard)/admin/sales/page.tsx pour afficher les commandes consolidées avec accordéons dépliables et ventilation dynamique par canal sans décalage
- [x] T011 [US1] Connecter les filtres par canal, par période et plage horaire avec recalcul instantané des métriques consolidées dans lahatheque-frontend/app/(dashboard)/admin/sales/page.tsx

**Checkpoint**: User Story 1 est autonome, testable et livre le MVP de réconciliation financière.

---

## Phase 4: User Story 2 - Gestion Dédiée des Demandes de Versement (Priority: P1)

**Goal**: Fournir la nouvelle page autonome `/admin/payouts` avec KPIs décisionnels, data table épuré et modales d'instruction (validation avec référence/justificatif, rejet avec motif).

**Independent Test**: Ouvrir `/admin/payouts`, constater les 4 compteurs de synthèse, valider une demande avec référence bancaire, constater son passage à l'état payé et le décrément du montant en attente.

- [x] T012 [P] [US2] Implémenter les fonctions de service getAdminPayouts(), getAdminPayoutKpis(), validatePayoutRequest() et rejectPayoutRequest() dans lahatheque-frontend/lib/services/admin.ts
- [x] T013 [P] [US2] Créer la modale de validation de versement avec référence de paiement et upload de justificatif facultatif dans lahatheque-frontend/components/features/admin/payout-validation-modal.tsx
- [x] T014 [P] [US2] Créer la modale de rejet de versement avec motif obligatoire dans lahatheque-frontend/components/features/admin/payout-rejection-modal.tsx
- [x] T015 [US2] Créer la nouvelle page dédiée aux versements dans lahatheque-frontend/app/(dashboard)/admin/payouts/page.tsx intégrant KPIs, barre de filtres/recherche, data table sobre et modales d'actions

**Checkpoint**: User Story 2 est opérationnelle et assure l'instruction complète des décaissements.

---

## Phase 5: User Story 3 - Consolidation 360° et Réconciliation sur Finances Globales (Priority: P2)

**Goal**: Proposer sur `/admin/finance` une vue financière réconciliée 360° et un tableau récapitulatif multi-partenaires (auteurs, éditeurs, universités) avec onglets et lignes dépliables.

**Independent Test**: Ouvrir `/admin/finance`, vérifier la balance financière consolidée (recettes vs droits vs marge), filtrer le tableau récapitulatif par onglets de rôle et déplier un partenaire pour consulter ses livres/formats.

- [x] T016 [P] [US3] Implémenter la vue backend partner-royalties regroupant auteurs, éditeurs tiers et universités dans lahatheque-backend/apps/reporting/admin_views.py
- [x] T017 [P] [US3] Implémenter la fonction de service API getAdminPartnerRoyaltiesSummary() dans lahatheque-frontend/lib/services/admin.ts
- [x] T018 [US3] Refactoriser lahatheque-frontend/app/(dashboard)/admin/finance/page.tsx avec les cartes de synthèse 360°, la barre d'onglets de filtrage par rôle (`Tous`, `Auteurs`, `Éditeurs`, `Universités`) et les lignes d'accordéon dépliables par ayant-droit

**Checkpoint**: User Story 3 est complète et réconcilie la vision financière globale.

---

## Phase 6: User Story 4 - Épuration de la Gestion des Redevances & Droits (Priority: P2)

**Goal**: Supprimer les boutons orphelins de l'en-tête de `/admin/royalties`, retirer la section déplacée des demandes de versement et recentrer l'écran sur les barèmes et taux dérogatoires.

**Independent Test**: Ouvrir `/admin/royalties`, vérifier l'absence des 3 boutons orphelins, constater le retrait de la section versements et vérifier la mise à jour fluide d'un taux dérogatoire.

- [x] T019 [US4] Nettoyer l'en-tête de lahatheque-frontend/app/(dashboard)/admin/royalties/page.tsx en supprimant les trois boutons `Auteurs (2)`, `Éditeurs (0)` et `Universités (2)`
- [x] T020 [US4] Retirer la section Demandes de versement et relevés de redevances de lahatheque-frontend/app/(dashboard)/admin/royalties/page.tsx
- [x] T021 [US4] Réorganiser la table des barèmes dérogatoires par partenaire avec pagination fluide et modale d'édition dans lahatheque-frontend/app/(dashboard)/admin/royalties/page.tsx

**Checkpoint**: User Story 4 est achevée et libère l'interface de tout encombrement.

---

## Phase 7: User Story 5 - Navigation Unifiée dans le Menu « Gestion des Finances » (Priority: P3)

**Goal**: Mettre à jour la barre latérale pour intégrer les 4 sous-menus ordonnés avec gestion active de la navigation.

**Independent Test**: Ouvrir la sidebar admin, vérifier les 4 sous-menus sous « Gestion des Finances » et tester la persistance de l'état actif sur les 4 pages.

- [x] T022 [US5] Ajouter le sous-lien « Demandes de Versement » (`/admin/payouts`) dans la configuration du menu Gestion des Finances dans lahatheque-frontend/components/dashboard-sidebar.tsx
- [x] T023 [US5] Vérifier la gestion automatique de la surbrillance active et de l'ouverture du sous-menu sur `/admin/payouts` dans lahatheque-frontend/components/dashboard-sidebar.tsx

---

## Phase 8: Polish, Responsive & Cross-Cutting Concerns

**Purpose**: Validation de conformité, performance et assurance qualité

- [x] T024 [P] Vérifier l'absence totale de code couleur hexadécimal en dur dans les nouvelles pages et composants (conformité tokens sémantiques)
- [x] T025 [P] Vérifier l'absence totale d'émojis dans les textes, modales et interfaces (conformité icônes Lucide)
- [x] T026 Valider le comportement responsive mobile sous 400px sur les 4 pages de la suite financière
- [x] T027 Exécuter la compilation stricte TypeScript via npx tsc --noEmit dans lahatheque-frontend/
- [x] T028 Exécuter les tests de non-régression Django via pytest dans lahatheque-backend/

---

## Phase 9: User Story 6 - Gestion des Commandes, Paniers Abandonnés & Console d'Actions (/admin/orders) (Priority: P1)

**Goal**: Superviser 100 % des commandes et tentatives de paiement avec cycle de vie complet (`paid`, `pending`, `credit`, `abandoned`, `failed`, `cancelled`), bascule automatique après 24h, et console d'actions rapides (vérification Moneroo en 1 clic, validation manuelle tous modes, relance panier, facture PDF).

**Independent Test**: Ouvrir `/admin/orders`, filtrer par statut `Paniers abandonnés`, constater le calcul du manque à gagner, exécuter une validation manuelle en espèces sur une commande en attente, et constater la mise à jour immédiate des KPIs.

- [x] T029 [P] [US6] Étendre le modèle Order avec le statut 'abandoned' et les champs d'audit (abandoned_at, last_reminder_sent_at, manual_payment_reference) dans lahatheque-backend/apps/commerce/models.py
- [x] T030 [P] [US6] Créer la tâche de bascule automatique 24h des commandes pending vers abandoned dans lahatheque-backend/apps/commerce/tasks.py
- [x] T031 [US6] Implémenter la vue backend AdminOrdersListView avec filtres par statut de paiement, recherche textuelle et KPIs financiers dans lahatheque-backend/apps/commerce/views.py
- [x] T032 [P] [US6] Implémenter l'endpoint de relance de panier abandonné AdminOrderRemindView dans lahatheque-backend/apps/commerce/views.py
- [x] T033 [P] [US6] Déclarer les fonctions de service API getAdminOrders(), confirmManualOrderPayment() et remindAbandonedOrder() dans lahatheque-frontend/lib/services/admin.ts
- [x] T034 [P] [US6] Créer le composant de modale d'actions commande (confirmation tous modes et relance) dans lahatheque-frontend/components/features/admin/order-action-modal.tsx
- [x] T035 [US6] Refactoriser lahatheque-frontend/app/(dashboard)/admin/orders/page.tsx avec onglets de filtrage sémantiques, KPIs financiers réconciliés et console d'actions rapides sur chaque ligne

---

## Phase 10: User Story 7 - Grand Livre Comptable, Marge Nette & Clôtures (/admin/finance, /admin/sales) (Priority: P1)

**Goal**: Fournir l'export officiel du Grand Livre Comptable (Excel/CSV et PDF officiel) et consolider la marge nette plateforme après déduction des redevances et charges d'impression.

**Independent Test**: Télécharger le Grand Livre Comptable depuis `/admin/sales`, vérifier la présence des colonnes Bruts, Commissions Moneroo, Nets et Auditeur, puis vérifier sur `/admin/finance` le calcul de la marge nette conservée par LAHAThèque.

- [x] T036 [P] [US7] Implémenter la vue d'export du Grand Livre Comptable AccountingLedgerExportView (formats xlsx, csv, pdf) dans lahatheque-backend/apps/reporting/admin_views.py
- [x] T037 [US7] Intégrer les boutons d'export Grand Livre Comptable et Bordereau Récapitulatif dans lahatheque-frontend/app/(dashboard)/admin/sales/page.tsx
- [x] T038 [US7] Enrichir lahatheque-frontend/app/(dashboard)/admin/finance/page.tsx avec les indicateurs de marge nette plateforme, créances clients à recouvrer et manque à gagner des abandons

---

## Phase 11: Validation Finale, Non-Régression & Tests

**Purpose**: Validation rigoureuse de bout en bout de l'ensemble de la suite financière

- [x] T039 [P] Vérifier l'absence totale de code couleur hexadécimal en dur et d'émojis dans les nouveaux composants
- [x] T040 Valider le comportement responsive mobile sous 400px sur `/admin/orders`, `/admin/sales` et `/admin/finance`
- [x] T041 Exécuter la compilation stricte TypeScript via npx tsc --noEmit dans lahatheque-frontend/
- [x] T042 Exécuter les tests unitaires et d'intégration Django dans lahatheque-backend/

---

## Dependencies & Execution Order

```text
Phase 1 à 8 (Socle & Écrans Payouts/Sales existants)
      ↓
Phase 9 (US6: Gestion des Commandes, Paniers Abandonnés & Console d'Actions Admin)
      ↓
Phase 10 (US7: Grand Livre Comptable, Marge Nette & Clôtures)
      ↓
Phase 11 (Validation Finale, TypeScript & Tests)
```
