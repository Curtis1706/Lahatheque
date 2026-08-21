# Tasks: Module 5 - Espace Université, Bouquets Documentaires & Redevances 15%

**Feature Branch**: `005-espace-universite-bouquets-redevances`  
**Created**: 2026-08-20  
**Status**: Ready for Execution  

---

## Liste des Tâches Ordonnées

### Phase 1 : Types, Services & Backend Django
- [ ] **Task 1.1** : Créer `lib/types/university.ts` avec les interfaces TypeScript : `UniversityKpis`, `UniversityBouquet`, `UniversityBookCatalogItem`, `UniversityPaperOrder`, `UniversityStudentAffiliationData`, `UniversityRoyaltyStatementData`, `UniversityProfileData`.
- [ ] **Task 1.2** : Implémenter les modèles Django dans `lahatheque-backend/apps/university_portal/models.py` (`UniversityProfile`, `UniversityFaculty`, `UniversityBouquetSubscription`, `UniversityPaperOrder`, `UniversityStudentAffiliation`, `UniversityRoyaltyStatement`).
- [ ] **Task 1.3** : Créer les vues Django dans `lahatheque-backend/apps/university_portal/university_views.py` et les enregistrer dans `urls.py`.
- [ ] **Task 1.4** : Créer `lib/services/university.ts` avec les méthodes `bffGet`, `bffPost`, `bffPatch`, `bffDelete` connectées à `/api/bff/university/*` avec fallbacks résilients et fonction d'export Word.

### Phase 2 : Protection de Rôle & Navigation
- [x] **Task 2.1** : Créer `app/(dashboard)/university/layout.tsx` avec `<AuthGuard requiredRoles={["university", "admin", "super_admin"]}>`.
- [x] **Task 2.2** : Mettre à jour `components/dashboard-sidebar.tsx` et `components/ui/dashboard-header.tsx` pour l'ensemble des 8 routes Université.

### Phase 3 : Composants Features Université (`components/features/university/`)
- [ ] **Task 3.1** : `bouquet-card.tsx` : Carte de bouquet documentaire avec souscription animée, indicateur de chargement et bouton d'export Word (.docx) / PDF.
- [ ] **Task 3.2** : `faculty-stats-chart.tsx` : Visualiseur de statistiques par faculté et discipline avec barres de progression et métriques.
- [ ] **Task 3.3** : `student-affiliation-table.tsx` : Tableau interactif des étudiants avec validation inline, filtres et modale de suspension.
- [ ] **Task 3.4** : `university-royalty-card.tsx` : Carte financière de redevance 15% avec simulateur et bouton de demande de virement (seuil 100 000 XOF).
- [ ] **Task 3.5** : `word-export-dialog.tsx` : Modale de téléchargement du catalogue officiel de bouquet en document Word.

### Phase 4 : Pages & Écrans du Dashboard Université (`app/(dashboard)/university/`)
- [ ] **Task 4.1** : `page.tsx` : Vue d'ensemble avec 4 `KpiCard` réactives, répartition d'usage par faculté et raccourcis.
- [ ] **Task 4.2** : `bouquets/page.tsx` : Gestion et souscription des bouquets documentaires avec filtres thématiques et export Word.
- [ ] **Task 4.3** : `catalog/page.tsx` : Catalogue complet des ouvrages affiliés avec filtres par faculté/discipline, bouton d'ouverture dans la liseuse et panier papier.
- [ ] **Task 4.4** : `stats/page.tsx` : Statistiques avancées de consultations, pages lues et temps de lecture par faculté et par pays.
- [ ] **Task 4.5** : `affiliations/page.tsx` : Gestion des affiliations étudiants et enseignants avec recherche matricule et approbation instantanée.
- [ ] **Task 4.6** : `purchases/page.tsx` : Commandes de livres papier institutionnels avec suivi d'expédition et bons de commande PDF.
- [ ] **Task 4.7** : `purchases/new/page.tsx` : Passation de commande papier groupée pour les bibliothèques de campus avec calcul automatique du devis.
- [ ] **Task 4.8** : `royalties/page.tsx` : Redevances universitaires de 15%, relevés mensuels et demande de versement bancaire / Mobile Money.
- [ ] **Task 4.9** : `profile/page.tsx` : Fiche d'identité de l'établissement, liste des UFRs/facultés, domaines autorisés (`@uac.bj`), plages IP campus et sécurité.

### Phase 5 : Contrôle Qualité, Migrations & Build
- [ ] **Task 5.1** : Exécuter `makemigrations` et `migrate` Django.
- [ ] **Task 5.2** : Vérification TypeScript (`npx tsc --noEmit --skipLibCheck`) avec 0 erreur.
- [ ] **Task 5.3** : Test de build de production (`npm run build`) validé à 100%.
- [ ] **Task 5.4** : Audit Zéro Émoji, couleurs sémantiques pures et ergonomie mobile (< 400px).
