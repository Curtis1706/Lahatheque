# Kit de portage — Lecteur LahaAcademia (mode immersion + mode normal)

Ce kit contient **le code réel** et les **consignes d'implémentation** pour reproduire à
l'identique le lecteur de livres de LahaAcademia dans un autre projet utilisant la **même
stack** (Django REST + Next.js App Router + React/TypeScript).

Le lecteur possède **deux modes** :

1. **Mode immersion** — livre 3D plein écran qui tourne les pages (FlipBook `react-pageflip`),
   chaque page rendue en `<canvas>` depuis le PDF via `pdfjs-dist`.
2. **Mode normal** — lecteur PDF sécurisé (`@react-pdf-viewer/core`) affiché quand on quitte
   l'immersion, avec anti-copie/anti-impression.

Les deux modes partagent : le **proxy PDF sécurisé**, la **synthèse vocale (TTS)**, les
**annotations**, l'**audio narratif**, et la **synchronisation de progression**.

---

## Par où commencer

1. Lis d'abord **`GUIDE_IMPLEMENTATION.md`** — c'est le document principal. Il explique le
   fonctionnement, l'architecture, les flux de données, et donne les étapes d'installation
   pas à pas.
2. Reviens ensuite ici pour retrouver **quel fichier joue quel rôle** (tableau ci-dessous).
3. Copie les fichiers dans ton projet en respectant l'arborescence `backend/` et `frontend/`.

> ⚠️ **Ne copie pas aveuglément.** Certains fichiers (`settings.py`, `core/urls.py`,
> `library/urls.py`, `next.config.mjs`, `package.json`, `tailwind.config.js`, `tsconfig.json`)
> sont **globaux au projet** : il faut en **fusionner** le contenu pertinent, pas écraser tes
> propres fichiers. Voir la section « Installation pas à pas » du guide.

---

## Arborescence du kit

```
KIT_PORTAGE_LECTEUR/
├── README.md                     ← ce fichier (index + rôles)
├── GUIDE_IMPLEMENTATION.md       ← guide détaillé (à lire en premier)
│
├── backend/                      (14 fichiers — Django)
│   ├── common/models.py
│   ├── core/document_views.py
│   ├── core/tts_views.py
│   ├── core/urls.py
│   ├── lahaacademia/settings.py
│   ├── library/models.py
│   ├── library/pdf_generator.py
│   ├── library/serializers.py
│   ├── library/signals.py
│   ├── library/urls.py
│   ├── library/views.py
│   ├── media/pdf_service.py
│   ├── media/r2_storage.py
│   └── roles/selectors.py
│
└── frontend/                     (31 fichiers — Next.js)
    ├── app/api/auth/session/route.ts
    ├── app/api/bff/[...path]/route.ts
    ├── app/api/media/[...path]/route.ts
    ├── app/globals.css
    ├── app/library/view/[id]/hooks/useAnnotations.ts
    ├── app/library/view/[id]/hooks/useAudioPlayer.ts
    ├── app/library/view/[id]/hooks/usePdfReaderSecurity.ts
    ├── app/library/view/[id]/hooks/useTextToSpeech.ts
    ├── app/library/view/[id]/page.tsx          ← orchestrateur du lecteur
    ├── components/library/FlipBook.tsx          ← export: FlipBookReader (mode immersion)
    ├── components/library/FlipBookQuiz.tsx
    ├── components/library/flipbook/AnnotationLayer.tsx
    ├── components/library/flipbook/AnnotationSidebar.tsx
    ├── components/library/flipbook/FloatingDock.tsx
    ├── components/library/flipbook/SelectionLayer.tsx
    ├── components/library/flipbook/hooks/useAnnotationEngine.ts
    ├── components/library/flipbook/types.ts
    ├── components/ui/badge.tsx
    ├── components/ui/button.tsx
    ├── hooks/use-auth.ts
    ├── lib/api-student-qa.ts
    ├── lib/api.ts
    ├── lib/auth-token.ts
    ├── lib/logger.ts
    ├── lib/utils.ts
    ├── next.config.mjs
    ├── package.json
    ├── public/pdf.worker.min.js
    ├── public/pdf.worker.min.mjs
    ├── tailwind.config.js
    └── tsconfig.json
```

---

## Rôle de chaque fichier

### Backend (Django)

| Fichier | Rôle |
|---|---|
| `common/models.py` | `UUIDTimestampedModel` — base abstraite (id UUID + created/updated) héritée par tous les modèles de la bibliothèque. |
| `core/document_views.py` | **Cœur du lecteur côté serveur.** Proxy PDF sécurisé (`/documents/proxy/` avec support Range), extraction du texte page par page (`/documents/text/` via PyMuPDF), rendu d'une page, infos du document. |
| `core/tts_views.py` | Synthèse vocale : `/tts/generate/` appelle OpenAI `tts-1` et renvoie un flux `audio/mpeg`. |
| `core/urls.py` | Montage des routes `documents/*` et `tts/*` (monté sur `/api/` **et** `/api/v1/`). |
| `lahaacademia/settings.py` | Config storage R2 (`STORAGES`), clés OpenAI, JWT. **À fusionner.** |
| `library/models.py` | Modèles `LibraryBook`, `ReadingProgress`, `LibraryAnnotation`, `BookAccess`. |
| `library/pdf_generator.py` | Génération/filigrane PDF (corrigés téléchargeables). Secondaire pour le lecteur. |
| `library/serializers.py` | `LibraryBookSerializer` (expose `file`, `audio_file`…), serializers annotations/progression. |
| `library/signals.py` | Signaux (ex. post-save livre). Secondaire. |
| `library/urls.py` | Routes `/library/*` : books, progress/sync-page, annotations, activation par token, quiz. |
| `library/views.py` | ViewSets : catalogue filtré par droits, synchro progression, CRUD annotations, quiz, accès par QR/token. |
| `media/pdf_service.py` | Service PyMuPDF partagé (ouverture PDF depuis R2, extraction texte/pages). |
| `media/r2_storage.py` | `R2MediaStorage` (S3Boto3, region `auto`, URLs publiques permanentes). |
| `roles/selectors.py` | Sélecteurs de droits (`is_super_client`, filtrage pays/niveau/audience). |

