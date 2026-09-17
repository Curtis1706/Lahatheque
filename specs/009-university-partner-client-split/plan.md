# Implementation Plan: Distinction Étanche Universités Partenaires vs Clientes

**Branch**: `009-university-partner-client-split` | **Date**: 2026-09-17 | **Spec**: [spec.md](file:///e:/Lahatheque/specs/009-university-partner-client-split/spec.md)

**Input**: Spécification fonctionnelle validée issue de `/speckit-specify` et `/speckit-clarify` ([spec.md](file:///e:/Lahatheque/specs/009-university-partner-client-split/spec.md)).

---

## Summary

Mettre en place une séparation étanche entre deux profils d'établissements universitaires sur LAHAThèque :
1. **Universités Partenaires (UAC, UP, UNSTIM, UNA)** : Ayants droit historiques dépositaires de fonds documentaires, strictement dédiées à l'audit de leurs droits, parts d'audience (sur les bouquets et le Bouquet Général) et redevances (15 %), sans aucune souscription de bouquets payants.
2. **Universités Clientes** : Établissements supérieurs et instituts privés souscripteurs, venant strictement pour souscrire des bouquets campus et commander des exemplaires papier, sans aucune métrique ni mention de redevances.
3. **Administration Centralisée** : Qualification du statut lors de la création/édition du compte modérateur unique de l'établissement, avec protection d'intégrité interdisant la rétrogradation des 4 partenaires publics historiques.

---

## Technical Context

**Language/Version**: Python 3.10+ (Backend Django), TypeScript 5.x (Frontend Next.js App Router).  
**Primary Dependencies**: Django REST Framework, Next.js 14, TailwindCSS, Lucide React, Sonner (Toasts).  
**Storage**: PostgreSQL (Modèle `Institution` mis à jour avec `institution_type` et relation `OneToOneField` vers `User`).  
**Testing**: Django test runner (`python manage.py test`), tests d'intégration DRF et vérification de rendu Next.js.  
**Target Platform**: Web application responsive (Mobile-First, respect des breakpoints Tailwind `sm`, `md`, `lg`, `xl`).  
**Project Type**: Application Web monolithique découplée (Backend Django REST API + Frontend Next.js BFF).  
**Performance Goals**: Temps de réponse API < 150 ms sur les endpoints de KPI et du catalogue affilié.  
**Constraints**:
- Respect absolu de la Constitution LAHAThèque : zéro émoji, zéro couleur hexadécimale en dur, zéro mock statique.
- Authentification par cookies `HttpOnly` avec transport unifié des credentials.
- Typage TypeScript strict calqué sur les modèles Django réels.
- Traçabilité et console logs systématiques (`[UNIV KPIS]`, `[UNIV CATALOG]`, `[ADMIN INSTITUTION]`).

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principe Constitutionnel | Exigence | Statut | Justification |
| :--- | :--- | :--- | :--- |
| **I. Lecture Intégrale Exhaustive** | 100 % des lignes des fichiers inspectées sans omission | **PASS** | Les vues, modèles et composants concernés ont été analysés du début à la fin. |
| **III. Rigueur Backend & Typage** | PEP 8, Type hints stricts sur toutes les méthodes DRF | **PASS** | Les serializers et vues Django utilisent le typage statique systématique. |
| **IV. Format Réponse API Unifié** | Structure `{ success, data, error }` obligatoire | **PASS** | Tous les endpoints (`/kpis/`, `/royalties/`, `/bouquets/`) suivent cette enveloppe stricte. |
| **V. Performance ORM** | Clés UUIDv4, indexation explicite, zéro requête N+1 | **PASS** | `institution_type` est indexé avec `db_index=True` ; usage de `select_related('institution')`. |
| **VI. Sécurité & HttpOnly** | Contrôles de permissions stricts, cookies HttpOnly | **PASS** | Règle HTTP 403 appliquée côté backend si une cliente tente d'accéder aux redevances. |
| **VIII. Tokens Sémantiques & Typo** | Zéro code hex en dur, Playfair Display & Poppins | **PASS** | Utilisation exclusive des tokens `navy`, `gold`, `background`, `border` et polices Google Fonts. |
| **X. Interdiction Absolue d'Émojis** | Zéro émoji dans le code, UI, commentaires et docs | **PASS** | Aucune présence d'émoji ; usage exclusif d'icônes vectorielles Lucide React. |
| **XI. Traçabilité & Console Logs** | Logs structurés balisés avec horodatage et timings | **PASS** | Banalisation des console logs frontend sur les chargements et redirections de profil. |
| **XII. Écran Réel & Zéro Mock** | Données réelles connectées via BFF, design mobile-first | **PASS** | Zéro bouchon statique ; consommation des vrais endpoints backend via le client HTTP. |
| **XIII. Persistance Mémoire** | Consignation dans `.specify/memory/project_memory.md` | **PASS** | Prise en compte dans la documentation persistante du projet. |

---

## Project Structure

### Documentation (this feature)

```text
specs/009-university-partner-client-split/
├── spec.md                  # Spécification fonctionnelle détaillée (/speckit-specify, /speckit-clarify)
├── plan.md                  # Ce plan d'architecture technique (/speckit-plan)
├── research.md              # Décisions architecturales et alternatives Phase 0
├── data-model.md            # Modèle de données et contrats TypeScript Phase 1
├── quickstart.md            # Guide de validation pas-à-pas Phase 1
├── contracts/               # Schémas JSON Schema des interfaces API
│   ├── university-kpis.contract.json
│   ├── admin-institution.contract.json
│   └── catalog-filter.contract.json
└── checklists/
    └── requirements.md      # Checklist qualité des exigences
```

### Source Code Modifié et Créé

```text
lahatheque-backend/
├── apps/partners/
│   ├── models.py                          # Ajout de institution_type sur Institution
│   ├── serializers.py                     # Serializer Institution avec institution_type
│   ├── university_views.py                # Gardes 403 redevances/souscriptions, KPIs adaptatifs
│   ├── views.py                           # InstitutionViewSet (sécurisation édition & verrou historique)
│   └── migrations/
│       └── 00XX_institution_institution_type.py # Migration et RunPython pour UAC/UP/UNSTIM/UNA
├── apps/accounts/
│   └── admin_views.py                     # AdminUsersView (création compte modérateur avec type d'institution)
└── apps/reporting/
    └── admin_views.py                     # Filtrage des universités partenaires dans les reversements

lahatheque-frontend/
├── lib/
│   ├── types/
│   │   ├── university.ts                  # Ajout du type InstitutionType et des champs conditionnels
│   │   └── admin.ts                       # Typage étendu pour l'administration des institutions
│   └── services/
│       └── university.ts                  # Adaptation des appels KPI et catalogue
├── components/
│   ├── dashboard-sidebar.tsx              # Masquage conditionnel des liens selon institution_type
│   ├── ui/
│   │   └── mobile-bottom-nav.tsx          # Masquage conditionnel dans la navigation mobile
│   └── features/
│       └── admin/
│           ├── create-account-modal.tsx   # Sélecteur de typologie et masquage taux redevance
│           └── edit-university-user-modal.tsx # Affichage typologie et verrouillage d'intégrité UAC/UP...
└── app/(dashboard)/
    ├── university/
    │   ├── page.tsx                       # Dashboard adaptatif (KPIs, DonutChart, offres bouquets)
    │   ├── bouquets/
    │   │   └── page.tsx                   # Redirection automatique des partenaires vers /royalties
    │   ├── catalog/
    │   │   └── page.tsx                   # Filtrage (livres déposés vs livres souscrits)
    │   └── royalties/
    │       └── page.tsx                   # Garde-fou de redirection pour les clientes
    └── admin/
        └── users/
            └── [role]/
                └── page.tsx               # Table des universités avec badge Partenaire / Cliente
```

---

## Phase 0 : Outline & Research (Validé)
- Toutes les décisions techniques, arbitrages et justifications ont été consignés dans [research.md](file:///e:/Lahatheque/specs/009-university-partner-client-split/research.md).
- Aucun inconnu non résolu (`NEEDS CLARIFICATION`) ne subsiste.

---

## Phase 1 : Design & Contracts (Validé)
- Modélisation de données et interfaces TypeScript : [data-model.md](file:///e:/Lahatheque/specs/009-university-partner-client-split/data-model.md).
- Schémas JSON d'échange : [contracts/](file:///e:/Lahatheque/specs/009-university-partner-client-split/contracts/).
- Scénarios de vérification de bout en bout : [quickstart.md](file:///e:/Lahatheque/specs/009-university-partner-client-split/quickstart.md).

---

## Phase 2 : Décomposition des Tâches
La génération du plan de tâches séquencé et ordonnancé (`tasks.md`) est déléguée à la commande `/speckit-tasks`.
