# Tasks : Distinction Étanche Universités Partenaires vs Universités Clientes

**Feature** : `009-university-partner-client-split`  
**Spec** : [spec.md](file:///e:/Lahatheque/specs/009-university-partner-client-split/spec.md) | **Plan** : [plan.md](file:///e:/Lahatheque/specs/009-university-partner-client-split/plan.md)  
**Status** : Ready for Implementation

---

## Phase 1 : Initialisation et Configuration (Setup)

**Objectif** : Préparer l'environnement et vérifier les contrats d'échange avant toute modification de code.

- [X] T001 Vérifier l'état de la branche de travail `009-university-partner-client-split` et la conformité des prérequis speckit
- [X] T002 [P] Valider la conformité des schémas JSON Schema dans `specs/009-university-partner-client-split/contracts/`

---

## Phase 2 : Socle Fondamental (Modèle de Données & Types)

**Objectif** : Établir les structures de données, migrations et types partagés indispensables à toutes les user stories.

- [X] T003 Ajouter le champ `institution_type` avec choix `'partner'` et `'client'` sur le modèle `Institution` dans `lahatheque-backend/apps/partners/models.py`
- [X] T004 Générer et appliquer la migration Django avec opération `RunPython` assignant `partner` à UAC, UP, UNSTIM, UNA et `client` aux autres établissements dans `lahatheque-backend/apps/partners/migrations/`
- [X] T005 [P] Mettre à jour `InstitutionSerializer` et `InstitutionDetailSerializer` pour exposer `institution_type` dans `lahatheque-backend/apps/partners/serializers.py`
- [X] T006 [P] Mettre à jour les interfaces TypeScript (`InstitutionType`, `UniversityKpis`, `AdminInstitutionPayload`) dans `lahatheque-frontend/lib/types/university.ts` et `lahatheque-frontend/lib/types/admin.ts`

**Point de contrôle** : Le socle de données est appliqué et les 4 universités historiques ont le statut `'partner'` certifié en base.

---

## Phase 3 : User Story 1 - Expérience Universités Clientes (Priorité : P1) - MVP

**Objectif** : Offrir aux universités clientes (souscriptrices) un espace totalement épuré, centré sur leurs abonnements campus et commandes papier, avec masquage absolu des redevances.

**Critère de Test Indépendant** : Se connecter avec un compte d'université cliente et vérifier que le menu redevances est absent, que l'accueil n'affiche aucun terme ni calcul de redevance, et que toute tentative d'accès à `/university/royalties` est bloquée (redirection + HTTP 403).

- [X] T007 [US1] Adapter l'endpoint `UniversityKpisView` dans `lahatheque-backend/apps/partners/university_views.py` pour renvoyer `total_royalties_available: 0`, `revenue_split: null` et les métriques de bouquets actifs pour les établissements clients
- [X] T008 [US1] Ajouter la garde de contrôle d'accès renvoyant HTTP 403 Forbidden sur `UniversityRoyaltiesView` et `UniversityRoyaltyWithdrawView` pour les institutions clientes dans `lahatheque-backend/apps/partners/university_views.py`
- [X] T009 [US1] Adapter la logique de récupération du catalogue dans `lahatheque-backend/apps/catalog/views.py` ou `apps/partners/university_views.py` pour afficher les livres issus des bouquets actifs souscrits (`UniversityBouquetSubscription`) lorsqu'un établissement client consulte le catalogue
- [X] T010 [US1] Masquer conditionnellement le lien « Redevances » dans la barre latérale `lahatheque-frontend/components/dashboard-sidebar.tsx` et dans la navigation mobile `lahatheque-frontend/components/ui/mobile-bottom-nav.tsx` lorsque `institution_type === 'client'`
- [X] T011 [US1] Adapter le composant d'accueil `lahatheque-frontend/app/(dashboard)/university/page.tsx` pour afficher les 4 KPI campus (Bouquets souscrits, Ouvrages accessibles, Lectures campus, Commandes physiques), masquer le DonutChart de répartition de CA et afficher les offres de bouquets à souscrire
- [X] T012 [US1] Ajouter la redirection de sécurité vers `/university` sur `lahatheque-frontend/app/(dashboard)/university/royalties/page.tsx` si un utilisateur d'une université cliente tente d'accéder à l'écran par URL directe

**Point de contrôle** : L'expérience Université Cliente est 100 % opérationnelle, zéro mention de redevance, catalogue des abonnements connecté.

---

## Phase 4 : User Story 2 - Portail Droits & Redevances Universités Partenaires (Priorité : P1)

**Objectif** : Réserver l'espace de suivi des droits, parts d'audience et redevances conventionnées aux 4 universités partenaires (UAC, UP, UNSTIM, UNA), en supprimant tout bouton ou offre de souscription de bouquets.

**Critère de Test Indépendant** : Se connecter avec un compte UAC, UP, UNSTIM ou UNA et vérifier que les boutons de souscription de bouquets sont absents, que les redevances et parts d'audience réelles s'affichent correctement, et que toute tentative d'accès à `/university/bouquets` redirige vers `/university/royalties`.

- [X] T013 [US2] Bloquer l'endpoint de souscription `UniversityBouquetSubscribeView` avec un code HTTP 400/403 pour les institutions de type `'partner'` dans `lahatheque-backend/apps/partners/university_views.py`
- [X] T014 [US2] Masquer conditionnellement le lien « Bouquets Documentaires » dans `lahatheque-frontend/components/dashboard-sidebar.tsx` et `lahatheque-frontend/components/ui/mobile-bottom-nav.tsx` lorsque `institution_type === 'partner'`
- [X] T015 [US2] Adapter le composant d'accueil `lahatheque-frontend/app/(dashboard)/university/page.tsx` pour les partenaires : afficher le badge « Portail Université Partenaire », les 4 KPI (Ouvrages catalogue, Part d'audience réelle, Lectures enregistrées, Redevances disponibles), le DonutChart de répartition de CA et masquer le bouton « Souscrire un Bouquet »
- [X] T016 [US2] Implémenter la redirection automatique vers `/university/royalties` sur `lahatheque-frontend/app/(dashboard)/university/bouquets/page.tsx` si un compte partenaire accède à la page des bouquets, avec toast explicatif

