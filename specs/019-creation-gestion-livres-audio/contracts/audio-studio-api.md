# API Contract: Studio Audio & Gestion des Livres Audio

**Base Path**: `/api/v1/audio/`  
**Authentication**: Obligatoire (Cookie HTTP-Only JWT ou Session Django)

---

## 1. Liste et Recherche des Livres Audio

### `GET /api/v1/audio/books/`
Permet de récupérer la liste des livres audio pour les interfaces de gestion des maquettistes, chefs maquettistes, juristes et administrateurs.

#### Paramètres de Requête (Query Params)
- `status` (string, optionnel) : Filtre par statut (`draft`, `pending_chief_review`, `pending_legal_review`, `published`, `rejected`).
- `q` (string, optionnel) : Recherche textuelle sur le titre ou les auteurs.
- `page` (integer, optionnel) : Numéro de page (défaut : 1).
- `page_size` (integer, optionnel) : Nombre d'éléments par page (défaut : 10).

#### Réponse HTTP 200 (Success)
```json
{
  "success": true,
  "data": {
    "count": 24,
    "total_pages": 3,
    "current_page": 1,
    "results": [
      {
        "id": "0436ccc1-3c14-4550-a572-3defb6c60740",
        "title": "Guide Pratique de Procédure Civile",
        "authors": ["Dr. Koffi Mensah"],
        "cover_url": "https://pub-98cb000b12874eae9d7deed8a2ead6ee.r2.dev/covers/civile.jpg",
        "discipline_name": "Sciences Juridiques",
        "country": "BJ",
        "has_male_voice": true,
        "has_female_voice": false,
        "tracks_count": 8,
        "total_duration_seconds": 14200,
        "price_audio": 3500.0,
        "price_audio_eur": 5.5,
        "status": "pending_chief_review",
        "created_by_name": "Aristide Maquettiste",
        "created_at": "2026-09-07T08:30:00Z"
      }
    ]
  },
  "error": null
}
```

---

## 2. Génération d'URL Présignée pour Téléversement Direct (R2)

### `POST /api/v1/audio/upload-url/`
Fournit une URL présignée S3/Cloudflare R2 pour téléverser directement un fichier audio (jusqu'à 500 Mo) sans saturer le serveur.

#### Corps de la Requête (JSON)
```json
{
  "filename": "chapitre1_voix_homme.mp3",
  "content_type": "audio/mpeg",
  "ouvrage_id": "0436ccc1-3c14-4550-a572-3defb6c60740",
  "voice_gender": "male",
  "track_type": "chapter",
  "chapter_number": 1
}
```

#### Réponse HTTP 200 (Success)
```json
{
  "success": true,
  "data": {
    "upload_url": "https://lahatheque.r2.cloudflarestorage.com/audio/0436ccc1/chapitre1_voix_homme.mp3?X-Amz-Signature=...",
    "file_key": "audio/0436ccc1/chapitre1_voix_homme.mp3",
    "public_stream_url": "https://pub-98cb000b12874eae9d7deed8a2ead6ee.r2.dev/audio/0436ccc1/chapitre1_voix_homme.mp3",
    "direct_to_r2": true
  },
  "error": null
}
```

---

## 3. Enregistrement / Finalisation du Livre Audio

### `POST /api/v1/audio/books/save/`
Enregistre ou met à jour le livre audio complet avec toutes ses pistes associées.

#### Corps de la Requête (JSON)
```json
{
  "mode": "attach",
  "ouvrage_id": "0436ccc1-3c14-4550-a572-3defb6c60740",
  "title": "Guide Pratique de Procédure Civile",
  "author_name": "Dr. Koffi Mensah",
  "country": "BJ",
  "category_id": "juridique",
  "study_level": "Master",
  "price_audio": 3500.0,
  "price_audio_eur": 5.5,
  "description": "Enregistrement sonore fidèle du traité...",
  "cover_image_key": null,
  "tracks": [
    {
      "voice_gender": "male",
      "track_type": "full",
      "chapter_number": 0,
      "title": "Livre complet – Voix homme",
      "file_key": "audio/0436ccc1/complet_male.mp3",
      "duration_seconds": 14200
    },
    {
      "voice_gender": "male",
      "track_type": "chapter",
      "chapter_number": 1,
      "title": "Chapitre 1 : Les Principes Généraux",
      "file_key": "audio/0436ccc1/ch1_male.mp3",
      "duration_seconds": 1820
    }
  ],
  "submit_for_review": true
}
```

#### Réponse HTTP 200 (Success)
```json
{
  "success": true,
  "data": {
    "ouvrage_id": "0436ccc1-3c14-4550-a572-3defb6c60740",
    "title": "Guide Pratique de Procédure Civile",
    "status": "pending_chief_review",
    "tracks_saved_count": 2,
    "message": "Livre audio enregistré et transmis au Chef Maquettiste pour validation."
  },
  "error": null
}
```

---

## 4. Actions de Validation / Rejet (Chef Maquettiste, Juriste, Admin)

### `POST /api/v1/audio/books/{id}/transition/`

#### Corps de la Requête (JSON)
```json
{
  "action": "approve_technical",
  "rejection_reason": null
}
```
*Actions possibles selon le rôle :*
- `submit_review` : Soumettre au Chef Maquettiste (Maquettiste)
- `approve_technical` : Valider techniquement et passer au Juriste (Chef Maquettiste)
- `reject_technical` : Rejeter avec `rejection_reason` (Chef Maquettiste)
- `approve_legal` : Valider légalement et publier (Juriste)
- `reject_legal` : Rejeter avec `rejection_reason` (Juriste)
- `publish_direct` : Publier immédiatement (Admin)
- `unpublish` : Dépublier vers brouillon (Admin)
