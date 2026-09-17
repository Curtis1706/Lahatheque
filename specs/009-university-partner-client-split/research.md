# Phase 0 : Recherche et Décisions d'Architecture Technique

**Feature** : `009-university-partner-client-split`  
**Date** : 2026-09-17  
**Statut** : Validé

Ce document synthétise les choix technologiques, l'analyse des alternatives et les décisions architecturales pour concrétiser la séparation étanche entre les Universités Partenaires (ayants droit) et les Universités Clientes (souscriptrices).

---

## Décision 1 : Modélisation et Persistance du Statut Institutionnel

### Problématique
Où et comment modéliser la distinction entre une « Université Partenaire » et une « Université Cliente », tout en garantissant la cohérence avec le compte modérateur unique de l'établissement ?

### Décision Retenue
Ajouter un champ explicite `institution_type` sur le modèle `Institution` dans `apps/partners/models.py` :
```python
INSTITUTION_TYPE_CHOICES = (
    ('partner', 'Université Partenaire (Ayant droit)'),
    ('client', 'Université Cliente (Souscriptrice)'),
)
institution_type = models.CharField(
    max_length=20,
    choices=INSTITUTION_TYPE_CHOICES,
    default='client',
    db_index=True,
    verbose_name="Typologie de l'établissement"
)
```

- **Stratégie de Migration** :
  - Créer une migration Django `apps/partners/migrations/00XX_institution_institution_type.py`.
  - Migration de données automatique (opération `RunPython`) :
    - Les 4 universités publiques historiques (`code__in=['UAC', 'UP', 'UNSTIM', 'UNA']`) reçoivent `institution_type = 'partner'`.
    - Toutes les autres institutions reçoivent `institution_type = 'client'`.
- **Lien avec le Compte Modérateur** :
  - L'entité `Institution` conserve sa relation un-à-un `user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='university_profile', null=True, blank=True)`.
  - Le compte `User` (au rôle `university`) hérite dynamiquement du statut de son `university_profile`.

### Alternatives Évaluées
1. **Créer deux rôles utilisateurs distincts (`university_partner` et `university_client`)** :
   - *Rejeté* : Multiplierait les rôles dans `ROLE_CHOICES` (`apps/accounts/models.py`), casserait les permissions existantes (`IsUniversityStaff`) et mélangerait l'identité de la personne physique avec la nature contractuelle de l'entité morale.
2. **Déterminer le statut dynamiquement via le nombre de livres au catalogue (`books.count() > 0`)** :
   - *Rejeté* : Fragile et non déterministe. Une université cliente pourrait accidentellement devenir partenaire si un livre lui est affilié par erreur. La nature juridique doit être un attribut contractuel explicite.

---

## Décision 2 : Sécurisation Backend et Garde-fous DRF

### Problématique
Comment interdire formellement aux universités clientes d'accéder aux calculs de redevances et aux universités partenaires de souscrire des bouquets ?

### Décision Retenue
1. **Contrôle d'Accès aux Redevances (`UniversityRoyaltiesView`, `UniversityRoyaltyWithdrawView`)** :
   - Dans `apps/partners/university_views.py`, vérifier dès l'entrée :
     ```python
     inst = get_user_institution(request.user)
     if not inst or inst.institution_type != 'partner':
         return Response({
             "success": False,
             "data": {},
             "error": "Accès refusé. Cet espace est réservé aux universités partenaires conventionnées dépositaires de fonds documentaires."
         }, status=status.HTTP_403_FORBIDDEN)
     ```
2. **Blocage de Souscription de Bouquets pour les Partenaires (`UniversityBouquetSubscribeView`)** :
   - Vérifier :
     ```python
     if inst and inst.institution_type == 'partner':
         return Response({
             "success": False,
             "data": {},
             "error": "Opération non autorisée. Les universités partenaires conventionnées ne souscrivent pas d'abonnements bouquets payants."
         }, status=status.HTTP_400_BAD_REQUEST)
     ```
3. **Payload KPI Adaptatif (`UniversityKpisView`)** :
   - Renvoyer `institution_type: inst.institution_type`.
   - Pour les partenaires : calcul complet des redevances disponibles, part d'audience et objet `revenue_split`.
   - Pour les clientes : `total_royalties_available: 0`, `revenue_split: null`, et calcul des métriques axées sur les bouquets actifs et les consultations d'apprenants.

