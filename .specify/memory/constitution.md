# LAHATheque Constitution

## Core Principles

### I. Cadrage Metier et Consultation de Documentation (NON-NEGOCIABLE)
Toute conception technique ou developpement doit commencer par la lecture approfondie du cahier des charges (`cahier_des_charges.txt`) et la consultation des documentations officielles en ligne des technologies employees. Aucune hypothese non verifiee ne doit etre introduite.

### II. Traque des Non-Dits, Matrice Decisionnelle et Scalabilite
Chaque fonctionnalite doit faire l'objet d'une analyse rigoureuse des non-dits, cas limites, points de friction et scenarios d'echec. Etablir systematiquement une matrice : Inconvenients vs Avantages vs Solution Recommandee, avec une strategie de scalabilite eprouvee (caching, indexes, partitionnement, montee en charge).

### III. Rigueur Backend Python et Typage Statique Strict
Le backend repose sur Python 3.12+ et Django REST Framework. Respect absolu de PEP 8 et declaration systematique de Type Hints sur tous les arguments et valeurs de retour de fonctions, methodes, managers, serializers et vues.

### IV. Format de Reponse API Unifie
Toutes les reponses JSON de l'API doivent strictement respecter la structure unifiee :
```json
{
  "success": true,
  "data": {},
  "error": null
}
```
En cas d'echec (`success: false`), `data` est vide (`{}` ou `[]`) et `error` fournit un message textuel explicite et exploitable.

### V. Performance ORM et Eradication des Requetes N+1
- Cles primaires sous format UUIDv4 (`id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)`).
- Indexation explicite `db_index=True` et contraintes d'integrite `Meta.constraints` (`UniqueConstraint`, `CheckConstraint`).
- Eradication absolue des requetes N+1 via l'usage obligatoire de `select_related()` pour les relations directes et `prefetch_related()` pour les relations inverses et multiples.
- Encadrement de toute mutation complexe ou financiere dans des transactions atomiques `@transaction.atomic`.

### VI. Securite Reseau, Cookies HttpOnly et Authentification
- Tokens JWT stockes exclusivement dans des cookies `HttpOnly`, `Secure` (en production), avec `SameSite='Lax'`. Aucun token d'acces web ne doit transiter dans le corps JSON.
- Configuration stricte : `CORS_ALLOW_CREDENTIALS = True`, `CORS_ALLOWED_ORIGINS` et `CSRF_TRUSTED_ORIGINS` verrouilles.
- Authentification partenaire machine-to-machine via OAuth2 Client Credentials (`django-oauth-toolkit`).

### VII. Protection DRM, Streaming et Audit TraceAcces
- Fichiers PDF, EPUB et Audio stockes de maniere privee sur Cloudflare R2 (`querystring_auth=True`). Aucune URL R2 brute n'est exposee au client.
- Streaming fragmenté exclusivement par proxy Django Range Requests (`HTTP_RANGE` retournant `206 Partial Content`).
- Telechargement et impression strictement interdits sur tous les documents proteges.
- Journalisation legale immuable de chaque consultation dans `TraceAcces`.

### VIII. Webhooks Asynchrones Signes et Idempotence
- Emission asynchrone des evenements via Celery avec politique de retry exponentiel (5 tentatives).
- En-tetes obligatoires : `X-Lahatheque-Event`, `X-Lahatheque-Delivery` (UUID `event_id` pour l'idempotence), et `X-Lahatheque-Signature` (HMAC-SHA256).
- Journalisation complete des livraisons dans `WebhookLog`.

### IX. Code Exhaustivement Commente et Documente
Tout le code source produit doit etre richement commente, avec des docstrings detaillees sur chaque module, classe et methode, ainsi que des commentaires explicatifs sur les logiques metier non evidentes.

### X. Interdiction Absolue de Tout Emoji
Aucun emoji ne doit etre present dans le code source, les commentaires, les docstrings, les fichiers de regles, les reponses d'API, les logs ou la documentation technique.

## Constraints & Security Requirements

- Base de donnees : PostgreSQL avec contraintes d'integrite strictes et indexation ciblee.
- Stockage de fichiers : Cloudflare R2 securise sans exposition publique.
- DRM et Lecteur : Moteur de lecture 3D FlipBook et mode normal vertical avec protection anti-capture et filigrane dynamique.

## Development Workflow & Quality Gates

1. Etape 0 : Analyse prealable (Cahier des charges, documentations, non-dits, scalabilite).
2. Etape 1 : Specification et contrat JSON `{ success, data, error }`.
3. Etape 2 : Modelisation des donnees et migrations.
4. Etape 3 : Serializers DRF avec validation croisee.
5. Etape 4 : Vues API, permissions et gestion des exceptions.
6. Etape 5 : Optimisation ORM (select_related / prefetch_related).
7. Etape 6 : Tests Pytest (`pytest-django`) couvrant cas nominaux, erreurs et securite.

## Governance

Cette Constitution fait foi sur l'ensemble du projet LAHATheque et prime sur toute decision locale. Tout code produit doit etre audite et valide conformement a ces 10 principes.

**Version**: 1.0.0 | **Ratified**: 2026-08-18 | **Last Amended**: 2026-08-18
