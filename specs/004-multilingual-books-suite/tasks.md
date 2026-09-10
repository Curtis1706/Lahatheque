# Tasks: Gestion et Lecture Multilingue des Livres (Original & Traductions)

**Feature**: `004-multilingual-books-suite`  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)  
**Date**: 2026-09-08  

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialisation des branches et vérification des dépendances techniques

- [X] T001 Vérifier la présence des dépendances Python requises (`boto3`, `PyMuPDF` / `fitz`, `openai`) dans `lahatheque-backend/requirements.txt`
- [X] T002 [P] Vérifier la présence de `pdfjs-dist` et des composants UI Lucide React (`Languages`, `BookOpen`, `Headphones`) dans `lahatheque-frontend/package.json`
- [X] T003 [P] Configurer les variables d'environnement de stockage Cloudflare R2 pour les scripts d'ingestion dans `lahatheque-backend/.env`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Socle de données et migrations ORM bloquants pour l'ensemble des user stories

- [X] T004 [P] Créer le modèle `OuvrageLanguageVersion` dans `lahatheque-backend/apps/catalog/models.py` avec UUIDv4, contrainte d'unicité `unique_ouvrage_per_language`, indexation sur `language` et `is_original`
- [X] T005 [P] Ajouter le champ `selected_language` (CharField, default='fr') au modèle `LigneCommande` dans `lahatheque-backend/apps/orders/models.py`
- [X] T006 [P] Ajouter la relation ForeignKey facultative `language_version` sur le modèle `AudioBook` dans `lahatheque-backend/apps/audio_books/models.py` (ou `apps/catalog/models.py`)
- [X] T007 Générer et appliquer les migrations Django (`makemigrations catalog orders audio_books` et `migrate`)
- [X] T008 [P] Définir les interfaces TypeScript correspondantes (`OuvrageLanguageVersion`, `LanguageVersionItem`, extension de `BookDetail`) dans `lahatheque-frontend/lib/types/catalog.ts`

**Checkpoint**: Socle ORM et typage prêts — Implémentation des User Stories débloquée.

---

## Phase 3: User Story 1 - Modélisation & Importation du Catalogue Multilingue depuis Cloudflare R2 (Priority: P1) — MVP

**Goal**: Ingestion automatisée et résiliente des 1 600+ ouvrages du bucket R2 `laha-books-production`, regroupement sous l'entité maîtresse, qualification de l'original (Option A), extraction automatique de couverture (page 1 PDF), extraction IA des métadonnées (15 premières et 15 dernières pages) et application de la redevance par défaut de 5%.

**Independent Test**: Lancer `python manage.py import_r2_multilingual_books --limit 3` et vérifier en base de données la création de l'ouvrage maître, la version anglaise originale, la version française traduite avec leurs clés R2 respectives, l'image de couverture générée et le statut de publication.

### Tests for User Story 1
- [X] T009 [P] [US1] Écrire le test unitaire de l'algorithme de détection linguistique et d'idempotence dans `lahatheque-backend/apps/catalog/tests/test_multilingual_ingestion.py`
- [X] T010 [P] [US1] Écrire le test d'extraction de couverture et d'échantillonnage PyMuPDF dans `lahatheque-backend/apps/catalog/tests/test_cover_and_text_extraction.py`

### Implementation for User Story 1
- [X] T011 [US1] Implémenter le service d'extraction de couverture (première page PDF -> conversion WebP optimisée et téléversement vers R2) dans `lahatheque-backend/apps/catalog/services/cover_generator.py`
- [X] T012 [US1] Adapter le service d'extraction IA documentaire pour appliquer la règle stricte des 15 premières et 15 dernières pages et contraindre la catégorie à `CategorieOuvrage` dans `lahatheque-backend/apps/ai_engine/services/openai_service.py`
- [X] T013 [US1] Créer la commande Django `import_r2_multilingual_books` dans `lahatheque-backend/apps/catalog/management/commands/import_r2_multilingual_books.py` :
  - Scan de l'arborescence R2 `books/<uuid>/`
  - Détection Option A (`EN/` -> `is_original=True`, `FR/` -> `is_original=False`)
  - Extraction couverture page 1
  - Extraction métadonnées IA + attribution redevance 5%
  - Traitement résilient non-bloquant en statut `draft` en cas d'anomalie
