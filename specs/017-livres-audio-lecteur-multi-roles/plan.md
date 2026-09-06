# Implementation Plan: Livres Audio et Lecteur Multi-Rôles

**Branch**: `017-livres-audio-lecteur-multi-roles` | **Date**: 2026-09-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-livres-audio-lecteur-multi-roles/spec.md`

## Summary

Cette fonctionnalité met en place le support complet des livres audio sur LAHAThèque à travers tous les rôles de la plateforme :
1. **Frontend Client & Étudiant** : Ajout des boutons « Lire » et « Écouter » sur le catalogue (`/student/catalog`), la bibliothèque (`/student/library`), la vue d'ensemble (`/student`), et déploiement d'un lecteur audio universel haute fidélité (`LahathequeAudioPlayerCard`) inspiré du composant `SpotifyCard` adapté aux couleurs LAHAThèque (`navy`, `gold`, `Playfair Display`, `Poppins`, sans émoji) avec un mini-lecteur persistant flottant (`PersistentAudioPlayer`) géré par un contexte global (`AudioPlayerContext`).
2. **Gestion Multi-Rôles & Extrait Gratuit** : Autorisation d'écoute intégrale sans restriction financière pour l'Administrateur, le Chef Maquettiste, le Maquettiste et l'Auteur sur son livre ; accès à un extrait gratuit plafonné à 180s pour les auditeurs n'ayant pas encore acheté le format audio.
3. **Téléversement & Remplacement Audio** : Enrichissement des formulaires d'édition d'ouvrage (`/layout-artist/deposits`, `/chief-layout/deposit`, `/admin/catalog`) avec upload et substitution de fichier audio vers Cloudflare Stream sécurisé.

## Technical Context

**Language/Version**: Python 3.10+ (Backend Django REST Framework), TypeScript 5.0+ (Frontend Next.js 14+ App Router).

**Primary Dependencies**: 
- Backend : Django REST Framework, Cloudflare Stream API Client (`requests`), `django-cors-headers`.
- Frontend : React 18, Next.js App Router, TailwindCSS, Lucide React (`lucide-react`), HLS.js (pour la lecture native des flux HLS m3u8 sur tous navigateurs).

**Storage**: PostgreSQL (Neon), Cloudflare Stream (vidéo/audio HLS avec jetons signés), Cloudflare R2 (fichiers sources et couvertures).

**Testing**: Tests d'intégration API Django (`pytest` / `python manage.py test apps.audio`), validation end-to-end manuelle selon le guide [quickstart.md](./quickstart.md).

**Target Platform**: Web responsive mobile-first (375px à 1920px+).

**Project Type**: Application Web Découplée (Next.js BFF + Django REST API).

**Performance Goals**: Démarrage du flux de streaming audio sous 1.5s, scrubbing temporel réactif sous 200ms, persistance de progression en arrière-plan sans bloquer l'UI.

**Constraints**: Respect strict de la charte LAHAThèque (zéro code hexadécimal en dur, tokens sémantiques `bg-navy`, `bg-gold`, typographie `Playfair Display`/`Poppins`, zéro émoji, mobile-first obligatoire).

**Scale/Scope**: Catalogue complet d'ouvrages, 5 dashboards concernés (Étudiant, Maquettiste, Chef Maquettiste, Admin, Auteur).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe Constitutionnel | Statut | Justification |
|---|---|---|
| I. Cadrage Métier & Cahier des Charges | PASS | Conforme aux fiches BF2, BF3, BG3, BG5, BG8 du cahier des charges. |
| II. Traque des Non-Dits & Cas Limites | PASS | Extrait 180s cadré, mini-lecteur persistant résolvant la coupure sonore lors de la navigation, gestion du remplacement audio. |
| III. Rigueur Backend & Typage Statique | PASS | Type hints stricts sur toutes les méthodes d'accès et serializers DRF. |
| IV. Format de Réponse API Unifié | PASS | Structure `{ "success": true, "data": {...}, "error": null }` respectée. |
| V. Performance ORM & Anti-N+1 | PASS | `prefetch_related('audio_tracks')` et index composites sur `AudioListeningSession`. |
| VI. Sécurité & Authentification | PASS | Cookies HttpOnly JWT, URLs signées Cloudflare Stream à durée limitée (3600s), aucune exposition de fichier direct. |
| VII. Protection DRM & Streaming | PASS | Flux HLS fragmenté avec token signé, téléchargement direct totalement proscrit. |
| VIII. Tokens Sémantiques & 21st.dev | PASS | Classes `bg-navy`, `bg-gold`, typographie Playfair/Poppins, adaptation du composant SpotifyCard sans aucun code hexadécimal en dur. |
| IX. Code Documenté & Commenté | PASS | Docstrings exhaustives sur tous les composants et fonctions. |
| X. Interdiction Absolue de Tout Émoji | PASS | Zéro émoji dans le code, le front, les logs et la documentation. Exclusivement des icônes Lucide. |
| XI. Observabilité & Journalisation | PASS | Logs balisés `[AUDIO ETAPE X/Y]`, traçabilité des écoutes dans `TraceAcces`. |

## Project Structure

### Documentation (this feature)

```text
specs/017-livres-audio-lecteur-multi-roles/
├── plan.md              # Ce document
├── research.md          # Résultats de recherche et décisions d'architecture
├── data-model.md        # Modèles de données, entités et relations
├── quickstart.md        # Scénarios de validation pas-à-pas
├── contracts/
│   └── audio-api.yaml   # Contrat OpenAPI des endpoints audio
└── checklists/
    └── requirements.md  # Liste de contrôle qualité
