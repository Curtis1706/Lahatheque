# Implementation Plan: Détail des Redevances par Ouvrage, Déduction des Retraits & Export PDF Auteur

**Branch**: `020-redevances-detail-ouvrages-solde` | **Date**: 2026-09-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/020-redevances-detail-ouvrages-solde/spec.md`

## Summary

Cette fonctionnalité enrichit le module des droits d'auteur sur LAHAThèque en apportant :
1. L'affichage transparent des livres vendus (titre, couverture, formats, quantités, CA brut, taux, redevance nette) directement sous chaque trimestre via des lignes dépliables/pliables dans le composant `DataTable`.
2. L'application stricte de la règle de déduction financière des retraits : tout retrait émis ou validé est immédiatement soustrait du solde retirable disponible (`solde = total_acquis - total_demandes_en_cours_ou_payées`).
3. L'enrichissement du bordereau officiel PDF avec la ventilation nominative par ouvrage.

## Technical Context

**Language/Version**: Python 3.10+ (Backend Django), TypeScript 5.x / Next.js 14 App Router (Frontend)

**Primary Dependencies**: Django REST Framework, React 18, TailwindCSS, Lucide React, jsPDF / PDF generator

**Storage**: PostgreSQL (base de données transactionnelle), Cloudflare R2 (couvertures d'ouvrages)

**Testing**: Pytest Django, requêtes APIRequestFactory, tests manuels d'interaction et de non-régression mobile

**Target Platform**: Web responsive (Mobile-first, tablettes, Desktop)

**Project Type**: Application Web (Backend DRF + Frontend Next.js App Router)

**Performance Goals**: Temps de réponse API < 150ms pour le relevé trimestriel, animation d'expansion fluide à 60fps

**Constraints**: Respect absolu des tokens sémantiques CSS (zéro hexadécimal codé en dur), zéro emoji dans le code ou l'UI, compatibilité mobile sous 400px

**Scale/Scope**: Écran `/author/royalties`, composant `DataTable`, modale `AuthorPayoutModal`, endpoints `/api/v1/rights/author/royalties/` et `/api/v1/rights/author/payout-request/`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principe I (Cadrage Métier)** : Validé. Conforme aux règles d'édition et de liquidation trimestrielle du CDC.
- **Principe III & IV (Typage Python & Format API unifié)** : Validé. Toutes les réponses respectent `{"success": true, "data": ..., "error": null}` avec typage strict.
- **Principe V (Performance ORM & N+1)** : Validé. Usage de `select_related('ouvrage', 'commande')` et agrégations SQL optimisées sans boucle de requêtes N+1.
- **Principe VIII (Frontend Tokens Sémantiques & Mobile-First)** : Validé. Utilisation exclusive de `bg-navy`, `text-gold`, `border-border`, etc., et vue accordéon adaptée sur mobile.
- **Principe X (Zéro Emoji)** : Validé. Utilisation exclusive d'icônes Lucide React (`ChevronRight`, `BookOpen`, `Download`, `CreditCard`).
- **Principe XI (Traçabilité & Observabilité)** : Validé. Journalisation des calculs et vérifications de solde.

## Project Structure

### Documentation (this feature)

```text
specs/020-redevances-detail-ouvrages-solde/
├── plan.md              # Ce fichier (Implementation Plan)
├── research.md          # Phase 0 : Décisions d'architecture et alternatives
├── data-model.md        # Phase 1 : Entités, champs et règles de calcul
├── quickstart.md        # Phase 1 : Scénarios de validation et guide de test
├── contracts/           # Phase 1 : Contrat d'API OpenAPI YAML
│   └── author-royalties-api.yaml
└── checklists/
    └── requirements.md  # Checklist de qualité de la spécification
```

### Source Code (repository root)

```text
lahatheque-backend/
└── apps/
    └── rights/
        ├── views.py        # AuthorRoyaltiesStatementsView, AuthorDashboardKPIsView, AuthorPayoutRequestView
        ├── urls.py
        └── tests/
            └── test_author_royalties.py

lahatheque-frontend/
├── components/
│   ├── ui/
│   │   └── data-table.tsx  # Support des lignes dépliables/pliables (renderExpandedRow)
│   └── features/
│       └── author/
│           └── author-payout-modal.tsx  # Validation stricte du solde retirable disponible
├── app/(dashboard)/author/royalties/
│   └── page.tsx            # Sous-table détaillée des livres vendus & export PDF enrichi
├── lib/
│   ├── types/
│   │   └── author.ts       # Types AuthorRoyaltyPayment & AuthorRoyaltyBookItem
│   ├── services/
│   │   ├── author.ts       # Service client getAuthorRoyaltyPayments
│   │   └── export-service.ts  # Génération PDF bordereau officiel avec détail par livre
│   └── mock/
│       └── author.ts       # Données de fallback enrichies avec liste des livres
```

**Structure Decision**: Architecture Full-Stack standard LAHAThèque isolant le domaine financier `rights` côté Django et les composants d'expérience utilisateur côté Next.js App Router.

## Complexity Tracking

Aucune déviation constitutionnelle. Architecture modulaire et directe réutilisant les briques existantes du système de design.
