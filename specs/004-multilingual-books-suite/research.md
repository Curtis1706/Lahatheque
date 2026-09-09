# Phase 0: Technical Research & Architecture Decisions

**Feature**: Gestion et Lecture Multilingue des Livres (Original & Traductions)  
**Spec**: [spec.md](./spec.md)  
**Date**: 2026-09-08  

---

## 1. Analyse & Modélisation de Données (Django ORM)

### Problématique
Initialement, le modèle `Ouvrage` encapsulait à la fois l'œuvre intellectuelle et son fichier unique (`file_url`, `language`, `is_paper_available`). Pour supporter les 1 600+ livres de Cloudflare R2 (anglais originaux et déclinaisons traduites en français) ainsi que les futures traductions, il est nécessaire de découpler l'entité maîtresse de ses déclinaisons linguistiques.

### Décision d'Architecture
Création du modèle `OuvrageLanguageVersion` lié par clé étrangère à `Ouvrage` :

```python
class OuvrageLanguageVersion(models.Model):
    """
    Déclinaison linguistique d'un ouvrage (originale ou traduction).
    Permet à un livre d'exister en plusieurs langues avec des fichiers R2 distincts,
    des stocks physiques séparés et des flux audio dédiés.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ouvrage = models.ForeignKey(
        'catalog.Ouvrage',
        on_delete=models.CASCADE,
        related_name='language_versions',
        help_text="Ouvrage maître de rattachement"
    )
    language = models.CharField(
        max_length=10,
        db_index=True,
        help_text="Code ISO de la langue (fr, en, es, etc.)"
    )
    is_original = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Vrai s'il s'agit de la version originale source"
    )
    title = models.CharField(
        max_length=255,
        blank=True,
        help_text="Titre de l'ouvrage dans cette langue"
    )
    summary = models.TextField(
        blank=True,
        help_text="Résumé/synopsis traduit dans cette langue"
    )
    
    # Fichiers et stockage Cloudflare R2
    r2_key_pdf = models.CharField(
        max_length=512,
        blank=True,
        help_text="Clé R2 du fichier PDF (ex: books/<uuid>/FR/translated.pdf)"
    )
    r2_key_epub = models.CharField(
        max_length=512,
        blank=True,
        help_text="Clé R2 du fichier EPUB (ex: books/<uuid>/FR/translated.epub)"
    )
    r2_key_audio = models.CharField(
        max_length=512,
        blank=True,
        help_text="Clé R2 de la narration audio principale"
    )
    
    # Métadonnées physiques et visuelles
    cover_url = models.URLField(
        max_length=1024,
        blank=True,
        help_text="URL de couverture spécifique (hérite de l'ouvrage maître si vide)"
    )
    page_count = models.PositiveIntegerField(
        default=0,
        help_text="Nombre de pages de cette version linguistique"
    )
    is_paper_available = models.BooleanField(
        default=False,
        help_text="Disponibilité d'exemplaires physiques imprimés dans cette langue"
    )
    paper_stock = models.PositiveIntegerField(
        default=0,
        help_text="Stock physique d'exemplaires papier dans cette langue"
    )
    translation_status = models.CharField(
        max_length=30,
        choices=[
            ('ready', 'Prêt / Validé'),
            ('in_progress', 'En cours de traduction'),
            ('draft', 'Brouillon / En révision'),
        ],
        default='ready',
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "catalog_ouvrage_language_version"
        constraints = [
            models.UniqueConstraint(
                fields=['ouvrage', 'language'],
                name='unique_ouvrage_per_language'
            )
        ]
```

---

## 2. Ingestion Automatique depuis Cloudflare R2 & Pipeline IA

### Découverte & Regroupement des Objets R2
L'inventaire du bucket `laha-books-production` regroupe 1 647 fichiers répartis sous `books/<uuid>/`. L'importateur automatisé procède selon l'algorithme :
1. **Regroupement par UUID de dossier** : Tous les fichiers sous `books/<uuid>/` sont attribués au même `Ouvrage`.
2. **Identification des Déclinaisons Linguistiques (Option A)** :
   - Fichiers sous `EN/` (`original.pdf`, `source.epub`) -> Version anglaise marquée `is_original = True`.
   - Fichiers sous `FR/` (`translated.pdf`, `translated.epub`) ou sous `FR/jobs/<job-id>/` -> Version française marquée `is_original = False`.
