# Tasks: Forensic Leak Detection & Watermark Extraction

**Feature Branch**: `007-forensic-leak-detection` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Phase 1: Setup (Infrastructure Partagée)

**Goal**: Vérifier la disponibilité des modules existants et initialiser la structure du service forensique.

- [x] T001 [P] Vérifier l'importation et la configuration de PyMuPDF, Pillow, pytesseract, openai et reportlab dans `lahatheque-backend/requirements/base.txt` et l'environnement actif
- [x] T002 [P] Initialiser le squelette du service d'analyse forensique dans `lahatheque-backend/apps/protection/forensic_service.py`

---

## Phase 2: Foundational (Socle Bloquant)

**Goal**: Mettre en place le modèle d'archivage des investigations, exécuter les migrations de base de données et configurer la sécurité des accès.

- [x] T003 Créer le modèle `ForensicInvestigation` dans `lahatheque-backend/apps/protection/models.py` avec tous les champs de traçabilité légale, scores et statuts
- [x] T004 Générer et appliquer la migration Django pour `ForensicInvestigation` via `python manage.py makemigrations protection` et `migrate`
- [x] T005 [P] Ajouter le serializer `ForensicInvestigationSerializer` dans `lahatheque-backend/apps/protection/serializers.py`
- [x] T006 [P] Déclarer la permission d'accès stricte administrateur seul (`role in ['admin', 'super_admin']`) dans `lahatheque-backend/apps/protection/permissions.py`

**Checkpoint**: Socle d'audit et modèle de données prêts. Les tâches des User Stories peuvent démarrer.

---

## Phase 3: User Story 1 - Analyse et Détection Immédiate sur Fichier PDF Fuité (Priority: P1) - MVP

**Goal**: Permettre à l'administrateur de téléverser un PDF fuité et d'extraire instantanément le tatouage invisible stéganographique et les métadonnées signées pour identifier formellement le lecteur source.

**Independent Test**: Téléverser un extrait ou un livre PDF généré par la plateforme avec tatouage invisible. Le système doit extraire sans intervention manuelle le nom, l'e-mail, l'adresse IP et la signature en moins de 1.5 seconde avec un score de 100%.

### Implementation for User Story 1

- [x] T007 [US1] Implémenter l'analyseur de PDF `inspect_pdf_watermark` dans `lahatheque-backend/apps/protection/forensic_service.py` (balayage des pages PyMuPDF, recherche de la chaîne `LTQ:`, décodage du JSON invisible et vérification du SHA-256 dans les métadonnées `keywords`)
- [x] T008 [US1] Implémenter le balayage binaire de secours par expression régulière sur le flux brut décompressé dans `lahatheque-backend/apps/protection/forensic_service.py` en cas de PDF partiellement altéré
- [x] T009 [US1] Créer la vue d'API `ForensicAnalyzeView` pour traiter le téléversement multipart dans `lahatheque-backend/apps/protection/views.py` et renvoyer la réponse au format unifié `{ success, data, error }`
- [x] T010 [US1] Enregistrer l'endpoint `POST /api/v1/protection/forensic/analyze/` dans `lahatheque-backend/apps/protection/urls.py`

**Checkpoint**: User Story 1 opérationnelle : tout PDF marqué téléversé est décodé et attribué avec certitude à son acquéreur d'origine.

---

## Phase 4: User Story 2 - Analyse Haute Précision sur Captures d'Écran et Photos (Priority: P2)

**Goal**: Rehausser le contraste des images de captures d'écran et de photos smartphone pour décoder le filigrane semi-transparent à 20% d'opacité via OCR local, avec repli automatique sur vision multimodale.

**Independent Test**: Téléverser une capture d'écran nette ou une photo inclinée de smartphone d'un écran de liseuse comportant le filigrane semi-transparent. Le système isole les motifs textuels (e-mail, IP, nom) avec un score de certitude >= 85%.

### Implementation for User Story 2

- [x] T011 [US2] Implémenter les algorithmes de prétraitement d'image Pillow `preprocess_for_watermark_ocr` dans `lahatheque-backend/apps/protection/forensic_service.py` (conversion niveaux de gris, expansion dynamique de contraste, masque de netteté, binarisation adaptative Otsu)
- [x] T012 [US2] Implémenter l'extraction OCR locale via Tesseract avec motifs regex d'e-mails, adresses IP et identifiants dans `lahatheque-backend/apps/protection/forensic_service.py`
- [x] T013 [US2] Implémenter le repli automatique vers l'analyse de vision multimodale OpenAI (`gpt-4o-mini` / `gpt-4o`) dans `lahatheque-backend/apps/protection/forensic_service.py` pour les photos floues, inclinées ou de faible lisibilité
- [x] T014 [US2] Intégrer le pipeline image complet dans la méthode principale `analyze_evidence` de `lahatheque-backend/apps/protection/forensic_service.py`

