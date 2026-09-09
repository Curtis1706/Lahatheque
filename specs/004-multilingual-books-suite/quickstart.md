# Quickstart: Gestion et Ingestion Multilingue des Livres

Ce guide résume les commandes d'ingestion et les procédures de validation pour tester la suite multilingue.

---

## 1. Exécuter les Migrations Django

Appliquer la migration créant le modèle `OuvrageLanguageVersion` et étendant `LigneCommande` :

```bash
cd E:\Lahatheque\lahatheque-backend
python manage.py makemigrations catalog orders
python manage.py migrate
```

---

## 2. Ingestion Automatique du Bucket Cloudflare R2

Lancer la commande de synchronisation et d'extraction IA sur le bucket `laha-books-production` :

```bash
# Test sur un échantillon de 5 livres
python manage.py import_r2_multilingual_books --limit 5

# Synchronisation complète de l'ensemble du bucket (1 600+ livres)
python manage.py import_r2_multilingual_books --all
```

### Ce que fait la commande :
1. Scanne l'inventaire du bucket `laha-books-production`.
2. Pour chaque dossier `books/<uuid>/` :
   - Extrait la première page du PDF original pour générer l'image de couverture `cover.webp`.
   - Extrait les 15 premières et 15 dernières pages via PyMuPDF.
   - Interroge l'assistant IA pour classifier le livre dans les catégories existantes de la base de données.
   - Enregistre l'ouvrage maître et associe la version `EN` (`is_original=True`).
   - Détecte le dossier `FR/` ou les jobs de traduction, extrait les fichiers `translated.pdf` / `translated.epub` et crée la version `FR` (`is_original=False`).
   - Configure la redevance par défaut de 5% pour le format numérique.
   - En cas de document complexe sans texte extrait, passe en statut `draft` sans bloquer le reste du scan.

---

## 3. Vérification des Endpoints de l'API

### A. Consultation Catalogue Partenaire (Ultra-rapide avec Cache Redis Serveur)
```bash
# 1. Consultation standard (avec cache Redis 15 min côté LAHAThèque)
curl -X GET "http://localhost:8000/api/v1/partner/catalog/" \
  -H "Authorization: Bearer <TOKEN>"

# 2. Consultation filtrée par langue et paginée
curl -X GET "http://localhost:8000/api/v1/partner/catalog/?language=fr&page=1&page_size=50" \
  -H "Authorization: Bearer <TOKEN>"
```
Vérifier que :
- `available_languages: ["en", "fr"]` et `languages: [...]` sont bien exposés.
- Les champs `is_owned` et `has_digital_access` sont `false` en contexte M2M sans requête `AccessService`.
- Le temps de réponse est sous les 20 ms lors du second appel (cache Redis serveur actif).

### B. Création de Session de Lecture avec Langue Spécifique
```bash
curl -X POST "http://localhost:8000/api/v1/reader/sessions/" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "book_id": "<OUVRAGE_UUID>",
    "language": "en",
    "external_user_id": "STU-001",
    "external_user_name": "Jean Dupont",
    "external_user_email": "jean.dupont@uac.bj",
    "user_ip": "127.0.0.1",
    "return_url": "https://mon-lms.edu"
  }'
```
Vérifier que :
- La réponse contient `book.selected_language: "en"` et `reader_url: ".../read/<TOKEN>?lang=en"`.
- Le Webhook `reader.session.opened` est émis avec `"language": "en"`.

### C. Streaming Protégé avec Bascule Dynamique de Langue
```bash
# Streaming en version anglaise
curl -X GET "http://localhost:8000/api/v1/reader/sessions/stream/?lang=en" \
  -H "X-Reader-Token: <SESSION_TOKEN>" \
  -H "Range: bytes=0-65535" \
  --output test_chunk_en.bin

# Streaming en version française (bascule dynamique liseuse)
curl -X GET "http://localhost:8000/api/v1/reader/sessions/stream/?lang=fr" \
  -H "X-Reader-Token: <SESSION_TOKEN>" \
  -H "Range: bytes=0-65535" \
  --output test_chunk_fr.bin
```
Vérifier le code HTTP `206 Partial Content` et la présence du filigrane nominatif sur les deux déclinaisons linguistiques.

---

## 4. Test dans la Vitrine Publique et la Liseuse LAHAThèque (Front-End)

1. Démarrer le frontend : `npm run dev` dans `lahatheque-frontend`.
2. **Vitrine d'accueil (`/`)** :
   - Constater que la section "Nouveautés" charge dynamiquement les 6 ouvrages publiés les plus récents en priorisant la disponibilité française (`fr`).
   - Cliquer sur la couverture : redirection vers `/catalog/[slug]`.
   - Cliquer sur le chariot : ajout direct du format numérique au panier, affichage du toast et ouverture du `CartDrawer`.
3. **Liseuse Hébergée (`/read/<TOKEN>`)** :
   - Ouvrir un ouvrage bilingue dans la liseuse.
   - Constater la présence du bouton `[FR] [EN]` dans la barre d'outils supérieure.
   - Cliquer sur `FR` : la liseuse bascule instantanément vers la traduction française à la page proportionnelle sans rechargement de page, avec le filigrane DRM actif.
4. **Mode Immersion 3D (`FlipBookReader`)** :
   - Basculer en mode Immersion 3D.
   - Constater que la couverture et la page 1 s'affichent sous 400 ms (levée immédiate de l'écran "Préparation du livre 3D").
   - Vérifier la fluidité du feuilletage 3D grâce à la virtualisation DOM et l'absence de blocage mémoire sur les livres à fort volume de pages.
   - Fermer et rouvrir le même livre en mode 3D : constater l'ouverture instantanée (0 ms) grâce au cache navigateur local IndexedDB.
