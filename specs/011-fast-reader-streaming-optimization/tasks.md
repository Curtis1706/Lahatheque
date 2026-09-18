# Tasks: Optimisation Haute Performance du Streaming de Lecture, Élimination des Goulots d'Étranglement I/O et Délégation Nginx

**Input**: Spécification et plan technique issus de `specs/011-fast-reader-streaming-optimization/`  
**Prerequisites**: [spec.md](file:///e:/Lahatheque/specs/011-fast-reader-streaming-optimization/spec.md), [plan.md](file:///e:/Lahatheque/specs/011-fast-reader-streaming-optimization/plan.md)  
**Organization**: Tâches découpées par User Story pour une exécution progressive et des tests indépendants.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Tâche exécutable en parallèle (fichiers distincts, pas de dépendance bloquante).
- **[Story]**: Rattachement à la User Story correspondante (`US1`, `US2`, `US3`, `US4`).

---

## Phase 1: Setup & Précautions Fondamentales

**Purpose**: Sécurisation de l'environnement, vérification des tests et des dossiers de cache.

- [X] T001 Vérifier le répertoire de cache dérivé local `var/drm_cache/` dans `lahatheque-backend` et s'assurer de sa création automatique avec permissions d'écriture.
- [X] T002 [P] Vérifier la variable de configuration `USE_X_ACCEL_REDIRECT` dans `lahatheque-backend/config/settings/base.py` avec valeur par défaut désactivée en local et activable en production.

---

## Phase 2: Foundational (Backend Core DRM & Dérivés)

**Purpose**: Rendre le stockage des dérivés résilient sur SSD NVMe et libérer Redis des gros blobs binaires.

- [X] T003 [US1] Modifier `lahatheque-backend/apps/protection/derived_materializer.py` pour vérifier et servir le fichier chiffré directement depuis `var/drm_cache/<cache_key>.enc` (ou `.pdf`) sans stocker les gros blocs de 60 Mo dans Redis.
- [X] T004 [US1] Ajouter dans `DerivedMaterializer.get_or_create_derived` la sauvegarde sur disque SSD local et la mise à jour du registre `DerivedCacheRegistry` avec taille de fichier et expiration TTL (24h).

---

## Phase 3: User Story 1 & 2 - Streaming HTTP 206 Immédiat & Fin de l'Attente Artificielle (Priority: P1)

**Story Goal**: Permettre l'ouverture de n'importe quel livre (même > 50 Mo) en moins de 300 ms sans téléchargement préalable en Blob et sans compte à rebours 1/30.

- [X] T005 [US1] Modifier `lahatheque-frontend/app/read/[token]/page.tsx` : supprimer la fonction `loadBlob` qui appelait `await streamRes.blob()`, et transmettre directement l'URL de streaming `/api/bff/reader/sessions/stream/?lang=${initialLang}` à `FlipBookReader`.
- [X] T006 [US2] Modifier `lahatheque-frontend/app/(public)/catalog/reader/[id]/page.tsx` : supprimer la boucle `waitForDocumentReady` de 30 itérations et l'état `preparationLabel` pour afficher directement le lecteur dès la récupération des métadonnées.
- [X] T007 [P] [US1] Adapter `lahatheque-frontend/components/library/FlipBook.tsx` : vérifier la transmission de `withCredentials: true` et la gestion fluide des fragments de 128 Ko sans déclencher de téléchargement intégral automatique.
- [X] T008 [US1] Valider le streaming sur `lahatheque-frontend` via `npx tsc --noEmit` pour garantir l'intégrité du typage TypeScript.

---

## Phase 4: User Story 3 - Stabilisation de la Synchronisation de Lecture & Préservation du Cache (Priority: P2)

**Story Goal**: Éviter la destruction continue du cache de la bibliothèque et l'engorgement de PostgreSQL lors des sessions de lecture actives.

- [X] T009 [US3] Modifier `lahatheque-backend/apps/student/views.py` : retirer la ligne 645 `invalidate_student_books_cache(user.id)` de `StudentUpdateReadingProgressView` pour que les requêtes de progression n'invalident pas le cache de la bibliothèque.
- [X] T010 [US3] Modifier `lahatheque-frontend/lib/services/library.ts` : ajouter une temporisation (debounce de 30 secondes) dans `syncProgress` pour limiter la fréquence des appels envoyés par page tournée.

---

## Phase 5: User Story 4 - Support Hybride Nginx `X-Accel-Redirect` (Priority: P2)

**Story Goal**: Déléguer le transfert réseau des gros fichiers à Nginx en production pour libérer instantanément les workers Django en moins de 5 ms.

- [X] T011 [US4] Mettre à jour `lahatheque-backend/apps/catalog/stream_views.py` : si `USE_X_ACCEL_REDIRECT` est actif, renvoyer l'en-tête `X-Accel-Redirect: /protected_derived/<cache_key>.pdf` au lieu de streamer les octets via Python. Si inactif, streamer avec `FileResponse` en mode non bloquant.
- [X] T012 [US4] Mettre à jour `lahatheque-backend/apps/reader/views.py` (`ReaderProtectedStreamView`) : ajouter le même comportement hybride `X-Accel-Redirect` / `FileResponse` pour l'API de lecture des sessions partenaires.
- [X] T013 [US4] Documenter la configuration Nginx recommandée pour le bloc `location /protected_derived/` dans `specs/011-fast-reader-streaming-optimization/quickstart.md`.

---

## Phase 6: Validation, Tests & Monitoring

**Purpose**: Validation de bout en bout et vérification des performances.

- [X] T014 Exécuter `python manage.py check` sur `lahatheque-backend` pour valider l'intégrité de l'application Django.
- [X] T015 Exécuter `npx tsc --noEmit` sur `lahatheque-frontend` pour confirmer l'absence d'erreurs de build.
- [X] T016 Tester manuellement le streaming d'un ouvrage volumineux et vérifier l'envoi de réponses HTTP 206 sans freeze des workers.
