# Implementation Plan: Création et Rattachement des Universités Partenaires

**Branch**: `001-university-institution-creation` | **Date**: 2026-09-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-university-institution-creation/spec.md`

## Summary

Synchroniser de bout en bout la création d'un compte utilisateur de rôle `university` avec la création ou l'attribution d'une entité `Institution` officielle en base de données (`partners_institution`). Garantir l'apparition instantanée de toute nouvelle université dans le combobox de dépôt d'ouvrages, sécuriser la gestion des 15 % de redevance au niveau de l'Institution, et doter l'écran `/admin/users/universities` d'une action d'édition pour modifier et rattacher les comptes existants (comme `orphelin@test.bj`).

## Technical Context

**Language/Version**: Python 3.10+ (Django 5.0, Django REST Framework), TypeScript 5+ (Next.js 14 App Router, React 18).

**Primary Dependencies**: 
- Backend : Django REST Framework, `django-cors-headers`.
- Frontend : Tailwind CSS, Lucide React (`lucide-react`), Sonner (`toast`).

**Storage**: PostgreSQL (Neon) avec ORM Django. Entités : `partners_institution`, `accounts_user`.

**Testing**: 
- Backend : `python manage.py test apps.accounts apps.partners`
- Frontend : `npx tsc --noEmit`

**Target Platform**: Web application responsive (Mobile-first down to 375px).

**Project Type**: Fullstack Web Application (Next.js BFF + Django REST Backend).

**Performance Goals**: 
- Temps de réponse de création < 300 ms.
- Disponibilité dans le combobox sans rafraîchissement ni rechargement serveur (< 2 s).

**Constraints**:
- Respect strict des 11 Principes de la Constitution LAHAThèque.
- Zéro émoji toléré (icônes Lucide React exclusives).
- Zéro couleur hexadécimale en dur (usage exclusif des classes sémantiques `bg-navy`, `bg-gold`, `border-border`).
- Exécution de toute mutation conjointe dans `@transaction.atomic`.

**Scale/Scope**: Support de dizaines d'universités nationales et internationales, gestionnaires multiples, 15 % de redevance standard.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe Constitutionnel | Statut | Justification / Alignement |
| :--- | :--- | :--- |
| **I. Cadrage Métier** | PASS | Conforme au modèle conventionné des universités et au système de redevances. |
| **III. Rigueur Backend & Type Hints** | PASS | Tous les serializers et vues backend typés selon PEP 8. |
| **IV. Format de Réponse API Unifié** | PASS | Strictement `{ success: true, data: {...}, error: null }`. |
| **V. Performance ORM & Transactions** | PASS | Usage systématique de `@transaction.atomic` et `select_related('institution')`. |
| **VIII. Tokens Sémantiques & 21st.dev** | PASS | Modales et formulaires construits avec les tokens CSS `globals.css` et Lucide. |
| **X. Interdiction Absolue des Émojis** | PASS | Zéro émoji dans le code, les logs, les toasts et l'interface. |
| **XI. Traçabilité & Observabilité** | PASS | Logs `[AdminUserViewSet]` et retours toast explicites. |

## Project Structure

### Documentation (this feature)

```text
specs/001-university-institution-creation/
├── spec.md              # Feature specification
├── plan.md              # This implementation plan
├── research.md          # Phase 0 decisions
├── data-model.md        # Entity schemas & ER diagram
├── quickstart.md        # Step-by-step verification guide
├── contracts/           # API contracts
│   └── admin-university-api.md
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root)

```text
lahatheque-backend/
├── apps/
│   ├── accounts/
│   │   ├── admin_views.py       # Enrichissement POST & PATCH user avec gestion institution
│   │   └── serializers.py       # AdminUserCreateSerializer avec options institution
│   └── partners/
│       ├── models.py            # Institution model (méthodes utilitaires)
│       └── views.py             # InstitutionViewSet

lahatheque-frontend/
├── app/
│   └── (dashboard)/
│       └── admin/
│           └── users/
│               └── [role]/
│                   └── page.tsx # Ajout bouton éditer sur chaque ligne universités
├── components/
│   └── features/
│       └── admin/
│           ├── create-account-modal.tsx     # Sélecteur institution existante ou nouvelle
│           └── edit-university-user-modal.tsx # Nouvelle modale d'édition et réassignation
└── lib/
    ├── services/
    │   └── admin.ts             # Fonctions API createAdminUser & updateAdminUser
    └── types/
        └── admin.ts             # Typage étendu AdminUser
```

## Complexity Tracking

Aucune dérogation constitutionnelle ou complexité anormale détectée. L'implémentation réutilise les structures REST Django et les composants Next.js existants.
