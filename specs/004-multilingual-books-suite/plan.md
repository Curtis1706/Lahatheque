# Implementation Plan: Gestion et Lecture Multilingue des Livres (Original & Traductions)

**Branch**: `004-multilingual-books-suite` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-multilingual-books-suite/spec.md`

---

## Summary

Modéliser le catalogue multilingue de LAHAThèque en découplant l'entité maîtresse `Ouvrage` de ses déclinaisons linguistiques (`OuvrageLanguageVersion`), ingérer et synchroniser automatiquement les 1 600+ ouvrages du bucket Cloudflare R2 (`laha-books-production`), exposer une API REST rétrocompatible pour les partenaires SaaS, enrichir le studio maquettiste et le studio audio, et offrir aux lecteurs un accès universel toutes langues avec un sélecteur de langue fluide dans la liseuse protégée par filigrane DRM.

---

## Technical Context

**Language/Version**: Python 3.10+ (Backend Django) / TypeScript 5.x (Frontend Next.js App Router)  
**Primary Dependencies**: Django 5.x, Django REST Framework, PyMuPDF (fitz), boto3, Next.js 14+, React 18, TailwindCSS, Lucide React, PDF.js  
**Storage**: PostgreSQL (Neon) avec contraintes d'intégrité et index UUID, Cloudflare R2 (`laha-books-production`) pour les fichiers PDF, EPUB, couvertures et flux audio  
**Testing**: `python manage.py test` (Backend DRF), Vitest/Playwright (Frontend)  
**Target Platform**: Serveurs Web Docker / Coolify sous reverse proxy Traefik, navigateurs desktop et mobiles  
**Project Type**: Application Web complète (Backend Django REST API + Frontend Next.js SSR/CSR + Proxy BFF)  
**Performance Goals**: Bascule de langue dans la liseuse < 1,5 seconde ; latence endpoints catalogue < 250 ms ; streaming Range Requests 206 instantané  
**Constraints**: Rétrocompatibilité absolue (zéro breaking change) pour les SaaS partenaires ; extraction documentaire IA sur les 15 premières et 15 dernières pages ; aucune couleur hexadécimale en dur (tokens sémantiques exclusifs) ; zéro émoji ; interdiction totale des données mockées  
**Scale/Scope**: 1 600+ livres maîtres R2, déclinaisons bilingues EN/FR, gestion de 5 dashboards métiers (Admin, Maquettiste/Chef, Logistique, Finance/Auteurs, Partenaires)  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe Constitutionnel | Statut | Justification / Mesure de Conformité |
| :--- | :---: | :--- |
| **I. Lecture Intégrale Exhaustive** | **Conforme** | 100% des fichiers analysés et modèles Django existants inspectés sans troncature ni survol. |
| **III. Rigueur Backend & Typage Statique** | **Conforme** | PEP 8 strict, Type Hints sur l'ensemble des méthodes, serializers et services Django. |
| **IV. Format de Réponse API Unifié** | **Conforme** | Toutes les réponses JSON respectent strictement `{"success": true, "data": {}, "error": null}`. |
| **V. Performance ORM & Anti-N+1** | **Conforme** | UUIDv4, index explicites sur `language` et `is_original`, contrainte d'unicité `unique_ouvrage_per_language`, utilisation de `prefetch_related('language_versions')`. |
| **VI. Sécurité & Authentification** | **Conforme** | Cookies HttpOnly sécurisés, OAuth2 Client Credentials pour les partenaires, validation de session étanche. |
| **VII. Protection DRM & Streaming R2** | **Conforme** | Streaming binaire fragmenté par Range Requests (206), filigrane dynamique personnalisé perpétué lors du changement de langue, téléchargement interdit. |
| **VIII. Tokens Sémantiques & Finitions Chic** | **Conforme** | Zéro code hexadécimal en dur. Utilisation exclusive des tokens `navy`, `gold`, `border`, `background`. Typographie officielle Playfair Display / Poppins. |
| **X. Interdiction Absolue de Tout Émoji** | **Conforme** | Zéro émoji dans le code, la spec, les contrats et les interfaces. Remplacement par Lucide React (`Languages`, `BookOpen`, `Headphones`). |
| **XI. Traçabilité & Observabilité** | **Conforme** | Logs d'ingestion étape par étape `[Import R2 ETAPE X/Y]`, gestion non-bloquante avec statut `draft` en cas d'erreur ponctuelle. |
| **XII. Interdiction des Mocks & 21st.dev** | **Conforme** | Données 100% réelles issues de l'API Django via le proxy BFF, recherche préalable 21st.dev multi-clés pour les composants UI. |

---

## Project Structure

### Documentation (this feature)

```text
specs/004-multilingual-books-suite/
├── spec.md              # Spécification fonctionnelle et clarifications
├── plan.md              # Ce plan d'implémentation technique
├── research.md          # Phase 0 : Recherche et décisions d'architecture
├── data-model.md        # Phase 1 : Modèle de données et schéma relationnel
├── quickstart.md        # Phase 1 : Guide d'exécution et commandes de test
├── contracts/           # Phase 1 : Contrats d'API OpenAPI
│   └── catalog-reader-api.yaml
└── checklists/
    └── requirements.md  # Checklist de qualité de spécification
```

### Source Code (repository layout)

```text
lahatheque-backend/
├── apps/
│   ├── catalog/
│   │   ├── models.py                  # Ouvrage + Nouveau modèle OuvrageLanguageVersion
│   │   ├── serializers.py             # Sérialiseurs multilingues enrichis
│   │   └── management/
│   │       └── commands/
│   │           └── import_r2_multilingual_books.py  # Commande d'ingestion R2 & IA
│   ├── reader/
│   │   ├── views.py                   # Vues liseuse, streaming avec filtre lang, sessions
│   │   └── serializers.py             # Sérialiseurs session avec paramètre language
│   ├── ai_engine/
│   │   └── services/
│   │       └── openai_service.py      # Extraction PyMuPDF 15 premières/dernières pages + IA
│   └── orders/
│       └── models.py                  # LigneCommande avec selected_language
└── config/

lahatheque-frontend/
├── app/
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
- Préservation de la rétrocompatibilité des SaaS partenaires.

### Phase 1 : Conception Détaillée & Contrats (Terminé)
- Définition du schéma relationnel et des contraintes dans [data-model.md](./data-model.md).
- Rédaction des contrats d'API dans [contracts/catalog-reader-api.yaml](./contracts/catalog-reader-api.yaml).
- Élaboration du guide d'exécution rapide dans [quickstart.md](./quickstart.md).

### Phase 2 : Tâches d'Implémentation (Prochaine étape via `/speckit-tasks`)
- Création du fichier `tasks.md` décomposant l'implémentation en lots de travail indépendants et parallélisables.
