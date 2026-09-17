# Phase 1 : Guide de Démarrage Rapide et Validation (Quickstart)

**Feature** : `009-university-partner-client-split`  
**Date** : 2026-09-17  
**Statut** : Validé

Ce guide décrit les scénarios de test et de validation de bout en bout pour vérifier l'étanchéité absolue entre les Universités Partenaires et les Universités Clientes.

---

## 1. Prérequis et Initialisation

### 1.1 Exécution de la Migration de Base de Données
```bash
# Dans le dossier backend
cd e:/Lahatheque/lahatheque-backend
python manage.py makemigrations partners
python manage.py migrate
```

### 1.2 Vérification du Statut des 4 Universités Partenaires Historiques
```bash
python manage.py shell -c "
from apps.partners.models import Institution
for code in ['UAC', 'UP', 'UNSTIM', 'UNA']:
    inst = Institution.objects.filter(code=code).first()
    print(f'{code}: {inst.name} -> type={getattr(inst, \"institution_type\", None)}')
"
```
*Résultat Attendu* : Les 4 institutions affichent `type=partner`.

---

## 2. Scénarios de Validation Fonctionnelle

### Scénario 1 : Navigation avec un Compte Université Partenaire (UAC)

1. **Connexion** : Se connecter avec les identifiants d'un modérateur de l'UAC (`uac.admin@uac.bj` ou compte affilié UAC).
2. **Tableau de Bord (`/university`)** :
   - Vérifier la présence du badge d'en-tête : « Portail Université Partenaire (Ayant droit) ».
   - Vérifier la présence des 4 cartes KPI : « Vos Ouvrages au Catalogue », « Part d'Audience Réelle », « Lectures Enregistrées », « Redevances Disponibles ».
   - Vérifier la présence du DonutChart « Répartition des Revenus » (15 % Établissement / 85 % LAHAThèque).
   - Vérifier l'**absence totale** du bouton « Souscrire un Bouquet » et de la section « Bouquets Documentaires Disponibles ».
3. **Barre Latérale (Sidebar)** :
   - Vérifier la présence du lien « Redevances » (`/university/royalties`).
   - Vérifier l'**absence** du lien « Bouquets Documentaires » (`/university/bouquets`).
4. **Tentative d'accès forcé par URL à `/university/bouquets`** :
   - Taper manuellement `http://localhost:3000/university/bouquets`.
   - *Résultat Attendu* : Redirection automatique vers `/university/royalties` avec notification explicative.

---

### Scénario 2 : Navigation avec un Compte Université Cliente (Souscriptrice)

1. **Connexion** : Se connecter avec un compte modérateur d'une université cliente (ex: institut supérieur privé).
2. **Tableau de Bord (`/university`)** :
   - Vérifier la présence du badge d'en-tête : « Portail Université Cliente ».
   - Vérifier la présence du bouton « Souscrire un Bouquet ».
   - Vérifier les KPI orientés abonnement : « Bouquets Souscrits », « Ouvrages Accessibles », « Lectures Campus », « Commandes Physiques ».
   - Vérifier l'**absence absolue** du DonutChart de répartition de chiffre d'affaires et de toute mention de redevance ou de pourcentage de droits.
   - Vérifier la présence des offres de bouquets documentaires à souscrire.
3. **Barre Latérale (Sidebar)** :
   - Vérifier la présence du lien « Bouquets Documentaires » (`/university/bouquets`).
   - Vérifier l'**absence absolue** du lien « Redevances » (`/university/royalties`).
4. **Tentative d'accès forcé par URL à `/university/royalties`** :
   - Taper manuellement `http://localhost:3000/university/royalties`.
   - *Résultat Attendu* : Redirection immédiate vers `/university` avec notification de restriction d'accès. L'appel API sous-jacent renvoie une erreur HTTP 403 Forbidden.
5. **Catalogue Universitaire (`/university/catalog`)** :
   - Consulter la page du catalogue : elle affiche la bibliothèque numérique correspondant aux bouquets souscrits par le campus (ou un état vide incitatif invitant à la souscription).

---

### Scénario 3 : Gestion Administrative Centrale (`/admin/users`)

1. **Création d'un Compte Université** :
   - Se connecter en Super Admin et ouvrir la modale de création d'utilisateur ([CreateAccountModal](file:///e:/Lahatheque/lahatheque-frontend/components/features/admin/create-account-modal.tsx)).
   - Choisir le rôle « Université / Établissement ».
   - Choisir de créer une nouvelle institution :
     - Vérifier que le type « Université Cliente » est sélectionné par défaut et qu'aucun taux de redevance n'est demandé.
     - Basculer sur « Université Partenaire » : vérifier l'apparition du champ « Taux de Redevance Conventionné (%) » pré-rempli à 15.00 %.
2. **Modification d'un Compte et Protection d'Intégrité** :
   - Ouvrir la modale d'édition ([EditUniversityUserModal](file:///e:/Lahatheque/lahatheque-frontend/components/features/admin/edit-university-user-modal.tsx)) pour le compte UAC.
   - Vérifier que le sélecteur de statut est verrouillé en « Partenaire » avec la mention protectrice.
   - Ouvrir la modale pour un établissement client : vérifier que la bascule vers « Partenaire » est possible et prend effet immédiatement.
3. **Écran des Reversements Globaux (`/admin/royalties/universities`)** :
   - Consulter le tableau de bord financier des redevances institutionnelles.
   - Vérifier que seules les 4 universités partenaires (UAC, UP, UNSTIM, UNA) y figurent et qu'aucun établissement client n'est présent.
