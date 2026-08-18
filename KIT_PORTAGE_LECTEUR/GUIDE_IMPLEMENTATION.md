# Guide d'implémentation — Lecteur LahaAcademia (mode immersion + mode normal)

Ce guide explique **comment fonctionne** le lecteur de livres de LahaAcademia et **comment le
réimplémenter à l'identique** dans un autre projet sur la même stack (Django REST + Next.js App
Router + React/TypeScript). Il accompagne les fichiers de code réels rangés dans `backend/` et
`frontend/` de ce kit.

Ordre de lecture conseillé :

1. Section 0 → 3 : comprendre ce que fait le lecteur et son mécanisme central.
2. Section 4 → 7 : détails fichier par fichier (backend puis frontend).
3. Section 8 → 12 : dépendances, variables d'env, installation pas à pas, pièges, validation.

---

## Sommaire

- **0.** Comment utiliser ce kit
- **1.** Ce que fait le lecteur (les deux modes)
- **2.** Architecture générale
- **3.** Le mécanisme des deux modes (`effectiveImmersionMode`)
- **4.** Arborescence et rôle des fichiers
- **5.** Flux de données de bout en bout
- **6.** Détails backend (Django)
- **7.** Détails frontend (Next.js)
- **8.** Dépendances exactes (npm + pip)
- **9.** Variables d'environnement
- **10.** Installation pas à pas
- **11.** ⚠️ Points de vigilance
- **12.** Checklist de validation

---

## 0. Comment utiliser ce kit

Le kit est **autoportant** : il contient à la fois les consignes (ce guide + le `README.md`) et
**le code réel** des 45 fichiers concernés.

Deux catégories de fichiers :

- **Fichiers « lecteur »** (spécifiques à la fonctionnalité) → tu peux les **copier tels quels**
  dans ton projet en respectant l'arborescence : tout le dossier `library/`, `core/document_views.py`,
  `core/tts_views.py`, `media/`, les hooks du lecteur, `FlipBook.tsx`, le dossier `flipbook/`, etc.
- **Fichiers « globaux au projet »** → à **fusionner**, jamais écraser :
  `backend/lahaacademia/settings.py`, `backend/core/urls.py`, `backend/library/urls.py`,
  `frontend/next.config.mjs`, `frontend/package.json`, `frontend/tailwind.config.js`,
  `frontend/tsconfig.json`, `frontend/app/globals.css`.

Pour ces derniers, ouvre le fichier du kit, repère les blocs marqués comme critiques dans ce guide
(sections 6, 7, 8) et **recopie uniquement ces blocs** dans tes propres fichiers.

> 💡 Règle d'or : commence par faire fonctionner le **mode normal** (lecteur PDF sécurisé), qui
> dépend seulement du proxy PDF Django. Ajoute ensuite le **mode immersion** (FlipBook), puis les
> sous-systèmes (TTS, annotations, audio, progression) un par un. Chaque brique est indépendante.

---

## 1. Ce que fait le lecteur (les deux modes)

Le lecteur ouvre un livre (un PDF stocké sur Cloudflare R2) et l'affiche dans l'un de **deux modes**.

### Mode immersion (par défaut)

- Composant : `FlipBookReader` (exporté par `components/library/FlipBook.tsx`).
- Rendu : un **livre 3D plein écran** qui tourne les pages, basé sur `react-pageflip`.
- Chaque page est **rendue en `<canvas>`** à partir du PDF via `pdfjs-dist`, puis convertie en
  image JPEG (blob URL) pour être posée sur la « feuille » du livre.
- **Rendu fenêtré** : seules les pages proches de la page courante sont rendues
  (`PAGE_RENDER_WINDOW = 4`), pour ne pas saturer la mémoire sur les gros livres.
- Plein écran via une `motion.div` (framer-motion) en `z-[1000]`.
- Outils : surlignage/annotations (moteur custom), TTS, audio narratif, « poser une question »,
  quiz de fin de lecture.
- Raccourcis clavier : flèches = tourner les pages, `Échap` = quitter, `h/u/n/e/r` = outils.

### Mode normal (quand on quitte l'immersion)

- Composant : `Viewer` de `@react-pdf-viewer/core`.
- Rendu : lecteur PDF classique paginé/scrollable, **sécurisé** (anti-copie, anti-impression,
  anti-téléchargement autant que possible côté client).
- Annotations via `@react-pdf-viewer/highlight` (surlignage par zones).
- Mêmes sous-systèmes TTS / audio / progression que l'immersion.

### Sous-systèmes partagés par les deux modes

| Sous-système | Rôle |
|---|---|
| **Proxy PDF** | Le front ne télécharge jamais le PDF depuis R2 directement : il passe par un proxy Django qui re-streame le fichier (support Range) avec un content-type leurre. |
| **TTS (synthèse vocale)** | Récupère le texte des pages (PyMuPDF côté serveur) puis synthétise l'audio (OpenAI `tts-1`). |
| **Annotations** | Deux moteurs différents (immersion vs normal), **un seul backend** (`LibraryAnnotation`). |
| **Audio narratif** | Lecture du fichier `audio_file` du livre (narration pré-enregistrée). |
| **Progression** | Synchronisation de la dernière page lue toutes les 30 s. |

---

## 2. Architecture générale

