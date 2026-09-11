# Technical Research & Architecture Decisions: Feature 006

**Feature**: Formulaire Contact B2B & Tunnel d'Achat E-commerce  
**Directory**: `specs/006-contact-b2b-checkout-flow`  
**Date**: 2026-09-10

---

## 1. Sélecteur des Besoins B2B & Rôles sur `/contact`

### Décision 1.1 : Modèle des Rôles Demandeur
- **Choix arrêté** : Rôles strictement calqués sur l'énumération `ROLE_CHOICES` de `apps/accounts/models.py` :
  - `university` : "Université / Établissement Partenaire"
  - `publisher` : "Éditeur Tiers / Maison d'édition"
  - `wholesaler` : "Grossiste / Distributeur"
  - `author` : "Auteur"
  - `other` : "Autre"
- **Raisonnement** : Garantit une harmonie totale entre les leads captés sur le formulaire public et les entités utilisateurs / comptes autorisés dans le backend Django.
- **Alternatives rejetées** :
  - Conserver les anciens rôles statiques ("Établissement public", "Établissement privé") : Rejeté car déphasé par rapport aux modèles et aux conventions partenariales de LAHAThèque.

### Décision 1.2 : Composant de Sélection des Besoins & Option "Autre"
- **Choix arrêté** : Grille de sélection tactile multi-options et combobox de filtrage réactif, enrichie des options institutionnelles :
  1. *Demande de partenariat institutionnel*
  2. *Commande en gros (gros volumes)*
  3. *Intégration API & Catalogue*
  4. *Prestations éditoriales* (Impression, Sécurisation de contenus, Analyse comité, Montage éditorial, Diffusion internationale, Distribution internationale, Livres audio, Illustrations, Anti-plagiat)
  5. *Autre*
- **Gestion de l'option "Autre" (Option B validée)** : Aucun champ d'input supplémentaire ; un court message d'aide invite l'utilisateur à consigner son besoin particulier dans la zone "Message complémentaire" en bas de formulaire.
- **Raisonnement** : Zéro surcharge visuelle (Principe I et VIII), ergonomie mobile-first fluide.

### Décision 1.3 : Dispatch des Notifications E-mails Internes
- **Choix arrêté** : Liste stricte et immuable des 3 destinataires dans `apps/communications/views.py` :
  - `lahaeditions1@gmail.com`
  - `firinzegbenitodossou@gmail.com`
  - `alhtdharry7@gmail.com`
- **Raisonnement** : Aligne le backend avec la directive explicite de l'utilisateur en corrigeant définitivement la typo historique `alhtd7@gmail.com` vers `alhtdharry7@gmail.com`.

---

## 2. Tunnel de Commande E-commerce & Étape Compte Client

### Décision 2.1 : Expérience d'Identification au Checkout (Option A validée)
- **Choix arrêté** : Panneau d'identification direct intégré sur `/checkout` en zone principale sans quitter l'URL :
  - Deux onglets clairs : "Déjà client ? Se connecter" / "Nouveau client ? Créer mon compte".
  - Onglet Connexion : Identifiant + Mot de passe (sans OTP, tokens délivrés dans cookies `HttpOnly`).
  - Onglet Inscription : Nom, Email, Téléphone, Mot de passe + validation OTP rapide à 6 chiffres via le composant 21st.dev `OTPInput`. Le compte est créé avec le rôle `student` (Client / Lecteur standard).
  - Connexion automatique post-OTP sans étape intermédiaire sur `/login`.
  - Le récapitulatif du panier reste visible en permanence à droite (sticky desktop, accordéon mobile).
- **Raisonnement** : Standard e-commerce mondial (Amazon / Shopify) qui supprime les abandons de panier provoqués par des redirections brutales ou des erreurs 401.

### Décision 2.2 : Persistance Locale du Panier Client
- **Choix arrêté** : Le contexte React `CartContext` (`useCart`) maintient l'état dans `localStorage` sous la clé `lahatheque_cart`.
  - Lors de la connexion ou inscription réussie au checkout, le panier en mémoire reste intact.
  - Les champs d'adresse sont automatiquement préremplis avec les données de profil du client fraîchement connecté.
- **Raisonnement** : Zéro perte de commande, fluidité absolue.

### Décision 2.3 : Gestion Rigoureuse et Séparée des 3 Formats d'Ouvrages
- **Choix arrêté** :
  1. **Livre Papier (`format_type == 'paper'`)** :
     - Formulaire d'adresse de livraison obligatoire sur `/checkout` (adresse, ville, pays, téléphone, date et créneau horaire souhaités).
     - Persistance dans l'entité Django `PhysicalDelivery`.
     - Génération d'une notification interne pour les gestionnaires logistiques (`manager`) pour préparation et expédition.
     - Suivi d'état visible par le client sur `/student/orders`.
  2. **Livre Numérique (`format_type == 'digital'`)** :
     - Déverrouillage automatique et immédiat dans `ReadingProgress` dès confirmation du paiement.
     - Consultation directe dans la bibliothèque `/student/books` via la liseuse FlipBook 3D sécurisée avec filigrane dynamique.
  3. **Livre Audio (`format_type == 'audio'`)** :
     - Accès streaming instantané dans le lecteur audio sécurisé de l'espace client.
  4. **Paiement & Facturation** :
     - Génération et expédition immédiate d'un e-mail transactionnel avec facture officielle acquittée en PDF.

---

## 3. Traçabilité, Observabilité & Console Logs (Principe Constitutionnel XI)

### Décision 3.1 : Instrumentation Frontend des DevTools
- Les fonctions de soumission du contact et du checkout comportent :
  - `console.groupCollapsed("[CONTACT FORM] ...")` : logs de validation, rôles, besoins, temps de réponse en ms.
  - `console.groupCollapsed("[CHECKOUT FLOW] ...")` : traçabilité du statut auth, étape du panier, création d'accès numérique et statut de livraison.

---

## 4. Passation de Commande Administrateur & Ventes Comptoir (`/admin/orders`)

### Décision 4.1 : Ergonomie de Sélection Client par Combobox
- **Choix arrêté** : Remplacer l'ancienne liste statique qui prenait tout l'écran par un composant d'Autocomplete / Combobox fluide.
  - Recherche en temps réel sur le nom, l'e-mail et le numéro de téléphone.
  - Menu déroulant flottant avec avatar, libellé du rôle, coordonnées et bouton d'action directe.
  - Fermeture automatique au clic et affichage d'une carte récapitulative compacte du client choisi.
- **Raisonnement** : Respect du Principe VIII (Sobriété et Finitions Nobles) et élimination du défilement vertical inutile.

### Décision 4.2 : Mode Client Comptoir Externe (Vente Boutique sans Compte)
- **Choix arrêté** : Bascule « Compte existant » / « Client comptoir externe » :
  - Pour un client de passage en boutique physique, l'administrateur renseigne son nom complet, son numéro de téléphone (obligatoire pour le reçu/traçabilité) et son e-mail (optionnel, obligatoire uniquement si la commande comporte un produit numérique).
  - La commande est enregistrée avec `user = null`, `is_pos_order = True`, `guest_name`, `guest_phone`, `guest_email`.
  - Pas de création de compte utilisateur forcé en base.
  - Règlements comptoir immédiats : Espèces ou Mobile Money direct de flotte (`momo_direct`), avec statut `paid` immédiat et remise physique en boutique (`hand_delivery`).
