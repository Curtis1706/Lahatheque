# Implementation Plan: Optimisation Haute Performance du Streaming de Lecture, Élimination des Goulots d'Étranglement I/O et Délégation Nginx

**Branch**: `011-fast-reader-streaming-optimization` | **Date**: 2026-09-18 | **Spec**: [specs/011-fast-reader-streaming-optimization/spec.md](file:///e:/Lahatheque/specs/011-fast-reader-streaming-optimization/spec.md)

**Input**: Spécification technique issue de `/specs/011-fast-reader-streaming-optimization/spec.md`

## Summary

La plateforme LAHAThèque hébergée sur un VPS 8 vCPU AMD EPYC, 32 Go RAM subissait des lenteurs critiques et des timeouts 504 lors de la lecture d'ouvrages volumineux (60 Mo). L'analyse a révélé quatre causes interconnectées :
1. Le frontend exécutait un `await fetch().blob()` forçant le téléchargement intégral en RAM avant l'affichage de la page 1.
2. Une boucle de polling artificielle de 30 itérations (`waitForDocumentReady`) retardait inutilement l'ouverture de 15 à 45 secondes.
3. L'application du filigrane et le stockage du PDF entier (60 Mo) saturaient la bande passante du socket Redis.
4. L'endpoint de progression de lecture (`/student/reading/progress/`) invalidait le cache de toute la bibliothèque à chaque seconde (`invalidate_student_books_cache`).

Le plan d'implémentation met en place :
- Le vrai streaming HTTP 206 partiel (RFC 7233) par fragments de 128 Ko directement branché sur le moteur PDF.js sans blob préalable.
- La suppression de la boucle `waitForDocumentReady`.
- La mise en cache des dérivés protégés sur disque SSD NVMe (`var/drm_cache/`) avec enregistrement dans `DerivedCacheRegistry` (au lieu de surcharger Redis).
- Le support de la délégation reverse-proxy `X-Accel-Redirect` (mode hybride Nginx/FileResponse).
- Le débrayage de l'invalidation du cache de bibliothèque sur la progression de lecture avec debounce frontend à 30 secondes.

---

## Technical Context

**Language/Version**: Python 3.10+ (Backend Django 5), TypeScript 5.x (Frontend Next.js 15 App Router).  
**Primary Dependencies**: Django REST Framework, PyMuPDF (`fitz`), `@react-pdf-viewer/core`, `pdfjs-dist`, `lucide-react`.  
**Storage**: PostgreSQL (métadonnées & sessions), Redis (cache rapide & verrous distribués), SSD NVMe local (`var/drm_cache/` pour dérivés protégés), Cloudflare R2 (fichiers maîtres chiffrés).  
**Testing**: `pytest`, `python manage.py check`, `npx tsc --noEmit`.  
**Target Platform**: Linux Ubuntu 24.04.4 LTS (8 vCPU AMD EPYC, 32 Go RAM, SSD NVMe).  
**Project Type**: Application web SaaS B2B/B2C (Next.js + Django REST).  
**Performance Goals**: Ouverture de la première page d'un livre en < 300 ms (au lieu de 30s) ; support de 500+ sessions de lecture concurrentes sans asphyxie des workers.  
**Constraints**: Respect absolu du DRM (filigrane dynamique nominatif visible + tatouage invisible stéganographique), zéro affichage de PDF brut non protégé, interdiction des couleurs hexadécimales en dur (`globals.css`), zéro emoji.  
**Scale/Scope**: 221+ ouvrages académiques et professionnels, flux multi-lecteurs simultanés campus et clients individuels.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe Constitution | Statut | Justification |
| :--- | :--- | :--- |
| **I. Lecture Intégrale Exhaustive** | CONFORME | 100% des lignes de `stream_views.py`, `derived_materializer.py`, `watermark.py`, `hosted-reader.ts`, `FlipBook.tsx` et `catalog/reader/[id]/page.tsx` ont été lues et auditées. |
| **III. Rigueur Backend & Type Hints** | CONFORME | Vues DRF typées strictement, gestion des exceptions avec logs explicites. |
| **IV. Format de Réponse API Unifié** | CONFORME | Réponses JSON standardisées `{"success": true, "data": {}, "error": null}`. |
| **V. Performance ORM & Anti N+1** | CONFORME | Élimination de `invalidate_student_books_cache` sur la route de progression ; maintien des index et prefetch_related. |
| **VI. Sécurité Réseau & Cookies HttpOnly** | CONFORME | Session sécurisée transmise par cookies HttpOnly ou en-têtes `X-Reader-Token`. |
| **VII. Protection DRM & Streaming** | CONFORME | Streaming RFC 7233 partiel garanti avec filigrane gravé et tatouage stéganographique invisible. |
| **VIII. Tokens Sémantiques & Typographie** | CONFORME | Préservation des classes sémantiques `bg-navy`, `text-gold`, `border-border`, polices Playfair Display et Poppins. |
| **XI. Traçabilité & Console Logs** | CONFORME | Journalisation des fragments Range et horodatages précis en console et backend logs. |

---

## Project Structure

### Documentation (this feature)

```text
specs/011-fast-reader-streaming-optimization/
├── spec.md              # Spécification validée avec clarifications
├── plan.md              # Ce document (plan d'implémentation)
├── research.md          # Analyse des flux I/O, métriques et benchmarks
├── data-model.md        # Cycle de vie du cache dérivé et persistance
└── quickstart.md        # Guide de test rapide et validation performance
```

### Source Code Modifié

```text
lahatheque-frontend/
├── app/(public)/catalog/reader/[id]/page.tsx    # Suppression waitForDocumentReady + streaming direct
├── app/read/[token]/page.tsx                   # Remplacement du fetch Blob par URL streaming RFC 7233
├── lib/services/library.ts                     # Debounce et temporisation de syncProgress
└── components/library/FlipBook.tsx             # Optimisation passage URL et rangeChunkSize

lahatheque-backend/
├── apps/student/views.py                       # Retrait de invalidate_student_books_cache dans progress view
├── apps/protection/derived_materializer.py     # Cache dérivé local sur SSD NVMe au lieu d'engorger Redis
├── apps/catalog/stream_views.py                # Support hybride X-Accel-Redirect / FileResponse Range
└── apps/reader/views.py                        # Support hybride X-Accel-Redirect / FileResponse Range
```

---

## Phase 0: Research & Décisions Techniques

### Décision 1 : Élimination du Blob JavaScript côté Frontend
- **Problème** : `const blob = await streamRes.blob()` forçait le téléchargement de 61 Mo dans la RAM du navigateur.
- **Solution** : Passer directement l'URL `/api/bff/catalog/books/<id>/stream/?lang=...` ou `/api/bff/reader/sessions/stream/?lang=...` à PDF.js via `FlipBookReader`.
- **Gain** : Le navigateur n'émet qu'une requête HTTP `Range: bytes=0-131071` (128 Ko) pour charger la première page. Temps d'affichage : < 200 ms.

### Décision 2 : Suppression de la boucle `waitForDocumentReady`
- **Problème** : 30 requêtes séquentielles avec `setTimeout(1500)` bloquaient le lecteur pendant 15 à 45 secondes.
- **Solution** : Supprimer cette attente bloquante. Le lecteur s'ouvre immédiatement et le backend génère/sert le dérivé dès la première requête HTTP 206.
- **Gain** : Élimination de 15 à 45 secondes de latence perçue.

### Décision 3 : Stockage local SSD NVMe du cache dérivé
- **Problème** : Pousser des PDF de 60 Mo dans Redis saturait le socket Redis et dégradait les performances générales.
- **Solution** : Les fichiers dérivés filigranés sont enregistrés dans `var/drm_cache/<cache_key>.pdf` sur le disque SSD NVMe ultra-rapide. Redis ne stocke que le verrou distribué et les clés de métadonnées. Le registre SQL `DerivedCacheRegistry` gère la traçabilité et l'expiration (24h).
- **Gain** : Zéro surcharge mémoire sur Redis ; lecture directe des octets depuis le système de fichiers Linux.

### Décision 4 : Support X-Accel-Redirect (Mode Hybride)
- **Problème** : Les workers Django restaient immobilisés pendant tout le transfert de gros fichiers.
- **Solution** : Si la variable d'environnement `USE_X_ACCEL_REDIRECT` est activée ou si l'en-tête de détection Nginx est présent, Django répond avec `X-Accel-Redirect: /protected_media/derived/<cache_key>.pdf` et `Content-Type: application/pdf`. Django se libère en 5 ms, Nginx sert les fragments Range.
- **Fallback** : Si exécuté en local sans Nginx, Django utilise `FileResponse(open(path, 'rb'))` avec support Range natif sans charger le fichier entier en RAM.

### Décision 5 : Stabilisation de la route `reading/progress`
- **Problème** : À chaque page tournée, `invalidate_student_books_cache(user.id)` détruisait le cache Redis de la bibliothèque, provoquant des requêtes PostgreSQL concurrentes et des timeouts 504.
- **Solution** : Retirer cet appel d'invalidation dans `StudentUpdateReadingProgressView`. La progression est enregistrée en tâche fluide. Côté frontend, `syncProgress` applique un debounce à 30 secondes.

---

## Phase 1: Spécification des Modifications & Interfaces

### 1. Frontend: [app/read/[token]/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/read/%5Btoken%5D/page.tsx)
- Supprimer `const loadBlob = async () => { ... const blob = await streamRes.blob(); setRawPdfData(blobUrl); }`.
- Définir `rawPdfData` comme l'URL de streaming direct `/api/bff/reader/sessions/stream/?lang=${initialLang}`.
- Dans [FlipBook.tsx](file:///e:/Lahatheque/lahatheque-frontend/components/library/FlipBook.tsx), s'assurer que `withCredentials: true` et les en-têtes de session (`X-Reader-Token`) sont bien transmis lors des requêtes partielles.

### 2. Frontend: [app/catalog/reader/[id]/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/catalog/reader/%5Bid%5D/page.tsx)
- Supprimer la fonction `waitForDocumentReady` et l'état `preparationLabel`.
- Affecter immédiatement `targetStreamUrl` à `setRawPdfData` dès la résolution des métadonnées du livre.

### 3. Frontend: [lib/services/library.ts](file:///e:/Lahatheque/lahatheque-frontend/lib/services/library.ts)
- Ajouter une protection anti-spam sur `syncProgress` : mémoriser le timestamp du dernier envoi et n'émettre vers le backend que si l'écart est >= 30 secondes (ou si l'action est un changement de livre/fermeture).

### 4. Backend: [apps/student/views.py](file:///e:/Lahatheque/lahatheque-backend/apps/student/views.py)
- Supprimer la ligne 645 `invalidate_student_books_cache(user.id)`.

### 5. Backend: [apps/protection/derived_materializer.py](file:///e:/Lahatheque/lahatheque-backend/apps/protection/derived_materializer.py)
- Sauvegarder le fichier filigrané directement dans `cache_file_path` sur le disque SSD.
- Vérifier en premier si `os.path.exists(cache_file_path)` pour éviter de solliciter Redis pour de gros blobs binaires.
- Retourner le chemin du fichier ou un descripteur de fichier ouvert pour permettre un streaming à zéro copie mémoire.

### 6. Backend: [apps/catalog/stream_views.py](file:///e:/Lahatheque/lahatheque-backend/apps/catalog/stream_views.py) & [apps/reader/views.py](file:///e:/Lahatheque/lahatheque-backend/apps/reader/views.py)
- Intégrer l'émission de `X-Accel-Redirect` :
  ```python
  if getattr(settings, 'USE_X_ACCEL_REDIRECT', False):
      response = HttpResponse()
      response['X-Accel-Redirect'] = f'/protected_derived/{cache_key}.pdf'
      response['Content-Type'] = 'application/pdf'
      response['Content-Disposition'] = f'inline; filename="{safe_title}.pdf"'
      return response
  ```
- En mode standard (fallback dev/sans Nginx), utiliser `FileResponse` itératif sur le fichier disque au lieu de charger tous les `pdf_bytes` en mémoire vive.

---

## Phase 2: Plan de Vérification & Tests

1. **Compilation & Typage** :
   - Exécuter `npx tsc --noEmit` sur le frontend (zéro erreur de typage).
   - Exécuter `python manage.py check` sur le backend (zéro erreur de configuration).
2. **Test de Streaming Partiel Range (HTTP 206)** :
   - Vérifier via curl ou test unitaire que `GET /api/v1/catalog/books/<id>/stream/` avec `HTTP_RANGE="bytes=0-131071"` renvoie bien un statut HTTP 206 et une taille exacte de 131072 octets sans charger 60 Mo.
3. **Test de Non-Régression Bibliothèque & Dashboard** :
   - Ouvrir un livre, feuilleter 5 pages, vérifier que la bibliothèque de l'étudiant reste instantanée et que le cache n'est pas détruit.