```
┌─────────────────────────────────────────────────────────────────────┐
│                          NAVIGATEUR (client)                          │
│                                                                       │
│  app/library/view/[id]/page.tsx   ← DocumentReaderPage (orchestrateur)│
│     │                                                                 │
│     ├── effectiveImmersionMode ? ──── OUI ──► <FlipBookReader/>        │
│     │                                          (canvas + pdfjs-dist)  │
│     └────────────────────────────── NON ──► <Viewer/>                 │
│                                              (@react-pdf-viewer/core)  │
│                                                                       │
│  Hooks : useTextToSpeech · useAudioPlayer · useAnnotations ·          │
│          usePdfReaderSecurity                                         │
└───────────┬───────────────────────────────────┬──────────────────────┘
            │                                     │
            │ (A) métadonnées livre,              │ (B) flux PDF binaire
            │     annotations, progression,       │     + texte + TTS
            │     via BFF (cookie HttpOnly)        │     via proxy DIRECT
            ▼                                     ▼
┌───────────────────────────┐        ┌──────────────────────────────────┐
│  Route Handlers Next.js    │        │        (appel cross-origin)       │
│  app/api/bff/[...path]     │        │                                   │
│  → injecte Bearer          │        │                                   │
└───────────┬───────────────┘        │                                   │
            │ /api/v1/*               │                                   │
            ▼                         ▼                                   │
┌───────────────────────────────────────────────────────────────────────┐
│                            DJANGO REST                                  │
│                                                                         │
│  library/  : books, progress/sync-page, annotations, quiz, activation  │
│  core/     : documents/proxy · documents/text · documents/page · tts   │
│  media/    : pdf_service (PyMuPDF) · r2_storage (S3Boto3)               │
│  roles/    : selectors (filtrage droits pays/niveau/audience)          │
└───────────────────────────────┬─────────────────────────────────────────┘
                                 │ boto3 / URLs publiques
                                 ▼
                    ┌────────────────────────────┐
                    │   Cloudflare R2 (S3)        │
                    │   library/books/*.pdf       │
                    │   + audio_file, cover…      │
                    └────────────────────────────┘
                                 ▲
                                 │ OpenAI tts-1 (audio/mpeg)
                    ┌────────────────────────────┐
                    │        OpenAI API           │
                    └────────────────────────────┘
```

Deux chemins réseau coexistent :

- **(A) Chemin BFF** — pour tout ce qui est **authentifié** et **JSON** (métadonnées du livre,
  annotations, progression, quiz). Le front appelle `/api/v1/*`, qui est réécrit vers le Route
  Handler `/api/bff/*`, lequel injecte le `Authorization: Bearer` depuis le cookie HttpOnly
  `laha_access`.
- **(B) Chemin proxy direct** — pour le **PDF binaire**, le **texte** et le **TTS**. Le front
  appelle **directement** Django (`SERVER_ROOT_URL + 'api/documents/proxy/?path=...'`), sans passer
  par le BFF, parce qu'il s'agit de flux binaires volumineux avec support Range.

> ⚠️ C'est ce deuxième chemin qui impose une config CORS/CSP correcte (voir §11).

---

## 3. Le mécanisme des deux modes (`effectiveImmersionMode`)

C'est **le cœur** du composant orchestrateur `page.tsx`. Le choix du mode n'est pas un simple
booléen d'UI : il dépend du contexte (mobile, type de fichier, contenu audio seul).

```ts
// État par défaut : on démarre TOUJOURS en immersion.
const [isImmersionMode, setIsImmersionMode] = useState(true);

// Mais certaines conditions FORCENT le mode normal :
const effectiveImmersionMode =
  (isMobile || isAudioOnly || isOfficeDoc) ? false : isImmersionMode;
```

Interprétation :

- **Par défaut** on est en immersion (`isImmersionMode = true`).
- **Mobile** (`isMobile`) → le FlipBook 3D est trop lourd / peu ergonomique tactile → **mode normal**.
- **Livre audio seul** (`isAudioOnly`, pas de PDF exploitable) → **mode normal** (on affiche le
  player audio, pas le livre feuilletable).
- **Document Office** (`isOfficeDoc`, ex. `.docx`, `.pptx`) → **mode normal** (le FlipBook ne sait
  rendre que du PDF via pdfjs).

Quand l'utilisateur **quitte l'immersion** (bouton fermer / `Échap` dans le FlipBook), on repasse
`isImmersionMode = false` → l'orchestrateur démonte `<FlipBookReader/>` et monte `<Viewer/>` sur la
même page courante.

### Ce qui est partagé vs différent entre les deux modes

| Aspect | Mode immersion | Mode normal |
|---|---|---|
| Composant de rendu | `FlipBookReader` (canvas + `react-pageflip`) | `Viewer` (`@react-pdf-viewer/core`) |
| Source du PDF | **même URL proxy** (`/api/documents/proxy/?path=`) | **même URL proxy** |
| Moteur d'annotations | custom `useAnnotationEngine` (rects x/y/w/h en %) | `@react-pdf-viewer/highlight` (`highlightAreas`) |
| Backend annotations | **le même** (`LibraryAnnotation`), champ `data` JSON | **le même**, format `data` différent |
| TTS | `useTextToSpeech` (mêmes endpoints) | `useTextToSpeech` (mêmes endpoints) |
| Audio narratif | `useAudioPlayer` | `useAudioPlayer` |
| Progression | `libraryApi.syncProgress` toutes les 30 s | idem |
| Sécurité anti-copie | `usePdfReaderSecurity` (zone `.laha-reader-zone`) | idem |

**Point clé** : les deux modes consomment **exactement la même source PDF** (le proxy) et **le même
backend d'annotations**. Seule la couche de présentation (et le format `data` des annotations)
diffère. C'est ce qui permet de basculer sans recharger le fichier.

---

