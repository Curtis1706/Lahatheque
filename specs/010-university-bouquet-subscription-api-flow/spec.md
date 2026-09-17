# Feature Specification: Flux de Souscription Bouquet (Universités & Clients), Tarification Bipériodique et Délivrance de Clés API

**Feature Branch**: `010-university-bouquet-subscription-api-flow`

**Created**: 2026-09-17

**Status**: Draft

**Input**: User description: "chez les université qui veulent souscrire, on va mettre le monero, redirection et tout, ça marche déjà pour l'achat de livre et tout, tu peux voir ça là, maintenant, maintenant quand ils souscrivent font le paiement ? ils reviennent sur une page où ils pourront avoir leur clé api, ils verront leur clé qu'ils pourront copier, ce leur sera demandé de téléchargé pour garder aussi, ils pourront télécharger le guide d'implémentattion, y a trois guide dintégration en md là on va bien réécrire ça en pdf et leur donné (pdf respectant le logo lahathèque et tout), leur clé api aura pour périmètre d'accès : le catalogue laha seul plus précisement les livres de leur bouquet, il se peut qu'ils n'aient pas d'url de retour, donc on leur en demande pas, pour nom de l'intégration c'est le nom de l'université client, et etc, ils auront un quota zéro limite (vip illimité), je crois c le guide accès catyalogue seul on va utiliser : E:\Lahatheque\GUIDE_INTEGRATION_CATALOGUE_SEUL.md pour le pdf à télécharger, l'admin à son niveau doit voir l'api créé ici : https://lahatheque.com/admin/api, pour la souscription un mail leur sera envoyé ainsi qu'à l'admin, facture joint au mail qui leur sera envoyé, tout bien enregistré dans les pages de gestion de finances qu'il faut. Déjà bouquet aussi y a des corrections à faire, tout à mettre dans les specs, enlève par faculté là dans les types de bouquet et pour intégral université on doit pouvoir choisir l'université en question, enlève le truc optionnel, quand tu choisi l'université tu dois voir le nombre de livre là vraiment et quand tu cliques détails un truc scrollable apparait et tu vois tous les livres en détails avec book cover, aussi il reste prix mensuel, donc c un abonnement qui peut être mensuel comme par mois, celui qui veut souscrire opte pour ce qu'il veut, mensuel ou annuel et fais le paiement, donc l'université qui souscrit pour mensuel verra que à tel moment son accès sera coupé pour l'api, il doit voir la date 30j après, ce sera mentionné dans son mail dans sa facture comme dans le mail de l'admin: a fait un abonnement mensuel qui expire le.... idem pour annuel, il doit savoir quand ça finit aussi, l'admin doit suivre les abonnements pour un bouquet aussi, date d'expiration etc et tout, dans l'espace client ils auront aussi une page pour souscrire à un bouquet, et ils peuvent le faire mensuellement comme annuellement, quand eux ils souscrivent pas de clé api, les livres seront juste ajouter dans leur bibliothèque pour la période de souscription après ils y perdront l'accès à moins de renouveller, donc dans leur bibliothèque je sais pas si y aura une tab pour bouquet en cours, avec les livres et etc, bref vois tout ça, https://lahatheque.com/admin/catalog/bouquets ici il manque tarif mensuel dans la data table aussi"

## Clarifications

### Session 2026-09-17

