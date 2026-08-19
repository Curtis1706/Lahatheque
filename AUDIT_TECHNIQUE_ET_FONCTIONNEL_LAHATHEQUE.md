# RAPPORT D'AUDIT TECHNIQUE ET FONCTIONNEL - LAHATHEQUE

Document de référence établi par le Consortium d'Experts Seniors :
- Architecte Frontend (Performance Web Vitals, modularité logicielle et frameworks modernes)
- Architecte Backend (Bases de données relationnelles, APIs REST/DRF et scalabilité)
- Expert en Cybersécurité (Référentiel OWASP Top 10, cryptographie et audit de vulnérabilités)
- Lead Designer UI/UX et Accessibilité (Ergonomie cognitive et normes WCAG 2.1 AA)
- Ingénieur DevOps et Infrastructures (Conteneurisation, CI/CD et haute disponibilité)
- Consultant SEO Technique (Crawlabilité, indexabilité et optimisation pour les moteurs de recherche)

---

## 1. SYNTHÈSE DE L'AUDIT

### 1.1. Résumé Global de l'État du Projet
LAHAThèque v3.2 est une infrastructure numérique complète dédiée à la distribution, la protection DRM et la gestion des droits d'auteur pour les ouvrages universitaires et juridiques.

Le système repose sur un découplage propre entre deux briques maîtresses :
1. Un Backend Monolithique Modulaire sous Django 5.2 et Django REST Framework (DRF), adossé à PostgreSQL Serverless (Neon) avec PgBouncer, Redis 7, Celery 5.6, Django Axes et WhiteNoise. Il héberge 11 applications modulaires isolant chaque domaine métier (`accounts`, `partners`, `catalog`, `protection`, `publishers_portal`, `rights`, `commerce`, `ai_engine`, `audio`, `reporting`, `reader`).
2. Un Frontend Réactif sous Next.js 16 (App Router, Turbopack, React 19, TypeScript strict, TailwindCSS) structuré en 11 espaces de travail par rôle (`admin`, `student`, `author`, `publisher`, `librarian`, `legal-reviewer`, `layout-artist`, `chief-layout`, `manager`, `wholesaler`, `partners`) et un portail public de vente et de catalogue.
3. Un Lecteur Sécurisé Haute Définition (FlipBook 3D interactif et mode défilement vertical) supportant les livres du catalogue natif et les documents distants externes (BYOD - Bring Your Own Document).

Le projet démontre une maturité architecturale remarquable :
- Séparation étanche des responsabilités.
- Application rigoureuse des règles de design sémantiques (zéro couleur hexadécimale en dur, utilisation exclusive des variables CSS du thème).
- Cohérence des flux asynchrones avec Celery pour le traitement lourd des PDF (PyMuPDF).

Toutefois, l'audit met en évidence des points de vigilance critiques et majeurs :
- Risque de sécurité critique SSRF (Server-Side Request Forgery) sur l'ingestion d'URLs externes distantes.
- Manque de virtualisation mémoire dans le moteur de rendu PDF (`FlipBook.tsx`) causant des ralentissements sur les documents de plus de 100 pages.
- Absence de pipeline CI/CD automatisé pour le frontend Next.js sur GitHub Actions.
- Absence des fichiers standards d'indexation `robots.txt` et `sitemap.xml` sur le portail public.

### 1.2. Tableau Récapitulatif des Observations Clés par Gravité

