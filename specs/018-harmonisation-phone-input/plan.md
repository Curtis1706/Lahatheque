# Implementation Plan: Harmonisation Universelle du PhoneInput

**Branch**: `018-harmonisation-phone-input` | **Date**: 2026-09-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/018-harmonisation-phone-input/spec.md`

---

## Summary

Harmonisation générale et intégration du composant officiel `PhoneInput` ([`components/ui/phone-input.tsx`](file:///e:/Lahatheque/lahatheque-frontend/components/ui/phone-input.tsx)) sur l'intégralité des formulaires de la plateforme comportant un champ téléphone (Nouveau contrat juriste, création de compte administrateur, annuaire des contacts, commande grossiste B2B). Le composant affiche les drapeaux nationaux, synchronise dynamiquement les indicatifs selon les pays actifs sur la plateforme via `getCountries(true)` et pré-sélectionne l'indicatif automatiquement. En parallèle, correction des gardes défensives sur `/legal-reviewer/contracts/new` pour éliminer l'exception JavaScript `Cannot read properties of undefined (reading 'toLowerCase')`.

---

## Technical Context

**Language/Version**: TypeScript 5.0+ (Next.js 14/15/16 App Router), Python 3.10+ (Django REST Framework).

**Primary Dependencies**: React 18, Next.js, Lucide React (`lucide-react`), TailwindCSS.

**Storage**: PostgreSQL (Catalogue `Country`), pas de modification de schéma de base de données requise.

**Testing**: Validation TypeScript (`pnpm tsc --noEmit`), validation visuelle pas-à-pas selon [quickstart.md](./quickstart.md).

**Target Platform**: Web responsive mobile-first (375px à 1920px+).

**Project Type**: Application Web Frontend (Next.js App Router).

**Performance Goals**: Rendu instantané du sélecteur d'indicatif (< 50ms), chargement asynchrone non-bloquant des pays actifs.

**Constraints**: Respect strict des règles LAHAThèque (aucun code couleur hexadécimal en dur, tokens sémantiques `bg-background`, `border-border`, `focus-within:border-gold`, `text-navy`, typographie `Poppins`, zéro émoji, zones tactiles >= 44px).

**Scale/Scope**: 4 formulaires/modales majeurs à migrer, 1 composant central `PhoneInput` à enrichir.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe Constitutionnel | Statut | Justification |
|---|---|---|
| I. Cadrage Métier & Consultation | PASS | Répond aux exigences de fiabilisation des coordonnées de contacts et de conformité des formulaires juridiques et commerciaux. |
| II. Traque des Non-Dits & Cas Limites | PASS | Gestion du numéro collé avec indicatif, fallback local immédiat si API pays injoignable, protection défensive contre les valeurs nulles. |
| III. Rigueur Typage Statique | PASS | Interface TypeScript stricte `PhoneInputProps` avec props optionnelles de formulaire HTML standard. |
| IV. Format de Réponse API Unifié | PASS | Consommation transparente des endpoints pays `{ success: true, data: [...] }`. |
| V. Performance ORM & Anti-N+1 | PASS | Simple lecture client avec cache mémoire local des pays. |
| VI. Sécurité & Authentification | PASS | Aucune exposition de données sensibles, normalisation du numéro E.164. |
| VII. Protection DRM | PASS | Non applicable directement (pas de streaming sur ce périmètre). |
| VIII. Tokens Sémantiques & 21st.dev | PASS | Classes `border-border`, `focus-within:border-gold`, `text-navy`, zéro code hexadécimal. |
| IX. Code Documenté & Commenté | PASS | Docstrings et commentaires explicatifs sur la logique de parsing d'indicatif. |
| X. Interdiction Absolue de Tout Émoji | PASS | Zéro émoji dans le composant, les drapeaux s'appuient sur `CountryFlag` vectoriel / CSS et Lucide React. |
| XI. Observabilité & Journalisation | PASS | Traçabilité des erreurs de saisie et avertissements console clairs sans crash. |

---

## Project Structure

### Documentation (this feature)

```text
specs/018-harmonisation-phone-input/
├── plan.md              # Ce document
├── research.md          # Décisions d'architecture et de parsing
├── data-model.md        # Modèles de données et interfaces TypeScript
├── quickstart.md        # Guide de validation manuelle
├── contracts/
│   └── phone-input-api.yaml # Schéma OpenAPI des pays
└── checklists/
    └── requirements.md  # Liste de contrôle qualité
```

### Source Code Impacted

```text
lahatheque-frontend/
├── components/
│   ├── ui/
│   │   └── phone-input.tsx                          # Enrichissement de l'API (id, name, placeholder, styling)
│   └── features/
│       ├── contacts/
│       │   └── add-edit-contact-modal.tsx           # Remplacement du champ tel par PhoneInput
│       ├── admin/
│       │   └── create-account-modal.tsx             # Remplacement du champ tel par PhoneInput
│       └── wholesaler/
│           └── wholesale-order-modal.tsx            # Remplacement du champ tel par PhoneInput
└── app/
    └── (dashboard)/
        └── legal-reviewer/
            └── contracts/
                └── new/
                    └── page.tsx                     # Remplacement du champ tel par PhoneInput + fix bug toLowerCase
```

---

## Phases

### Phase 0: Outline & Research (Completed)
- Analyse des occurrences existantes de `<input type="tel">` et `PhoneInput`.
- Validation du service `getCountries(true)` et du fallback `AFRICAN_COUNTRIES_PRESET`.
- Décisions documentées dans [`research.md`](./research.md).

### Phase 1: Design & Contracts (Completed)
- Formalisation des interfaces TypeScript dans [`data-model.md`](./data-model.md).
- Schéma OpenAPI dans [`contracts/phone-input-api.yaml`](./contracts/phone-input-api.yaml).
- Guide de test et scénarios dans [`quickstart.md`](./quickstart.md).

### Phase 2: Tasks & Implementation (Next Step)
- Enrichir `PhoneInput` avec `id`, `name`, `placeholder`, `required`, et robustesse de parsing.
- Remplacer l'input dans `app/(dashboard)/legal-reviewer/contracts/new/page.tsx` et corriger les `toLowerCase()` non protégés.
- Remplacer l'input dans `components/features/contacts/add-edit-contact-modal.tsx`.
- Remplacer l'input dans `components/features/admin/create-account-modal.tsx`.
- Remplacer l'input dans `components/features/wholesaler/wholesale-order-modal.tsx`.
- Valider avec `pnpm tsc --noEmit`.
