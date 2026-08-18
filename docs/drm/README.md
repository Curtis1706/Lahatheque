# Plan d'implémentation — DRM & protection de la lecture (LAHAthèque)

> **CONFIDENTIEL — Document de travail.** Diffusion restreinte à l'équipe projet.
> Ce dossier décrit *le plan* : aucune ligne de code n'est modifiée par ces documents.
> L'implémentation ne commence qu'après validation.

---

## 1. Objet

Ce dossier planifie la mise en œuvre du **§6 du cahier des charges** (v3.2) — la protection
anti-piratage de la LAHAthèque :

- filigrane **visible** + **invisible** (tatouage par utilisateur : ID + e-mail + IP + appareil) ;
- **DRM** : contrôle d'accès, chiffrement au repos, restriction de téléchargement, lecture en flux ;
- **audio** chiffré / diffusé en streaming uniquement ;
- **Word / Office** en lecture seule (jamais le fichier source) ;
- **traçabilité intégrale** : chaque accès horodaté (utilisateur + IP + appareil + code fichier).

Le fil conducteur est une consigne précise du commanditaire : **« tu as parlé du LCP mais du DRM /
aussi pour la lecture du PDF public c'est pour la lecture du PDF ».** Deux clarifications en
découlent, traitées ci-dessous : (a) **DRM ≠ LCP** ; (b) le canal `/api/pdf` **est** le canal de
lecture du PDF, et c'est lui qu'il faut sécuriser.

---

## 2. DRM ≠ LCP — la distinction structurante

C'est le point le plus important du dossier, et la source de confusion la plus fréquente.