## 4. Arborescence et rôle des fichiers

L'arborescence complète et le tableau détaillé du rôle de chaque fichier sont dans le
**`README.md`** de ce kit (section « Rôle de chaque fichier »). On ne le duplique pas ici.

Rappel des points d'entrée à connaître :

- **Orchestrateur** : `frontend/app/library/view/[id]/page.tsx` (`DocumentReaderPage`).
- **Mode immersion** : `frontend/components/library/FlipBook.tsx` (export `FlipBookReader`).
- **Cœur backend du lecteur** : `backend/core/document_views.py` (proxy + texte + page + info).
- **TTS backend** : `backend/core/tts_views.py`.
- **Modèles** : `backend/library/models.py`.
- **Stockage R2** : `backend/media/r2_storage.py` + service PyMuPDF `backend/media/pdf_service.py`.

---

## 5. Flux de données de bout en bout

### 5.1 Ouverture d'un livre

1. L'utilisateur ouvre `/library/view/<id>`. `page.tsx` lit `id` via `useParams()`.
   - Cas spécial : si `id === 'lesson_pdf'`, l'URL du PDF vient des **query params** (lecture d'un
     PDF de leçon hors catalogue), pas d'un appel `books/{id}`.
2. `page.tsx` appelle `libraryApi.getBook(id)` (chemin BFF authentifié) → reçoit les métadonnées,
   dont `data.file` (l'URL R2 publique du PDF), `audio_file`, `total_pages`, etc.
3. Il construit l'URL proxy :
   ```ts
   const proxyUrl =
     `${SERVER_ROOT_URL}api/documents/proxy/?path=${encodeURIComponent(data.file)}`;
   ```
4. Il calcule `effectiveImmersionMode` (§3) et monte le bon composant en lui passant `proxyUrl`
   comme source PDF.

### 5.2 Chargement du PDF via le proxy (avec Range)

1. Le composant de rendu (FlipBook ou Viewer) demande le PDF à `proxyUrl`.
2. Django `proxy_document` (`core/document_views.py`) reçoit `?path=<url R2>` :
   - télécharge/streame le fichier depuis R2,
   - renvoie le flux avec un **content-type leurre** `application/x-pdf-viewer` (et non
     `application/pdf`, pour gêner le téléchargement direct),
   - **supporte les requêtes HTTP Range** (`Range: bytes=...`) → pdfjs et react-pdf-viewer peuvent
     charger le PDF par tranches (indispensable pour les gros fichiers et le streaming).
3. Côté FlipBook : le PDF est ouvert par `pdfjs-dist` (build **legacy CommonJS**, worker
   `/pdf.worker.min.js`), puis **chaque page est rendue dans un `<canvas>`**, converti en JPEG
   (blob URL), posé sur la feuille. Seules les pages de la fenêtre courante
   (`PAGE_RENDER_WINDOW = 4`) sont rendues.

### 5.3 Bascule immersion → normal

1. L'utilisateur ferme le FlipBook (`Échap` ou bouton). `onClose` → `setIsImmersionMode(false)`.
2. `effectiveImmersionMode` devient `false` → `page.tsx` démonte `FlipBookReader` et monte
   `<Viewer fileUrl={proxyUrl} .../>`.
3. Le PDF n'est **pas re-téléchargé** conceptuellement (même URL proxy, cache navigateur/Range).

### 5.4 TTS (synthèse vocale)

1. `useTextToSpeech` reçoit `{ book, currentPage, rawPdfData, effectiveImmersionMode, viewMode }`.
2. Pour lire une page : il récupère le **texte** via `GET /documents/text/?path=...` (ou
   `document_id=`), qui renvoie `{ total_pages, pages: [{ page_number, text, is_empty }] }`
   (extraction PyMuPDF côté serveur).
   - **Fallback** : si l'appel serveur échoue, extraction locale du texte via pdfjs (`rawPdfData`).
3. Il envoie le texte à `POST /tts/generate/` avec `{ text, voice?, speed? }` → reçoit un blob
   `audio/mpeg` (OpenAI `tts-1`, voix `alloy|echo|fable|onyx|nova|shimmer`, `speed` 0.25–4.0).
4. **Double-buffering / prefetch** : pendant qu'une page est lue, la suivante est déjà synthétisée.
   Gestion du **déverrouillage autoplay** (un premier `play()` déclenché par un geste utilisateur).

### 5.5 Annotations (deux moteurs, un backend)

- **Mode normal** : `@react-pdf-viewer/highlight` produit des `highlightAreas` (zones de surlignage
  liées au layout react-pdf-viewer). Sauvegardées dans `LibraryAnnotation.data` (JSON).
- **Mode immersion** : `useAnnotationEngine` (custom) produit des **rectangles en pourcentage**
  (`{ x, y, w, h }` en % de la page) — indépendants du zoom/canvas. Sauvegardés dans le **même**
  `LibraryAnnotation.data` mais **format différent**.
- Chargement/sauvegarde via `useAnnotations` → `GET/POST /library/annotations/`
  (`{ book, content, color, data }`), suppression via `DELETE /library/annotations/{id}/`.

> Comme le backend est commun mais les formats diffèrent, une annotation créée en immersion ne
> s'affiche pas telle quelle en mode normal (et inversement) : chaque moteur ne sait relire que
> **son** format `data`. C'est le comportement de LahaAcademia — à conserver ou à unifier selon ton
> besoin.

### 5.6 Audio narratif

- `useAudioPlayer` lit le fichier `audio_file` du livre (narration pré-enregistrée, URL R2).
- **Aucun appel API** : c'est un simple `<audio>` piloté (play/pause/seek/mute).
- Vitesses de lecture cyclées : `[1, 1.25, 1.5, 2, 0.75]`.

### 5.7 Progression de lecture

1. À chaque changement de page, `page.tsx` met à jour la page courante.
2. Toutes les **30 s** (et à la fermeture), il appelle
   `POST /library/progress/{book_id}/sync-page/` avec `{ last_page, total_pages }`
   (`libraryApi.syncProgress`).
3. Backend : upsert dans `ReadingProgress` (unique par `(user, book)`).

### 5.8 Quiz de fin de lecture

- À la dernière page, le FlipBook peut afficher `FlipBookQuiz`.
- `GET /library/quizzes/?book=<id>` pour charger, `POST /library/quizzes/{id}/submit/` pour
  soumettre, `GET /library/attempts/?quiz=<id>` pour les tentatives.

---

## 6. Détails backend (Django)

### 6.1 Modèles (`backend/library/models.py`)

Tous héritent de `UUIDTimestampedModel` (`backend/common/models.py`) : `id` en UUID +
`created_at` / `updated_at`.

**`LibraryBook`** (table `library_books`) — le livre :

- `title`, `description`
- `file` : `FileField(upload_to='library/books/')` → stocké sur R2, l'URL publique est exposée
  dans le serializer.
- `thumbnail_url`, `cover_image`, `audio_file` (narration)
- `category`, `subject` (FK), `grade_levels` (M2M)
- `status` : `DRAFT | REVIEW | PUBLISHED | REJECTED`
- `is_international`, `target_countries` (JSON), `target_audiences` (JSON), `is_active`
- `author_profile` (FK)

**`ReadingProgress`** : `user`, `book`, `last_page`, `total_pages` ; `unique_together = (user, book)`.

**`LibraryAnnotation`** : `user`, `book`, `content`, `color` (défaut `'gold'`), `data` (**JSONField** —
c'est ici que sont stockés soit les `highlightAreas` du mode normal, soit les rects % de l'immersion).

**`BookAccess`** : `user`, `book` (→ `PhysicalBook`), `expires_at` — pour l'accès via QR/token
(livres physiques activés).

### 6.2 Endpoints

`library.urls` est monté sous `/api/v1/library/`. `core.urls` (documents + tts) est monté sur
**`/api/`** ET **`/api/v1/`** (les deux fonctionnent).

**Documents / lecteur** (`core/document_views.py`) :

| Méthode | Endpoint | Auth | Rôle |
|---|---|---|---|
| GET/POST | `/documents/proxy/?path=<url R2>` | `AllowAny` ⚠️ | Re-streame le PDF, content-type leurre `application/x-pdf-viewer`, **support Range**. |
| GET | `/documents/text/?path=` ou `?document_id=` | `AllowAny` ⚠️ | Texte page par page : `{total_pages, pages:[{page_number, text, is_empty}]}` (PyMuPDF). |
| GET | `/documents/page/?path=&page=N` | `AllowAny` ⚠️ | Rendu/infos d'une page précise. |
| GET | `/documents/info/?path=` | `AllowAny` ⚠️ | Métadonnées du document (nb pages…). |
| GET | `/documents/preview/` | — | Aperçu (secondaire). |

**TTS** (`core/tts_views.py`) :

| Méthode | Endpoint | Auth | Rôle |
|---|---|---|---|
| POST | `/tts/generate/` | `IsAuthenticated` | `{text, voice?, speed?}` → flux `audio/mpeg` (OpenAI `tts-1`). |

**Bibliothèque** (`library/views.py` + `library/urls.py`) :

| Méthode | Endpoint | Auth | Rôle |
|---|---|---|---|
| GET | `/library/books/` | `IsAuthenticated` (ou `AllowAny` si `?public_catalog=true`) | Catalogue **filtré par droits** (pays/niveau/audience). |
| GET | `/library/books/{id}/` | `IsAuthenticated` | Détail d'un livre. |
| GET | `/library/books/my-books/` | `IsAuthenticated` | Livres de l'utilisateur. |
| POST | `/library/progress/{book_id}/sync-page/` | `IsAuthenticated` | `{last_page, total_pages}` → upsert `ReadingProgress`. |
| GET/POST | `/library/annotations/` | `IsAuthenticated` | Liste / création `{book, content, color, data}`. |
| GET/DELETE | `/library/annotations/{id}/` | `IsAuthenticated` | Détail / suppression. |
| POST | `/library/livre/activate/` | `AllowAny` | Active un livre physique via **token QR** → renvoie un JWT. |
| GET | `/library/livre/{token}/` | — | Accès livre par token. |
| GET | `/library/resources/{resource_id}/pdf/` | — | PDF d'une ressource (corrigé filigrané, voir `pdf_generator.py`). |
| GET | `/library/quizzes/?book=` | `IsAuthenticated` | Quiz d'un livre. |
| POST | `/library/quizzes/{id}/submit/` | `IsAuthenticated` | Soumission des réponses. |
| GET | `/library/attempts/?quiz=` | `IsAuthenticated` | Tentatives. |

### 6.3 Contrôle d'accès (filtrage du catalogue)

Le queryset de `books/` est **filtré selon les droits** de l'utilisateur (voir
`backend/roles/selectors.py`) : pays cible (`target_countries`), niveaux (`grade_levels`),
audiences (`target_audiences`), statut `PUBLISHED`, `is_active`. Un « super client » peut voir plus.

