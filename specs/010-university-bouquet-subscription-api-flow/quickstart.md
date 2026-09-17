# Quickstart & Validation Guide

**Feature**: `010-university-bouquet-subscription-api-flow`  
**Date**: 2026-09-17  
**Status**: Completed  

Ce guide décrit la procédure de test et de validation de bout en bout des flux de bouquets documentaires, de la tarification bipériodique, du paiement Moneroo et de la délivrance des clés API.

---

## 1. Pré-requis & Données de Test

- Backend Django opérationnel (`http://localhost:8000`) et Frontend Next.js (`http://localhost:3000`).
- Un compte Administrateur LAHAThèque (`admin@lahatheque.com`).
- Un compte Université Cliente (`moderateur@uac-client.bj`, avec `institution.institution_type = 'client'`).
- Un compte Lecteur Particulier / Étudiant (`etudiant@uac.bj`).
- Au moins une université ayant des ouvrages publiés au catalogue (ex: UAC avec 10+ livres).

---

## 2. Scénario 1 : Administration des Bouquets Documentaires (`/admin/catalog/bouquets`)

### Étapes :
1. Se connecter en tant qu'Administrateur et naviguer sur `/admin/catalog/bouquets`.
2. Vérifier la DataTable principale :
   - [ ] La colonne **« Tarif Mensuel »** est visible et présente les montants en Francs CFA (XOF) à côté de « Tarif Annuel ».
   - [ ] Le filtre par type ne contient plus l'option « Par Faculté ».
3. Cliquer sur le bouton **« Nouveau Bouquet »** :
   - [ ] Dans la liste déroulante des types, vérifier que le choix « Par Faculté » est strictement absent.
   - [ ] Sélectionner le type **« Intégral Université »** : vérifier que le champ de sélection de l'université est **obligatoire**.
   - [ ] Sélectionner une université (ex : UAC) : vérifier que le nombre exact de livres réels s'affiche immédiatement.
   - [ ] Cliquer sur **« Voir le détail des livres »** : vérifier qu'une modale scrollable s'ouvre avec la liste complète des livres de l'université, leurs visuels de couverture, titres et auteurs.
   - [ ] Renseigner les deux tarifs : **Tarif Mensuel** (ex: 75 000 XOF) et **Tarif Annuel** (ex: 750 000 XOF).
   - [ ] Enregistrer l'offre et vérifier sa présence dans la table avec ses deux tarifs.

---

## 3. Scénario 2 : Souscription Université Cliente & Délivrance des Clés API

### Étapes :
1. Se connecter avec le compte Université Cliente et accéder à `/university/bouquets`.
2. Choisir le bouquet créé au Scénario 1.
3. Sélectionner la formule **« Abonnement Mensuel (30 jours) »** ou **« Abonnement Annuel (365 jours) »**.
4. Cliquer sur **« Souscrire via Moneroo »** :
   - [ ] Vérifier que le montant transmis à Moneroo correspond au tarif de la formule choisie.
   - [ ] Valider la simulation du paiement.
5. Après validation, vérifier la redirection vers la page de confirmation dédiée :
   - [ ] La date d'expiration exacte (J+30 pour le mensuel, J+365 pour l'annuel) est clairement affichée.
   - [ ] Le `client_id` et le `client_secret` en clair sont affichés avec un avertissement de sécurité.
   - [ ] Le bouton **« Copier »** copie chaque identifiant dans le presse-papier avec feedback immédiat.
   - [ ] Le bouton **« Télécharger les identifiants (.txt) »** télécharge un fichier texte structuré avec le bloc de variables `.env`.
   - [ ] Le bouton **« Télécharger le Guide d'Implémentation PDF »** génère et télécharge le document PDF officiel aux couleurs LAHAThèque.
6. Vérifier la boîte de réception email :
   - [ ] L'email envoyé à l'université mentionne expressément la date d'échéance et contient la facture PDF acquittée en pièce jointe.
   - [ ] L'email d'alerte à l'administrateur mentionne le montant et l'échéance.
7. Se reconnecter en tant qu'administrateur et vérifier sur `/admin/api` :
   - [ ] L'application partenaire apparaît bien avec le nom de l'université, le mode Catalogue Seul, le badge VIP et le bouquet restreint.

---

## 4. Scénario 3 : Souscription Client Particulier (B2C) & Bibliothèque

### Étapes :
1. Se connecter avec le compte Étudiant/Lecteur et naviguer sur `/student/bouquets`.
2. Choisir un bouquet et opter pour l'abonnement Mensuel ou Annuel.
3. Finaliser le règlement Moneroo :
   - [ ] Vérifier qu'**aucune clé API** n'est affichée ni créée.
4. Naviguer immédiatement vers sa bibliothèque personnelle (`/student/books`) :
   - [ ] L'onglet **« Bouquets en cours »** est présent et actif.
   - [ ] Tous les livres du bouquet souscrit y sont listés avec un badge doré indiquant le nom du bouquet et la date d'expiration.
   - [ ] Les livres achetés individuellement par l'étudiant continuent d'apparaître dans « Livres achetés » avec leur propre date de validité de 12 mois.
5. Ouvrir un livre du bouquet dans la liseuse sécurisée :
   - [ ] La lecture s'ouvre instantanément sans erreur de droits.
