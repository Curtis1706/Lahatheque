# API Contract: Commande Multi-Formats Flexible

**Base Path**: `/api/v1/commerce/`  
**Authentication**: Obligatoire (Cookie HTTP-Only JWT ou Session)

---

## 1. Création de Commande Combinée (Papier + Numérique + Audio)

### `POST /api/v1/commerce/orders/create/`
Permet à un lecteur d'acquérir n'importe quelle combinaison de formats (numérique, papier, audio) au sein d'une transaction unique.

#### Corps de la Requête (JSON)
```json
{
  "items": [
    {
      "ouvrage_id": "0436ccc1-3c14-4550-a572-3defb6c60740",
      "format_type": "audio",
      "quantity": 1
    },
    {
      "ouvrage_id": "0436ccc1-3c14-4550-a572-3defb6c60740",
      "format_type": "paper",
      "quantity": 2
    },
    {
      "ouvrage_id": "0436ccc1-3c14-4550-a572-3defb6c60740",
      "format_type": "digital",
      "quantity": 1
    }
  ],
  "type_commande": "personnel",
  "mode_paiement": "fedapay",
  "shipping_address": "Lot 452, Quartier Haie Vive",
  "city": "Cotonou",
  "country": "BJ",
  "phone": "+22997000000"
}
```

#### Réponse HTTP 201 (Created)
```json
{
  "success": true,
  "data": {
    "order_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "reference": "CMD-2026-0907-8842",
    "total_amount_xof": 16500.0,
    "status": "pending_payment",
    "payment_url": "https://checkout.fedapay.com/pay/...",
    "items_summary": [
      {
        "title": "Guide Pratique de Procédure Civile",
        "format": "audio",
        "unit_price": 3500.0,
        "quantity": 1,
        "total": 3500.0
      },
      {
        "title": "Guide Pratique de Procédure Civile",
        "format": "paper",
        "unit_price": 5000.0,
        "quantity": 2,
        "total": 10000.0
      },
      {
        "title": "Guide Pratique de Procédure Civile",
        "format": "digital",
        "unit_price": 3000.0,
        "quantity": 1,
        "total": 3000.0
      }
    ]
  },
  "error": null
}
```

---

## 2. Récupération des Écoutes en Cours pour le Dashboard

### `GET /api/v1/student/dashboard/summary/`
Enrichi avec les sessions d'écoute audio actives pour affichage sur la vue d'ensemble `/student`.

#### Réponse HTTP 200 (Success)
```json
{
  "success": true,
  "data": {
    "stats": {
      "books_read_count": 12,
      "audiobooks_listened_count": 4,
      "total_hours_listened": 18.5
    },
    "recent_audio_listenings": [
      {
        "ouvrage_id": "0436ccc1-3c14-4550-a572-3defb6c60740",
        "title": "Guide Pratique de Procédure Civile",
        "authors": ["Dr. Koffi Mensah"],
        "cover_url": "https://pub-98cb000b12874eae9d7deed8a2ead6ee.r2.dev/covers/civile.jpg",
        "current_track_title": "Chapitre 1 : Les Principes Généraux",
        "voice_gender": "male",
        "progress_percent": 65.0,
        "current_time_seconds": 1183,
        "total_duration_seconds": 1820,
        "listen_url": "/listen/0436ccc1-3c14-4550-a572-3defb6c60740"
      }
    ]
  },
  "error": null
}
```
