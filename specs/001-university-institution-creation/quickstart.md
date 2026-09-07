# Quickstart Guide: Création et Rattachement des Universités Partenaires

**Feature**: `001-university-institution-creation`
**Date**: 2026-09-08
**Status**: Ready for Validation

Ce guide décrit les scénarios de test et de validation de bout en bout pour vérifier le bon fonctionnement de la synchronisation entre comptes utilisateurs et institutions universitaires.

---

## Prérequis

1. Serveur Django backend actif sur le port 8000.
2. Serveur Next.js frontend actif sur le port 3000.
3. Compte administrateur connecté (`admin@lahatheque.com` ou super-admin).

---

## Scénario 1 : Création d'une nouvelle Institution Partenaire avec son compte mandataire

1. **Accès** : Se rendre sur `http://localhost:3000/admin/users/universities`.
2. **Action** : Cliquer sur le bouton **« + Ajouter un compte »**.
3. **Formulaire - Étape 1** : Le rôle *Université Partenaire* est pré-sélectionné. Cliquer sur *Suivant : Coordonnées*.
4. **Formulaire - Étape 2** :
   - Prénom : `Afi`
   - Nom : `Agbemebio`
   - E-mail : `mandataire@ul.tg`
   - Téléphone : `+22890112233`
   - Pays : `Togo (TG)`
   - Choix Institution : Sélectionner l'onglet ou l'option **« + Nouvelle Institution Partenaire »**.
   - Nom complet : `Université de Lomé`
   - Sigle / Code : `UL`
5. **Validation** : Cliquer sur **« Générer le Compte »**.
6. **Résultat Attendu** :
   - Écran de confirmation Étape 3 avec mot de passe temporaire.
   - En base de données : une nouvelle entrée `Institution` avec `name="Université de Lomé"`, `code="UL"`, `royalty_rate=15.00` est créée.
   - L'utilisateur `mandataire@ul.tg` a `institution_id = id_de_UL`.
   - Dans le tableau `/admin/users/universities`, la nouvelle ligne affiche : `Université de Lomé (UL)`.

---

## Scénario 2 : Rattachement d'un compte existant (Régularisation `orphelin@test.bj`)

1. **Accès** : Se rendre sur `http://localhost:3000/admin/users/universities`.
2. **Action** : Sur la première ligne (`orphelin@test.bj`), cliquer sur le nouveau bouton d'action **Éditer** (*icône crayon/sliders*).
3. **Modale d'Édition** :
   - Dans le champ *Institution Partenaire*, sélectionner **« Université de Parakou (UP) »**.
   - Cliquer sur **« Enregistrer les Modifications »**.
4. **Résultat Attendu** :
   - Toast de succès : *« Compte et institution mis à jour avec succès. »*
   - La ligne du tableau se met à jour instantanément : affiche `Université de Parakou (UP)` avec le contact `orphelin@test.bj`.
   - En base : `user.institution` pointe vers l'entité UP.

---

## Scénario 3 : Disponibilité immédiate dans le Combobox de Dépôt

1. **Accès** : Se connecter en tant que Maquettiste ou Chef Maquettiste et aller sur `/chief-layout/deposit` ou `/layout-artist/deposits/new`.
2. **Action** : À l'Étape 3 (*Classification & Droits*), ouvrir le combobox **Université / Établissement partenaire**.
3. **Résultat Attendu** :
   - `Université de Lomé (UL)` apparaît immédiatement avec le badge `Partenaire Officiel`.
   - Taper `UL` ou `Lomé` dans la barre de recherche du combobox filtre instantanément sur cette nouvelle université.

---

## Scénario 4 : Espace Redevances du Mandataire (`/university/royalties`)

1. **Accès** : Se connecter avec le compte `mandataire@ul.tg` et ouvrir `/university/royalties`.
2. **Résultat Attendu** :
   - La carte principale affiche : `Taux Conventionné : 15%`.
   - Le libellé affiche : `Université de Lomé`.
   - Le relevé de redevances et l'export PDF portent la mention légale de l'Université de Lomé.
