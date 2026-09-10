# Modèle de Données — Feature 005 : Responsivité Mobile & Authentification OTP

## 1. Entités Clés

### Entité `User` (Modèle Django `apps.accounts.models.User`)

Représente un utilisateur authentifié sur la plateforme.


| Champ          | Type         | Contraintes                         | Description                                   |
| ---------------- | -------------- | ------------------------------------- | ----------------------------------------------- |
| `id`           | UUID         | Clé primaire, default=uuid4        | Identifiant unique immuable                   |
| `email`        | EmailField   | Unique, normalisé (lowercase)      | Identifiant principal de connexion            |
| `username`     | CharField    | Unique (égal à l'email)           | Compatibilité Django standard                |
| `phone`        | CharField    | Nullable, max_length=30             | Numéro de téléphone international          |
| `role`         | CharField    | Choices (`student`, `author`, etc.) | Rôle primaire de l'utilisateur               |
| `active_roles` | JSONField    | Default=list                        | Rôles multiples autorisés                   |
| `is_verified`  | BooleanField | Default=False                       | Statut de validation de l'adresse/téléphone |
| `is_active`    | BooleanField | Default=True                        | Compte actif ou désactivé                   |
| `is_suspended` | BooleanField | Default=False                       | Suspension pour motif de modération          |
| `avatar`       | ImageField   | Upload_to='avatars/', Nullable      | Photo de profil stockée sur R2               |

### Entité `OTP` (Modèle Django `apps.accounts.models.OTP`)

Code de vérification à usage unique généré lors de la création de compte ou de la réinitialisation.


| Champ         | Type             | Contraintes                  | Description                                  |
| --------------- | ------------------ | ------------------------------ | ---------------------------------------------- |
| `id`          | BigAutoField     | Clé primaire                | Identifiant technique                        |
| `user`        | ForeignKey(User) | Related_name='otps', CASCADE | Utilisateur propriétaire                    |
| `code`        | CharField        | Max_length=6, format`\d{6}`  | Code secret à 6 chiffres                    |
| `channel`     | CharField        | Choices (`sms`, `email`)     | Canal d'expédition utilisé                 |
| `is_verified` | BooleanField     | Default=False                | Code consommé ou en attente                 |
| `created_at`  | DateTimeField    | Default=timezone.now         | Horodatage de génération                   |
| `expires_at`  | DateTimeField    | Indispensable                | Date/heure d'expiration (création + 15 min) |

---

## 2. Transitions d'États

### Cycle de Vie Utilisateur lors de l'Inscription

```
[ Visiteur sur /register ]
          │
          ▼
   ( Étape 1 : Choix Rôle & Avatar )
          │
          ▼
   ( Étape 2 : Nom, Prénom & Mobile )
          │
          ▼
   ( Étape 3 : Email & Mot de passe )
          │
          ▼
  POST /api/v1/accounts/register/
          │
          ├─────────────────────────────────────────┐
          ▼                                         ▼
   [ User créé (is_verified=False) ]       [ Envoi OTP (Email Resend / SMS) ]
          │                                         │
          └───────────────────┬─────────────────────┘
                              ▼
               ( Étape 4 : Saisie OTP sur /register )
                              │
                              ▼
                    POST /api/v1/accounts/otp/verify/
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
    [ Code Correct ]                       [ Code Invalide ou Expiré ]
          │                                       │
          ├─ OTP.is_verified = True               └─ Erreur retournée
          ├─ User.is_verified = True                 (possibilité de renvoi)
          ├─ Tokens JWT délivrés
          ▼
   [ Redirection directe ]
   -> /student ou /author
```

### Cycle de Connexion Standard (`/login`)

```
[ Visiteur sur /login ]
          │
          ▼
  POST /api/v1/accounts/login/ (email/téléphone + mot de passe)
          │
          ▼
  [ Authentification réussie ]
          │
          ▼ (ZÉRO ÉTAPE D'OTP REQUISE)
  [ Tokens JWT délivrés dans cookies HttpOnly ]
          │
          ▼
  [ Redirection Dashboard ]
```
