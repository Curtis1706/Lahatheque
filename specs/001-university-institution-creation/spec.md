# Feature Specification: Création et Rattachement des Universités Partenaires

**Feature Branch**: `001-university-institution-creation`

**Created**: 2026-09-08

**Status**: Draft


## Clarifications

### Session 2026-09-08

- Q: Comment l'administrateur doit-il pouvoir modifier ou rattacher l'institution d'un compte université existant depuis le tableau de gestion /admin/users/universities ? → A: Option A - Ajouter un bouton d'action d'édition sur chaque ligne pour modifier le représentant et sélectionner/changer son institution partenaire rattachée via une modale dédiée.
- Q: À quelle entité les redevances universitaires (15 %) doivent-elles être créditées et versées : au compte de l'Institution partenaire (personne morale) ou au compte personnel de l'utilisateur mandataire ? → A: Option A - Les redevances sont calculées, créditées et rattachées directement à l'Institution partenaire (personne morale détentrice de la convention et du compte bancaire/MoMo officiel). L'utilisateur mandataire agit comme gestionnaire habilité pour consulter les relevés et demander les versements vers le compte de l'université.
- Q: Le taux conventionné de redevance appliqué à l'institution est-il répercuté et visible sur l'espace du compte utilisateur mandataire rattaché ? → A: Oui, le taux conventionné (15% standard ou dérogatoire) est hérité en temps réel de l'Institution et affiché explicitement sur le tableau de bord des redevances (/university/royalties), sur le détail de chaque vente et sur les bordereaux PDF officiels téléchargeables.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Création d'une nouvelle université partenaire avec son compte gestionnaire (Priority: P1)

En tant qu'administrateur de LAHAThèque, lorsque j'ajoute un nouveau compte de rôle Université pour un établissement qui n'est pas encore partenaire, je veux renseigner le nom complet de l'université, son sigle et son pays afin que l'institution officielle soit automatiquement créée en base de données et directement liée au compte utilisateur créé.

**Why this priority**: Actuellement, le champ nom d'université n'est pas enregistré en base lors de la création du compte, ce qui laisse le compte sans institution liée et empêche l'université d'exister dans le système.

**Independent Test**: Remplir la modale avec un nouveau nom (ex: "Université de Kara"), un code (ex: "UK"), un pays et les coordonnées du représentant. Valider la création : vérifier que la table des institutions contient la nouvelle fiche avec le taux de redevance par défaut de 15% et que l'utilisateur lui est associé.

**Acceptance Scenarios**:

1. **Given** l'administrateur ouvre la modale d'ajout de compte avec le rôle Université, **When** il choisit de créer une nouvelle institution et renseigne "Université de Kara", le code "UK" et l'email du mandataire, **Then** l'institution est créée avec succès en base de données avec le taux de 15% et liée au compte utilisateur.
2. **Given** une nouvelle université créée, **When** un maquettiste ouvre le combobox de dépôt d'ouvrages, **Then** "Université de Kara (UK)" apparaît immédiatement dans la liste des partenaires officiels.

---

### User Story 2 - Rattachement d'un nouveau gestionnaire à une université existante (Priority: P1)

En tant qu'administrateur, lorsqu'une université est déjà enregistrée en base (ex: UAC, UP, UNA, UNSTIM) mais qu'un nouveau mandataire ou gestionnaire de compte doit être désigné, je veux pouvoir sélectionner l'université existante dans une liste déroulante pour lui associer le nouveau compte utilisateur.

**Why this priority**: Évite de créer des doublons d'institutions pour une même université et permet de renouveler ou compléter les accès du personnel universitaire d'un établissement partenaire.

**Independent Test**: Ouvrir la modale, sélectionner "Université d'Abomey-Calavi (UAC)" parmi les institutions existantes, renseigner les coordonnées du nouvel agent, valider : l'utilisateur créé doit être rattaché à l'institution existante sans créer de nouvelle ligne institutionnelle.

**Acceptance Scenarios**:

1. **Given** la liste des universités déjà partenaires, **When** l'administrateur sélectionne une institution existante et valide, **Then** le compte utilisateur est créé et associé à l'identifiant de cette institution.
2. **Given** le mandataire connecté avec ses nouveaux accès, **When** il accède à son tableau de bord universitaire, **Then** il visualise bien les indicateurs, catalogues et redevances de l'institution sélectionnée.

---

### User Story 3 - Affichage exhaustif et traçabilité sur le tableau de gestion des universités (Priority: P2)

En tant qu'administrateur, lorsque je consulte la page de gestion des universités (`/admin/users/universities`), je veux voir clairement le nom officiel de l'institution rattachée à chaque compte ainsi que son sigle, et non un libellé par défaut ou le nom de famille de l'utilisateur.

**Why this priority**: Clarté administrative et financière indispensable pour savoir quel représentant gère quel établissement sans risque de confusion.

**Independent Test**: Naviguer sur `/admin/users/universities` : la première colonne doit afficher le nom réel de l'institution (ex: "Université d'Abomey-Calavi") et son sigle, avec l'email du mandataire en sous-titre.

**Acceptance Scenarios**:

1. **Given** un compte utilisateur lié à une institution, **When** la liste est chargée, **Then** la colonne "Établissement & Contact" affiche le nom de l'institution partenaire et son sigle officiel.

---

### User Story 4 - Modification et rattachement d'institution pour les comptes existants (Priority: P1)

En tant qu'administrateur, lorsque je constate un compte université sans institution liée (comme un compte orphelin) ou que les coordonnées du mandataire doivent changer, je veux cliquer sur un bouton d'édition dans le tableau pour mettre à jour ses informations et lui assigner l'une des universités de la base de données (ou en créer une nouvelle).

