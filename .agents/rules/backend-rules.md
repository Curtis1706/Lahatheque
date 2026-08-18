# 🐍 Règles de Développement & d'Architecture Backend (Django & DRF)

Ce document constitue la référence des règles d'ingénierie, de sécurité et d'architecture pour tout le développement backend sur **LAHAThèque** (Python 3.12+ & Django REST Framework).

---

## 📜 1. Prérequis Absolus : Cahier des Charges, Documentation & Analyse Critique

Avant toute conception, modification de code ou implémentation d'un endpoint :

1. **Lecture Systématique du Cahier des Charges** :
   - Consulter obligatoirement `cahier_des_charges.txt` et les spécifications de LAHAThèque v3.2.
   - Croiser les attentes métier (tarifs, commissions universités 15%, droits d'auteurs, DRM, rôles utilisateurs) avec l'architecture technique.
2. **Consultation des Documentations Officielles en Ligne** :
   - Se référer systématiquement à la documentation officielle des librairies utilisées (Django, DRF, `django-cors-headers`, `django-oauth-toolkit`, Cloudflare R2, Celery, etc.).
3. **Penser à tous les Non-Dits & Cas Limites** :
   - Anticiper les états dégradés, timeouts réseau, pertes de connexion, accès concurrents, dépassements de quotas, données corrompues et tentatives d'injection.
4. **Matrice Décisionnelle Systématique** :
   - Pour chaque fonctionnalité, évaluer explicitement : **Inconvénients**, **Avantages**, **Solution Recommandée** et **Pensée Scalabilité** (performances sous fort trafic, charge base de données, volume de fichiers).

---

## 🎭 2. Rôle & Principes d'Ingénierie (Lead Backend Architect)

- **Déterminisme & Zéro Régression** : Chaque point d'entrée API doit avoir des entrées/sorties strictement typées et validées.
- **Sécurité Sans Compromis** : Aucun fichier PDF/EPUB brut exposé, aucun token sensible dans le corps JSON, isolation totale multi-tenant.
- **Performance ORM & Scalabilité** : Zéro requête SQL N+1, indexation ciblée sur les colonnes de filtrage, utilisation intensive de `select_related` et `prefetch_related`.
- **Traçabilité & Audit Immuable** : Journalisation légale systématique via le modèle `TraceAcces`.

---

## 🐍 3. Règles Strictes de Développement Python & Django REST Framework

### 3.1. Standard PEP 8 & Typage Statique Obligatoire
- Utiliser **Python 3.12+**.
- Déclarer des `Type Hints` stricts sur **tous** les arguments et valeurs de retour de fonctions, méthodes de modèles, managers, serializers et vues.

### 3.2. Format de Réponse API Unifié (Règle d'Or Absolue)
Toutes les réponses JSON renvoyées par l'API (succès comme échec) doivent suivre **strictement** cette structure :
```json
{
  "success": true, // ou false en cas d'erreur
  "data": {},      // Payload de données (dictionnaire/liste ou {} si échec)
  "error": null    // Message d'erreur textuel explicite en cas d'échec, sinon null
}
```

### 3.3. Codes Statuts HTTP REST
- `200 OK` : Succès de lecture ou de mise à jour.
- `201 CREATED` : Ressource créée.
- `204 NO CONTENT` : Suppression réussie sans corps.
- `400 BAD REQUEST` : Validation serializer échouée.
- `401 UNAUTHORIZED` : Non authentifié ou token invalide/expiré.
- `403 FORBIDDEN` : Droits insuffisants.
- `404 NOT FOUND` : Ressource inexistante.
- `409 CONFLICT` : Violation d'unicité logique ou conflit d'état.
- `422 UNPROCESSABLE ENTITY` : Données sémantiquement erronées (ex: origine de redirection non autorisée).
- `429 TOO MANY REQUESTS` : Quota dépassé (rate limiting/throttling).
- `500 INTERNAL SERVER ERROR` : Erreur interne journalisée (`logger.exception`).

### 3.4. Gestion des Exceptions & Logging Structuré
- Proscrire les `except Exception:` génériques silencieux.
- Journaliser toute anomalie avec `logger = logging.getLogger(__name__)` et `logger.exception(...)`.

---

## 🗄️ 4. Modélisation, Base de Données & Optimisations ORM

1. **Clés Primaires & Traçabilité** : Utiliser `id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)`, avec `created_at` et `updated_at`.
2. **Indexation & Intégrité** :
   - `db_index=True` sur tous les champs de filtrage fréquent (`status`, `country`, `isbn`).
   - Contraintes explicites dans `Meta.constraints` (`UniqueConstraint`, `CheckConstraint`).
3. **Éradication des Requêtes N+1** :
   - `select_related(*fields)` : Obligatoire pour relations directes `ForeignKey` / `OneToOneField`.
   - `prefetch_related(*lookups)` : Obligatoire pour relations inverses et `ManyToManyField`.
   - `only(*fields)` / `defer(*fields)` : Pour les requêtes volumineuses.
4. **Transactions Atomiques** : Encadrer avec `@transaction.atomic` toute opération multi-tables ou transaction financière/redevance.

---

## 🛡️ 5. Serializers DRF & Validation Métier

1. **Interdiction de `fields = '__all__'`** : Déclarer explicitement chaque champ exposé.
2. **Protection des Champs** : Définir les champs immuables dans `read_only_fields`.
3. **Validation à Deux Niveaux** :
   - Unitaire : `validate_<nom_champ>(self, value)`.
   - Croisée : `validate(self, attrs)` avec levée de `serializers.ValidationError("Message clair")`.
4. **Découplage des Serializers** : Séparer les serializers de lecture (`ListSerializer`, `DetailSerializer`) et d'écriture (`CreateUpdateSerializer`).

---

## 🔐 6. Configuration Réseau, Sécurité CORS, CSRF & Cookies

### 6.1. Configuration `settings.py`
- `CORS_ALLOW_CREDENTIALS = True` pour autoriser le transit des cookies sécurisés.
- `CORS_ALLOWED_ORIGINS` & `CSRF_TRUSTED_ORIGINS` restreints aux domaines clients (ex: `http://localhost:3000`, `https://lahatheque.com`).
- `CorsMiddleware` placé en **tout premier** dans la liste des `MIDDLEWARE`.

### 6.2. Sécurité des Cookies de Session & CSRF
- **Session** : `SESSION_COOKIE_HTTPONLY = True`, `SESSION_COOKIE_SAMESITE = 'Lax'`, `SESSION_COOKIE_SECURE = True` (en HTTPS/Prod).
- **CSRF** : `CSRF_COOKIE_HTTPONLY = False` (lisible pour injection dans l'en-tête `X-CSRFToken`), `CSRF_COOKIE_SAMESITE = 'Lax'`, `CSRF_COOKIE_SECURE = True` (en Prod).
- **Web App Utilisateur** : Aucun token JWT exposé dans le corps JSON ; stockage exclusif dans un cookie `HttpOnly`.

### 6.3. Authentification Partenaires / Machines
- OAuth2 Client Credentials (`POST /api/v1/oauth2/token/`) avec scopes vérifiés (`reader:sessions`, `catalog:read`).

---

## 📦 7. Sécurité des Fichiers, Streaming Proxy & DRM

1. **Stockage Cloudflare R2 Privé** : `querystring_auth=True`. Aucune URL R2 brute exposée au navigateur.
2. **Streaming Fragmenté (Range Requests)** : Unique point d'accès via le proxy Django (`HTTP_RANGE` → `206 Partial Content`).
3. **Téléchargement & Impression STRICTEMENT INTERDITS** : Bloqués par l'API et la configuration DRM.
4. **Filigrane Dynamique** : Tatouage avec `external_user_name`, IP et horodatage (`ProtectionConfig`).
5. **Audit Légal `TraceAcces`** : Journalisation immuable de chaque ouverture, stream et page lue.

---

## 📡 8. Système de Webhooks Asynchrones & Idempotence

1. **Envoi Asynchrone** : Tâches Celery avec retry exponentiel (5 tentatives).
2. **En-têtes de Sécurité & Signature** :
   - `X-Lahatheque-Event` : Type d'événement (`reader.progress.updated`, `reader.quiz.completed`, `reader.session.finished`).
   - `X-Lahatheque-Delivery` : UUID unique `event_id` pour déduplication côté client.
   - `X-Lahatheque-Signature` : Signature HMAC-SHA256(`webhook_secret`, `t.payload`).
3. **Journalisation** : Sauvegarde des statuts de livraison dans `WebhookLog`.
