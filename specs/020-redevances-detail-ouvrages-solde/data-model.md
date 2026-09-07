# Data Model: Détail des Redevances par Ouvrage, Déduction des Retraits & Export PDF Auteur

## Entités Principales & Structures de Données

### 1. AuthorRoyaltyPayment (Objet Relevé Trimestriel)
Représente la consolidation comptable d'un trimestre pour l'auteur connecté.

| Attribut | Type | Description |
|---|---|---|
| `id` | `string` (UUID ou slug) | Identifiant unique du relevé trimestriel |
| `period` | `string` | Libellé officiel (ex: "3ème Trimestre 2026 (Juillet - Septembre)") |
| `quarter` | `number` (1, 2, 3, 4) | Numéro de trimestre calendaire |
| `year` | `number` | Année civile |
| `start_date` | `string` (YYYY-MM-DD) | Date de début du trimestre (ex: "2026-07-01") |
| `end_date` | `string` (YYYY-MM-DD) | Date de fin du trimestre (ex: "2026-09-30") |
| `total_sales_count` | `number` | Nombre total d'exemplaires vendus sur le trimestre |
| `paper_sales_count` | `number` | Exemplaires papier vendus |
| `digital_sales_count` | `number` | Exemplaires numériques vendus |
| `audio_sales_count` | `number` | Exemplaires audio vendus |
| `gross_revenue` | `number` | Chiffre d'affaires brut généré (XOF) |
| `author_percentage_rate` | `number` | Taux moyen ou contractuel indicatif (%) |
| `author_earned_amount` | `number` | Redevance nette totale acquise par l'auteur sur ce trimestre (XOF) |
| `status` | `"paid" \| "pending"` | Statut de liquidation du trimestre |
| `payment_date` | `string` (DD/MM/YYYY) | Date d'échéance officielle (le 5 du mois suivant la fin du trimestre) |
| `receipt_url` | `string` | Chemin vers le document bordereau officiel |
| `books` | `AuthorRoyaltyBookItem[]` | Liste détaillée des ouvrages ayant enregistré des ventes |

---

### 2. AuthorRoyaltyBookItem (Détail par Ouvrage dans le Trimestre)
Représente la contribution spécifique d'un livre aux ventes et redevances du trimestre.

| Attribut | Type | Description |
|---|---|---|
| `book_id` | `string` (UUID) | Identifiant de l'ouvrage dans le catalogue |
| `title` | `string` | Titre de l'ouvrage |
| `cover_url` | `string \| null` | URL de la miniature de couverture sur Cloudflare R2 |
| `isbn` | `string` | Numéro ISBN de l'ouvrage |
| `discipline` | `string` | Discipline ou domaine académique |
| `sales_count` | `number` | Total exemplaires vendus pour ce livre sur la période |
| `format_breakdown` | `object` | Détail par format : `{ digital: number, paper: number, audio: number }` |
| `gross_revenue` | `number` | Chiffre d'affaires brut généré par ce livre sur la période (XOF) |
| `royalty_rate` | `number` | Taux contractuel appliqué pour cet auteur sur cet ouvrage (%) |
| `net_royalty` | `number` | Montant net de redevance revenant à l'auteur pour ce livre (XOF) |

---

### 3. PayoutRequest (Demande de Versement / Retrait Auteur)
Modèle existant dans `apps.rights.models.PayoutRequest`.

| Attribut | Type | Description |
|---|---|---|
| `id` | `UUIDField` | Identifiant de la demande de versement |
| `author` | `ForeignKey(User)` | Auteur ayant initié la demande |
| `amount` | `DecimalField` | Montant demandé (XOF) |
| `payment_method` | `CharField` | Mode de règlement : `momo`, `moov`, `orange`, `bank` |
| `account_details` | `CharField` | Coordonnées de paiement (numéro de téléphone ou IBAN/RIB) |
| `status` | `CharField` | Cycle de vie : `pending` -> `approved` -> `processed` ou `rejected` |
| `transaction_reference` | `CharField` | Référence de la transaction bancaire ou Mobile Money |
| `admin_notes` | `TextField` | Notes administratives en cas de rejet ou validation |
| `created_at` | `DateTimeField` | Horodatage de soumission |
| `processed_at` | `DateTimeField` | Horodatage de traitement effectif |

---

## Règles de Validation Métier & Transitions d'État

1. **Calcul du Solde Disponible Retirable** :
   ```python
   total_earned = sum(redevances_nettes_toutes_ventes_payees)
   total_committed = sum(PayoutRequest.objects.filter(author=user, status__in=['pending', 'approved', 'processed']).values_list('amount', flat=True))
   available_balance = max(0, total_earned - total_committed)
   ```
2. **Plafond de Demande de Versement** :
   - Toute demande avec `amount <= 0` est rejetée avec code HTTP 400.
   - Toute demande avec `amount > available_balance` est rejetée avec message : *"Le montant demandé excède votre solde disponible retirable (X XOF)."*
3. **Transition de Rejet de Demande (`rejected`)** :
   - Lorsqu'une demande passe de `pending` ou `approved` à `rejected`, son montant cesse d'être comptabilisé dans `total_committed` et réintègre instantanément le solde disponible retirable.
