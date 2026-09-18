# Feature Specification: Optimisation Haute Performance du Streaming de Lecture, Élimination des Goulots d'Étranglement I/O et Délégation Nginx

**Feature Branch**: `011-fast-reader-streaming-optimization`

**Created**: 2026-09-18

**Status**: Draft

**Input**: User description: "la lecture de livre sur par l'api ou sur lahathèque même est extrêmement lent, c'est pas normal, on doit trouver une soultion, redis, worker ou autre je ne sais pas solution sans surcharge, aussi meêm si y a plusieurs lecteur l'api ou sur lahathèque ou sur le même livre dans leur dashboard ça ne doit pas être lent, c'est pas normal cette lenteur alors qu'on est sur ce vps : 8 vCPU AMD EPYC, 32 Go RAM, NVMe Ubuntu 24.04. Goulot d'étranglement workers épuisés sur gros fichiers 61 Mo, boucle waitForDocumentReady 30s, ravales de reading/progress invalidant le cache, et blocage général."

## Clarifications

### Session 2026-09-18

- Q: Comment concilier la protection DRM complète (filigrane dynamique nominatif et tatouage invisible) avec le streaming haute performance sans bloquer les workers Django ? → A: Matérialisation du dérivé chiffré sur disque SSD NVMe local (`tmpfs` ou dossier de cache dédié), service par fragments RFC 7233 Range (HTTP 206) et délégation au reverse-proxy Nginx (`X-Accel-Redirect`) pour décharger à 100% les workers Python une fois l'authentification vérifiée.
- Q: Le retrait du chargement préalable en `Blob` JavaScript côté frontend compromet-il la sécurité des livres ou expose-t-il le PDF brut ? → A: Non. C'est le flux dérivé filigrané qui est servi en fragments (jamais le PDF original de l'éditeur). Le `blob:` n'offre aucun chiffrement et obligeait le navigateur à télécharger la totalité du livre (61 Mo) avant d'afficher la première page. Le streaming HTTP 206 par fragments de 128 Ko permet à la page 1 de s'afficher en moins de 200 ms tout en conservant le blocage de l'impression, de la copie, du clic droit et du raccourci de sauvegarde.
- Q: Pourquoi l'endpoint `/api/v1/student/reading/progress/` provoquait-il des lenteurs en cascade sur tout le site ? → A: Cet endpoint exécutait systématiquement `invalidate_student_books_cache(user.id)` à chaque page tournée ou toutes les 15 secondes, détruisant en permanence le cache Redis de la bibliothèque et forçant la base PostgreSQL à recalculer des requêtes lourdes (`ReadingProgress` + `Ouvrage` + `Discipline`). La progression doit être décorrélée de l'invalidation du catalogue/bibliothèque et temporisée (debounce de 30 secondes minimum).
- Q: Faut-il conserver la boucle d'attente de 30 tentatives (`waitForDocumentReady`) présente sur le lecteur web ? → A: Non. Cette boucle infligeait jusqu'à 45 secondes de blocage artificiel ("Préparation du document...") même lorsque le fichier était prêt. Elle doit être retirée : le lecteur ouvre le document directement, et la négociation HTTP 206 prend en charge le premier fragment instantanément.
- Q: Quelle stratégie de délégation Nginx préférez-vous pour le service des fichiers volumineux ? → A: Mode Hybride : injection de l'en-tête `X-Accel-Redirect` dès que Nginx est détecté (ou via variable d'environnement `USE_X_ACCEL_REDIRECT=True`), avec repli transparent sur `FileResponse` itératif direct si exécuté sans Nginx (ex: développement local).
- Q: Où les fichiers PDF dérivés filigranés doivent-ils être mis en cache sur le serveur ? → A: Stockage SSD NVMe / Disque local avec enregistrement dans le registre de base de données (`DerivedCacheRegistry`) et nettoyage automatique selon la politique TTL (24h), évitant d'engorger la mémoire et le socket Redis avec des blocs de 60 Mo.
- Q: À quelle fréquence le lecteur web doit-il synchroniser la progression de lecture avec le backend ? → A: Temporisation (debounce) à 30 secondes et synchronisation à la fermeture de page (`beforeunload`) pour préserver les ressources CPU/base de données.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chargement Instantané et Streaming HTTP 206 Partiel du Livre (Priority: P1)

