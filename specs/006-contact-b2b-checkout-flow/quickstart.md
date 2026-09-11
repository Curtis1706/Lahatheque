# Quickstart & Validation Guide: Feature 006

**Feature**: Formulaire Contact B2B & Tunnel d'Achat E-commerce  
**Directory**: `specs/006-contact-b2b-checkout-flow`  
**Date**: 2026-09-10

---

## 1. Prérequis & Environnement

- Serveur Backend Django en cours d'exécution sur `http://127.0.0.1:8000`.
- Application Frontend Next.js sur `http://localhost:3000` (ou environnement de dev actif).
- DevTools ouverts dans le navigateur (onglet Console).

---

## 2. Scénarios de Validation de Bout en Bout

### Scénario 1 : Soumission Formulaire de Contact B2B (`/contact`)

1. **Accès & Affichage** :
   - Naviguer sur `http://localhost:3000/contact`.
   - Cliquer sur le sélecteur "Profil du demandeur".
   - **Vérification** : Les options affichées sont bien `Université / Établissement Partenaire`, `Éditeur Tiers / Maison d'édition`, `Grossiste / Distributeur`, `Auteur`, `Autre`.
2. **Sélection des Besoins B2B** :
   - Sélectionner les cases "Demande de partenariat institutionnel" et "Commande en gros (gros volumes)".
   - Cocher l'option "Autre".
   - **Vérification** : Aucun champ perturbateur ne s'intercale ; le texte d'aide invite à détailler dans "Message complémentaire".
3. **Transmission & Notification** :
   - Renseigner nom, email (`test.b2b@univ.edu`), téléphone et message.
   - Soumettre le formulaire.
   - **Vérification** :
     - Toast de succès vert.
     - Logs console `[CONTACT FORM]` détaillant la requête et le statut 200/201.
     - Logs backend attestant de l'expédition des e-mails aux 3 adresses :  
       `lahaeditions1@gmail.com`, `firinzegbenitodossou@gmail.com`, `alhtdharry7@gmail.com`.
     - Accusé de réception expédié au demandeur.

---

### Scénario 2 : Parcours Catalogue, Panier & Checkout Invité (Option A)

1. **Ajout d'Ouvrages au Panier en Mode Déconnecté** :
   - S'assurer d'être déconnecté (`/login` ou navigation privée).
   - Aller sur `/catalog`.
   - Ajouter un livre numérique au panier.
   - Ajouter un exemplaire papier au panier.
   - **Vérification** : Le badge du panier affiche `2`. Recharger la page : le panier reste à `2`.
2. **Tunnel de Commande `/checkout` & Panneau d'Identification** :
   - Accéder à `/cart` puis cliquer sur "Commander" (ou aller sur `/checkout`).
   - **Vérification** :
     - La page `/checkout` ne renvoie aucune erreur 401.
     - Le récapitulatif du panier (numérique + papier, total exact) s'affiche à droite.
     - La zone principale affiche le panneau d'authentification Option A à 2 onglets ("Déjà client ? Se connecter" / "Nouveau client ? Créer mon compte").
3. **Création de Compte Client Rapide & OTP au Checkout** :
   - Sélectionner l'onglet "Créer mon compte".
   - Renseigner nom, e-mail, téléphone et mot de passe.
   - Saisir le code OTP reçu.
   - **Vérification** :
     - Authentification instantanée sans redirection vers `/login`.
     - Le panier est 100% conservé.
     - L'écran passe immédiatement à la sélection du mode de paiement et aux informations de livraison papier.
4. **Validation de la Commande & Persistance Multi-Formats** :
   - Renseigner l'adresse physique de livraison pour l'exemplaire papier.
   - Valider la commande via le paiement.
   - **Vérification** :
     - La commande est enregistrée dans `Order`.
     - L'adresse de livraison est stockée dans `PhysicalDelivery` et consultable dans `/student/orders`.
     - Le livre numérique est immédiatement accessible dans `/student/books` et consultable dans la liseuse FlipBook.

---

### Scénario 3 : Commande Administrateur via Combobox & Vente Comptoir Boutique (`/admin/orders`)

1. **Sélection Rapide par Combobox (Compte Existant)** :
   - Se connecter en tant qu'administrateur et se rendre sur `/admin/orders`.
   - Cliquer sur « Passer une commande pour un client ».
   - Saisir quelques lettres dans la Combobox client : le menu déroulant flottant liste instantanément les correspondances avec avatar, rôle et téléphone.
   - Cliquer sur un client : le panneau se referme et affiche la carte récapitulative compacte du client sélectionné avec le bouton « Changer de client ».
2. **Bascule et Commande pour un Client Comptoir Externe** :
   - Dans le sélecteur, basculer sur l'onglet « Client comptoir externe (sans compte) ».
   - Renseigner le Nom complet et le Numéro de téléphone du client physique.
   - Sélectionner les articles désirés (papier et/ou numérique).
   - Choisir le mode de règlement comptoir (Espèces ou Mobile Money direct).
   - Valider la création : la commande est enregistrée avec `user = null` et `is_pos_order = True`, et apparaît immédiatement dans le registre général `/admin/orders` avec les coordonnées de l'acheteur externe.