- [X] T014 [US1] Ajouter la journalisation granulaire étape par étape `[Import R2 ETAPE X/Y]` pour une traçabilité totale

**Checkpoint**: User Story 1 opérationnelle — Le catalogue Django est peuplé avec les ouvrages multilingues R2 réels.

---

## Phase 4: User Story 2 - Achat Numérique Unifié avec Accès Toutes Langues (Priority: P1)

**Goal**: Garantir qu'un achat de licence numérique confère l'accès universel à l'ensemble des déclinaisons linguistiques (actuelles et futures) rattachées à l'ouvrage, sans surcoût pour l'utilisateur.

**Independent Test**: Acquérir une licence numérique pour un ouvrage bilingue et vérifier via l'endpoint `/api/v1/student/books/<id>/access/` que l'utilisateur est autorisé à lire aussi bien la version originale que la traduction française.

### Tests for User Story 2
- [X] T015 [P] [US2] Écrire le test unitaire de validation d'accès universel dans `lahatheque-backend/apps/rights/tests/test_universal_multilingual_access.py`

### Implementation for User Story 2
- [X] T016 [US2] Mettre à jour le service de vérification d'accès `AccessService` dans `lahatheque-backend/apps/protection/access_service.py` pour valider l'accès à une `OuvrageLanguageVersion` dès lors que l'utilisateur possède l'accès à l'ouvrage maître
- [X] T017 [US2] Enrichir le sérialiseur de bibliothèque étudiante `UserBookSerializer` dans `lahatheque-backend/apps/student/serializers.py` pour renvoyer la liste des langues disponibles pour chaque livre possédé
- [X] T018 [US2] [P] Mettre à jour la carte de livre de la bibliothèque étudiante dans `lahatheque-frontend/components/features/student/book-card.tsx` pour afficher le badge `FR • EN` et permettre de lancer la lecture dans la langue voulue

**Checkpoint**: User Story 2 opérationnelle — L'achat numérique donne accès à toutes les langues sans surcoût.

---

## Phase 5: User Story 3 - Commande Physique Papier avec Sélection de la Langue & Stocks Dédiés (Priority: P1)

**Goal**: Imposer la sélection de la langue de l'exemplaire physique lors de l'achat papier, décompter le stock propre à cette langue, et afficher l'édition sur le bon de commande pour l'entrepôt logistique.

**Independent Test**: Commander un exemplaire papier en français, vérifier la décrémentation du stock physique français et la présence de la mention « Édition Française » sur la ligne de commande dans l'interface logistique.

### Tests for User Story 3
- [X] T019 [P] [US3] Écrire le test de sélection de langue papier et décompte de stock dédié dans `lahatheque-backend/apps/orders/tests/test_paper_language_order.py`

### Implementation for User Story 3
- [X] T020 [US3] Mettre à jour l'API de création de commande dans `lahatheque-backend/apps/orders/views.py` pour exiger `selected_language` lorsque `format_type == 'paper'` et contrôler `paper_stock` de la version demandée
- [X] T021 [US3] Mettre à jour la fiche produit du catalogue public dans `lahatheque-frontend/app/catalog/[id]/page.tsx` pour afficher le sélecteur obligatoire de langue papier avec les disponibilités réelles
- [X] T022 [US3] [P] Mettre à jour le récapitulatif de panier et de commande dans `lahatheque-frontend/components/features/cart/order-summary.tsx` pour mentionner la langue de l'édition physique choisie
- [X] T023 [US3] [P] Mettre à jour la vue des commandes du dashboard logistique dans `lahatheque-frontend/app/(dashboard)/wholesaler/orders/page.tsx` (ou vue entrepôt) pour afficher la langue physique d'emballage

**Checkpoint**: User Story 3 opérationnelle — Zéro ambiguïté logistique sur les commandes de manuels papier.

---

## Phase 6: User Story 4 - Bascule de Langue Instantanée dans la Liseuse LAHAThèque (Priority: P2)

