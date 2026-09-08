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

### A. Consultation Catalogue Partenaire (Rétrocompatible)
```bash
curl -X GET "http://localhost:8000/api/v1/partner/catalog/" \
  -H "Authorization: Bearer <TOKEN>"
```
Vérifier la présence des champs `available_languages: ["en", "fr"]` et `languages: [...]`.

### B. Création de Session de Lecture avec Langue Spécifique
```bash
curl -X POST "http://localhost:8000/api/v1/reader/sessions/" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "book_id": "<OUVRAGE_UUID>",
    "language": "fr",
    "external_user_id": "STU-001",
    "external_user_name": "Jean Dupont",
    "external_user_email": "jean.dupont@uac.bj",
    "user_ip": "127.0.0.1",
    "return_url": "https://mon-lms.edu"
  }'
```

---

## 4. Test dans la Liseuse LAHAThèque (Front-End)

1. Démarrer le frontend : `npm run dev` dans `lahatheque-frontend`.
2. Ouvrir un ouvrage bilingue dans la liseuse : `/read/<TOKEN>`.
3. Constater la présence du bouton `[FR] [EN]` dans la barre d'outils supérieure.
4. Cliquer sur `FR` : la liseuse bascule instantanément vers la traduction française à la page proportionnelle sans rechargement de page, avec le filigrane DRM de sécurité actif.