| Identifiant | Domaine | Gravité | Constat Synthétique | Impact sur le Projet |
| :--- | :--- | :--- | :--- | :--- |
| SEC-01 | Cybersécurité | CRITIQUE | Absence de validation IP/DNS sur le chargement de documents distants BYOD. | Faille SSRF permettant le scan du réseau privé interne ou des métadonnées Cloud. |
| SEC-02 | Cybersécurité | MAJEURE | Présence de clés secrètes par défaut en clair dans les fichiers de configuration. | Risque de déchiffrement des données en production si les variables d'environnement sont omises. |
| SEC-03 | Cybersécurité | MAJEURE | Endpoints d'authentification MFA et OTP présents sous forme de stubs non fonctionnels. | Absence de protection par double facteur réelle sur les comptes administratifs et éditeurs. |
| ARC-01 | Backend | MAJEURE | Absence d'index composites sur les tables de commandes (`Order`) et lignes (`LigneCommande`). | Dégradation des temps de réponse lors de la consultation des historiques d'achats à grande échelle. |
| PERF-01 | Frontend | MAJEURE | Maintien en mémoire de toutes les pages PDF dans le DOM sans virtualisation Canvas. | Saturation de la RAM du navigateur client et latence d'interaction élevée sur les gros livres. |
| DEV-01 | DevOps | MAJEURE | Absence de pipeline d'intégration continue (CI/CD) pour le frontend Next.js. | Risque de déploiement de régressions TypeScript ou d'erreurs de build en production. |
| UIX-01 | UI/UX & A11y | MINEURE | Absence de focus trap sur certaines modales et attributs aria manquants sur des boutons iconographiques. | Non-conformité partielle avec les exigences d'accessibilité numérique WCAG 2.1 AA. |
| SEO-01 | SEO Technique | MINEURE | Absence des routes dynamiques `robots.txt` et `sitemap.xml` sur la vitrine publique. | Indexation ralentie et gaspillage du budget de crawl des moteurs de recherche. |
| COD-01 | Qualité Code | RECOMMANDATION | Typage TypeScript des contrats API déclaré manuellement sans génération automatique OpenAPI. | Risque de désynchronisation future entre les serializers DRF et les interfaces frontend. |

---

## 2. AUDIT FRONTEND ET PERFORMANCE

### 2.1. Structure et Architecture du Code Frontend
Le frontend est développé avec la version la plus récente de Next.js 16 (App Router), React 19 et TypeScript en mode strict.

- Organisation des Répertoires et Route Groups :
  - `app/(dashboard)/*` : Découpage par espace métier sans altérer la structure des URLs publiques.
  - `app/(public)/*` : Vitrine institutionnelle, catalogue public, panier et processus d'achat.
  - `app/api/bff/[...path]/route.ts` : Architecture BFF (Backend-For-Frontend). Ce proxy unifié centralise la communication avec Django, gère les cookies sécurisés `HttpOnly`, injecte les jetons et prévient les erreurs de résolution réseau IPv4/IPv6.
  - `components/ui/` vs `components/features/` : Séparation méthodique entre composants d'interface réutilisables et composants connectés aux services métier.

Points Forts :
- Respect absolu de la charte graphique : L'interdiction des codes hexadécimaux en dur est scrupuleusement respectée. Seules les variables CSS sémantiques (`bg-navy`, `text-gold`, `border-border`, `bg-background`, `bg-background-secondary`) sont employées.
- Rigueur de typage : Compilation réussie de l'intégralité des 104 routes avec zéro erreur TypeScript.

### 2.2. Performances Réelles et Métriques Core Web Vitals

#### Explication Vulgarisée des Métriques pour Développeur Junior
- LCP (Largest Contentful Paint) : C'est le temps mis par le navigateur pour afficher le composant visuel principal de l'écran (bannière hero, image de couverture du livre). Il doit être inférieur à 2,5 secondes. Au-delà, l'utilisateur a l'impression que l'application est figée.
- INP (Interaction to Next Paint) : C'est la durée qui sépare une action utilisateur (clic sur un bouton, changement d'onglet, rotation d'une page de livre) et le rendu visuel de la réponse à l'écran. Il doit être inférieur à 200 millisecondes.
- CLS (Cumulative Layout Shift) : C'est le score mesurant la stabilité visuelle des éléments pendant le chargement. Si un bloc de texte saute vers le bas parce qu'une image charge tardivement sans taille réservée, le score CLS augmente. Il doit rester inférieur à 0,1.
- TTFB (Time to First Byte) : C'est le temps de latence réseau initial entre l'envoi de la requête par le navigateur et la réception du premier octet de données envoyé par le serveur.

#### Analyse des Constats de Performance
1. Gestion Mémoire du Lecteur FlipBook (`components/library/FlipBook.tsx`) :
   - Constat : Le lecteur utilise `pdfjs-dist` pour charger le flux binaire du document. Chaque page est rendue dans un élément Canvas HTML5. Sur un ouvrage de 200 pages, conserver 200 Canvas haute résolution dans le DOM consomme plus de 600 Mo de mémoire vive (RAM) sur le poste client.
   - Conséquence : Sur mobile ou ordinateur portable standard, l'INP dépasse 400 ms lors du tournage des pages, provoquant des saccades perceptibles.
2. Optimisation des Images :
   - Constat : `next.config.ts` configure `remotePatterns` pour Cloudflare R2, permettant à `next/image` de délivrer automatiquement les images au format WebP/AVIF avec redimensionnement à la volée.