### Alternatives Évaluées
- **Créer des endpoints d'URL complètement séparés (`/api/v1/partners/client-kpis/`)** :
  - *Rejeté* : Crée de la duplication de code inutile. Un seul endpoint polymorphe sécurisé simplifie le contrat frontend et la maintenance.

---

## Décision 3 : Filtrage Intelligent du Catalogue Universitaire (`/university/catalog`)

### Problématique
Comment servir le catalogue sur `/university/catalog` sans afficher une liste vide (« 0 ouvrage ») pour les universités clientes ?

### Décision Retenue
Adapter la vue de catalogue ou le proxy BFF :
- Si l'établissement est **Partenaire** (`partner`) : lister les ouvrages éditoriaux dont `ouvrage.institution = inst`.
- Si l'établissement est **Client** (`client`) : lister l'ensemble des ouvrages numériques inclus dans les bouquets actifs souscrits par l'établissement (`UniversityBouquetSubscription.objects.filter(institution=inst, status='active')`). Si aucun bouquet actif, renvoyer une liste vide avec métadonnée incitative.

---

## Décision 4 : Ergonomie Administrative (Création & Édition)

### Problématique
Comment permettre à l'administrateur de qualifier les institutions sans friction et en protégeant les 4 universités historiques ?

### Décision Retenue
1. **Création d'Utilisateur Modérateur (`CreateAccountModal`)** :
   - Lors de la sélection du rôle « Université / Établissement », si l'admin crée une nouvelle institution, un sélecteur permet de choisir entre « Université Cliente » (sélectionné par défaut) et « Université Partenaire ».
   - Si « Université Partenaire » est choisie, le champ du taux de redevance (15 %) est affiché. Sinon, le taux est fixé à 0 % en base.
   - Si une institution existante est choisie, vérifier si elle a déjà un modérateur rattaché pour éviter les doublons.
2. **Édition d'Utilisateur Modérateur (`EditUniversityUserModal`)** :
   - Afficher le sélecteur du type d'institution.
   - **Protection d'intégrité** : Si le code de l'institution appartient à `['UAC', 'UP', 'UNSTIM', 'UNA']`, désactiver le sélecteur et afficher une mention d'information : « Établissement partenaire historique protégé (rétrogradation en compte client interdite). »
3. **Table des Utilisateurs dans l'Administration (`/admin/users/universities`)** :
   - Ajouter une colonne/badge de typologie : « Partenaire » (doré) ou « Cliente » (neutre).
   - Taux conventionné masqué (ou « N/A ») pour les universités clientes.
4. **Bordereaux de Redevances Institutionnelles (`/admin/royalties/universities`)** :
   - Filtrer la liste des institutions pour exclure automatiquement tout établissement de type `client` (`Institution.objects.filter(institution_type='partner')`).

---

## Décision 5 : Adaptation du Frontend et Expérience Utilisateur

### Problématique
Comment adapter l'affichage du shell, des menus et des pages sans rechargement brutal ?

### Décision Retenue
- Le service d'authentification et les hooks (`useAuth`, `getUniversityKpis`) stockent le type d'institution dans l'état utilisateur (`user.institution_type`).
- La barre latérale ([DashboardSidebar](file:///e:/Lahatheque/lahatheque-frontend/components/dashboard-sidebar.tsx)) et la barre mobile ([MobileBottomNav](file:///e:/Lahatheque/lahatheque-frontend/components/ui/mobile-bottom-nav.tsx)) filtrent conditionnellement :
  - Si `institution_type === 'partner'` : Masquer « Bouquets Documentaires », afficher « Redevances ».
  - Si `institution_type === 'client'` : Masquer « Redevances », afficher « Bouquets Documentaires ».
- La page d'accueil [app/(dashboard)/university/page.tsx](file:///e:/Lahatheque/lahatheque-frontend/app/(dashboard)/university/page.tsx) conditionne :
  - Le titre et badge en-tête.
  - Les 4 cartes de KPI.
  - La présence du DonutChart de répartition de CA (affiché uniquement si `partner`).
  - La présence des cartes d'offres de bouquets à souscrire (affichées uniquement si `client`).
