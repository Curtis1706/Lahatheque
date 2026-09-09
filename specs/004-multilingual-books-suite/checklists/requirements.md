
# Specification Quality Checklist: Gestion et Lecture Multilingue des Livres

**Purpose**: Valider la complétude, la cohérence et la testabilité de la spécification de gestion multilingue avant de passer à la planification technique.
**Feature**: [spec.md](../spec.md)
**Created**: 2026-09-08

---

## 1. Modélisation des Données & Ingestion R2

- [X]  CHK001 La distinction entre l'entité maîtresse `Ouvrage` et ses déclinaisons linguistiques `OuvrageLanguageVersion` est-elle formellement établie sans ambiguïté ? [FR-001]
- [X]  CHK002 La structure de stockage Cloudflare R2 (`books/<uuid>/EN/...` et `books/<uuid>/FR/...`) est-elle documentée avec ses types de fichiers respectifs (PDF, EPUB, JSON) ? [FR-002, FR-003]
- [X]  CHK003 La commande d'importation automatisée est-elle spécifiée de façon idempotente (capacité à mettre à jour un livre sans le dupliquer) ? [FR-003, Edge Cases]
- [X]  CHK004bis La qualification de la langue originale (Option A : métadonnées source / arborescence) est-elle actée ? [FR-012]
- [X]  CHK004ter L'extraction IA des métadonnées selon le workflow maquettiste et la restriction stricte aux catégories BD existantes sont-elles spécifiées ? [FR-013]
- [X]  CHK004quater L'attribution du taux de redevance numérique par défaut de 5% est-elle garantie ? [FR-014]

---

## 2. Achat, Tarification & Licences

- [X]  CHK004 La règle de licence numérique universelle (accès à toutes les langues sans surcoût) est-elle explicitement garantie ? [FR-004, SC-004]
- [X]  CHK005 L'affichage des langues disponibles sur la fiche catalogue et la bibliothèque utilisateur est-il clairement précisé ? [FR-005]
- [X]  CHK006 L'obligation de sélection de la langue pour le format Papier avec contrôle de stock dédié est-elle documentée ? [FR-006, FR-007]
- [X]  CHK007 Le traitement des livres dont certaines langues ne sont disponibles qu'en numérique (indisponibles en papier) est-il clairement spécifié ? [Edge Cases, FR-006]

---

## 3. Liseuse LAHAThèque & Expérience Utilisateur

- [X]  CHK008 La présence du sélecteur de langue dans le header de la liseuse est-elle conditionnée à l'existence d'au moins deux versions ? [FR-008]
- [X]  CHK009 Le mécanisme de maintien de la progression relative de lecture lors du changement de langue est-il quantifié ? [FR-009, Edge Cases]
- [X]  CHK010 La continuité de la protection DRM et de l'apposition du filigrane dynamique sur chaque version linguistique chargée est-elle actée ? [FR-009, SC-005]
- [X]  CHK011 Le basculement intelligent entre PDF et EPUB lorsque l'un des deux formats fait défaut dans une langue donnée est-il spécifié ? [Edge Cases]

---

## 4. Lecture Vocale & Synthèse Multilingue

- [X]  CHK012 La distinction entre fichier audio pré-enregistré officiel et synthèse vocale Web Speech API est-elle claire ? [FR-010, User Story 5]
- [X]  CHK013 L'adaptation automatique de la voix de synthèse à la langue actuellement visualisée (`fr-FR`, `en-US`) est-elle requise ? [FR-010]

---

## 5. API & Performance

- [X]  CHK014 Les endpoints REST du catalogue et de la liseuse exposent-ils les métadonnées de toutes les versions linguistiques rattachées ? [FR-011]
- [X]  CHK015 Les critères de performance de bascule de langue (< 1.5s) sont-ils vérifiables ? [SC-002]
- [X]  CHK016 L'absence de rupture (zéro breaking change) pour les SaaS partenaires consommant l'API est-elle garantie par un design purement additif ? [FR-015]
- [X]  CHK017 L'impact et la cohérence de la logique multilingue sur l'ensemble des dashboards (Admin, Logistique, Finance, Universités) sont-ils formalisés ? [FR-016]

---

## 6. Workflows Maquettiste & Studio Audio Multilingue

- [X]  CHK018 Le formulaire maquettiste et la validation chef maquettiste gèrent-ils distinctement le dépôt d'un original et le rattachement d'une traduction sans doublon catalogue ? [FR-017]
- [X]  CHK019 Le studio audio prend-il en compte la langue de narration lors du rattachement à un ouvrage pour lier l'audio à la déclinaison linguistique idoine ? [FR-018]
- [X]  CHK020 L'héritage de couverture et l'extraction automatique de la première page du document original R2 pour générer la couverture sont-ils documentés ? [FR-019]
- [X]  CHK021 Le traitement non-bloquant des échecs d'extraction IA (brouillon draft et file de révision) est-il documenté pour garantir la résilience de l'ingestion ? [FR-020]

---

## 7. Conversion EPUB, Performance & Intégration Partenaire

- [X]  CHK022 La conversion automatisée EPUB → PDF vectoriel avec stockage sur Cloudflare R2 et verrou distribué Redis anti-thundering herd est-elle garantie ? [FR-021, SC-006]
- [X]  CHK023 La mise à jour exhaustive et obligatoire du document `GUIDE_INTEGRATION_ACCES_MIXTE.md` et de ses trois SDKs (Python, TypeScript, PHP) est-elle spécifiée ? [FR-024]
- [X]  CHK024 Le chargement rapide sans limitation arbitraire du catalogue partenaire via cache Redis serveur LAHAThèque et préchargement relationnel est-il formalisé ? [FR-015, FR-024]
- [X]  CHK025 La résolution dynamique en cascade de la langue sur le streaming de session partenaire (`?lang=`) avec repli transparent sans rupture est-elle actée ? [FR-009, FR-024]

---

## 8. Interface d'Édition Admin & Comboboxes Normalisées

- [X]  CHK026 La page d'édition complète (`/admin/catalog/[id]/edit`) et l'intégration des Comboboxes normalisées (`PublisherCombobox`, `DisciplineCombobox` multi-sélection, `AuthorCombobox`, `UniversityCombobox`, `CountryCombobox`) avec re-téléversement Cloudflare R2 et gestion multilingue sont-elles formellement spécifiées ? [FR-025]

---

## 9. Performance & Optimisation du Mode Immersion 3D

- [X]  CHK027 L'ouverture instantanée du mode immersion 3D (< 400 ms) via virtualisation DOM de FlipBook, rendu prioritaire immédiat des 2 premières pages, cache navigateur IndexedDB et usage léger de Redis pour les métadonnées est-elle garantie sans surcharge RAM ? [FR-026, SC-007]