> ⚠️ **Important** : ce filtrage protège **la liste** des livres, mais **pas le fichier PDF
> lui-même** (voir §11). Un utilisateur qui obtient l'URL R2 (via le champ `file` du serializer)
> peut la passer au proxy `AllowAny` et lire le PDF sans repasser par ce filtrage.

### 6.4 Le proxy PDF sécurisé (`proxy_document`)

Objectif : ne **jamais** exposer directement l'URL R2 au `<Viewer>`/pdfjs, et gêner le
téléchargement.

Comportement :

- Reçoit `?path=<url R2>` (ou un chemin relatif).
- Récupère le fichier depuis R2 (via `requests` ou le storage).
- Re-streame la réponse avec :
  - `Content-Type: application/x-pdf-viewer` (leurre — pas `application/pdf`),
  - support de l'en-tête `Range` (répond `206 Partial Content` avec `Content-Range`),
  - en-têtes désactivant la mise en cache agressive si besoin.
- **Permission actuelle : `AllowAny`** (voir §11 pour la correction recommandée).

### 6.5 Extraction de texte (PyMuPDF / fitz)

- `backend/media/pdf_service.py` centralise l'ouverture du PDF depuis R2 et l'extraction via
  **PyMuPDF** (`import fitz`, paquet `pymupdf==1.25.3`).
