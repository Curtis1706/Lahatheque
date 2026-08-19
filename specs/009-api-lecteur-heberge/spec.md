# Feature Specification: Module 009 - API Lecteur Heberge LAHATheque et Distribution Universelle (Multi-Sources & BYOD)

**Feature Directory**: `specs/009-api-lecteur-heberge`  
**Created**: 2026-08-19  
**Status**: Ready for Planning  
**Source Metier**: `KIT_PORTAGE_LECTEUR/GUIDE_API_LECTEUR.md` (Version 2.0 - Aout 2026) ; Architecture DRM Multi-Sources (`apps/protection/source_adapter.py`) ; Constitution LAHATheque (`.specify/memory/constitution.md`)

---

## 1. Resume Executif & Vision Produit

L'API Lecteur Heberge permet a tout partenaire externe (universites, ecoles, editeurs tiers, plateformes SaaS de formation, applications mobiles tierces) d'offrir a ses apprenants et lecteurs l'experience de lecture complete de LAHATheque, **pour ses propres documents externes (Reader-as-a-Service / BYOD via `external_url`) comme pour les ouvrages du catalogue LAHATheque (`catalog_book`)** :

- **Ingestion Universelle Multi-Sources** :
  1. `catalog_book` : Ouvrage interne du catalogue LAHATheque (`book_id`).
  2. `external_url` : Document externe heberge chez le partenaire ou sur un SaaS tiers (`document_url`), normalise et securise a la volee par `DocumentSourceAdapter`.
  3. `direct_upload` : Fichier televerse directement par le partenaire.
