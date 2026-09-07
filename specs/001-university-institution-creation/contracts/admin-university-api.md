# Interface Contract: Admin University & Institution API

**Feature**: `001-university-institution-creation`
**Date**: 2026-09-08
**Status**: Complete

## 1. Création d'un Compte Université (`POST /api/v1/admin/users/`)

### Payload Requête (JSON)

#### Cas A : Rattachement à une Institution existante
```json
{
  "email": "kossi@uac.bj",
  "first_name": "Kossi",
  "last_name": "Adambounou",
  "phone": "+2290197000000",
  "country": "BJ",
  "role": "university",
  "institution_id": "b8f0477e-28f0-4a8f-b98a-1a2b3c4d5e6f"
}
```

#### Cas B : Création conjointe avec une Nouvelle Institution
```json
{
  "email": "mandataire@ul.tg",
  "first_name": "Afi",
  "last_name": "Agbemebio",
  "phone": "+22890000000",
  "country": "TG",
  "role": "university",
  "institution_mode": "new",
  "institution_name": "Université de Lomé",
  "institution_code": "UL",
  "institution_country": "TG"
}
```

### Réponse Succès (`201 Created`)
```json
{
  "success": true,
  "message": "Compte Université Partenaire créé avec succès. L'institution a été enregistrée et rattachée.",
  "user": {
    "id": "c1a2b3c4-d5e6-4a8f-b98a-1a2b3c4d5e6f",
    "email": "mandataire@ul.tg",
    "first_name": "Afi",
    "last_name": "Agbemebio",
    "role": "university",
    "institution": {
      "id": "d1a2b3c4-e5f6-4a8f-b98a-1a2b3c4d5e6f",
      "name": "Université de Lomé",
      "code": "UL",
      "royalty_rate": 15.0
    }
  },
  "temporary_password": "ABC123xyz...",
  "email_sent": true
}
```

### Réponse Erreur (`400 Bad Request`)
```json
{
  "success": false,
  "data": {},
  "error": "Une institution avec le code 'UL' existe déjà. Veuillez la sélectionner dans la liste existante."
}
```

---

## 2. Modification & Rattachement d'un Compte Existant (`PATCH /api/v1/admin/users/<id>/`)

### Payload Requête (JSON)
```json
{
  "first_name": "Kossi",
  "last_name": "Adambounou",
  "phone": "+2290197000000",
  "country": "BJ",
  "institution_id": "b8f0477e-28f0-4a8f-b98a-1a2b3c4d5e6f"
}
```

### Réponse Succès (`200 OK`)
```json
{
  "success": true,
  "message": "Informations du compte et institution rattachée mises à jour avec succès.",
  "user": {
    "id": "c1a2b3c4-d5e6-4a8f-b98a-1a2b3c4d5e6f",
    "email": "orphelin@test.bj",
    "first_name": "Kossi",
    "last_name": "Adambounou",
    "institution": {
      "id": "b8f0477e-28f0-4a8f-b98a-1a2b3c4d5e6f",
      "name": "Université de Parakou",
      "code": "UP"
    }
  }
}
```

---

## 3. Liste des Institutions Partenaires (`GET /api/v1/partners/institutions/`)

### Réponse Succès (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-uac",
      "name": "Université d'Abomey-Calavi",
      "short_name": "UAC",
      "code": "UAC",
      "country": "BJ",
      "royalty_rate": 15.0,
      "is_active": true
    },
    {
      "id": "uuid-up",
      "name": "Université de Parakou",
      "short_name": "UP",
      "code": "UP",
      "country": "BJ",
      "royalty_rate": 15.0,
      "is_active": true
    }
  ],
  "error": null
}
```