**Goal**: Offrir un sélecteur de langue dans la barre d'en-tête de la liseuse dès que l'ouvrage a ≥ 2 langues, recharger le flux de streaming de la nouvelle langue avec maintien de la progression relative et protection DRM avec filigrane dynamique.

**Independent Test**: Ouvrir un livre en anglais à la page 20 sur 100 (20%), basculer en français (livre de 120 pages), constater le positionnement automatique à la page 24 (20%) avec filigrane dynamique personnalisé actif.

### Tests for User Story 4
- [X] T024 [P] [US4] Écrire le test d'API de streaming avec paramètre de langue (`/api/v1/reader/books/<id>/stream/?lang=fr`) dans `lahatheque-backend/apps/reader/tests/test_multilingual_streaming.py`
- [X] T025 [P] [US4] Écrire le test unitaire du calcul de report proportionnel de page dans `lahatheque-frontend/__tests__/reader-language-progression.test.ts`

### Implementation for User Story 4
- [X] T026 [US4] Mettre à jour `ReaderProtectedStreamView` dans `lahatheque-backend/apps/reader/views.py` pour accepter le paramètre `lang` et servir la clé R2 de la déclinaison linguistique demandée avec filigrane dynamique
- [X] T027 [US4] Créer le composant `ReaderLanguageSelector` dans `lahatheque-frontend/components/features/reader/reader-language-selector.tsx` (sélecteur compact avec icône `Languages`, tokens `navy`/`gold`, accessible au clavier)
- [X] T028 [US4] Intégrer `ReaderLanguageSelector` dans la barre d'outils supérieure de la liseuse dans `lahatheque-frontend/app/read/[token]/page.tsx`
- [X] T029 [US4] Implémenter la logique de bascule fluide asynchrone dans le hook de lecture (calcul du ratio `page / total`, récupération du nouveau flux streaming, repositionnement proportionnel sans rechargement de page)

**Checkpoint**: User Story 4 opérationnelle — Bascule bilingue instantanée dans le lecteur avec sécurité DRM.

---

## Phase 7: User Story 5 - Lecture Vocale & Synthèse Multilingue Adaptative (Priority: P2)

**Goal**: Adapter le moteur vocal ou TTS à la langue active du document, et permettre au studio audio de rattacher des narrations officielles à une version linguistique spécifique.

**Independent Test**: Déposer une narration audio en français dans le studio audio rattaché à un livre bilingue, vérifier la lecture audio en français et l'adaptation de la voix Web Speech API en mode TTS.

### Implementation for User Story 5
- [X] T030 [US5] Mettre à jour `AudioStudioForm` dans `lahatheque-frontend/components/features/audio/audio-studio-form.tsx` pour afficher le sélecteur obligatoire de langue de narration lors du rattachement à un ouvrage
- [X] T031 [US5] Mettre à jour le service audio dans `lahatheque-backend/apps/audio_books/views.py` pour associer l'audio à la clé ForeignKey `language_version` correspondante
- [X] T032 [US5] [P] Mettre à jour le composant de lecture vocale TTS dans la liseuse pour synchroniser la synthèse Web Speech API sur la langue actuellement affichée (`fr-FR` ou `en-US`)

**Checkpoint**: User Story 5 opérationnelle — Audio et synthèse vocale parfaitement calés sur la langue affichée.

---

## Phase 8: User Story 6 - Rétrocompatibilité API Partenaires & Workflows Maquettiste / Chef (Priority: P2)

**Goal**: Exposer les nouveaux champs additifs sans régression pour les SaaS partenaires, permettre le téléversement direct de traductions par le maquettiste, et adapter la validation du chef maquettiste.

**Independent Test**: Appeler `GET /api/v1/partner/catalog/` et vérifier que les champs existants sont préservés tout en fournissant `available_languages`, puis soumettre une traduction depuis le formulaire maquettiste avec téléversement direct vers R2.

