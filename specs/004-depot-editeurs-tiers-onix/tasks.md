# Tasks: Module 4 - Espace Éditeur Tiers & Synchronisation ONIX

**Feature Branch**: `004-depot-editeurs-tiers-onix`  
**Created**: 2026-08-20  
**Status**: Ready for Execution  

---

## Liste des Tâches Ordonnées

### Phase 1 : Types, Services & Backend Django
- [ ] **Task 1.1** : Compléter `lib/types/publisher.ts` avec toutes les structures de données (Ouvrages, ONIX, Clés API, Redevances, Logs DRM, Profil Maison d'Édition).
- [ ] **Task 1.2** : Implémenter les modèles Django dans `lahatheque-backend/apps/publishers_portal/models.py` (`PublisherProfile`, `PublisherBookDeposit`, `PublisherBatchImportLog`, `PublisherApiKey`, `PublisherRoyaltyPayment`, `PublisherAuditLog`).
- [ ] **Task 1.3** : Créer les vues Django dans `lahatheque-backend/apps/publishers_portal/publisher_views.py` et les enregistrer dans `urls.py`.
- [ ] **Task 1.4** : Mettre à jour `lib/services/publisher.ts` avec les fonctions `bffGet`, `bffPost`, `bffPatch`, `bffDelete` connectées à `/api/bff/publishers/*` avec fallbacks résilients.

### Phase 2 : Protection de Rôle & Navigation
- [ ] **Task 2.1** : Créer `app/(dashboard)/publisher/layout.tsx` avec `<AuthGuard requiredRoles={["publisher", "admin", "super_admin"]}>`.
- [ ] **Task 2.2** : Mettre à jour `components/dashboard-sidebar.tsx` et `components/ui/dashboard-header.tsx` pour l'ensemble des 8 routes éditeur.

### Phase 3 : Composants Features Éditeur (`components/features/publisher/`)
- [ ] **Task 3.1** : `validation-timeline.tsx` : Stepper animé 5 étapes (Dépôt -> Auto Check -> Examen LAHA -> Notification -> Publication) avec dates et descriptions.
- [ ] **Task 3.2** : `file-dropzone.tsx` : Glisser-déposer de manuscrits/archives avec barre de progression animée et vérification de formats.
- [ ] **Task 3.3** : `onix-report-viewer.tsx` : Tableau de diagnostic syntaxique ONIX 3.0 avec compteurs de succès/erreurs.
- [ ] **Task 3.4** : `api-key-modal.tsx` : Modale de génération de clé API avec copie automatique dans le presse-papier et toasts.
- [ ] **Task 3.5** : `revoke-api-key-modal.tsx` : Modale de confirmation avant révocation de clé API.

### Phase 4 : Pages & Écrans du Dashboard Éditeur (`app/(dashboard)/publisher/`)
- [ ] **Task 4.1** : `page.tsx` : Vue d'ensemble avec 4 KPI Cards réactives, parutions récentes et raccourcis d'action.
- [ ] **Task 4.2** : `catalog/page.tsx` : Catalogue éditeur avec `BookCover3D`, filtres thématiques, recherche instantanée et skeletons de chargement.
- [ ] **Task 4.3** : `catalog/[id]/page.tsx` : Fiche détaillée de l'ouvrage avec métadonnées, timeline de validation, configuration DRM et statistiques.
- [ ] **Task 4.4** : `catalog/new/page.tsx` : Formulaire multi-étapes de dépôt unitaire avec spinners d'attente sur boutons et validation inline.
- [ ] **Task 4.5** : `catalog/batch/page.tsx` : Téléversement de lot ONIX 3.0 / ZIP avec barre de progression et visualiseur de rapport.
- [ ] **Task 4.6** : `submissions/page.tsx` : Tableau des dépôts en cours de validation avec filtres de statut et motifs de correction.
- [ ] **Task 4.7** : `royalties/page.tsx` : Suivi des ventes, taux contractuel (22%), relevés mensuels PDF et bouton de demande de virement avec feedback.
- [ ] **Task 4.8** : `stats/page.tsx` : Graphiques de consultation, téléchargements et répartition géographique du lectorat.
- [ ] **Task 4.9** : `api/page.tsx` : Gestion des clés API REST, rotation de secret, documentation des endpoints.
- [ ] **Task 4.10** : `logs/page.tsx` : Journal de traçabilité DRM (tatouage, appareils, détection d'anomalies).
- [ ] **Task 4.11** : `profile/page.tsx` : Profil complet de la maison d'édition (NIF, RCCM, mandataire, IBAN/Momo, sécurité).

### Phase 5 : Contrôle Qualité & Validation
- [ ] **Task 5.1** : Vérification TypeScript (`npx tsc --noEmit --skipLibCheck`) avec 0 erreur.
- [ ] **Task 5.2** : Audit zéro code hexadécimal en dur et zéro emoji.
- [ ] **Task 5.3** : Validation de la responsivité mobile (< 400px).
