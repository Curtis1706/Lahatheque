# LAHAThèque Constitution

## Core Principles

### I. Cadrage Métier et Consultation de Documentation (NON-NÉGOCIABLE)
Toute conception technique ou développement doit commencer par la lecture approfondie du cahier des charges (`cahier_des_charges.txt`) et la consultation des documentations officielles des technologies employées. Aucune hypothèse non vérifiée ne doit être introduite.

### II. Traque des Non-Dits, Matrice Décisionnelle et Scalabilité
Chaque fonctionnalité doit faire l'objet d'une analyse rigoureuse des non-dits, cas limites, points de friction et scénarios d'échec. Établir systématiquement une matrice : Inconvénients vs Avantages vs Solution Recommandée, avec une stratégie de scalabilité éprouvée (caching, index, partitionnement, montée en charge).

### III. Rigueur Backend Python et Typage Statique Strict
Le backend repose sur Python 3.10+ et Django REST Framework. Respect absolu de PEP 8 et déclaration systématique de Type Hints sur tous les arguments et valeurs de retour de fonctions, méthodes, managers, serializers et vues.

### IV. Format de Réponse API Unifié
Toutes les réponses JSON de l'API doivent strictement respecter la structure unifiée :
```json
{
  "success": true,
  "data": {},
  "error": null
}
```
En cas d'échec (`success: false`), `data` est vide (`{}` ou `[]`) et `error` fournit un message textuel explicite et exploitable.

### V. Performance ORM et Éradication des Requêtes N+1
- Clés primaires sous format UUIDv4 (`id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)`).
- Indexation explicite `db_index=True` et contraintes d'intégrité `Meta.constraints` (`UniqueConstraint`, `CheckConstraint`).
- Éradication absolue des requêtes N+1 via l'usage obligatoire de `select_related()` pour les relations directes et `prefetch_related()` pour les relations inverses et multiples.
- Encadrement de toute mutation complexe ou financière dans des transactions atomiques `@transaction.atomic`.

### VI. Sécurité Réseau, Cookies HttpOnly et Authentification
- Tokens JWT stockés exclusivement dans des cookies `HttpOnly`, `Secure` (en production), avec `SameSite='Lax'`. Aucun token d'accès web ne doit transiter dans le corps JSON.
- Configuration stricte : `CORS_ALLOW_CREDENTIALS = True`, `CORS_ALLOWED_ORIGINS` et `CSRF_TRUSTED_ORIGINS` verrouillés.
- Authentification partenaire machine-to-machine via OAuth2 Client Credentials (`django-oauth-toolkit`).

### VII. Protection DRM, Streaming et Stockage Cloudflare R2
- Fichiers PDF, EPUB et Audio stockés sur Cloudflare R2 compatible S3 via `R2MediaStorage`.
- Streaming fragmenté par proxy Django Range Requests (`HTTP_RANGE` retournant `206 Partial Content`).
- Téléchargement et impression strictement interdits sur tous les documents protégés.
- Journalisation légale immuable de chaque consultation et tentative d'accès.

### VIII. Intégration Frontend, Tokens Sémantiques et 21st.dev
- Zéro couleur hexadécimale en dur (`bg-[#...]`) : utilisation exclusive des variables CSS sémantiques de `globals.css` (`bg-navy`, `bg-navy-dark`, `bg-gold`, `bg-background`, `border-border`).
- Recherche systématique de composants UI sur `21st.dev` via les 8 instances MCP configurées avant tout codage générique.
- Approche Mobile-First obligatoire sur chaque composant et chaque écran (de 375px à desktop).
- Gestion des états complets : default, hover, focus, loading (skeleton adapté), empty avec action, error.

### IX. Code Exhaustivement Commenté et Documenté
Tout le code source produit doit être richement commenté, avec des docstrings détaillées sur chaque module, classe et méthode, ainsi que des commentaires explicatifs sur les logiques métier non évidentes.

### X. Interdiction Absolue de Tout Émoji
Aucun émoji n'est toléré dans le code source, les commentaires, les docstrings, les fichiers de règles, les réponses d'API, les tableaux de bord, les modales ou la documentation technique. Utiliser exclusivement les icônes vectorielles Lucide React.

## Constraints & Security Requirements

- Base de données : PostgreSQL (Neon) avec contraintes d'intégrité strictes et indexation ciblée.
- Stockage de fichiers : Cloudflare R2 sécurisé avec URLs publiques et gestion résiliente des permissions.
- DRM et Lecteur : Moteur de lecture 3D FlipBook et mode normal vertical avec protection anti-capture et filigrane dynamique.

## Governance

Cette Constitution fait foi sur l'ensemble du projet LAHAThèque et prime sur toute décision locale. Tout code produit doit être audité et validé conformément à ces 10 principes.

**Version**: 1.1.0 | **Ratified**: 2026-08-18 | **Last Amended**: 2026-08-21
