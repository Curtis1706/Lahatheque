# Quickstart & Validation Guide: Suite « Gestion des Finances »

**Feature**: Refonte de la Suite « Gestion des Finances »
**Branch**: `003-finance-management-suite`
**Date**: 2026-09-08

## Prérequis

1. Serveur backend Django démarré :
   ```powershell
   cd e:\Lahatheque\lahatheque-backend
   python manage.py runserver 127.0.0.1:8000
   ```
2. Serveur frontend Next.js démarré :
   ```powershell
   cd e:\Lahatheque\lahatheque-frontend
   npm run dev
   ```
3. Compte connecté avec privilège Administrateur (`admin@lahatheque.com`).

---

## Scénarios de Validation End-to-End

### Scénario 1 : Réconciliation Dynamique du Chiffre d'Affaires (`/admin/sales`)
1. Ouvrir le navigateur sur `http://localhost:3000/admin/sales`.
2. Relever le montant du **Chiffre d'Affaires Consolidé** affiché dans l'en-tête (ex: `178 000 FCFA`).
3. Vérifier que les cartes de ventilation par canal affichent :
   - Ventes Unitaires Numériques & Papier (B2C)
   - Commandes Campus & Bouquets Universitaires (B2B)
   - Commandes Grossistes & Réassort (B2B)
4. Dans le tableau des transactions :
   - Vérifier que chaque ligne représente une commande distincte avec son montant net.
   - Cliquer sur le chevron dépliable d'une commande : vérifier l'ouverture de l'accordéon affichant la liste exacte des articles, leurs formats, quantités et sous-totaux.
   - Calculer la somme arithmétique des montants des commandes affichées : constater l'égalité exacte avec le Chiffre d'Affaires total.
5. Filtrer par canal (ex: « Bouquets Universités ») : constater que le tableau et la métrique se recalculent immédiatement de concert.

---

### Scénario 2 : Instruction des Demandes de Versement (`/admin/payouts`)
1. Naviguer sur `http://localhost:3000/admin/payouts`.
2. Vérifier la présence des 4 cartes de KPIs en haut :
   - Montant total en attente de validation
   - Nombre de demandes ouvertes
   - Montant liquidé sur le mois
   - Nombre de bénéficiaires rétribués
3. Dans le tableau, repérer une demande avec statut `En attente` :
   - Cliquer sur **« Valider »** :
     * La modale s'ouvre.
     * Saisir la référence de transaction externe : `VIR-TEST-2026-001`.
     * Choisir la date effective.
     * Cliquer sur « Confirmer le paiement ».
     * Vérifier le toast de confirmation, le passage immédiat de la ligne au statut `Payée / Validée`, et l'ajustement du compteur en attente.
   - Sur une autre demande, cliquer sur **« Rejeter »** :
     * Saisir le motif : `Relevé d'identité bancaire incomplet`.
     * Valider le rejet : constater le badge `Rejetée` et la persistance du motif d'audit.

---

### Scénario 3 : Consolidation 360° et Accordéons Partenaires (`/admin/finance`)
1. Ouvrir `http://localhost:3000/admin/finance`.
2. Vérifier les indicateurs supérieurs :
   - Revenu Global Encaissé
   - Créances et Encours Auteurs/Clients
   - Redevances Déjà Versées
   - Redevances Restant à Payer
3. Dans le tableau récapitulatif des partenaires :
   - Utiliser la barre d'onglets pour basculer entre `Tous`, `Auteurs`, `Éditeurs Tiers`, et `Universités Partenaires`.
   - Cliquer sur la flèche dépliable d'un partenaire (ex: une université ou un auteur) :
     * Vérifier que l'accordéon se déploie sans recharger la page, affichant la ventilation ouvrage par ouvrage (ventes unitaires vs part au prorata du bouquet).
   - Cliquer sur le bouton **« Détails »** : constater l'ouverture de la modale d'audit exhaustif.

---

### Scénario 4 : Vérification de l'Épuration de la Page « Redevances & Droits » (`/admin/royalties`)
1. Ouvrir `http://localhost:3000/admin/royalties`.
2. Inspecter l'en-tête de la page :
   - Vérifier que les boutons superflus `Auteurs (2)`, `Éditeurs (0)` et `Universités (2)` ont disparu.
   - Vérifier que seul le bouton pertinent `Exporter le Journal` est présent.
3. Vérifier que le bloc inférieur « Demandes de Versement » n'est plus affiché sur cette page.
4. Dans le tableau des barèmes contractuels dérogatoires :
   - Cliquer sur « Modifier Taux » pour un partenaire, changer la valeur et enregistrer : vérifier la mise à jour immédiate.

---

### Scénario 5 : Navigation dans la Barre Latérale
1. Observer la barre latérale sous le menu déroulant **« Gestion des Finances »**.
2. Vérifier la présence des 4 sous-menus ordonnés :
   - Ventes & Revenus (`/admin/sales`)
   - Finances Globales (`/admin/finance`)
   - Redevances & Droits (`/admin/royalties`)
   - Demandes de Versement (`/admin/payouts`)
3. Cliquer successivement sur chacun des liens et vérifier que le menu reste ouvert et que l'élément actif est mis en valeur en doré (`text-gold font-bold bg-gold/10`).
