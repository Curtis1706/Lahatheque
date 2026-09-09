# Implementation Plan: Gestion et Lecture Multilingue des Livres (Original & Traductions)

**Branch**: `004-multilingual-books-suite` | **Date**: 2026-09-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-multilingual-books-suite/spec.md`

---

## Summary

Modéliser le catalogue multilingue de LAHAThèque en découplant l'entité maîtresse `Ouvrage` de ses déclinaisons linguistiques (`OuvrageLanguageVersion`), ingérer et synchroniser automatiquement les 1 600+ ouvrages du bucket Cloudflare R2 (`laha-books-production`), convertir automatiquement et sans surcharge CPU les EPUBs en PDFs vectoriels haute fidélité (PyMuPDF + verrou Redis + cache R2), exposer une API REST partenaire ultra-rapide grâce au cache Redis serveur (sans dépendance Redis chez les partenaires), mettre à jour exhaustivement le guide officiel d'intégration [GUIDE_INTEGRATION_ACCES_MIXTE.md](../../GUIDE_INTEGRATION_ACCES_MIXTE.md) et les 3 SDKs, et offrir aux lecteurs un accès universel toutes langues avec un sélecteur de langue fluide dans la liseuse protégée par filigrane DRM.

---

## Technical Context

**Language/Version**: Python 3.10+ (Backend Django) / TypeScript 5.x (Frontend Next.js App Router)  
**Primary Dependencies**: Django 5.x, Django REST Framework, PyMuPDF (fitz), boto3, redis-py, Next.js 14+, React 18, TailwindCSS, Lucide React, PDF.js  
**Storage & Cache**:
- PostgreSQL (Neon) avec contraintes d'intégrité et index UUID (`catalog_ouvrage_language_version`).
- Redis (sur le serveur LAHAThèque) : verrou distribué anti-thundering herd pour conversion EPUB (`laha:epub_convert:<hash>`) et cache de catalogue partenaire (`partner:catalog:*`, TTL 15 min).
- Cloudflare R2 : bucket `laha-books-production` en lecture seule (fichiers sources) et bucket `lahatheque` en écriture (PDFs convertis depuis EPUB `r2_key_pdf`, couvertures WebP, audio).
**Testing**: `python manage.py test` (Backend DRF), Vitest/Playwright (Frontend)  
**Target Platform**: Serveurs Web Docker / Coolify sous reverse proxy Traefik, navigateurs desktop et mobiles  
**Project Type**: Application Web complète (Backend Django REST API + Frontend Next.js SSR/CSR + Proxy BFF)  
**Performance Goals**:
- Bascule de langue dans la liseuse < 1,5 seconde.
- Latence endpoints catalogue partenaire < 20 ms grâce au cache Redis serveur LAHAThèque.
- Streaming Range Requests 206 instantané avec filigrane nominatif dynamique.
- Temps d'accès aux EPUBs déjà convertis < 100 ms via Cloudflare R2 (`r2_key_pdf`).
**Constraints**:
- Rétrocompatibilité absolue (zéro breaking change) pour les SaaS partenaires.
- Mise à jour obligatoire et exhaustive du [GUIDE_INTEGRATION_ACCES_MIXTE.md](../../GUIDE_INTEGRATION_ACCES_MIXTE.md) et des SDKs Python, TypeScript et PHP.
- En contexte M2M partenaire, `is_owned` et `has_digital_access` sont strictement forcés à `false` avec court-circuit de `AccessService`.
- Aucune couleur hexadécimale en dur (tokens sémantiques exclusifs `navy`, `gold`, `border`, `background`).
- Zéro émoji : icônes Lucide React exclusivement.
- Interdiction totale des données mockées.
**Scale/Scope**: 1 600+ livres maîtres R2, déclinaisons bilingues EN/FR, liseuse hébergée et 5 dashboards métiers.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe Constitutionnel | Statut | Justification / Mesure de Conformité |
| :--- | :---: | :--- |
| **I. Lecture Intégrale Exhaustive** | **Conforme** | 100% des fichiers analysés, modèles Django, adaptateurs R2 et vues inspectés du début à la fin. |
| **III. Rigueur Backend & Typage Statique** | **Conforme** | PEP 8 strict, Type Hints sur l'ensemble des méthodes, serializers et services Django. |
| **IV. Format de Réponse API Unifié** | **Conforme** | Toutes les réponses JSON respectent strictement `{"success": true, "data": {}, "error": null}`. |
| **V. Performance ORM & Anti-N+1** | **Conforme** | Index explicites sur `language` et `is_original`, contrainte d'unicité `unique_ouvrage_per_language`, utilisation systématique de `prefetch_related('language_versions')`. |
| **VI. Cache Redis & Verrous Distribués** | **Conforme** | Verrou anti-thundering herd pour la conversion EPUB et cache de catalogue partenaire opéré sur le VPS LAHAThèque sans exiger Redis chez le partenaire. |
| **VII. Sécurité & Authentification** | **Conforme** | Cookies HttpOnly sécurisés, OAuth2 Client Credentials pour les partenaires, validation de session étanche. |
| **VIII. Protection DRM & Streaming R2** | **Conforme** | Streaming binaire fragmenté Range 206, cascade de langue `?lang=` > session metadata > langue originale, filigrane dynamique perpétué lors du changement de langue. |
| **IX. Tokens Sémantiques & Finitions Chic** | **Conforme** | Zéro code hexadécimal en dur. Utilisation exclusive des tokens `navy`, `gold`, `border`, `background`. Typographie officielle Playfair Display / Poppins. |
| **X. Interdiction Absolue de Tout Émoji** | **Conforme** | Zéro émoji dans le code, la spec, les contrats et les interfaces. Remplacement par Lucide React (`Languages`, `BookOpen`, `Headphones`). |
| **XI. Traçabilité & Observabilité** | **Conforme** | Logs d'ingestion étape par étape `[Import R2 ETAPE X/Y]`, gestion non-bloquante avec statut `draft` en cas d'erreur ponctuelle. |
| **XII. Interdiction des Mocks & Données Réelles** | **Conforme** | Données 100% réelles issues de l'API Django via le proxy BFF, aucun bouchon statique. |

---

## Project Structure

### Documentation (this feature)

```text
specs/004-multilingual-books-suite/
├── spec.md              # Spécification fonctionnelle et clarifications (Session 2026-09-08 & 2026-09-09)
├── plan.md              # Ce plan d'implémentation technique
├── research.md          # Phase 0 : Recherche et décisions d'architecture
├── data-model.md        # Phase 1 : Modèle de données et schéma relationnel
├── quickstart.md        # Phase 1 : Guide d'exécution et commandes de test
├── contracts/           # Phase 1 : Contrats d'API OpenAPI
│   └── catalog-reader-api.yaml
└── checklists/
    └── requirements.md  # Checklist de qualité de spécification (25/25 validés)