- Q: Lorsqu'une université cliente souscrit à plusieurs bouquets documentaires successifs, comment ses accès API doivent-ils être configurés ? → A: Clé API unique cumulée (toujours le même client_id et client_secret rattachés à l'université, dont le périmètre d'accès catalogue couvre automatiquement l'ensemble des bouquets actifs souscrits).
- Q: Lorsqu'un abonné (université cliente ou lecteur particulier) effectue un paiement de renouvellement avant la fin de sa période d'abonnement en cours, comment la nouvelle date d'expiration doit-elle être calculée ? → A: Prolongation cumulative (les 30 jours pour un mensuel ou 365 jours pour un annuel s'additionnent à la date de fin en cours : l'abonné conserve l'intégralité de ses jours restants).
- Q: Lorsqu'une université cliente possède plusieurs bouquets actifs ayant des dates d'expiration différentes, comment l'API doit-elle restreindre ses accès au fur et à mesure que les bouquets expirent ? → A: Filtrage granulaire par bouquet (la clé API reste active tant qu'au moins un bouquet est valide ; l'accès aux livres d'un bouquet donné se coupe dès son expiration, et la clé n'est totalement révoquée que si tous les bouquets sont expirés).
- Q: Faut-il programmer l'envoi d'emails de rappel avant l'échéance de l'abonnement pour inviter l'université ou le client à renouveler avant la coupure des accès ? → A: Préavis automatique par email (envoi d'un email de rappel préventif à J-7 pour la formule annuelle et J-3 pour la formule mensuelle avec lien direct de renouvellement).
- Q: Quel format de fichier téléchargeable pour les identifiants API préférez-vous mettre à disposition de l'université cliente sur l'écran post-paiement ? → A: Fichier texte documenté avec variables `.env` (fichier `.txt` intégrant les consignes de sécurité, la date d'échéance, l'URL de base de l'API et le bloc de variables `.env` prêtes à copier : `LAHATHEQUE_CLIENT_ID` et `LAHATHEQUE_CLIENT_SECRET`).
- Q: Comment s'articulent les droits d'accès et l'affichage dans la bibliothèque lorsqu'un livre numérique est acheté à l'unité (validité 12 mois) et figure également dans un bouquet souscrit (mensuel ou annuel) ? → A: Souveraineté des durées & séparation étanche dans la bibliothèque (l'achat d'un livre numérique confère 12 mois d'accès dédiés qui ne sont jamais écourtés par l'expiration d'un bouquet ; si un utilisateur achète à l'unité un livre présent dans son bouquet en cours, cet ouvrage acquiert sa propre licence de 12 mois ; dans la bibliothèque `/student/books`, l'onglet des livres achetés et l'onglet « Bouquets en cours » sont clairement distincts avec leurs dates d'expiration respectives).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configuration Administrative des Bouquets & Tarification Bipériodique (Priority: P1)

En tant qu'administrateur de la plateforme LAHAThèque,
Je souhaite configurer les offres de bouquets documentaires avec une tarification double (Tarif Mensuel et Tarif Annuel), supprimer le type obsolète « Par Faculté », rendre obligatoire la sélection de l'université pour le type « Intégral Université », afficher en direct le décompte réel des livres et inspecter le catalogue détaillé avec couvertures dans une modale scrollable,
Afin de proposer un catalogue d'offres rigoureux, attractif et sans ambiguïté.

**Why this priority**: La création et la justesse des offres de bouquets avec leurs tarifs mensuels et annuels conditionnent directement les souscriptions en ligne, le calcul des montants Moneroo et l'intégrité des accès délivrés.

**Independent Test**: Peut être testé sur `/admin/catalog/bouquets` : vérifier l'absence de l'option « Par Faculté », la présence obligatoire du sélecteur d'établissement pour « Intégral Université », l'affichage dynamique du nombre de livres, l'ouverture de la modale des livres avec couvertures, la saisie des deux tarifs (mensuel et annuel) et la présence de la colonne « Tarif Mensuel » dans la table.

**Acceptance Scenarios**:

1. **Given** un administrateur sur `/admin/catalog/bouquets`, **When** il ouvre la modale de création ou de modification d'un bouquet, **Then** les types disponibles sont exclusivement : Par Discipline, Intégral Université, Par Pays, Personnalisé (le type « Par Faculté » est strictement absent).
2. **Given** la modale de création d'un bouquet, **When** l'administrateur choisit le type « Intégral Université », **Then** le champ de sélection de l'établissement est obligatoire (non optionnel), et dès la sélection d'une université, le système calcule et affiche instantanément le nombre réel d'ouvrages publiés rattachés à cet établissement avec un bouton « Voir le détail des livres ».
3. **Given** la sélection d'une université dans le type « Intégral Université », **When** l'administrateur clique sur « Voir le détail des livres », **Then** un panneau ou une modale scrollable s'ouvre, présentant la liste complète des livres de l'université avec visuel de couverture (`cover_url`), titre, auteurs et discipline.
4. **Given** la modale de création/édition de bouquet, **When** l'administrateur définit les prix, **Then** il dispose de deux champs obligatoires distincts en Francs CFA (XOF) : « Tarif Mensuel (XOF) » et « Tarif Annuel (XOF) ».
5. **Given** la table de données `/admin/catalog/bouquets`, **When** la liste des bouquets s'affiche, **Then** une colonne dédiée « Tarif Mensuel » apparaît à côté de la colonne « Tarif Annuel », affichant le montant mensuel en Francs CFA.
6. **Given** la page d'administration des bouquets, **When** l'administrateur souhaite auditer les abonnements d'un bouquet, **Then** un volet de suivi permet de consulter l'ensemble des souscripteurs (institutions et clients particuliers), leur formule (Mensuel / Annuel), leur date de souscription, leur date d'expiration et leur statut (actif ou expiré).

---

### User Story 2 - Souscription Institutionnelle (Universités Clientes) avec Choix de Période & Paiement Moneroo (Priority: P1)

En tant qu'administrateur ou responsable d'une Université Cliente,
Je souhaite choisir entre un abonnement Mensuel (valable 30 jours) ou Annuel (valable 365 jours) lors de la souscription d'un bouquet documentaire, et régler en ligne via Moneroo (Mobile Money ou Carte),
Afin d'activer immédiatement l'accès au bouquet pour mon campus avec une visibilité totale sur l'échéance de notre abonnement.

**Why this priority**: Permet aux universités clientes d'adapter leur trésorerie (abonnement flexible au mois ou forfait économique à l'année) tout en automatisant la collecte des fonds via la passerelle Moneroo.

**Independent Test**: Peut être testé en initiant une souscription institutionnelle pour chaque formule (mensuelle puis annuelle) : vérifier que le montant débité par Moneroo correspond au tarif choisi, que la date de fin est calculée à J+30 pour le mensuel et J+365 pour l'annuel, et que le statut passe à actif dès le paiement confirmé.

**Acceptance Scenarios**:

1. **Given** un représentant d'une université cliente sur son catalogue de bouquets (`/university/bouquets`), **When** il choisit un bouquet, **Then** l'interface lui propose un sélecteur clair entre « Abonnement Mensuel » (affichant le tarif mensuel) et « Abonnement Annuel » (affichant le tarif annuel avec mention de l'économie réalisée).
2. **Given** le choix de la formule (mensuelle ou annuelle), **When** l'utilisateur valide et opte pour le paiement en ligne, **Then** le système initialise la transaction Moneroo avec le montant correspondant en Francs CFA (XOF), transmet les métadonnées institutionnelles (ID bouquet, ID institution, période choisie) et redirige vers la page de paiement sécurisée.
3. **Given** un paiement validé avec succès par Moneroo, **When** la transaction est confirmée, **Then** la souscription passe au statut actif avec une date d'expiration fixée à la date courante + 30 jours (pour un mensuel) ou + 365 jours (pour un annuel).
4. **Given** une souscription mensuelle arrivant à son terme (30 jours révolus), **When** la date d'expiration est atteinte, **Then** le système coupe automatiquement les accès API associés et bascule la souscription au statut expiré, invitant l'université à renouveler.

---

### User Story 3 - Écran de Confirmation Post-Paiement & Délivrance des Clés API Partenaire (Priority: P1)

En tant qu'administrateur d'une université cliente ayant finalisé son paiement de bouquet,
Je souhaite être redirigé vers une page de confirmation post-paiement dédiée affichant ma date d'expiration précise et mes identifiants API machine-to-machine (`client_id` et `client_secret` en clair pour la première et unique fois),
Afin de copier les clés en un clic, télécharger un fichier récapitulatif sécurisé et récupérer le Guide d'Implémentation officiel au format PDF.

**Why this priority**: C'est la finalité technique du parcours B2B : l'université cliente dispose en toute autonomie de ses identifiants API calibrés pour son bouquet et de sa documentation technique sans dépendre du support.

**Independent Test**: Peut être testé en arrivant sur la page de succès post-paiement : vérifier l'affichage en clair du secret client avec avertissement de sécurité, le fonctionnement des boutons de copie et de téléchargement du fichier texte de clés, la présence du bouton de téléchargement du PDF du guide et l'affichage de la date d'expiration exacte.

**Acceptance Scenarios**:

1. **Given** un paiement institutionnel validé, **When** l'université cliente est redirigée sur la page de succès de souscription, **Then** la page affiche le récapitulatif de l'offre, la formule choisie (Mensuelle ou Annuelle), la date d'expiration précise de l'accès (ex: « Vos accès API sont valables jusqu'au JJ/MM/AAAA »), ainsi que l'identifiant client (`client_id`) et le secret client (`client_secret`).
2. **Given** la page de délivrance des identifiants API, **When** l'utilisateur clique sur le bouton de copie, **Then** l'identifiant concerné est copié dans le presse-papier avec un retour visuel instantané.
3. **Given** la page de délivrance des identifiants API, **When** l'utilisateur clique sur le bouton de téléchargement des identifiants, **Then** un fichier texte sécurisé (`lahatheque-api-credentials-[nom-univ].txt`) contenant le nom de l'université, la formule, la date d'expiration, le bouquet restreint, le `client_id` et le `client_secret` est téléchargé.
4. **Given** l'application partenaire créée automatiquement par le système, **When** on examine ses paramètres, **Then** son nom d'intégration correspond au nom de l'université cliente, son mode d'accès est exclusivement Catalogue Seul (`catalog_only`), son périmètre est restreint au bouquet souscrit (`restricted_bouquet`), son palier est VIP Illimité (aucun quota limite) et aucune URL de retour n'est exigée.
5. **Given** la page de confirmation, **When** l'utilisateur clique sur le bouton de téléchargement du guide d'implémentation, **Then** le document officiel « Guide d'Intégration Partenaire — Mode Catalogue LAHAThèque Seul » généré en PDF aux couleurs officielles (logo vectoriel LAHAThèque, Navy et Or, polices Playfair Display et Poppins, exemples multi-langages) est téléchargé immédiatement.

---

### User Story 4 - Notifications Transactionnelles avec Date d'Expiration & Facturation Acquittée (Priority: P2)

En tant que service financier de l'université cliente et en tant qu'administrateur de LAHAThèque,
Je souhaite recevoir un email transactionnel immédiatement après le paiement avec mention explicite de la formule, de la date exacte d'expiration et avec la facture acquittée en pièce jointe,
Afin de garantir la conformité comptable, la transparence sur les dates de validité et la traçabilité des recettes.

**Why this priority**: La clarté sur la date d'échéance (30 jours ou 365 jours) doit être documentée sur la facture officielle et dans les emails envoyés aux deux parties prenantes pour éviter tout litige commercial.

**Independent Test**: Peut être testé en simulant une confirmation de paiement : vérifier la réception de l'email par le contact de l'université (mentionnant la date d'expiration et contenant la facture PDF acquittée) et de l'email d'alerte à l'administrateur (mentionnant le type d'abonnement et la date de fin).

**Acceptance Scenarios**:

1. **Given** un paiement de bouquet confirmé avec succès, **When** le traitement de notification s'exécute, **Then** un email est envoyé au contact de l'université cliente indiquant : « Votre abonnement [mensuel/annuel] au bouquet [Nom Bouquet] a été activé avec succès. Vos accès sont valables jusqu'au [Date d'expiration]. » avec la facture PDF acquittée en pièce jointe.
2. **Given** le même paiement confirmé, **When** le traitement de notification s'exécute, **Then** un email est envoyé à l'équipe administrative de LAHAThèque indiquant : « L'université [Nom Université] a souscrit un abonnement [mensuel/annuel] au bouquet [Nom Bouquet] d'un montant de [Montant] XOF, qui expire le [Date d'expiration]. ».
3. **Given** la validation du paiement, **When** les écritures financières sont générées, **Then** la transaction est comptabilisée dans les tableaux de bord de gestion financière de la plateforme avec sa référence Moneroo et son échéance.

---

### User Story 5 - Souscription B2C des Lecteurs/Clients Individuels & Onglet Dédié dans la Bibliothèque (Priority: P2)

En tant qu'étudiant, enseignant ou lecteur individuel connecté sur l'espace client (`/student`),
Je souhaite pouvoir souscrire à un bouquet documentaire en formule Mensuelle ou Annuelle via Moneroo, sans clé API, et retrouver automatiquement tous les livres de ce bouquet dans un onglet dédié « Bouquets en cours » au sein de ma bibliothèque,
Afin de lire les manuels du bouquet de manière illimitée pendant toute la durée de ma souscription.

**Why this priority**: Ouvre l'offre de bouquets au grand public et aux apprenants individuels (B2C), en intégrant les ouvrages directement dans leur bibliothèque numérique sans complexité technique d'API.

**Independent Test**: Peut être testé sur l'espace étudiant : naviguer sur la page des bouquets (`/student/bouquets`), choisir une formule (mensuelle ou annuelle), régler via Moneroo, puis se rendre sur `/student/books` et constater l'apparition de l'onglet « Bouquets en cours » avec les livres du bouquet et la date de fin d'accès.

**Acceptance Scenarios**:

1. **Given** un client lecteur sur la page `/student/bouquets`, **When** il explore les offres, **Then** chaque bouquet présente ses livres, son descriptif et le choix entre le Tarif Mensuel et le Tarif Annuel avec un bouton de souscription en ligne.
2. **Given** un client lecteur souscrivant à un bouquet, **When** il effectue le paiement Moneroo avec succès, **Then** le système active la souscription client (`ClientBouquetSubscription`) pour 30 jours (si mensuel) ou 365 jours (si annuel), sans générer aucune clé API ni rediriger vers un écran de clés techniques.
3. **Given** un client lecteur ayant un ou plusieurs bouquets actifs, **When** il se rend sur sa bibliothèque (`/student/books`), **Then** un onglet dédié « Bouquets en cours » est disponible (à côté de « Tous », « Favoris » et « Audio »).
4. **Given** l'onglet « Bouquets en cours » de la bibliothèque, **When** l'utilisateur l'affiche, **Then** il visualise tous les livres accessibles via son bouquet, accompagnés d'un badge indiquant le nom du bouquet et la date d'expiration (ex: « Valable jusqu'au JJ/MM/AAAA »).
5. **Given** une souscription client arrivant à échéance, **When** la date d'expiration est dépassée, **Then** les livres du bouquet ne sont plus accessibles dans la liseuse sécurisée et l'onglet bibliothèque invite l'utilisateur à renouveler son abonnement.

---

### User Story 6 - Supervision Administrative des Clés API et des Abonnements Bouquets (Priority: P3)

En tant qu'administrateur de la plateforme LAHAThèque,
Je souhaite retrouver l'application partenaire créée pour l'université cliente dans `/admin/api`, et suivre l'historique complet des abonnements pour chaque bouquet sur `/admin/catalog/bouquets`,
Afin d'assurer le support, la supervision technique et la gestion du cycle de vie des accès (renouvellement, révocation, rotation).

**Why this priority**: Garantit à l'administrateur une visibilité à 360 degrés sur les clés API actives et les échéances de tous les souscripteurs.

**Independent Test**: Peut être testé en naviguant sur `/admin/api` pour vérifier la présence de l'application partenaire de l'université cliente avec son badge VIP et sa restriction de bouquet, et sur `/admin/catalog/bouquets` pour consulter le tiroir de suivi des abonnés par bouquet.

**Acceptance Scenarios**:

1. **Given** une souscription institutionnelle finalisée, **When** l'administrateur consulte `/admin/api`, **Then** l'application partenaire de l'université cliente y figure avec son nom, son palier VIP, son mode Catalogue Seul, son bouquet restreint et son statut actif.
2. **Given** la page `/admin/catalog/bouquets`, **When** l'administrateur clique sur l'indicateur d'abonnements d'un bouquet, **Then** une vue détaillée liste l'ensemble des souscriptions actives et échues (nom de l'établissement ou de l'utilisateur, formule mensuelle/annuelle, date de début, date d'expiration, montant payé, statut).

---

### Edge Cases

- Que se passe-t-il si un bouquet est souscrit en formule mensuelle et que l'université souhaite basculer en annuel avant la fin des 30 jours ?
  La nouvelle souscription annuelle est cumulée en prolongeant l'échéance de 365 jours supplémentaires à compter de la date d'expiration actuelle.
- Que se passe-t-il si un utilisateur tente de sélectionner le type « Intégral Université » sans choisir d'établissement ?
  La validation du formulaire bloque immédiatement la soumission avec un message explicite « Veuillez sélectionner une université ».
- Que se passe-t-il si une université sélectionnée dans « Intégral Université » ne possède aucun livre publié ?
  Le décompte en direct affiche « 0 livre » et un message d'avertissement informe l'administrateur que le bouquet ne contiendra aucun livre tant que des ouvrages ne seront pas publiés pour cet établissement.
- Que se passe-t-il si la liseuse est ouverte par un étudiant ou un lecteur individuel alors que l'abonnement expire pendant la session de lecture ?
  La session en cours reste active jusqu'à la fin de la durée éphémère du token (maximum 2 heures), mais toute nouvelle session est bloquée par l'API avec une erreur 403 signalant l'expiration du bouquet.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Administration & Modélisation des Bouquets
- **FR-001**: Le système DOIT supprimer définitivement le type de bouquet « Par Faculté » (`faculty`) des options de création, de modification et des filtres de recherche.
- **FR-002**: Pour le type de bouquet « Intégral Université » (`university`), le système DOIT rendre la sélection d'un établissement partenaire (`target_institution`) strictement obligatoire.
- **FR-003**: Lors de la sélection d'une université pour un bouquet « Intégral Université », le système DOIT calculer et afficher en temps réel le nombre exact de livres publiés rattachés à cette université.
- **FR-004**: Le système DOIT proposer un bouton « Voir le détail des livres » permettant d'ouvrir un composant scrollable affichant la liste complète des ouvrages de l'université sélectionnée avec leur couverture (`cover_url`), titre, auteurs et discipline.
- **FR-005**: Le modèle de bouquet et ses formulaires DOIVENT intégrer deux tarifs distincts obligatoires : le « Tarif Mensuel » (`monthly_price`) et le « Tarif Annuel » (`annual_price`) en Francs CFA (XOF).
- **FR-006**: La table de données des bouquets sur `/admin/catalog/bouquets` DOIT afficher une colonne dédiée « Tarif Mensuel » à côté de la colonne « Tarif Annuel ».
- **FR-007**: Le système DOIT fournir sur `/admin/catalog/bouquets` un volet ou tiroir de suivi des abonnements par bouquet affichant les souscripteurs, leur formule (mensuelle ou annuelle), leur date d'expiration et leur statut.

#### Souscription Institutionnelle & Clés API (Universités Clientes)
- **FR-008**: Le système DOIT permettre aux universités clientes de choisir entre la formule « Mensuelle » (validité 30 jours) et « Annuelle » (validité 365 jours) lors de la souscription d'un bouquet documentaire.
- **FR-009**: Le système DOIT initialiser le paiement Moneroo avec le montant correspondant à la formule choisie (tarif mensuel ou annuel) en Francs CFA (XOF).
- **FR-010**: Le système DOIT activer la souscription de l'université cliente dès réception de la confirmation du paiement par webhook ou réconciliation. Si l'université ne possède pas encore d'application partenaire, le système DOIT la créer automatiquement ; si elle en possède déjà une, le système DOIT étendre son périmètre au nouveau bouquet souscrit en conservant strictement le même `client_id` et le même `client_secret`.
- **FR-011**: L'application partenaire de l'université cliente DOIT porter le nom de l'université, être configurée en mode Catalogue Seul (`catalog_only`), couvrir automatiquement l'ensemble de ses bouquets actifs souscrits, être au palier VIP Illimité (sans quota limite), et NE DOIT PAS exiger d'URL de retour.
- **FR-012**: Le système DOIT rediriger l'université vers une page de succès post-paiement affichant la formule, la date d'expiration exacte (à J+30 pour un mensuel, J+365 pour un annuel), le `client_id` et le `client_secret` en clair pour la première et unique fois.
- **FR-013**: La page de succès DOIT proposer des boutons de copie en un clic, de téléchargement du fichier texte sécurisé d'identifiants (format `.txt` structuré avec date d'expiration, URL de base API et variables `.env` `LAHATHEQUE_CLIENT_ID` et `LAHATHEQUE_CLIENT_SECRET`), et de téléchargement du Guide d'Implémentation officiel au format PDF.
- **FR-014**: Le Guide d'Implémentation PDF DOIT être généré à partir de `GUIDE_INTEGRATION_CATALOGUE_SEUL.md` avec la charte officielle LAHAThèque (logo vectoriel, palette Navy et Or, typographie Playfair Display et Poppins, exemples de code multi-langages et matrice d'erreurs).
- **FR-015**: Le système DOIT appliquer un filtrage granulaire par bouquet sur la clé API : les livres d'un bouquet donné deviennent inaccessibles dès l'échéance de ce bouquet spécifique. La clé API de l'université cliente n'est révoquée ou totalement désactivée que si l'ensemble de ses bouquets souscrits sont arrivés à expiration sans renouvellement.