### Implementation for User Story 6
- [X] T033 [US6] Mettre à jour `OuvrageBasicSerializer` dans `lahatheque-backend/apps/student/serializers.py` et `apps/catalog/serializers.py` pour ajouter les champs additifs `available_languages` et `languages`
- [X] T034 [US6] Mettre à jour `ReaderSessionViewSet` dans `lahatheque-backend/apps/reader/views.py` pour accepter le paramètre facultatif `language`
- [X] T035 [US6] Mettre à jour le formulaire maquettiste dans `lahatheque-frontend/app/(dashboard)/layout-artist/deposits/new/page.tsx` :
  - Sélecteur de mode : *« Nouvel ouvrage (Original) »* vs *« Traduction / Déclinaison »*
  - Téléversement direct vers R2 via `uploadFileDirectlyToR2` pour le fichier traduit
  - Pré-remplissage des métadonnées de l'ouvrage maître et assignation `is_original = False`
- [X] T036 [US6] [P] Mettre à jour la file de validation du Chef Maquettiste dans `lahatheque-frontend/app/(dashboard)/chief-layout/validation/page.tsx` pour afficher le badge *« Traduction [FR] • Liée à : [Titre] »* et opérer le rattachement sous l'ouvrage maître sans doublon catalogue
- [X] T037 [US6] [P] Ajouter la gestion du toggle `is_original` et la vue des déclinaisons dans le dashboard catalogue admin (`lahatheque-frontend/app/(dashboard)/admin/catalog/page.tsx`)

**Checkpoint**: User Story 6 opérationnelle — API partenaire rétrocompatible et dashboards éditoriaux synchronisés.

---

## Phase 9: User Story 7 - Haute Performance Redis Catalogue & Streaming Bilingue Partenaire (Priority: P1) [FR-015, FR-021, FR-024]

**Goal**: Optimiser les performances de l'API partenaire (`PartnerCatalogListView`) avec le cache Redis serveur LAHAThèque (TTL 15 min), le préchargement relationnel anti-N+1, la levée du plafond de 100 ouvrages, les filtres `language`/`q`/`discipline`/`page`/`page_size`, le court-circuit M2M pour `is_owned`/`has_digital_access`, et la cascade dynamique de langue (`?lang=`) lors du streaming protégé de session (`ReaderProtectedStreamView`).

**Independent Test**:
1. Appeler `GET /api/v1/partner/catalog/?language=fr` et mesurer la latence (< 20 ms au 2e appel via Redis).
2. Vérifier que `is_owned` et `has_digital_access` sont `false` sans requêtes `AccessService`.
3. Appeler `GET /api/v1/reader/sessions/stream/?lang=en` puis `?lang=fr` avec `X-Reader-Token` et constater la diffusion des flux bilingues distincts filigranés avec code HTTP 206.

### Implementation for User Story 7
- [X] T038 [P] [US7] Implémenter le cache Redis (TTL 15 min), l'invalidation ciblée et le préchargement relationnel (`select_related('discipline', 'institution')`, `prefetch_related('authors', 'language_versions')`) dans `lahatheque-backend/apps/reader/views.py` (`PartnerCatalogListView`)
- [X] T039 [P] [US7] Supprimer le plafond rigide de 100 ouvrages et ajouter les paramètres de filtrage (`language`, `q`, `discipline`) et de pagination (`page`, `page_size`) dans `lahatheque-backend/apps/reader/views.py` (`PartnerCatalogListView`)
- [X] T040 [P] [US7] Implémenter le court-circuit M2M partenaire dans `lahatheque-backend/apps/student/serializers.py` (`OuvrageBasicSerializer`) pour forcer `is_owned=False` et `has_digital_access=False` sans appeler `AccessService`
- [X] T041 [US7] Implémenter la résolution de langue en cascade (`?lang=` > `session.metadata['language']` > langue originale) dans `lahatheque-backend/apps/reader/views.py` (`ReaderProtectedStreamView`) et propager `{ouvrage_id}:{lang}` vers `DerivedMaterializer`
- [X] T042 [P] [US7] Écrire les tests d'intégration automatisés du cache Redis et du streaming bilingue de session dans `lahatheque-backend/apps/reader/tests/test_partner_catalog_performance.py`

**Checkpoint**: User Story 7 opérationnelle — API partenaire ultra-rapide (cache Redis serveur), sans limite de 100 livres et streaming protégé bilingue étanche.