- **Double moteur de lecture universel** : Mode Immersion 3D (FlipBook interactif, tournage de page physique, zoom, outils d'annotation, gomme) et Mode Normal vertical page par page avec pagination fine.
- **Model distribution "Page Hebergee + Redirection"** : Zero dependance front-end a installer chez le client, zero vulnerabilite d'iframe ou de cookies tiers, 100% universel multi-langages (PHP, Laravel, Symfony, Django, Node.js, Ruby, Flutter/Mobile).
- **Thematisation de marque (White-Label)** : Personnalisation visuelle dynamique (nom de la marque, logo, couleurs primaire/accent/fond/texte).
- **Module d'Evaluation & Quiz Dynamique** : Injection dynamique de questionnaires personnalises avec validation instantanee et remontee automatique des scores.
- **Audiobook & Synthese Vocale TTS** : Narration audio synchronisee (`audio_url` ou audio integre) et lecture vocale multilingue integree.
- **Securite DRM infranchissable** : Fichiers sources non exposes, telechargement et impression strictement interdits, filigrane nominatif anti-capture personnalise (`nom`, `email`, `ip`), et journalisation d'audit immuable.

---

## 2. User Scenarios & Acceptance Criteria (Prioritises)

### User Story 1 - Creation de Session pour un Document Externe SaaS / BYOD (Priorite: P1 - MVP)

En tant que plateforme SaaS tierce ou LMS universitaire possedant mes propres supports de cours PDF, je veux appeler `POST /api/v1/reader/sessions/` en transmettant `document_url`, le titre et l'identifiant etudiant pour ouvrir mon document dans le lecteur LAHATheque securise avec filigrane nominatif.

**Scenarios d'acceptation** :
1. **Etant donne** un partenaire authentifie via OAuth2 Client Credentials, **Quand** il emet une requete `POST /api/v1/reader/sessions/` avec `source_type: "external_url"`, `document_url: "https://mon-saas.com/cours.pdf"`, `document_title: "Droit des Affaires"`, `external_user_name: "Koffi Mensah"`, et `return_url`, **Alors** `DocumentSourceAdapter` verifie et telecharge le document, initialise la session, et retourne `session_id`, `reader_url` et `expires_at`.
2. **Etant donne** l'etudiant ouvrant `reader_url` (`/read/[token]`), **Quand** la page se charge, **Alors** le document externe du partenaire s'affiche dans le lecteur 3D ou Normal avec le filigrane nominatif (*Koffi Mensah*), sans que le PDF source externe ne soit jamais telechargeable en clair.

---

### User Story 2 - Creation de Session pour un Ouvrage du Catalogue LAHATheque (Priorite: P1 - MVP)

En tant qu'application partenaire (ex: bibliotheque universitaire affiliee), je veux creer une session pour un livre existant de LAHATheque via `book_id`.

**Scenarios d'acceptation** :
1. **Etant donne** une requete `POST /api/v1/reader/sessions/` avec `book_id: "uuid-ouvrage"`, **Quand** la session est creee, **Alors** LAHATheque lie la session a l'ouvrage du catalogue et renvoie `reader_url`.

---

### User Story 3 - Experience de Lecture Bimodale et Thematisation Partenaire (Priorite: P1 - MVP)

En tant qu'apprenant, je veux lire le document dans un environnement aux couleurs de mon universite/SaaS, basculer entre Immersion 3D et Normal, et retourner sur mon application d'origine a la fin.

**Scenarios d'acceptation** :
1. **Etant donne** le lecteur ouvert sur `/read/[token]`, **Quand** l'apprenant consulte la page, **Alors** la charte graphique transmise (logo, couleurs `--partner-primary`, `--partner-accent`) est appliquee sur l'interface, et les deux modes 3D / Normal sont commutables instantanement.
2. **Etant donne** l'apprenant cliquant sur "Quitter", **Alors** la session est cloturee et il est redirige vers `return_url`.

---

### User Story 4 - Quiz Dynamique et Webhooks en Temps Reel (Priorite: P2)

En tant qu'application partenaire, je veux injecter un quiz personnalise et recevoir automatiquement les resultats par webhook signe HMAC-SHA256 (`reader.quiz.completed`) ainsi que les mises a jour de progression (`reader.progress.updated`).

---

### User Story 5 - Polling, Supervision et Revocation (Priorite: P2)

En tant que serveur partenaire, je veux pouvoir consulter l'etat d'une session (`GET /api/v1/reader/sessions/[id]/`) ou revoquer l'acces d'un utilisateur (`DELETE /api/v1/reader/sessions/[id]/`).

---

## 3. Traque des Non-Dits et Cas Limites

1. **Validation et Securite de l'URL Distante (`external_url`)** :
   - *Risque* : Tentative d'attaque SSRF (Server-Side Request Forgery) avec des URLs type `http://127.0.0.1` ou `http://localhost`.
   - *Regle* : `DocumentSourceAdapter` bloque strictement les IP privees, les boucles locales (localhost/127.0.0.1/169.254...) et impose le protocole HTTPS en production.
2. **Taille Maximale des Fichiers Externes** :
   - *Limite* : 200 Mo max par document distant (`DRM_MAX_REMOTE_FILE_SIZE_MB`).
3. **Anti-Open-Redirect** :
   - `return_url` obligatoirement validee contre `allowed_return_origins` de l'application partenaire.
4. **Idempotence des Webhooks** :
   - En-tete `X-Lahatheque-Delivery` UUID et signature `HMAC-SHA256`.

---

## 4. Exigences Fonctionnelles (FR)

- **FR-001** : Authentification machine-to-machine via OAuth2 Client Credentials (`POST /api/v1/oauth2/token/`).
- **FR-002** : Endpoint `POST /api/v1/reader/sessions/` supportant a la fois `source_type='catalog_book'` (`book_id`) et `source_type='external_url'` (`document_url`, `document_title`, `document_author`, `audio_url`).
- **FR-003** : Ingestion et normalisation securisee des documents externes via `DocumentSourceAdapter`.
- **FR-004** : Endpoint d'interrogation d'etat `GET /api/v1/reader/sessions/[id]/` et de revocation `DELETE /api/v1/reader/sessions/[id]/`.
- **FR-005** : Page hebergee autonome `/read/[token]` (layout plein ecran neutre) avec injection CSS du theme partenaire.
- **FR-006** : Moteur bimodal (Mode Immersion 3D FlipBook + Mode Normal `@react-pdf-viewer`) avec filigrane nominatif anti-capture (`nom`, `email`, `ip`).
- **FR-007** : Module Quiz dynamique avec notation instantanee et Webhook `reader.quiz.completed`.
- **FR-008** : Emission de Webhooks asynchrones signes HMAC-SHA256 (`reader.progress.updated`, `reader.session.finished`).
- **FR-009** : Journalisation d'audit legale dans `TraceAcces`.
- **FR-010** : Format JSON unifie `{ "success": boolean, "data": {}, "error": null }`.

---

## 5. Criteres de Succes Mesurables (SC)

- **SC-001** : Ingestion d'un document externe HTTPS distant en **moins de 2 secondes** via `DocumentSourceAdapter`.
- **SC-002** : **0 octet de PDF clair ou non filigrane** accessible dans les outils dev du navigateur.
- **SC-003** : **Temps de reponse API** `POST /api/v1/reader/sessions/` inferieur a **250 ms**.
- **SC-004** : **100% de compatibilite** avec les architectures SaaS externes (PHP, Laravel, Symfony, Django, Node.js, Flutter).
