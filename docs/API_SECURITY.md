# Spécification Complète de la Sécurité des API — LAHAThèque

**Version** : 3.2.0  
**Statut** : Document de Référence Technique & Conformité  
**Périmètre** : API REST v1 (Lecteur Hébergé, Catalogue Sécurisé, Streaming DRM, Partenaires SaaS)  
**Classification** : Confidentiel / Équipe Technique & Partenaires Agréés  

---

## 1. Vue d'Ensemble de l'Architecture de Sécurité

L'API LAHAThèque expose les ressources éditoriales, académiques et audiovisuelles protégées par le droit d'auteur. Sa sécurité repose sur le principe de **défense en profondeur à 5 niveaux** :

```
[ Client / Liseuse / Partenaire SaaS ]
                 │
         [ TLS 1.3 / HSTS ]
                 ▼
      [ 1. Pare-feu & Throttling (Redis) ]
                 ▼
    [ 2. Authentification & Portée des Droits ]
                 ▼
  [ 3. Contrôle Chirurgical (BlockedReaderIdentity) ]
                 ▼
[ 4. Moteur de Matérialisation DRM & Tatouage (RAM) ]
                 ▼
     [ 5. Journal Légal Immuable (TraceAcces) ]
```

### Principes Directeurs
- **Zéro fuite de fichier clair** : Les fichiers originaux déposés sur le stockage objet privé (S3 / MinIO) ne sont jamais adressés directement au client. Tout document transite sous forme de dérivé éphémère transformé en mémoire vive (`io.BytesIO`).
- **Diffusion fragmentée Range HTTP 206** : Le lecteur ne reçoit jamais un fichier complet en un seul bloc, mais des tronçons binaires de 256 Kio protégés, rendant l'aspiration automatisée inopérante.
- **Tatouage polymorphique à la volée** : Chaque fragment binaire est marqué nominativement au nom de la session courante avec une signature cryptographique inviolable.
- **Sanction chirurgicale ciblée** : L'interdiction d'accès neutralise exclusivement le lecteur fraudeur sans impacter l'organisation partenaire ni les autres usagers de son réseau.

---

## 2. Authentification et Niveaux d'Accès

L'accès aux API de LAHAThèque est segmenté en trois canaux d'authentification étanches :

### 2.1. Canal Partenaire SaaS Machine-to-Machine (M2M)
Destiné aux systèmes tiers (ex. : LAHALEX, portails universitaires, plateformes e-learning).
- **Protocole** : OAuth 2.0 Client Credentials (`django-oauth-toolkit`) ou Clé API signée SHA-256 dans l'en-tête HTTP :
  ```http
  X-Partner-Key: ltq_pk_partner_example
  X-Partner-Secret: ltq_sk_partner_example
  ```
- **Portée (Scopes)** :
  - `read:catalog` : Consultation du bouquet d'ouvrages autorisé.
  - `create:session` : Génération d'une session de lecture sécurisée pour un utilisateur tiers.
  - `read:stats` : Statistiques d'usage agrégées de l'institution.
- **Interdiction stricte** : Une clé partenaire ne permet jamais de télécharger le flux binaire d'un ouvrage sans créer au préalable une session liée à un utilisateur final nominatif.

### 2.2. Canal Session Lecteur Hébergée (Reader Session)
Destiné à la liseuse Web sécurisée intégrée en iframe ou en navigation dédiée (`/read/[token]`).
- **Jeton de session éphémère (TTL 4 heures)** :
  Transmis via l'en-tête `X-Reader-Token` ou en paramètre d'URL chiffré pour le streaming audio/vidéo :
  ```http
  X-Reader-Token: ltq_sess_e4b2a8f9c1d0...
  ```
- **Validation cryptographique** :
  Le jeton est haché en SHA-256 et vérifié contre la table `ReaderSession` en base de données et dans le cache Redis.
- **Invalidation immédiate** :
  Toute modification du champ `is_revoked` ou dépassement de l'horodatage `expires_at` coupe instantanément le flux binaire.