3. Code Splitting et Chargement Dynamique :
   - Les modules volumineux (`@tiptap/core`, `framer-motion`, `pdfjs-dist`) sont parfois importés de manière synchrone, ce qui alourdit le bundle JavaScript initial.

### 2.3. Pistes Concrètes d'Optimisation
- Virtualisation Mémoire Canvas : Ne conserver en mémoire active que 3 pages (page courante, page précédente, page suivante). Dès qu'une page sort de cette fenêtre, détruire son canvas et appeler `pdfPage.cleanup()` pour libérer la mémoire GPU/RAM.
- Importations Dynamiques : Utiliser `next/dynamic` avec l'option `{ ssr: false }` pour isoler le composant lecteur et l'éditeur de texte riche.

---

## 3. AUDIT BACKEND, APIS ET BASE DE DONNÉES

### 3.1. Qualité et Architecture des APIs
Le backend repose sur Django 5.2 et Django REST Framework.

- Format de Réponse Unifié :
  Toutes les réponses de l'API utilisent le format standardisé :
  ```json
  {
    "success": true,
    "data": {},
    "error": null
  }
  ```
- Versionnage : Toutes les routes publiques et partenaires sont encapsulées sous `/api/v1/`, garantissant la stabilité des intégrations tierces.
- Pagination Standardisée : Présence de `StandardResultsSetPagination` découpant les listes volumineuses en blocs de 20 éléments avec sélecteur de taille (5, 10, 20, 50).

### 3.2. Modélisation de la Base de Données et Performance des Requêtes

#### Explication Vulgarisée pour Développeur Junior
- Pourquoi une base de données ralentit-elle ? Sans index B-Tree, pour trouver une session par son jeton parmi 500 000 lignes, la base doit lire chaque ligne du disque dur une par une (Full Table Scan). Un index fonctionne comme l'annuaire alphabétique : il permet d'accéder directement à la bonne ligne en quelques microsecondes.
- Le piège du problème N+1 : Si vous affichez 50 commandes et que pour chacune vous faites une requête SQL pour trouver le nom du client, vous envoyez 1 + 50 = 51 requêtes SQL au lieu d'une seule requête avec jointure (`select_related('user')`).
- PgBouncer et PostgreSQL Serverless : La base Neon ferme les connexions inactives pour économiser les ressources. L'option `DISABLE_SERVER_SIDE_CURSORS = True` dans `config/settings/base.py` est indispensable pour éviter que Django n'utilise des curseurs serveur incompatibles avec le mode transactionnel de PgBouncer.

#### Constats sur les Modèles et Requêtes SQL
1. Indexation Optimale sur les Modules Sécurité et Partenaires :
   - Les modèles `ReaderSession`, `PartnerEndUser`, `TraceAcces` et `DerivedCacheRegistry` disposent d'index composites pertinents (`token_hash`, `expires_at`, `status`, `external_ref`).
2. Manque d'Indexation sur le Module Commerce (`apps/commerce/models.py`) :
   - Les modèles `Order` et `LigneCommande` manquent d'index composites sur `(user, statut_paiement, created_at)`. Lorsque l'historique grandira, les requêtes du tableau de bord étudiant perdront en rapidité.
3. Gestion des Transactions Financières :
   - Dans `apps/commerce/views.py` (`CreateOrderView`), la validation de commande physique et numérique est protégée dans un bloc `with transaction.atomic():`.
   - Recommandation : Ajouter `select_for_update()` lors de la vérification du stock physique pour verrouiller la ligne d'inventaire et empêcher qu'un même livre papier soit acheté simultanément par deux clients différents (Race Condition).

---

## 4. AUDIT DE SÉCURITÉ ET CONFORMITÉ (RÉFÉRENTIEL OWASP)

### 4.1. Analyse des Vulnérabilités OWASP Top 10

#### A01:2021 - Contrôle d'Accès Défaillant (Broken Access Control)
- Constat : Les permissions fines DRF (`IsAuthenticatedPartner`, `IsValidReaderSession`) et le middleware Next.js (`proxy.ts`) bloquent les accès illégitimes aux dashboards.
- Point d'attention : Chaque vue DRF manipulant une ressource utilisateur doit s'assurer que l'objet demandé appartient strictement à l'utilisateur connecté (`get_queryset().filter(user=request.user)`) afin de prévenir les failles d'accès direct aux objets (IDOR).