---

## Phase 10: User Story 8 - Mise à Jour Exhaustive du Guide Partenaire Accès Mixte & SDKs (Priority: P1) [FR-024]

**Goal**: Mettre à jour intégralement le document officiel [GUIDE_INTEGRATION_ACCES_MIXTE.md](../../GUIDE_INTEGRATION_ACCES_MIXTE.md) pour refléter 100% des capacités réelles du backend LAHAThèque (champs multilingues, cache Redis serveur, SDKs Python/TypeScript/PHP, streaming transparent EPUB->PDF et webhook enrichi).

**Independent Test**: Relire ligne par ligne [GUIDE_INTEGRATION_ACCES_MIXTE.md](../../GUIDE_INTEGRATION_ACCES_MIXTE.md) et exécuter les exemples de code des SDKs Python, TypeScript et PHP contre l'API locale pour confirmer leur conformité exacte.

### Implementation for User Story 8
- [X] T043 [US8] Mettre à jour la section 4 et 5 de `GUIDE_INTEGRATION_ACCES_MIXTE.md` :
  - Paramètre optionnel `language` dans `POST /api/v1/reader/sessions/`
  - Nouveaux champs `available_languages`, `languages`, `has_audio`, `has_audio_version`, `price_audio` dans la réponse catalogue `GET /api/v1/partner/catalog/`
  - Paramètres de requête de filtrage `?language=`, `?q=`, `?discipline=`, `?page=`, `?page_size=` et levée de limite
  - Explication sur la sémantique M2M des champs `is_owned` et `has_digital_access` (`false` en contexte M2M)
- [X] T044 [US8] Ajouter une section dédiée dans `GUIDE_INTEGRATION_ACCES_MIXTE.md` expliquant l'accélération par Cache Redis opéré sur le VPS LAHAThèque (confirmant aux partenaires qu'aucun serveur Redis n'est requis chez eux)
- [X] T045 [US8] Mettre à jour les exemples de code des 3 SDKs d'intégration dans `GUIDE_INTEGRATION_ACCES_MIXTE.md` :
  - SDK Python 3.10+ (`open_catalog_book` avec argument `language=None`, méthode `search_catalog` avec paramètre `language`)
  - SDK TypeScript / Node.js (`openCatalogBook` avec `language?: string`, méthode `searchCatalog` avec `language`)
  - SDK PHP / Laravel (`openCatalogBook` avec `?string $language = null`, méthode `searchCatalog` avec `language`)
- [X] T046 [US8] Documenter la prise en charge transparente des ouvrages EPUB (convertis automatiquement en PDF vectoriel par LAHAThèque sans impact client) et le champ `language` dans le payload du webhook `reader.session.opened`

**Checkpoint**: User Story 8 opérationnelle — Le guide d'intégration partenaire est 100% fidèle, complet et directement utilisable par les universités et SaaS tiers.

---

## Phase 11: User Story 9 - Vitrine Publique Nouveautés & Expérience Panier (Priority: P2) [FR-022, FR-023]

**Goal**: Garantir que la section "Nouveautés" de la vitrine d'accueil (`/`) charge dynamiquement les 6 ouvrages les plus récents en priorisant la disponibilité en français, avec redirection vers la fiche détaillée et ajout direct au panier numérique via le bouton chariot (toast + ouverture du tiroir latéral `CartDrawer`).

**Independent Test**: Ouvrir `http://localhost:3000`, vérifier l'affichage des 6 livres sans bouchon statique, cliquer sur la carte (redirection vers `/catalog/[slug]`), cliquer sur le chariot (ouverture du tiroir panier avec l'article ajouté).

### Implementation for User Story 9
- [X] T047 [US9] Valider la requête dynamique de sélection des 6 nouveautés publiées avec priorité français dans `lahatheque-frontend/app/(public)/page.tsx`
- [X] T048 [US9] Valider la redirection sur clic de carte vers `/catalog/[slug_or_id]` et l'action d'ajout panier numérique via `useCart.addItem()` avec toast et ouverture automatique de `CartDrawer` dans `lahatheque-frontend/app/(public)/page.tsx`

