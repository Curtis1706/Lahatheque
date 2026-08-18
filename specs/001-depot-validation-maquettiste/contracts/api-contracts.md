# Contrats d'API REST: Depot et Validation du Catalogue

Base URL : `https://lahatheque.com/api/v1/catalog/`

---

## 1. Creer un Depot d'Ouvrage (Maquettiste)

- **Methode** : `POST`
- **Route** : `/api/v1/catalog/depots/`
- **Permissions** : `IsAuthenticated` (Role `maquettiste`, `admin`)
- **Content-Type** : `application/json` ou `multipart/form-data`

### Payload de Requete
```json
{
  "titre": "Chimie Organique Avancee",
  "sous_titre": "Mecanismes reactionnels et stereochimie",
  "auteur_nom": "Prof. Jean-Marc Koffi",
  "isbn": "978-2-84123-456-7",
  "discipline": "Chimie",
  "langue": "français",
  "pays": "Bénin",
  "faculte": "Faculté des Sciences et Techniques (FAST)",
  "departement": "Chimie Fondamentale",
  "format_fichier": "pdf",
  "fichier_numerique_path": "uploads/temp/chimie_organique.pdf",
  "couverture_path": "uploads/temp/couverture_chimie.jpg",
  "has_audio": false
}
```

### Reponse 201 Created
```json
{
  "success": true,
  "data": {
    "id": "e4f8b2a1-3c9d-4e5f-8a1b-2c3d4e5f6a7b",
    "titre": "Chimie Organique Avancee",
    "statut": "en_attente",
    "maquettiste_nom": "Koffi Mensah",
    "created_at": "2026-08-18T11:30:00Z"
  },
  "error": null
}
```

---

## 2. Lister les Depots (Filtrable)

- **Methode** : `GET`
- **Route** : `/api/v1/catalog/depots/?statut=en_attente&discipline=Chimie`
- **Permissions** : `IsAuthenticated`

### Reponse 200 OK
```json
{
  "success": true,
  "data": {
    "count": 1,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": "e4f8b2a1-3c9d-4e5f-8a1b-2c3d4e5f6a7b",
        "titre": "Chimie Organique Avancee",
        "auteur_nom": "Prof. Jean-Marc Koffi",
        "discipline": "Chimie",
        "langue": "français",
        "pays": "Bénin",
        "statut": "en_attente",
        "created_at": "2026-08-18T11:30:00Z"
      }
    ]
  },
  "error": null
}
```

---

## 3. Valider un Depot (Chef Maquettiste)

- **Methode** : `POST`
- **Route** : `/api/v1/catalog/depots/{id}/valider/`
- **Permissions** : `IsAuthenticated` (Role `chef_maquettiste`, `admin`, `superadmin`)

### Payload de Requete
```json
{
  "prix_unitaire": 15000,
  "devise": "XOF",
  "mode_commercial": "vente_et_abonnement"
}
```

### Reponse 200 OK
```json
{
  "success": true,
  "data": {
    "depot_id": "e4f8b2a1-3c9d-4e5f-8a1b-2c3d4e5f6a7b",
    "ouvrage_id": "5f3e2a1b-4c9d-4e5f-8a1b-2c3d4e5f6a7c",
    "statut": "valide",
    "is_published": true,
    "date_validation": "2026-08-18T11:35:00Z"
  },
  "error": null
}
```

---

## 4. Rejeter un Depot (Chef Maquettiste)

- **Methode** : `POST`
- **Route** : `/api/v1/catalog/depots/{id}/rejeter/`
- **Permissions** : `IsAuthenticated` (Role `chef_maquettiste`, `admin`, `superadmin`)

### Payload de Requete
```json
{
  "motif": "La resolution de la couverture est insuffisante (minimum 300 DPI requis)."
}
```

### Reponse 200 OK
```json
{
  "success": true,
  "data": {
    "depot_id": "e4f8b2a1-3c9d-4e5f-8a1b-2c3d4e5f6a7b",
    "statut": "rejete",
    "motif": "La resolution de la couverture est insuffisante (minimum 300 DPI requis)."
  },
  "error": null
}
```
