# Phase 0: Technical Research & Architecture Decisions

**Feature**: `010-university-bouquet-subscription-api-flow`  
**Date**: 2026-09-17  
**Status**: Completed  

---

## 1. Tarification Bipériodique & Cycle de Vie des Abonnements

### Contexte & Problématique
Les bouquets documentaires doivent supporter deux formules tarifaires en Francs CFA (XOF) :
- Formule Mensuelle : `monthly_price`, validité 30 jours calendaires.
- Formule Annuelle : `annual_price`, validité 365 jours calendaires.
Chaque souscription (institutionnelle ou client particulier) doit enregistrer la formule choisie et calculer précisément la date de fin (`end_date`).

### Décision Technique
1. **Modèle `BouquetOffering`** (`apps/partners/models.py`) :
   - Ajout du champ `monthly_price = models.DecimalField(max_digits=12, decimal_places=2, default=50000.00, verbose_name="Tarif Mensuel (XOF)")`.
   - Conservation du champ `annual_price = models.DecimalField(max_digits=12, decimal_places=2, default=500000.00, verbose_name="Tarif Annuel (XOF)")`.
2. **Modèles de Souscriptions** :
   - `UniversityBouquetSubscription` et `ClientBouquetSubscription` : ajout du champ `subscription_period = models.CharField(max_length=10, choices=[('monthly', 'Mensuel (30j)'), ('annual', 'Annuel (365j)')], default='annual')`.
   - Calcul de la date d'échéance :
     - Si nouvelle souscription : `start_date = timezone.now().date()`, `end_date = start_date + timedelta(days=30 if period == 'monthly' else 365)`.
     - Si renouvellement anticipé avant expiration (décision Q2) : `end_date = max(ancienne_end_date, aujourd'hui) + timedelta(days=30 if period == 'monthly' else 365)`.
3. **Contrôle d'Expiration Automatique** :
   - Propriété calculée `@property is_expired(self) -> bool` vérifiant `timezone.now().date() > self.end_date`.
   - Tâche Celery quotidienne de balayage passant le statut à `'expired'` et déclenchant les préavis d'expiration.

### Alternatives Évaluées & Rejetées
- *Durée mensuelle calquée sur les mois calendaires (ex: 28, 30 ou 31 jours)* : Rejetée car génère des disparités selon le mois de souscription. La durée forfaitaire stricte de 30 jours (ou 365 jours) est standard, prévisible et transparente pour l'usager.

---

## 2. Suppression du Type « Par Faculté » & Établissement Obligatoire pour « Intégral Université »

### Contexte & Problématique
- Le type « Par Faculté » (`faculty`) est obsolète et redondant avec les disciplines et les universités.
- Le type « Intégral Université » (`university`) permettait auparavant de laisser l'établissement optionnel, ce qui créait des bouquets à portée indéterminée. De plus, l'administrateur a besoin de prévisualiser en direct le nombre d'ouvrages réels et leurs métadonnées avec couvertures.

### Décision Technique
1. **Nettoyage du Modèle `BouquetOffering`** :
   - Retirer `'faculty'` des choix `BOUQUET_TYPE_CHOICES` dans `apps/partners/models.py`.
   - Rendre `target_institution` obligatoire lorsque `bouquet_type == 'university'` (validation dans `clean()` du modèle et dans le serializer DRF).
2. **Endpoint d'Aperçu Dynamique des Livres d'une Université** :
   - Endpoint `GET /api/v1/partners/institutions/<uuid:pk>/books-preview/` :
     - Renvoie le décompte total `count` et la liste paginée ou complète des ouvrages publiés rattachés à cette institution.
     - Payload optimisé avec `select_related('discipline')` et `only('id', 'title', 'cover_image', 'discipline__name', 'authors')` pour un temps de réponse < 150 ms.
3. **Interface Admin (`/admin/catalog/bouquets`)** :
   - Suppression de l'option « Par Faculté » dans le menu déroulant et les filtres.
   - Dès la sélection d'une université : appel automatique pour récupérer le nombre d'ouvrages et affichage d'un bouton « Voir le détail des livres » ouvrant un composant modal/drawer scrollable avec les cartes des livres (image de couverture, titre, discipline).

---

## 3. Architecture Clé API Partenaire Multi-Bouquets & Filtrage Granulaire

### Contexte & Problématique
Une université cliente qui souscrit à plusieurs bouquets successifs doit conserver la même paire `client_id` / `client_secret` (décision Q1). De plus, l'accès doit être restreint aux seuls livres des bouquets actuellement valides (décision Q3).

### Décision Technique
1. **Modèle `PartnerApp`** (`apps/reader/models.py`) :
   - Actuellement, `PartnerApp` possède un champ unique `restricted_bouquet = models.ForeignKey(...)`.
   - Évolution : ajout de la relation multiple `restricted_bouquets = models.ManyToManyField('partners.BouquetOffering', blank=True, related_name='partner_apps_multi')`.
   - Rétro-compatibilité : une propriété ou méthode `get_active_bouquets(self)` renvoie tous les bouquets actifs de l'institution rattachée.
2. **Filtrage dans l'API Catalogue Partenaire (`GET /api/v1/partner/catalog/`)** :
   - Le catalogue interroge l'ensemble des bouquets actifs de l'université cliente :
     `active_subs = UniversityBouquetSubscription.objects.filter(institution=app.linked_institution, status='active', end_date__gte=today)`
   - Si aucune souscription active : renvoie une liste vide avec code d'avertissement ou erreur 403 signalant l'expiration.
   - Si souscriptions actives : filtre les ouvrages du catalogue pour ne retourner que ceux inclus dans au moins un des bouquets actifs.
