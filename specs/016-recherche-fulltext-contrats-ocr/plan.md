# Implementation Plan : Recherche Full-Text & Pipeline OCR Haute Performance pour Contrats Juridiques

**Branche** : `016-recherche-fulltext-contrats-ocr` | **Date** : 2026-09-06 | **Spec** : [spec.md](./spec.md)

---

## Synthèse Technique

Ce plan met en place une infrastructure de recherche plein texte haute performance et sans latence pour les contrats légaux de LAHAThèque. Il associe :
1. Une ingestion asynchrone non-bloquante avec extraction directe du texte PDF natif (PyMuPDF).
2. Un pipeline de secours OCR automatique (Tesseract / Moteur IA) pour les contrats physiques scannés.
3. Une recherche hybride PostgreSQL FTS (avec indexation GIN) combinée à une recherche par sous-chaînes/acronymes pour garantir 100% de rappel sur les sigles universitaires et codes contractuels.

---

## Contexte Technique

- **Langage / Environnement** : Python 3.12 (Django 5.1 / Django REST Framework) + TypeScript (Next.js 16 App Router).
- **Dépendances Clés** :
  - Ingestion & PDF : `PyMuPDF` (`fitz`), `python-docx`
  - OCR : `pytesseract` / fallback Vision IA (`apps.ai_engine`)
  - Recherche : `django.contrib.postgres.search` (`SearchVector`, `SearchQuery`, `SearchRank`), Index `GinIndex`
- **Stockage & Base de données** : PostgreSQL (Neon avec PgBouncer) + Cloudflare R2 / Storage local.
- **Objectifs de Performance** :
  - Temps de réponse de la recherche plein texte : < 100ms.
  - Réponse HTTP au téléversement de contrat : < 500ms (traitement OCR lourd délégué en tâche de fond asynchrone).
  - Empreinte mémoire bornée : streaming page par page lors du traitement des documents volumineux (jusqu'à 800 Mo).

---

## Contrôle de Constitution (Constitution Check)

- **Règle Backend PEP 8 & Format d'API** : Réponses structurées sous `{ success: True, data: [...], error: None }`.
- **Règle Frontend Strict Typing & Zéro Hex** : Types TypeScript stricts, aucun code couleur hexadécimal en dur, tokens sémantiques exclusifs (`bg-navy`, `text-gold`, `border-border`).
- **Règle Sobriété Visuelle** : Zéro emoji dans les logs, réponses d'API, interfaces et messages d'état.
- **Règle Mobile-First** : Écrans lisibles et fonctionnels sous 400px de large.

---

## Structure du Projet (Fichiers impactés)

```text
lahatheque-backend/
├── apps/
│   └── rights/
│       ├── models.py                   # Ajout de indexing_status et search_vector GIN sur ContratLegal
│       ├── views.py                    # Recherche hybride FTS + déclencheur de tâche OCR asynchrone
│       ├── serializers.py              # Exposition de indexing_status et extracted_text_snippet
│       └── services/
│           ├── ocr_service.py          # Service dédié d'extraction et OCR en streaming
│           └── search_service.py       # Requête hybride pondérée et normalisée
lahatheque-frontend/
├── app/(dashboard)/legal-reviewer/contracts/
│   └── page.tsx                        # Affichage du statut d'indexation OCR et mise en valeur des extraits
├── components/features/legal/
│   └── contract-search-bar.tsx         # Barre de recherche avec debounce et indicateur de recherche active
└── lib/
    ├── types/legal.ts                  # Définitions TypeScript (indexing_status, search_highlights)
    └── services/legal.ts               # Appel de l'API de recherche plein texte avec paramètres de filtres
```

---

## Décisions Architecturales contre les Ralentissements et les Bugs

1. **Isolation des Tâches Lourdes (Non-Blocking Architecture)** :
   - Le téléversement du fichier renvoie immédiatement une confirmation HTTP 201 avec le statut `indexing_status: "pending"`.
   - L'utilisateur n'attend jamais la fin du traitement OCR pour reprendre ses activités.
   - Un indicateur discret dans l'interface signale l'état d'indexation du document (*Indexé* / *Analyse OCR en cours*).

2. **Indexation PostgreSQL Optimisée (GIN Index)** :
   - Un index composite GIN est posé en base de données pour éliminer tout balayage séquentiel de table (`Seq Scan`).
   - Requête pré-compilée insensible à la casse et aux accents via `unaccent` et dictionnaire français.

3. **Protection contre la Saturation Mémoire** :
   - Lecture en streaming par paquet de 10 pages pour éviter de saturer la RAM sur des PDF de plusieurs centaines de mégaoctets.
