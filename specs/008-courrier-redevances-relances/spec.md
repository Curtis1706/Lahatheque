# Spécification Fonctionnelle : Gestion et Émission des Courriers Officiels de Redevances et Relances

**Feature Branch** : `008-courrier-redevances-relances`

**Created** : 2026-09-17

**Status** : Validated

**Input** : Description utilisateur : "Génération de courrier et email type avec gabarit papier à en-tête LAHAThèque pour les redevances et relances, remplacement de l'action 'Envoyer relevé' par 'Préparer le courrier', page dédiée de gestion des courriers sous forme de DataTable, cycle de vie brouillon / validé / annulé / envoyé, prévisualisation PDF dans le navigateur, modale d'édition contextuelle, validation figeant le PDF officiel et envoi par email avec pièce jointe."

## Clarifications

### Session 2026-09-17

- Q: Quel contenu doit figurer dans le corps de l'e-mail envoyé au destinataire lors de l'action "Envoyer par mail" ? → A: Option A (Le corps de l'e-mail reprend l'intégralité du texte rédigé et joint le PDF officiel à en-tête en pièce jointe).
- Q: Comment la page dédiée "Gestion des courriers de redevances / relances" doit-elle être intégrée dans la navigation du tableau de bord juriste ? → A: Option B (Accès exclusif par redirection lors du clic sur "Préparer le courrier", avec un fil d'Ariane permettant le retour contextuel immédiat vers la page d'origine).
- Q: Que doit devenir le bouton global d'en-tête "Expédier les Relevés de la Période" actuellement présent sur la page des relances ? → A: Option A (Transformer le bouton en "Préparer les courriers de la période" pour générer en lot les brouillons correspondants et rediriger vers la table de gestion des courriers).
- Q: Dans la modale "Corriger" d'un courrier en brouillon, quels champs spécifiques l'utilisateur peut-il modifier ? → A: Option A (Modification libre de l'Objet et du Corps du texte uniquement ; destinataire, email officiel, montants calculés et période verrouillés en lecture seule).
- Q: Lors de l'action "Annuler" sur un courrier, la saisie d'un motif d'annulation doit-elle être obligatoire ou facultative ? → A: Option C (Confirmation simple par modale d'avertissement sans saisie de motif textuel quel que soit le statut d'origine).

## User Scenarios & Testing *(mandatory)*


### User Story 1 - Préparation d'un courrier officiel depuis les redevances ou relances (Priority: P1)

En tant que juriste ou gestionnaire financier, lorsque j'examine les redevances d'un ayant-droit (université, éditeur partenaire, auteur) ou un dossier de relance d'impayé, je souhaite pouvoir cliquer sur "Préparer le courrier" pour initialiser un courrier officiel pré-rempli et être redirigé vers l'interface centrale de gestion des courriers.

**Why this priority** : Constitue le point d'entrée métier remplaçant l'ancien envoi direct non tracé. Il garantit que chaque communication financière ou juridique fait l'objet d'une préparation documentée et contrôlée avant tout départ.

**Independent Test** : Depuis la table des redevances universités, éditeurs ou la table des relances d'auteurs/créances, cliquer sur "Préparer le courrier" sur une ligne donnée. Le système initialise un nouveau courrier au statut "Brouillon" avec les variables du destinataire et redirige vers la page de gestion des courriers où ce nouveau document apparaît en tête de liste.

**Acceptance Scenarios** :

1. **Given** un gestionnaire sur la page de suivi des redevances ou des relances, **When** il clique sur "Préparer le courrier" pour un destinataire sélectionné (auteur, université ou éditeur partenaire), **Then** le système initialise un courrier à l'état "Brouillon" avec le texte type pré-rempli (période, montants, coordonnées) et redirige l'utilisateur vers la page "Gestion des courriers de redevances / relances".
2. **Given** un courrier déjà préparé en brouillon pour la même période et le même destinataire, **When** l'utilisateur clique à nouveau sur "Préparer le courrier", **Then** le système propose soit de reprendre le brouillon existant, soit d'en créer un nouveau horodaté distinct.

---

### User Story 2 - Consultation de l'historique et prévisualisation PDF dans le navigateur (Priority: P1)

En tant que gestionnaire, je souhaite consulter la liste centralisée de tous les courriers émis et en cours de traitement via une table de données, et pouvoir ouvrir à tout moment le PDF généré directement dans un nouvel onglet du navigateur.

**Why this priority** : Permet le contrôle visuel rigoureux du document final conforme à la charte graphique de la maison d'édition (logo, en-tête officiel, pied de page institutionnel) avant toute diffusion externe.

**Independent Test** : Sur la page de gestion des courriers, cliquer sur l'action "PDF" d'une ligne de courrier (qu'elle soit en statut "Brouillon" ou "Validé"). Le document PDF s'ouvre immédiatement dans le navigateur et affiche l'en-tête officiel LAHAThèque, le corps du message et le pied de page institutionnel.

**Acceptance Scenarios** :

1. **Given** un courrier au statut "Brouillon", **When** l'utilisateur clique sur l'action "PDF", **Then** le navigateur affiche le rendu du document intégrant le gabarit institutionnel et le texte brut ou personnalisé du brouillon en cours.
2. **Given** un courrier au statut "Validé" ou "Envoyé", **When** l'utilisateur clique sur l'action "PDF", **Then** le document PDF figé et certifié lors de la validation s'ouvre à l'identique dans le navigateur.

---

### User Story 3 - Personnalisation contextuelle du texte du courrier via modale (Priority: P2)

En tant que juriste, je souhaite pouvoir adapter ou corriger le message type d'un courrier spécifique via une modale dédiée, sans que cela n'altère le modèle global utilisé pour les autres courriers.

**Why this priority** : Chaque dossier financier ou de relance peut nécessiter des précisions contextuelles, un ton adapté (relance amiable vs mise en demeure), ou des détails contractuels singuliers.

**Independent Test** : Sur une ligne de courrier en statut "Brouillon", cliquer sur l'action "Corriger". Une modale s'ouvre avec le texte actuel du courrier. Modifier le corps du message et enregistrer. Le statut reste "Brouillon", la liste est actualisée, et la prévisualisation PDF reflète instantanément le texte corrigé.

**Acceptance Scenarios** :

1. **Given** un courrier au statut "Brouillon", **When** l'utilisateur clique sur "Corriger", **Then** une modale s'affiche avec les métadonnées de référence en lecture seule (nom du destinataire, email officiel, période, montant calculé) et les champs éditables (objet du courrier, corps du message) pré-remplis avec la version courante.
2. **Given** les modifications apportées dans la modale, **When** l'utilisateur enregistre, **Then** les modifications sont sauvegardées en brouillon pour ce courrier précis, la modale se ferme, et le prochain aperçu PDF intègre ces corrections.
3. **Given** un courrier déjà "Validé" ou "Envoyé", **When** la ligne est affichée dans la table, **Then** l'action "Corriger" n'est plus accessible (verrouillage définitif du contenu).

---

### User Story 4 - Validation formelle et figeage du PDF officiel (Priority: P2)

En tant que juriste, lorsque le contenu du courrier est vérifié et conforme, je souhaite déclencher l'action "Valider" pour verrouiller définitivement le texte, générer le document PDF certifié et débloquer l'envoi par email.

**Why this priority** : Assure l'intégrité juridique du document. Dès la validation, le contenu ne peut plus être modifié, prévenant toute incohérence entre ce qui a été approuvé et ce qui sera expédié.

**Independent Test** : Cliquer sur l'action "Valider" d'un courrier en brouillon. Le système demande confirmation. Une fois confirmée, le statut passe à "Validé", le PDF définitif est scellé, les actions "Corriger" et "Valider" disparaissent, et la seule action active devient "Envoyer par email" (avec option "Annuler").

**Acceptance Scenarios** :

1. **Given** un courrier en statut "Brouillon", **When** l'utilisateur clique sur "Valider" et confirme son choix, **Then** le statut devient "Validé", le contenu textuel devient strictement immuable, et le document PDF final scellé est généré.
2. **Given** un courrier nouvellement "Validé", **When** la ligne s'actualise dans la table, **Then** l'action "Envoyer par email" devient visible et activée, tandis que l'action "Corriger" est retirée.

---

### User Story 5 - Envoi certifié par email avec le PDF officiel en pièce jointe (Priority: P2)

En tant que gestionnaire, je souhaite déclencher l'envoi du courrier validé au destinataire par courrier électronique en un clic, le PDF officiel étant joint automatiquement au message.

**Why this priority** : Finalise le processus d'expédition vers le partenaire (université, éditeur, auteur), garantissant la transmission du document dans un format non modifiable et professionnel.

**Independent Test** : Sur un courrier en statut "Validé", cliquer sur "Envoyer par email". Après confirmation, le système transmet l'email avec le PDF en pièce jointe à l'adresse officielle du destinataire. Le statut passe à "Envoyé", avec horodatage et consignation dans l'historique.

**Acceptance Scenarios** :

1. **Given** un courrier au statut "Validé", **When** l'utilisateur clique sur "Envoyer par email" et valide l'expédition, **Then** le système transmet le message électronique dont le corps reprend l'intégralité du texte validé du courrier, avec la pièce jointe PDF scellée au destinataire, passe le statut à "Envoyé", consigne l'horodatage d'expédition et notifie le succès à l'utilisateur.
2. **Given** un courrier au statut "Envoyé", **When** la table est affichée, **Then** aucune action d'annulation ou de modification n'est permise ; seules les actions de consultation (voir PDF, voir détails d'envoi) restent accessibles.

---

### User Story 6 - Annulation et traçabilité d'un courrier (Priority: P3)

En tant que juriste, si une erreur est constatée ou si la situation a évolué, je souhaite pouvoir annuler un courrier en statut "Brouillon" ou "Validé" (avant expédition), tout en conservant une trace d'audit.

**Why this priority** : Permet la gestion des imprévus administratifs tout en garantissant la conformité légale et l'historisation des démarches entreprises.

**Independent Test** : Cliquer sur "Annuler" sur un courrier "Brouillon" ou "Validé". Valider la modale d'avertissement simple. Le statut passe à "Annulé" et reste archivé dans la table avec un badge distinctif.

**Acceptance Scenarios** :

1. **Given** un courrier en statut "Brouillon" ou "Validé", **When** l'utilisateur déclenche l'action "Annuler" et confirme dans la boîte d'avertissement (sans saisie textuelle requise), **Then** le statut passe à "Annulé", le document est neutralisé et ne peut plus être validé ni envoyé.
2. **Given** un courrier au statut "Envoyé", **When** l'utilisateur consulte la ligne, **Then** l'action "Annuler" n'est pas disponible (un courrier envoyé ne peut être dé-expédié).

---

### Edge Cases

- **Destinataire sans adresse email valide** : Le système signale l'anomalie dès la tentative de validation ou d'envoi et invite à compléter les coordonnées du destinataire.
- **Corps de texte exceptionnellement long** : Si le texte rédigé dépasse la première page, le système gère la pagination dynamique tout en préservant l'en-tête sur la première page et le pied de page institutionnel sur toutes les pages.
- **Caractères spéciaux et montants monétaires** : Le rendu PDF supporte la devise officielle FCFA, les montants formatés, les accents et les caractères typographiques sans artefact d'affichage.
- **Échec temporaire de transmission d'email** : Si le serveur de messagerie est indisponible lors de l'envoi, le courrier reste au statut "Validé" avec notification explicite de l'incident, permettant une nouvelle tentative d'expédition sans régénération du PDF.
- **Tentatives simultanées de modification** : Si deux gestionnaires ouvrent la modale de correction d'un même brouillon, le premier enregistrement fait foi et le second utilisateur est averti de la mise à jour concurrente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** : Le système DOIT remplacer l'action d'envoi direct de relevé par l'action "Préparer le courrier" sur chaque ligne des écrans de redevances (universités, éditeurs tiers) et de relances (créances, auteurs), ainsi que remplacer le bouton global d'expédition de la période par "Préparer les courriers de la période".
- **FR-002** : Le système DOIT initialiser automatiquement une fiche de courrier pré-remplie (ou un lot de courriers lors de l'action de période) lorsqu'un utilisateur clique sur "Préparer le courrier", et rediriger vers la page dédiée "Gestion des courriers de redevances / relances" dotée d'un fil d'Ariane (breadcrumb) permettant de revenir à la vue d'origine (Redevances ou Relances).
- **FR-003** : Le système DOIT présenter une table de données (DataTable) récapitulant tous les courriers émis et en cours, avec filtres par statut, type de destinataire, date et champ de recherche textuel.
- **FR-004** : Le système DOIT gérer quatre statuts mutuellement exclusifs pour chaque courrier : "Brouillon", "Validé", "Annulé", "Envoyé".
- **FR-005** : Le système DOIT permettre l'ouverture et la visualisation immédiate du document PDF dans un nouvel onglet du navigateur via l'action "PDF", que le document soit au statut "Brouillon", "Validé" ou "Envoyé".
- **FR-006** : Le système DOIT appliquer fidèlement le gabarit papier à en-tête institutionnel LAHAThèque (logo officiel et devise en en-tête, coordonnées institutionnelles en pied de page) sur tous les PDF générés.
- **FR-007** : Le système DOIT proposer par défaut un modèle textuel adapté au contexte (redevances d'auteurs, redevances universités, relevé éditeur tiers, relance d'impayé amiable ou formelle).
- **FR-008** : Le système DOIT permettre la personnalisation du texte du courrier via une modale contextuelle d'édition ("Corriger"), accessible exclusivement lorsque le courrier est au statut "Brouillon", restreignant la modification à l'objet et au corps du message tout en maintenant les métadonnées et montants calculés en lecture seule.
- **FR-009** : Les corrections apportées dans la modale d'édition DOIVENT s'appliquer uniquement au courrier sélectionné, sans altérer les modèles de courriers globaux ou les courriers d'autres destinataires.
- **FR-010** : L'action "Valider" DOIT figer irrévocablement le texte du courrier, générer le document PDF final définitif, et faire passer le statut à "Validé".
- **FR-011** : Dès le statut "Validé", la table DOIT afficher l'action "Envoyer par email" comme action principale, tout en retirant l'action "Corriger".
- **FR-012** : L'action "Envoyer par email" DOIT expédier un email reprenant l'intégralité du texte rédigé dans son corps avec le document PDF scellé en pièce jointe à l'adresse du destinataire, et mettre à jour le statut du courrier vers "Envoyé" avec horodatage précis.
- **FR-013** : L'action "Annuler" DOIT être accessible pour les courriers aux statuts "Brouillon" et "Validé" via une confirmation explicite simple sans obligation de saisie de motif textuel, et DOIT être formellement proscrite pour tout courrier au statut "Envoyé".

- **FR-014** : Les courriers annulés DOIVENT demeurer consultables dans l'historique de la table à des fins d'audit légal et de traçabilité.
- **FR-015** : Toute action sensible (validation, envoi d'email, annulation) DOIT faire l'objet d'une modale de confirmation explicite avant exécution.

### Key Entities *(include if feature involves data)*

- **CourrierOfficiel** : Représente l'instance unique d'un courrier administratif ou financier.
  - *Attributs principaux* : identifiant unique, type de catégorie (redevance auteur, redevance université, redevance éditeur tiers, relance impayé), référence du dossier concerné, identifiant et coordonnées du destinataire (nom, qualité, adresse email), objet du courrier, corps du texte rédigé, statut du cycle de vie (brouillon, validé, annulé, envoyé), document PDF généré (brouillon dynamique ou version scellée finale), date de création, date de validation, date d'expédition, date d'annulation, identifiant de l'agent créateur.
- **ModeleCourrierType** : Représente la matrice textuelle type pré-configurée par catégorie de courrier servant de canevas initial lors de la préparation.
  - *Attributs principaux* : identifiant, catégorie métier associée, objet par défaut, corps type avec variables de substitution (nom du destinataire, période de calcul, montant total des redevances ou de la créance due, date limite de paiement).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** : 100 % des courriers émis intègrent sans distorsion l'en-tête officiel et le pied de page de la charte LAHAThèque.
- **SC-002** : Le temps nécessaire pour préparer, personnaliser et prévisualiser un courrier officiel ne dépasse pas 60 secondes pour un utilisateur standard.
- **SC-003** : 100 % des courriers validés sont scellés et infalsifiables (aucun texte modifiable après validation).
- **SC-004** : 100 % des envois d'email comportent en pièce jointe le document PDF scellé conforme au texte validé.
- **SC-005** : Zéro incident de régression ou d'envoi non désiré grâce au passage obligatoire par l'étape de validation et de confirmation explicite.
- **SC-006** : La consultation du PDF dans le navigateur s'ouvre en moins de 1,5 seconde à partir du clic sur l'action "PDF".

## Assumptions

- Le gabarit officiel fourni par LAHA Éditions au format PDF (`Lahatheque-PapierEntete-SansNumero.pdf`) situé dans les ressources statiques sert de référence visuelle absolue pour les dimensions, marges, logo et pied de page.
- Les destinataires (auteurs, représentants d'universités, partenaires éditeurs) disposent d'une adresse email valide renseignée dans leur fiche de compte ou contrat respectif.
- La plateforme dispose d'un service d'expédition d'emails transactionnels opérationnel capable d'attacher des pièces jointes PDF.
- Les droits d'accès à la préparation, modification, validation et expédition des courriers sont réservés aux profils habilités (juristes, administrateurs et gestionnaires financiers).
- L'annulation d'un courrier validé n'efface pas la ligne de la base de données mais archive son statut pour préserver l'historique juridique des échanges.