**Checkpoint**: User Story 2 opérationnelle : captures d'écran et photos smartphone sont décodées localement ou par vision multimodale.

---

## Phase 5: User Story 3 - Corrélation, Actions Directes et Interface Dashboard Admin (Priority: P3)

**Goal**: Relier les données extraites aux enregistrements réels (`TraceAcces`, `User`, `Commande`), doter l'administrateur d'actions immédiates (suspension, révocation, rapport PDF) et fournir une interface d'enquête complète.

**Independent Test**: Soumettre un fichier suspect depuis l'interface `/admin/security/forensic`, visualiser la fiche de preuve consolidée avec historique d'achat et traces, exécuter la suspension du compte et télécharger le rapport certifié PDF.

### Implementation for User Story 3

- [x] T015 [US3] Implémenter le moteur de corrélation de base de données `correlate_evidence_with_db` dans `lahatheque-backend/apps/protection/forensic_service.py` (recherche croisée sur `apps.accounts.models.User`, `apps.protection.models.TraceAcces`, `apps.commerce.models.Commande`, calcul du score de certitude 0-100%)
- [x] T016 [US3] Créer la vue d'atténuation immédiate `ForensicMitigateView` dans `lahatheque-backend/apps/protection/views.py` pour suspendre le compte (`is_suspended=True`) et révoquer instantanément toutes les sessions actives (`session_version += 1`)
- [x] T017 [US3] Implémenter la génération de rapport certifié PDF avec ReportLab dans `lahatheque-backend/apps/protection/forensic_service.py` et la vue de téléchargement `ForensicReportView` dans `lahatheque-backend/apps/protection/views.py`
- [x] T018 [US3] Enregistrer les routes `mitigate/` et `report/<uuid:investigation_id>/` dans `lahatheque-backend/apps/protection/urls.py`
- [x] T019 [US3] Enrichir le service client `lahatheque-frontend/lib/services/protection.ts` avec les fonctions `analyzeForensicEvidence`, `mitigateForensicInfraction` et `downloadForensicReportUrl`
- [x] T020 [US3] Concevoir et intégrer la page du tableau de bord administrateur `lahatheque-frontend/app/(dashboard)/admin/security/forensic/page.tsx` (zone de dépôt de fichiers drag-and-drop, indicateurs visuels de certitude, fiche d'attribution, traces d'accès associées, modale de confirmation pour suspension de compte, boutons d'export de rapport)

**Checkpoint**: User Story 3 opérationnelle : l'administrateur dispose de la suite complète d'investigation et de sanction.

---

## Phase 6: Polish, Intégration Visuelle & Vérification Globale

**Goal**: Finaliser la navigation, valider les règles de conformité (zéro émoji, tokens de couleur, logs) et tester les scénarios de bout en bout.

- [x] T021 [P] Ajouter le lien d'accès et le bouton d'investigation forensique dans la page `lahatheque-frontend/app/(dashboard)/admin/security/traces/page.tsx`
- [x] T022 [P] Rédiger les tests unitaires et d'intégration dans `lahatheque-backend/apps/protection/tests/test_forensic.py`
- [x] T023 Exécuter la suite de validation de `specs/007-forensic-leak-detection/quickstart.md`
- [x] T024 [P] Mettre à jour la mémoire persistante du projet dans `.specify/memory/project_memory.md`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)** : Démarrage immédiat.
- **Foundational (Phase 2)** : Dépend du Setup, bloque toutes les User Stories.
- **User Story 1 (Phase 3)** : Dépend de Foundational. Cœur du MVP.
- **User Story 2 (Phase 4)** : Dépend de Foundational et s'intègre au service forensique.
- **User Story 3 (Phase 5)** : Dépend de US1 et US2 pour la corrélation et l'interface complète.
- **Polish & Validation (Phase 6)** : Dépend de l'ensemble des phases.

### Opportunités de Parallélisation
- T001 et T002 en Phase 1 peuvent s'exécuter en parallèle.
- T005 et T006 en Phase 2 peuvent s'exécuter en parallèle après T003.
- T021 et T022 en Phase 6 peuvent s'exécuter en parallèle.
