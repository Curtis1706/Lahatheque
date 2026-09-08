<!--
Sync Impact Report:
- Version change: 1.3.0 -> 1.4.0
- List of modified principles:
  - XII. Workflow Obligatoire de Conception d'Écrans (/build-lahatheque-screen) et Protocole Multi-Clés 21st.dev (NON-NÉGOCIABLE) -> Suppression définitive de toute tolérance pour les données mockées. Remplacement de l'étape 3 par l'obligation absolue de données réelles typées connectées aux endpoints Django via BFF (Interdiction Totale et Définitive des Mocks).
- Added principles & sections: Aucun
- Removed sections: Aucun
- Follow-up TODOs: Aucun
-->

# LAHAThèque Constitution

## Core Principles

### I. Cadrage Métier, Lecture Intégrale Exhaustive et Consultation de Documentation (NON-NÉGOCIABLE)
- Toute conception technique ou développement doit débuter par la lecture approfondie du cahier des charges (`cahier_des_charges.txt`) et la consultation des documentations officielles des technologies employées. Aucune hypothèse non vérifiée ne doit être introduite.
- **Lecture Intégrale Exhaustive des Fichiers (Règle Absolue et Obligatoire)** : Pour tout audit, analyse, implémentation, refactoring ou tâche d'ingénierie, la lecture intégrale de 100 % des lignes de chaque fichier concerné est strictement obligatoire. Zéro omission, zéro survol, zéro troncature. Il est formellement interdit de sauter des lignes ou de supposer du contenu.

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

### VIII. Intégration Frontend, Tokens Sémantiques, Typographie Officielle et Finitions Chic
- **Interdiction des Couleurs Hexadécimales en Dur** : Aucune classe `bg-[#...]`, `text-[#...]`, `border-[#...]`. Utilisation exclusive des tokens sémantiques de `globals.css` (`bg-navy`, `bg-navy-dark`, `bg-navy-hover`, `bg-gold`, `text-gold`, `border-gold`, `bg-background`, `bg-background-secondary`, `border-border`).
- **Typographie Officielle (Google Fonts)** :
  - *Titres, En-têtes, Logo et Noms de section* : **Playfair Display** (`font-serif`, `font-playfair` — Bold 700 / Semi-Bold 600).
  - *Textes de corps, Menus, Boutons, Prix et Formulaires* : **Poppins** (`font-sans`, `font-poppins` — Regular 400, Medium 500, Semi-Bold 600).
- **Finitions Nobles et Sobriété Visuelle** : Interdiction des bordures blanches artificielles (`border-white/10`) et dégradés improvisés. Interdiction des bordures verticales gauches dans la Sidebar (mise en surbrillance uniquement par texte/icône doré `text-gold` et fond subtil `bg-gold/10`).

### IX. Code Exhaustivement Commenté et Documenté
Tout le code source produit doit être richement commenté, avec des docstrings détaillées sur chaque module, classe et méthode, ainsi que des commentaires explicatifs sur les logiques métier non évidentes.

### X. Interdiction Absolue de Tout Émoji
Aucun émoji n'est toléré dans le code source, les commentaires, les docstrings, les fichiers de règles, les réponses d'API, les tableaux de bord, les modales, le chat ou la documentation technique. Utiliser exclusivement les icônes vectorielles Lucide React (`lucide-react`) ou de la typographie textuelle soignée.

### XI. Traçabilité, Observabilité et Journalisation Granulaire (NON-NÉGOCIABLE)
- Chaque traitement asynchrone (OCR, encodage audio, indexation, notifications, imports de masse) doit émettre des logs balisés étape par étape (`[NomModule ETAPE X/Y]`), permettant un diagnostic sans ambiguïté dans les logs Docker / Coolify.
- Zéro action silencieuse côté frontend : toute interaction utilisateur asynchrone (recherche anti-rebond, réindexation, mutation) doit être tracée dans la console navigateur (`[NomComposant]`) et pourvue d'un feedback visuel immédiat (toast, loader, mise à jour optimiste).
- En cas d'erreur ou d'échec, persister explicitement la cause de l'erreur dans l'entité de base de données correspondante et consigner l'exception avec trace complète (`exc_info=True`).