```

### Source Code Impacted

```text
lahatheque-backend/
├── apps/
│   ├── audio/
│   │   ├── models.py         # AudioTrack, AudioListeningSession
│   │   ├── views.py          # AudioStreamSessionView, AudioTrackUploadView (support du remplacement), AudioListeningProgressView
│   │   ├── serializers.py    # Serializers typés avec preview_limit
│   │   └── urls.py           # Routes API REST
│   ├── catalog/
│   │   └── views.py          # Exposition enrichie de has_audio_version et tracks
│   └── protection/
│       └── access_service.py # Règles de bypass d'accès audio pour admin/maquettistes/auteurs

lahatheque-frontend/
├── components/
│   ├── features/
│   │   ├── audio/
│   │   │   ├── audio-player-context.tsx          # Contexte global de lecture audio
│   │   │   ├── lahatheque-audio-player-card.tsx  # Composant adapté de SpotifyCard aux tokens LAHAThèque
│   │   │   └── persistent-audio-player.tsx       # Mini-lecteur persistant en bas d'écran
│   │   ├── student/
│   │   │   ├── book-card.tsx                     # Boutons « Lire » et « Écouter »
│   │   │   └── catalog-book-modal.tsx            # Choix du format et écoute extrait
│   │   └── layout-artist/
│   │       └── audio-replacement-dropzone.tsx    # Composant d'upload/remplacement audio
├── lib/
│   ├── services/
│   │   └── audio.ts                              # Fonctions d'appel API BFF audio typées
│   └── types/
│       └── student.ts / catalog.ts               # Types TypeScript enrichis
└── app/
    ├── (dashboard)/
    │   ├── student/
    │   │   ├── page.tsx                          # Section reprise d'écoute
    │   │   ├── catalog/page.tsx                  # Badges et boutons audio
    │   │   └── library/page.tsx                  # Filtre format + boutons Lire/Écouter
    │   ├── layout-artist/
    │   ├── chief-layout/
    │   └── admin/catalog/page.tsx                # Édition et remplacement audio
    └── (public)/
        └── listen/[id]/page.tsx                  # Vue immersive dédiée du lecteur audio
```

## Complexity Tracking

Aucune violation de constitution à déclarer.