**Point de contrôle** : L'expérience Partenaire est purement axée sur la valorisation des droits et la transparence financière, sans aucune proposition d'achat de bouquets.

---

## Phase 5 : User Story 3 - Gestion Administrative & Protection d'Intégrité (Priorité : P1)

**Objectif** : Permettre aux administrateurs de qualifier chaque institution comme « Partenaire » ou « Cliente », avec unicité du compte modérateur et verrouillage protecteur sur les 4 universités historiques.

**Critère de Test Indépendant** : Créer un établissement client sans taux de redevance, vérifier le blocage de doublon de modérateur et tenter de modifier le statut de l'UAC en « Cliente » pour constater le verrouillage d'intégrité.

- [X] T017 [US3] Mettre à jour `AdminUsersView.post` dans `lahatheque-backend/apps/accounts/admin_views.py` pour enregistrer `institution_type`, forcer `royalty_rate = 0` pour les clientes et empêcher la création d'un second modérateur si l'institution en possède déjà un
- [X] T018 [US3] Ajouter la validation d'intégrité dans `lahatheque-backend/apps/partners/views.py` (`InstitutionViewSet`) et dans le modèle `Institution` interdisant formellement de passer `institution_type` à `'client'` pour les codes `['UAC', 'UP', 'UNSTIM', 'UNA']`
- [X] T019 [US3] Mettre à jour la modale de création `lahatheque-frontend/components/features/admin/create-account-modal.tsx` : sélecteur Partenaire/Cliente, masquage du taux pour les clientes et alerte si l'institution sélectionnée a déjà un modérateur
- [X] T020 [US3] Mettre à jour la modale d'édition `lahatheque-frontend/components/features/admin/edit-university-user-modal.tsx` : sélecteur du type d'institution avec champ verrouillé et badge explicatif pour UAC, UP, UNSTIM, UNA
- [X] T021 [US3] Adapter la table d'administration des universités dans `lahatheque-frontend/app/(dashboard)/admin/users/[role]/page.tsx` : badge visuel « Partenaire » ou « Cliente », masquage du taux pour les clientes

**Point de contrôle** : L'administration gère sans ambiguïté la typologie des universités et les 4 partenaires historiques sont inviolables.

---

## Phase 6 : User Story 4 - Étanchéité des Rapports Financiers Globaux (Priorité : P2)

**Objectif** : Garantir que les tableaux de bord d'administration des redevances et les bordereaux de créances ne ciblent strictement que les Universités Partenaires créancières.

**Critère de Test Indépendant** : Consulter `/admin/royalties/universities` et vérifier qu'aucun établissement client n'est listé dans les bénéficiaires de reversements institutionnels.

- [X] T022 [US4] Filtrer les établissements de type `'partner'` dans les requêtes de reversements institutionnels de `lahatheque-backend/apps/reporting/admin_views.py` ou `apps/partners/views.py`
- [X] T023 [US4] Vérifier l'écran `lahatheque-frontend/app/(dashboard)/admin/royalties/universities/page.tsx` pour s'assurer que seuls les ayants droit réels sont affichés

---

## Phase 7 : Traçabilité, Observabilité & Validation Finale

**Objectif** : Insérer les logs structurés obligatoires (Principe Constitutionnel XI) et exécuter la validation de bout en bout.

- [X] T024 [P] Ajouter des console logs structurés avec horodatage et préfixes explicites (`[UNIV KPIS]`, `[UNIV ACCESS GUARD]`, `[ADMIN INSTITUTION]`) dans les composants et services frontend modifiés
- [X] T025 Exécuter la suite complète des scénarios de test du fichier `specs/009-university-partner-client-split/quickstart.md` et consigner les résultats de validation

---

## Dépendances & Ordre d'Exécution

```text
Phase 1: Setup (T001, T002)
   ↓
Phase 2: Socle Fondamental (T003 → T004 → T005, T006)
   ↓
┌──────────────────────────────────────┬──────────────────────────────────────┐
│ Phase 3: User Story 1 (Clientes)     │ Phase 4: User Story 2 (Partenaires)  │
│ T007 → T008 → T009 → T010, T011, T012│ T013 → T014 → T015, T016             │
└──────────────────────────────────────┴──────────────────────────────────────┘
   ↓
Phase 5: User Story 3 (Administration & Intégrité) (T017 → T018 → T019, T020, T021)
   ↓
Phase 6: User Story 4 (Reporting Financier) (T022, T023)
   ↓
Phase 7: Traçabilité & Validation Quickstart (T024, T025)
```

### Opportunités de Parallélisation
- T005 (Serializers backend) et T006 (Types TypeScript frontend) peuvent être exécutés en parallèle.
- T010, T011, T012 (Adaptation frontend Cliente) et T014, T015, T016 (Adaptation frontend Partenaire) peuvent être développés en parallèle une fois les endpoints backend (T007, T008, T013) en place.
- T024 (Console logs frontend) peut être traité au fur et à mesure de l'implémentation de chaque composant.