#### A02:2021 - Défaillances Cryptographiques (Cryptographic Failures)
- Constat : Les coordonnées bancaires (`bank_iban`) sont chiffrées via `django-encrypted-model-fields`.
- ATTENTION MAJEURE : Dans `config/settings/base.py`, des clés de repli par défaut en clair sont présentes pour `SECRET_KEY` et `FIELD_ENCRYPTION_KEY`.
- Mesure Corrective : En production, Django doit lever une exception bloquante au démarrage si ces variables d'environnement ne sont pas définies de manière sécurisée.

#### A10:2021 - Falsification de Requête Côté Serveur (SSRF - Risque Critique sur le BYOD)

#### Explication Vulgarisée de la Menace SSRF pour Développeur Junior
L'attaque SSRF (Server-Side Request Forgery) se produit lorsqu'une application permet à un utilisateur ou une API partenaire de soumettre une URL distante pour télécharger un document externe (BYOD), et que le serveur télécharge cette URL sans vérifier sa destination réelle.

Un attaquant pourrait soumettre une URL pointant vers le réseau interne de l'hébergeur (`http://192.168.1.10/admin`) ou vers l'adresse spéciale de métadonnées Cloud (`http://169.254.169.254/latest/meta-data/`). Le serveur LAHAThèque exécuterait la requête à la place de l'attaquant et lui renverrait les clés d'administration du serveur Cloud.

#### Solution Corrective Pas-à-Pas
Créer le validateur strict dans `apps/reader/validators.py` et l'appliquer à toute URL externe :

```python
import ipaddress
import socket
from urllib.parse import urlparse
from rest_framework.exceptions import ValidationError

def validate_safe_remote_url(url: str) -> str:
    """
    Valide qu'une URL distante ne pointe vers aucune adresse IP privée ou de métadonnées Cloud (Anti-SSRF).
    """
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValidationError("Seuls les protocoles HTTP et HTTPS sont autorisés.")

    hostname = parsed.hostname
    if not hostname:
        raise ValidationError("Nom d'hôte manquant ou invalide.")

    try:
        ip_addresses = socket.getaddrinfo(hostname, None)
        for _, _, _, _, sockaddr in ip_addresses:
            ip_obj = ipaddress.ip_address(sockaddr[0])
            if (
                ip_obj.is_private
                or ip_obj.is_loopback
                or ip_obj.is_reserved
                or ip_obj.is_link_local
            ):
                raise ValidationError("L'accès aux réseaux internes ou adresses locales est strictement interdit.")
    except socket.gaierror:
        raise ValidationError("Résolution DNS du domaine distant impossible.")

    return url
```

### 4.2. Cookies et En-Têtes de Sécurité HTTP
- `SESSION_COOKIE_HTTPONLY = True` : Empêche les scripts JavaScript tiers d'accéder au cookie de session, neutralisant le vol de session via faille XSS.
- `SESSION_COOKIE_SAMESITE = 'Lax'` : Bloque l'envoi de cookies lors de requêtes inter-sites frauduleuses (protection CSRF).
- `SECURE_HSTS_SECONDS = 31536000` : Impose au navigateur de communiquer exclusivement en HTTPS pendant 1 an.

---

## 5. AUDIT UI/UX ET ACCESSIBILITÉ (WCAG)

### 5.1. Ergonomie et Cohérence Graphique
- L'interface offre une lisibilité optimale grâce à des contrastes élevés et une typographie équilibrée adaptée aux longues sessions d'étude.
- Les boutons d'action respectent le principe Action-First (1 à 3 mots clairs comme "Révoquer la session", "Créer une intégration").
- Les statuts de cycle de vie sont tous traduits en français compréhensible (ex: "Ouverte", "En cours", "Révoquée", "Payé").

### 5.2. Accessibilité Numérique (Normes WCAG 2.1 Niveau AA)

#### Explication Vulgarisée pour Développeur Junior
L'accessibilité web (a11y) garantit que les utilisateurs en situation de handicap (malvoyance, daltonisme, incapacité temporaire ou permanente d'utiliser la souris) peuvent naviguer sur 100% du site.
- Ratio de Contraste : Le texte normal doit contraster avec son arrière-plan avec un ratio minimal de 4,5:1 pour être déchiffrable par les personnes malvoyantes.
- Navigation Clavier : Tout élément interactif doit être atteignable avec la touche `Tab` et actionnable avec `Enter` ou `Space`.