|         | **DRM** (la catégorie)                                                                                                                                                 | **LCP** (une implémentation)                                                                                                                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nature  | *Digital Rights Management* : **tout** mécanisme de contrôle d'usage d'un contenu (chiffrement, licence, filigrane, traçabilité, restriction d'impression/copie…). | *Readium LCP* : **un** standard de DRM interopérable pour EPUB/PDF, porté par l'EDRLab, lisible par les applis certifiées Readium (Thorium…).                                                                                                             |
| Portée | Concept générique. On**fait toujours du DRM** dès qu'on restreint un usage.                                                                                          | Cas particulier de DRM, utile**surtout pour l'interopérabilité** entre applis de lecture tierces.                                                                                                                                                           |
| Coût   | **0 €** — on l'implémente avec des briques libres (chiffrement, JWT, filigrane serveur…).                                                                           | Le serveur`readium-lcp-server` est libre, **mais** un **certificat de fournisseur de contenu de production** suppose une **convention payante avec l'EDRLab** (le certificat de test n'est pas utilisable en production). *À confirmer auprès de l'EDRLab.* |

**Conséquence de conception.** LAHAthèque possède **son propre lecteur web** (le PDF est rendu
par `pdfjs-dist` dans notre application, mode immersion FlipBook + mode normal). Nous n'avons donc
**pas besoin de l'interopérabilité LCP** : personne d'autre que notre viewer n'ouvre le fichier.

> **Décision.** On implémente un **DRM propriétaire « LCP-like », gratuit et fondé sur des
> standards universels**, qui couvre l'intégralité du §6. Le **vrai LCP** est **différé** : on le
> garde comme *adaptateur futur* (le fichier [`lcp_client.py`](../../lahatheque-backend/apps/protection/lcp_client.py)
> reste un stub d'adaptateur), activable si un besoin d'interopérabilité + un budget EDRLab
> apparaissent. Aucune fonctionnalité du cahier des charges n'en dépend.

Dans l'UI éditeur ([`protection-config-card.tsx`](../../lahatheque-frontend/components/features/publisher/protection-config-card.tsx)),
le libellé actuel « Protection DRM LCP Readium » est donc **une promesse d'interopérabilité que
le back n'honore pas encore**. Le plan prévoit soit de reformuler le libellé (« Protection DRM
renforcée »), soit de brancher l'interrupteur `lcp_drm_enabled` sur notre profil de protection
renforcé — voir [`03-frontend-next.md`](03-frontend-next.md).

---

## 3. Le canal de lecture du PDF à sécuriser

La consigne « pour la lecture du PDF public c'est pour la lecture du PDF » lève l'ambiguïté :
**`/api/pdf` n'est pas un reliquat de démo, c'est LE canal par lequel le PDF est lu.**

Chaîne prouvée par le code :

```
lib/services/library.ts   →  book.file = "/api/pdf?file=….pdf"
        │
app/catalog/reader/[id]/page.tsx   →  setRawPdfData(data.file) → <FlipBook fileUrl=…> / <Viewer>
        │
components/library/FlipBook.tsx    →  pdfjs.getDocument({ url: absoluteUrl })   ← c'est ici que ça se charge
        │
app/api/pdf/route.ts               →  lit public/<basename> et renvoie les octets
```

Or [`app/api/pdf/route.ts`](../../lahatheque-frontend/app/api/pdf/route.ts) dans son état actuel :

- **aucune authentification** ;
- sert **n'importe quel fichier** de `public/` par son *basename* ;
- `Accept-Ranges: 'none'` → **pas de lecture en flux par plages** (Range) ;
- `Cache-Control: public, max-age=31536000, immutable` → **met en cache public** un contenu qui
  devrait être privé.

**Sécuriser « la lecture du PDF » = remplacer ce canal** par un proxy authentifié qui relaie vers
un **endpoint de streaming Django** (déchiffrement + filigrane + Range 206 + traçabilité). C'est
l'objet des documents [`01`](01-architecture-cible.md) (cible) et [`03`](03-frontend-next.md) (front).

---

## 4. Principes directeurs

1. **Zéro dépense.** Uniquement des briques libres / open-source. Aucun service payant : le TTS
   OpenAI `tts-1` du kit de portage (payant) ne sera pas **remplacé** par une solution gratuite.
2. **Standards universels** plutôt que solutions maison exotiques (voir §5).
3. **Le serveur est la frontière de confiance.** Le fichier en clair, non filigrané, **ne quitte
   jamais** le serveur. Tout ce qui vit dans le navigateur est considéré comme exposé.
4. **Défense en profondeur + honnêteté.** Les protections *côté client* (anti-copie, anti-impression,
   anti-clic droit) sont **dissuasives, pas infaillibles** : une capture d'écran reste possible.
   Le filigrane par utilisateur et la traçabilité sont la vraie parade (dissuasion + imputabilité).
5. **Conformité aux conventions** Next.js 16 (App Router, Route Handlers) et Django 5.2 / DRF, et
   réutilisation maximale de l'existant (`AccessService`, `ProtectionConfig`, `TraceAcces`, BFF).

---

## 5. Standards mobilisés (tous libres)


| Besoin                     | Standard / brique                                                    | Référence     |
| ---------------------------- | ---------------------------------------------------------------------- | ----------------- |
| Chiffrement au repos       | **AES-256-GCM** (lib `cryptography`)                                 | NIST SP 800-38D |
| Jetons d'accès courts     | **JWT**                                                              | RFC 7519        |
| Lecture en flux par plages | **HTTP Range / 206 Partial Content**                                 | RFC 7233        |
| Streaming audio            | **HLS** (segments + playlist, via `ffmpeg`)                          | RFC 8216        |
| Filigrane PDF              | **PyMuPDF (fitz)** — texte visible + métadonnées/couche invisible | lib libre       |
| Métadonnées catalogue    | **ONIX** (déjà en place)                                           | EDItEUR         |
| Office → PDF              | **LibreOffice headless** (`soffice --convert-to pdf`)                | libre           |

---

## 6. Les deux profils de protection (aperçu)

Le détail est dans [`01-architecture-cible.md`](01-architecture-cible.md). En résumé :

- **Profil Standard** — PDF déchiffré + filigrané, servi en Range 206, **couche texte conservée**
  (indispensable au TTS, à la recherche et aux annotations). Protection = chiffrement au repos +
  filigrane + traçabilité + anti-copie dissuasif.
- **Profil Renforcé** — chaque page rendue en **image** (pas de couche texte dans le PDF servi) ;
  le texte nécessaire au TTS/annotations passe par un **endpoint texte authentifié** distinct.
  Réservé aux ouvrages les plus sensibles ; c'est le profil qu'on associera à `lcp_drm_enabled`.

---

## 7. Inventaire des défauts connus à corriger (traçabilité du plan)

Ces points sont repris et résolus dans les documents `02`/`03`/`04`.


| #  | Défaut                                                                            | Fichier                                                                  | Doc de résolution |
| ---- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | -------------------- |
| D1 | `/api/pdf` : pas d'auth, sert tout `public/`, pas de Range, cache public           | [`app/api/pdf/route.ts`](../../lahatheque-frontend/app/api/pdf/route.ts) | 03                 |
| D2 | `TraceAccesView.post` renvoie `{"status":"recorded"}` **sans persister**           | `apps/protection/views.py`                                               | 02                 |
| D3 | `watermark.py` est un **stub** (`# TODO return pdf_bytes`)                         | `apps/protection/watermark.py`                                           | 02                 |
| D4 | `ProtectionConfig` front ≠ back (champs divergents) → couche de mapping          | `lib/types/publisher.ts` ↔ `apps/protection/models.py`                  | 02 + 03            |
| D5 | Office via`view.officeapps.live.com` → **exige une URL publique** = fuite         | `app/catalog/reader/[id]/page.tsx`                                       | 02 + 03            |
| D6 | Réglages manquants :`STORAGES`, `FIELD_ENCRYPTION_KEY`, `cryptography`            | `config/settings/base.py`                                                | 02                 |
| D7 | `next.config.ts` minimal : pas de CSP/en-têtes sécurité, pas de transpile pdfjs | `next.config.ts`                                                         | 03                 |
| D8 | KIT : proxy PDF Django en`AllowAny` + URLs R2 publiques/permanentes                | `KIT_PORTAGE_LECTEUR`                                                    | 01 + 02            |
| D9 | KIT : TTS = OpenAI`tts-1` **payant** → à remplacer (contrainte 0 €)             | `core/tts_views.py`                                                      | 02                 |

---

## 8. Structure du dossier & ordre de lecture


| Document                                               | Contenu                                                                                                                                                                                       | État       |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| **`README.md`** (ce fichier)                           | Synthèse, DRM vs LCP, périmètre, standards, défauts                                                                                                                                       | ✅          |
| [`01-architecture-cible.md`](01-architecture-cible.md) | Architecture cible : profils, flux de lecture de bout en bout, frontières de confiance, traitement par format                                                                                | ✅          |
| `02-backend-django.md`                                 | Plan back : réglages,`ProtectionConfig` + mapping, AES-GCM, `watermark.py`, endpoint stream Range, `TraceAcces`, licences/prêts/appareils, audio HLS, Office→PDF, adaptateur LCP différé | ⏳ à venir |
| `03-frontend-next.md`                                  | Plan front : sécurisation de`/api/pdf`, reader, FlipBook/Viewer via proxy, `next.config` CSP/transpile, réconciliation `ProtectionConfig`, anti-copie dissuasif                             | ⏳ à venir |
| `04-phasage-taches.md`                                 | Découpage en phases, quick-wins sécurité, dépendances, limites honnêtes, variables d'environnement                                                                                       | ⏳ à venir |

> Rédaction **incrémentale et versionnée** (un à deux documents par itération) pour éviter toute
> perte de contexte, conformément à la consigne « va pas à pas, ou coupe ça en plusieurs tâches ».
