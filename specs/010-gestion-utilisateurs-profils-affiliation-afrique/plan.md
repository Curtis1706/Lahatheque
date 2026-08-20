# Plan Technique d'Implémentation: Module 10 - Gestion des Comptes, Profils et Accès par Rôle

**Feature**: `010-gestion-utilisateurs-profils-affiliation-afrique`  
**Architecture**: Monolithe Django 5.2 / DRF + Next.js 16 App Router  
**Source Métier**: Cahier des charges LAHAThèque v3.2 (Sections 1, 4.1, 4.2)

---

## 1. Architecture Globale du Module

```
[ Frontend Next.js 16 ]
       │
       ├─ /register (Auto-inscription simple : Client ou Auteur)
       ├─ /login & /forgot-password
       ├─ /profile (Édition profil, avatar R2, téléphone + indicatif)
       ├─ /student/university (Affiliation optionnelle : Matricule CSV ou Carte d'étudiant)
       ├─ /chief-layout (Dashboard Chef Maquettiste : File d'attente, prévisualisation, publication)
       ├─ /admin/users (Supervision, création admin, suspension, réinitialisation)
       │
       ▼ (Proxy BFF /api/bff/* avec Cookies HttpOnly)
[ Backend Django 5.2 / DRF ]
       │
       ├─ apps.accounts (User, CustomUserManager, RegisterView, MeView, ProfileViewSet)
       ├─ apps.partners (Institution, StudentAffiliation, AffiliationVerificationService)
       ├─ apps.catalog (OuvrageDepot, Ouvrage, ValidationChefMaquettisteService)
       │
       ▼
[ PostgreSQL Neon Serverless + Cloudflare R2 ]
```

---

## 2. Conception de la Base de Données

### 2.1. Extension du Modèle `User` (`apps/accounts/models.py`)
- `role` : Choix parmi les 10 rôles (`student`, `author`, `publisher`, `librarian`, `maquettiste`, `chef_maquettiste`, `juriste`, `manager`, `wholesaler`, `admin`).
- `phone_number` : `CharField(max_length=30, blank=True)` (ex: `+229 97 00 00 00`).
- `country_code` : `CharField(max_length=2, default='BJ')` (Code ISO 3166-1 alpha-2).
- `avatar` : `ImageField(upload_to='avatars/', null=True, blank=True)`.
- `institution` : `ForeignKey('partners.Institution', null=True, blank=True)`.
- `bio` : `TextField(blank=True)` (pour Auteurs).
- `pen_name` : `CharField(max_length=255, blank=True)` (Nom de plume public).

### 2.2. Modèle d'Affiliation Étudiante (`apps/partners/models.py`)
- `user` : `ForeignKey(User, on_delete=models.CASCADE, related_name='affiliations')`.
- `institution` : `ForeignKey(Institution, on_delete=models.CASCADE)`.
- `matricule` : `CharField(max_length=50, blank=True)`.
- `carte_etudiant_image` : `ImageField(upload_to='justificatifs_scolarite/', null=True, blank=True)`.
- `statut` : `CharField(choices=['non_affilie', 'en_attente_validation', 'valide', 'rejete', 'expire'], default='non_attente_validation')`.
- `motif_rejet` : `TextField(blank=True)`.
- `valide_par` : `ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)`.
- `valide_le` : `DateTimeField(null=True, blank=True)`.

### 2.3. Modèle de Pré-chargement des Étudiants par l'Université (`apps/partners/models.py`)
- `EtudiantInscrit` :
  - `institution` : `ForeignKey(Institution)`.
  - `matricule` : `CharField(max_length=50, db_index=True)`.
  - `nom` : `CharField(max_length=100)`.
  - `prenom` : `CharField(max_length=100)`.
  - `faculte` : `CharField(max_length=150, blank=True)`.
  - `annee_academique` : `CharField(max_length=20)` (ex: `2025-2026`).
  - `is_claimed` : `BooleanField(default=False)`.

---

## 3. Endpoints d'API Backend (DRF)

### 3.1. Authentification & Profils (`apps/accounts/urls.py`)
- `POST /api/v1/auth/register/` : Auto-inscription simple (Client ou Auteur).
- `POST /api/v1/auth/login/` : Connexion avec identifiant (email ou téléphone) + mot de passe.
- `GET /api/v1/auth/me/` : Récupération du profil complet de l'utilisateur connecté.
- `PATCH /api/v1/auth/profile/` : Mise à jour des informations personnelles et upload d'avatar.
- `POST /api/v1/auth/logout/` : Déconnexion avec blacklist du jeton JWT.

### 3.2. Gestion Administrative des Comptes (`apps/accounts/admin_views.py`)
- `GET /api/v1/admin/users/` : Liste paginée des utilisateurs avec filtres par rôle, statut, pays et recherche textuelle.
- `POST /api/v1/admin/users/` : Création administrative d'un compte privilégié (Maquettiste, Chef Maquettiste, Juriste, etc.).
- `PATCH /api/v1/admin/users/<id>/toggle-status/` : Activation / Suspension immédiate d'un compte.
- `POST /api/v1/admin/users/<id>/reset-password/` : Envoi d'un lien de réinitialisation sécurisé.

### 3.3. Affiliations Universitaires (`apps/partners/urls.py`)
- `POST /api/v1/partners/affiliations/claim/` : Demande d'affiliation étudiante (matricule ou photo de carte).
- `GET /api/v1/partners/affiliations/pending/` : Liste des demandes en attente pour le Bibliothécaire.
- `POST /api/v1/partners/affiliations/<id>/review/` : Approbation ou rejet avec motif par le Bibliothécaire.
- `POST /api/v1/partners/students/import-csv/` : Import en masse des matricules officiels par le Bibliothécaire.

### 3.4. Workflow Chef Maquettiste (`apps/catalog/urls.py`)
- `GET /api/v1/catalog/deposits/` : File d'attente des dépôts de maquettes pour le Chef Maquettiste.
- `GET /api/v1/catalog/deposits/<id>/` : Détail complet pour inspection (fichiers, métadonnées IA, audio).
- `POST /api/v1/catalog/deposits/<id>/validate/` : Validation atomique et publication immédiate sur la vitrine.
- `POST /api/v1/catalog/deposits/<id>/reject/` : Rejet avec motif obligatoire.

---

## 4. Interfaces Frontend (Next.js 16)

1. **`/register`** : Formulaire à deux onglets épurés ("Compte Lecteur / Étudiant" et "Compte Auteur") avec sélecteur d'indicatif pays africain.
2. **`/profile`** : Espace profil universel avec changement d'avatar, mise à jour des coordonnées et badge de rôle.
3. **`/student/university`** : Espace d'activation optionnel de l'affiliation universitaire pour les étudiants.
4. **`/librarian/affiliations`** : Tableau de bord du Bibliothécaire pour valider les cartes d'étudiants et importer les listes CSV.
5. **`/chief-layout` & `/chief-layout/validation/[id]`** : Espace de travail du Chef Maquettiste pour examiner les épreuves et publier en un clic.
6. **`/admin/users`** : Tableau de bord d'administration des utilisateurs avec modale de création et actions rapides.
