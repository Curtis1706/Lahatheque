# Implementation Plan: Gestion des Courriers Officiels de Redevances & Relances (Papier à En-tête LAHAThèque)

**Branch**: `008-courrier-redevances-relances` | **Date**: 2026-09-17 | **Spec**: [spec.md](file:///e:/Lahatheque/specs/008-courrier-redevances-relances/spec.md)

**Input**: Feature specification from `/specs/008-courrier-redevances-relances/spec.md`

## Summary

Remplacer les actions d'envoi direct non tracées ("Envoyer Relevé", "Déclencher Relance") sur les tableaux de bord redevances (universités, éditeurs) et relances (créances, auteurs) par l'action "Préparer le courrier" (et l'action groupée de période "Préparer les courriers de la période").
Centraliser le suivi sur une page dédiée sous forme de DataTable (`/legal-reviewer/courriers`) gérant le cycle de vie complet :
- **Brouillon** : Rédaction libre, prévisualisation PDF à la volée sur le papier à en-tête officiel (`Lahatheque-PapierEntete-SansNumero.pdf`), modale d'édition contextuelle ("Corriger").
- **Validé** : Fige irrévocablement le texte, scelle le PDF définitif sur le gabarit officiel, active l'action "Envoyer par email".
- **Annulé** : Neutralise le courrier (brouillon ou validé) tout en conservant la trace d'audit dans la table.
- **Envoyé** : Expédie l'email officiel avec le corps du message rédigé et le PDF scellé en pièce jointe, horodate l'expédition.

## Technical Context

**Language/Version**: Python 3.10+ (Django 5 / Django REST Framework) & TypeScript 5+ (Next.js 14 App Router).

**Primary Dependencies**:
- Backend : `fitz` (PyMuPDF - déjà configuré pour la manipulation binaire de PDF), `django-cors-headers`, `django-environ`.
- Frontend : `lucide-react`, `sonner` (toasts), Tailwind CSS, `@tanstack/react-table` (composant DataTable du projet).

**Storage**: PostgreSQL (modèle Django `CourrierOfficiel`), Cloudflare R2 / Django Storage pour les PDF scellés définitifs (`upload_to='courriers_officiels/%Y/%m/'`).

**Testing**: `python manage.py test apps.rights.tests` (tests unitaires et d'intégration Django), tests de régression frontend et validation TypeScript (`npm run build`).

**Target Platform**: Web responsive (Mobile-first, tablette, desktop), conteneur Docker Linux hébergé sur Coolify.

**Project Type**: Application web fullstack (Django REST API + Next.js App Router).

**Performance Goals**:
- Génération et streaming de la prévisualisation PDF en moins de 1,5 seconde.
- Chargement de la DataTable des courriers en moins de 300 ms.
- Zéro fuite mémoire lors du traitement PDF binaire en mémoire (`io.BytesIO()`).

**Constraints**:
- Respect strict de la charte LAHAThèque : interdiction formelle des couleurs hexadécimales en dur (`globals.css`), zéro émoji.
- Typographie officielle : Playfair Display pour les titres, Poppins pour le corps et les boutons.
- Réponse API unifiée : `{ "success": true, "data": {}, "error": null }`.

**Scale/Scope**: Écran dédié juriste, modales de confirmation et d'édition, 4 statuts métier, intégration sur 2 écrans sources existants (`redevances` et `relances`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Principe I - Cadrage Métier & Lecture Exhaustive** : Spécification détaillée et gabarit client inspecté au pixel près (`Rect(65, 115, 530, 765)`).
- [x] **Principe III - Rigueur Backend & Typage** : Type Hints systématiques sur toutes les méthodes du service PDF et des vues Django.
- [x] **Principe IV - Format de Réponse Unifié** : Endpoints retournant obligatoirement `success`, `data`, `error`.
- [x] **Principe VI - Sécurité & Permissions** : Réservé aux juristes (`IsLegalReviewerRole`) et administrateurs (`IsAdminOrSuperAdmin`), authentification par session/cookies HttpOnly.
- [x] **Principe VIII - Tokens Sémantiques & Typographie** : Classes `bg-navy`, `text-gold`, `border-border`, polices Playfair Display et Poppins.
- [x] **Principe X - Zéro Émoji** : Strictement aucune émoticône dans l'interface, les e-mails ou les codes sources.
- [x] **Principe XI - Traçabilité & Console Logs** : Console logs groupés `[COURRIERS API]` et logs backend structurés à chaque transition de statut.
- [x] **Principe XII - Workflow d'Écran** : Arborescence explicite, données réelles connectées, 21st.dev/composants du design system réutilisés.
- [x] **Principe XIII - Persistance Mémoire** : Consigné dans `.specify/memory/project_memory.md`.

## Project Structure

### Documentation (this feature)

```text
specs/008-courrier-redevances-relances/
├── spec.md              # Spécification fonctionnelle validée avec clarifications
├── plan.md              # Ce fichier (Plan d'implémentation technique)
├── research.md          # Recherche technique PyMuPDF et choix d'architecture (Phase 0)
├── data-model.md        # Entité CourrierOfficiel et machine à états (Phase 1)
├── quickstart.md        # Guide de test et scénarios de validation bout en bout (Phase 1)
├── contracts/
│   └── api-courriers.md # Contrats d'API REST détaillés
├── checklists/
│   └── requirements.md  # Checklist de conformité de la spécification (16/16)
└── tasks.md             # Tâches détaillées d'implémentation (généré par /speckit-tasks)
```

### Source Code (repository root)

```text
lahatheque-backend/
├── apps/rights/
│   ├── models.py                     # [MODIFY] Ajout du modèle CourrierOfficiel
│   ├── migrations/                   # [NEW] Migration 0007_courrierofficiel
│   ├── official_letter_service.py    # [NEW] Service PyMuPDF de fusion sur papier à en-tête & templates par défaut
│   ├── views.py                      # [MODIFY] ViewSet / APIViews pour CRUD courriers, preview-pdf, validate, cancel, send
│   ├── serializers.py                # [MODIFY] Serializer CourrierOfficielSerializer
│   └── urls.py                       # [MODIFY] Routes /legal/courriers/*
└── static/
    └── Lahatheque-PapierEntete-SansNumero.pdf # Gabarit officiel fourni par le client

lahatheque-frontend/
├── lib/
│   ├── types/
│   │   └── courrier.ts               # [NEW] Types TypeScript stricts pour les courriers officiels
│   └── services/
│       └── courrier.ts               # [NEW] Service API (getCourriers, prepareCourrier, updateCourrier, validate, cancel, send)
├── app/(dashboard)/legal-reviewer/
│   ├── courriers/
│   │   └── page.tsx                  # [NEW] Page dédiée DataTable de gestion des courriers avec fil d'Ariane
│   ├── redevances/
│   │   └── page.tsx                  # [MODIFY] Remplacement de "Envoyer Relevé" par "Préparer le courrier"
│   └── relances/
│       └── page.tsx                  # [MODIFY] Remplacement par "Préparer le courrier" et "Préparer les courriers de la période"
└── components/features/legal/
    ├── edit-courrier-modal.tsx       # [NEW] Modale contextuelle d'édition de l'objet et du corps de texte ("Corriger")
    └── courrier-action-dialogs.tsx   # [NEW] Modales de confirmation pour Valider, Annuler et Envoyer
```

**Structure Decision**: Architecture fullstack unifiée combinant une extension du domaine métier `apps/rights` sur Django et de l'espace `legal-reviewer` sur Next.js, réutilisant le gabarit statique officiel pour la fusion documentaire.

## Complexity Tracking

Aucune déviation ni violation constitutionnelle. L'usage de PyMuPDF s'appuie sur la dépendance standard déjà en production dans le backend.
