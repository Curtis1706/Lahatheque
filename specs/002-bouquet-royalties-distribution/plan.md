# Implementation Plan: Répartition Dynamique des Redevances sur Bouquets Documentaires

**Branch**: `002-bouquet-royalties-distribution` | **Date**: 2026-09-08 | **Spec**: [specs/002-bouquet-royalties-distribution/spec.md](file:///e:/Lahatheque/specs/002-bouquet-royalties-distribution/spec.md)

**Input**: Feature specification from `/specs/002-bouquet-royalties-distribution/spec.md`

## Summary

Cette fonctionnalité met en œuvre le calcul réel et la double restitution visuelle (camembert vectoriel d'audience + barres horizontales des redevances) des bouquets documentaires selon les Sections 11.1, 11.2 et 12 du Cahier des Charges. Elle éradique 100 % des mocks existants (`lib/mock/university-royalties.ts`, fallback `localStorage`), supprime la notion obsolète de faculté pour un traitement purement institutionnel, applique une hiérarchie dynamique des taux (Taux Institution > Taux Global Admin) et expose une interface complète pour l'Université et l'Administrateur.

## Technical Context

**Language/Version**: Python 3.10+ (Django 5.x, DRF) et TypeScript 5.x (Next.js 15 App Router, React 19).

**Primary Dependencies**: Django REST Framework, Tailwind CSS, Lucide React, Sonner (Toasts).

**Storage**: PostgreSQL (Neon) avec relations `Institution`, `BouquetOffering`, `UniversityBouquetSubscription`, `ReaderSession`, `TraceAcces`, `ConfigurationPlateformeGlobale`.

**Testing**: `python manage.py test apps.reporting.tests.test_bouquet_revenue_distribution`.

**Target Platform**: Web responsive (Mobile-first 375px &plusmn; &rarr; Desktop 1280px+).

**Project Type**: Web application fullstack (Backend REST + BFF Next.js + UI).

**Performance Goals**: Restitution des calculs d'agrégation d'audience et affichage des graphiques vectoriels en moins de 1,5 seconde.

**Constraints**:
- Zéro donnée mockée ou statique.
- Zéro code couleur hexadécimal en dur (utilisation stricte des variables sémantiques `globals.css`).
- Zéro émoji.
- Typographie officielle : Playfair Display (titres/en-têtes) et Poppins (textes/chiffres).
- Format JSON unifié `{ "success": boolean, "data": ..., "error": string | null }`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe de la Constitution | Statut | Justification |
| :--- | :--- | :--- |
| **I. Lecture Intégrale Exhaustive** | **CONFORME** | Tous les fichiers backend et frontend concernés ont été lus et inspectés à 100 %. |
| **III. Rigueur Backend & Typage** | **CONFORME** | Typage statique strict sur les sérialiseurs et vues Django ; interfaces TypeScript exhaustives. |
| **IV. Format JSON Unifié** | **CONFORME** | Toutes les routes renvoient `{ success: true, data: ..., error: null }`. |
| **V. Éradication des requêtes N+1** | **CONFORME** | Utilisation de `select_related()` et agrégations groupées ORM (`Count`, `Sum`). |
| **VIII. Tokens Sémantiques & Polices** | **CONFORME** | Aucun hexadécimal inline, utilisation exclusive des classes sémantiques Navy/Gold et polices Google Playfair/Poppins. |
| **X. Interdiction Absolue des Émojis** | **CONFORME** | Aucun émoji dans le code, les labels, les messages d'erreur ou la documentation. |
| **XII. Éradication Définitive des Mocks** | **CONFORME** | Remplacement intégral des tableaux factices par des flux connectés à la base de données réelle via BFF. |

## Project Structure

### Documentation (this feature)

```text
specs/002-bouquet-royalties-distribution/
├── spec.md              # Spécification fonctionnelle et clarifications
├── plan.md              # Ce plan de réalisation technique
├── research.md          # Décisions d'architecture et de conception
├── data-model.md        # Schémas de données et modèles de payload
├── quickstart.md        # Guide de validation et scénarios de test
└── contracts/
    └── bouquet-distribution-api.md # Contrat d'interface REST unifié
```

### Source Code (repository root)

```text
lahatheque-backend/
├── apps/
│   ├── partners/
│   │   ├── university_views.py  # Nettoyage facultés, calculs d'usage réel ReaderSession
│   │   └── urls.py
│   └── reporting/
│       ├── admin_views.py       # Moteur compute_bouquet_distribution_payload dynamique
│       └── models.py            # ConfigurationPlateformeGlobale (taux global admin)

lahatheque-frontend/
├── app/
│   └── (dashboard)/
│       ├── university/
│       │   └── royalties/
│       │       └── page.tsx     # Démasquage onglet bouquets, suppression filtres facultés
│       └── admin/
│           └── royalties/
│               └── universities/
│                   └── page.tsx # Vue panoramique administrative des bouquets
├── components/
│   └── features/
│       └── bouquets/
│           ├── bouquet-pie-distribution.tsx  # Double graphique SVG conforme CDC Section 11
│           └── bouquet-distribution-modal.tsx # Modale connectée à l'API réelle
└── lib/
    ├── services/
    │   ├── bouquet-distribution.ts # Éradication des mocks et localStorage
    │   └── university.ts           # Service université connecté
    └── types/
        └── university.ts           # Typage TypeScript strict
```

**Structure Decision**: Architecture Fullstack existante (Django backend + Next.js frontend via proxy BFF `/api/bff/...`). Aucune nouvelle dépendance externe requise.

## Complexity Tracking

Aucune violation de la constitution. Architecture épurée, performante et sans sur-ingénierie.
