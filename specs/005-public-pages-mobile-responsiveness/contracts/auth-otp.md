# Contrats d'Interface API — Authentification & Vérification OTP

## 1. POST `/api/v1/accounts/register/` (ou proxy BFF `/api/bff/auth/register/`)

Crée un nouveau compte utilisateur et déclenche l'envoi initial de l'OTP par e-mail.

### Requête (JSON ou `multipart/form-data`)
```json
{
  "email": "lecteur@example.com",
  "password": "Password123!",
  "first_name": "Jean",
  "last_name": "Kouassi",
  "phone": "+22997000000",
  "country": "BJ",
  "role": "student"
}
```

### Réponse Succès (`201 Created`)
```json
{
  "success": true,
  "data": {
    "tokens": {
      "access": "eyJhbGciOi...",
      "refresh": "eyJhbGciOi..."
    },
    "user": {
      "id": "e4f8b2d1-93c4-4b95-a1f9-86c04f98213b",
      "email": "lecteur@example.com",
      "first_name": "Jean",
      "last_name": "Kouassi",
      "role": "student",
      "is_verified": false
    },
    "requires_otp": true
  },
  "message": "Compte créé avec succès."
}
```

---

## 2. POST `/api/v1/accounts/otp/request/` (ou proxy BFF `/api/bff/auth/otp/request/`)

Demande le renvoi d'un code OTP par e-mail ou SMS.

### Requête
```json
{
  "identifier": "lecteur@example.com",
  "channel": "email"
}
```

### Réponse Succès (`200 OK`)
```json
{
  "success": true,
  "message": "Un code de vérification à 6 chiffres a été envoyé par e-mail."
}
```

### Réponse Rate Limit (`429 Too Many Requests`)
```json
{
  "success": false,
  "error": "Veuillez attendre 30 secondes avant de demander un nouvel envoi."
}
```

---

## 3. POST `/api/v1/accounts/otp/verify/` (ou proxy BFF `/api/bff/auth/otp/verify/`)

Valide le code OTP saisi. Dès validation, tous les OTPs actifs sont consommés, `is_verified` passe à `True`, et les jetons d'accès définitifs sont restitués pour auto-connexion.

### Requête
```json
{
  "identifier": "lecteur@example.com",
  "code": "482910"
}
```

### Réponse Succès (`200 OK`)
```json
{
  "success": true,
  "data": {
    "tokens": {
      "access": "eyJhbGciOi...",
      "refresh": "eyJhbGciOi..."
    },
    "user": {
      "id": "e4f8b2d1-93c4-4b95-a1f9-86c04f98213b",
      "email": "lecteur@example.com",
      "role": "student",
      "is_verified": true
    }
  },
  "message": "Votre compte a été vérifié avec succès !"
}
```

### Réponse Erreur Code Invalide (`400 Bad Request`)
```json
{
  "success": false,
  "error": "Code de vérification incorrect. Veuillez vérifier les 6 chiffres."
}
```