En tant qu'étudiant, enseignant ou lecteur sur LAHAThèque (ou via l'API Partenaire Campus),
Je souhaite ouvrir n'importe quel livre volumineux (y compris les ouvrages de 50 à 100 Mo) et voir la couverture ainsi que la première page s'afficher en moins de 300 millisecondes,
Afin de bénéficier d'une expérience de lecture fluide, immédiate et sans latence perceptible, sans saturer les ressources du serveur.

**Why this priority**: C'est le cœur de l'expérience utilisateur de la plateforme. Une latence de 30 secondes ou un blocage complet paralyse l'apprentissage et bloque les autres utilisateurs du site.

**Independent Test**: Tester l'ouverture d'un ouvrage volumineux (> 50 Mo) dans `/catalog/reader/[id]` et `/read/[token]` : vérifier que le navigateur n'attend pas de télécharger 61 Mo, qu'une requête HTTP 206 Range (0-131071 octets) est émise, et que la première page s'affiche en moins d'une seconde.

**Acceptance Scenarios**:

1. **Given** un utilisateur authentifié ouvrant un livre volumineux, **When** la page de lecture se charge, **Then** le lecteur ne fait plus de `streamRes.blob()` bloquant et transmet directement l'URL sécurisée au moteur de rendu PDF.js.
2. **Given** la requête initiale de streaming envoyée vers `/api/v1/catalog/books/<id>/stream/` ou `/api/v1/reader/sessions/stream/`, **When** le serveur répond, **Then** il valide immédiatement les droits de lecture en moins de 10 ms et sert le premier fragment (HTTP 206 Partial Content) avec les en-têtes `Accept-Ranges: bytes`, `Content-Range`, `Content-Disposition: inline` et `Cache-Control: private, no-store`.
3. **Given** un lecteur feuilletant un ouvrage, **When** il tourne une page, **Then** seuls les fragments nécessaires à la double-page courante sont téléchargés par tranches de 128 Ko, sans charger les centaines d'autres pages du livre.
4. **Given** le dérivé filigrané généré, **When** plusieurs lecteurs ouvrent le même ouvrage au même moment, **Then** le dérivé est réutilisé ou servi instantanément sans ré-exécuter le moteur PyMuPDF à chaque fragment Range.

---

### User Story 2 - Suppression des Attentes Artificielles & Débrayage des Polling Agressifs (Priority: P1)

En tant qu'utilisateur de la plateforme,
Je souhaite accéder directement à la liseuse sans passer par un compte à rebours bloquant ("Préparation du document... (1/30)"),
Afin de démarrer ma lecture instantanément dès le clic sur « Lire ».

**Why this priority**: La boucle `waitForDocumentReady` de 30 itérations était une des causes directes des 45 secondes d'attente imposées aux utilisateurs, générant des requêtes inutiles vers `/stream/status/`.

**Independent Test**: Cliquer sur un livre dans le catalogue : vérifier que la liseuse FlipBook s'initialise directement sans afficher la barre de progression d'attente 1/30.

**Acceptance Scenarios**:

1. **Given** l'accès accordé à un livre, **When** la page `/catalog/reader/[id]` s'ouvre, **Then** la boucle de polling `waitForDocumentReady` est éliminée et le flux de streaming est sollicité directement.
2. **Given** un document dont le dérivé n'est pas encore préchauffé, **When** la première requête arrive, **Then** la préparation s'exécute de manière optimisée sans déclencher de cascades de boucles 404/preparing côté client.

---

### User Story 3 - Stabilisation de la Synchronisation de Lecture & Préservation du Cache (Priority: P2)

En tant qu'administrateur système et exploitant de la plateforme,
Je souhaite que la synchronisation de progression de lecture (`/api/v1/student/reading/progress/`) ne détruise pas le cache Redis de la bibliothèque et ne crée pas de verrous SQL concurrents sur la base PostgreSQL,
Afin que des centaines de lecteurs actifs simultanés ne ralentissent ni la navigation générale, ni l'accès au catalogue ou aux tableaux de bord.

