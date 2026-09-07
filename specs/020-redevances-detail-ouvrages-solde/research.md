# Research: Détail des Redevances par Ouvrage, Déduction des Retraits & Export PDF Auteur

## Problématiques & Décisions d'Architecture

### Décision 1 : Extension du composant DataTable pour lignes dépliables (Expandable Rows)
- **Contexte** : L'utilisateur souhaite conserver le composant générique `DataTable` tout en permettant à l'auteur de déplier chaque ligne de trimestre pour voir immédiatement les livres vendus sous ce trimestre, sans redirection, sans modale intrusive ni tiroir externe.
- **Décision** : Ajouter une prop optionnelle `renderExpandedRow?: (row: T) => React.ReactNode` dans `DataTableProps<T>` ([components/ui/data-table.tsx](file:///e:/Lahatheque/lahatheque-frontend/components/ui/data-table.tsx)).
- **Détails techniques** :
  - État local `expandedRowKeys: Set<string>` gérant les identifiants uniques des lignes ouvertes.
  - Présence d'un bouton interactif avec icône `ChevronRight` (pivotant à 90° en `ChevronDown` via `rotate-90 transition-transform duration-200`).
  - Insertion d'une rangée `<tr className="bg-background-secondary/30">` avec `<td colSpan={columns.length}>` contenant le rendu personnalisé fourni par `renderExpandedRow`.
  - Adaptation dans la vue mobile (cards sous `1024px`) : un bloc accordéon repliable s'insère au bas de la carte avec la même fluidité.
- **Alternatives rejetées** :
  - *Modale pop-up* : Rompt le contexte de lecture et empêche la comparaison de plusieurs trimestres à la suite.
  - *Tiroir latéral (Drawer)* : Moins intuitif sur grand écran pour un décompte comptable en ligne de tableau.

---

### Décision 2 : Algorithme de déduction des retraits et calcul du solde disponible
- **Contexte** : Si un auteur acquiert 1 000 XOF et demande 1 000 XOF en retrait (statut `pending` ou `processed`), son solde retirable disponible doit être de 0 XOF. Si une nouvelle vente rapporte 300 XOF, le solde retirable doit être de 300 XOF et non 1 300 XOF.
- **Décision** :
  - **Redevances Brutes Acquises Cumulées** :
    $$\text{Redevances Totales} = \sum_{\text{ventes payées}} (\text{CA Ligne} \times \text{Taux Auteur})$$
  - **Retraits Engagés ou Rétribués** :
    $$\text{Total Retraits} = \sum_{\substack{\text{PayoutRequest} \\ \text{status} \in \{\text{pending}, \text{approved}, \text{processed}\}}} \text{amount}$$
  - **Solde Disponible Retirable** :
    $$\text{Solde Retirable} = \max(0, \text{Redevances Totales} - \text{Total Retraits})$$
  - Si une demande passe au statut `rejected`, elle est automatiquement exclue de la somme et libère à nouveau le montant dans le solde disponible.
- **Vérification côté Backend ([apps/rights/views.py](file:///e:/Lahatheque/lahatheque-backend/apps/rights/views.py))** :
  - Dans `AuthorDashboardKPIsView`, `authorPendingRoyalties` et `nextPaymentAmount` reflètent rigoureusement ce solde retirable disponible net.
  - Dans `AuthorPayoutRequestView.post()`, une validation stricte rejette toute demande dont le montant excède ce solde disponible.

---

### Décision 3 : Agrégation dynamique par livre dans les relevés trimestriels
- **Contexte** : L'API `/api/v1/rights/author/royalties/` doit retourner les trimestres avec la liste `books` des ouvrages réels vendus durant chaque période.
- **Décision** :
  - Pour chaque trimestre calculé, interroger les `LigneCommande` payées associées aux ouvrages de l'auteur :
    - Regroupement par `ouvrage_id`.
    - Calcul des quantités par format (`digital`, `paper`, `audio`).
    - Récupération de la couverture (`cover_image.url` ou URL Cloudflare R2), du titre, de l'ISBN et de la discipline.
    - Application du taux contractuel de `RepartitionDroits` propre à cet auteur et calcul de la redevance nette correspondante.
  - Si un trimestre n'a pas de ventes, la liste `books` est une liste vide `[]`.
- **Alternatives rejetées** :
  - *Hardcoder des données mock statiques* : Interdit par les règles LAHAThèque, les données doivent correspondre aux commandes et contrats réels en base.

---

### Décision 4 : Bordereau PDF officiel avec ventilation par ouvrage
- **Contexte** : L'export PDF doit inclure la liste nominative des ouvrages vendus, leurs formats, volumes, CA brut, taux et montants nets.
- **Décision** :
  - Enrichir la méthode `handleExportStatementPdf` dans `app/(dashboard)/author/royalties/page.tsx` pour mapper les éléments du tableau `row.books`.
  - Si `row.books` contient des livres :
    - `tableHeaders = ["Ouvrage / Titre", "Format(s)", "Quantité", "CA Brut (HT)", "Taux Auteur", "Redevance Nette"]`.
    - Chaque livre devient une rangée du tableau PDF avec sa quote-part nette.
    - Le pied du tableau affiche la ligne de synthèse consolidée certifiée par LAHAThèque.
