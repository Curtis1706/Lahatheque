# Implementation Plan: Forensic Leak Detection & Watermark Extraction

**Branch**: `007-forensic-leak-detection` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Spécification fonctionnelle issue de `specs/007-forensic-leak-detection/spec.md`.

---

## Summary

Cette fonctionnalité fournit aux administrateurs de LAHAThèque un atelier forensique complet pour identifier formellement la source de toute fuite d'ouvrage sur Internet. L'outil analyse soit un document PDF suspect (via extraction binaire du tatouage invisible `LTQ:{...}` et vérification de signature cryptographique SHA-256), soit une capture d'écran ou photographie de smartphone (via rehaussement de contraste Pillow, seuillage dynamique et OCR local avec basculement automatique vers un modèle de vision multimodale pour les clichés flous ou inclinés). Les éléments détectés sont immédiatement corrélés avec les enregistrements réels de la plateforme (`TraceAcces`, `User`, `Commande`), affichant un dossier de preuve opposable et permettant à l'administrateur de suspendre le compte suspect, de révoquer ses sessions actives en un clic et d'exporter un rapport certifié PDF.

---

## Technical Context

**Language/Version**: Python 3.11 (Backend Django REST Framework), TypeScript 5.x (Frontend Next.js 15 App Router)

**Primary Dependencies**:
- Backend : `PyMuPDF` (`fitz` 1.25.3), `Pillow` (10.x), `pytesseract` (0.3.10), `openai` (1.50+ pour fallback vision), `reportlab` (4.0+ pour rapports certifiés PDF), `djangorestframework`
- Frontend : Next.js App Router, Tailwind CSS (tokens sémantiques `globals.css`), Lucide React (`lucide-react`), Sonner (toasts)

**Storage**:
- PostgreSQL (`ForensicInvestigation`, `TraceAcces`, `User`, `Commande`)
- Fichiers temporaires traités en mémoire (RAM) via `BytesIO` sans persistance inutile de fichiers suspects non autorisés

**Testing**:
- Tests unitaires et d'intégration Django (`apps/protection/tests/test_forensic.py`)
- Validation end-to-end via scénarios du `quickstart.md`

**Target Platform**: Serveur Linux / Docker (Backend Coolify), Navigateurs Desktop & Mobile (Frontend Next.js)

**Project Type**: Application Web intégrée (Backend API Django REST + Frontend Next.js Dashboard)

**Performance Goals**:
- Analyse PDF binaire < 1.5 seconde
- Prétraitement d'image + OCR local < 2 secondes
- Corrélation base de données < 200 ms
- Zéro blocage d'interface utilisateur

**Constraints**:
- **Accès strictement et exclusivement réservé aux administrateurs (`role in ['admin', 'super_admin']`)**
- **Zéro émoji** dans tout le code, les logs, les vues, les contrats et les réponses
- Interdiction absolue des mocks : corrélation uniquement sur les tables et modèles réels
- Utilisation exclusive des tokens sémantiques Tailwind de `globals.css` (pas de couleur hexadécimale en dur)
- Respect strict de la constitution du projet LAHAThèque

**Scale/Scope**:
- Écran unique d'enquête forensique et d'actions directes : `/admin/security/forensic`
- Service forensique backend réutilisable : `apps/protection/forensic_service.py`
- Endpoints REST : `POST /api/v1/protection/forensic/analyze/`, `POST /api/v1/protection/forensic/mitigate/`, `GET /api/v1/protection/forensic/report/<id>/`

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

- [x] **I. Cadrage Métier & Lecture Intégrale Exhaustive** : Lecture exhaustive de `apps/protection/watermark.py`, `apps/protection/models.py`, `apps/accounts/models.py`, `apps/accounts/services.py`, `apps/protection/views.py`.
- [x] **III. Rigueur Backend Python & Type Hints** : Tous les arguments et retours typés statiquement en PEP 8.
- [x] **IV. Format de Réponse API Unifié** : Format `{ "success": true, "data": {}, "error": null }` scrupuleusement respecté.
- [x] **V. Performance ORM & Pas de N+1** : `select_related('suspect_user', 'ouvrage', 'admin_user')` systématique.
- [x] **VI. Sécurité Réseau & HttpOnly** : Authentification par cookies HttpOnly via le proxy BFF unifié.
- [x] **VIII. Tokens Sémantiques & Finitions Chic** : `bg-navy`, `bg-gold`, `text-gold`, `border-border`, pas de hex inline, pas d'émojis, icônes Lucide.
- [x] **X. Interdiction Absolue de Tout Émoji** : Zéro émoji dans toute l'implémentation.
- [x] **XI. Traçabilité, Observabilité & Logs Granulaires** : Logs structurés `[FORENSIC ANALYZE]` frontend et backend, traçabilité dans `ForensicInvestigation`.
- [x] **XII. Workflow /build-lahatheque-screen & 21st.dev** : Interface intégrée, mobile-first, zéro mock.
- [x] **XIII. Persistance Mémoire** : Avancements consignés dans `.specify/memory/project_memory.md`.

---

## Project Structure

### Documentation (cette fonctionnalité)

```text
specs/007-forensic-leak-detection/
├── plan.md              # Ce fichier (plan d'architecture)
├── research.md          # Phase 0 : Choix techniques et justifications
├── data-model.md        # Phase 1 : Modèle ForensicInvestigation et types TS
├── quickstart.md        # Phase 1 : Guide de test et validation
└── contracts/
    └── api-forensic.md  # Phase 1 : Spécification des endpoints REST
```

### Code Source (arborescence réelle)

```text
lahatheque-backend/
├── apps/
│   └── protection/
│       ├── models.py             # [MODIFIÉ] Ajout du modèle ForensicInvestigation
│       ├── forensic_service.py   # [NOUVEAU] Service d'analyse PDF, OCR et corrélation
│       ├── views.py              # [MODIFIÉ] Ajout de ForensicAnalyzeView, ForensicMitigateView, ForensicReportView
│       ├── urls.py               # [MODIFIÉ] Enregistrement des routes /forensic/*
│       └── tests/
│           └── test_forensic.py  # [NOUVEAU] Tests unitaires et d'intégration forensiques

lahatheque-frontend/
├── app/
│   └── (dashboard)/
│       └── admin/
│           └── security/
│               ├── forensic/
│               │   └── page.tsx  # [NOUVEAU] Interface d'investigation forensique admin
│               └── traces/
│                   └── page.tsx  # [MODIFIÉ] Ajout du bouton d'accès rapide vers l'outil forensique
├── lib/
│   └── services/
│       └── protection.ts         # [MODIFIÉ] Ajout des fonctions API forensiques
```

---

## Complexity Tracking

Aucune violation de la constitution du projet LAHAThèque n'est introduite. L'architecture réutilise 100% des dépendances déjà présentes dans l'environnement (`pymupdf`, `Pillow`, `pytesseract`, `openai`, `reportlab`) sans ajouter de dépendance superflue.