### 2.3. Canal Utilisateur Direct LAHAThèque (BFF Web)
Destiné aux étudiants, enseignants et administrateurs connectés sur `lahatheque.com`.
- **Authentification** : Cookie sécurisé `HttpOnly`, `SameSite=Lax`, `Secure` contenant le JWT signé.
- **Protection CSRF** : En-tête obligatoire `X-CSRFToken` validé par middleware Django sur toute mutation (`POST`, `PUT`, `DELETE`).
- **Contrôle de session unifié** : Révocation globale possible via incrémentation atomique du champ `session_version` de l'utilisateur.

---

## 3. Matérialisation DRM & Tatouage Binaire Éphémère

Toute demande de streaming sur le point de terminaison `/api/v1/reader/sessions/stream/` déclenche le moteur de protection en mémoire vive :

### 3.1. Double Tatouage Systématique

| Type de Tatouage | Mécanisme Technique | Données Gravées | Visibilité |
|---|---|---|---|
| **Filigrane Visible** | Insertion vectorielle PyMuPDF en diagonale ou pied de page | Nom complet, e-mail, adresse IP publique | Semi-transparent (opacité 20% à 30%), insensible au mode sombre |
| **Tatouage Invisible** | Stéganographie textuelle 1 pt dans le flux d'octets PDF (`LTQ:{...}`) | Identifiant utilisateur, e-mail, IP, empreinte terminal, signature SHA-256 | Totalement invisible à l'œil nu, persistant après ré-enregistrement |

### 3.2. Signature Cryptographique d'Intégrité
Chaque document filigrané intègre dans ses métadonnées internes une signature :
```
LTQ_SIG: SHA-256( user_id + ":" + email + ":" + ip_address )
```
Cette signature permet lors de l'analyse forensique de certifier formellement que le document provient de la plateforme sans possibilité de falsification par un tiers.

### 3.3. Streaming HTTP Range 206 (RFC 7233)
Le serveur web ne sert jamais le document dans son intégralité :
- Taille standard d'un fragment : **256 Kio** (`DEFAULT_CHUNK_SIZE`).
- En-têtes HTTP de sécurité obligatoires renvoyés avec chaque fragment :
  ```http
  HTTP/1.1 206 Partial Content
  Content-Type: application/pdf
  Content-Range: bytes 0-262143/4819200
  Content-Length: 262144
  Accept-Ranges: bytes
  Cache-Control: private, no-store, must-revalidate
  X-Content-Type-Options: nosniff
  ```

---

## 4. Filtrage Chirurgical & Liste Noire Active (`BlockedReaderIdentity`)

Lorsqu'une fuite est constatée, le système n'applique aucune sanction collective susceptible de bloquer un partenaire ou une université. Il utilise le modèle de **liste noire active** :

### 4.1. Structure du Modèle `BlockedReaderIdentity`
- `partner_id` : Identifiant du partenaire d'origine (informatif).
- `reader_email` : Adresse e-mail du fraudeur.
- `device_fingerprint` : Empreinte matérielle du terminal incriminé.
- `is_active` : Booléen d'activation du blocage.

### 4.2. Algorithme d'Interception dans `ReaderProtectedStreamView`
À chaque requête de fragment HTTP 206 :
1. Le contrôleur extrait l'e-mail du lecteur (`session.end_user.email`) et l'empreinte de terminal.
2. Il interroge la table indexée `BlockedReaderIdentity` (mise en cache Redis) :
   ```python
   is_blocked = BlockedReaderIdentity.objects.filter(
       reader_email__iexact=reader_email,
       is_active=True
   ).exists()
   ```
3. Si le lecteur est bloqué :
   - La session est immédiatement révoquée : `session.is_revoked = True`.
   - Le serveur renvoie immédiatement un code **HTTP 403 Forbidden**.
   - Aucun octet du document n'est transmis.
   - Tous les autres lecteurs du même partenaire continuent de lire sans aucune perturbation.

---

## 5. Throttling, Quotas et Limitation de Débit (Rate Limiting)

Pour empêcher l'extraction massive ou le déni de service, l'API implémente un système de limitation multi-niveaux adossé à Redis :