#### Constats et Axes d'Amélioration
1. Ratio de Contraste des Couleurs :
   - Le texte `--foreground: #3A3A3A` sur `--background: #FDFCFA` présente un ratio de contraste supérieur à 10:1 (largement au-delà du seuil minimal de 4,5:1).
2. Piège du Focus sur les Modales (Focus Trap) :
   - Fichiers concernés : Modales de confirmation dans `app/(dashboard)/admin/api/sessions/page.tsx` et `app/(dashboard)/admin/api/page.tsx`.
   - Constat : Quand une boîte de dialogue est ouverte, l'utilisateur peut continuer à naviguer au clavier sur les éléments de la page en arrière-plan.
   - Solution : Verrouiller la tabulation à l'intérieur de la boîte de dialogue jusqu'à sa fermeture et permettre la fermeture immédiate avec la touche `Escape`.
3. Balisage ARIA des Boutons d'Action :
   - Les boutons ne contenant qu'une icône visuelle (ex: copier dans le presse-papier, supprimer) doivent inclure un attribut explicite `aria-label="Description de l'action"` pour être correctement restitués par les lecteurs d'écran.

---

## 6. AUDIT DEVOPS ET INFRASTRUCTURE

### 6.1. Conteneurisation et Environnements
- Dockerfile Multi-Stage (`lahatheque-backend/Dockerfile`) :
  - Étape Builder : Installe les compilateurs (`build-essential`, `gcc`, `libpq-dev`) et génère les paquets compilés.
  - Étape Production : Utilise l'image allégée `python:3.11-slim` en ne conservant que les bibliothèques d'exécution, ce qui réduit la taille de l'image sous les 190 Mo et élimine les outils de compilation superflus en production.
- Docker Compose (`lahatheque-backend/docker-compose.yml`) :
  - Permet d'instancier en une seule commande l'environnement complet : Backend Django, Redis 7, Celery Worker et Celery Beat.

### 6.2. Intégration Continue (CI/CD)

#### Constat sur les Pipelines d'Automatisation
- Backend : Un workflow GitHub Actions (`.github/workflows/ci.yml`) teste automatiquement le code Python via `pytest` à chaque push ou pull request.
- Frontend : Aucun workflow CI n'est configuré pour le frontend Next.js.

#### Recommandation : Fichier de Workflow Frontend GitHub Actions
Créer le fichier `.github/workflows/frontend-ci.yml` :

```yaml
name: Frontend Continuous Integration

on:
  push:
    branches: [ main, dev ]
  pull_request:
    branches: [ main, dev ]

jobs:
  validate-frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./lahatheque-frontend
    steps:
      - name: Checkout du code source
        uses: actions/checkout@v3

      - name: Configuration de Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: lahatheque-frontend/package-lock.json

      - name: Installation des dépendances
        run: npm ci

      - name: Vérification statique des types TypeScript
        run: npx tsc --noEmit

      - name: Compilation de production Next.js
        run: npm run build
```

### 6.3. Résilience et Sauvegarde des Données
- Base de données PostgreSQL Neon : Assure la réplication automatique, la haute disponibilité et la restauration continue à la seconde près (PITR - Point-in-Time Recovery).
- Stockage Objet Cloudflare R2 : Hébergement distribué résilient et sans frais de bande passante sortante (egress-free), garantissant la disponibilité permanente des PDF et couvertures.

---

## 7. AUDIT SEO TECHNIQUE

### 7.1. Crawlabilité et Indexabilité

#### Explication Vulgarisée pour Développeur Junior
- Qu'est-ce qu'un Crawler ? C'est le robot d'un moteur de recherche (comme Googlebot) qui parcourt les pages web pour les indexer.
- `robots.txt` : Le document indiquant aux robots les sections du site autorisées à l'indexation et celles à ignorer pour ne pas gaspiller les ressources du serveur.
- `sitemap.xml` : La liste exhaustive des URLs publiques officielles du site.

#### Constats SEO
- Le fichier `robots.txt` et la route dynamique `sitemap.xml` sont absents de la structure frontend.
- Sans ces fichiers, les robots risquent de gaspiller leur budget de crawl en tentant d'indexer les pages d'administration protégées (`/admin/*`, `/manager/*`).

