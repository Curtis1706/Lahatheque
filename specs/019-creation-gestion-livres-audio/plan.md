# Implementation Plan: Création et Gestion des Livres Audio Multi-Rôles (Studio Audio & Commande Multi-Formats)

**Branch**: `019-creation-gestion-livres-audio` | **Date**: 2026-09-07 | **Spec**: [spec.md](./spec.md)

**Input**: Spécification complète issue de `/specs/019-creation-gestion-livres-audio/spec.md` et maquette de référence LAHA Éditions (`lahaeditions.com/admin`).

---

## Summary

Mettre en place le Studio Audio complet permettant la création et gestion de livres audio selon le standard de LAHA Éditions (double voix Homme/Femme, livre complet et chapitrage), avec :
1. **Double mode de création** : Rattachement direct à un ouvrage existant (réutilisant titre, couverture et métadonnées) ou création autonome.
2. **Workflow multi-rôles** : Pages de gestion dédiées pour le Maquettiste (création/dépôt), Chef Maquettiste (contrôle acoustique/validation), Juriste (validation des droits et redevances), et Administrateur (supervision globale).
3. **Commande multi-formats flexible** : Possibilité pour les lecteurs d'acheter et combiner librement le papier, le numérique et l'audio en une seule commande.
4. **Continuité d'écoute** : Widget d'écoute sur la vue d'ensemble `/student` et reprise en un clic vers `/listen/[id]`.

---

## Technical Context

**Language/Version**: Python 3.10+ (Backend Django 4.2+), TypeScript 5.0+ (Frontend Next.js 14+ App Router).  
**Primary Dependencies**:
- Backend : Django REST Framework, boto3 (Client Cloudflare R2 / S3), mutagen (analyse audio).
- Frontend : React 18, Next.js App Router, Tailwind CSS, Lucide React (icônes), sonner (toasts), framer-motion.  
**Storage**: PostgreSQL (Neon) avec contraintes d'intégrité, Cloudflare R2 (compatible S3) pour le stockage audio et couvertures.  
**Testing**: pytest / Django TestCase pour les endpoints, TypeScript typecheck (`pnpm tsc --noEmit`) pour le frontend.  
**Target Platform**: Web responsive (Mobile-first de 375px à desktop 1440px+).  
**Project Type**: Application Web monolithique découplée (Frontend Next.js + Backend Django REST API).  
**Performance Goals**: Temps de réponse API < 200 ms, génération d'URL présignée R2 < 80 ms, streaming audio instantané sans latence.  
**Constraints**: Zéro émoji dans le code et les interfaces, zéro couleur hexadécimale codée en dur (utilisation stricte des tokens `navy`, `gold`, `border-border`), streaming audio protégé (téléchargement direct bloqué).  
**Scale/Scope**: Prise en charge de centaines d'ouvrages audio avec des fichiers volumineux jusqu'à 500 Mo par piste sans saturation mémoire.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

- [x] **I. Cadrage Métier & Documentation** : Conforme aux spécifications du cahier des charges LAHAThèque et à la maquette de production LAHA Éditions.
- [x] **II. Traque des Non-Dits & Scalabilité** : Prise en compte du rattachement vs création autonome, des téléversements asynchrones présignés et de la reprise d'écoute.
- [x] **III. Rigueur Backend & Typage** : Type hints stricts sur toutes les méthodes, serializers et views.
- [x] **IV. Format API Unifié** : Réponses sous format strict `{ success, data, error }`.
- [x] **V. Performance ORM & Requêtes N+1** : Clés UUIDv4, requêtes optimisées avec `select_related()` et `prefetch_related()`.
- [x] **VI. Sécurité Réseau & Cookies** : Authentification par JWT dans cookies HttpOnly sécurisés.
- [x] **VII. Stockage Cloudflare R2** : Fichiers audio stockés sur R2 avec streaming fragmenté et URLs présignées.
- [x] **VIII. Frontend & Tokens Sémantiques** : Respect absolu des tokens `navy`, `gold`, polices Playfair Display / Poppins, recherche 21st.dev.
- [x] **IX. Code Commenté** : Documentation claire sur chaque composant et service.
- [x] **X. Interdiction Absolue des Émojis** : Zéro émoji toléré, icônes Lucide React exclusivement.
- [x] **XI. Traçabilité & Observabilité** : Journalisation de chaque étape d'upload et feedback visuel immédiat.

---

## Project Structure

### Documentation (cette fonctionnalité)

```text
specs/019-creation-gestion-livres-audio/
├── spec.md              # Spécification fonctionnelle (/speckit-specify)
├── plan.md              # Plan d'implémentation (/speckit-plan)
├── research.md          # Décisions techniques et architecturales (Phase 0)
├── data-model.md        # Modèle de données et schéma des entités (Phase 1)
├── quickstart.md        # Guide de test et scénarios de validation (Phase 1)
├── contracts/           # Spécification des contrats d'API
│   ├── audio-studio-api.md
│   └── multi-format-order-api.md
└── checklists/
    └── requirements.md  # Validation de la spécification
```

### Source Code Impacté

```text
# Backend Django
lahatheque-backend/
├── apps/
│   ├── audio/
│   │   ├── models.py            # Extension AudioTrack (voice_gender, track_type)
│   │   ├── serializers.py       # Serializers Studio Audio & pistes
│   │   ├── urls.py              # Routes /api/v1/audio/upload-url/, /books/, etc.
│   │   └── views.py             # AudioStudioViews, transition de workflow, upload direct
│   ├── catalog/
│   │   ├── models.py            # Champs audio_status, price_audio_eur sur Ouvrage
│   │   └── views.py             # Sélecteur d'ouvrages pour rattachement
│   └── commerce/
│       ├── models.py            # LigneCommande multi-formats
│       └── views.py             # Création de commande multi-formats

# Frontend Next.js
lahatheque-frontend/
├── app/(dashboard)/
│   ├── layout-artist/
│   │   ├── audio/
│   │   │   ├── page.tsx         # Gestion des livres audio du maquettiste
│   │   │   └── new/page.tsx     # Studio Audio (création / rattachement)
│   ├── chief-layout/
│   │   └── audio/page.tsx       # Validation technique Chef Maquettiste
│   ├── legal-reviewer/
│   │   └── audio/page.tsx       # Validation juridique & redevances Juriste
│   ├── admin/
│   │   └── audio/
│   │       ├── page.tsx         # Gestion globale des livres audio Admin
│   │       └── new/page.tsx     # Studio Audio direct Admin
│   └── student/
│       └── page.tsx             # Widget d'écoutes en cours sur le Dashboard
├── components/
│   ├── dashboard-sidebar.tsx    # Ajout de l'onglet Livres audio pour les rôles
│   ├── features/
│   │   ├── audio/
│   │   │   └── audio-studio-form.tsx # Formulaire studio audio réutilisable (2 colonnes)
│   │   ├── student/
│   │   │   ├── unified-book-order-modal.tsx # Cases à cocher multi-formats
│   │   │   └── recent-audio-widget.tsx      # Widget de reprise d'écoute
│   │   └── wholesaler/
│   │       └── wholesale-order-modal.tsx    # Sélection multi-formats
└── lib/
    ├── types/audio.ts           # Types TypeScript du Studio Audio
    └── services/audio.ts        # Appels API Studio Audio et R2 upload
```

---

## Complexity Tracking

*Toutes les exigences architecturales respectent la Constitution LAHAThèque et la structure modulaire existante sans aucune violation.*