**Checkpoint**: User Story 9 opérationnelle — Vitrine d'accueil dynamique, bilingue et convertisseuse.

---

## Phase 12: User Story 10 - Accélération & Virtualisation du Mode Immersion 3D (Priority: P1) [FR-026, SC-007]

**Goal**: Garantir une ouverture instantanée (< 400 ms) du mode immersion 3D (`FlipBookReader`) sans saturer le navigateur ni la mémoire vive du serveur : rendu prioritaire immédiat de la couverture/page 1, virtualisation DOM du composant `HTMLFlipBook`, persistance locale des textures dans IndexedDB (réouverture à 0 ms) et cache Redis pour les métadonnées de pagination.

**Independent Test**:
1. Ouvrir un ouvrage de 200+ pages en mode Immersion 3D et mesurer le temps avant affichage de la couverture (< 400 ms).
2. Vérifier la fluidité du feuilletage et la faible consommation mémoire DOM (pages actives ± 2).
3. Fermer et rouvrir le même livre : constater l'ouverture instantanée (0 ms) via le cache local IndexedDB.

### Implementation for User Story 10
- [ ] T053 [P] [US10] Créer le service de cache local IndexedDB `ReaderPageCache` dans `lahatheque-frontend/lib/services/reader-cache.ts` avec opérations `getPageBlob` / `savePageBlob` indexées par `bookId:lang:page`
- [ ] T054 [US10] Découpler le cycle de chargement dans `lahatheque-frontend/components/library/FlipBook.tsx` : rendu prioritaire immédiat de la page visible initiale, levée de l'overlay "Préparation du livre 3D" sous 400 ms, et délégation du calcul des pages restantes en tâche de fond asynchrone
- [ ] T055 [US10] Implémenter la virtualisation et l'allègement DOM de `HTMLFlipBook` dans `lahatheque-frontend/components/library/FlipBook.tsx` pour ne charger les nœuds graphiques que sur la fenêtre active (page courante ± 2 pages)
- [ ] T056 [P] [US10] Ajouter la mise en cache Redis des métadonnées de structure PDF (`page_count`, `dimensions`, `aspect_ratio`) dans `lahatheque-backend/apps/catalog/stream_views.py` avec TTL de 24h
- [ ] T057 [US10] Valider l'expérience de lecture 3D sur desktop et mobile sans latence ni layout shift

---

## Phase 13: Polish & Validation Globale

**Purpose**: Validation croisée, vérification de non-régression et conformité constitutionnelle

- [ ] T058 [P] Mettre à jour la documentation d'API globale dans `DOCUMENTATION_API_LAHATHÈQUE.md`
- [ ] T059 Valider le guide de démarrage rapide [quickstart.md](./quickstart.md) avec un test complet de bout en bout
- [ ] T060 Vérification de l'interdiction stricte des émojis et respect des tokens de couleur sémantiques dans tous les composants modifiés
- [ ] T061 Exécuter la suite complète de tests de non-régression backend (`python manage.py test`)

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phases 1 & 2 (Setup & Foundational)** : Terminées.
- **Phases 3 à 8 (US1 à US6)** : Socle multilingue, droits, liseuse interne et formulaires éditoriaux terminés.
- **Phases 9 à 11 (US7 à US9)** : Performance catalogue Redis, guide partenaire et vitrine terminés.
- **Phase 12 (US10 - Immersion 3D)** : Prête à être exécutée immédiatement sur `FlipBook.tsx`.
- **Phase 13 (Polish & Validation Globale)** : Exécution finale après Phase 12.

---

## Implementation Strategy

### Prochaine Étape Immédiate (Phase 12 : Accélération Immersion 3D)
1. **Frontend Cache** : Création du helper IndexedDB `reader-cache.ts` (`T053`).
2. **Frontend FlipBook** : Découplage du rendu immédiat de la page 1 et virtualisation du FlipBook (`T054`, `T055`).
3. **Backend Cache Métadonnées** : Cache Redis des métadonnées de dimensions/pages dans `stream_views.py` (`T056`).
4. **Validation** : Test de bout en bout sous 400 ms (`T057`, `T059`).
