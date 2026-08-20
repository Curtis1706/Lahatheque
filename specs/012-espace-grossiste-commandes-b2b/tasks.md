# Tasks: Module 12 - Espace Grossiste B2B

**Feature Branch**: `012-espace-grossiste-commandes-b2b`  
**Created**: 2026-08-20  

---

## Liste des Tâches Ordonnées

### Phase 1 : Types, Services & Mocks
- [x] **Task 1.1** : Enrichir `lib/types/wholesaler.ts` avec les statuts, transporteurs, NIF/RCCM et grilles de remises.
- [x] **Task 1.2** : Compléter `lib/mock/wholesaler.ts` avec des commandes réalistes multi-pays (Bénin, Sénégal, Côte d'Ivoire, Togo, RDC) et des ouvrages avec miniatures de couvertures.
- [x] **Task 1.3** : Compléter `lib/services/wholesaler.ts` avec toutes les fonctions CRUD et gestion d'erreurs normalisée.

### Phase 2 : Protection de Rôle & Navigation
- [x] **Task 2.1** : Créer `app/(dashboard)/wholesaler/layout.tsx` avec `<AuthGuard requiredRoles={["wholesaler", "admin", "super_admin"]}>`.
- [x] **Task 2.2** : Mettre à jour `components/dashboard-sidebar.tsx` et `components/ui/dashboard-header.tsx` pour l'ensemble des routes grossiste.

### Phase 3 : Composants Features B2B (`components/features/wholesaler/`)
- [x] **Task 3.1** : `wholesale-cart-drawer.tsx` : Tiroir latéral interactif pour gestion des quantités papier/numérique, sous-totaux et seuils minimaux.
- [x] **Task 3.2** : `cancel-order-modal.tsx` : Modale d'annulation sécurisée avec saisie obligatoire d'un motif.
- [x] **Task 3.3** : `wholesale-order-stepper.tsx` : Stepper animé et responsive retraçant les 4 étapes de la commande B2B.

### Phase 4 : Pages du Dashboard Grossiste (`app/(dashboard)/wholesaler/`)
- [x] **Task 4.1** : `page.tsx` : Vue d'ensemble avec 4 KPI Cards réactives, graphique Donut de répartition et commandes récentes.
- [x] **Task 4.2** : `catalog/page.tsx` : Grille catalogue avec `BookCover3D`, filtres de discipline, recherche instantanée et intégration du panier.
- [x] **Task 4.3** : `orders/page.tsx` : Liste des commandes groupées avec `DataTable`, filtres de statut et bouton d'action.
- [x] **Task 4.4** : `orders/new/page.tsx` : Récapitulatif de validation de commande groupée avec coordonnées de livraison.
- [x] **Task 4.5** : `orders/[id]/page.tsx` : Fiche détaillée de commande avec stepper, articles, transporteur et génération de proforma PDF.
- [x] **Task 4.6** : `notifications/page.tsx` : Centre de notifications et alertes réapprovisionnement.
- [x] **Task 4.7** : `profile/page.tsx` : Profil d'entreprise grossiste (NIF, RCCM, entrepôt, contact d'astreinte, sécurité).

### Phase 5 : Contrôle Qualité & Validation
- [x] **Task 5.1** : Vérification TypeScript (`npx tsc --noEmit --skipLibCheck`) avec 0 erreur.
- [x] **Task 5.2** : Audit zéro code hexadécimal en dur et zéro emoji.
- [x] **Task 5.3** : Validation de la responsivité mobile (< 400px).