3. **Filtrage dans la Création de Session de Lecture (`POST /api/v1/reader/sessions/`)** :
   - Vérifie si le `book_id` demandé appartient à un des bouquets actifs de l'université cliente.
   - Si le bouquet correspondant a expiré : renvoie un code HTTP 403 Forbidden avec le message explicite : *« L'accès à cet ouvrage a expiré le JJ/MM/AAAA. Veuillez renouveler le bouquet correspondant. »*

---

## 4. Passerelle Moneroo, Idempotence & Réconciliation

### Contexte & Problématique
Les souscriptions de bouquets (universités ou clients particuliers) doivent être réglées en direct via Moneroo en Francs CFA (XOF). L'activation ne doit avoir lieu qu'après confirmation irrévocable.

### Décision Technique
1. **Initialisation de Paiement Unifiée** :
   - `UniversityBouquetSubscribeView` (`/api/v1/partners/university/bouquets/<pk>/subscribe/`) pour les universités clientes.
   - `ClientBouquetSubscribeView` (`/api/v1/commerce/client-bouquets/<pk>/subscribe/`) pour les lecteurs particuliers.
   - Paramètres transmis à `MonerooClient.initialize_payment` :
     - `amount` : `offering.monthly_price` si période mensuelle, `offering.annual_price` si période annuelle.
     - `currency` : `"XOF"`.
     - `return_url` : URL de redirection vers l'écran de succès post-paiement.
     - `metadata` : `{ "subscription_type": "university_bouquet" | "client_bouquet", "subscription_id": str(sub.id), "period": period }`.
2. **Traitement du Webhook Moneroo (`apps/commerce/webhooks.py`)** :
   - Le webhook vérifie la signature HMAC-SHA256.
   - `handle_bouquet_payment_success(payment_tx)` :
     - Active la souscription (`status = 'active'`).
     - Pour les universités clientes : crée ou met à jour `PartnerApp` (rattachement du bouquet, tier VIP, `access_mode='catalog_only'`), génère la clé secrète brute pour affichage temporaire en session ou cache sécurisé Redis (TTL 10 minutes) afin de la restituer une seule fois sur la page de succès.
     - Émet la facture PDF acquittée.
     - Déclenche l'envoi des emails transactionnels.
     - Enregistre l'écriture financière dans le journal comptable.

---

## 5. Génération du Guide d'Implémentation PDF & Facture Acquittée

### Contexte & Problématique
Le guide d'intégration doit être délivré sous forme de document PDF soigné basé sur `GUIDE_INTEGRATION_CATALOGUE_SEUL.md`, respectant les chartes graphiques de LAHAThèque (logo vectoriel, Navy `#1B2A4E` & Or `#B08D42`, typographie Playfair Display et Poppins).

### Décision Technique
1. **Générateur PDF Backend (`apps/reporting/pdf_service.py`)** :
   - Utilisation de WeasyPrint ou ReportLab (déjà configuré dans le projet pour les relevés de redevances et bordereaux).
   - Template HTML/CSS dédié : `templates/reports/partner_integration_guide.html` :
     - En-tête avec logo vectoriel officiel LAHAThèque.
     - Titres de section en Playfair Display (Bold).
     - Textes, tableaux et blocs de code en Poppins / Roboto Mono.
     - Blocs de code colorés avec syntaxe claire (Python, TypeScript, PHP, Java, C#).
     - Matrice d'erreurs HTTP mise en page sous forme de tableau soigné.
   - Endpoint de téléchargement direct : `GET /api/v1/partners/university/guides/catalog-only-pdf/`.
2. **Facture PDF Acquittée** :
   - Template `templates/reports/bouquet_invoice.html` mentionnant :
     - Numéro de facture unique (ex: `FACT-BOUQUET-2026-XXXX`).
     - Identité de l'acheteur (Université ou Particulier).
     - Formule choisie (Abonnement Mensuel 30j ou Annuel 365j).
     - Date de transaction et date exacte d'expiration (`end_date`).
     - Montant TTC en Francs CFA (XOF) et mention « ACQUITTÉE / PAYÉE EN LIGNE VIA MONEROO ».

---

## 6. Espace Client (B2C) & Séparation dans la Bibliothèque (`/student/books`)

### Contexte & Problématique
Les lecteurs particuliers peuvent souscrire à des bouquets sans aucune clé API. Leurs livres doivent être directement consultables dans leur bibliothèque, distincts de leurs livres achetés à l'unité (licence 12 mois).

### Décision Technique
1. **Réactivation de `/student/bouquets`** :
   - Remplacement de la redirection temporaire par la véritable interface de catalogue des bouquets.
   - Sélecteur de période Mensuel / Annuel pour chaque bouquet.
   - Bouton de paiement Moneroo direct.
2. **Bibliothèque `/student/books`** :
   - Ajout d'un 4ème onglet de filtre : `filterTab === 'bouquets'` (libellé : « Bouquets en cours »).
   - Les livres issus des bouquets actifs sont affichés avec un badge distinctif doré `[Nom Bouquet]` et la mention d'échéance : `Expire le JJ/MM/AAAA`.
   - Les livres achetés individuellement continuent d'apparaître dans l'onglet général « Tous » avec leur propre date de fin de validité (12 mois).
3. **Contrôle d'Accès Lecteur (`apps/protection/access_service.py`)** :
   - La méthode de vérification vérifie en cascade :
     1. Existe-t-il un achat individuel du livre non expiré (`LigneCommande` avec `order.statut_paiement == 'paid'` et `created_at >= aujourd'hui - 365 jours`) ? Si oui : accès accordé.
     2. Existe-t-il une souscription bouquet client active (`ClientBouquetSubscription`) dont l'échéance n'est pas dépassée (`end_date >= aujourd'hui`) couvrant ce livre ? Si oui : accès accordé.
     3. Sinon : accès refusé avec invitation à renouveler.
