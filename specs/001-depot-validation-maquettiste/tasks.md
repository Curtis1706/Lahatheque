# Tasks: Module 1 - Depot et Validation du Catalogue (Maquettiste & Chef Maquettiste)

**Branch**: `001-depot-validation-maquettiste` | **Status**: Completed | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

---

## Phase 1: Setup & Infrastructure Partagée

- [x] T001 Structurer les modules du catalogue dans `apps/catalog/` (`models.py`, `serializers.py`, `views.py`, `urls.py`).
- [x] T002 Configurer les ViewSets avec support des dépôts et permissions adaptées.

---

## Phase 2: Fondations & Modèles de Données

- [x] T003 Modèle `Ouvrage` et `MetadataONIX` dans `apps/catalog/models.py` avec statut `draft`, `submitted`, `validated`, `rejected`, `published`.
- [x] T004 Suppression des uploads audio superflus (gestion par synthèse vocale TTS intégrée au lecteur).
- [x] T005 Migrations appliquées avec succès en base de données PostgreSQL Neon.

---

## Phase 3: User Story 1 - Dépôt d'un Ouvrage par le Maquettiste

- [x] T006 Formulaire de dépôt multi-étapes (`/layout-artist/deposits/new`) avec dropzones sécurisées PDF/EPUB et Couverture.
- [x] T007 Brancher le service d'extraction IA `POST /api/v1/ai/extract-metadata/` pour l'auto-complétion en 1 clic.
- [x] T008 Prise en compte de tous les genres (Romans, Mangas, BD, Scolaire, Droit OHADA, Économie UEMOA, Médecine, Sciences, etc.).

---

## Phase 4: User Story 2 - Validation et Publication Automatique (Chef Maquettiste)

- [x] T009 Action `POST /api/v1/catalog/deposits/<id>/validate/` pour publication atomique en vitrine avec configuration DRM par défaut.
- [x] T010 Écran d'inspection `/chief-layout/validation/[id]` avec feuilletage, contrôle des métadonnées ONIX et validation en 1 clic.

---

## Phase 5: User Story 3 - Rejet avec Motif Obligatoire

- [x] T011 Action `POST /api/v1/catalog/deposits/<id>/reject/` avec motif de rejet obligatoire.
- [x] T012 Modale de révision pour le Chef Maquettiste et notification du motif au maquettiste.

---

## Phase 6: Qualité, Performance & Vérification

- [x] T013 Vérification Django `python manage.py check` (0 erreur).
- [x] T014 Compilation Next.js 16 `npm run build` (104 routes vérifiées sans erreur TS).
- [x] T015 Respect strict de la charte sémantique sans couleur hexadécimale en dur et sans emoji.
