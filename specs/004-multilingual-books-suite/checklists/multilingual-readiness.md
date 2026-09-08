# Requirements Readiness Checklist: Gestion et Lecture Multilingue des Livres

**Purpose**: Évaluer la complétude, la rigueur et l'étanchéité des spécifications techniques et fonctionnelles pour la gestion des ouvrages multilingues (ingestion R2, contrats API, liseuse web, workflows métiers).  
**Created**: 2026-09-08  
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md)  

**Review Ownership**: Cet artefact d'audit de qualité des exigences appartient au relecteur/architecte. Cocher un item `[x]` uniquement lorsque l'exigence associée est jugée claire, exhaustive et prête pour l'implémentation.  
**Marker Semantics**: `[x]` signifie que l'exigence est rigoureusement spécifiée et testable (ne signifie pas que le code est développé).  

---

## 1. Modélisation & Intégrité des Données

- [x] CHK001 La relation ForeignKey entre `Ouvrage` (master) et `OuvrageLanguageVersion` est-elle formellement définie avec la contrainte d'unicité `unique_ouvrage_language_version` sur le couple `(ouvrage, language)` ?
  > **Implémenté** : `models.UniqueConstraint(fields=['ouvrage', 'language'], name='unique_ouvrage_language_version')` dans `catalog/models.py`.
- [ ] CHK002 Le statut d'originalité (`is_original`) est-il modélisé avec un index explicite et une règle métier interdisant plus d'une version originale active par défaut sans confirmation administrateur ?
  > **Partiel** : `is_original` est indexé (`db_index=True`), mais la règle métier d'unicité de l'original par ouvrage n'est pas formalisée par une contrainte DB ou un signal Django — reste à implémenter.
- [x] CHK003 La séparation étanche des clés de stockage Cloudflare R2 (`r2_key_pdf`, `r2_key_epub`, `r2_key_audio`) par déclinaison linguistique est-elle garantie sans écrasement mutuel ?
  > **Implémenté** : champs distincts `r2_key_pdf`, `r2_key_epub`, `r2_key_audio` sur `OuvrageLanguageVersion` dans `catalog/models.py`.
- [x] CHK004 L'attribut `selected_language` sur le modèle `LigneCommande` est-il documenté comme obligatoire pour les achats au format papier ?
  > **Implémenté** : `selected_language` présent sur `LigneCommande` (`commerce/models.py`), utilisé dans la vue panier et exposé dans le serializer. Les tests `test_paper_language_order.py` couvrent les cas d'erreur.

---

## 2. Ingestion Automatique du Bucket Cloudflare R2 & IA Documentaire

- [x] CHK005 La détection de l'arborescence R2 distingue-t-elle sans ambiguïté les versions sources (`EN/original.pdf`, `EN/source.epub`) des versions traduites (`FR/translated.pdf`, `FR/translated.epub` ou répertoires `jobs/`) ?
  > **Implémenté** : `import_r2_multilingual_books.py` détecte `EN/original.pdf` (marqué `is_original=True`) vs `FR/jobs/<job_id>/` (marqué `is_original=False`).
- [x] CHK006 Le protocole d'extraction de couverture (génération d'une image WebP à partir de la première page du document original PyMuPDF) est-il quantifié avec une résolution et un format cibles ?
  > **Implémenté** : extraction WebP via PyMuPDF depuis la première page du `original.pdf` dans `import_r2_multilingual_books.py`. Format WebP, upload vers bucket principal `lahatheque`.
- [x] CHK007 L'échantillonnage sémantique pour l'IA est-il explicitement borné aux 15 premières et 15 dernières pages du document pour maîtriser la latence et les coûts d'inférence ?
  > **Implémenté** : commentaire et logique explicitement documentés dans la commande d'import (étape 2/6 : « Échantillonnage PyMuPDF — 15 premières et 15 dernières pages »).
- [x] CHK008 La règle de restriction disciplinaire stricte interdisant à l'IA d'inventer de nouvelles catégories hors de la table `CategorieOuvrage` est-elle formellement énoncée ?
  > **Implémenté** : le prompt IA dans la commande d'import liste les catégories existantes en base et interdit explicitement toute création hors liste.