Documentation Partenaire Référente :
└── GUIDE_INTEGRATION_ACCES_MIXTE.md  # Guide officiel partenaire SaaS mis à jour (FR-024)
```

### Source Code (repository layout)

```text
lahatheque-backend/
├── apps/
│   ├── catalog/
│   │   ├── models.py                  # Ouvrage + OuvrageLanguageVersion
│   │   ├── serializers.py             # Sérialiseurs multilingues enrichis
│   │   └── management/
│   │       └── commands/
│   │           └── import_r2_multilingual_books.py  # Commande d'ingestion R2 & IA
│   ├── reader/
│   │   ├── views.py                   # PartnerCatalogListView (Redis cache), ReaderProtectedStreamView (cascade ?lang=)
│   │   └── serializers.py             # Sérialiseurs session avec paramètre language
│   ├── protection/
│   │   ├── source_adapter.py          # Conversion EPUB vectorielle PyMuPDF + verrou Redis + persistance R2
│   │   └── derived_materializer.py    # Matérialisation dérivé filigrané par langue
│   ├── ai_engine/
│   │   └── services/
│   │       └── openai_service.py      # Extraction PyMuPDF 15 premières/dernières pages + IA
│   └── orders/
│       └── models.py                  # LigneCommande avec selected_language
└── config/

lahatheque-frontend/
├── app/
│   ├── (public)/page.tsx              # Vitrine d'accueil : 6 nouveautés dynamiques avec priorité français
│   ├── (dashboard)/
│   │   ├── layout-artist/
│   │   │   ├── deposits/new/page.tsx  # Formulaire maquettiste avec bascule Original/Traduction
│   │   │   └── audio/new/page.tsx     # Studio audio avec choix de langue de narration
│   │   ├── chief-layout/
│   │   │   └── validation/page.tsx    # File de validation avec badge Traduction vs Original
│   │   └── admin/
│   │       └── catalog/               # Gestion catalogue avec badge FR • EN et toggle is_original
│   ├── read/
│   │   └── [token]/page.tsx           # Liseuse avec sélecteur de langue dans le header
│   └── api/
│       └── bff/                       # Proxy BFF Next.js vers endpoints Django
├── components/
│   ├── features/
│   │   ├── reader/
│   │   │   └── reader-language-selector.tsx # Sélecteur de langue liseuse
│   │   └── audio/
│   │       └── audio-studio-form.tsx  # Formulaire studio audio avec champ langue narration
│   └── ui/                            # Composants UI conformes tokens sémantiques
└── lib/
    ├── services/                      # Services API connectés (zéro mock)
    └── types/                         # Interfaces TypeScript fidèles aux modèles Django
```

---

## Plan d'Exécution par Phases

### Phase 0 : Recherche et Fondations (Terminé)
- Validation des décisions d'architecture dans [research.md](./research.md).
- Résolution de la détection Original/Traduction (Option A) et extraction de couverture (première page PDF).
- Préservation de la rétrocompatibilité des SaaS partenaires et court-circuit M2M.
- Pipeline de conversion EPUB vers PDF avec verrou Redis et persistance R2 (`r2_key_pdf`).
- Mise en cache Redis serveur du catalogue partenaire et levée de limite rigide.

### Phase 1 : Conception Détaillée & Contrats (Terminé)
- Définition du schéma relationnel et des contraintes dans [data-model.md](./data-model.md).
- Rédaction des contrats d'API dans [contracts/catalog-reader-api.yaml](./contracts/catalog-reader-api.yaml).
- Élaboration du guide d'exécution rapide dans [quickstart.md](./quickstart.md).
- Validation de la checklist qualité des spécifications dans [checklists/requirements.md](./checklists/requirements.md) (25/25 items validés).

### Phase 2 : Tâches d'Implémentation (Prochaine étape via `/speckit-tasks`)
- Création du fichier `tasks.md` décomposant l'implémentation en lots de travail indépendants et parallélisables.