- `get_pdf_text_all_pages` produit la structure `{total_pages, pages:[{page_number, text, is_empty}]}`
  consommée par le TTS et par la recherche.

### 6.6 TTS OpenAI (`tts_views.py`)

- Lit `OPENAI_API_KEY` depuis les settings.
- Appelle l'API OpenAI `tts-1` : `voice` par défaut (ex. `alloy`), `speed` (0.25–4.0), texte fourni.
- Renvoie le binaire `audio/mpeg` directement au client (streaming de la réponse).
- Permission `IsAuthenticated` (contrairement au proxy).

### 6.7 Stockage R2 (`media/r2_storage.py`)

- `R2MediaStorage(S3Boto3Storage)` : `region_name='auto'`, `querystring_auth=False`.
- `querystring_auth=False` ⇒ les URLs générées sont **publiques et permanentes** (pas d'expiration,
  pas de signature). C'est pratique (URL stable dans `LibraryBook.file`) mais c'est **la cause
  racine** du risque de fuite (§11).

### 6.8 Settings à reprendre (`lahaacademia/settings.py`)

Blocs à **fusionner** dans ton `settings.py` :

```python
# --- Storage Cloudflare R2 (S3-compatible) ---
STORAGES = {
    "default": {"BACKEND": "media.r2_storage.R2MediaStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

AWS_ACCESS_KEY_ID       = config('CLOUDFLARE_R2_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY   = config('CLOUDFLARE_R2_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = config('CLOUDFLARE_R2_BUCKET_NAME')
AWS_S3_ENDPOINT_URL     = config('CLOUDFLARE_R2_ENDPOINT_URL')
AWS_S3_REGION_NAME      = 'auto'
AWS_QUERYSTRING_EXPIRE  = 300
AWS_DEFAULT_ACL         = None
AWS_QUERYSTRING_AUTH    = False   # URLs publiques permanentes

# --- OpenAI (TTS) ---
OPENAI_API_KEY = config('OPENAI_API_KEY')
```

