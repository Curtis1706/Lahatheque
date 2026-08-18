# 01 — Architecture cible

> Doc de travail confidentiel. Voir [`README.md`](README.md) pour le contexte (DRM ≠ LCP, 0 €).
> Ce document décrit **la cible** ; le détail d'implémentation par couche est dans `02`/`03`.

---

## 1. Vue d'ensemble

Un principe unique gouverne l'architecture : **le fichier en clair et non filigrané ne quitte
jamais le serveur.** Le navigateur ne reçoit qu'un dérivé *déchiffré à la volée, filigrané au nom
de l'utilisateur, servi en flux, et tracé*.

```
┌─────────────────────────── NAVIGATEUR (zone non fiable) ───────────────────────────┐
│  pdfjs-dist 3.11.174  ·  FlipBook (immersion) / @react-pdf-viewer (normal)          │
│  disableStream/disableAutoFetch = true · PDF_RANGE_CHUNK_SIZE = 256 Kio             │
└───────────────┬─────────────────────────────────────────────────────────────────────┘
                │  GET /api/bff/catalog/books/{id}/stream/        Range: bytes=0-262143
                ▼
┌───────────────────────── Next.js 16 — Route Handler (BFF) ───────────────────────────┐
│  app/api/bff/[...path]/route.ts                                                       │
│  • lit le cookie HttpOnly `laha_access`                                               │
│  • injecte  Authorization: Bearer <access>                                            │
│  • relaie la requête ET l'en-tête Range vers Django                                   │
│  • impose Cache-Control: private, no-store sur la réponse protégée                    │
└───────────────┬───────────────────────────────────────────────────────────────────────┘
                │  GET /api/v1/catalog/books/{id}/stream/   (Bearer + Range)
                ▼
┌───────────────────────────── Django 5.2 / DRF (zone fiable) ──────────────────────────┐
│  BookStreamView (catalog)                                                              │
│   1. AccessService.check_user_book_access(user, id)        → 403 si pas de droit       │
│   2. Résout/produit le dérivé PROTÉGÉ propre à (user, book, version de config) :       │
│        a. lit l'objet CHIFFRÉ depuis R2                                                 │
│        b. déchiffre AES-256-GCM en mémoire (clé jamais exposée)                        │
│        c. PyMuPDF : filigrane VISIBLE + tatouage INVISIBLE (ID/e-mail/IP/appareil)     │
│        d. matérialise le dérivé (cache temporaire chiffré) → clé de cache = hash       │
│   3. Sert le dérivé en 206 Partial Content selon l'en-tête Range (RFC 7233)            │
│   4. TraceAcces.objects.create(user, ouvrage, ip, device, access_type, page…)          │
└───────────────┬───────────────────────────────────────────────────────────────────────┘
                │  boto3 / django-storages (S3 API)
                ▼
┌───────────────────────────── Cloudflare R2 (objets CHIFFRÉS) ─────────────────────────┐
│  L'objet stocké est le PDF chiffré AES-256-GCM. Une URL R2 volée = octets inertes.    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

Différences majeures avec l'existant (défauts D1/D8 du README) :

- le navigateur **ne parle plus** à `/api/pdf` (fichier local `public/`) mais au **BFF authentifié** ;
- le navigateur **ne parle jamais en direct** au proxy Django (contrairement au KIT) : tout passe
  par le BFF même origine → CORS/CSP maîtrisés, jeton jamais exposé au JS ;
- R2 ne contient **que du chiffré** : on supprime la dépendance aux « URLs R2 publiques/permanentes »
  du KIT (D8).

---

## 2. Le point d'architecture décisif : filigrane + Range = dérivé matérialisé

Le front charge le PDF **par plages de 256 Kio** (Range). Or on **ne peut pas** filigraner un
morceau de 256 Kio isolé : le filigrane s'applique au **document PDF entier**. Deux exigences
apparemment contradictoires — servir par plages, mais filigraner le tout — se concilient ainsi :

> **On matérialise UNE fois un dérivé filigrané par (utilisateur × ouvrage × version de config),
> puis on le sert en Range 206.** On ne re-filigrane pas à chaque plage.

- **Clé de cache** : `sha256(book_id · user_id · protection_config_version · profil)`.
- **Stockage du dérivé** : cache temporaire **chiffré** (disque éphémère chiffré, ou objet R2
  chiffré à TTL court). Jamais un fichier clair sur disque.
- **Invalidation** : changement de `ProtectionConfig` → nouvelle version → nouvelle clé → nouveau
  dérivé (l'ancien expire par TTL).
- **Première requête** (cache froid) : produit le dérivé (déchiffrement + filigrane), puis sert la
  plage. Requêtes suivantes : lecture directe de la plage dans le dérivé (rapide).
- **Filigrane invisible par utilisateur** : c'est ce qui **justifie** un dérivé *par utilisateur*
  (le tatouage porte ID/e-mail/IP/appareil) → l'imputabilité est garantie même si le fichier fuit.

> **Compromis assumé** : un dérivé par utilisateur = plus de calcul/stockage qu'un fichier unique.
> C'est le prix de l'imputabilité exigée au §6. Atténuations : cache à TTL, production paresseuse
> (lazy), file de tâches Celery pour les gros PDF. Détaillé dans `02`.

---

## 3. Les deux profils de protection

Le choix du profil est **piloté par `ProtectionConfig`** (par ouvrage), configuré par l'éditeur.

### 3.1 Profil **Standard** (défaut)

- PDF **déchiffré + filigrané**, **couche texte conservée**.
- Servi en **Range 206**, en-têtes `private, no-store`.
- Anti-copie / anti-impression **dissuasifs** côté client (hook `usePdfReaderSecurity`).
- **Pourquoi garder le texte** : le TTS, la recherche plein texte et les annotations (surlignage
  d'un passage) **ont besoin de la couche texte**. La retirer casserait ces fonctions.
- **Menace résiduelle** : la couche texte reste extractible par un outil tiers. Parade =
  filigrane + traçabilité (on sait *qui* a lu) plutôt que blocage illusoire.

### 3.2 Profil **Renforcé** (ouvrages sensibles, associé à `lcp_drm_enabled`)

- Chaque page est **rendue en image** dans le PDF servi → **aucune couche texte** exfiltrable.
- Le texte requis pour le **TTS et les annotations** est fourni par un **endpoint texte
  authentifié distinct** (`/api/v1/catalog/books/{id}/text/?page=N`), lui aussi tracé — jamais
  livré en bloc, page par page, sous contrôle d'accès.
- Filigrane visible **incrusté dans l'image** (donc non supprimable par édition de calque).
- Coût : rendu plus lourd (images), pas de recherche native dans le PDF. Réservé au haut du panier.


| Critère                       | Standard              | Renforcé                                       |
| -------------------------------- | ----------------------- | ------------------------------------------------- |
| Couche texte dans le PDF servi | Oui                   | **Non** (pages images)                          |
| TTS / annotations              | via la couche texte   | via endpoint texte authentifié séparé        |
| Recherche plein texte          | Oui (native pdfjs)    | Non                                             |
| Exfiltration du texte          | possible (dissuadée) | fortement contrainte                            |
| Coût rendu / stockage         | modéré              | élevé                                         |
| Déclencheur                   | défaut               | `lcp_drm_enabled` = vrai (ou marquage éditeur) |

---

## 4. Flux de lecture PDF — séquence détaillée

1. L'utilisateur ouvre `/catalog/reader/[id]`. La page appelle `libraryApi.getBook(id)` (via BFF).
2. Le back renvoie les **métadonnées** + une **référence de flux** (p. ex. `stream_url = /api/v1/catalog/books/{id}/stream/`, déjà retournée par `AccessService`) — **pas** les octets,
   **pas** d'URL R2.
3. Le front construit l'URL **via le BFF** (`/api/bff/catalog/books/{id}/stream/`) et la passe à
   `pdfjs.getDocument({ url })` (FlipBook) ou au `<Viewer>`.
4. pdfjs émet des requêtes **Range** (256 Kio). Le BFF y ajoute le `Bearer` et relaie le `Range`.
5. Django vérifie le droit (`AccessService`), résout/produit le dérivé protégé (§2), répond **206**.
6. Django **persiste** un `TraceAcces` (corrige D2) : utilisateur, IP, `user_agent`, empreinte
   appareil, `access_type='read_online'`, `page_number` si connu, `timestamp`.
7. Le viewer affiche les pages filigranées. TTS/annotations : selon le profil (couche texte ou
   endpoint texte authentifié).

> **Note d'auth réseau** : le back exige `IsAuthenticated` (fin de D8). L'accès *métier* (droit de
> lire tel ouvrage) reste délégué à `AccessService` (achat payé, abonnement, affiliation validée).

---

## 5. Frontières de confiance & modèle de menace (résumé)


| Zone               | Confiance      | Ce qui y circule                                                              |
| -------------------- | ---------------- | ------------------------------------------------------------------------------- |
| R2                 | stockage       | **uniquement du chiffré** (AES-256-GCM)                                      |
| Django             | **fiable**     | clairs éphémères en mémoire, clés, filigrane, décision d'accès, traces |
| BFF Next (serveur) | fiable         | jeton Bearer (jamais exposé au client), relais Range                         |
| Navigateur         | **non fiable** | dérivé filigrané, couche texte (profil Standard), UI                       |

Menaces couvertes : URL R2 devinée/volée (→ chiffré inerte), accès sans droit (→ 403), partage de
fichier (→ filigrane nominatif + trace), écoute réseau (→ HTTPS + jeton court). **Non couvert
techniquement** : capture d'écran, photo de l'écran — traités par **dissuasion** (filigrane
visible nominatif) et **imputabilité** (traçabilité). Ce point est répété honnêtement dans `04`.

---

## 6. Traitement cible par format


| Format            | Cible                                                                                                | Détail                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **PDF**           | Endpoint stream Range 206 + filigrane + profils (§3)                                                | cœur du dispositif                                                                                                                                  |
| **Audio**         | **HLS** (segments) + playlist signée par **JWT court** ; jamais de fichier complet téléchargeable | `ffmpeg` (libre). Remplace le « chiffrement audio LCP » annoncé dans l'UI par une protection réelle et gratuite. Détail dans `02`.              |
| **Word / Office** | **Conversion serveur → PDF** (LibreOffice headless), puis **même pipeline PDF**                    | **supprime** la dépendance à `view.officeapps.live.com` qui exige une URL publique (fuite D5). Le `.docx`/`.pptx` source n'est **jamais** exposé. |
| **EPUB**          | Lecture via notre viewer,**profil Renforcé** par défaut                                            | pas d'export du fichier ; si interopérabilité tierce exigée un jour → adaptateur LCP différé (README §2).                                     |

---

## 7. Composants cible (récapitulatif, mapping vers l'existant)

### Back (Django)

- `catalog` : **`BookStreamView`** (nouveau) — stream Range 206 + orchestration profil/filigrane/trace.
- `catalog` : **`BookTextView`** (nouveau, profil Renforcé) — texte par page, authentifié + tracé.
- `apps/protection/watermark.py` — **implémentation réelle** visible + invisible (corrige D3).
- `apps/protection/models.py` — `ProtectionConfig` **enrichi** (appareils, durée prêt, position,
  opacité, flags) ; `TraceAcces` **réellement persisté** (corrige D2) ; modèles **Licence/Prêt/
  Appareil** (nouveaux). Détail `02`.
- `apps/protection/access_service.py` — **réutilisé tel quel** (décision d'accès déjà correcte).
- `apps/protection/lcp_client.py` — **conservé en stub d'adaptateur différé** (README §2).
- Chiffrement au repos AES-256-GCM (service dédié) + `STORAGES`/`FIELD_ENCRYPTION_KEY`/
  `cryptography` dans les réglages (corrige D6). Détail `02`.
- Audio HLS + Office→PDF (LibreOffice) + TTS **gratuit** en remplacement d'OpenAI (corrige D9).

### Front (Next.js 16)

- `app/api/pdf/route.ts` — **remplacé** par un proxy authentifié (ou supprimé au profit du BFF).
  Corrige D1. Détail `03`.
- `app/catalog/reader/[id]/page.tsx`, `FlipBook.tsx`, `Viewer` — pointer vers l'URL **BFF stream**.
- `next.config.ts` — **CSP + en-têtes sécurité** + `transpilePackages` pdfjs + rewrites BFF
  (fusion avec le `next.config.mjs` du KIT). Corrige D7. Détail `03`.
- Couche de **mapping `ProtectionConfig`** front ↔ back (corrige D4). Détail `03`.

---

## 8. Ce que ce document fige

- Un **seul** canal de lecture, **authentifié**, **chiffré au repos**, **filigrané par utilisateur**,
  **servi en Range**, **tracé**.
- **Deux profils** (Standard/Renforcé) pilotés par `ProtectionConfig`.
- **Tous les formats** ramenés au pipeline PDF (Office converti ; audio en HLS ; EPUB via viewer).
- **LCP différé** sans bloquer aucune exigence du §6.

➡️ Suite : [`02-backend-django.md`](02-backend-django.md) (implémentation back détaillée).