3. **Extraction de Couverture Automatique (Règle validée)** :
   - Le bucket ne stockant aucune image séparée, le script utilise PyMuPDF (`fitz`) pour convertir la première page de `original.pdf` en image WebP (`books/<uuid>/cover.webp`), l'expédie sur R2 et alimente `cover_url`.
4. **Extraction Documentaire par IA (Règle des 15 Premières & 15 Dernières Pages)** :
   - Extraction des pages 1 à 15 et N-14 à N via PyMuPDF.
   - Soumission sémantique à `analyze_document_with_openai`.
   - Mappage strict de la catégorie proposée sur la table `CategorieOuvrage` existante en base.
5. **Redevance Auteur Numérique** :
   - Attribution du taux contractuel par défaut de 5% sur le format numérique.
6. **Résilience face aux échecs** :
   - En cas d'erreur de lecture PDF (PDF scanné sans OCR ou atypique), l'importateur crée l'ouvrage avec le statut `draft` et consigne l'élément dans la file de révision sans stopper le scan global des 1 600+ livres.

---

## 3. Rétrocompatibilité Absolue de l'API Partenaire (Zéro Breaking Change)

### Exigence
Les plateformes partenaires (universités, LahaLex, intégrateurs d'accès mixte) consomment l'API v1 (`/api/v1/partner/catalog/`, `/api/v1/reader/sessions/`).

### Solution
- **Champs de premier niveau préservés** : `language`, `title`, `format_type`, `price_digital`, `is_paper_available` continuent d'exposer la version originale de référence.
- **Champs additifs non-bloquants** :
  ```json
  {
    "id": "uuid-ouvrage",
    "title": "Titre Original",
    "language": "en",
    "available_languages": ["en", "fr"],
    "languages": [
      {
        "id": "uuid-version-en",
        "language": "en",
        "is_original": true,
        "format_type": "pdf",
        "is_paper_available": true
      },
      {
        "id": "uuid-version-fr",
        "language": "fr",
        "is_original": false,
        "format_type": "pdf",
        "is_paper_available": false
      }
    ]
  }
  ```
- **Sessions lecteur (`/api/v1/reader/sessions/`)** : Le paramètre `language` est facultatif. S'il est omis, la langue originale est servie par défaut.

---

## 4. Liseuse LAHAThèque : Bascule de Langue et Continuité DRM

### Mécanisme de Bascule Fluide
1. **Composant Sélecteur de Langue** : Présent dans le header supérieur si `available_languages.length >= 2`.
2. **Calcul de Progression Proportionnelle** :
   $$\text{Progression} = \frac{\text{Page Courante}}{\text{Total Pages Version Source}}$$
   $$\text{Nouvelle Page Cible} = \max\left(1, \text{round}(\text{Progression} \times \text{Total Pages Version Cible})\right)$$
3. **Chargement Asynchrone du Document** :
   - Requête vers l'API BFF pour obtenir l'URL de streaming sécurisée de la nouvelle déclinaison linguistique.
   - Destruction propre de l'instance du document précédent et ré-instanciation sans rechargement de page.
   - Préservation continue du filigrane dynamique personnalisé (`Nom - Email - Date - IP`).

---

## 5. Workflow de Soumission Maquettiste & Studio Audio

### Formulaire Maquettiste (`/layout-artist/deposits/new`)
- Deux options clairement présentées via un sélecteur d'intention :
  1. *Créer un nouvel ouvrage autonome (Original)* : flux standard avec IA.
  2. *Rattacher une traduction à un ouvrage existant* : recherche de l'ouvrage maître, sélection de la langue cible, téléversement direct vers Cloudflare R2 (`uploadFileDirectlyToR2`) si le fichier n'est pas encore sur R2, balisage `is_original = False`.

### Studio Audio (`/layout-artist/audio/new`)
- Lors du rattachement d'un livre audio à un ouvrage multilingue, un champ obligatoire sélectionne la langue de narration (`fr`, `en`...).
- Les pistes audio sont directement stockées et liées à l'entrée `OuvrageLanguageVersion` correspondante.

---

## 6. Pipeline de Conversion EPUB vers PDF & Protection Anti-Surcharge (FR-021, SC-006)

### Problématique
La plateforme LAHAThèque héberge des fichiers EPUB issus de Cloudflare R2 (`r2_key_epub`). Intégrer un moteur EPUB tiers côté client (ex: `epub.js`) briserait l'uniformité des deux liseuses (Immersion 3D et Lecteur Classique), compliquerait l'apposition du filigrane DRM et ralentirait l'expérience de lecture.

### Décision d'Architecture
1. **Conversion Vectorielle Backend Exclusive (PyMuPDF)** : Le backend Django convertit l'EPUB en PDF vectoriel paginé haute fidélité via PyMuPDF (`fitz.open(stream=..., filetype='epub').convert_to_pdf()`). Les deux lecteurs restent 100% compatibles et uniformes en PDF natif.
2. **Verrou Distribué Redis Anti-Thundering Herd** : Un verrou Redis éphémère (`laha:epub_convert:<hash>`, timeout 120s) prévient tout risque de conversion simultanée par plusieurs workers lors d'un pic de consultations.
3. **Persistance R2 Immédiate (`r2_key_pdf`)** : Dès la première conversion, le PDF résultant est téléversé sur Cloudflare R2 (bucket `lahatheque`) et sa clé est enregistrée dans `OuvrageLanguageVersion.r2_key_pdf`. Tous les accès futurs sont servis directement depuis R2/CDN sans aucun recalcul CPU.

---

## 7. Haute Performance & Cache Redis sur le Catalogue Partenaire (FR-015, FR-024)

### Problématique
L'endpoint `GET /api/v1/partner/catalog/` était borné arbitrairement par `qs[:100]`, sans filtre linguistique, et effectuait des requêtes N+1 sur `language_versions` et `authors`. De plus, les partenaires SaaS ne disposent pas de Redis sur leur propre infrastructure.

### Décision d'Architecture
1. **Cache Redis Côté Serveur LAHAThèque** : Le cache Redis est opéré sur notre infrastructure LAHAThèque (TTL 15 min avec invalidation ciblée lors de la publication d'un livre). Les partenaires SaaS bénéficient d'une réponse ultra-rapide (1 à 2 ms) par simple appel HTTP sans avoir besoin d'installer Redis chez eux.
2. **Suppression du Plafond Statique de 100 Ouvrages** : Permet le chargement complet des 1 600+ ouvrages et de toutes les disciplines, avec support optionnel de pagination (`page`, `page_size`).
3. **Préchargement Relationnel Anti-N+1** : `select_related('discipline', 'institution')` et `prefetch_related('authors', 'language_versions')`.
4. **Filtrage Linguistique Dédié** : Support du paramètre de requête `?language=fr` ou `?language=en` filtrant sur la présence de la langue demandée dans `OuvrageLanguageVersion`.
5. **Court-circuit M2M pour `is_owned` et `has_digital_access`** : En contexte M2M partenaire, ces champs sont toujours forcés à `false` sans déclencher de vérification de droits `AccessService`, éliminant les requêtes SQL superflues.

---

## 8. Streaming Multilingue Sécurisé & Mise à Jour du Guide Partenaire (FR-009, FR-024)

### Streaming avec Cascade de Résolution de Langue
Sur `GET /api/v1/reader/sessions/stream/`, la résolution de la version linguistique s'opère en cascade non-bloquante :
1. Paramètre HTTP `?lang=` passé par la liseuse hébergée lors d'un switch de langue.
2. Métadonnée de session `session.metadata['language']` définie à la création (`POST /api/v1/reader/sessions/`).
3. Langue originale de l'ouvrage (`session.ouvrage.original_language` ou `'fr'`) comme repli par défaut garanti sans erreur 400/404.

Le gestionnaire `DerivedMaterializer` reçoit la référence sous la forme `{ouvrage_id}:{lang}` et génère/sert le dérivé chiffré filigrané spécifique à cette langue.

### Mise à Jour Exhaustive du Guide Partenaire Accès Mixte
Mise à jour complète de `GUIDE_INTEGRATION_ACCES_MIXTE.md` et de ses trois SDKs (Python, TypeScript, PHP) pour intégrer :
- Paramètre `language` dans `POST /api/v1/reader/sessions/` et dans les méthodes SDK `open_catalog_book`.
- Champs additifs `available_languages`, `languages`, `has_audio` dans `GET /api/v1/partner/catalog/`.
- Paramètre `?language=` et levée de limite dans la recherche catalogue.
- Explication transparente du cache Redis opéré par LAHAThèque.
- Précision sur le streaming transparent des EPUBs convertis en PDF vectoriel côté serveur.
- Payload enrichi avec `language` sur le Webhook `reader.session.opened`.
