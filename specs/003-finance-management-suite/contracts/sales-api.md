# Interface Contract: Ventes & Transactions API

## 1. Liste unifiée et consolidée des ventes
`GET /api/v1/admin/sales/` (Proxy BFF : `/api/bff/admin/sales`)

### Query Parameters
- `channel` : `all` | `b2c_individual` | `b2b_university` | `b2b_wholesale`
- `period` : `1d` | `1w` | `1m` | `3m` | `1y`
- `time_slot` : `morning` | `afternoon` | `evening` | `night` (facultatif)
- `q` : Recherche textuelle (n° commande, client, email, livre)

### Response Payload (`200 OK`)
```json
{
  "success": true,
  "data": {
    "total_revenue_consolidated": 178000.0,
    "total_orders_count": 20,
    "channel_breakdown": {
      "b2c_individual": { "amount": 95500.0, "orders_count": 19, "percentage": 53.7 },
      "b2b_university": { "amount": 82500.0, "orders_count": 1, "percentage": 46.3 },
      "b2b_wholesale": { "amount": 0.0, "orders_count": 0, "percentage": 0.0 }
    },
    "orders": [
      {
        "id": "ord-0977cf6e",
        "order_reference": "0977CF6E",
        "channel": "b2c_individual",
        "channel_label": "Vente Unitaire Lecteur",
        "buyer_name": "Amadou KOUYATÉ",
        "buyer_email": "client@lahatheque.com",
        "buyer_role": "student",
        "created_at": "2026-09-07T13:42:00Z",
        "payment_method": "Mobile Money",
        "payment_status": "paid",
        "gross_amount": 5000.0,
        "discount_total": 0.0,
        "net_amount_paid": 5000.0,
        "items_count": 1,
        "items": [
          {
            "id": "item-1",
            "book_title": "Agile : Les Fondamentaux",
            "format": "paper",
            "quantity": 1,
            "unit_price": 5000.0,
            "discount_amount": 0.0,
            "subtotal": 5000.0
          }
        ]
      },
      {
        "id": "univ-ord-82500",
        "order_reference": "CMD-UNIV-UNA-01",
        "channel": "b2b_university",
        "channel_label": "Bouquet Campus B2B",
        "buyer_name": "Université Nationale d'Agriculture (UNA)",
        "buyer_email": "contact@una.bj",
        "buyer_role": "university",
        "created_at": "2026-09-01T08:00:00Z",
        "payment_method": "Virement Bancaire Institutionnel",
        "payment_status": "paid",
        "gross_amount": 82500.0,
        "discount_total": 0.0,
        "net_amount_paid": 82500.0,
        "items_count": 1,
        "items": [
          {
            "id": "univ-item-1",
            "book_title": "Bouquet Gestion & Agronomie (Licence Annuelle Campus)",
            "format": "bouquet",
            "quantity": 1,
            "unit_price": 82500.0,
            "discount_amount": 0.0,
            "subtotal": 82500.0
          }
        ]
      }
    ]
  },
  "error": null
}
```