**Why this priority**: Permet de régulariser immédiatement les comptes existants en base et de réaffecter les mandataires sans recréer de compte.

**Independent Test**: Cliquer sur l'action d'édition sur la ligne `orphelin@test.bj`, sélectionner "Université de Parakou (UP)" dans la liste des institutions, enregistrer : la ligne est instantanément mise à jour et affiche UP.

**Acceptance Scenarios**:

1. **Given** un compte université existant dans le tableau, **When** l'administrateur clique sur le bouton d'édition, **Then** une modale s'ouvre avec les coordonnées actuelles et le sélecteur d'institution.
2. **Given** la modale d'édition, **When** l'administrateur sélectionne une institution et enregistre, **Then** le lien `user.institution` et `institution.user` est immédiatement synchronisé en base de données.

---

### Edge Cases

- **Doublon de sigle ou de nom** : Que se passe-t-il si l'administrateur tente de créer une nouvelle institution avec un sigle déjà existant en base (ex: "UAC") ? Le système doit bloquer la création avec un message d'erreur clair et proposer de rattacher le compte à l'institution existante au lieu d'échouer silencieusement.
- **Suppression d'un compte utilisateur** : Si un compte de gestionnaire est supprimé par l'administrateur, la fiche de l'Institution partenaire, ses contrats et l'historique de ses redevances ne doivent pas être détruits (déliaison sécurisée ou réassignation).
- **Nom d'institution avec caractères accentués ou espaces** : Le système doit automatiquement générer ou assainir le code court si celui-ci n'est pas fourni par l'administrateur.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La modale d'ajout de compte administrateur MUST proposer deux options lorsque le rôle sélectionné est "university" : rattacher à une institution partenaire existante OU créer une nouvelle institution partenaire.
- **FR-002**: Si l'option "Institution existante" est choisie, l'administrateur MUST pouvoir sélectionner l'établissement dans la liste des institutions actives issues de la base de données.
- **FR-003**: Si l'option "Nouvelle institution" est choisie, les champs obligatoires MUST être le Nom complet de l'établissement et le Pays, avec un champ Code/Sigle facultatif (auto-généré à partir des initiales si non renseigné).
- **FR-004**: Lors de la création d'une nouvelle institution, le système MUST initialiser son taux contractuel de redevance à la valeur standard de 15,00 % conformément aux règles de la plateforme.
- **FR-005**: Le backend MUST exécuter la création du compte utilisateur et la création/liaison de l'institution dans une transaction atomique unique, garantissant qu'aucun compte orphelin ne soit créé en cas d'erreur.
- **FR-006**: Dès la validation, la nouvelle institution MUST être disponible en temps réel dans l'API des institutions partenaires et dans le composant Combobox des universités sur toutes les pages de dépôt.
- **FR-007**: Le tableau de gestion des universités (`/admin/users/universities`) MUST afficher le nom complet et le sigle de l'institution liée à chaque compte.
- **FR-008**: Si le compte utilisateur est créé avec succès, un e-mail contenant ses identifiants temporaires sécurisés MUST être expédié au titulaire.
- **FR-009**: Le tableau de gestion des universités MUST proposer une action d'édition sur chaque ligne ouvrant une modale permettant de mettre à jour les coordonnées du représentant et d'assigner/réassigner son institution partenaire rattachée.
- **FR-010**: Les redevances universitaires (15 %) MUST être comptabilisées et rattachées directement à l'entité Institution (personne morale) et non au compte personnel du mandataire. L'utilisateur mandataire peut consulter les relevés et demander le versement vers les coordonnées financières officielles de l'université enregistrées sur l'Institution.
- **FR-011**: L'espace universitaire (/university/royalties) du mandataire MUST afficher dynamiquement le taux conventionné effectif de son institution rattachée (standard ou dérogatoire) sur les indicateurs de synthèse, le détail de chaque vente et les bordereaux PDF générés.

### Key Entities *(include if feature involves data)*

- **Institution (Établissement Partenaire)** : Représente la personne morale académique (ex: Université d'Abomey-Calavi). Attributs clés : nom complet, sigle/code unique, pays, taux de redevance (15%), référence convention, solde financier, coordonnées bancaires (IBAN/SWIFT) et Mobile Money institutionnel.
- **User (Compte Utilisateur Mandataire)** : Représente la personne physique déléguée pour administrer l'espace numérique de l'institution. Rôle : `university`. Clé étrangère vers l'Institution. Ce compte n'encaisse pas les fonds sur son patrimoine personnel mais pilote l'espace institutionnel.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 % des comptes créés avec le rôle université sont explicitement rattachés à une institution valide en base de données (zéro compte orphelin).
- **SC-002**: Toute nouvelle institution enregistrée via la modale est visible dans le combobox de dépôt en moins de 2 secondes sans nécessiter de redémarrage serveur ou de script manuel.
- **SC-003**: Le temps moyen de création d'un établissement partenaire et de son compte administrateur est inférieur à 60 secondes pour l'administrateur.
- **SC-004**: Zéro régression sur la gestion des droits d'auteur, la consultation du catalogue et le calcul des redevances à 15 % pour les institutions.

## Assumptions

- Le rôle "university" est réservé aux mandataires et administrateurs d'établissements d'enseignement supérieur partenaires.
- Le taux de redevance institutionnel standard par défaut est de 15,00 %, modifiable ultérieurement dans les paramètres de la convention.
- Les institutions nationales initiales (UAC, UP, UNA, UNSTIM) restent les partenaires socles du système.
