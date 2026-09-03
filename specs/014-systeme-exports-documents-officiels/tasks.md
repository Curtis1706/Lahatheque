# Tasks: Module 14 - Système Universel d'Exportation & Documents Officiels

**Feature**: `014-systeme-exports-documents-officiels`  
**Status**: Ready for Execution

---

## Phase 1: Service Core d'Exportation Universel

- [ ] **Task 1.1** : Créer `lahatheque-frontend/lib/services/export-service.ts` avec la structure de génération PDF officielle (En-tête légal LAHAThèque, IFU/RCCM, Logo, Styles Navy & Gold, QR Code, Pagination), moteur CSV UTF-8 BOM, moteur Excel et moteur Word (.doc).

---

## Phase 2: Raccordement des Boutons de l'Espace Administrateur

- [ ] **Task 2.1** : Brancher les boutons d'export PDF, CSV réel et Excel sur `app/(dashboard)/admin/reports/page.tsx`.
- [ ] **Task 2.2** : Brancher le bouton « Exporter le Journal » sur `app/(dashboard)/admin/sales/page.tsx`.
- [ ] **Task 2.3** : Brancher le bouton « Exporter Audit (CSV) » sur `app/(dashboard)/admin/security/traces/page.tsx`.
- [ ] **Task 2.4** : Brancher la génération de bordereaux sur `app/(dashboard)/admin/royalties/page.tsx`.

---

## Phase 3: Raccordement des Boutons Espace Manager & Logistique

- [ ] **Task 3.1** : Brancher la génération des rapports de stock et livraisons en PDF et CSV/Excel sur `app/(dashboard)/manager/reports/page.tsx`.

---

## Phase 4: Raccordement des Boutons Espace Chef Maquettiste

- [ ] **Task 4.1** : Brancher l'export CSV de l'historique des validations BAT sur `app/(dashboard)/chief-layout/history/page.tsx`.

---

## Phase 5: Raccordement des Boutons Espace Universités & Bouquets

- [ ] **Task 5.1** : Brancher le téléchargement du relevé trimestriel PDF officiel sur `app/(dashboard)/university/royalties/page.tsx`.
- [ ] **Task 5.2** : Brancher la génération de bibliographie Word sur `components/features/university/bouquet-card.tsx` et `app/(dashboard)/student/university/page.tsx`.

---

## Phase 6: Raccordement des Boutons Espace Auteurs, Éditeurs, Étudiants & Grossistes

- [ ] **Task 6.1** : Brancher le téléchargement du relevé de redevances certifié PDF sur `app/(dashboard)/author/royalties/page.tsx` et `app/(dashboard)/publisher/royalties/page.tsx`.
- [ ] **Task 6.2** : Brancher le téléchargement de facture officielle PDF sur `app/(dashboard)/student/orders/page.tsx` et `components/student/orders/OrderDetailModal.tsx`.
- [ ] **Task 6.3** : Brancher le téléchargement du bon de commande / facture proforma sur `app/(dashboard)/wholesaler/orders/[id]/page.tsx`.

---

## Phase 7: Validation Globale & Compilation

- [ ] **Task 7.1** : Exécuter `pnpm build` et valider l'absence d'erreurs TypeScript sur les 155 routes.
