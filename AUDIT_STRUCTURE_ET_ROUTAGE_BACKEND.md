# Audit de Structure et Routage Backend Django — LAHAThèque v3.2

**Date d'audit** : 9 août 2026  
**Projet concerné** : `lahatheque-backend` (`c:\Lahathèque\lahatheque-backend`)

---

## 1. Vue d'Ensemble & Structure des Applications Django

### Points Conformes aux Exigences Django :
- **Architecture modulaire dans `apps/`** : Les 10 applications métier (`accounts`, `catalog`, `commerce`, `protection`, `publishers_portal`, `rights`, `partners`, `audio`, `ai_engine`, `reporting`) sont regroupées au sein du répertoire `apps/`.
- **Déclaration `AppConfig` conforme** : Chaque fichier `apps/<app_name>/apps.py` déclare un attribut `name` avec son chemin complet (ex: `name = 'apps.catalog'`). C'est l'exigence Django lorsque les applications résident dans un sous-dossier, assurant la compatibilité directe avec `INSTALLED_APPS` dans [`config/settings/base.py`](file:///c:/Lahath%C3%A8que/lahatheque-backend/config/settings/base.py#L32-L41).
- **Modèle Utilisateur Personnalisé** : `AUTH_USER_MODEL = 'accounts.User'` est correctement configuré dans [`base.py`](file:///c:/Lahath%C3%A8que/lahatheque-backend/config/settings/base.py#L81) et pointe vers le modèle `User` personnalisé défini dans [`apps/accounts/models.py`](file:///c:/Lahath%C3%A8que/lahatheque-backend/apps/accounts/models.py#L19).
- **Architecture de fichiers standard** : Chaque application possède une organisation standard REST Framework (`models.py`, `views.py`, `serializers.py`, `urls.py`, `admin.py`, `migrations/`, `tests/`).

---

## 2. Évaluation du Routage (`config/urls.py` et `apps/*/urls.py`)

### Points Conformes :
- **Inclusion Centralisée** : Le fichier racine [`config/urls.py`](file:///c:/Lahath%C3%A8que/lahatheque-backend/config/urls.py#L5-L19) inclut de façon explicite les routes de toutes les sous-applications sous le préfixe `/api/v1/`.
- **Intégration de sous-modules** : Les routes spécialisées (`apps.partners.sso.urls` et `apps.accounts.oauth2.urls`) sont connectées correctement à la racine.
- **Normalisation des URL** : Toutes les routes utilisent la barre oblique finale (`/`), évitant les redirections inutiles avec `APPEND_SLASH=True`.

---

## 3. Anomalies Bloquantes et Recommandations de Correction

### 🛑 1. Erreur d'importation critique dans `apps/commerce/urls.py`
- **Problème** : Dans [`apps/commerce/urls.py`](file:///c:/Lahath%C3%A8que/lahatheque-backend/apps/commerce/urls.py#L3), les vues `MonerooWebhookView` et `StripeWebhookView` sont importées depuis `.webhooks`. Or, [`apps/commerce/webhooks.py`](file:///c:/Lahath%C3%A8que/lahatheque-backend/apps/commerce/webhooks.py) n'héberge que la fonction `process_moneroo_webhook` sans définir de classe `APIView`. De plus, `webhooks.py` cherche à importer un modèle `WebhookEvent` inexistant dans [`apps/commerce/models.py`](file:///c:/Lahath%C3%A8que/lahatheque-backend/apps/commerce/models.py).
- **Impact** : Défaillance bloquante au lancement du serveur (`ImportError`).
- **Correction requise** : Implémenter les vues `MonerooWebhookView` et `StripeWebhookView` dans `webhooks.py` ou modifier les routes pour pointer vers des gestionnaires valides, et créer le modèle `WebhookEvent`.

### 🛑 2. Code hérité et résidus d'importation dans `apps/audio/views.py`
- **Problème** : [`apps/audio/views.py`](file:///c:/Lahath%C3%A8que/lahatheque-backend/apps/audio/views.py#L31) tente d'importer `StreamVideo` depuis `.models` et `Lesson` depuis `content.models` (code issu de LahaAcademia). Or, [`apps/audio/models.py`](file:///c:/Lahath%C3%A8que/lahatheque-backend/apps/audio/models.py#L4) ne contient que `AudioTrack`, et l'application `content` n'existe pas dans ce projet.
- **Impact** : Crash sur l'endpoint `/api/v1/audio/status/<stream_id>/`.
- **Correction requise** : Nettoyer `views.py` pour l'aligner strictement avec le modèle `AudioTrack` et le catalogue d'ouvrages.

### ⚠️ 3. Absence de Namespacing (`app_name`) dans les fichiers `urls.py`
- **Problème** : Aucun des fichiers `urls.py` n'expose la variable `app_name = 'nom_app'`.
- **Impact** : Impossibilité d'effectuer un `reverse('catalog:book-detail')` et risque accru de conflits de noms d'URL entre applications.
- **Correction requise** : Déclarer `app_name` au sommet de chaque `urls.py` d'application.

### ⚠️ 4. Incohérence dans `apps/protection/apps.py`
- **Problème** : La classe s'intitule `ProtectionConfigApp` au lieu de `ProtectionConfig`.
- **Correction requise** : Renommer la classe en `ProtectionConfig` par souci de cohérence globale.

---

## 4. Matrice des Fichiers et Actions de Remédiation

| Application | Fichier | Statut | Action à réaliser |
| :--- | :--- | :--- | :--- |
| `commerce` | `urls.py` & `webhooks.py` | 🔴 Bloquant | Créer `WebhookEvent` dans `models.py` et implémenter `MonerooWebhookView` / `StripeWebhookView`. |
| `audio` | `views.py` | 🔴 Bloquant | Remplacer la logique `StreamVideo` / `Lesson` par le modèle `AudioTrack`. |
| *Toutes* | `urls.py` | 🟡 Attention | Ajouter `app_name = '<app_label>'` dans chaque `urls.py`. |
| `protection` | `apps.py` | 🔵 Mineur | Normaliser le nom de la classe en `ProtectionConfig`. |
