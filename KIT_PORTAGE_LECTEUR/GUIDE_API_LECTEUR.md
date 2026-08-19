# 📖 Spécification & Guide d'Intégration — API Lecteur Hébergé LAHAThèque

> **Objectif** : Exposer **l'intégralité du lecteur de livres LAHAThèque** (moteur 3D FlipBook immersif, lecteur normal vertical `@react-pdf-viewer`, audio narratif, synthèse vocale TTS, annotations contextuelles, quiz interactifs, sécurité anti-copie) comme un **service d'API clé en main réutilisable par n'importe quelle application tierce**, quel que soit son écosystème technique (Django, Next.js, Symfony, Laravel, PHP, Node.js, Ruby, Flutter/Mobile...).
>
> **Modèle de distribution** : **Page hébergée sécurisée + flux de redirection** (modèle éprouvé type *Stripe Checkout* ou *OAuth2 Authorization Code*) — **sans dépendance front-end lourde, sans iframe complexe**.
>
> **Fournisseur (Provider)** : **LAHAThèque (`lahatheque.com`)**.

**Version du document** : 2.0 — Août 2026
**Statut** : Validé pour implémentation

---

## 📑 Sommaire

1. [Résumé exécutif & Principes Fondateurs](#1-résumé-exécutif--principes-fondateurs)
2. [Pourquoi le modèle « Page Hébergée + Redirection »](#2-pourquoi-le-modèle--page-hébergée--redirection-)
3. [Architecture Globale du Système](#3-architecture-globale-du-système)
4. [Cycle de Vie d'une Session de Lecture (Flux Pas-à-Pas)](#4-cycle-de-vie-dune-session-de-lecture-flux-pas-à-pas)
5. [Contrat d'API Détaillé (REST & Webhooks)](#5-contrat-dapi-détaillé-rest--webhooks)
   - 5.1 [Authentification Partenaire (OAuth2 Client Credentials)](#51-authentification-partenaire-oauth2-client-credentials)
   - 5.2 [Création de Session avec Personnalisation Visuelle & Quiz](#52-création-de-session-avec-personnalisation-visuelle--quiz)
   - 5.3 [Lecture d'État & Polling](#53-lecture-détat--polling)
   - 5.4 [Révocation / Déconnexion Forcée](#54-révocation--déconnexion-forcée)
   - 5.5 [Webhooks Événements (HMAC-SHA256)](#55-webhooks-événements-hmac-sha256)
6. [Personnalisation Poussée du Design (Thématisation Partenaire)](#6-personnalisation-poussée-du-design-thématisation-partenaire)
7. [Module Quiz Dynamique par API](#7-module-quiz-dynamique-par-api)
8. [Module Synthèse Vocale (TTS) & Narration Audio](#8-module-synthèse-vocale-tts--narration-audio)
9. [Sécurité, Protection DRM & Audit Légal](#9-sécurité-protection-drm--audit-légal)
10. [Modélisation Backend Multi-Tenant (Django)](#10-modélisation-backend-multi-tenant-django)
11. [Page Front-End Dédiée `/read/[token]`](#11-page-front-end-dédiée-readtoken)
12. [Exemples d'Intégration Multi-Stack](#12-exemples-dintégration-multi-stack)

---

## 1. Résumé exécutif & Principes Fondateurs

Le lecteur de documents de **LAHAThèque** combine :

- Un **mode Immersion 3D** haut de gamme (tournage interactif des pages, zoom dynamique, flèches, outils de surlignage/soulignage/notes contextuelles, gomme, barre latérale d'annotations).
- Un **mode Normal** avec défilement vertical page par page fluide, pagination fine, recherche textuelle, rotation et outils documentaires.
- Un **moteur audio & TTS** intégré (lecture vocale multilingue avec gestion des vitesses `0.75x` à `2x`, synchronisation).
- Un **système de Quiz interactifs** d'évaluation de fin de lecture.
- Une **sécurité DRM avancée** (filigrane dynamique personnalisé, blocage des raccourcis d'impression/sauvegarde/copie, streaming fragmenté, traçabilité `TraceAcces`).

L'API Lecteur Hébergé permet à tout éditeur, école, université ou entreprise tierce de proposer cette expérience de lecture sans avoir à réimplémenter de moteur PDF, sans installer de librairies front-end lourdes, tout en personnalisant les couleurs, le logo, les quiz et les fonctionnalités autorisées.

---

## 2. Pourquoi le modèle « Page Hébergée + Redirection »


| Critère                        | Package NPM / SDK Front          | Iframe Embarquée                     | Page Hébergée (Redirect LAHAThèque)                            |
| :-------------------------------- | :--------------------------------- | :-------------------------------------- | :------------------------------------------------------------------ |
| **Compatibilité stacks**       | ❌ JS/React uniquement           | ⚠️ Vulnérable (cookies tiers)      | ✅**100% Universel (PHP, Python, Laravel, Symfony, Mobile...)**   |
| **Rendu 3D & Animations**       | ⚠️ Instable selon le bundle    | ⚠️ Conflits CSS / redimensionnement | ✅**Optimal, plein écran natif**                                 |
| **Protection DRM & Fichiers**   | ❌ Fichier exposé côté client | ⚠️ Fuites d'URL                     | ✅**100% Sécurisé côté LAHAThèque (aucun PDF brut exposé)** |
| **Personnalisation Design**     | ⚠️ À coder chez le client     | ❌ Complexe à styliser               | ✅**Pilotée proprement par l'API JSON (couleurs, logos)**        |
| **Maintenance & Mises à jour** | ❌ Nécessite republication      | ⚠️ Partielle                        | ✅**Transparente et centralisée chez LAHAThèque**               |

---

## 3. Architecture Globale du Système

```
┌──────────────────────────────────────────────────────────────────────────┐
│ APPLICATION CLIENTE PARTENAIRE (Laravel, Symfony, Django, Node.js...)    │
│  1. Authentification OAuth2 Client Credentials (serveur à serveur)       │
│  2. POST /api/v1/reader/sessions/ (avec options UI, Quiz, TTS, Theme)    │
│  3. Redirige l'utilisateur vers reader_url                               │
│  4. Reçoit les événements de lecture via Webhooks signés HMAC             │
└──────────────────────────────────────────────────────────────────────────┘
                    │ (Redirection du navigateur de l'utilisateur final)
                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ LAHATHÈQUE — FRONT-END HÉBERGÉ (Next.js App Router)                      │
│  Page /read/[token] (layout nu, sans menu LAHAThèque)                    │
│   • Valide le token de session éphémère                                  │
│   • Applique le thème partenaire (couleurs d'accent, logo, titre)        │
│   • Monte le lecteur : Mode Immersion 3D OU Mode Normal Vertical         │
│   • Exécute le Quiz personnalisé si configuré                            │
└──────────────────────────────────────────────────────────────────────────┘
                    │ (Appels API authentifiés par le token de session)
                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ LAHATHÈQUE — BACKEND (Django REST Framework)                             │
│  • Contrôle d'accès & permission IsValidReaderSession                    │
│  • Proxy PDF fragmenté & extraction texte TTS protégée                   │
│  • Moteur de Quiz & synchronisation de progression                       │
│  • Audit légal TraceAcces & tatouage filigrane dynamique                 │
│  • Envoi asynchrone des Webhooks signés                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Cycle de Vie d'une Session de Lecture (Flux Pas-à-Pas)

```
Partenaire (Serveur)          LAHAThèque (Backend)        Utilisateur (Navigateur)
        │                              │                              │
   (1)  │ POST /oauth2/token/          │                              │
        │  client_credentials          │                              │
        │─────────────────────────────>│                              │
        │  { access_token }            │                              │
        │<─────────────────────────────│                              │
        │                              │                              │
   (2)  │ POST /reader/sessions/       │                              │
        │  { book_id, theme, quiz... } │                              │
        │─────────────────────────────>│                              │
        │                              │ Crée ReaderSession, valide   │
        │                              │ droits & injecte config      │
        │  { reader_url, session_id }  │                              │
        │<─────────────────────────────│                              │
        │                              │                              │
   (3)  │ Redirige l'utilisateur vers reader_url                      │
        │────────────────────────────────────────────────────────────>│
        │                              │                              │
   (4)  │                              │ GET /read/[token]            │
        │                              │<─────────────────────────────│
        │                              │ Injecte thème & monte lecteur│
        │                              │─────────────────────────────>│
        │                              │                              │
   (5)  │  Webhook: reader.progress    │ Lecture, notes, TTS, audio   │
        │<─────────────────────────────│<────────────────────────────>│
        │                              │                              │
   (6)  │  Webhook: reader.quiz.done   │ Passe le Quiz de fin         │
        │<─────────────────────────────│<────────────────────────────>│
        │                              │                              │
   (7)  │                              │ Clic sur Quitter             │
        │  Redirection return_url      │                              │
        │<────────────────────────────────────────────────────────────│
        │  Webhook: reader.finished    │                              │
        │<─────────────────────────────│                              │
```

---

## 5. Contrat d'API Détaillé (REST & Webhooks)

Base URL de production : `https://lahatheque.com/api/v1/`

### 5.1 Authentification Partenaire (OAuth2 Client Credentials)

Authentification serveur-à-serveur pour obtenir un jeton d'administration.

```http
POST /api/v1/oauth2/token/
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=PARTNER_CLIENT_ID
&client_secret=PARTNER_CLIENT_SECRET
&scope=reader:sessions catalog:read
```

**Réponse 200 OK** :

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5c...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "reader:sessions catalog:read"
}
```

---

### 5.2 Création de Session avec Personnalisation Visuelle & Quiz

Crée une session de lecture sur-mesure pour un utilisateur donné.

```http
POST /api/v1/reader/sessions/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "book_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "external_user_ref": "etudiant-84920",
  "external_user_name": "Jean Dupont",
  "return_url": "https://ecole-partenaire.fr/cours/chapitre-3",
  "force_mode": null,
  "locale": "fr",
  "ttl_seconds": 3600,
  "permissions": {
    "allow_tts": true,
    "allow_annotations": true,
    "allow_quiz": true
  },
  "_comment_permissions": "Mode Immersion 3D et Narration Audio sont TOUJOURS activés par défaut. Téléchargement et Impression sont STRICTEMENT INTERDITS (DRM absolu).",
  "theme": {
    "brand_name": "Académie Supérieure des Sciences",
    "brand_logo_url": "https://ecole-partenaire.fr/static/logo.png",
    "primary_color": "#1B2A4E",
    "accent_color": "#D4A017",
    "background_color": "#0F1A33",
    "text_color": "#FFFFFF",
    "border_color": "#2E3F66"
  },
  "quiz": {
    "enabled": true,
    "title": "Validation de Lecture — Chapitre 3",
    "passing_score_percent": 70,
    "show_on_last_page": true,
    "questions": [
      {
        "id": "q1",
        "question": "Quel est le principe fondamental énoncé dans ce chapitre ?",
        "options": [
          "L'optimisation continue des paramètres",
          "La sélection aléatoire des hyperparamètres",
          "L'invariance par translation",
          "La compression sans perte"
        ],
        "correct_answer_index": 0,
        "explanation": "L'auteur insiste sur l'optimisation continue dès la page 12."
      },
      {
        "id": "q2",
        "question": "Quelle méthode est préconisée pour le filtrage ?",
        "options": [
          "Méthode Bayésienne",
          "Méthode Fréquentiste",
          "Méthode Heuristique"
        ],
        "correct_answer_index": 0,
        "explanation": "La méthode Bayésienne permet d'incorporer les distributions a priori."
      }
    ]
  },
  "tts_config": {
    "enabled": true,
    "voice": "alloy",
    "default_rate": 1.0,
    "allowed_languages": ["fr", "en"]
  },
  "metadata": {
    "course_id": "MATH-402",
    "module_id": "MOD-12"
  }
}
```

**Réponse 201 Created** :

```json
{
  "success": true,
  "data": {
    "session_id": "rs_a89f3c9e120d",
    "reader_url": "https://lahatheque.com/read/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...",
    "expires_at": "2026-08-18T16:00:00Z",
    "book": {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "title": "Promptbreeder: Self-Referential Self-Improvement",
      "author_name": "Google DeepMind",
      "total_pages": 64,
      "has_audio": true
    },
    "status": "created"
  },
  "error": null
}
```

---

### 5.3 Lecture d'État & Polling

Permet au partenaire de vérifier la progression ou le statut à tout moment.

```http
GET /api/v1/reader/sessions/rs_a89f3c9e120d/
Authorization: Bearer <access_token>
```

**Réponse 200 OK** :

```json
{
  "success": true,
  "data": {
    "session_id": "rs_a89f3c9e120d",
    "status": "in_progress",
    "book_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "external_user_ref": "etudiant-84920",
    "progress": {
      "current_page": 28,
      "total_pages": 64,
      "percent": 43.75,
      "reading_time_seconds": 940
    },
    "quiz_result": {
      "completed": true,
      "score_percent": 100,
      "is_passed": true,
      "completed_at": "2026-08-18T15:45:12Z"
    },
    "opened_at": "2026-08-18T15:02:00Z",
    "finished_at": null,
    "expires_at": "2026-08-18T16:00:00Z"
  },
  "error": null
}
```

---

### 5.4 Révocation / Déconnexion Forcée

```http
DELETE /api/v1/reader/sessions/rs_a89f3c9e120d/
Authorization: Bearer <access_token>
```

**Réponse 204 No Content** (Le token de session devient immédiatement invalide).

---

### 5.5 Webhooks Événements (HMAC-SHA256)

LAHAThèque notifie le serveur partenaire en temps réel à chaque étape clé.

#### En-têtes HTTP envoyés :

- `X-Lahatheque-Event` : Type d'événement (`reader.session.opened`, `reader.progress.updated`, `reader.quiz.completed`, `reader.session.finished`).
- `X-Lahatheque-Delivery` : UUID unique de la notification (idempotence).
- `X-Lahatheque-Signature` : `t=1755525363,v1=b84e...` (Signature HMAC-SHA256 du timestamp et du payload brut avec le secret du partenaire).

#### Exemples de Payloads Webhook :

**1. Événement `reader.progress.updated`** :

```json
{
  "event_id": "evt_7f18b320d",
  "type": "reader.progress.updated",
  "timestamp": "2026-08-18T15:20:00Z",
  "session_id": "rs_a89f3c9e120d",
  "external_user_ref": "etudiant-84920",
  "book_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "data": {
    "current_page": 32,
    "total_pages": 64,
    "percent": 50.0
  },
  "metadata": {
    "course_id": "MATH-402"
  }
}
```

**2. Événement `reader.quiz.completed`** :

```json
{
  "event_id": "evt_91b7d812a",
  "type": "reader.quiz.completed",
  "timestamp": "2026-08-18T15:45:12Z",
  "session_id": "rs_a89f3c9e120d",
  "external_user_ref": "etudiant-84920",
  "book_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "data": {
    "quiz_title": "Validation de Lecture — Chapitre 3",
    "score_percent": 100,
    "passing_score_percent": 70,
    "is_passed": true,
    "answers": [
      { "question_id": "q1", "selected_option_index": 0, "is_correct": true },
      { "question_id": "q2", "selected_option_index": 0, "is_correct": true }
    ]
  },
  "metadata": {
    "course_id": "MATH-402"
  }
}
```

---

## 6. Personnalisation Poussée du Design (Thématisation Partenaire)

L'API permet de redéfinir dynamiquement l'habillage visuel du lecteur hébergé :


| Propriété        | Type         | Description                                                | Valeur par défaut      |
| :------------------- | :------------- | :----------------------------------------------------------- | :------------------------ |
| `brand_name`       | string       | Titre affiché dans l'en-tête du lecteur                  | `"LAHAThèque"`         |
| `brand_logo_url`   | string       | URL du logo du partenaire (hauteur 32px max)               | Logo LAHAThèque        |
| `primary_color`    | string (HEX) | Couleur de la barre d'outils et de l'en-tête              | `#1B2A4E` (Navy)        |
| `accent_color`     | string (HEX) | Couleur d'accentuation des boutons actifs et surbrillances | `#D4A017` (Or)          |
| `background_color` | string (HEX) | Arrière-plan du canvas de lecture et de la page           | `#0F1A33` (Navy Sombre) |
| `text_color`       | string (HEX) | Couleur principale des textes                              | `#FFFFFF`               |
| `border_color`     | string (HEX) | Couleur des séparateurs et bordures subtiles              | `#2E3F66`               |
| `font_family`      | string       | Police de caractères (`sans`, `serif`, `mono`)            | `"Inter, sans-serif"`   |

Le front-end injecte ces variables CSS directement à la racine de la session `/read/[token]`.

---

## 7. Module Quiz Dynamique par API

Le partenaire peut injecter un questionnaire personnalisé directement lors de la création de session.

### Fonctionnalités du Quiz :

- **Déclenchement automatique** à la dernière page du document ou via le bouton dédié **Quiz** dans l'en-tête.
- **Questions à choix unique (QCU) ou choix multiple (QCM)**.
- **Calcul instantané du score** avec seuil de validation (`passing_score_percent`).
- **Explications pédagogiques affichées** après validation.
- **Transmission immédiate des résultats** au serveur du partenaire via webhook `reader.quiz.completed`.

---

## 8. Module Synthèse Vocale (TTS) & Narration Audio

### 1. Synthèse Vocale (TTS)

- **Voix disponibles** : `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`.
- **Extraction textuelle sécurisée** page par page.
- **Gestion des débits** : `0.75x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`.
- **Mise en cache audio** pour éliminer toute latence lors de lectures répétées.

### 2. Narration Audio Pré-enregistrée (Audiobook)

- Support des fichiers audio d'accompagnement ou des livres-audio exclusifs.
- Mini-lecteur audio flottant compact ou intégré dans l'en-tête.
- Barre de progression audio synchronisable avec les chapitres.

---

## 9. Sécurité, Protection DRM & Audit Légal

1. **Téléchargement & Impression STRICTEMENT INTERDITS (DRM Infranchissable)** :
   - Aucun bouton ou lien de téléchargement n'existe dans le lecteur.
   - L'impression est bloquée au niveau système et CSS (`@media print { body { display: none !important; } }`).
   - Le fichier PDF source sur Cloudflare R2 n'est **jamais exposé** ni accessible au navigateur : seul le proxy sécurisé sert des fragments temporaires.
2. **Les Deux Modes de Lecture (Mode Immersion 3D & Mode Normal) Toujours Inclus & Actifs** :
   - L'expérience **3D FlipBook** (tournage immersif, zoom dynamique, flèches, annotations) et le **Mode Normal** (défilement vertical page par page avec recherche et outils) sont tous deux **intégrés d'office, toujours actifs et commutables à tout moment** d'un simple clic par l'utilisateur sur PC et tablette.
   - La **narration audio** et la **synthèse vocale TTS** sont également toujours incluses et actives nativement.
3. **Permission `IsValidReaderSession`** : Chaque requête (rendu, proxy, TTS, quiz) exige un token de session valide, signé cryptographiquement, à durée de vie courte.
4. **Filigrane Dynamique Personnalisé** : Incrustation automatique d'un filigrane anti-capture avec le nom de l'utilisateur (`external_user_name`), son identifiant, son adresse IP et la date.
5. **Audit Légal `TraceAcces`** : Journalisation immuable de chaque ouverture, page lue, stream audio et événement de lecture pour conformité éditeur.
6. **Anti-Open-Redirect** : `return_url` strictement validée contre la liste des domaines autorisés du partenaire (`allowed_return_origins`).

---

## 10. Modélisation Backend Multi-Tenant (Django)

Trois modèles centraux dans l'application `reader` :

```python
class PartnerApp(models.Model):
    """Application cliente partenaire enregistrée."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    oauth_application = models.OneToOneField('oauth2_provider.Application', on_delete=models.CASCADE)
    allowed_return_origins = models.JSONField(default=list)  # ["https://ecole-partenaire.fr"]
    webhook_url = models.URLField(blank=True)
    webhook_secret = models.CharField(max_length=128)
    quotas = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)

class PartnerEndUser(models.Model):
    """Utilisateur fantôme assurant la persistance des notes et de la progression."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    partner = models.ForeignKey(PartnerApp, on_delete=models.CASCADE)
    external_ref = models.CharField(max_length=255)
    display_name = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ('partner', 'external_ref')

class ReaderSession(models.Model):
    """Session éphémère de lecture hébergée."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    partner = models.ForeignKey(PartnerApp, on_delete=models.CASCADE)
    ouvrage = models.ForeignKey('catalog.Ouvrage', on_delete=models.CASCADE)
    end_user = models.ForeignKey(PartnerEndUser, on_delete=models.CASCADE)
    token_hash = models.CharField(max_length=64, db_index=True)
    theme = models.JSONField(default=dict)
    quiz_config = models.JSONField(default=dict)
    permissions = models.JSONField(default=dict)
    return_url = models.URLField()
    last_page = models.IntegerField(default=0)
    quiz_completed = models.BooleanField(default=False)
    quiz_score = models.FloatField(null=True, blank=True)
    status = models.CharField(
        max_length=32,
        choices=[
            ('created', 'Créée'),
            ('opened', 'Ouverte'),
            ('in_progress', 'En cours'),
            ('finished', 'Terminée'),
            ('expired', 'Expirée'),
            ('revoked', 'Révoquée')
        ],
        default='created'
    )
    expires_at = models.DateTimeField()
```

---

## 11. Page Front-End Dédiée `/read/[token]`

Structure dans le front-end Next.js :

```
app/
└── read/
    └── [token]/
        ├── layout.tsx     ← Layout plein écran sans navigation LAHAThèque
        └── page.tsx       ← Valide le token, injecte le thème CSS et monte le lecteur
```

La page hébergée fonctionne de manière autonome :

1. Valide le token auprès de l'API.
2. Injecte les variables CSS du thème (`--color-primary`, `--color-accent`, etc.).
3. Charge les données de l'ouvrage, les annotations de l'utilisateur, et le Quiz éventuel.
4. Propose la bascule fluide entre le **Mode Immersion 3D** et le **Mode Normal**.

---

## 12. Exemples d'Intégration Multi-Stack

### Exemple 1 : PHP / Symfony / Laravel (Création de session et redirection)

```php
<?php

class LahathequeReaderClient {
    private string $baseUrl = "https://lahatheque.com/api/v1";
    private string $clientId;
    private string $clientSecret;

    public function __construct(string $clientId, string $clientSecret) {
        $this->clientId = $clientId;
        $this->clientSecret = $clientSecret;
    }

    public function createReaderUrl(string $bookId, string $userId, string $userName, ?array $quiz = null): string {
        // 1. Obtenir le token OAuth2
        $ch = curl_init("{$this->baseUrl}/oauth2/token/");
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'grant_type' => 'client_credentials',
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'scope' => 'reader:sessions'
        ]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $authRes = json_decode(curl_exec($ch), true);
        $accessToken = $authRes['access_token'];

        // 2. Créer la session avec personnalisation
        $payload = [
            'book_id' => $bookId,
            'external_user_ref' => $userId,
            'external_user_name' => $userName,
            'return_url' => 'https://mon-ecole.fr/cours/retour',
            'theme' => [
                'brand_name' => 'Portail Éducatif XYZ',
                'primary_color' => '#102A43',
                'accent_color' => '#E12D39'
            ],
            'quiz' => $quiz
        ];

        $ch = curl_init("{$this->baseUrl}/reader/sessions/");
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer {$accessToken}",
            "Content-Type: application/json"
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $sessionRes = json_decode(curl_exec($ch), true);

        return $sessionRes['data']['reader_url'];
    }
}
```

### Exemple 2 : Python / Django / FastAPI

```python
import requests

def get_lahatheque_reader_url(book_id: str, user_id: str, user_name: str) -> str:
    # 1. OAuth2
    token_resp = requests.post("https://lahatheque.com/api/v1/oauth2/token/", data={
        "grant_type": "client_credentials",
        "client_id": "VOTRE_CLIENT_ID",
        "client_secret": "VOTRE_CLIENT_SECRET",
        "scope": "reader:sessions"
    }).json()
  
    access_token = token_resp["access_token"]
  
    # 2. Créer la session
    session_resp = requests.post(
        "https://lahatheque.com/api/v1/reader/sessions/",
        headers={"Authorization": f"Bearer {access_token}"},
        json={
            "book_id": book_id,
            "external_user_ref": user_id,
            "external_user_name": user_name,
            "return_url": "https://mon-app.com/tableau-de-bord",
            "theme": {
                "brand_name": "Bibliothèque Universitaire",
                "accent_color": "#2B6CB0"
            }
        }
    ).json()
  
    return session_resp["data"]["reader_url"]
```

---

## 🏁 Conclusion

Ce guide définit l'architecture complète, universelle et ultra-sécurisée de l'**API Lecteur Hébergé LAHAThèque**. Les partenaires bénéficient d'un lecteur 3D immersif, de quiz personnalisés, de synthèse vocale, d'une compatibilité tous langages et d'une personnalisation esthétique complète sans aucune complexité d'installation.
