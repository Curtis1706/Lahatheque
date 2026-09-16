# Rapport d'Audit Technique : Sécurité, Performance et Scalabilité — LAHAThèque (v3.2)

**Date** : Septembre 2026  
**Cible** : LAHAThèque v3.2 (Backend Django REST & Frontend Next.js BFF)  
**Rôle** : Auditeur Technique Senior (Sécurité Applicative, Performance & Architecture Scalable)  
**Classification** : Document Confidentiel Interne — LAHA Éditions  

---

## Sommaire

1. [Introduction et Contexte de l'Audit](#1-introduction-et-contexte-de-laudit)
2. [Écarts Majeurs entre Hypothèses Initiales et Réalité du Codebase](#2-écarts-majeurs-entre-hypothèses-initiales-et-réalité-du-codebase)
3. [Cartographie Réelle de l'Architecture Applicative](#3-cartographie-réelle-de-larchitecture-applicative)
4. [Résumé Exécutif : Top 10 des Risques Critiques](#4-résumé-exécutif--top-10-des-risques-critiques)
5. [Tableau Général des Constats par Axe](#5-tableau-général-des-constats-par-axe)
6. [Axe 1 — Sécurité Applicative et Infrastructure](#6-axe-1--sécurité-applicative-et-infrastructure)
7. [Axe 2 — Performance Backend et Frontend](#7-axe-2--performance-backend-et-frontend)
8. [Axe 3 — Scalabilité et Résilience](#8-axe-3--scalabilité-et-résilience)
9. [Dossier Spécial : Risques DRM, Anti-Piratage et Fuites de Données](#9-dossier-spécial--risques-drm-anti-piratage-et-fuites-de-données)
10. [Feuille de Route Priorisée des Correctifs](#10-feuille-de-route-priorisée-des-correctifs)
11. [Commandes et Outils Recommandés pour la CI/CD](#11-commandes-et-outils-recommandés-pour-la-cicd)

---

## 1. Introduction et Contexte de l'Audit

Le présent audit technique a été conduit sur la plateforme **LAHAThèque** (version 3.2), bibliothèque numérique universitaire déployée pour le compte de LAHA Éditions.

L'objectif de cette mission est de dresser un diagnostic exhaustif, sans concession, fondé sur l'exploration directe de 100 % des lignes des modules critiques :
- **Sécurité** : Authentification, gestion des sessions BFF, permissions et autorisations, contrôle des accès aux ouvrages, intégrité du DRM et du tatouage, validation des entrées et fichiers, conformité de l'infrastructure.
- **Performance** : Requêtes de base de données, efficience du cache applicatif, consommation mémoire et réseau des flux de lecture, streaming binaire dans le BFF.
- **Scalabilité** : Résilience face aux pics de charge (rentrées universitaires), comportement du pool de connexions PostgreSQL serverless (Neon), découplage des briques logicielles.

L'analyse a été exécutée en mode lecture seule stricte, sans modification de code source ni altération de l'environnement d'exécution.

---

## 2. Écarts Majeurs entre Hypothèses Initiales et Réalité du Codebase

L'exploration approfondie du dépôt a mis en lumière quatre divergences fondamentales entre les spécifications présumées et l'implémentation effective :

### 2.1 Périmètre des Applications Django (13 apps effectives vs 10 annoncées)
Le système ne repose pas sur 10 applications, mais sur **13 applications Django distinctes** enregistrées dans `INSTALLED_APPS` (`config/settings/base.py:38-51`) et montées dans `config/urls.py:9-30` :
1. `accounts` : Gestion des utilisateurs, rôles, réinitialisation de mot de passe et intégration OAuth2 / SSO.
2. `partners` : Affiliations universitaires, gestion des établissements et bouquets institutionnels.
3. `catalog` : Modèles du catalogue, ouvrages, classifications, auteurs, versions multilingues et quiz.
4. `protection` : DRM dynamique, services de traçabilité légale (`TraceAcces`), tatouage PyMuPDF et investigations forensiques.
5. `publishers_portal` : Portail éditeurs tiers, dépôts (`PublisherBookDeposit`), métadonnées et reporting royalties.
6. `rights` : Soumission de manuscrits auteurs, comités de lecture, contrats et pré-édition.
7. `commerce` : Commandes, facturation, abonnements individuels et institutionnels, stocks physiques et gestion des paiements.
8. `ai_engine` : Extraction de texte, génération de métadonnées et intégration LLM OpenAI.
9. `audio` : Gestion des livres audio, pistes sonores et streaming audio protégé.
10. `reporting` : Notifications utilisateurs, métriques administratives, alertes et journalisation.
11. `reader` : Sessions de lecture partenaires hébergées, validation de jetons et streaming Range HTTP 206.
12. `student` : Espace étudiant, progression de lecture (`ReadingProgress`) et suivi pédagogique.
13. `communications` : Envoi d'emails transactionnels (Resend/SMTP), templates et notifications directes.
*(Une application utilitaire transverse `common` assure la pagination, le chiffrement et la gestion des exceptions).*

### 2.2 Implémentation DRM : Serveur LCP v2 vs Moteur In-House PyMuPDF
Le cahier des charges évoquait un serveur `edrlab/lcp-server` v2 sous contrat EDRLab.  
**Constat réel** : Le fichier `apps/protection/lcp_client.py:1-28` n'est qu'un stub factice renvoyant des identifiants statiques (`stub_lcp_license_id`, `stub_key`). Le DRM en production est en réalité un **moteur in-house développé sur mesure** (`apps/protection/derived_materializer.py`, `apps/protection/watermark.py`, `apps/catalog/stream_views.py`), appliquant un filigrane et un tatouage dynamique via PyMuPDF sur des flux découpés en fragments Range HTTP 206 (RFC 7233).

### 2.3 Prestataire de Paiement : Mock vs Moneroo Mobile Money
Le système ne se limite pas à une abstraction `MockPaymentProvider`.  
**Constat réel** : Une intégration complète de l'agrégateur africain **Moneroo** (Mobile Money MTN/Moov, cartes bancaires) est en place avec validation de signature HMAC, webhooks idempotents (`apps/commerce/webhooks.py`) et réconciliation automatique via API (`apps/commerce/services.py:212-320`). Le fichier `config/settings/production.py:6` définit d'ailleurs `PAYMENT_PROVIDER_TYPE = 'moneroo'`.

### 2.4 Point d'Entrée Éditeur
Le modèle mentionné sous le nom `SubmissionDraft` est en réalité un alias de compatibilité : `SubmissionDraft = PublisherBookDeposit` (`apps/publishers_portal/models.py:188`).

---

## 3. Cartographie Réelle de l'Architecture Applicative

Le schéma ci-dessous synthétise les interactions réelles observées entre les couches :

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NAVIGATEUR CLIENT / LECTEUR                        │
│                   Next.js 16 (React 19) + PDF.js Viewer                     │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ Requêtes HTTP (Cookies HttpOnly laha_access)
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS BFF (Backend-for-Frontend)                      │
│   • app/api/auth/session/route.ts : Auth, Cookies HttpOnly, Refresh PUT    │
│   • app/api/bff/[...path]/route.ts : Proxy transparent vers Django API      │
│   • ATTENTION : proxy.ts inactif à l'Edge (non nommé middleware.ts)         │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ Proxy interne Bearer Token (HTTP 127.0.0.1:8000)
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DJANGO 5.2 / DJANGO REST FRAMEWORK                    │
│   • 13 Applications métier interconnectées                                  │
│   • Django SimpleJWT (Rotation activée, Blacklist désactivée)               │
│   • AccessService : Moteur centralisé de validation des droits de lecture   │
│   • DerivedMaterializer : Génération à la volée de PDF filigranés PyMuPDF   │
└──────────────┬───────────────────────────────┬──────────────────────────────┘
               │                               │
       SQL SSL │                               │ Cache & Broker Tâches
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────────────────────┐
│      NEON POSTGRESQL         │ │             REDIS CLUSTER                  │
│  Serverless AWS us-east-2    │ │  DB 0 : Celery Broker / Result             │
│  PgBouncer (Transaction)     │ │  DB 2 : Cache applicatif + Dérivés PDF     │
│  conn_max_age = 0 (latence)  │ │  ALERTE : cache.clear() intempestif        │
└──────────────────────────────┘ └────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────┐
│     CLOUDFLARE R2 BUCKET     │
│  Stockage S3 des originaux   │
│  ALERTE : querystring_auth   │
│  désactivé (accès public)    │
└──────────────────────────────┘
```

---

## 4. Résumé Exécutif : Top 10 des Risques Critiques

| Rang | Réf. | Axe | Intitulé du Risque | Sévérité | Impact Métier |
| :---: | :---: | :---: | :--- | :---: | :--- |
| **1** | SEC-01 | Sécurité | Regex CORS & CSRF permissive sur tous les domaines Vercel | CRITIQUE | Vol de session et falsification de requêtes par tout site Vercel tiers. |
| **2** | SEC-02 | Sécurité | Identifiants Redis et clés secrètes intégrés en clair par défaut | CRITIQUE | Prise de contrôle du cache, des files Celery et des données chiffrées. |
| **3** | SEC-03 | Sécurité | RCE critique Next.js (Image Optimization) et vulnérabilités PDF.js | CRITIQUE | Exécution de code à distance sur le serveur Node.js et les postes clients. |
| **4** | SEC-04 | Sécurité | BOLA / IDOR sur la configuration DRM des ouvrages | CRITIQUE | Tout étudiant authentifié peut désactiver la protection DRM de tout livre. |
| **5** | DRM-01 | DRM | Contournement immédiat du streaming DRM par omission du Range | CRITIQUE | Téléchargement direct du PDF intégral filigrané en une simple commande GET. |
| **6** | DRM-02 | DRM | Master PDF/EPUB originaux exposés en public sur Cloudflare R2 | CRITIQUE | Téléchargement des livres maîtres non protégés sans passer par la plateforme. |
| **7** | SEC-05 | Sécurité | Brute-force illimité sur le code PIN de réinitialisation mot de passe | ÉLEVÉE | Prise de contrôle de n'importe quel compte utilisateur ou administrateur. |
| **8** | SEC-06 | Sécurité | Déni de portefeuille (Denial of Wallet) et DoS mémoire sur le Quiz IA | ÉLEVÉE | Épuisement des crédits OpenAI et saturation synchrone des workers Django. |
| **9** | PERF-01| Perf | Saturation mémoire Redis par stockage de PDF entiers (20-150 Mo) | ÉLEVÉE | Crash OOM de Redis, expulsion brutale des sessions et indisponibilité globale. |
| **10**| PERF-02| Perf | Pénalité de latence systématique Neon (`conn_max_age = 0`) | ÉLEVÉE | 300 à 450 ms de surcharge réseau TLS par requête lors des pics d'affluence. |

---

## 5. Tableau Général des Constats par Axe

| Réf. | Axe | Fichier:Ligne | Description Synthétique | Sévérité | Effort |
| :--- | :---: | :--- | :--- | :---: | :---: |
| **SEC-01** | Sécurité | `config/settings/base.py:200, 225` | Wildcard CORS & CSRF autorisant l'intégralité de `*.vercel.app` avec cookies | CRITIQUE | S |
| **SEC-02** | Sécurité | `config/settings/base.py:9, 306, 345` | Mots de passe Redis, clé de chiffrement et SECRET_KEY en fallback dur | CRITIQUE | S |
| **SEC-03** | Sécurité | `lahatheque-frontend/package.json` | 52 vulnérabilités npm dont 2 failles RCE critiques Next.js et 1 faille PDF.js | CRITIQUE | M |
| **SEC-04** | Sécurité | `apps/protection/views.py:361, 376-425`| BOLA sur `ProtectionConfigViewSet.by_book` (modification DRM sans contrôle de rôle) | CRITIQUE | S |
| **SEC-05** | Sécurité | `apps/accounts/views.py:320-356` | Reset de mot de passe par code PIN 6 chiffres sans limitation de taux ni verrouillage | ÉLEVÉE | S |
| **SEC-06** | Sécurité | `apps/reader/views.py:599-741` | Endpoint Quiz public non authentifié déclenchant lecture complète et appel OpenAI synchrone | ÉLEVÉE | M |
| **SEC-07** | Sécurité | `apps/publishers_portal/publisher_views.py:615, 664` | Parsing XML ONIX 3.0 via `xml.etree` non sécurisé contre les bombes XML / XXE | ÉLEVÉE | S |
| **SEC-08** | Sécurité | `config/settings/base.py:143` | `BLACKLIST_AFTER_ROTATION = False` : refresh tokens réutilisables après rotation | ÉLEVÉE | S |
| **SEC-09** | Sécurité | `apps/commerce/views.py:61-75, 228` | Achat à crédit auto-accordé par les auteurs sans validation administrative préalable | ÉLEVÉE | M |
| **SEC-10** | Sécurité | `apps/protection/source_adapter.py:442` | Risque SSRF par redirection HTTP non re-validée vers le réseau local ou métadonnées | ÉLEVÉE | S |
| **SEC-11** | Sécurité | `lahatheque-frontend/proxy.ts:1-160` | Edge middleware inactif car nommé `proxy.ts` au lieu de `middleware.ts` | MOYENNE | S |
| **SEC-12** | Sécurité | `apps/publishers_portal/publisher_views.py:464, 475` | Upload direct sans assainissement de nom, validation de signature binaire ni antivirus | MOYENNE | M |
| **SEC-13** | Sécurité | `lahatheque-frontend/next.config.ts:57-77` | Absence d'en-tête Content-Security-Policy (CSP) complet côté frontend et backend | MOYENNE | S |
| **SEC-14** | Sécurité | `lahatheque-frontend/app/api/auth/session/route.ts:268` | Endpoint transitoire PATCH /session accepting arbitrary tokens without strict origin check | MOYENNE | S |
| **DRM-01** | DRM | `apps/catalog/stream_views.py:186-195` | Contournement du flux : l'absence d'en-tête Range renvoie le PDF complet d'un bloc | CRITIQUE | S |
| **DRM-02** | DRM | `apps/catalog/storage.py:33, 63-70` | `querystring_auth = False` exposant les livres maîtres originaux en URLs publiques | CRITIQUE | M |
| **DRM-03** | DRM | `apps/protection/lcp_client.py:9-28` | Client LCP EDRLab factice (stubs retournant des clés statiques fictives) | ÉLEVÉE | L |
| **DRM-04** | DRM | `apps/protection/watermark.py:230-245` | Tatouage invisible en clair dans le calque de texte et les métadonnées (facilement strippé) | MOYENNE | M |
| **PERF-01**| Perf | `apps/protection/derived_materializer.py:173` | Stockage direct de binaires PDF (20 à 150 Mo) dans les clés Redis applicatives | ÉLEVÉE | M |
| **PERF-02**| Perf | `config/settings/base.py:100` | `conn_max_age = 0` imposant une négociation TLS PostgreSQL (Neon) à chaque requête | ÉLEVÉE | S |
| **PERF-03**| Perf | `apps/catalog/views.py:37` | Invalidation globale par `cache.clear()` provoquant un Cache Stampede immédiat | ÉLEVÉE | S |
| **PERF-04**| Perf | `lahatheque-frontend/app/api/bff/[...path]/route.ts:157` | Buffering en mémoire Node.js (`arrayBuffer()`) de tous les flux de streaming PDF/audio | ÉLEVÉE | S |
| **PERF-05**| Perf | `apps/catalog/models.py:75` | Absence d'index de base de données sur `Ouvrage.status`, `publication_date`, etc. | MOYENNE | S |
| **PERF-06**| Perf | `apps/protection/views.py:108-356` | Traitement et tri en mémoire Python dans `TraceAccesViewSet.list` | MOYENNE | M |
| **PERF-07**| Perf | `apps/reader/tasks.py:142-148` | Déclenchement asynchrone par `threading.Thread` au lieu des files Celery | MOYENNE | S |
| **SCAL-01**| Scalabilité| `config/settings/base.py:97-105` | Risque de timeout lié au cold-start Neon (scale-to-zero) sur les workers Celery | MOYENNE | S |
| **SCAL-02**| Scalabilité| Inter-apps backend (`protection` <-> `reader` <-> `student`) | Imports circulaires et couplage fort inter-applications bloquant le découpage microservices | MOYENNE | L |
| **SCAL-03**| Scalabilité| `lahatheque-frontend/next.config.ts:51-55` | Proxying direct de `/media/` sans stratégie de segmentation du cache Cloudflare Edge | MOYENNE | M |

---

## 6. Axe 1 — Sécurité Applicative et Infrastructure

### SEC-01 — Wildcard CORS et CSRF sur le domaine partagé Vercel
- **Fichier:Ligne** : `config/settings/base.py:200` et `config/settings/base.py:225`
- **Description** : La configuration autorise l'expression régulière `r"^https://.*\.vercel\.app$"` dans `CORS_ALLOWED_ORIGIN_REGEXES` avec `CORS_ALLOW_CREDENTIALS = True`, tout en inscrivant `"https://*.vercel.app"` dans `CSRF_TRUSTED_ORIGINS`.
- **Impact** : N'importe quel développeur ou pirate publiant une application web sur Vercel (`mon-site-malveillant.vercel.app`) peut exécuter des requêtes AJAX authentifiées (via cookies ou tokens de session) contre l'API LAHAThèque, exfiltrer des données personnelles ou modifier des statuts de commande.
- **Correctif proposé** : Restreindre strictement les origines autorisées aux domaines sous contrôle exclusif de LAHA Éditions :
  ```python
  CORS_ALLOWED_ORIGIN_REGEXES = [
      r"^https://([a-zA-Z0-9-]+\.)?lahatheque\.com$",
      r"^https://lahatheque(-[a-zA-Z0-9-]+)?-lahas-projects\.vercel\.app$",
  ]
  CSRF_TRUSTED_ORIGINS = [
      "https://lahatheque.com",
      "https://www.lahatheque.com",
      "https://api.lahatheque.com",
  ]
  ```
- **Effort** : S

### SEC-02 — Mots de passe Redis et secrets en clair dans les valeurs par défaut
- **Fichier:Ligne** : `config/settings/base.py:9`, `config/settings/base.py:306`, `config/settings/base.py:345`
- **Description** : Des valeurs secrètes de production ou de test sont codées en dur dans les arguments `default` des appels `config(...)` :
  - Ligne 9 : `SECRET_KEY` avec fallback prévisible.
  - Ligne 306 : `FIELD_ENCRYPTION_KEY` par défaut (`0123456789abcdef...`).
  - Ligne 345 : `REDIS_URL` contenant un mot de passe complexe en clair et une adresse IP publique externe.
- **Impact** : En cas d'omission d'une variable d'environnement lors d'un redéploiement, l'instance démarre sur des identifiants compromis, permettant la lecture des champs chiffrés en base et la manipulation des tâches Celery.
- **Correctif proposé** : Supprimer systématiquement les valeurs par défaut pour tout secret en environnement de production. Faire échouer le démarrage si la variable est absente :
  ```python
  REDIS_URL = config('REDIS_URL')
  FIELD_ENCRYPTION_KEY = config('FIELD_ENCRYPTION_KEY')
  SECRET_KEY = config('SECRET_KEY')
  ```
- **Effort** : S

### SEC-03 — Vulnérabilités critiques du frontend Next.js et de la liseuse PDF.js
- **Fichier:Ligne** : `lahatheque-frontend/package.json`
- **Description** : L'audit de sécurité des dépendances (`npm audit`) révèle **52 vulnérabilités** :
  - **Next.js 16.3.0** : Touché par 2 CVEs critiques d'exécution de code à distance (RCE) :
    - *GHSA-2xp9-vwfh-vxw4* : Débordement dans l'optimisation des images AVIF.
    - *GHSA-p293-qw3h-jr36* : Exécution arbitraire sur les environnements Windows.
  - **pdfjs-dist 3.11.174** : Touché par *GHSA-wgrm-67xf-hhpq* permettant l'exécution arbitraire de scripts JavaScript malveillants encapsulés dans les documents PDF lors de leur rendu dans le navigateur de l'étudiant.
- **Impact** : Compromission complète du serveur d'hébergement frontend et exécution de code non sollicité dans les sessions des utilisateurs.
- **Correctif proposé** :
  1. Mettre à jour `next` vers la dernière version de correctif stabilisée.
  2. Mettre à jour `pdfjs-dist` vers la version `>= 4.2.67` ou désactiver `isEvalSupported` et exécuter le worker dans un sandbox strict.
- **Effort** : M

### SEC-04 — BOLA / IDOR sur la configuration DRM des ouvrages
- **Fichier:Ligne** : `apps/protection/views.py:361`, `apps/protection/views.py:376-425`
- **Description** : Dans `ProtectionConfigViewSet`, la classe de permission globale est `[IsAuthenticated]`. L'action personnalisée `@action(detail=False, methods=['get', 'patch'], url_path='by-book/(?P<book_id>[^/.]+)')` ne vérifie ni le rôle de l'utilisateur (`request.user.role`), ni l'appartenance de l'ouvrage à l'éditeur demandeur.
- **Impact** : N'importe quel compte étudiant ou anonyme connecté peut envoyer une requête `PATCH /api/v1/protection/configs/by-book/{book_id}/` avec :
  ```json
  {
    "allow_copy": true,
    "allow_print": true,
    "watermark_enabled": false,
    "lcp_drm_enabled": false,
    "max_allowed_devices": 99
  }
  ```
  et déverrouiller instantanément toutes les restrictions DRM de l'ouvrage ciblé.
- **Correctif proposé** : Remplacer la permission par une permission stricte réservée à l'administrateur et à l'éditeur propriétaire de l'ouvrage :
  ```python
  @action(detail=False, methods=['get', 'patch'], url_path='by-book/(?P<book_id>[^/.]+)', permission_classes=[IsAdminOrPublisherOwner])
  def by_book(self, request, book_id=None):
      ouvrage = get_object_or_404(Ouvrage, id=book_id)
      if request.method.lower() == 'patch':
          if not (request.user.is_staff or (request.user.role == 'publisher' and ouvrage.publisher.user_id == request.user.id)):
              return Response({"success": False, "error": "Accès non autorisé."}, status=status.HTTP_403_FORBIDDEN)
  ```
- **Effort** : S

### SEC-05 — Brute-force sans restriction sur le code de réinitialisation de mot de passe
- **Fichier:Ligne** : `apps/accounts/views.py:320-356`
- **Description** : L'endpoint `ResetPasswordConfirmView` (`POST /api/v1/accounts/reset-password/`) est en accès libre (`AllowAny`). Le code secret généré (`PasswordResetCode`) est un code numérique à 6 chiffres (espace de $10^6$ combinaisons). Aucune classe de limitation de débit (`throttle_classes`), aucun compteur d'essais erronés ni mécanisme d'invalidation après $N$ échecs n'est présent dans la vue.
- **Impact** : Un attaquant automatisé peut émettre 1 million de requêtes POST en quelques minutes via des IP distribuées pour deviner le code PIN d'un compte cible et en changer le mot de passe, contournant intégralement le middleware `Axes` (qui ne surveille que les tentatives d'authentification standard).
- **Correctif proposé** :
  1. Ajouter un champ `attempts = models.PositiveIntegerField(default=0)` sur `PasswordResetCode`.
  2. Incrémenter `attempts` à chaque échec et invalider irrévocablement le code dès que `attempts >= 5`.
  3. Appliquer un throttling dédié : `throttle_classes = [ScopedRateThrottle]` avec un scope `'auth'`.
- **Effort** : S

### SEC-06 — Déni de Portefeuille et Épuisement Mémoire sur le Quiz IA
- **Fichier:Ligne** : `apps/reader/views.py:599-741`
- **Description** : La vue `QuizRetrieveOrGenerateView` (`GET /api/v1/reader/quizzes/?book_id=...`) a `permission_classes = []` (accès public total). Si aucun quiz n'est encore associé au livre, elle exécute de manière synchrone :
  1. `file_bytes = ouvrage.file.read()` : Chargement intégrale du fichier du livre en mémoire vive serveur.
  2. `client.chat.completions.create(model="gpt-4o-mini", ...)` : Requête HTTP sortante bloquante vers OpenAI.
- **Impact** : Un attaquant non authentifié peut itérer sur tous les UUIDs du catalogue. Cela engendre une facture OpenAI exponentielle (Denial of Wallet) et bloque tous les threads applicatifs Django (gunicorn/uvicorn) pendant la génération du quiz (5 à 15 secondes par requête), rendant l'API indisponible.
- **Correctif proposé** :
  1. Restreindre l'endpoint aux utilisateurs disposant d'un droit de lecture actif sur l'ouvrage.
  2. Déporter la génération du quiz dans une tâche Celery asynchrone (`apps/ai_engine/tasks.py`) et renvoyer un statut HTTP 202 `Accepted`.
  3. Mettre en place un rate-limiting agressif sur la génération.
- **Effort** : M

### SEC-07 — Vulnérabilité DoS et XXE lors de l'Import ONIX 3.0
- **Fichier:Ligne** : `apps/publishers_portal/publisher_views.py:615, 629, 664`
- **Description** : L'import des catalogues éditeurs traite les fichiers XML ONIX 3.0 avec le parseur standard de la bibliothèque Python : `import xml.etree.ElementTree as ET`, puis `root = ET.fromstring(raw_bytes)`. De plus, `raw_bytes = uploaded_file.read()` charge l'intégralité du fichier en RAM sans contrôle préalable de taille.
- **Impact** : Vulnérabilité aux attaques d'expansion d'entités récursives (Billion Laughs / XML Entity Expansion) provoquant un crash mémoire instantané du serveur, ainsi qu'aux fuites de fichiers locaux si des DTD externes sont référencées.
- **Correctif proposé** : Remplacer immédiatement `xml.etree.ElementTree` par `defusedxml.ElementTree` et imposer un plafond strict de taille de fichier en amont de la lecture en mémoire.
- **Effort** : S

### SEC-08 — Rotation de jetons SimpleJWT incomplète (Réutilisation possible)
- **Fichier:Ligne** : `config/settings/base.py:143`
- **Description** : La configuration JWT déclare `ROTATE_REFRESH_TOKENS = True`, mais spécifie `BLACKLIST_AFTER_ROTATION = False`.
- **Impact** : Lorsqu'un refresh token est renouvelé, l'ancien token de rafraîchissement demeure valide jusqu'à sa date d'expiration naturelle (7 jours). Si un token est intercepté, l'attaquant peut continuer à générer de nouveaux jetons d'accès en parallèle de la session de la victime.
- **Correctif proposé** : Basculer `BLACKLIST_AFTER_ROTATION = True` et s'assurer que `rest_framework_simplejwt.token_blacklist` est inclus dans `INSTALLED_APPS` avec purge planifiée des tokens expirés via Celery Beat.
- **Effort** : S

### SEC-09 — Auto-Attribution d'Achats à Crédit par les Comptes Auteur
- **Fichier:Ligne** : `apps/commerce/views.py:61-75`, `apps/commerce/views.py:187-190`, `apps/commerce/views.py:228-237`
- **Description** : Lors de la création d'une commande (`CreateOrderView`), si `is_credit_purchase = True`, la seule vérification effectuée est `if request.user.role != 'author'`. La commande est alors immédiatement créée avec `credit_granted_by = request.user` (l'auteur s'octroie lui-même le crédit), et `fulfill_credit_order(commande)` déverrouille sur-le-champ l'accès aux livres numériques et audio dans `ReadingProgress`.
- **Impact** : N'importe quel utilisateur disposant d'un compte rôle "Auteur" peut acquérir gratuitement l'intégralité des ouvrages de la plateforme sans validation administrative ni contrôle de plafond financier.
- **Correctif proposé** : Imposer un statut de validation `credit_status = 'pending_approval'` ; le déverrouillage de l'accès ne doit être opéré qu'après approbation explicite d'un gestionnaire commercial (`role = 'manager'` ou `'admin'`).
- **Effort** : M

### SEC-10 — Risque SSRF par Redirection HTTP Non Re-Validée
- **Fichier:Ligne** : `apps/protection/source_adapter.py:357-450`
- **Description** : La méthode `_validate_ssrf_and_whitelist` inspecte rigoureusement l'adresse IP et le nom d'hôte cible pour bloquer les adresses privées et les métadonnées cloud (`169.254.169.254`). Toutefois, la requête est ensuite exécutée via `requests.get(url, stream=True)`, qui suit par défaut les redirections HTTP (`allow_redirects=True`).
- **Impact** : Un serveur distant partenaire compromis ou malveillant peut répondre par une redirection HTTP 302 vers `http://169.254.169.254/latest/meta-data/` ou une ressource interne du réseau privé de l'hébergeur, contournant la vérification initiale.
- **Correctif proposé** : Désactiver les redirections automatiques (`allow_redirects=False`) ou implémenter un callback de vérification SSRF à chaque saut de redirection.
- **Effort** : S

### SEC-11 — Edge Middleware Inactif Côté Frontend Next.js
- **Fichier:Ligne** : `lahatheque-frontend/proxy.ts:1-160`
- **Description** : Le code de routage sécurisé et de protection des routes d'administration (`/admin`, `/manager`, `/publisher`, etc.) est codé dans un fichier nommé `proxy.ts`. Dans Next.js, le middleware d'Edge Routing doit obligatoirement être situé à la racine du projet sous le nom `middleware.ts`.
- **Impact** : Aucune vérification de route n'est effectuée côté serveur à l'Edge. La protection des tableaux de bord repose exclusivement sur le composant client React `AuthGuard` après que le code HTML/JS a déjà été téléchargé par le navigateur.
- **Correctif proposé** : Renommer `proxy.ts` en `middleware.ts` (ou importer `proxy` dans un `middleware.ts` racine).
- **Effort** : S

---

## 7. Axe 2 — Performance Backend et Frontend

### PERF-01 — Saturation de la Mémoire Vive Redis par les Binaires PDF Dérivés
- **Fichier:Ligne** : `apps/protection/derived_materializer.py:173-177`
- **Description** : Lorsqu'un dérivé filigrané est matérialisé pour un utilisateur, l'intégralité du binaire PDF est enregistrée dans le cache Redis :
  ```python
  django_cache.set(redis_cache_key, watermarked, timeout=7200)
  ```
- **Impact** : Un manuel universitaire pèse fréquemment entre 20 et 100 Mo. 50 étudiants ouvrant simultanément des ouvrages distincts consomment entre 1 et 5 Go de mémoire vive dans Redis. Cela déclenche la politique d'éviction de Redis (`maxmemory-policy`), éjectant prématurément les sessions d'authentification et les limites de taux (throttles), ou provoquant un plantage OOM (Out Of Memory) du serveur Redis.
- **Correctif proposé** :
  1. Stocker les dérivés filigranés sur un volume de stockage de fichiers temporaires éphémère chiffré (`DRM_DERIVED_CACHE_DIR`) ou sur un bucket Cloudflare R2 dédié à TTL court.
  2. Ne conserver dans Redis que les métadonnées légères : clé SHA-256, chemin du fichier dérivé, taille et statut de génération.
- **Effort** : M

### PERF-02 — Latence Systématique de Connexion Neon (`conn_max_age = 0`)
- **Fichier:Ligne** : `config/settings/base.py:100`
- **Description** : La configuration de la base de données spécifie `conn_max_age = 0` :
  ```python
  DATABASES = {
      'default': dj_database_url.config(
          ...,
          conn_max_age=0,
          ssl_require=True,
      )
  }
  ```
  Django ferme et détruit donc la connexion TCP/SSL à la fin de chaque cycle de requête HTTP.
- **Impact** : Le cluster PostgreSQL Neon est hébergé en Virginie (`us-east-2.aws.neon.tech`). Chaque requête HTTP impose un aller-retour TCP complet (RTT), une négociation TLS 1.3 et une authentification PostgreSQL, ajoutant **300 à 450 ms de latence incompressible par requête**, rendant l'application anormalement lente pour les utilisateurs sur le continent africain ou européen.
- **Correctif proposé** :
  1. Utiliser le pooler de transaction Neon (port 6543 / PgBouncer).
  2. Définir `conn_max_age = 300` ou `600` pour recycler les connexions TCP/TLS établies entre requêtes successives des workers.
- **Effort** : S

### PERF-03 — Invalidation Brutale du Cache Catalogue (Cache Stampede)
- **Fichier:Ligne** : `apps/catalog/views.py:29-44`
- **Description** : La fonction d'invalidation appelée lors de la publication d'un livre ou de la mise à jour d'un tarif effectue :
  ```python
  def invalidate_catalog_cache():
      cache.clear()
  ```
- **Impact** : `cache.clear()` vide intégralement la base de données Redis numéro 2, détruisant non seulement le cache du catalogue, mais également tous les verrous distribués, les throttles et les sessions temporaires. L'ensemble des requêtes concurrentes suivantes heurte directement la base PostgreSQL Neon simultanément (phénomène de *Thundering Herd* / *Cache Stampede*).
- **Correctif proposé** : Supprimer l'appel à `cache.clear()`. Utiliser l'incrémentation de version de cache déjà présente (`catalog_cache_version`), qui rend les anciennes clés orphelines sans détruire le reste du cache.
- **Effort** : S

### PERF-04 — Buffering Intégral en Mémoire des Fichiers dans le BFF Next.js
- **Fichier:Ligne** : `lahatheque-frontend/app/api/bff/[...path]/route.ts:157-186`
- **Description** : Lors du streaming d'un document protégé (PDF, audio, vidéo), la route proxy BFF exécute :
  ```typescript
  const arrayBuf = await backendRes.arrayBuffer()
  return new Response(arrayBuf, { headers: forwardHeaders })
  ```
- **Impact** : Le proxy Next.js télécharge et stocke la totalité du fichier binaire dans la mémoire tas (heap) de Node.js avant de commencer à le transmettre au client. Lors de lectures simultanées, la mémoire du processus Node.js sature rapidement, provoquant des lenteurs majeures ou des redémarrages de conteneur.
- **Correctif proposé** : Relayer directement le flux sans matérialisation intermédiaire via `ReadableStream` :
  ```typescript
  return new Response(backendRes.body, {
    status: backendRes.status,
    headers: forwardHeaders,
  })
  ```
- **Effort** : S

### PERF-05 — Absence d'Index PostgreSQL sur les Champs de Filtrage Clés
- **Fichier:Ligne** : `apps/catalog/models.py:75`
- **Description** : Le modèle `Ouvrage` définit son champ de statut sous la forme :
  ```python
  status = models.CharField(max_length=30, default='draft')
  ```
  Le champ n'a ni `db_index=True`, ni index composite dans `Meta.indexes`.
- **Impact** : La totalité des requêtes du catalogue public (`Ouvrage.objects.filter(status='published')`) réalise un balayage séquentiel complet (*Seq Scan*) de la table PostgreSQL. Lorsque la table grandit, les temps de réponse se dégradent linéairement.
- **Correctif proposé** : Ajouter un index B-Tree sur `status`, ainsi qu'un index composite `indexes = [models.Index(fields=['status', '-created_at'])]`.
- **Effort** : S

---

## 8. Axe 3 — Scalabilité et Résilience

### SCAL-01 — Résilience du Pool Neon et Risque de Cold-Start
- **Fichier:Ligne** : `config/settings/base.py:97-105`
- **Description** : Les bases Neon serverless suspendent automatiquement leurs instances de calcul (*scale-to-zero*) après une période d'inactivité (5 minutes par défaut sur les plans standards).
- **Impact** : Lors du déclenchement d'un job planifié (Celery Beat à minuit) ou de la première visite matinale, le réveil du compute Neon engendre un délai de démarrage à froid (*cold start*) de 1,5 à 3 secondes. Si le timeout du client Django ou PgBouncer est configuré trop court, la tâche échoue.
- **Correctif proposé** :
  1. Activer une tâche de heartbeat (ping SQL léger toutes les 4 minutes) pour maintenir le compute chaud si le scale-to-zero n'est pas désiré en production.
  2. Veiller à ce que `CONN_HEALTH_CHECKS = True` (déjà en place) soit complété par des timeouts Celery tolérant 5 secondes sur les reconnexions.
- **Effort** : S

### SCAL-02 — Couplage Fort et Imports Circulaires Inter-Applications
- **Fichier:Ligne** : Multiples fichiers (notamment `apps/protection/views.py:131`, `apps/commerce/services.py:13`)
- **Description** : Des imports de modèles inter-domaines sont réalisés à l'intérieur même du corps des méthodes (ex. `protection` important directement `reader.models`, `student.models`, `partners.models`).
- **Impact** : Les 13 applications partagent le même schéma relationnel de manière fortement couplée. Une modification du modèle de progression étudiant peut casser indirectement la sérialisation des traces DRM. Ce couplage interdit à court terme toute dissociation d'une brique critique (ex. isoler le moteur DRM sur un service dédié haute performance).
- **Correctif proposé** : Introduire une couche de médiation formelle (Services de domaine purs et signaux / événements asynchrones) pour découpler la gestion des droits, la facturation et le DRM.
- **Effort** : L

---

## 9. Dossier Spécial : Risques DRM, Anti-Piratage et Fuites de Données

Le modèle économique de LAHAThèque repose sur la confiance accordée par les maisons d'édition et les auteurs universitaires. L'audit a porté une attention chirurgicale à l'étanchéité de la chaîne de protection.

### 9.1 Faille Majeure d'Exposition Directe des Livres Originaux sur Cloudflare R2
- **Fichier:Ligne** : `apps/catalog/storage.py:33, 63-70`
- **Constat** :
  ```python
  querystring_auth = False
  ...
  def url(self, name, parameters=None, expire=None, http_method=None):
      if self.custom_domain:
          return f"https://{self.custom_domain.rstrip('/')}/{str(name).lstrip('/')}"
  ```
- **Risque** : `querystring_auth = False` génère des URLs sans signature cryptographique expirante. Si le domaine public du bucket R2 (`CLOUDFLARE_R2_PUBLIC_DOMAIN`) est accessible publiquement, n'importe quelle personne connaissant ou énumérant les identifiants de livres peut télécharger le PDF original maître, vierge de tout filigrane et non chiffré.
- **Remédiation** : Verrouiller le bucket Cloudflare R2 en mode totalement privé. Désactiver le domaine public sur le bucket des ouvrages de production (`laha-books-production`). Utiliser exclusivement des requêtes pré-signées ou un accès serveur IAM strict.

### 9.2 Contournement du Streaming par Requête Standard (Omission du Range)
- **Fichier:Ligne** : `apps/catalog/stream_views.py:186-195` et `apps/reader/views.py:955-958`
- **Constat** :
  ```python
  range_header = request.META.get("HTTP_RANGE")
  if not range_header:
      # Requête standard sans Range: servir le document complet
      response = HttpResponse(pdf_bytes, status=status.HTTP_200_OK, content_type="application/pdf")
      response["Content-Length"] = str(total_size)
      return response
  ```
- **Risque** : Alors que la documentation d'architecture stipule que le fichier est diffusé exclusivement par petits fragments de 256 Kio, une simple requête sans en-tête `Range` :
  ```bash
  curl -H "Authorization: Bearer <token>" https://api.lahatheque.com/api/v1/catalog/books/<id>/stream/ -o livre.pdf
  ```
  télécharge instantanément le livre entier en une seule réponse HTTP 200.
- **Remédiation** : Rendre l'en-tête `Range` obligatoire. Rejeter toute requête ne spécifiant pas de plage par un statut HTTP 416 (*Range Not Satisfiable*).

### 9.3 Faiblesse de la Stéganographie et Fuite de Données Personnelles (RGPD / Vie Privée)
- **Fichier:Ligne** : `apps/protection/watermark.py:230-245`
- **Constat** : Le "tatouage invisible" consiste à injecter du texte brut dans le document à la taille de police 1 avec une opacité de 0.001 :
  ```python
  page.insert_text(
      fitz.Point(1, page_height - 1),
      f"LTQ:{invisible_payload}",
      fontsize=1,
      color=(1.0, 1.0, 1.0),
      fill_opacity=0.001
  )
  metadata["keywords"] = f"... LTQ_SIG:{hashlib.sha256(invisible_payload.encode()).hexdigest()}"
  ```
- **Risque** :
  1. Ce texte est présent en clair dans le flux du PDF. N'importe quel extracteur de texte (`pdftotext`, `strings`, inspecteur de code) lit directement l'adresse email, l'IP et l'identifiant de l'utilisateur.
  2. Si le document circule légitimement (ex. partage de travail entre étudiants), les données personnelles (email, IP) de l'acheteur initial sont divulguées en clair.
  3. Un script de 3 lignes utilisant `qpdf` ou `PyMuPDF` peut supprimer instantanément ces éléments de texte sans altérer le contenu visuel du livre.
- **Remédiation** :
  1. Chiffrer systématiquement le payload forensique avec une clé symétrique AES serveur avant injection.
  2. Utiliser un tatouage stéganographique robuste (micro-perturbations dans les espaces inter-mots ou dans la trame vectorielle des polices) résistant aux outils de nettoyage PDF.

### 9.4 Réalité du Serveur LCP
- **Fichier:Ligne** : `apps/protection/lcp_client.py:9-28`
- **Constat** : Le serveur LCP externe `edrlab/lcp-server` n'est pas intégré. Les endpoints `/licenses` renvoient des données bouchonnées.
- **Recommandation** : Si le contrat et la conformité EDRLab constituent une exigence contractuelle d'éditeurs tiers, programmer le chantier d'intégration réelle du protocole Readium LCP v2. Si la décision a été prise de privilégier le streaming Range web in-house, documenter formellement l'abandon de LCP pour supprimer toute ambiguïté contractuelle et juridique.

---

## 10. Feuille de Route Priorisée des Correctifs

### Phase 1 : Correctifs Immédiats de Sécurité (Semaine 1 — Quick Wins)
- [ ] **SEC-01** : Corriger la regex CORS et CSRF Vercel dans `config/settings/base.py`.
- [ ] **SEC-02** : Nettoyer les secrets en dur dans les `default` de `config/settings/base.py`.
- [ ] **SEC-04** : Sécuriser la vue `ProtectionConfigViewSet.by_book` avec des permissions de rôle strictes.
- [ ] **DRM-01** : Bloquer le téléchargement direct HTTP 200 sur `/stream/` (exiger Range HTTP 206).
- [ ] **SEC-05** : Ajouter limitation de taux et verrouillage sur `ResetPasswordConfirmView`.
- [ ] **SEC-08** : Activer `BLACKLIST_AFTER_ROTATION = True` dans la configuration JWT.
- [ ] **SEC-11** : Activer l'Edge Middleware Next.js en renommant `proxy.ts` en `middleware.ts`.
- [ ] **PERF-03**: Retirer `cache.clear()` de la fonction `invalidate_catalog_cache()`.

### Phase 2 : Durcissement DRM, Protection et Flux Commerce (Semaines 2–3)
- [ ] **DRM-02** : Verrouiller le bucket Cloudflare R2 en mode totalement privé.
- [ ] **SEC-06** : Sécuriser et asynchroniser la génération de quiz IA (`QuizRetrieveOrGenerateView`).
- [ ] **SEC-07** : Remplacer `xml.etree` par `defusedxml` pour l'import ONIX 3.0.
- [ ] **SEC-09** : Soumettre les achats à crédit des auteurs à une validation administrative préalable.
- [ ] **SEC-10** : Bloquer les redirections HTTP non contrôlées dans `source_adapter.py`.
- [ ] **DRM-04** : Chiffrer les données du tatouage forensique dans `watermark.py`.

### Phase 3 : Optimisation Performance et Scalabilité (Semaines 4–5)
- [ ] **PERF-01**: Cesser de stocker les PDF entiers dans Redis ; basculer sur un stockage de dérivés sur disque/R2 temporaire.
- [ ] **PERF-02**: Configurer `conn_max_age = 300` sur le pooler de transaction Neon.
- [ ] **PERF-04**: Remplacer `arrayBuffer()` par un pipe de flux `ReadableStream` dans le BFF Next.js.
- [ ] **PERF-05**: Ajouter les index de base de données manquants sur `Ouvrage` et `Order`.
- [ ] **PERF-06**: Réécrire l'agrégation de `TraceAccesViewSet.list` en requêtes SQL paginées.
- [ ] **SEC-03** : Mettre à jour `next` et `pdfjs-dist` pour solder les vulnérabilités npm.

### Phase 4 : Chantiers de Fond et Évolution Architecturale (Mois 2–3)
- [ ] **SCAL-02**: Découpler formellement les domaines applicatifs (`protection`, `reader`, `student`).
- [ ] **DRM-03** : Statuer définitivement sur l'intégration ou le retrait du client LCP EDRLab.
- [ ] **SEC-13** : Mettre en place une politique CSP (*Content-Security-Policy*) stricte.

---

## 11. Commandes et Outils Recommandés pour la CI/CD

Pour maintenir ce niveau d'exigence et prévenir toute régression, il est recommandé d'intégrer dans le pipeline d'intégration continue (GitHub Actions ou script de build) les outils suivants :

### 11.1 Audit de Sécurité Statique Python (Backend)
```bash
# Installation des outils d'audit statique et de dépendances
pip install bandit pip-audit ruff

# Analyse des failles de sécurité dans le code Python (avec exclusion des répertoires de test)
bandit -r lahatheque-backend/apps lahatheque-backend/config -x "*/tests/*" -ll

# Audit des vulnérabilités connues dans les paquets Python installés
pip-audit

# Linter rapide de qualité et cohérence
ruff check lahatheque-backend/
```

### 11.2 Audit de Sécurité Frontend (Next.js)
```bash
cd lahatheque-frontend

# Détection des failles dans les dépendances Node.js
npm audit

# Correction automatique des dépendances compatibles sans breaking change
npm audit fix
```

---

*Fin du rapport d'audit technique — LAHAThèque v3.2.*
