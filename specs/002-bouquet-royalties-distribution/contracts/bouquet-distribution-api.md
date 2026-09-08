# Contract: API Répartition des Redevances sur Bouquets Documentaires

**Feature**: `002-bouquet-royalties-distribution`
**Protocole**: HTTP REST / JSON unifié (`{ "success": boolean, "data": ..., "error": null | string }`)
**Authentification**: Session Django / JWT dans Cookie `HttpOnly` avec `credentials: "include"`

---

## 1. Endpoint Espace Université : Répartition d'un Bouquet Spécifique

### `GET /api/v1/partners/university/bouquets/<pk>/distribution/`

Permet à l'université connectée d'obtenir la répartition d'audience réelle et les redevances pour un bouquet auquel elle participe.

#### Headers
```http
Accept: application/json
Cookie: laha_access=<jwt_token>
```

#### Réponse de Succès (`200 OK`)
```json
{
  "success": true,
  "data": {
    "bouquet_id": "3c0684b1-9faf-434b-b553-fb8255707f30",
    "bouquet_title": "Bouquet Sciences Médicales & Santé Campus",
    "annual_price": 10000000.0,
    "currency": "XOF",
    "total_books_count": 27,
    "total_consultations": 11000,
    "royalty_rate_applied": 15.0,
    "distribution": [
      {
        "institution_id": "uac-uuid-001",
        "institution_name": "Université d'Abomey-Calavi",
        "institution_code": "UAC",
        "short_name": "UAC",
        "books_owned_count": 20,
        "reads_count": 10000,
        "usage_percentage": 90.91,
        "ca_share": 9091000.0,
        "royalty_rate": 15.0,
        "royalty_amount": 1363650.0,
        "color": "#1B2A4E",
        "is_current_institution": true
      },
      {
        "institution_id": "up-uuid-002",
        "institution_name": "Université de Parakou",
        "institution_code": "UP",
        "short_name": "Univ. Parakou",
        "books_owned_count": 5,
        "reads_count": 900,
        "usage_percentage": 8.18,
        "ca_share": 818000.0,
        "royalty_rate": 15.0,
        "royalty_amount": 122700.0,
        "color": "#10B981",
        "is_current_institution": false
      },
      {
        "institution_id": "una-uuid-003",
        "institution_name": "Université Nationale d'Agriculture",
        "institution_code": "UNA",
        "short_name": "UNA",
        "books_owned_count": 2,
        "reads_count": 100,
        "usage_percentage": 0.91,
        "ca_share": 91000.0,
        "royalty_rate": 15.0,
        "royalty_amount": 13650.0,
        "color": "#F59E0B",
        "is_current_institution": false
      }
    ],
    "totals": {
      "total_books": 27,
      "total_usage_percentage": 100.0,
      "total_ca": 10000000.0,
      "total_royalties": 1500000.0,
      "platform_revenue": 8500000.0
    }
  },
  "error": null
}
```

---

## 2. Endpoint Espace Administration : Vue Panoramique Multi-Établissements

### `GET /api/v1/admin/bouquet-offerings/<pk>/distribution/`

Permet à l'administrateur de visualiser la répartition globale d'un bouquet de l'offre catalogue avec le détail de chaque institution et la part conservée par la plateforme LAHA.

#### Headers
```http
Accept: application/json
Cookie: laha_access=<admin_jwt_token>
```

#### Réponse de Succès (`200 OK`)
Structure identique à la réponse ci-dessus, avec `is_current_institution: false` pour toutes les entrées et un récapitulatif complet de la quote-part totale à liquider.

---

## 3. Endpoint Espace Université : Synthèse Globale des Redevances

### `GET /api/v1/partners/university/royalties/`

Fournit l'ensemble des redevances acquises par l'université, regroupant les ventes unitaires et les quotes-parts des bouquets documentaires souscrits.

#### Champs clés retournés dans `data` :
* `contractual_rate` : Taux conventionné effectif (priorité au taux propre de l'université, sinon taux standard global configuré par l'admin).
* `available_balance` : Solde retirable disponible incluant ventes unitaires + quotes-parts bouquets.
* `bouquet_royalties` : Liste des abonnements bouquets avec prorata des lectures et montants nets.
* `unit_sales` : Ventes unitaires certifiées.
