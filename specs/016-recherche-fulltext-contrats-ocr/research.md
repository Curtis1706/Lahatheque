# Recherche Technique & Décisions d'Architecture : Recherche Full-Text & OCR Contrats

**Feature** : `016-recherche-fulltext-contrats-ocr`
**Date** : 2026-09-06

---

## 1. Problématique de Performance & Disponibilité (Zéro Ralentissement)

### Défi
L'extraction de texte sur des documents volumineux et l'exécution d'un moteur OCR sur des scans haute résolution (pouvant atteindre 800 Mo) consomment une quantité importante de CPU et de mémoire. Si ce traitement est exécuté de manière synchrone dans le cycle de vie de la requête HTTP `POST /contracts/`, l'utilisateur subit un gel de l'écran, un risque de timeout HTTP 504 de la passerelle Nginx/Cloudflare, et un risque d'épuisement des workers web Gunicorn.

### Décision d'Architecture
- **Ingestion Asynchrone en Deux Temps** :
  1. *Temps 1 (Synchrone - Immédiat < 300ms)* : Réception du fichier, enregistrement sécurisé sur le stockage persistant (Cloudflare R2 / Storage local), extraction rapide du texte natif numérique s'il est déjà présent via PyMuPDF (très véloce, < 50ms par page), création de la fiche contrat avec statut d'indexation `indexing_status = "indexed"` (si texte natif suffisant) ou `indexing_status = "pending"` (si scan détecté). Réponse HTTP 201 immédiate au client avec feedback.
  2. *Temps 2 (Asynchrone en Arrière-Plan)* : Si le document est un scan (moins de 50 caractères détectés), le traitement lourd OCR est délégué à une tâche de fond (Celery / Background Worker asynchrone Django). Le worker traite les pages par lot (batch streaming), extrait le texte et met à jour `texte_integral_index` ainsi que le vecteur de recherche FTS sans bloquer aucun utilisateur du site.

---

## 2. Choix du Moteur de Reconnaissance Optique (OCR)

### Comparatif des Solutions

| Solution | Avantages | Inconvénients | Décision |
| :--- | :--- | :--- | :--- |
| **PyMuPDF + Tesseract OCR (`pytesseract`)** | Open-source, gratuit, sans dépendance API externe, respect strict de la confidentialité juridique locale, très performant pour le français. | Nécessite les binaires Tesseract installés sur le serveur d'hébergement. | **Retenu comme moteur principal local** |
| **Moteur Vision IA LAHAThèque (`apps.ai_engine`)** | Déjà intégré au projet pour les résumés et suggestions de redevances, capable de décrypter les écritures manuscrites complexes et signatures. | Coût par token d'API et latence réseau si exécuté sur des centaines de pages. | **Retenu en fallback qualitatif sur les clauses ambiguës** |
| **Services Cloud Propriétaires (AWS Textract, Google Cloud Vision)** | Précision élevée. | Verrouillage propriétaire, coûts récurrents élevés, conformité RGPD/protection des données sensibles. | Écarté |

---

## 3. Moteur de Recherche Hybride Plein Texte & Index GIN

### Décision d'Architecture
- **Index PostgreSQL GIN (Generalized Inverted Index)** :
  Création d'un index GIN dédié sur le vecteur combiné `SearchVector('titre', 'contracting_party', 'numero_contrat', 'texte_integral_index')`.
  - Temps de réponse : inférieur à 30ms sur 100 000 contrats.
- **Recherche Hybride Résiliente** :
  - Recherche FTS principale avec radicalisation française (`SearchQuery(q, config='french')`).
  - Fallback automatique par trigramme / sous-chaîne (`texte_integral_index__icontains=q` ou `similarity`) pour les acronymes universitaires (*UAC*, *UNSTIM*), les références alphanumériques (*CTR-JUR-2026-9048*) et les mots sans accents.
- **Cache Court Terme** :
  Mise en cache Redis (durée : 60 secondes) des résultats des requêtes de recherche fréquentes pour un temps de réponse perçu instantané.