#### Notifications & Facturation
- **FR-016**: Le système DOIT générer une facture PDF acquittée dès la confirmation du paiement, mentionnant la formule (Mensuelle ou Annuelle), le montant réglé et la date exacte d'expiration.
- **FR-017**: Le système DOIT envoyer un email de confirmation au contact de l'université avec la facture PDF acquittée en pièce jointe, mentionnant expressément la date d'expiration des accès.
- **FR-018**: Le système DOIT envoyer un email d'alerte à l'administrateur LAHAThèque précisant le nom de l'université, le bouquet, la formule et la date d'expiration.
- **FR-019**: Le système DOIT enregistrer la transaction financière dans les écritures comptables pour alimentation des tableaux de bord de gestion des finances.
- **FR-020**: Le système DOIT programmer et envoyer des emails de rappel préventifs avant l'échéance (à J-7 pour la formule annuelle et à J-3 pour la formule mensuelle) tant aux universités clientes qu'aux lecteurs individuels, avec le décompte des jours restants et un lien direct vers le paiement de renouvellement.

#### Espace Client / Lecteur (B2C)
- **FR-021**: Le système DOIT fournir aux clients lecteurs individuels sur `/student/bouquets` une interface pour souscrire aux bouquets documentaires en formule mensuelle ou annuelle avec paiement Moneroo.
- **FR-022**: La souscription d'un client lecteur NE DOIT GÉNÉRER AUCUNE CLÉ API, mais DOIT activer l'accès aux livres du bouquet dans son espace lecteur personnel pour la durée souscrite (30 ou 365 jours).
- **FR-023**: La bibliothèque de l'étudiant/lecteur (`/student/books`) DOIT séparer de manière étanche les « Livres achetés » (licences individuelles de 12 mois à compter de leur achat) et l'onglet dédié « Bouquets en cours » (ouvrages inclus dans ses bouquets actifs avec mention du bouquet et de la date d'expiration de l'accès).
- **FR-024**: L'achat individuel d'un livre numérique confère une durée d'accès souveraine de 12 mois qui ne peut en aucun cas être écourtée par l'expiration d'un bouquet documentaire contenant ce même titre. Si un lecteur achète un livre présent dans son bouquet actif, cet ouvrage acquiert sa propre licence autonome de 12 mois dans son espace des livres achetés.
- **FR-025**: À l'expiration de la souscription client, l'accès de lecture sécurisée aux seuls livres du bouquet expiré DOIT être automatiquement désactivé, sans impacter les livres achetés individuellement.

