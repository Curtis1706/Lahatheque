# Interface Contract: Demandes de Versement API

## 1. Lister les demandes de versement
`GET /api/v1/admin/royalties/payouts/` (Proxy BFF : `/api/bff/admin/royalties/payouts/`)

### Query Parameters
- `status` : `all` | `pending` | `approved` | `processed` | `rejected`
- `type` : `all` | `author` | `publisher` | `university`
- `q` : Recherche textuelle sur le bénéficiaire ou le motif
- `page` : Numéro de page (défaut: 1)
- `page_size` : Taille de page (défaut: 10)

### Response Payload (`200 OK`)
```json
{
  "success": true,
  "data": {
    "count": 4,
    "page": 1,
    "total_pages": 1,
    "results": [
      {
        "id": "c1f7580d-a3df-403d-bf66-b25a3d76e480",
        "beneficiary_id": "8fa3c072-...",
        "beneficiary_name": "Harry Loko",
        "beneficiary_type": "author",
        "beneficiary_email": "harry.loko@lahatheque.com",
        "purpose_label": "Agile : Les Fondamentaux",
        "gross_base_amount": 7000.0,
        "effective_rate_percent": 15.0,
        "net_payout_amount": 1050.0,
        "payment_method": "bank_transfer",
        "payment_details_preview": "Compte conventionné •••• 8912",
        "status": "pending",
        "transaction_reference": null,
        "payout_date": null,
        "receipt_file_url": null,
        "rejection_reason": null,
        "created_at": "2026-09-08T10:30:00Z"
      }
    ]
  },
  "error": null
}
```

---

## 2. Indicateurs KPIs des versements
`GET /api/v1/admin/royalties/payouts/kpis/`

### Response Payload (`200 OK`)
```json
{
  "success": true,
  "data": {
    "total_pending_amount": 3350.0,
    "pending_count": 4,
    "total_settled_this_month": 125000.0,
    "settled_this_month_count": 18,
    "distinct_beneficiaries_count": 12,
    "average_processing_time_hours": 24.5
  },
  "error": null
}
```

---

## 3. Valider une demande de versement
`POST /api/v1/admin/royalties/payouts/{id}/validate/`

### Request Body (`multipart/form-data` ou `application/json`)
```json
{
  "transaction_reference": "MOMO-CI-20260908-9842",
  "payout_date": "2026-09-08",
  "receipt_file": "(facultatif : fichier binaire PDF ou image)"
}
```

### Response Payload (`200 OK`)
```json
{
  "success": true,
  "message": "Versement validé avec succès. Référence enregistrée.",
  "data": {
    "id": "c1f7580d-a3df-403d-bf66-b25a3d76e480",
    "status": "processed",
    "transaction_reference": "MOMO-CI-20260908-9842",
    "payout_date": "2026-09-08",
    "receipt_file_url": "/media/payout_receipts/2026/09/recu_9842.pdf"
  },
  "error": null
}
```

---

## 4. Rejeter une demande de versement
`POST /api/v1/admin/royalties/payouts/{id}/reject/`

### Request Body (`application/json`)
```json
{
  "rejection_reason": "Coordonnées bancaires erronées ou solde de droits insuffisant."
}
```

### Response Payload (`200 OK`)
```json
{
  "success": true,
  "message": "Demande de versement rejetée.",
  "data": {
    "id": "c1f7580d-a3df-403d-bf66-b25a3d76e480",
    "status": "rejected",
    "rejection_reason": "Coordonnées bancaires erronées ou solde de droits insuffisant."
  },
  "error": null
}
```
