# Spécification d'API Forensique: Endpoints et Contrats

**Format Unifié LAHAThèque**:
```json
{
  "success": true,
  "data": {},
  "error": null
}
```

---

## 1. POST `/api/v1/protection/forensic/analyze/`

Analyse un fichier suspect (PDF ou image) pour détecter et extraire le filigrane et identifier le compte source.

- **Permissions requises** : `IsAuthenticated`, `IsAdminUser` (`role in ['admin', 'super_admin']`)
- **Content-Type** : `multipart/form-data`

### Requête
| Paramètre | Type | Obligatoire | Description |
|---|---|---|---|
| `file` | `File` (binaire) | Oui | Document suspect PDF ou image (PNG, JPEG, WEBP) |
| `notes` | `string` | Non | Commentaires de l'administrateur sur le contexte du fichier |

### Réponse Succès (HTTP 200 OK)
```json
{
  "success": true,
  "data": {
    "investigation_id": "c1f7b09e-315f-4a02-86fe-2cf78b87199c",
    "file_name": "extrait_fuite_telegram.png",
    "file_hash": "a4d3f2780e927c3e5361304523bb802b115a3a29bc11e6bbd55734e5a98d3618",
    "file_size": 249120,
    "file_type": "image",
    "analysis_mode": "local_ocr",
    "certainty_score": 95,
    "status": "identified",
    "message": "Filigrane semi-transparent décodé avec succès. Utilisateur source formellement identifié.",
    "extracted_data": {
      "email": "mensah.koffi@univ-abomey.bj",
      "ip_address": "197.234.221.14",
      "user_id": "8b51d45c-e58f-43fb-bfa4-37053e1a61c3",
      "signature_valid": true,
      "raw_text_detected": "Licence accordée à Koffi Mensah (mensah.koffi@univ-abomey.bj) - IP: 197.234.221.14"
    },
    "suspect_profile": {
      "id": "8b51d45c-e58f-43fb-bfa4-37053e1a61c3",
      "full_name": "Koffi Mensah",
      "email": "mensah.koffi@univ-abomey.bj",
      "role": "student",
      "phone": "+22997001122",
      "country": "BJ",
      "university_affiliation": "Université d'Abomey-Calavi",
      "institution_name": "UNSTIM",
      "is_suspended": false,
      "suspension_reason": "",
      "created_at": "2026-02-14T10:20:00Z"
    },
    "book_details": {
      "id": "23fa3b42-1e94-4d8b-90f7-1b058a9e4ef2",
      "title": "Droit des Affaires et Traité OHADA",
      "author": "Pr. Robert Dossou",
      "cover_url": "https://storage.lahatheque.bj/covers/ohada.jpg"
    },
    "purchase_details": {
      "order_id": "ord-8832-bj",
      "reference": "CMD-2026-08129",
      "purchase_date": "2026-08-10T14:30:00Z",
      "amount": 7500,
      "currency": "XOF",
      "payment_method": "MTN Mobile Money"
    },
    "matched_traces": [
      {
        "id": "trc-001",
        "ip_address": "197.234.221.14",
        "country": "BJ",
        "device_fingerprint": "Chrome/124.0.0.0 (Win64; x64)",
        "access_type": "read_chunk",
        "page_number": 42,
        "timestamp": "2026-08-18T19:42:15Z"
      }
    ],
    "available_actions": {
      "can_suspend": true,
      "can_revoke_sessions": true,
      "can_download_report": true
    }
  },
  "error": null
}
```

---

## 2. POST `/api/v1/protection/forensic/mitigate/`

Applique une sanction immédiate sur le compte de l'utilisateur identifié.

- **Permissions requises** : `IsAuthenticated`, `IsAdminUser`
- **Content-Type** : `application/json`

### Requête
```json
{
  "investigation_id": "c1f7b09e-315f-4a02-86fe-2cf78b87199c",
  "action": "suspend_user", // ou "revoke_sessions"
  "reason": "Fuite délibérée de l'ouvrage OHADA sur canaux publics"
}
```

### Réponse Succès (HTTP 200 OK)
```json
{
  "success": true,
  "data": {
    "investigation_id": "c1f7b09e-315f-4a02-86fe-2cf78b87199c",
    "action_executed": "suspend_user",
    "user_id": "8b51d45c-e58f-43fb-bfa4-37053e1a61c3",
    "is_suspended": true,
    "session_version": 2,
    "message": "Le compte du lecteur a été suspendu et toutes ses sessions actives ont été révoquées immédiatement."
  },
  "error": null
}
```

---

## 3. GET `/api/v1/protection/forensic/report/<investigation_id>/`

Télécharge le rapport officiel de preuve certifiée au format PDF.

- **Permissions requises** : `IsAuthenticated`, `IsAdminUser`
- **Réponse** : Binaire `application/pdf` avec en-tête `Content-Disposition: attachment; filename="rapport_forensique_LAHA_{investigation_id}.pdf"`
