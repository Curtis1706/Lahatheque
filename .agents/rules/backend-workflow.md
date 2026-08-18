# 🔄 Workflow de Développement Backend & Bibliothèque de Prompts (Django REST Framework)

Ce document décrit la méthodologie rigoureuse étape par étape pour concevoir, développer, tester et optimiser chaque fonctionnalité backend sur **LAHAThèque**, ainsi que la bibliothèque complète de prompts d'ingénierie.

---

## 📑 Sommaire

1. [🧭 Méthodologie d'Ingénierie & Analyse Préalable](#1-méthodologie-dingénierie--analyse-préalable)
2. [🔄 Workflow Backend Étape par Étape (Étapes 0 à 7)](#2-workflow-backend-étape-par-étape-étapes-0-à-7)
   - [Étape 0 : Analyse Métier, Documentation & Non-Dits](#étape-0--analyse-métier-documentation--non-dits)
   - [Étape 1 : Spécification Technique & Contrat JSON](#étape-1--spécification-technique--contrat-json)
   - [Étape 2 : Modélisation des Données & Migrations](#étape-2--modélisation-des-données--migrations)
   - [Étape 3 : Serializers DRF & Validation](#étape-3--serializers-drf--validation)
   - [Étape 4 : Vues API, Permissions & Routage](#étape-4--vues-api-permissions--routage)
   - [Étape 5 : Configuration Réseau, CORS & Sécurité des Cookies](#étape-5--configuration-réseau-cors--sécurité-des-cookies)
   - [Étape 6 : Optimisation ORM & Élimination N+1](#étape-6--optimisation-orm--élimination-n1)
   - [Étape 7 : Tests Pytest & Validation](#étape-7--tests-pytest--validation)
3. [🤖 Bibliothèque de Prompts Opérationnels Backend & API](#3-bibliothèque-de-prompts-opérationnels-backend--api)

---

## 🧭 1. Méthodologie d'Ingénierie & Analyse Préalable

Pour chaque tâche backend, l'ingénieur doit obligatoirement respecter ces 5 piliers :

1. **Lecture du Cahier des Charges** : Vérifier la cohérence avec `cahier_des_charges.txt` (rôles, commissions, droits, DRM, redevances).
2. **Documentation en Ligne** : Consulter la documentation officielle des briques techniques sollicitées (DRF, PostgreSQL, Cloudflare R2, Celery, Redis).
3. **Traque des Non-Dits & Corner Cases** : Identifier les angles morts (concurrence d'accès, déconnexions, timeouts, données manquantes, tentatives de contournement).
4. **Matrice Décisionnelle** : Comparer systématiquement **Avantages**, **Inconvénients**, et motiver la **Solution Recommandée**.
5. **Pensée Scalabilité** : Anticiper la montée en charge (milliers d'ouvrages, millions de traces d'accès, indexation, partitionnement, cache Redis).

---

## 🔄 2. Workflow Backend Étape par Étape (Étapes 0 à 7)

### Étape 0 : Analyse Métier, Documentation & Non-Dits
- Lire la section concernée du cahier des charges.
- Rédiger une note de cadrage synthétique comprenant :
  - *Non-dits identifiés*
  - *Inconvénients & Avantages des approches possibles*
  - *Solution technique recommandée*
  - *Stratégie de scalabilité*

### Étape 1 : Spécification Technique & Contrat JSON
- Définir les endpoints HTTP REST (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
- Définir le schéma JSON d'entrée et de sortie sous le format unifié obligatoire :
  ```json
  {
    "success": true,
    "data": {},
    "error": null
  }
  ```

### Étape 2 : Modélisation des Données & Migrations
- Créer ou modifier les modèles Django dans l'application concernée (`apps/*`).
- Utiliser `id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)`.
- Ajouter `created_at`, `updated_at`, les indexes `db_index=True` et contraintes `UniqueConstraint` / `CheckConstraint`.
- Exécuter `python manage.py makemigrations` et `python manage.py migrate`.

### Étape 3 : Serializers DRF & Validation
- Créer les serializers avec déclaration explicite de `fields = [...]` (aucun `__all__`).
- Définir les `read_only_fields`.
- Implémenter les méthodes `validate_<champ>` et `validate(self, attrs)`.

### Étape 4 : Vues API, Permissions & Routage
- Créer les vues (`APIView` ou `ViewSet`).
- Assigner les classes de permissions (`IsAuthenticated`, `IsValidReaderSession`, `IsPartnerApp`).
- Encadrer la logique dans des blocs `try/except` avec logging `logger.exception` et codes statuts HTTP appropriés.
- Déclarer les routes dans `urls.py`.

### Étape 5 : Configuration Réseau, CORS & Sécurité des Cookies
- Vérifier `CORS_ALLOWED_ORIGINS` et `CORS_ALLOW_CREDENTIALS = True` dans `settings.py`.
- Configurer les cookies de session et CSRF (`SESSION_COOKIE_HTTPONLY = True`, `SameSite='Lax'`).
- Si applicable, configurer les rewrites proxy frontend (`next.config.mjs`) vers l'API Django.

### Étape 6 : Optimisation ORM & Élimination N+1
- Auditer le queryset avec `select_related()` (clés directes) et `prefetch_related()` (relations multiples/inverses).
- Encadrer les mutations multi-tables ou flux financiers dans `@transaction.atomic`.

### Étape 7 : Tests Pytest & Validation
- Écrire les tests d'intégration dans `tests/` avec `pytest-django`.
- Valider le cas nominal (200/201), les cas d'erreur de validation (400) et de sécurité (401/403).
- Vérifier l'assertion du format JSON : `assert response.json()["success"] is True`.

---

## 🤖 3. Bibliothèque de Prompts Opérationnels Backend & API

---

### 📌 Prompt 1 : Analyse Métier, Non-Dits & Scalabilité
```text
Tu es Lead Backend Architect. Avant d'implémenter la fonctionnalité `[nom_feature]`, effectue une analyse d'ingénierie complète :
1. Réfère-toi au cahier des charges LAHAThèque (`cahier_des_charges.txt`).
2. Liste tous les NON-DITS, cas limites et scénarios d'erreurs (concurrence, quotas, timeouts).
3. Dresse une matrice comparative : Inconvénients vs Avantages des différentes approches.
4. Décris la Solution Recommandée et la Stratégie de Scalabilité (indexation, partitionnement, cache).
```

---

### 📌 Prompt 2 : Modélisation & Migrations Django
```text
Crée les modèles Django pour l'application `[nom_app]` représentant : `[liste_entites]`.
Exigences :
1. Clé primaire `UUIDField`, horodatage `created_at` / `updated_at`.
2. Respect strict de PEP 8 et Type Hints complets sur toutes les méthodes.
3. Indexes sur filtres fréquents (`db_index=True`) et contraintes `Meta.constraints`.
4. Méthode `__str__` typée et `ordering = ['-created_at']`.
5. Code complet sans placeholders.
```

---

### 📌 Prompt 3 : Serializers DRF & Validation Métier
```text
Rédige les serializers DRF (`ModelSerializer`) pour les modèles `[nom_modeles]`.
Exigences :
1. Déclaration explicite de tous les champs dans `fields` (interdiction de '__all__').
2. `read_only_fields` définis pour les champs non modifiables.
3. Validation unitaire `validate_<field>` et croisée `validate(self, attrs)` avec `serializers.ValidationError`.
4. `SerializerMethodField` typés et Type Hints complets.
```

---

### 📌 Prompt 4 : Vues API Unifiées
```text
Implémente la vue DRF (APIView ou ViewSet) pour : `[description_feature]`.
Exigences :
1. Réponse JSON obligatoire : { "success": true/false, "data": {}, "error": null/"message" }.
2. Blocs try/except avec logging structuré (`logger.exception`) et codes HTTP adaptés (200, 201, 400, 403, 404, 500).
3. Permissions explicites (`permission_classes = [IsAuthenticated, ...]`).
4. Queryset optimisé avec `select_related`/`prefetch_related`.
```

---

### 📌 Prompt 5 : Configuration CORS, CSRF & Cookies Sécurisés
```text
Configure `settings.py` de Django pour communiquer en toute sécurité avec un frontend Next.js (`http://localhost:3000` et prod).
Exigences :
1. `django-cors-headers` avec `CORS_ALLOW_CREDENTIALS = True`, `CORS_ALLOWED_ORIGINS` et `CSRF_TRUSTED_ORIGINS`.
2. Cookies : `SESSION_COOKIE_HTTPONLY = True`, `SESSION_COOKIE_SAMESITE = 'Lax'`, `CSRF_COOKIE_HTTPONLY = False`.
3. Distinction Dev (HTTP) et Prod (HTTPS, `SESSION_COOKIE_SECURE = True`).
4. Code Python complet avec commentaires explicatifs.
```

---

### 📌 Prompt 6 : Custom Exception Handler Global
```text
Écris le `custom_exception_handler(exc, context)` pour DRF dans `common/exceptions.py`.
Exigences :
1. Intercepte 400, 401, 403, 404, 429 et 500.
2. Aplanit les erreurs de validation DRF imbriquées en un message texte lisible.
3. Retourne systématiquement : { "success": false, "data": {}, "error": "Message clair" }.
4. Journalise les erreurs 500 avec stacktrace complète (`logger.error(..., exc_info=True)`).
```

---

### 📌 Prompt 7 : Optimisation ORM & Éradication Requêtes N+1
```text
Analyse et optimise le queryset / la vue Django suivante :
`[Code du Queryset/Vue]`
Exigences :
1. Identifie et élimine les requêtes N+1 avec `select_related`, `prefetch_related`, `only`, `annotate`.
2. Encadre les mutations dans `@transaction.atomic`.
3. Conserve la structure de réponse { "success": true, "data": {}, "error": null }.
4. Explique l'impact chiffré sur les requêtes SQL et la performance.
```

---

### 📌 Prompt 8 : Streaming Sécurisé de Documents & Audio (Range Requests)
```text
Implémente la vue Django de streaming sécurisé `DocumentProxyView` pour servir des fichiers Cloudflare R2.
Exigences :
1. Protégée par `IsValidReaderSession` ; URL R2 brute jamais exposée.
2. Support complet des Range Requests (`Range: bytes=start-end`) avec retour `206 Partial Content`.
3. Téléchargement et impression strictement bloqués (DRM).
4. Journalisation de chaque accès dans `TraceAcces`.
```

---

### 📌 Prompt 9 : Émetteur de Webhooks Signés HMAC-SHA256
```text
Crée le service d'émission de webhooks asynchrones pour `[application]`.
Exigences :
1. Tâche Celery `send_partner_webhook` avec retries (5 tentatives, backoff exponentiel).
2. En-têtes : `X-Lahatheque-Event`, `X-Lahatheque-Delivery` (UUID idempotence), `X-Lahatheque-Signature` (HMAC-SHA256).
3. Sauvegarde du statut dans `WebhookLog`.
```

---

### 📌 Prompt 10 : Tests Pytest d'Intégration
```text
Rédige la suite de tests d'intégration avec `pytest-django` pour l'endpoint `[URL_ou_Vue]`.
Exigences :
1. Couvre cas nominal (200/201), erreurs de validation (400) et sécurité (401/403).
2. Vérifie la structure JSON unifiée : `assert response.json()["success"] is True/False` et clés `data`/`error`.
3. Utilise des fixtures Pytest modulaires (`db`, `api_client`, factories).
```