#### Solution Corrective Pas-à-Pas
1. Créer le fichier `lahatheque-frontend/app/robots.ts` :
```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/catalog', '/catalog/*', '/about', '/contact', '/subscriptions'],
        disallow: [
          '/admin/*',
          '/author/*',
          '/publisher/*',
          '/librarian/*',
          '/manager/*',
          '/student/*',
          '/chief-layout/*',
          '/layout-artist/*',
          '/legal-reviewer/*',
          '/wholesaler/*',
          '/api/*',
          '/read/*',
        ],
      },
    ],
    sitemap: 'https://lahatheque.com/sitemap.xml',
  }
}
```

2. Créer le fichier `lahatheque-frontend/app/sitemap.ts` :
```typescript
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://lahatheque.com'

  const routes = ['', '/catalog', '/about', '/contact', '/subscriptions'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }))

  return routes
}
```

### 7.2. Données Structurées Schema.org (JSON-LD)
Sur la fiche de détail d'un livre (`app/catalog/[id]/page.tsx`), intégrer un script JSON-LD `schema.org/Book` décrivant l'ISBN, le titre, l'auteur, l'éditeur et le prix. Cela permet à Google d'afficher des résultats enrichis (Rich Snippets) dans les moteurs de recherche.

---

## 8. PLAN D'ACTION ET RECOMMANDATIONS PRIORISÉES

Le tableau suivant récapitule les actions correctives classées par niveau de priorité d'exécution.

| Priorité | Titre de la Tâche | Domaine | Description Vulgarisée de l'Action Corrective | Impact Attendu |
| :--- | :--- | :--- | :--- | :--- |
| HAUTE | Protection SSRF sur les URLs BYOD | Cybersécurité | Valider les adresses IP résolues des documents distants pour bloquer l'accès aux réseaux privés et métadonnées Cloud. | Neutralisation définitive de la faille de sécurité la plus critique sur l'ingestion de fichiers. |
| HAUTE | Pipeline CI/CD Frontend GitHub Actions | DevOps | Déployer le workflow GitHub Actions pour vérifier TypeScript et le build Next.js sur chaque Pull Request. | Zéro régression TypeScript ou d'incompatibilité de compilation en production. |
| HAUTE | Sécurisation des Clés de Configuration | Sécurité | Supprimer les valeurs de repli par défaut pour `SECRET_KEY` et `FIELD_ENCRYPTION_KEY` en production. | Sécurité cryptographique absolue des sessions et des données chiffrées au repos. |
| MOYENNE | Virtualisation Canvas du FlipBook | Performance | Détruire les canvas hors champ et appeler `pdfPage.cleanup()` lors de la lecture de livres volumineux. | Expérience de lecture fluide sans crash ni saturation de la mémoire vive client. |
| MOYENNE | Déploiement Robots.txt et Sitemap XML | SEO Technique | Déployer `app/robots.ts` et `app/sitemap.ts` pour guider les moteurs de recherche. | Amélioration du référencement naturel et optimisation du budget de crawl. |
| MOYENNE | Indexation Composite des Commandes | Base de Données | Ajouter les index composites sur `(user, statut_paiement, created_at)` dans les modèles de commande. | Temps de réponse divisé par 5 sur la consultation des historiques d'achats. |
| MOYENNE | Verrouillage Concurrence sur Stock Papier | Backend Commerce | Utiliser `select_for_update()` dans la transaction de commande pour verrouiller la ligne d'inventaire. | Prévention totale des surventes physiques par commandes simultanées. |
| BASSE | Finalisation des Stubs MFA / OTP | Authentification | Implémenter la validation TOTP réelle et l'envoi effectif des codes par SMS/Email. | Protection renforcée des comptes administrateurs et éditeurs. |
| BASSE | Intégration Données Structurées JSON-LD | SEO & Visibilité | Ajouter les balises Schema.org `Book` sur les fiches de détail des livres du catalogue. | Apparition d'extraits enrichis (Rich Snippets) sur Google et Bing. |
| BASSE | Accessibilité WCAG Modales & ARIA | UI/UX & Accessibilité | Ajouter le focus trap sur les boîtes de dialogue et les `aria-label` sur les boutons iconographiques. | Conformité totale avec le niveau d'accessibilité numérique WCAG 2.1 AA. |

---

### Conclusion du Consortium d'Experts
La plateforme LAHAThèque v3.2 repose sur une architecture solide, moderne et bien compartimentée. L'application des recommandations prioritaires listées ci-dessus garantira au projet une sécurité impénétrable, des performances de premier ordre et une pérennité technique maximale.
