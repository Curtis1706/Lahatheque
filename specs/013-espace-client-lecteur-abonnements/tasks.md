# Tasks: Module 13 - Espace Client, Lecteur & Étudiant (LAHAThèque v3.2)

**Feature Branch**: `013-espace-client-lecteur-abonnements`  
**Created**: 2026-08-20  
**Status**: 100% Implemented & Validated  

---

## Liste des Tâches Ordonnées

### Phase 1 : Typage TypeScript, Couche de Données Réelle & Services BFF
- [x] **Task 1.1** : Mettre à jour et enrichir [`lib/types/student.ts`](file:///e:/Lahatheque/lahatheque-frontend/lib/types/student.ts) pour couvrir l'ensemble des cas d'usage (livres numériques, audio streaming, commandes papier avec tracking, affiliation universitaire matriculaire, historique d'étude, modèles Django unifiés).
- [x] **Task 1.2** : Configuration de la couche de données avec BFF Next.js connecté en temps réel aux endpoints Django (`/api/bff/student/*`), garantissant le principe *zéro mock en dur*.
- [x] **Task 1.3** : Mettre à jour [`lib/services/student.ts`](file:///e:/Lahatheque/lahatheque-frontend/lib/services/student.ts) avec toutes les méthodes asynchrones (`getStudentOverview`, `getStudentBooks`, `toggleStudentFavorite`, `updateReadingProgress`, `getStudentHistoryStats`, `getStudentOrders`, `createPaperOrder`, `getStudentUniversity`, `requestAffiliation`, `getStudentCatalog`, `getStudentProfile`, `updateStudentProfile`).

### Phase 2 : Composants Features Spécialisés (`components/features/student/`)
- [x] **Task 2.1** : `book-card.tsx` : Carte d'ouvrage avec couverture HD visible, jauges de lecture dorées, badges de formats, modal d'extrait gratuit, commande papier intégrée et toasts de favoris (`sonner`).
- [x] **Task 2.2** : `book-list-item.tsx` : Version liste compacte pour la bibliothèque avec affichage du format, date de dernière lecture, progression et menu d'actions contextuelles.
- [x] **Task 2.3** : Lecture audio assistée (TTS) intégrée nativement dans la liseuse protégée (`app/read/[token]`), avec synthèse vocale en temps réel, vitesse adaptative et surlignage synchronisé (zéro fichier MP3 externe).
- [x] **Task 2.4** : `book-sample-modal.tsx` : Visionneuse d'extrait gratuit sécurisée (15 premières pages) avec filigrane de prévisualisation, résumé et ouverture directe de la liseuse.
- [x] **Task 2.5** : `paper-order-modal.tsx` : Modale de commande de livre papier physique avec calcul des frais, saisie d'adresse, validation asynchrone et confirmation immédiate.
- [x] **Task 2.6** : `student-kpi-charts.tsx` : Graphiques de répartition par discipline et heures d'étude basés sur les composants interactifs 21st.dev (`ActivityChartCard`, `ActivityCard`).
- [x] **Task 2.7** : `view-toggle.tsx` : Sélecteur de mode d'affichage Grille / Liste avec transitions fluides.

### Phase 3 : Pages & Écrans du Dashboard Client (`app/(dashboard)/student/`)
- [x] **Task 3.1** : `page.tsx` : Vue d'ensemble avec bannière de reprise de lecture, 4 KPI cards, carrousel des livres récents et raccourci audio.
- [x] **Task 3.2** : `books/page.tsx` : Ma Bibliothèque avec bascule Grille/Liste, filtres par format (EPUB, PDF, Audio), favoris réactifs et lecteur audio intégré.
- [x] **Task 3.3** : `catalog/page.tsx` : Catalogue & Découverte avec recherche instantanée debouncée, filtres par discipline/pays/langue et modales d'extraits gratuits en 1 clic.
- [x] **Task 3.4** : `catalog/[id]/page.tsx` : Fiche détaillée de l'ouvrage avec prévisualisation d'extrait sans inscription, options d'achat numérique/papier, lecteur audio et statut d'accès campus.
- [x] **Task 3.5** : `history/page.tsx` : Historique de Lecture & Statistiques d'Étude avec graphiques d'activité 21st.dev, streak de lecture et timeline détaillée des sessions.
- [x] **Task 3.6** : `orders/page.tsx` : Mes Achats & Commandes Papier avec timeline transporteur, suivi de colis en direct, copie de tracking et reçus PDF.
- [x] **Task 3.7** : `subscriptions/page.tsx` : Modes d'Accès & Bouquets avec comparateur des formules institutionnelles, achats unitaires et domaine public.
- [x] **Task 3.8** : `university/page.tsx` : Mon Université & Bouquets Campus avec formulaire de validation matriculaire sans email institutionnel exigé, dropzone de carte d'étudiant et accès direct aux packs faculté.
- [x] **Task 3.9** : `profile/page.tsx` : Mon Profil Lecteur avec avatar, coordonnées, pays de résidence et gestion de l'affiliation campus.

### Phase 4 : Contrôle Qualité, TypeScript & Production Build
- [x] **Task 4.1** : Typage TypeScript strict validé sans aucune erreur.
- [x] **Task 4.2** : Validation du build Next.js (`pnpm build` -> 100% de succès, exit code 0).
