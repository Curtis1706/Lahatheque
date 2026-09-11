# Data Model: Forensic Leak Detection & Watermark Extraction

**Feature Branch**: `007-forensic-leak-detection`
**Date**: 2026-09-11
**Status**: Ready

---

## 1. Entité Backend (Django ORM)

### Modèle `ForensicInvestigation`
Ce modèle assure la traçabilité légale et l'archivage complet de chaque acte d'investigation forensique réalisé par un administrateur sur la plateforme LAHAThèque.

**Emplacement** : `apps/protection/models.py`

| Champ | Type | Contraintes | Description |
|---|---|---|---|
| `id` | `UUIDField` | `primary_key=True, default=uuid.uuid4, editable=False` | Identifiant unique de l'enquête |
| `admin_user` | `ForeignKey(settings.AUTH_USER_MODEL)` | `on_delete=models.CASCADE, related_name='forensic_investigations'` | Administrateur ayant diligenté l'analyse |
| `file_name` | `CharField(max_length=255)` | Non nul | Nom original du document suspect soumis |
| `file_type` | `CharField(max_length=32)` | `choices=['pdf', 'image']` | Nature du fichier téléversé |
| `file_size` | `BigIntegerField` | Non nul | Taille en octets du document |
| `file_hash` | `CharField(max_length=64)` | `db_index=True` | Empreinte cryptographique SHA-256 du fichier |
| `analysis_mode` | `CharField(max_length=32)` | `choices=['pdf_steganography', 'local_ocr', 'multimodal_vision', 'inconclusive']` | Méthode ayant permis l'identification |
| `certainty_score` | `IntegerField` | Valeur entre 0 et 100 | Score de certitude calculé |
| `status` | `CharField(max_length=32)` | `choices=['identified', 'inconclusive', 'no_trace']`, `db_index=True` | Résultat de l'analyse forensique |
| `detected_payload` | `JSONField` | `default=dict` | Données brutes extraites (tatouage invisible, textes OCR, etc.) |
| `suspect_user` | `ForeignKey(settings.AUTH_USER_MODEL)` | `null=True, blank=True, on_delete=models.SET_NULL, related_name='forensic_findings'` | Utilisateur identifié comme source de la fuite |
| `suspect_email` | `CharField(max_length=255)` | `blank=True` | Adresse e-mail extraite |
| `suspect_ip` | `GenericIPAddressField` | `null=True, blank=True` | Adresse IP rattachée |
| `ouvrage` | `ForeignKey('catalog.Ouvrage')` | `null=True, blank=True, on_delete=models.SET_NULL` | Ouvrage concerné si identifié |
| `order_reference` | `CharField(max_length=64)` | `blank=True` | Référence de la commande d'achat associée |
| `actions_taken` | `JSONField` | `default=list` | Liste des sanctions appliquées (`['account_suspended', 'sessions_revoked', 'report_exported']`) |
| `notes` | `TextField` | `blank=True` | Commentaires et annotations de l'administrateur |
| `created_at` | `DateTimeField` | `auto_now_add=True, db_index=True` | Horodatage de l'investigation |

---

## 2. Dictionnaire des États de l'Investigation

```text
[Dépôt du Fichier Suspect]
           │
           ▼
[Extraction Binaire / OCR / Vision]
           │
     ┌─────┴─────────────────────┐
     ▼                           ▼
[Marqueur Trouvé]        [Aucun Marqueur]
     │                           │
     ▼                           ▼
[Corrélation DB]           [Score: 0%]
     │                     Statut: no_trace
     ├───────────────────────────┐
     ▼                           ▼
[Corrélation 100%]        [Corrélation Partielle]
Score: 100%               Score: 70-95%
Statut: identified        Statut: identified / inconclusive
     │                           │
     └─────────────┬─────────────┘
                   ▼
       [Actions Administrateur]
       ├── Suspendre le compte
       ├── Révoquer les sessions
       └── Exporter le rapport certifié
```

---

## 3. Interfaces TypeScript (Frontend)

**Emplacement** : `lahatheque-frontend/lib/services/protection.ts`

```typescript
export interface ForensicAnalysisResult {
  investigation_id: string;
  file_name: string;
  file_hash: string;
  file_size: number;
  file_type: "pdf" | "image";
  analysis_mode: "pdf_steganography" | "local_ocr" | "multimodal_vision" | "inconclusive";
  certainty_score: number; // 0 à 100
  status: "identified" | "inconclusive" | "no_trace";
  message: string;
  extracted_data: {
    user_id?: string;
    email?: string;
    ip_address?: string;
    device_fingerprint?: string;
    signature_valid?: boolean;
    raw_text_detected?: string;
  };
  suspect_profile?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    phone?: string;
    country: string;
    university_affiliation?: string;
    institution_name?: string;
    is_suspended: boolean;
    suspension_reason?: string;
    created_at: string;
  };
  book_details?: {
    id: string;
    title: string;
    author: string;
    cover_url?: string;
  };
  purchase_details?: {
    order_id: string;
    reference: string;
    purchase_date: string;
    amount: number;
    currency: string;
    payment_method: string;
  };
  matched_traces: Array<{
    id: string;
    ip_address: string;
    country: string;
    device_fingerprint: string;
    access_type: string;
    page_number?: number;
    timestamp: string;
  }>;
  available_actions: {
    can_suspend: boolean;
    can_revoke_sessions: boolean;
    can_download_report: boolean;
  };
}
```