(JWT via `djangorestframework-simplejwt` : garde ta config existante ; le lecteur n'exige rien de
particulier au-delà d'un `access token` transporté en `Bearer`.)

---

## 7. Détails frontend (Next.js)

### 7.1 L'orchestrateur `app/library/view/[id]/page.tsx`

Composant `DocumentReaderPage` (~1360 lignes). Responsabilités :

- Lire `id` via `useParams()` ; cas spécial `id === 'lesson_pdf'` (source PDF via query params).
- Charger les métadonnées du livre (`libraryApi.getBook`), construire `proxyUrl` (§5.1).
- Détecter `isMobile`, `isAudioOnly`, `isOfficeDoc` → calculer `effectiveImmersionMode` (§3).
- Monter **soit** `<FlipBookReader/>` **soit** `<Viewer/>`.
- Instancier les hooks partagés (`useTextToSpeech`, `useAudioPlayer`, `useAnnotations`,
  `usePdfReaderSecurity`) et **descendre** leurs états/handlers en props au composant de rendu.
- Synchroniser la progression toutes les 30 s (`libraryApi.syncProgress`).

> Le PDF brut (`rawPdfData`, un `Uint8Array`) est chargé une fois et partagé : il sert au rendu
> canvas (immersion), au fallback texte pdfjs (TTS) et au `<Viewer>` (normal).

### 7.2 Le composant immersion `components/library/FlipBook.tsx`

**⚠️ Détails d'API qui piègent (à respecter à la lettre) :**

- L'export s'appelle **`FlipBookReader`**, pas `FlipBook`.
- La prop de source PDF est **`fileUrl`** (type `string | Uint8Array`) — **pas** `bookUrl`.
- La page initiale est **`initialPage`** — **pas** `currentPage`.

Signature complète des props :

```ts
type FlipBookReaderProps = {
  fileUrl: string | Uint8Array;   // URL proxy OU données brutes
  bookId: string;
  initialPage: number;
  isMobile: boolean;
  onPageChange: (page: number) => void;
  onClose: () => void;
  onDocumentLoad: (info: { numPages: number }) => void;
  initialAnnotations?: Annotation[];
  onAskQuestion?: (ctx: unknown) => void;
  authorName?: string;

  // Audio narratif
  hasAudio: boolean;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  playbackRate: number;
  onTogglePlaybackRate: () => void;
  audioProgress: number;
  audioDuration: number;
  onSeek: (t: number) => void;

  // TTS
  isTtsActive: boolean;
  isTtsPaused: boolean;
  isFetchingTtsText: boolean;
  onToggleTts: () => void;
  onPauseResumeTts: () => void;
  onStopTts: () => void;
  ttsRate: number;
  onToggleTtsRate: () => void;
};
```

Comportement interne :

- Ouvre le PDF avec `pdfjs-dist` (import dynamique du **build legacy CommonJS**, worker
  `/pdf.worker.min.js`).
- Rend chaque page dans un `<canvas>` → JPEG (blob URL), posé sur la feuille `react-pageflip`.
- **Fenêtrage** : `PAGE_RENDER_WINDOW = 4` (seules les pages autour de la page courante sont rendues).
- Plein écran : `motion.div` en `z-[1000]`.
- Clavier : flèches (tourner), `Échap` (fermer), `h/u/n/e/r` (outils). `disableFlipByClick` et
  `useMouseEvents={false}` (on gère nous-mêmes les clics pour ne pas tourner la page par erreur
  pendant une sélection d'annotation).
- Sous-composants (`components/library/flipbook/`) : `AnnotationLayer`, `AnnotationSidebar`,
  `FloatingDock` (barre d'outils), `SelectionLayer` (création d'annotation), moteur
  `hooks/useAnnotationEngine.ts`, `types.ts`.

### 7.3 Les hooks du lecteur (`app/library/view/[id]/hooks/`)

| Hook | Entrées principales | Rôle |
|---|---|---|
| `useTextToSpeech.ts` | `{ book, currentPage, rawPdfData, effectiveImmersionMode, viewMode }` | Récupère le texte (`/documents/text/`), synthétise (`/tts/generate/`), prefetch/double-buffer, déverrouillage autoplay, fallback pdfjs local. |
| `useAudioPlayer.ts` | (fichier `audio_file`) | Player audio narratif. **Aucune API.** Vitesses cyclées `[1, 1.25, 1.5, 2, 0.75]`. |
| `useAnnotations.ts` | `bookId` | Charge/sauve les annotations via `/library/annotations/`. |
| `usePdfReaderSecurity.ts` | — | Bloque `Ctrl/Cmd+P`, `Ctrl/Cmd+S`, et la copie dans la zone `.laha-reader-zone`. |

### 7.4 Le BFF et le proxy média (`app/api/`)

- **`app/api/bff/[...path]/route.ts`** — proxifie `/api/bff/*` → Django `/api/v1/*` (et
  `/api/bff/legacy/*` → Django `/api/*`). **Injecte** `Authorization: Bearer <token>` en lisant le
  cookie **HttpOnly `laha_access`**. C'est par là que passent tous les appels JSON authentifiés.
- **`app/api/auth/session/route.ts`** — lecture/pose du cookie de session.
- **`app/api/media/[...path]/route.ts`** — proxy média Next.js (secondaire ; **le PDF du lecteur ne
  passe pas par là**, il passe par le proxy Django direct — voir §2 chemin B).

### 7.5 Configuration critique `next.config.mjs` (à fusionner)

Blocs indispensables au lecteur :

```js
// 1) Transpiler les paquets pdfjs / react-pdf-viewer / react-pageflip
transpilePackages: [
  'pdfjs-dist',
  '@react-pdf-viewer/core',
  '@react-pdf-viewer/default-layout',
  '@react-pdf-viewer/page-navigation',
  '@react-pdf-viewer/highlight',
  'react-pageflip',
],

// 2) Forcer le build LEGACY CommonJS de pdfjs (sinon "Unexpected token 'export'")
webpack(config, { dev }) {
  if (dev) config.devtool = 'source-map';
  config.resolve.alias.canvas = false;
  config.resolve.alias['pdfjs-dist'] = 'pdfjs-dist/legacy/build/pdf.js';
  return config;
},

// 3) Slashes finaux préservés pour Django
trailingSlash: false,
skipTrailingSlashRedirect: true,

// 4) Rewrites BFF : /api/v1/* → /api/bff/* (fallback uniquement)
async rewrites() {
  return {
    beforeFiles: [],
    afterFiles: [],
    fallback: [
      { source: '/api/v1/:path*/', destination: '/api/bff/:path*/' },
      { source: '/api/v1/:path*',  destination: '/api/bff/:path*/' },
    ],
  };
},
```

Et surtout la **CSP** (en-tête `Content-Security-Policy` dans `headers()`) doit autoriser :

- `worker-src 'self' blob:` (worker pdfjs),
- `img-src ... blob:` et `media-src 'self' blob:` (pages rendues en blob, audio TTS),
- `script-src ... 'unsafe-eval'` (pdfjs legacy en a besoin),
- `connect-src` doit inclure **l'origine de ton Django** (le proxy est appelé en cross-origin) et
  ton domaine R2 (`https://*.r2.dev` ou ton bucket public), sinon le fetch du PDF est bloqué.
- `images.remotePatterns` doit lister ton hôte R2 (ex. `pub-xxxx.r2.dev`) pour les couvertures.

### 7.6 `tailwind.config.js`, `tsconfig.json`, `globals.css` (à fusionner)

- **Tailwind** : `darkMode: "class"`, `screens.xs: "480px"`, la palette `laha-*` (or/crème/beige…)
  et le mapping des couleurs shadcn sur des variables CSS (`var(--primary)`…). Reprends la palette
  `laha-*` si tu veux le même rendu visuel.
- **`globals.css`** : contient la classe **`.laha-reader-zone`** (ciblée par `usePdfReaderSecurity`)
  et les variables CSS du thème. À fusionner.
- **`tsconfig.json`** : alias de chemins `@/*`. Assure-toi que `@/components`, `@/lib`, `@/hooks`
  résolvent bien.

---

## 8. Dépendances exactes

### 8.1 npm (frontend) — `package.json`

Épinglages **critiques** :

- **`"pdfjs-dist": "3.11.174"`** — version **exacte** (pas de `^`). Le worker dans `public/`
  (`pdf.worker.min.js`) **doit** correspondre à cette version.
- `"react-pageflip": "^2.0.3"`
- `"@react-pdf-viewer/core"`, `"@react-pdf-viewer/default-layout"`,
  `"@react-pdf-viewer/highlight"`, `"@react-pdf-viewer/page-navigation"` : **`^3.12.0"`**
- `"next": "14.2.16"`, `"react": "^18"`
- `"framer-motion": "^12.23.12"` (plein écran immersion)
- `"lucide-react": "^0.454.0"` (icônes), `"sonner": "^1.7.1"` (toasts)
- `"axios": "^1.11.0"` (client API)
- `"idb-keyval": "^6.2.2"` (cache local éventuel), `"jose": "^6.2.3"` (JWT côté route handlers)
- `"class-variance-authority"`, `"clsx"`, `"tailwind-merge"` (utilitaire `cn()`)
- `"katex"`, `"dompurify"` (rendu de contenu), `"three"`, `"@react-three/fiber"`,
  `"@react-three/drei"` (effets 3D éventuels)

devDependencies : `"tailwindcss": "^3.4.17"`, `"postcss": "^8.5"`, `"typescript": "^5"`, `@types/*`.

Script **`postinstall`** (⚠️ voir §11) :

```json
"postinstall": "node -e \"const fs=require('fs');const src='node_modules/pdfjs-dist/build/pdf.worker.min.js';if(fs.existsSync(src))fs.copyFileSync(src,'public/pdf.worker.min.js')\" && node patch_100ms.js"
```

> Le `patch_100ms.js` référencé est **hors périmètre lecteur** (visio 100ms) et **n'est pas fourni**
> dans le kit → retire cette partie de la commande, ou crée un `patch_100ms.js` vide, sinon
> `npm install` échouera.

### 8.2 pip (backend) — `requirements.txt`

```
Django>=5.2,<5.3
djangorestframework>=3.16
djangorestframework-simplejwt>=5.5.0
python-decouple==3.8

# Lecteur : extraction PDF + rendu
pymupdf==1.25.3            # import fitz
Pillow>=12
requests==2.32.3

# Stockage R2 (S3-compatible)
django-storages[s3]==1.14.4
boto3==1.34.84

# TTS
openai>=1.40.0

# Optionnel (corrigés filigranés / activation par QR) :
reportlab>=4.0
qrcode[pil]
```

---

## 9. Variables d'environnement

### Backend (`.env` Django)

```
# Cloudflare R2
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_BUCKET_NAME=...
CLOUDFLARE_R2_ENDPOINT_URL=https://<accountid>.r2.cloudflarestorage.com

# OpenAI (TTS)
OPENAI_API_KEY=sk-...
```

### Frontend (`.env.local` Next.js)

```
# Base de l'API Django (le suffixe /api est retiré automatiquement par next.config)
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api

# Racine serveur utilisée pour le proxy PDF DIRECT (SERVER_ROOT_URL dans le code)
# Doit pointer vers Django, PAS vers le BFF.
NEXT_PUBLIC_SERVER_ROOT_URL=http://127.0.0.1:8000/
```

> Vérifie dans `lib/api.ts` comment `SERVER_ROOT_URL` est dérivé et aligne le nom de la variable
> avec ton code (le point important : le proxy PDF pointe **directement** sur Django).

---

## 10. Installation pas à pas

**Backend**

1. Copie les dossiers `backend/library/`, `backend/media/`, `backend/roles/selectors.py`,
   `backend/common/models.py`, `backend/core/document_views.py`, `backend/core/tts_views.py`.
2. Ajoute `library`, `media` (et `roles`, `common` si absents) dans `INSTALLED_APPS`.
3. **Fusionne** les blocs `STORAGES` / R2 / `OPENAI_API_KEY` dans ton `settings.py` (§6.8).
4. **Fusionne** les routes : monte `core.urls` sur `/api/` **et** `/api/v1/`, et `library.urls` sur
   `/api/v1/library/`.
5. `pip install -r requirements.txt` (§8.2).
6. `python manage.py makemigrations library && python manage.py migrate`.
7. Renseigne le `.env` (§9), puis teste le proxy :
   `GET /api/documents/proxy/?path=<une URL R2 de PDF>` → doit renvoyer le binaire.

**Frontend**

8. Copie `app/library/view/[id]/` (page + hooks), `components/library/` (FlipBook + `flipbook/` +
   `FlipBookQuiz`), les `components/ui/` utilisés, `hooks/use-auth.ts`, `lib/*`, et les
   `app/api/{bff,auth,media}/` si tu n'as pas déjà l'équivalent.
9. **Fusionne** `next.config.mjs` (§7.5), `tailwind.config.js`, `tsconfig.json`, `globals.css`.
10. Ajoute les dépendances (§8.1), **en épinglant `pdfjs-dist` à `3.11.174`**.
11. Place `public/pdf.worker.min.js` (**version 3.11.174**). Corrige/retire le `postinstall`
    `patch_100ms.js` (§8.1).
12. Configure `.env.local` (§9).
13. `npm install` puis `npm run dev`.
14. Ouvre `/library/view/<id>` : tu dois démarrer en **immersion** (FlipBook). `Échap` → **mode
    normal** (Viewer).

Ordre de mise en service recommandé : **proxy PDF → mode normal → mode immersion → TTS →
annotations → audio → progression → quiz**.

---

## 11. ⚠️ Points de vigilance

### 11.1 Sécurité : le proxy et le texte sont en `AllowAny`

`proxy_document`, `get_pdf_text_all_pages`, `get_pdf_page`, `get_pdf_info` sont tous **`AllowAny`**.
Comme les URLs R2 sont **publiques et permanentes** (`querystring_auth=False`) **et** exposées dans
`LibraryBookSerializer.file`, **n'importe qui** connaissant le `path` peut récupérer le PDF **et son
texte** sans authentification — ce qui **contourne** le filtrage pays/niveau/audience du catalogue
(§6.3). De plus, il n'y a **pas de filigrane** sur les PDF numériques (seuls les corrigés
téléchargeables via `download_resource_pdf` sont filigranés).

**Recommandations pour le portage** (au choix, cumulables) :

- Passer le proxy et l'extraction texte en **`IsAuthenticated`** et **re-vérifier les droits de
  lecture** sur le livre correspondant (retrouver le `LibraryBook` à partir du `path`).
- **Signer le `path`** (HMAC + expiration courte) : le front reçoit une URL proxy signée, le proxy
  refuse tout `path` non signé/expiré.
- Ne **pas exposer** l'URL R2 brute dans le serializer public ; ne renvoyer que l'URL proxy signée.
- Envisager un **filigrane dynamique** (email/id utilisateur) sur les pages rendues.

### 11.2 `pdfjs-dist` épinglé à 3.11.174

- Version **exacte**, worker `public/pdf.worker.min.js` **de la même version**. Une montée de
  version casse fréquemment le rendu canvas et l'API `getDocument`.
- Le webpack alias force le **build legacy CommonJS** (`pdfjs-dist/legacy/build/pdf.js`). Ne
  supprime pas cet alias, sinon erreur `Unexpected token 'export'`.

### 11.3 `postinstall` incohérent

Le `postinstall` copie le worker depuis `node_modules/pdfjs-dist/build/` (**non-legacy**) alors que
le code utilise le build **legacy**. En pratique le worker `.min.js` fonctionne, mais sois-en
conscient : si tu as un souci de worker, copie plutôt depuis
`node_modules/pdfjs-dist/legacy/build/pdf.worker.min.js`. Et il lance `patch_100ms.js` **non fourni**
→ à retirer (§8.1).

### 11.4 Proxy PDF appelé en cross-origin direct

Le PDF ne passe **pas** par le BFF : le front appelle Django directement (`SERVER_ROOT_URL`). Donc :

- Configure **CORS** côté Django (`django-cors-headers`) pour autoriser l'origine du front.
- Assure-toi que la **CSP** du front (`connect-src`) autorise l'origine Django (§7.5).
- En prod, mets Django et le front derrière le même domaine (ou sous-domaines maîtrisés) pour
  simplifier CORS/CSP.

### 11.5 Deux formats d'annotations

Une annotation créée en immersion (rects %) n'est **pas** relue par le moteur du mode normal
(`highlightAreas`) et inversement. Comportement d'origine de LahaAcademia. Si tu veux une
compatibilité totale entre modes, il faut **unifier le format `data`** (par ex. tout stocker en
coordonnées % indépendantes du moteur et convertir à l'affichage).

### 11.6 Fichiers globaux à fusionner (rappel)

`settings.py`, `core/urls.py`, `library/urls.py`, `next.config.mjs`, `package.json`,
`tailwind.config.js`, `tsconfig.json`, `globals.css` → **fusion**, jamais écrasement.

---

## 12. Checklist de validation

Coche au fur et à mesure :

- [ ] `GET /api/documents/proxy/?path=<pdf R2>` renvoie le binaire (content-type
      `application/x-pdf-viewer`) et répond `206` sur une requête `Range`.
- [ ] `GET /api/documents/text/?path=...` renvoie `{ total_pages, pages: [...] }`.
- [ ] `POST /api/tts/generate/` (authentifié) renvoie un `audio/mpeg` lisible.
- [ ] `/library/view/<id>` démarre en **mode immersion** (FlipBook, pages qui tournent).
- [ ] Les pages s'affichent (canvas) sans erreur worker pdfjs dans la console.
- [ ] `Échap` (ou bouton fermer) bascule en **mode normal** (`<Viewer>`), même page.
- [ ] Sur mobile / doc Office / audio-seul → démarre **directement en mode normal**.
- [ ] TTS : lecture d'une page, enchaînement automatique sur la suivante (double-buffer).
- [ ] Annotation créée + rechargée (persistée via `/library/annotations/`).
- [ ] Audio narratif : play/pause/seek + changement de vitesse.
- [ ] Progression : `sync-page` appelé (~30 s) et au unmount ; réouverture reprend à la bonne page.
- [ ] `Ctrl/Cmd+P` et `Ctrl/Cmd+S` bloqués dans la zone `.laha-reader-zone`.
- [ ] (Sécurité) décision prise sur le `AllowAny` du proxy (§11.1) — laissé tel quel **en
      connaissance de cause** ou durci.

---

*Fin du guide. Le code réel correspondant à chaque point est dans `backend/` et `frontend/` de ce
kit ; le tableau récapitulatif fichier-par-fichier est dans `README.md`.*
