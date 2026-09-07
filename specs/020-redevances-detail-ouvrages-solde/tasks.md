# Tasks: Détail des Redevances par Ouvrage, Déduction des Retraits & Export PDF Auteur

**Feature**: Détail des Redevances par Ouvrage, Déduction des Retraits & Export PDF Auteur
**Branch**: `020-redevances-detail-ouvrages-solde`
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

---

## Phase 1: Setup & Types

**Purpose**: Préparation des types partagés et alignement des structures de données frontend/backend.

- [X] T001 Enrichir les types TypeScript dans `lahatheque-frontend/lib/types/author.ts` avec la structure `AuthorRoyaltyBookItem` et le champ `books?: AuthorRoyaltyBookItem[]` dans `AuthorRoyaltyPayment`.
- [X] T002 [P] Mettre à jour les données de repli dans `lahatheque-frontend/lib/mock/author.ts` pour intégrer la liste détaillée des livres vendus sous chaque trimestre.

---

## Phase 2: Foundational (Backend Services & Calculs de Solde)

**Purpose**: Socle de calcul des redevances par ouvrage et de la formule financière de solde retirable disponible.

- [X] T003 Implémenter la fonction d'agrégation des ventes par ouvrage pour chaque trimestre calendaire dans `lahatheque-backend/apps/rights/views.py` en groupant les `LigneCommande` payées par `ouvrage_id`.
- [X] T004 [P] Implémenter le calcul strict du solde retirable disponible (`solde = total_acquis - total_demandes_en_cours_ou_payees`) dans `AuthorDashboardKPIsView` dans `lahatheque-backend/apps/rights/views.py`.

---

## Phase 3: User Story 1 - Détail des Ouvrages Vendus dans les Lignes Dépliables de la DataTable (Priority: P1)

**Goal**: Permettre à l'auteur de visualiser directement dans la DataTable existante chaque livre vendu sous un trimestre en dépliant la ligne correspondante.

**Independent Test**: Sur `/author/royalties`, cliquer sur le chevron d'expansion d'une ligne de trimestre : la sous-table intégrée s'affiche avec la miniature de couverture, le titre, les formats, les exemplaires vendus, le CA brut et la redevance nette de l'auteur.

- [X] T005 [US1] Ajouter la prop `renderExpandedRow?: (row: T) => React.ReactNode` dans `DataTableProps` et gérer l'état d'ouverture/fermeture des lignes dans `lahatheque-frontend/components/ui/data-table.tsx`.
- [X] T006 [P] [US1] Adapter le rendu des cartes mobiles dans `lahatheque-frontend/components/ui/data-table.tsx` pour supporter l'accordéon dépliable sous 1024px.
- [X] T007 [US1] Mettre à jour `AuthorRoyaltiesStatementsView` dans `lahatheque-backend/apps/rights/views.py` pour alimenter le champ `books` de chaque trimestre avec les ouvrages vendus réels.
- [X] T008 [US1] Implémenter la sous-table des livres vendus dans `lahatheque-frontend/app/(dashboard)/author/royalties/page.tsx` via `renderExpandedRow` avec miniatures, typographie Playfair/Poppins et badges de formats.

---

## Phase 4: User Story 2 - Déduction Stricte des Retraits dans le Solde Disponible Retirable (Priority: P1)

**Goal**: Assurer qu'une demande de retrait (en attente ou payée) est déduite immédiatement du solde disponible retirable afin d'empêcher tout double paiement.

**Independent Test**: Pour un solde acquis de 1 000 XOF, soumettre une demande de 1 000 XOF : le solde disponible passe à 0 XOF. Lors d'une nouvelle vente de 300 XOF, le solde disponible passe à 300 XOF et la modale plafonne strictement la saisie à 300 XOF.

- [X] T009 [US2] Mettre à jour la validation dans `AuthorPayoutRequestView.post()` dans `lahatheque-backend/apps/rights/views.py` pour rejeter toute demande dont le montant excède le solde disponible réel.
- [X] T010 [US2] Ajuster le calcul du solde en attente affiché dans les cartes de synthèse de `lahatheque-frontend/app/(dashboard)/author/royalties/page.tsx` et dans `lahatheque-frontend/components/features/author/author-payout-modal.tsx`.
- [X] T011 [US2] Gérer la réintégration automatique du montant au solde disponible lorsqu'une demande est rejetée (`status='rejected'`) dans `lahatheque-backend/apps/rights/views.py`.

---

## Phase 5: User Story 3 - Bordereau PDF Trimestriel avec Décompte par Livre (Priority: P2)

**Goal**: Fournir un bordereau PDF officiel certifié contenant le tableau nominatif des ouvrages vendus avec leurs volumes et montants nets.

**Independent Test**: Cliquer sur "Relevé Trimestriel" sur un trimestre : le fichier PDF téléchargé liste nominativement chaque ouvrage avec son titre, formats, quantité vendue, CA brut et redevance nette.

- [X] T012 [US3] Modifier `handleExportStatementPdf` dans `lahatheque-frontend/app/(dashboard)/author/royalties/page.tsx` pour transmettre les lignes d'ouvrages vendus (`row.books`) au service d'export.
- [X] T013 [US3] Mettre à jour la mise en page et les totaux consolidés dans `lahatheque-frontend/lib/services/export-service.ts` pour le document `BORDEREAU_REDEVANCES`.

---

## Phase 6: Polish & Validation End-to-End

**Purpose**: Validation finale, vérification de non-régression et conformité constitutionnelle.

- [X] T014 Exécuter le scénario de test end-to-end complet décrit dans `specs/020-redevances-detail-ouvrages-solde/quickstart.md` sur le compte de l'auteur Harry Loko (`hervic114@gmail.com`).
- [X] T015 [P] Vérifier l'affichage responsive sans défilement horizontal sur mobile (< 400px) et la conformité stricte aux tokens sémantiques.
- [X] T016 Vérifier l'absence totale d'émojis dans le code, l'interface, les messages toast et la documentation.

---

## Dépendances & Ordre d'Exécution

### Dépendances de Phase
- **Phase 1 (Setup)** : Aucune dépendance - démarre immédiatement.
- **Phase 2 (Foundational)** : Dépend de la Phase 1 - BLOQUE le démarrage des User Stories.
- **Phase 3 (User Story 1)** : Dépend de la Phase 2 - MVP immédiat pour l'affichage des livres.
- **Phase 4 (User Story 2)** : Dépend de la Phase 2 - Sécurité comptable du solde retirable.
- **Phase 5 (User Story 3)** : Dépend de la Phase 3 (nécessite la liste des ouvrages).
- **Phase 6 (Polish)** : Dépend de l'achèvement des User Stories 1 à 3.

### Opportunités de Parallélisation
- T001 et T002 peuvent être exécutés en parallèle (fichiers distincts).
- T003 et T004 peuvent être exécutés en parallèle.
- T005 et T006 peuvent être exécutés en parallèle.

---

## Stratégie d'Implémentation

### MVP First (User Story 1 & 2 Prioritaires)
1. Exécuter Setup (T001, T002) + Foundational (T003, T004).
2. Implémenter l'extension `DataTable` avec lignes pliables/dépliables et l'API retournant `books` (T005, T006, T007, T008) -> **Validation visuelle MVP**.
3. Sécuriser le calcul du solde retirable et la modale de retrait (T009, T010, T011) -> **Validation financière**.
4. Ajouter le détail par livre dans le bordereau PDF (T012, T013).
5. Validation globale et recette (T014, T015, T016).