| Niveau | Scope | Limite Standard | Comportement en cas de dépassement |
|---|---|---|---|
| **Partenaire M2M** | Clé API | 100 requêtes / minute | HTTP 429 Too Many Requests |
| **Création de Sessions** | Par partenaire | Quota contractuel journalier (ex. : 5 000 / jour) | HTTP 429 avec message quota épuisé |
| **Sessions Simultanées** | Par utilisateur final | Maximum 3 sessions actives simultanées | Fermeture automatique de la plus ancienne |
| **Streaming Range 206** | Par jeton de lecture | 60 fragments / minute | Ralentissement adaptatif du flux |
| **Tentatives d'Intrusion** | Par adresse IP | 5 échecs consécutifs (`django-axes`) | Blocage IP temporaire de 15 minutes |

---

## 6. Journalisation Légale et Traçabilité Immuable (`TraceAcces`)

Conformément aux exigences de preuve juridique, chaque consultation fait l'objet d'une consignation immuable dans la table `TraceAcces` :
- **Horodatage certifié UTC**.
- **Identité du lecteur** (compte LAHAThèque ou référence externe partenaire).
- **Ouvrage et fragment consulté**.
- **Adresse IP publique réelle** (résolution des en-têtes de proxy `CF-Connecting-IP` / `X-Forwarded-For`).
- **Empreinte de terminal** et User-Agent.
- **Identifiant du bouquet ou de la souscription partenaire**.

Ce journal sert de base factuelle aux calculs d'intégrité affichés sur le tableau de bord administrateur et aux enquêtes diligentées dans l'Atelier Forensique.

---

## 7. Spécification des Points de Terminaison de Sécurité

### 7.1. Création de Session Partenaire
- **URL** : `POST /api/v1/reader/sessions/`
- **Authentification** : Clé API Partenaire
- **Corps de Requête** :
  ```json
  {
    "external_user_ref": "etu_98234",
    "external_user_email": "etudiant@universite.bj",
    "external_user_name": "Koffi Mensah",
    "source_type": "catalog_book",
    "book_id": "c7a8b3d2-...",
    "ttl_seconds": 14400
  }
  ```
- **Réponse Succès (201 Created)** :
  ```json
  {
    "success": true,
    "data": {
      "session_id": "a1b2c3d4-...",
      "reader_url": "https://lahatheque.com/read/ltq_sess_e4b2a8f9...",
      "stream_url": "https://lahatheque.com/api/v1/reader/sessions/stream/?token=...",
      "expires_at": "2026-09-11T23:15:00Z"
    },
    "error": null
  }
  ```

### 7.2. Flux de Streaming Protégé (Range 206)
- **URL** : `GET /api/v1/reader/sessions/stream/`
- **En-têtes** :
  - `Range: bytes=0-262143`
  - `X-Reader-Token: ltq_sess_...`
- **Réponses** :
  - `206 Partial Content` : Octets PDF tatoués du fragment.
  - `403 Forbidden` : Session expirée, révoquée ou lecteur inscrit en liste noire.

### 7.3. Analyse Forensique d'un Document Fuité (Admin Seul)
- **URL** : `POST /api/v1/protection/forensic/analyze/`
- **Authentification** : Administrateur LAHAThèque (`role in ['admin', 'super_admin']`)
- **Corps** : Fichier multipart (`PDF`, `PNG`, `JPG`, `WEBP`)
- **Réponse Succès (200 OK)** :
  Rapport d'attribution avec degré de certitude (0 à 100%), données du tatouage décodé, profil suspect, historique d'achat et traces associées.

### 7.4. Sanction Administrative Immédiate (Admin Seul)
- **URL** : `POST /api/v1/protection/forensic/mitigate/`
- **Authentification** : Administrateur LAHAThèque
- **Corps** :
  ```json
  {
    "investigation_id": "9a7aeb2a-...",
    "action": "block_partner_reader",
    "reason": "Fuite constatée de l'ouvrage sur canal public"
  }
  ```
- **Effet** : Inscription immédiate dans `BlockedReaderIdentity`, révocation des sessions actives et coupure du streaming.

---

## 8. Résumé de Conformité pour les Partenaires SaaS

Les partenaires intégrant l'API LAHAThèque **n'ont aucune réimplémentation à effectuer** :
- Le système de protection DRM, le tatouage visible/invisible et le filtrage des fraudeurs fonctionnent de manière 100% transparente côté serveur LAHAThèque.
- En cas de fuite perpétrée par un lecteur chez un partenaire, seule l'identité de ce lecteur est neutralisée. L'application partenaire continue de fonctionner normalement sans rupture de service pour les autres utilisateurs.