#### Règles de Design & Qualité
- **FR-026**: L'ensemble des composants UI créés ou modifiés DOIVENT respecter strictement l'approche Mobile-First, la palette sémantique du projet (`bg-navy`, `bg-gold`, `border-border`, etc.) sans AUCUN code hexadécimal en dur, et proscrire rigoureusement tout émoji au profit d'icônes vectorielles Lucide React.

---

### Key Entities

- **Offre de Bouquet Documentaire (BouquetOffering)** : Offre documentaire thématique comportant titre, type (`general`, `discipline`, `university`, `country`, `custom`), établissement cible (`target_institution`), `monthly_price`, `annual_price` et statut actif.
- **Souscription Institutionnelle (UniversityBouquetSubscription)** : Abonnement liant une université cliente à un bouquet pour une période (`period`: `monthly` ou `annual`), avec dates de début et d'expiration (`end_date`), liée à l'application partenaire (`PartnerApp`) et à la transaction de paiement.
- **Souscription Client / Lecteur (ClientBouquetSubscription)** : Abonnement liant un utilisateur individuel à un bouquet pour une période (`monthly` ou `annual`), avec dates de début et d'expiration (`end_date`), ouvrant l'accès direct aux ouvrages dans sa bibliothèque personnelle.
- **Application Partenaire (PartnerApp)** : Clé API machine-to-machine (`client_id`, hash de `client_secret`) configurée en Catalogue Seul, restreinte au bouquet souscrit et dotée du palier VIP Illimité.
- **Transaction de Paiement (PaymentTransaction)** : Enregistrement monétaire Moneroo comprenant le montant, la devise (XOF), la formule choisie, l'identifiant passerelle et le statut.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 % des offres de bouquets créées ou modifiées disposent d'un Tarif Mensuel et d'un Tarif Annuel valides en Francs CFA.
- **SC-002**: Dans la modale de création, le décompte réel des livres d'une université s'affiche en moins de 500 millisecondes après la sélection de l'établissement.
- **SC-003**: 100 % des souscriptions (universités clientes ou clients particuliers) permettent le choix entre la formule mensuelle (30 jours) et annuelle (365 jours) avec calcul exact de la date d'échéance.
- **SC-004**: Pour toute souscription université cliente, l'application partenaire est créée automatiquement avec le mode Catalogue Seul, la restriction au bouquet et le palier VIP Illimité, et ses identifiants sont affichés sur la page de succès en moins de 2 secondes après validation du paiement.
- **SC-005**: 100 % des souscriptions clients particuliers injectent instantanément les ouvrages du bouquet dans l'onglet « Bouquets en cours » de leur bibliothèque sans aucune délivrance de clé API.
- **SC-006**: La date exacte d'expiration figure sur 100 % des factures PDF acquittées, des emails envoyés aux souscripteurs et des alertes adressées à l'administrateur.
- **SC-007**: 100 % des accès (clés API pour universités et sessions lecteur pour clients particuliers) sont coupés immédiatement à l'expiration de la souscription si aucun renouvellement n'est intervenu.
- **SC-008**: Zéro code couleur hexadécimal en dur et zéro émoji dans l'ensemble des écrans et composants du flux.
- **SC-009**: Tous les écrans sont 100 % responsive et opérationnels sur mobile dès 375 pixels de large sans défilement horizontal.

---

## Assumptions

- **Paiement Moneroo** : La passerelle Moneroo prend en charge les paiements mensuels et annuels ponctuels en Francs CFA (XOF). Le renouvellement à échéance s'effectue par notification de relance invitant l'utilisateur à réitérer un paiement.
- **Calcul Dynamique** : Le nombre d'ouvrages pour le type « Intégral Université » s'appuie sur le champ `institution` du modèle `Ouvrage` avec statut `published`.
- **Génération PDF** : Le moteur de génération PDF de la plateforme compile fidèlement le guide d'intégration depuis `GUIDE_INTEGRATION_CATALOGUE_SEUL.md` et les factures avec les polices Google Fonts et le logo officiel vectoriel.
- **Bibliothèque Étudiant** : L'accès aux ouvrages des bouquets actifs pour un client particulier est garanti par le service de contrôle des droits (`access_service.py`) qui interroge déjà `ClientBouquetSubscription` actif.
