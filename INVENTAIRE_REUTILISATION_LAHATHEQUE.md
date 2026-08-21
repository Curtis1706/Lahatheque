# INVENTAIRE DE RÉUTILISATION : LAHAACADEMIA → LAHATHÈQUE v3.2

## Table des matières
1. [Authentification & Sécurité (Cible `accounts`)](#1-authentification--sécurité--cible-accounts)
2. [Lecteur de document sécurisé (Cible `protection` / Frontend lecture)](#2-lecteur-de-document-sécurisé--cible-protection--frontend-lecture)
3. [Stockage & Médias (Cible `catalog` / `audio`)](#3-stockage--médias--cible-catalog--audio)
4. [Paiement & Abonnements (Cible `commerce` / `rights`)](#4-paiement--abonnements--cible-commerce--rights)
5. [Notifications & Messagerie (Cible `reporting` / Transverse)](#5-notifications--messagerie--cible-reporting--transverse)
6. [Aide & Documentation Utilisateur (Cible Transverse)](#6-aide--documentation-utilisateur--cible-transverse)
7. [Infrastructure Django Générale (Cible Configuration Projet)](#7-infrastructure-django-générale--cible-configuration-projet)
8. [Composants UI Structurels](#8-composants-ui-référence-structurelle)
9. [Modèles de Données Transverses](#9-modèles-de-données-transverses)
10. [Synthèse Finale & Feuille de Route](#10-synthèse-finale--feuille-de-route)

---

## 1. Authentification & Sécurité → Cible `accounts`

### Route API BFF Session HttpOnly
- **Fichier** : `frontend/app/api/auth/session/route.ts`
- **Type** : Fichier de configuration / Routes API Next.js
- **Description** : Couche BFF (Backend-For-Frontend) qui gère l'authentification `POST` (login), `GET` (session), `PUT` (refresh silencieux) et `DELETE` (logout). Stocke les tokens JWT secrets (`access` et `refresh`) dans des cookies de navigateur `HttpOnly`, `SameSite=Lax`, `Secure`, tout en exposant le timestamp Unix `access_expires_at` dans un cookie UI lisible sans fuite de secrets.
- **Réutilisation pour LAHAThèque** : Copie directe
- **App/module cible LAHAThèque** : `frontend/app/api/auth/session/route.ts` (BFF)
- **Dépendances** : `next`, `zod`
- **Effort estimé** : Faible

### Hook Client d'Authentification (`useAuth`)
- **Fichier** : `frontend/hooks/use-auth.ts`
- **Type** : Hook React / Contexte TSX
- **Description** : Gestionnaire d'état d'authentification React centralisé. Synchronise le profil utilisateur en mémoire avec le cookie UI `user_session_client`, expose les méthodes de login, logout et rafraîchissement silencieux de session via l'API BFF.
- **Réutilisation pour LAHAThèque** : Adaptation nécessaire (adapter la structure du profil utilisateur aux rôles LAHAThèque : juriste, éditeur, université).
- **App/module cible LAHAThèque** : `frontend/hooks/use-auth.ts`
- **Dépendances** : `react`, `axios` / `fetch`
- **Effort estimé** : Faible

### Composant de Garde de Route (`AuthGuard`)
- **Fichier** : `frontend/components/auth-guard.tsx`
- **Type** : Composant React (HOC / Wrapper)
- **Description** : Composant protégeant les pages réservées selon le rôle actif (`resolveAuthorization`). Intègre un moteur de refresh proactif planifié sur le timestamp `access_expires_at` du JWT avec déduplication multi-onglets via la `Web Locks API` (`navigator.locks`).
- **Réutilisation pour LAHAThèque** : Adaptation nécessaire (mise à jour des rôles autorisés).
- **App/module cible LAHAThèque** : `frontend/components/auth-guard.tsx`
- **Dépendances** : `react`, `next/navigation`
- **Effort estimé** : Faible

### Middleware de Routage Next.js
- **Fichier** : `frontend/middleware.ts`
- **Type** : Middleware Next.js
- **Description** : Contrôle d'accès au niveau des requêtes HTTP Next.js. Intercepte la présence du cookie `user_session_client` ou `laha_access` pour rediriger automatiquement les utilisateurs non connectés ou réorienter les utilisateurs connectés vers le dashboard correspondant à leur rôle.
- **Réutilisation pour LAHAThèque** : Adaptation nécessaire (mise à jour du dictionnaire de redirections par rôle).
- **App/module cible LAHAThèque** : `frontend/middleware.ts`
- **Dépendances** : `next/server`
- **Effort estimé** : Faible

### Modèle Custom User avec Multi-Rôles et Versioning
- **Fichier** : `backend/core/models.py`
- **Type** : Modèle Django (`User`)
- **Description** : Modèle `User` héritant de `AbstractUser` avec UUID comme clé primaire, gestion multi-rôles, statut de vérification, champ `last_active_at` pour la présence, et un champ `session_version` pour l'invalidation globale multi-appareils.
- **Réutilisation pour LAHAThèque** : Adaptation nécessaire (adapter la constante `ROLE_CHOICES` aux rôles LAHAThèque : `student`, `teacher`, `university`, `publisher`, `legal_reviewer`, `admin`).
- **App/module cible LAHAThèque** : `accounts/models.py`
- **Dépendances** : `django.contrib.auth.models`, `django_countries`, `phonenumber_field`
- **Effort estimé** : Faible

### Factory d'Inscription d'Utilisateurs (`_register_user`)
- **Fichier** : `backend/accounts/services.py`
- **Type** : Fonction Python / Service Pattern
- **Description** : Fonction factory orchestrant la création atomique d'un utilisateur (`User.objects.create_user`), l'initialisation du profil métier associé, l'attribution du rôle dynamique et l'envoi du code OTP initial.
- **Réutilisation pour LAHAThèque** : Adaptation nécessaire (brancher les profils spécifiques LAHAThèque : `PublisherProfile`, `LibrarianProfile`).
- **App/module cible LAHAThèque** : `accounts/services.py`
- **Dépendances** : `django.db.transaction`
- **Effort estimé** : Faible

### Contrôles de Sécurité et Permissions anti-IDOR
- **Fichier** : `backend/parents/permissions.py`
- **Type** : Classes de Permissions DRF (`BasePermission`)
- **Description** : Ensembles de classes de vérification granulaire (`IsLinkedToStudent`, `IsParentProfileOwner`, `CanViewStudentProgress`). Vérifie l'appartenance d'une ressource via la table d'association parent-élève avant d'autoriser l'accès aux requêtes.
- **Réutilisation pour LAHAThèque** : Référence architecturale (transposable à la vérification des droits d'accès des étudiants via leur affiliation institutionnelle/bibliothèque).
- **App/module cible LAHAThèque** : `rights/permissions.py` / `accounts/permissions.py`
- **Dépendances** : `rest_framework.permissions`
- **Effort estimé** : Moyen

### Rate Throttling DRF & Protection Anti-Bruteforce
- **Fichier** : `backend/core/throttling.py` & `backend/lahaacademia/settings.py`
- **Type** : Classes Python & Configuration Django
- **Description** : Définition des classes de limitation de débit (`AuthThrottle`, `PaymentThrottle`, `SubmissionThrottle`) héritant de `UserRateThrottle`, combinées à la configuration `Django Axes` (verrouillage de compte après 5 échecs consécutifs pendant 15 minutes).
- **Réutilisation pour LAHAThèque** : Copie directe
- **App/module cible LAHAThèque** : `accounts/throttling.py` & configuration projet
- **Dépendances** : `djangorestframework`, `django-axes`
- **Effort estimé** : Faible

---

## 2. Lecteur de Document Sécurisé → Cible `protection` / Frontend Lecture

### Composant Principal du Lecteur (`DocumentReaderPage`)
- **Fichier** : `frontend/app/library/view/[id]/page.tsx`
- **Type** : Composant React / Page Next.js
- **Description** : Structure complète du lecteur intégrant `@react-pdf-viewer/core`, les modes d'affichage (double page, immersion), la gestion de la thématique nuit/jour, les signets, le panneau de notes/surlignages, et l'intégration du lecteur audio/TTS.
- **Réutilisation pour LAHAThèque** : Adaptation nécessaire (intégration des contrôles de DRM LCP ou watermarking dynamique).
- **App/module cible LAHAThèque** : `frontend/app/catalog/reader/[id]/page.tsx` (Module `protection`)
- **Dépendances** : `@react-pdf-viewer/core`, `@react-pdf-viewer/default-layout`, `@react-pdf-viewer/highlight`, `framer-motion`, `lucide-react`
- **Effort estimé** : Moyen

### Hook de Sécurité Anti-Copie et Anti-Impression (`usePdfReaderSecurity`)
- **Fichier** : `frontend/app/library/view/[id]/hooks/usePdfReaderSecurity.ts`
- **Type** : Hook React
- **Description** : Intercepte les raccourcis clavier d'impression (`Ctrl+P` / `Cmd+P`) et de sauvegarde (`Ctrl+S` / `Cmd+S`), et bloque les événements de copie de texte (`copy`) dans les zones annotées du document (`.laha-reader-zone`).
- **Réutilisation pour LAHAThèque** : Copie directe (extensible pour bloquer les captures d'écran et l'inspection DevTools).
- **App/module cible LAHAThèque** : `frontend/hooks/use-pdf-security.ts`
- **Dépendances** : `react`, `sonner`
- **Effort estimé** : Faible

### Service d'Extraction de Texte PDF via PyMuPDF (`get_pdf_text_all_pages`)
- **Fichier** : `backend/core/document_views.py`
- **Type** : Vue DRF / Service Python
- **Description** : Extrait le texte intégral de chaque page d'un fichier PDF en mémoire via PyMuPDF (`fitz.open`), retournant une structure JSON indexée par numéro de page avec détection automatique des pages scannées/vides.
- **Réutilisation pour LAHAThèque** : Copie directe (servira pour l'indexation plein texte du moteur d'IA et pour la fonctionnalité de synthèse vocale TTS).
- **App/module cible LAHAThèque** : `protection/services.py` ou `ai_engine/services.py`
- **Dépendances** : `pymupdf` (`fitz`), `rest_framework`
- **Effort estimé** : Faible

### Hook de Gestion des Annotations et Notes (`useAnnotations`)
- **Fichier** : `frontend/app/library/view/[id]/hooks/useAnnotations.ts`
- **Type** : Hook React
- **Description** : Gère la persistance, la création, l'affichage et la suppression des annotations, notes de marge et surlignages associés à un document et à un utilisateur.
- **Réutilisation pour LAHAThèque** : Copie directe
- **App/module cible LAHAThèque** : `frontend/hooks/use-annotations.ts`
- **Dépendances** : `react`, `axios`
- **Effort estimé** : Faible

---

## 3. Stockage & Médias → Cible `catalog` / `audio`

### Driver de Stockage Cloudflare R2 (`R2MediaStorage`)
- **Fichier** : `backend/media/r2_storage.py`
- **Type** : Classe Python (Storage Backend Django)
- **Description** : Implémentation d'un backend de stockage personnalisé héritant de `S3Boto3Storage`, préconfiguré pour Cloudflare R2 (région `auto`, querystring_auth désactivé, domaine public R2).
- **Réutilisation pour LAHAThèque** : Copie directe (permet de stocker les livres PDF, EPUB et fichiers audio de LAHAThèque sur Cloudflare R2 sans frais d'egress).
- **App/module cible LAHAThèque** : `catalog/storage.py`
- **Dépendances** : `django-storages[s3]`, `boto3`
- **Effort estimé** : Faible

### Intégration Cloudflare Stream (Upload & Webhooks)
- **Fichier** : `backend/media/views.py` & `backend/media/stream_client.py`
- **Type** : Vues DRF & Client Python
- **Description** : Ensemble comprenant `StreamUploadView` (upload direct/URL vers Cloudflare Stream), `StreamWebhookView` (réception asynchrone du statut d'encodage `ready` et génération automatique de sous-titres FR) et `StreamStatusView` (polling de statut).
- **Réutilisation pour LAHAThèque** : Copie directe (pour le traitement et le streaming sécurisé HLS/M3U8 des livres audio et ressources d'accompagnement vidéo).
- **App/module cible LAHAThèque** : `audio/views.py` et `audio/services.py`
- **Dépendances** : `requests`, `rest_framework`
- **Effort estimé** : Faible

---

## 4. Paiement & Abonnements → Cible `commerce` / `rights`

### Client & Webhook Moneroo (`process_moneroo_webhook`)
- **Fichier** : `backend/payments/moneroo_client.py` & `backend/payments/webhooks.py`
- **Type** : Client API & Handler Webhook Idempotent
- **Description** : Intégration complète de la passerelle de paiement Mobile Money / Carte Moneroo. Gère l'initialisation du paiement, la vérification de signature et le traitement idempotent des webhooks avec verrouillage de ligne en base (`select_for_update`).
- **Réutilisation pour LAHAThèque** : Copie directe (pour le paiement d'abonnements individuels ou achats de bouquets par Mobile Money).
- **App/module cible LAHAThèque** : `commerce/services.py` & `commerce/webhooks.py`
- **Dépendances** : `requests`, `django.db.transaction`
- **Effort estimé** : Faible

### Pattern de Création Différée de Compte sur Paiement (`create_minor_child_profile`)
- **Fichier** : `backend/parents/services.py`
- **Type** : Service Python / Transaction Atomique
- **Description** : Pattern qui crée une entité avec `is_active=False` lorsque la création nécessite un paiement préalable, puis l'active de façon garantie lors de la réception du webhook de confirmation.
- **Réutilisation pour LAHAThèque** : Référence architecturale (directement transposable à la création de licences institutionnelles ou accès étudiants en attente de validation financière).
- **App/module cible LAHAThèque** : `rights/services.py`
- **Dépendances** : `django.db.transaction`
- **Effort estimé** : Moyen

---

## 5. Notifications & Messagerie → Cible `reporting` / Transverse

### Dispatcher de Notifications Multi-Canaux (`notify_user`)
- **Fichier** : `backend/notifications/services.py`
- **Type** : Service Python
- **Description** : Système centralisé vérifiant les préférences utilisateur (`NotificationPreference`), créant l'enregistrement en base pour le canal In-App, et déclenchant la tâche asynchrone Celery pour l'envoi d'emails.
- **Réutilisation pour LAHAThèque** : Copie directe (pour avertir les utilisateurs de l'expiration de leur prêt, de nouvelles acquisitions ou de messages éditeurs).
- **App/module cible LAHAThèque** : `reporting/notifications.py` / `common/notifications.py`
- **Dépendances** : `celery`
- **Effort estimé** : Faible

### Tâche Asynchrone Celery d'Envoi d'Email (`send_email_task`)
- **Fichier** : `backend/notifications/tasks.py`
- **Type** : Tâche Celery (`@shared_task`)
- **Description** : Tâche de fond gérant l'envoi fiable d'emails via Resend / SMTP avec politique de retry automatique en cas de défaillance réseau.
- **Réutilisation pour LAHAThèque** : Copie directe
- **App/module cible LAHAThèque** : `reporting/tasks.py`
- **Dépendances** : `celery`, `resend` / `django.core.mail`
- **Effort estimé** : Faible

---

## 6. Aide & Documentation Utilisateur → Cible Transverse

### Composant de Consultation du Guide Utilisateur (`GuideViewer`)
- **Fichier** : `frontend/components/ui/guide-viewer.tsx`
- **Type** : Composant React
- **Description** : Interface complète de documentation utilisateur avec table des matières interactive, recherche plein texte, rendu Markdown (`react-markdown` + `remark-gfm`), intégration vidéo Cloudflare Stream et filtrage dynamique par rôle.
- **Réutilisation pour LAHAThèque** : Copie directe (indispensable pour fournir la documentation adaptée aux nombreux rôles : étudiants, enseignants, bibliothécaires, éditeurs, juristes).
- **App/module cible LAHAThèque** : `frontend/components/ui/guide-viewer.tsx`
- **Dépendances** : `react-markdown`, `remark-gfm`, `framer-motion`, `lucide-react`
- **Effort estimé** : Faible

---

## 7. Infrastructure Django Générale → Cible Configuration Projet

### Configuration de Production & Sécurité (`settings.py`)
- **Fichier** : `backend/lahaacademia/settings.py`
- **Type** : Fichier de Configuration Django
- **Description** : Configuration complète prête pour la production : intégration SimpleJWT avec rotation et TTL strict, variables CORS dynamiques, en-têtes HSTS, `SECURE_PROXY_SSL_HEADER`, stockage R2 via `django-storages`, et logging des exceptions.
- **Réutilisation pour LAHAThèque** : Adaptation nécessaire (adapter les noms d'apps installées).
- **App/module cible LAHAThèque** : `lahatheque/settings.py`
- **Dépendances** : `django-environ`, `python-decouple`, `dj-database-url`
- **Effort estimé** : Faible

### Containerisation Docker Multi-Stage (`Dockerfile`)
- **Fichier** : `backend/Dockerfile`
- **Type** : Fichier de configuration Docker
- **Description** : Image Docker optimisée en deux étapes (`builder` + `production`) basée sur Python 3.11-slim, installant les dépendances C (`libpq-dev`), compilant les statiques et exécutant l'application via Gunicorn et WhiteNoise.
- **Réutilisation pour LAHAThèque** : Copie directe
- **App/module cible LAHAThèque** : `Dockerfile`
- **Dépendances** : Docker / Render / Koyeb
- **Effort estimé** : Faible

### Dépendances Backend (`requirements.txt`)
- **Fichier** : `backend/requirements.txt`
- **Type** : Fichier de Dépendances Pip
- **Description** : Liste fixée des paquets Python nécessaires : `Django 5.2`, `djangorestframework`, `djangorestframework-simplejwt`, `celery`, `redis`, `pymupdf`, `django-storages[s3]`, `boto3`, `drf-spectacular`, `django-axes`, `gunicorn`, `whitenoise`.
- **Réutilisation pour LAHAThèque** : Copie directe
- **App/module cible LAHAThèque** : `requirements.txt`
- **Effort estimé** : Faible

---

## 8. Composants UI (Référence Structurelle)

### Éditeur Enrichi WYSIWYG (`TiptapEditor`)
- **Fichier** : `frontend/components/admin/tiptap-editor.tsx`
- **Type** : Composant React
- **Description** : Éditeur WYSIWYG professionnel basé sur Tiptap, supportant l'upload d'images vers R2, l'intégration de vidéos Cloudflare Stream, les titres, formules mathématiques et le mode sombre.
- **Réutilisation pour LAHAThèque** : Adaptation nécessaire (pour la saisie des résumés d'ouvrages, actualités de la bibliothèque et fiches éditeurs).
- **App/module cible LAHAThèque** : `frontend/components/ui/tiptap-editor.tsx`
- **Dépendances** : `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`
- **Effort estimé** : Faible

### Page de Connexion Multi-Identifiants (`LoginPage`)
- **Fichier** : `frontend/app/(auth)/login/page.tsx`
- **Type** : Composant React / Page Next.js
- **Description** : Formulaire de connexion moderne supportant la bascule Email / Téléphone, la saisie masquée du mot de passe et la redirection automatique vers le dashboard du rôle connecté.
- **Réutilisation pour LAHAThèque** : Adaptation nécessaire (style visuel LAHA Éditions).
- **App/module cible LAHAThèque** : `frontend/app/(auth)/login/page.tsx`
- **Effort estimé** : Faible

---

## 9. Modèles de Données Transverses

### Hiérarchie Académique & Référentiels (`Subject`, `GradeLevel`, `AcademicYear`)
- **Fichier** : `backend/academics/models.py`
- **Type** : Modèles Django
- **Description** : Modèles gérant les matières scolaires/académiques, les niveaux d'études avec clé étrangère vers le niveau supérieur (`next_level` pour la promotion) et le calendrier annuel par pays.
- **Réutilisation pour LAHAThèque** : Adaptation nécessaire (transposable à la hiérarchie Disciplines → Facultés → Départements → Années d'études de LAHAThèque).
- **App/module cible LAHAThèque** : `catalog/models.py`
- **Dépendances** : `django.db.models`
- **Effort estimé** : Moyen

### Modèle Référentiel Pays (`Country`)
- **Fichier** : `backend/core/models.py`
- **Type** : Modèle Django
- **Description** : Modèle de référentiel des pays cibles avec code ISO à 2 lettres et libellé complet.
- **Réutilisation pour LAHAThèque** : Copie directe
- **App/module cible LAHAThèque** : `catalog/models.py` / `accounts/models.py`
- **Effort estimé** : Faible

---

## 10. Synthèse Finale & Feuille de Route

### Métriques d'inventaire
- **Nombre total d'éléments réutilisables identifiés** : 27 composants/modules majeurs.
- **Ventilation par domaine** :
  - Authentification & Sécurité : 8 éléments
  - Lecteur de Document Sécurisé : 4 éléments
  - Stockage & Médias : 2 éléments
  - Paiement & Abonnements : 3 éléments
  - Notifications & Messagerie : 2 éléments
  - Aide & Documentation : 1 élément
  - Infrastructure Django : 3 éléments
  - Composants UI : 2 éléments
  - Modèles de Données : 2 éléments

### Top 10 des éléments à plus fort impact et effort le plus faible
1. **Architecture BFF Session HttpOnly** (`frontend/app/api/auth/session/route.ts`) — Élimine totalement le risque de fuite de tokens JWT côté client dès le jour 1.
2. **Backend Storage Cloudflare R2** (`backend/media/r2_storage.py`) — Évite tout coût de bande passante/egress lors du téléchargement des livres et ressources.
3. **Module d'upload & streaming Cloudflare Stream** (`backend/media/views.py`) — Prêt pour le streaming HLS des livres audio.
4. **Hook de sécurité du lecteur PDF** (`frontend/app/library/view/[id]/hooks/usePdfReaderSecurity.ts`) — Bloque l'impression, la copie et la sauvegarde non autorisées.
5. **Service d'extraction de texte PyMuPDF** (`backend/core/document_views.py`) — Permet l'indexation plein texte et la lecture à voix haute immédiatement.
6. **Passerelle de Paiement Moneroo & Webhooks** (`backend/payments/moneroo_client.py`) — Support direct des paiements Mobile Money en Afrique francophone.
7. **Infrastructure Docker Multi-Stage** (`backend/Dockerfile`) — Déploiement instantané sur Render / Koyeb.
8. **Gestionnaire de Notifications Celery/Resend** (`backend/notifications/services.py`) — Distribution In-App et email prête à l'emploi.
9. **Système de Documentation par Rôle (`GuideViewer`)** (`frontend/components/ui/guide-viewer.tsx`) — Support utilisateur multi-rôles clé en main.
10. **Protection anti-bruteforce Django Axes & Throttling** (`backend/core/throttling.py` & `settings.py`) — Sécurisation automatique contre les attaques par force brute.

### Éléments spécifiques à construire pour LAHAThèque v3.2 (Non présents dans LahaAcademia)
1. **Serveur DRM Readium LCP** : Pour la protection et le prêt de livres numériques aux formats EPUB / PDF avec licence d'accès temporaire.
2. **Provider OAuth2 / SAML 2.0 pour Partenaires & Universités** : Permettant l'authentification unique (SSO) des étudiants via leurs identifiants universitaires institutionnels.
3. **Moteur d'importation aux normes ONIX 3.0** : Pour ingérer automatiquement les catalogues de métadonnées fournis par les maisons d'édition.
4. **Gestionnaire de Bouquets & Licences Établissement (`publishers_portal` / `rights`)** : Modèle de facturation et de quota par nombre d'accès simultanés pour les bibliothèques universitaires.
