# Interface Contract: Gestion des Commandes & Grand Livre API

## 1. Liste exhaustive et filtrée des commandes admin
`GET /api/v1/commerce/admin/orders/` (Proxy BFF : `/api/bff/commerce/admin/orders`)

### Query Parameters
- `statut_paiement` : `all` | `paid` | `pending` | `credit` | `failed` | `cancelled` | `abandoned`
- `period` : `all` | `today` | `week` | `month` | `year`
- `q` : Recherche textuelle (référence, acheteur, email, titre de livre)
- `page` : Numéro de page
- `page_size` : Nombre par page (10, 20, 50)

### Response Payload (`200 OK`)
```json
{
  "success": true,
  "data": {
    "kpis": {
      "total_orders_count": 24,
      "paid_count": 18,
      "pending_count": 2,
      "credit_count": 1,
      "abandoned_count": 2,
      "failed_count": 1,
      "total_paid_amount": 94500.0,
      "total_credit_amount": 15000.0,
      "potential_abandoned_loss": 8500.0
    },
    "orders": [
      {
        "id": "ed004755-6839-4b32-a2ea-f5708b85063d",
        "numero_commande": "CMD-ED004755",
        "order_reference": "#ED004755",
        "customer_id": "usr-12345",
        "customer_name": "Lecteur Test",
        "customer_email": "devyuri65@gmail.com",
        "customer_role": "student",
        "total_amount": 1.0,
        "currency": "XOF",
        "statut_paiement": "paid",
        "statut_paiement_display": "Payé",
        "statut_commande": "completed",
        "statut_commande_display": "Terminée",
        "mode_paiement": "mobile_money",
        "mode_paiement_display": "Mobile Money",
        "is_credit_purchase": false,
        "credit_due_date": null,
        "moneroo_id": "py_xqvby9cs2xgj",
        "created_at": "2026-09-11T09:42:00Z",
        "abandoned_at": null,
        "items_count": 1,
        "items": [
          {
            "id": "line-1",
            "book_title": "Engineering Steels and High Entropy-Alloys",
            "format": "digital",
            "quantity": 1,
            "unit_price": 1.0,
            "total_price": 1.0
          }
        ]
      }
    ],
    "total": 24,
    "current_page": 1,
    "total_pages": 1
  },
  "error": null
}
```

---

## 2. Vérification passerelle en direct
`POST /api/v1/commerce/orders/<uuid:order_id>/verify-payment/`

### Response Payload (`200 OK`)
```json
{
  "success": true,
  "data": {
    "status": "paid",
    "order_id": "ed004755-6839-4b32-a2ea-f5708b85063d",
    "moneroo_id": "py_xqvby9cs2xgj",
    "message": "Paiement validé avec succès."
  },
  "error": null
}
```

---

## 3. Confirmation manuelle tous modes (Comptoir / MoMo direct / Virement)
`POST /api/v1/commerce/manager/orders/<uuid:order_id>/confirm-payment/`

### Request Payload
```json
{
  "mode_paiement": "cash",
  "reference_paiement": "RECU-CAISSE-2026-0042",
  "notes": "Règlement en espèces effectué au siège par le client."
}
```

---

## 4. Relance d'un panier abandonné
`POST /api/v1/commerce/orders/<uuid:order_id>/remind-abandoned/`

### Response Payload (`200 OK`)
```json
{
  "success": true,
  "message": "Email de relance avec lien de finalisation envoyé à devyuri65@gmail.com.",
  "last_reminder_sent_at": "2026-09-11T12:35:00Z"
}
```

---

## 5. Export Grand Livre Comptable (Excel/CSV & PDF)
`GET /api/v1/reporting/admin/accounting-ledger/export/?format=xlsx&period=month`
`GET /api/v1/reporting/admin/accounting-ledger/export/?format=pdf&period=month`
