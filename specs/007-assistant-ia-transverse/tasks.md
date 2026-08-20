# Tasks: Module 7 - Assistant Intelligence Artificielle Transverse

**Feature**: `007-assistant-ia-transverse`  
**Status**: Ready for Implementation  
**Source Métier**: Cahier des charges LAHAThèque v3.2 (Section C & Section 14)

---

## Phase 1 : Services d'Analyse et Modèles Backend (Django)

- [ ] **T-701** : Créer les modèles `AISuggestionCache` et `AICallLog` dans `apps/ai_engine/models.py` avec indexation SHA-256 du document pour éviter les doubles appels API.
- [ ] **T-702** : Implémenter le service d'extraction textuelle ciblée `TextExtractorService` (50 premières pages, sommaire, introduction, 4e de couverture) via PyMuPDF / pdfplumber.
- [ ] **T-703** : Implémenter `ClassificationService` (`apps/ai_engine/services.py`) pour la détection automatique de la langue, de la discipline, du pays de rattachement et la génération de résumé structuré.
- [ ] **T-704** : Configurer le mode dégradé (fallback heuristique sous 3s) pour garantir qu'aucune panne d'API LLM ne bloque le dépôt du maquettiste ou de l'éditeur.

---

## Phase 2 : Génération d'Exports Word & Détection d'Incohérences

- [ ] **T-705** : Implémenter `DocxExportService` avec `python-docx` pour générer les fichiers Word (`.docx`) professionnels de bouquets documentaires (page de garde, sommaire automatique, notices d'ouvrages et liens).
- [ ] **T-706** : Implémenter le vérificateur de cohérence des métadonnées (alerte non bloquante en cas de contradiction entre titre, discipline et faculté).

---

## Phase 3 : Endpoints DRF & Connexion Frontend

- [ ] **T-707** : Exposer `POST /api/v1/ai/classify/` et `POST /api/v1/ai/export-bouquet-docx/` dans `apps/ai_engine/views.py`.
- [ ] **T-708** : Connecter le bouton d'assistance IA dans le formulaire de dépôt maquettiste (`/layout-artist/deposits/new`) et le bouton d'export Word dans l'espace bouquets (`/librarian/bouquets` et `/admin/catalog`).
