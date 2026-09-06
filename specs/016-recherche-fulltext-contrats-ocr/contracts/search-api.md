# Contrat d'Interface API : Recherche Documentaire & Indexation OCR

**Feature** : `016-recherche-fulltext-contrats-ocr`
**Date** : 2026-09-06

---

## 1. Recherche Plein Texte & Filtres

### `GET /api/v1/rights/legal/contracts/`

**Permissions** : Authentifié avec rôle `legal_reviewer`, `admin` ou `super_admin`.

#### Paramètres de Requête (Query Params)

| Paramètre | Type | Requis | Description |
| :--- | :--- | :--- | :--- |
| `search` | string | Non | Mot-clé, clause, référence, nom de signataire ou expression textuelle. |
| `party_type` | string | Non | `"all"`, `"author"`, `"university"`, `"publisher"`, `"pre_edition"`. |
| `status` | string | Non | `"all"`, `"active"`, `"pending_signature"`, `"expired"`, `"terminated"`. |
| `indexing_status`| string | Non | `"all"`, `"indexed"`, `"processing"`, `"failed"`. |

#### Réponse de Succès (HTTP 200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "reference": "CTR-JUR-2026-9048",
      "title": "Convention Cadre de Partenariat — UNSTIM",
      "contracting_party": "UNSTIM",
      "party_type": "university",
      "type": "university_agreement",
      "signed_at": "2026-08-25",
      "status": "active",
      "indexing_status": "indexed",
      "ocr_engine_used": "pymupdf_native",
      "relevance_rank": 0.89,
      "snippet_highlight": "...les redevances documentaires annuelles dues au titre de l'année civile en cours sont fixées à <strong>15%</strong> de la quote-part...",
      "file_url": "https://storage.lahatheque.com/contrats/CTR-JUR-2026-9048.pdf",
      "file_name": "Convention_UNSTIM_2026.pdf",
      "file_size": 2450000
    }
  ],
  "error": null
}
```

---

## 2. Déclenchement / Réindexation Manuelle (Endpoint Résilience)

### `POST /api/v1/rights/legal/contracts/{id}/reindex/`

Permet de forcer une nouvelle tentative d'OCR en cas de scan complexe ou d'échec initial.

#### Réponse de Succès (HTTP 202 Accepted)

```json
{
  "success": true,
  "data": {
    "contract_id": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    "indexing_status": "processing",
    "message": "Réindexation OCR du contrat lancée en arrière-plan."
  },
  "error": null
}
```
