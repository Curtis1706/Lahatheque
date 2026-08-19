# Research & Architecture Decisions: Module 009 - API Lecteur Heberge

**Feature**: Module 009 - API Lecteur Heberge et Distribution Universelle  
**Date**: 2026-08-19  
**Status**: Validated

---

## 1. Modele de Distribution : Page Hebergee vs Iframe vs Package NPM

- **Decision** : Modele « Page Hebergee + Redirection » (type Stripe Checkout).
- **Rationale** :
  - Permet a n'importe quelle application (PHP, Laravel, Symfony, Django, FastAPI, Node.js, Ruby, Flutter/Mobile) d'integrer le lecteur en un simple appel HTTP POST et une redirection de navigateur.
  - Elimine les blocages de cookies tiers (SameSite / Safari ITP) et les failles de securite liees aux iframes.
  - Assure que le moteur de rendu PDF, le moteur 3D WebGL/Canvas et les binaires audio tournent dans l'environnement maitrise de LAHATheque sans conflit de CSS ou de bundle JS.
- **Alternatives evaluees** :
  - *Package NPM / SDK React* : Rejete car exclut tous les partenaires non-React/non-JS et force a publier le code source du lecteur et des algorithmes de securite.
  - *Iframe simple* : Rejete car fragile face aux bloqueurs de pubs, bloque les redirections OAuth et pose des soucis de responsive sur mobile.

---

## 2. Authentification et Tokens de Session : JWT Signe vs Tokens en Base

- **Decision** : Double verification : Token JWT ephemere chiffre (stateless pour le front-end) + Enregistrement `ReaderSession` avec hash en base PostgreSQL.
- **Rationale** :
  - Le JWT transporte de maniere autonome l'identite (`session_id`, `partner_id`, `book_id`, `user_ref`, `exp`).
  - L'enregistrement en base permet la revocation instantanee (`DELETE /sessions/[id]/`), la journalisation du statut (`opened`, `in_progress`, `finished`) et l'audit `TraceAcces`.
  - Signature avec cle secrete serveur `HMAC-SHA256` non forgeable.
- **Alternatives evaluees** :
  - *Session Django classique par cookie de session* : Inadapte au cross-domain et aux utilisateurs anonymes du partenaire.

---

## 3. Thematisation Dynamique Front-End : CSS Variables Runtime

- **Decision** : Injection de variables CSS globales `--partner-primary`, `--partner-accent`, `--partner-bg`, `--partner-text`, `--partner-border` a la racine du conteneur de page `/read/[token]`.
- **Rationale** :
  - Permet une adaptation visuelle instantanee a la charte de l'ecole ou du partenaire sans recompiler l'application.
  - Compatible a 100% avec les classes Tailwind (`var(--partner-primary)` mappee sur les composants).
- **Alternatives evaluees** :
  - *CSS-in-JS emotion/styled-components* : Lourd et superflu, les variables CSS natives offrent de meilleures performances.

---

## 4. Securite Webhooks : HMAC-SHA256 avec Horodatage

- **Decision** : Signature cryptographique de chaque requete webhook sortante via `HMAC-SHA256(payload, partner.webhook_secret)` avec timestamp dans l'en-tete `X-Lahatheque-Signature: t=...,v1=...`.
- **Rationale** :
  - Protege le serveur partenaire contre les attaques par rejeu (Replay Attacks) en permettant au partenaire de rejeter les requetes de plus de 5 minutes.
  - Garantit l'authenticite et l'integrite du payload.
  - Envoi asynchrone via Celery avec gestion de backoff exponentiel en cas de panne temporaire du serveur tiers.