### XII. Workflow Obligatoire de Conception d'Écrans (/build-lahatheque-screen) et Protocole Multi-Clés 21st.dev (NON-NÉGOCIABLE)
Tout écran, page, modale ou tableau de bord construit sur LAHAThèque doit suivre obligatoirement et séquentiellement les 8 étapes du workflow `/build-lahatheque-screen` :
1. **Étape 1 — Cadrage des specs** : Lecture croisée du modèle Django réel (types, champs, statuts) et du cahier des charges métier avant toute ligne de code.
2. **Étape 2 — Arborescence explicite** : Identification de l'URL racine, sous-pages, modales associées et shell partagé.
3. **Étape 3 — Données Réelles Typées et Services API Connectés (Interdiction Absolue des Mocks)** : Définition stricte des interfaces TypeScript dans `lib/types/` fidèles aux modèles Django. Implémentation des fonctions asynchrones de services API dans `lib/services/` appelant directement les endpoints Django via le proxy BFF (`app/api/bff/...`) avec cookies de session HttpOnly. L'usage de données mockées (`lib/mock/`), de données fictives ou de bouchons statiques est strictement et formellement interdit.
4. **Étape 4 — Recherche 21st.dev et Protocole Multi-Clés** :
   - Recherche obligatoire via `get_inspiration` et `search` (au moins 3 requêtes) avant tout codage générique.
   - Téléchargement du code source (`get_component` / `generate`) avec basculement automatique sur les 8 instances MCP configurées (`21st` à `21st-8`) en cas d'épuisement de quota.
   - Si les 8 clés sont épuisées : déclenchement obligatoire du protocole pas-à-pas de copier-coller avec l'utilisateur (URL fournie, attente du code, intégration, composant suivant). Jamais de composant générique codé sans avoir épuisé ce protocole.
   - Adaptation obligatoire : conversion aux tokens `globals.css`, adaptation mobile-first, typage TypeScript.
5. **Étape 5 — UI Mobile-First, Intuitivité & Système de Loading Unique** :
   - Design strict pensé d'abord pour mobile (~375-390px) puis étendu (`sm`, `md`, `lg`, `xl`). Zones tactiles >= 44px.
   - Système de chargement global unique (`components/ui/loading/*` avec skeleton épousant la forme finale, jamais de spinner ad hoc réinventé).
   - Modale de confirmation obligatoire pour toute action destructrice. Tooltips obligatoires sur les icônes seules.
6. **Étape 6 — UX Writing Fonctionnel** : Français direct, concis, voix active, boutons de 1 à 3 mots action-first, statuts traduits en français humain (jamais de snake_case brut).
7. **Étape 7 — Implémentation Modulaire et Connexion Réelle** : TypeScript strict, HTML5 sémantique, ARIA, logique déportée dans des hooks et composants UI réutilisables. Connexion directe aux services API connectés au backend Django via BFF.
8. **Étape 8 — Validation par la Checklist Finale** : Contrôle obligatoire des 12 critères d'acceptation de l'écran avant toute clôture de tâche.

---

## Constraints & Security Requirements

- Base de données : PostgreSQL (Neon) avec contraintes d'intégrité strictes, index GIN/FTS pour la recherche plein texte et indexation ciblée.
- Stockage de fichiers : Cloudflare R2 sécurisé avec URLs publiques et gestion résiliente des permissions de téléversement jusqu'à 800 Mo.
- DRM et Lecteur : Moteur de lecture 3D FlipBook et mode normal vertical avec protection anti-capture et filigrane dynamique personnalisé.
- Environnement d'exécution : Déploiement conteneurisé Docker / Coolify sous reverse proxy Traefik avec isolation des tâches lourdes en arrière-plan (Celery / threads asynchrones).

---

## Development Workflow & Quality Gates

- Spécifications Spec Kit : Tout développement d'envergure suit la séquence Spec Kit (`specify` -> `clarify` -> `plan` -> `tasks` -> `implement` -> `analyze`).
- Construction d'Écrans : Tout écran ou dashboard suit obligatoirement le workflow séquentiel `/build-lahatheque-screen` et doit valider sa checklist complète de 12 critères.
- Validation Mobile-First : Aucun écran ne peut être livré s'il présente un défilement horizontal indésirable ou des ruptures sous 400px de largeur.
- Isolation réseau : Les endpoints de mutation lourde doivent répondre immédiatement (< 300 ms) en déléguant le travail intensif à des processus d'arrière-plan non bloquants.

---

## Governance

Cette Constitution fait foi sur l'ensemble du projet LAHAThèque et prime sur toute décision locale. Tout code produit doit être audité et validé conformément à ces 12 principes fondamentaux. Toute modification ou amendement requiert une revue de conformité et un incrément sémantique de version.

**Version**: 1.4.0 | **Ratified**: 2026-08-18 | **Last Amended**: 2026-09-08