**Why this priority**: L'invalidation abusive du cache étudiant (`invalidate_student_books_cache`) à chaque seconde et les écritures concurrentes en base étaient la cause directe du timeout 504 et de l'asphyxie des workers Django.

**Independent Test**: Simuler des sessions de lecture actives avec envoi régulier de progression : vérifier que le cache Redis de la bibliothèque de l'étudiant reste valide et n'est pas vidé à chaque page tournée.

**Acceptance Scenarios**:

1. **Given** un étudiant tournant les pages d'un livre, **When** le lecteur envoie la progression de lecture, **Then** le frontend applique un debounce (envoi toutes les 30 secondes ou lors du départ de la page) au lieu d'une rafale à chaque seconde.
2. **Given** la réception d'un `POST /api/v1/student/reading/progress/`, **When** Django enregistre la page courante et la durée de lecture, **Then** il met à jour la progression sans appeler `invalidate_student_books_cache(user.id)`. Le cache de la bibliothèque est conservé pour les consultations de catalogue et de tableau de bord.
3. **Given** l'enregistrement de l'audit de sécurité (`TraceAcces`), **When** la requête est traitée, **Then** l'écriture s'effectue sans verrou bloquant sur l'ensemble de la table pour éviter tout timeout inter-processus.

---

### User Story 4 - Décharge Nginx via `X-Accel-Redirect` & Dimensionnement des Workers VPS (Priority: P2)

En tant qu'architecte de la plateforme LAHAThèque,
Je souhaite que les fichiers volumineux soient servis directement par Nginx (`X-Accel-Redirect`) et que le serveur d'application Gunicorn soit calibré pour les 8 cœurs du VPS,
Afin que les workers Python restent 100% disponibles pour l'authentification, les transactions et les API métiers.

**Why this priority**: Un worker Django ne doit jamais être mobilisé pendant des dizaines de secondes pour pousser des mégaoctets de données sur le réseau.

**Independent Test**: Vérifier les en-têtes HTTP de réponse du backend : vérifier la présence de `X-Accel-Redirect` en production et constater que les requêtes simultanées de catalogue répondent en moins de 100 ms même pendant un streaming lourd.

**Acceptance Scenarios**:

1. **Given** une requête de streaming de livre autorisée, **When** la configuration Nginx est active, **Then** Django valide la sécurité et renvoie `X-Accel-Redirect: /protected_media/derived/<cache_key>.pdf`, libérant immédiatement le worker Python.
2. **Given** le VPS 8 cœurs / 32 Go de RAM, **When** le service Gunicorn démarre, **Then** il est configuré avec un nombre suffisant de workers et de threads (ex: 9 à 17 workers ou workers asynchrones) pour garantir qu'aucune requête API ne soit mise en attente prolongée.

## Technical Implementation Details

### Frontend (`lahatheque-frontend`)
- [app/read/[token]/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/read/%5Btoken%5D/page.tsx) : Remplacement de l'appel `fetch().blob()` par le passage direct de l'URL sécurisée à `FlipBookReader` avec en-têtes de session appropriés.
- [app/catalog/reader/[id]/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/catalog/reader/%5Bid%5D/page.tsx) : Suppression de la boucle de 30 tentatives `waitForDocumentReady`.
- [lib/services/library.ts](file:///e:/Lahatheque/lahatheque-frontend/lib/services/library.ts) : Temporisation (debounce) des appels de synchronisation de lecture.

### Backend (`lahatheque-backend`)
- [apps/student/views.py](file:///e:/Lahatheque/lahatheque-backend/apps/student/views.py) : Retrait de `invalidate_student_books_cache` dans `StudentUpdateReadingProgressView`.
- [apps/protection/derived_materializer.py](file:///e:/Lahatheque/lahatheque-backend/apps/protection/derived_materializer.py) : Stockage optimisé des dérivés volumineux sur disque/NVMe plutôt que de saturer le socket Redis avec des blocs de 60 Mo.
- [apps/catalog/stream_views.py](file:///e:/Lahatheque/lahatheque-backend/apps/catalog/stream_views.py) & [apps/reader/views.py](file:///e:/Lahatheque/lahatheque-backend/apps/reader/views.py) : Support de `X-Accel-Redirect` lorsque Nginx est activé en production.
