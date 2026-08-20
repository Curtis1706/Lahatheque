# Tasks: Module 10 - Gestion des Comptes, Profils et Accès par Rôle

**Feature**: `010-gestion-utilisateurs-profils-affiliation-afrique`  
**Status**: Completed  
**Dependencies**: Next.js 16 App Router, Django 5.2 / DRF, PostgreSQL Neon, Cloudflare R2

---

## Phase 1 : Backend Models & Migrations (Django)

- [x] **T-101** : Enrichir le modèle `User` (`apps/accounts/models.py`) avec les champs `phone`, `country`, `avatar`, `bio`, `pen_name`, `institution`, `is_suspended`, `suspension_reason` et les 10 rôles complets.
- [x] **T-102** : Créer le modèle `EtudiantInscrit` et enrichir `StudentAffiliation` dans `apps/partners/models.py` pour supporter la vérification instantanée par matricule préchargé (CSV) et par téléversement de carte d'étudiant.
- [x] **T-103** : Exécuter `python manage.py makemigrations` et `python manage.py migrate` pour appliquer les schémas en base de données.

---

## Phase 2 : Backend API Views & Serializers (DRF)

- [x] **T-104** : Créer `RegisterSerializer` et `RegisterView` dans `apps/accounts/views.py` pour supporter l'auto-inscription simple (Client/Lecteur et Auteur) avec numéro de téléphone et indicatif pays.
- [x] **T-105** : Implémenter `UserProfileViewSet` (`GET /api/v1/auth/me/`, `PATCH /api/v1/auth/profile/`) avec gestion de l'upload d'avatar sur Cloudflare R2.
- [x] **T-106** : Créer `AdminUserManagementViewSet` (`apps/accounts/admin_views.py`) pour lister, filtrer par rôle, créer des comptes internes (Chef Maquettiste, Juriste, etc.), suspendre ou réactiver.
- [x] **T-107** : Implémenter l'API d'affiliation étudiante (`apps/partners/views.py`) : vérification automatique de matricule, upload de justificatif et validation par le bibliothécaire.
- [x] **T-108** : Finaliser le ViewSet Chef Maquettiste dans `apps/catalog/views.py` (`validate_deposit`, `reject_deposit` avec motif obligatoire et publication atomique de l'`Ouvrage`).

---

## Phase 3 : Frontend Views & Components (Next.js 16)

- [x] **T-109** : Mettre à jour la page `/register` (`app/(auth)/register/page.tsx`) avec les deux onglets épurés (Lecteur/Étudiant et Auteur) et le sélecteur d'indicatif pays africain.
- [x] **T-110** : Créer le composant de profil universel `/profile` (`app/(dashboard)/profile/page.tsx`) avec mise à jour des coordonnées, nom de plume / bio auteur et changement d'avatar R2.
- [x] **T-111** : Construire l'interface `/student/university` (`app/(dashboard)/student/university/page.tsx`) pour permettre à l'étudiant de lier son compte à son université (saisie de matricule ou photo de carte) et accéder à son bouquet.
- [x] **T-112** : Implémenter le tableau de bord du Chef Maquettiste `/chief-layout` et la page d'inspection `/chief-layout/validation/[id]` avec feuilletage d'épreuve et validation en 1 clic.
- [x] **T-113** : Connecter le tableau de bord d'administration des utilisateurs `/admin/users` avec modale de création de comptes et actions de suspension.

---

## Phase 4 : Verification & Quality Gate

- [x] **T-114** : Vérifier que 100% des composants respectent la charte sémantique sans couleur hexadécimale en dur.
- [x] **T-115** : Exécuter la compilation de test `npm run build` et valider l'absence totale d'erreurs TypeScript sur les 104 routes.
- [x] **T-116** : Tester les flux de création de compte, validation d'affiliation et publication par le Chef Maquettiste.
