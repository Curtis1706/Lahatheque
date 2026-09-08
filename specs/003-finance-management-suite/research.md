# Architecture & Technical Research: Suite « Gestion des Finances »

**Feature**: Refonte de la Suite « Gestion des Finances »
**Branch**: `003-finance-management-suite`
**Date**: 2026-09-08

## Technical Decisions & Rationale

### 1. Réconciliation Arithmétique Dynamique du Chiffre d'Affaires (`/admin/sales`)

#### Decision
Unifier la source de données de `AdminSalesListAPIView` (`GET /api/v1/admin/sales/`) pour agréger systématiquement les trois composantes du Chiffre d'Affaires réel :
1. Commandes unitaires B2C payées (`apps.commerce.models.Order` avec `statut_paiement='paid'`)
2. Commandes institutionnelles universités (`apps.partners.models.UniversityPaperOrder` et abonnements campus non annulés)
3. Commandes grossistes B2B (`apps.commerce.models.WholesaleOrder` non annulées)

Chaque commande est renvoyée comme une entité consolidée de premier niveau avec :
- Métadonnées globales : référence unique, horodatage exact, acheteur (nom, email, rôle), canal commercial, montant net payé, mode de règlement, statut.
- Sous-collection `items` : décomposition de chaque ligne d'article (titre, format `paper` / `digital` / `audio` / `bouquet`, quantité, prix unitaire, remise, sous-total).

#### Rationale
- Permet une égalité arithmétique rigoureuse : `Somme(commandes.montant) == Total_CA_Affiché`.
- L'approche en accordéon interactif (1 commande = 1 ligne de synthèse dépliable) résout l'exigence d'absence d'encombrement visuel tout en fournissant 100 % des détails demandés.

#### Alternatives Rejected
- *Lignes d'articles plates séparées* : Risque de confusion de double comptage pour l'administrateur lorsqu'une commande comporte 3 articles.
- *Pagination tronquée à 200 éléments sans offset* : Remplacée par une pagination paginée standardisée Django REST Framework (`PageNumberPagination`) avec filtres query param (`channel`, `period`, `search`).

---

### 2. Architecture de la Page Dédiée « Demandes de Versement » (`/admin/payouts`)

#### Decision
Créer une route frontend dédiée `app/(dashboard)/admin/payouts/page.tsx` adossée aux services API BFF suivants :
1. `GET /api/bff/admin/royalties/payouts/` : Liste paginée des demandes de versement avec filtrage par statut (`pending`, `processed`, `rejected`), type de bénéficiaire (`author`, `publisher`, `university`) et recherche textuelle.
2. `GET /api/bff/admin/royalties/payouts/kpis/` : Métriques consolidées :
   - `total_pending_amount` (FCFA)
   - `pending_count`
   - `settled_this_month_amount` (FCFA)
   - `distinct_beneficiaries_count`
3. `POST /api/bff/admin/royalties/payouts/[id]/validate/` : Modale de validation exigeant `transaction_reference` (ID Mobile Money ou Réf virement), `payout_date` (ISO date), et supportant facultativement `receipt_file` (téléversement PDF/image).
4. `POST /api/bff/admin/royalties/payouts/[id]/reject/` : Modale de rejet exigeant `rejection_reason`.

#### Rationale
- Isole la responsabilité sensible des décaissements et du contrôle de trésorerie hors de la page de paramétrage des taux (`/admin/royalties`).
- Répond directement à la clarification retenue (Option A : référence obligatoire + justificatif facultatif).

---

### 3. Consolidation Multi-Partenaires sur « Finances Globales » (`/admin/finance`)

#### Decision
Faire évoluer `AdminGlobalFinanceView` et le rapport des partenaires (`/api/v1/admin/finance/partner-royalties/`) pour couvrir l'ensemble des ayant-droits de la plateforme :
1. **Auteurs** : Droits sur ventes unitaires papier, numérique, audio + part proportionnelle des lectures.
2. **Éditeurs Tiers** : Droits sur les ouvrages sous contrat d'édition tiers.
3. **Universités Partenaires** : Rétribution au prorata d'usage sur les consultations de bouquets documentaires.

Côté interface (`/admin/finance/page.tsx`) :
- Barre d'onglets de filtrage par typologie : `Tous les partenaires`, `Auteurs`, `Éditeurs Tiers`, `Universités Partenaires`.
- Lignes de tableau accordéon : chaque ligne partenaire se déplie pour afficher la liste des ouvrages, le volume d'unités/lectures, le format, le taux et le montant généré.
- Modale de détail d'audit conservée pour l'export ou l'analyse approfondie.

---

### 4. Épuration Ciblée de « Redevances & Droits » (`/admin/royalties`)

#### Decision
1. Retrait des 3 boutons de navigation orphelins dans l'en-tête (`Auteurs (2)`, `Éditeurs (0)`, `Universités (2)`).
2. Suppression du bloc redondant « Demandes de Versement » en bas de page (désormais pris en charge à 100 % sur `/admin/payouts`).
3. Recentrage exclusif de la page sur :
   - Configuration des barèmes généraux par défaut (Auteurs, Éditeurs, Universités, Plateforme).
   - Tableau de gestion des taux contractuels dérogatoires par partenaire avec pagination et édition instantanée des taux.

---

### 5. Mise à Jour de la Sidebar (`components/dashboard-sidebar.tsx`)

#### Decision
Le groupe « Gestion des Finances » intègre désormais 4 sous-menus ordonnés :
1. **Ventes & Revenus** (`/admin/sales`, icône `ShoppingBag`)
2. **Finances Globales** (`/admin/finance`, icône `Landmark`)
3. **Redevances & Droits** (`/admin/royalties`, icône `DollarSign`)
4. **Demandes de Versement** (`/admin/payouts`, icône `CreditCard`)
