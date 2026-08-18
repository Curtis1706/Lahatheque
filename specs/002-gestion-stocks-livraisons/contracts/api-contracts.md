# Contrats d'API REST: Stocks et Livraisons

---

## 1. Tableau de Bord des Stocks (`GET /api/v1/logistics/stocks/`)
```json
{
  "success": true,
  "data": {
    "count": 24,
    "results": [
      {
        "id": "b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "ouvrage_titre": "Chimie Organique Avancée",
        "entrepot_nom": "Entrepôt Central Cotonou",
        "pays": "Bénin",
        "quantite_reelle": 450,
        "quantite_disponible": 435,
        "seuil_alerte": 50,
        "statut_alerte": "normal"
      }
    ]
  },
  "error": null
}
```

## 2. Enregistrer un Réassort (`POST /api/v1/logistics/stocks/mouvements/`)
```json
{
  "stock_id": "b1a2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "type_mouvement": "reassort",
  "quantite": 200,
  "reference_document": "BL-2026-08-0045"
}
```

## 3. Assigner Transporteur et Expédier (`POST /api/v1/logistics/expeditions/{id}/expedier/`)
```json
{
  "transporteur_nom": "DHL Express",
  "numero_suivi": "DHL-984729184",
  "url_suivi": "https://www.dhl.com/track/DHL-984729184"
}
```