### Frontend (Next.js)

| Fichier | Rôle |
|---|---|
| `app/library/view/[id]/page.tsx` | **Orchestrateur** `DocumentReaderPage`. Choisit mode immersion vs normal (`effectiveImmersionMode`), construit l'URL proxy, monte `<Viewer>` ou `<FlipBookReader>`, synchronise la progression. |
| `app/library/view/[id]/hooks/useTextToSpeech.ts` | Hook TTS (texte via `/documents/text/`, synthèse via `/tts/generate/`, prefetch/double-buffer, fallback pdfjs local). |
| `app/library/view/[id]/hooks/useAudioPlayer.ts` | Lecteur audio narratif (fichier `audio_file` du livre, vitesses 0.75–2×). |
| `app/library/view/[id]/hooks/useAnnotations.ts` | Chargement/sauvegarde des annotations (backend `LibraryAnnotation`). |
| `app/library/view/[id]/hooks/usePdfReaderSecurity.ts` | Sécurité : bloque Ctrl/Cmd+P, Ctrl/Cmd+S, copie dans `.laha-reader-zone`. |
| `components/library/FlipBook.tsx` | **Mode immersion.** Export `FlipBookReader` : livre 3D plein écran, rend chaque page PDF en canvas (fenêtrage lazy). |
| `components/library/FlipBookQuiz.tsx` | Quiz de fin de lecture affiché dans l'immersion. |
| `components/library/flipbook/AnnotationLayer.tsx` | Couche d'affichage des annotations en immersion (rects en %). |
| `components/library/flipbook/AnnotationSidebar.tsx` | Panneau latéral listant les annotations. |
| `components/library/flipbook/FloatingDock.tsx` | Barre d'outils flottante (surlignage, TTS, audio…). |
| `components/library/flipbook/SelectionLayer.tsx` | Couche de sélection pour créer une annotation en immersion. |
| `components/library/flipbook/hooks/useAnnotationEngine.ts` | Moteur d'annotations custom du mode immersion. |
| `components/library/flipbook/types.ts` | Types partagés du FlipBook. |
| `app/api/bff/[...path]/route.ts` | **BFF** : proxifie `/api/bff/*` → Django `/api/v1/*`, injecte le `Bearer` depuis le cookie HttpOnly `laha_access`. |
| `app/api/auth/session/route.ts` | Route de session (lecture/pose du cookie d'auth). |
| `app/api/media/[...path]/route.ts` | Proxy média Next.js (secondaire ; le PDF passe par le proxy Django direct). |
| `hooks/use-auth.ts` | Hook d'authentification côté client. |
| `lib/api.ts` | Client axios + `libraryApi` (books, syncProgress, annotations…). |
| `lib/api-student-qa.ts` | Client questions/réponses élève (bouton « poser une question »). |
| `lib/auth-token.ts` | Gestion du token d'accès. |
| `lib/logger.ts` / `lib/utils.ts` | Utilitaires (`cn()` etc.). |
| `components/ui/badge.tsx` / `button.tsx` | Primitives UI shadcn utilisées par le lecteur. |
| `app/globals.css` | Styles globaux (incl. `.laha-reader-zone`, variables CSS du thème). |
| `next.config.mjs` | **Config critique** : `transpilePackages` pdfjs/react-pdf-viewer, alias webpack legacy pdfjs, rewrites BFF, CSP, `images.remotePatterns`. **À fusionner.** |
| `package.json` | Dépendances exactes (dont `pdfjs-dist` **épinglé 3.11.174**) + `postinstall` (copie worker). **À fusionner.** |
| `tailwind.config.js` | Thème (palette `laha-*`, `darkMode:"class"`). **À fusionner.** |
| `tsconfig.json` | Config TypeScript (paths `@/*`). **À fusionner.** |
| `public/pdf.worker.min.js` / `.mjs` | Worker pdfjs servi statiquement (doit correspondre à la version 3.11.174). |

---

## Points de vigilance (résumé — détails dans le guide)

- **`pdfjs-dist` est épinglé à `3.11.174`** (version exacte, pas `^`). Le worker dans `public/`
  doit correspondre. Ne pas mettre à jour sans re-tester le rendu.
- **Le proxy PDF Django est en `AllowAny`** et les URLs R2 sont publiques/permanentes → le PDF
  et son texte sont accessibles sans authentification si on connaît le chemin. À corriger dans
  le portage (voir « Points de vigilance » du guide).
- **Le proxy PDF est appelé en cross-origin direct** (pas via le BFF) → CORS/CSP à configurer.
- **`postinstall`** copie le worker depuis `build/` (non-legacy) alors que webpack utilise le
  build **legacy** ; il lance aussi `patch_100ms.js` (non inclus, hors périmètre lecteur).

---

Détails complets, flux de données, tableaux d'endpoints, modèles et étapes d'installation :
voir **`GUIDE_IMPLEMENTATION.md`**.
