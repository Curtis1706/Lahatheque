# Phase 0 Research: Création et Rattachement des Universités Partenaires

**Feature**: `001-university-institution-creation`
**Date**: 2026-09-08
**Status**: Completed

## Décision 1 : Stratégie d'API pour la création conjointe Compte Utilisateur & Institution

- **Décision** : Enrichir le serializer `AdminUserCreateSerializer` et la méthode `AdminUserViewSet.create` (`POST /api/v1/admin/users/`) pour accepter :
  - `institution_id` : UUID d'une institution existante en base (UAC, UP, UNA, UNSTIM...)
  - OU `new_institution_name`, `new_institution_code`, `new_institution_country` : paramètres pour créer à la volée une nouvelle institution partenaire.
- **Raisonnement** : L'administrateur remplit un formulaire unifié. L'exécution de la création du compte `User` et de l'entité `Institution` dans la même transaction atomique (`@transaction.atomic`) garantit l'intégrité référentielle : aucun compte orphelin ne peut être créé si l'institution échoue, et inversement.
- **Alternatives évaluées** :
  - *Deux appels API successifs côté frontend* (créer d'abord l'institution sur `/api/v1/partners/institutions/` puis créer l'utilisateur) : Rejeté car non transactionnel ; si le second appel échoue (ex: email déjà pris), l'institution reste en base sans gestionnaire.

## Décision 2 : Génération et unicité du sigle / code d'institution

- **Décision** : Si le champ `code` n'est pas saisi par l'administrateur, il est automatiquement déduit des initiales des mots significatifs du nom (ex: *"Université de Parakou"* → *"UP"* ; *"Université de Lomé"* → *"UL"*). En cas de collision avec un sigle existant, un suffixe numérique est adjoint (ex: *"UL-2"*).
- **Raisonnement** : Le modèle `Institution` impose `unique=True` ou une indexation forte sur `code`. Une déduction automatique intelligente simplifie la saisie pour l'administrateur tout en protégeant la base contre les violations de contrainte.
- **Alternatives évaluées** :
  - *Code obligatoire à la saisie* : Plus rigide et source de blocage si l'administrateur hésite sur le code conventionnel.

## Décision 3 : Régularisation et édition des comptes existants (`orphelin@test.bj`)

- **Décision** : Créer un composant modal `EditUniversityUserModal` dans `components/features/admin/edit-university-user-modal.tsx`, déclenché par un bouton d'action d'édition sur chaque ligne de `/admin/users/universities`. Ce formulaire appelle `PATCH /api/v1/admin/users/<id>/` qui met à jour l'utilisateur et synchronise le lien `user.institution_id` et `institution.user`.
- **Raisonnement** : Permet de rattacher immédiatement `orphelin@test.bj` à l'une des 4 universités en base (ex: UP ou UAC) ou à une nouvelle institution sans passer par la console Django.
- **Alternatives évaluées** :
  - *Suppression et recréation* : Rejeté car destructeur d'historique et risqué.

## Décision 4 : Affectation comptable et taux conventionné par défaut

- **Décision** : Toute nouvelle institution partenaire créée reçoit par défaut :
  - `royalty_rate = Decimal("15.00")`
  - `contract_reference = f"CTR-UNIV-{current_year}-{code}"`
  - `is_active = True`
  - Les redevances sont calculées sur `ouvrage.institution.royalty_rate` et créditées au compte de l'Institution.
- **Raisonnement** : Respect strict du modèle économique LAHAThèque (15% pour l'université académique). Les taux dérogatoires restent ajustables ultérieurement sur `/admin/royalties`.