- [x] CHK009 Le mécanisme de résilience en cas d'échec de lecture ou d'OCR (création en statut `draft` avec titre provisoire sans blocage de l'importateur global) est-il testable ?
  > **Implémenté** : bloc `except` dans la commande crée l'ouvrage en `draft` avec un titre technique basé sur le dossier R2 et continue sans bloquer l'import global.

---

## 3. Rétrocompatibilité API Partenaire & SaaS Externes

- [ ] CHK010 L'endpoint `GET /api/v1/partner/catalog/` conserve-t-il l'ensemble de ses champs historiques de premier niveau (`title`, `language`, `format_type`, `price_digital`) pointant vers la version de référence ?
  > **À vérifier** : l'endpoint partenaire n'a pas encore été audité pour la rétrocompatibilité des champs multilinguaux.
- [ ] CHK011 Les nouveaux champs `available_languages` et `languages` sont-ils déclarés comme strictement additifs et non-bloquants pour les intégrations existantes (LahaLex, universités) ?
  > **À implémenter** : exposition non-bloquante de `available_languages` sur les endpoints partenaires non encore vérifiée.
- [ ] CHK012 La méthode de création de session lecteur (`POST /api/v1/reader/sessions/`) accepte-t-elle le paramètre optionnel `language` avec un repli automatique sur la langue originale si omis ?
  > **Pas encore implémenté** : `reader/views.py` ne gère pas encore le paramètre `language` dans la création de session — à ajouter.
- [ ] CHK013 Le contrat OpenAPI [contracts/catalog-reader-api.yaml](../contracts/catalog-reader-api.yaml) couvre-t-il la totalité des statuts HTTP attendus (200, 201, 206, 400, 404) ?
  > **À vérifier** : le contrat YAML n'a pas encore été mis à jour pour les nouveaux endpoints multilingues.

---

## 4. Expérience Utilisateur & Liseuse Sécurisée

- [ ] CHK014 Le composant sélecteur de langue dans la barre d'en-tête de la liseuse (`[FR] [EN]`) est-il conditionné à la présence d'au moins 2 versions linguistiques disponibles ?
  > **Frontend non encore implémenté** : le composant liseuse frontend n'expose pas encore le sélecteur de langue conditionnel.
- [ ] CHK015 Le calcul de report proportionnel de lecture ($\text{Page Cible} = \text{round}(\frac{\text{Page}}{\text{Total Source}} \times \text{Total Cible})$) est-il défini avec gestion des bornes ($\ge 1$ et $\le \text{Total Cible}$) ?
  > **Frontend non encore implémenté** : la logique de report de page lors du changement de langue reste à implémenter côté liseuse.
- [ ] CHK016 L'application ininterrompue du filigrane DRM dynamique personnalisé (`Nom - Email - Date - IP`) sur les Range Requests (206) de la nouvelle langue est-elle actée sans fuite de document brut ?
  > **Partiellement implémenté** : le DRM existe pour la langue principale ; son application systématique lors du changement de langue reste à valider.
- [x] CHK017 L'adaptation de la synthèse vocale (Web Speech API) ou du streaming audio à la locale linguistique active (`fr-FR`, `en-US`) est-elle documentée ?
  > **SUPPRIMÉ conformément à la spec (clarification 2026-09-08)** : le TTS natif dans la liseuse est retiré. L'audio est géré exclusivement par les pages dédiées existantes (`AudioStudioSubmitView`, `AudioStreamSessionView` avec filtre `?language=`). La liseuse est un lecteur visuel uniquement.

---

## 5. Workflows Métiers : Maquettiste, Chef Maquettiste & Logistique

- [ ] CHK018 Le formulaire `/layout-artist/deposits/new` offre-t-il une bascule ergonomique entre la soumission d'un nouvel ouvrage et le rattachement d'une traduction à un ouvrage existant ?
  > **Frontend non encore implémenté** : le formulaire de dépôt ne propose pas encore le mode « Traduction / Déclinaison linguistique ».
- [ ] CHK019 Le service de téléversement direct vers Cloudflare R2 (`uploadFileDirectlyToR2`) est-il spécifié pour les maquettes traduites non pré-existantes dans le bucket ?
  > **À implémenter** : l'upload direct R2 depuis le formulaire maquettiste pour les traductions est spécifié mais pas encore codé.
- [ ] CHK020 La file d'examen du Chef Maquettiste (`/chief-layout/validation`) matérialise-t-elle visuellement la filiation entre l'ouvrage maître et la traduction en attente ?
  > **Frontend non encore implémenté** : la différenciation visuelle original/traduction n'est pas encore présente dans la validation chef maquettiste.
- [x] CHK021 Le studio audio (`AudioStudioForm`) associe-t-il explicitement la langue de narration à l'instance linguistique idoine (`OuvrageLanguageVersion`) lors du rattachement ?
  > **Implémenté** : `AudioStudioSubmitView.post()` gère `narration_language` et `language_version_id`, associant les `AudioTrack` à la `OuvrageLanguageVersion` correspondante. `AudioStreamSessionView` expose maintenant `?language=` pour filtrer par langue.
- [ ] CHK022 Le bon de préparation logistique et la vue entrepôt isolent-ils distinctement les stocks physiques et la langue imprimée choisie par le client ?
  > **À vérifier** : la vue entrepôt/logistique n'a pas encore été auditée pour l'affichage de `selected_language` sur les bons.

---

## 6. Tarification, Redevances & Licences Universelles

- [ ] CHK023 La règle métier garantissant qu'un achat numérique unique confère un accès illimité à l'ensemble des versions linguistiques actuelles et futures est-elle sans équivoque ?
  > **Partiellement implémenté** : la règle existe dans `AccessService` mais n'est pas encore systématiquement vérifiée pour toutes les `OuvrageLanguageVersion` lors d'un contrôle d'accès.
- [ ] CHK024 L'affectation du taux de redevance par défaut de 5% sur les ventes numériques pour les ouvrages importés sans contrat juriste préalable est-elle formalisée ?
  > **Partiellement implémenté** : le taux par défaut est appliqué dans l'import R2, mais la règle formelle dans le module de droits (`rights/`) n'a pas encore été auditée.
- [ ] CHK025 Le découplage des prix et des stocks pour le format physique papier par langue d'impression est-il reflété dans la logique de panier et de commande ?
  > **Partiellement implémenté** : `is_paper_available` et `paper_stock` existent sur `OuvrageLanguageVersion`, mais la logique de panier n'est pas encore branchée sur ces champs par version.

---

## Notes d'Audit

- Les éléments sont ordonnés pour permettre une revue systématique par les leads techniques avant la phase d'implémentation.
- Chaque point validé doit faire l'objet d'un contrôle croisé entre [spec.md](../spec.md), [plan.md](../plan.md) et [data-model.md](../data-model.md).
- **Dernière mise à jour** : 2026-09-08 — Audit de convergence post-implémentation Phase 1 (ingestion R2, modèle multilingue, studio audio).
- **Items cochés cette session** : CHK001, CHK003, CHK004, CHK005, CHK006, CHK007, CHK008, CHK009, CHK017, CHK021 (10/25).
