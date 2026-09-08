# Interface Contract: Finances Globales & Partenaires API

## 1. Synthèse financière consolidée 360°
`GET /api/v1/admin/finance/global/` (Proxy BFF : `/api/bff/admin/finance/global/`)

### Response Payload (`200 OK`)
```json
{
  "success": true,
  "data": {
    "total_platform_revenue": 178000.0,
    "breakdown": {
      "student_author_orders": { "total": 95500.0, "count": 19 },
      "university_orders": { "total": 82500.0, "count": 1 },
      "wholesale_orders": { "total": 0.0, "count": 0 }
    },
    "credit": {
      "outstanding_total": 2600.0,
      "outstanding_count": 1
    },
    "subscriptions": {
      "active_count": 4
    },
    "royalties_overview": {
      "total_generated": 26700.0,
      "total_paid": 0.0,
      "total_outstanding": 26700.0
    },
    "platform_margin": {
      "commission_rate_avg": 85.0,
      "net_retained_platform": 151300.0
    }
  },
  "error": null
}
```

---

## 2. Rapport multi-partenaires et redevances
`GET /api/v1/admin/finance/partner-royalties/` (Proxy BFF : `/api/bff/admin/finance/partner-royalties/`)

### Query Parameters
- `role` : `all` | `author` | `publisher` | `university`
- `q` : Recherche textuelle sur le partenaire ou l'ouvrage

### Response Payload (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "partner_id": "8fa3c072-...",
      "partner_name": "Harry Loko",
      "partner_type": "author",
      "books_count": 1,
      "total_units_sold": 3,
      "average_rate_percent": 15.0,
      "total_revenue_generated": 7000.0,
      "total_royalties_due": 1050.0,
      "total_royalties_paid": 0.0,
      "balance_outstanding": 1050.0,
      "books": [
        {
          "book_id": "book-agile-01",
          "title": "Agile : Les Fondamentaux",
          "format": "paper",
          "units_or_reads_count": 3,
          "effective_rate_percent": 15.0,
          "gross_revenue_generated": 7000.0,
          "royalties_earned": 1050.0
        }
      ]
    },
    {
      "partner_id": "univ-una-01",
      "partner_name": "Université Nationale d'Agriculture (UNA)",
      "partner_type": "university",
      "books_count": 2,
      "total_units_sold": 14,
      "average_rate_percent": 15.0,
      "total_revenue_generated": 82500.0,
      "total_royalties_due": 4125.0,
      "total_royalties_paid": 0.0,
      "balance_outstanding": 4125.0,
      "books": [
        {
          "book_id": "book-agri-01",
          "title": "Agricultural Food Consumption",
          "format": "bouquet",
          "units_or_reads_count": 14,
          "effective_rate_percent": 15.0,
          "gross_revenue_generated": 82500.0,
          "royalties_earned": 4125.0
        }
      ]
    }
  ],
  "error": null
}
```
