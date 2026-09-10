# Feature Specification: Formulaire Contact B2B & Tunnel d'Achat E-commerce

**Feature Branch**: `006-contact-b2b-checkout-flow`

**Created**: 2026-09-10

**Status**: Draft

**Input**: User description: "ici là (voir capture) pour les roles c'est celles en bd qu'on doit renvoyer non, mais juste université, éditeur, grossiste, aussi ou bien ? aussi pour nature de vos besoins là à part ce qu'ils ont comme prestation, il doit avoir la case autre, ou, y a demande de partenariat ou des trucs comme pouvoiir commander en gros et etc non , je propose même d'utiliser un combobox aussi ça doit marcher, ceux qui recevront le mail seraient lahaeditions1@gmail.com firinzegbenitodossou@gmail.com et alhtd7@gmail.com y aussi ça a faire puis sur les commandes sur la page catalogue public ou par le chariow etc là à un moment donné ça va demander de créer un compte non espace client et tout, en fait on doit suivre la norme de tus les sites ecommerce et tout, en bref ce qui se fait sur le marché /speckit-specify"

---

## Clarifications

### Session 2026-09-10
- Q: Quelle est l'adresse email exacte du 3ème administrateur pour la réception des alertes internes ? → A: `alhtdharry7@gmail.com` (correction de la faute de frappe initiale `alhtd7@gmail.com`).
- Q: Comment l'étape d'identification client doit-elle s'afficher au checkout et comment sont traités les différents formats ? → A: Option A (Panneau intégré direct sur `/checkout` avec 2 onglets "Connexion" et "Inscription", panier récapitulatif visible en continu). Les informations de livraison papier sont sauvegardées dans `PhysicalDelivery` et notifient la logistique, tandis que les formats numériques et audio sont immédiatement déverrouillés dans `ReadingProgress` pour la bibliothèque du client (`/student/books`).
- Q: Comment le demandeur doit-il préciser son besoin lorsqu'il coche l'option "Autre" ? → A: Option B (Aucun champ d'input supplémentaire ; un court texte d'aide invite simplement l'utilisateur à expliciter son besoin dans la zone "Message complémentaire" en bas de formulaire, garantissant une interface épurée).
- Q: Quelles pages de catalogue doivent intégrer le filtre par format (Livre numérique, Livre papier, Livre audio) ? → A: Rendre le filtrage par format (numérique, audio, papier) 100% fonctionnel sur le catalogue public (`/catalog`), et intégrer le filtre de format sur l'ensemble des pages catalogues des dashboards (`/student/catalog`, etc.).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Formulaire de Contact B2B, Partenariats & Commandes en Gros (Priority: P1)

En tant que représentant d'une université, d'une maison d'édition, d'un grossiste, ou auteur potentiel,  
Je veux soumettre une demande de contact claire en choisissant mon profil institutionnel/professionnel et la nature précise de mes besoins (partenariat, achat en gros, prestations, autre),  
Afin que l'équipe dirigeante de LAHAThèque reçoive instantanément ma demande sur les boîtes e-mails désignées et que je reçoive un accusé de réception formel.

**Why this priority**: C'est le point d'entrée commercial et institutionnel B2B majeur de LAHAThèque. La liste actuelle de profils et de besoins est obsolète et ne permet pas aux universités ou grossistes d'adresser des commandes groupées ou des partenariats. Les e-mails de notification doivent impérativement toucher les trois décideurs du projet.

**Independent Test**:  
Peut être testé de bout en bout en ouvrant `/contact`, en sélectionnant le profil "Université" ou "Grossiste", en sélectionnant les besoins "Demande de partenariat" et "Commande en gros", puis en validant. Le test vérifie que l'enregistrement se fait en base de données et que les 3 e-mails sont bien expédiés à `lahaeditions1@gmail.com`, `firinzegbenitodossou@gmail.com` et `alhtdharry7@gmail.com`.

**Acceptance Scenarios**:

1. **Scénario 1.1 (Profils alignés BD)** :  
   **Given** un visiteur sur la page `/contact`,  
   **When** il clique sur le sélecteur "Profil du demandeur",  
   **Then** il voit uniquement les profils pertinents issus de la base de données :  
   - "Université / Établissement Partenaire" (`university`)  
   - "Éditeur Tiers / Maison d'édition" (`publisher`)  
   - "Grossiste / Distributeur" (`wholesaler`)  
   - "Auteur" (`author`)  
   - "Autre" (`other`).

2. **Scénario 1.2 (Sélecteur / Combobox enrichi des besoins - Option B)** :  
   **Given** un visiteur ayant sélectionné son profil,  
   **When** il sélectionne la nature de ses besoins,  
   **Then** il peut choisir parmi :  
   - "Demande de partenariat institutionnel"  
   - "Commande en gros (gros volumes)"  
   - "Intégration API & Catalogue"  
   - Les prestations éditoriales (Impression, Sécurisation, Analyse comité, Montage éditorial, Diffusion internationale, Distribution internationale, Production livres audio, Illustrations, Logiciel anti-plagiat)  
   - "Autre".  
   **And** si "Autre" est coché, un message d'aide invite le visiteur à détailler sa demande spécifique dans le champ "Message complémentaire" sans ajouter de champ superflu.

3. **Scénario 1.3 (Notification aux 3 adresses e-mails obligatoires)** :  
   **Given** le formulaire soumis avec succès,  
   **When** le backend traite la requête,  
   **Then** une notification détaillée est envoyée à la liste des 3 administrateurs :  
   `lahaeditions1@gmail.com`, `firinzegbenitodossou@gmail.com`, et `alhtdharry7@gmail.com`.  
   **And** un accusé de réception est envoyé à l'adresse e-mail du demandeur.

---

### User Story 2 - Tunnel d'Achat E-commerce & Étape Compte Client (Priority: P1)

En tant qu'acheteur ou lecteur explorant le catalogue public,  
Je veux ajouter des livres numériques, papier ou audio dans mon panier, initier le passage de commande, et si je ne suis pas connecté, pouvoir me connecter ou créer mon compte client directement sur la page sans perdre le contenu de mon panier,  
Afin de finaliser mon règlement et d'accéder instantanément à mes lectures numériques/audio tout en suivant la livraison de mes exemplaires papier.

**Why this priority**: C'est le flux monétaire et de conversion fondamental de la plateforme (norme e-commerce internationale). Bloquer l'utilisateur avec une erreur 401 ou vider son panier anéantit le taux de conversion.

**Independent Test**:  
Peut être testé en naviguant sur `/catalog` en tant qu'invité déconnecté, en ajoutant un livre au panier, en allant sur `/cart` puis `/checkout`. Le panneau d'identification e-commerce direct (Option A) s'affiche sans changer d'URL. Après connexion ou inscription avec OTP, l'utilisateur accède directement au paiement avec son panier intact. Dès la commande payée, les livres numériques/audio apparaissent dans `/student/books` et les livres papier créent un ordre d'expédition traçable dans `/student/orders` et `/manager/delivery`.

**Acceptance Scenarios**:

1. **Scénario 2.1 (Persistance du panier invité)** :  
   **Given** un utilisateur non authentifié,  
   **When** il ajoute un livre numérique, papier ou audio depuis `/catalog` ou `/catalog/[id]`,  
   **Then** son panier se met à jour et persiste dans son navigateur même s'il recharge la page ou change d'onglet.

2. **Scénario 2.2 (Identification intégrée directe sur `/checkout` - Option A)** :  
   **Given** un utilisateur non authentifié arrivant sur `/checkout` avec un panier non vide,  
   **When** il arrive sur la page,  
   **Then** le système lui affiche directement dans la zone principale un panneau d'identification à deux onglets :  
   - Onglet 1 : "Déjà client ? Se connecter" (identifiant + mot de passe, sans OTP).  
   - Onglet 2 : "Nouveau client ? Créer mon compte" (nom, email, téléphone, mot de passe, vérification OTP e-mail/SMS rapide, compte créé avec le rôle `student`).  
   **And** le récapitulatif de son panier reste visible à droite en permanence pour le rassurer sur sa commande.

3. **Scénario 2.3 (Reprise immédiate du paiement après identification)** :  
   **Given** l'utilisateur vient de se connecter ou de valider son inscription depuis le tunnel de commande,  
   **When** l'authentification réussit,  
   **Then** l'utilisateur reste sur `/checkout`,  
   **And** son panier est rigoureusement intact avec le total inchangé,  
   **And** le volet "Adresse de livraison & Facturation" s'ouvre automatiquement avec ses coordonnées préremplies.

4. **Scénario 2.4 (Préservation intégrale des informations de livraison papier)** :  
   **Given** un panier comportant au moins un exemplaire papier,  
   **When** l'utilisateur renseigne l'adresse de livraison, la ville, le pays, le numéro de contact et ses disponibilités/créneau,  
   **Then** ces informations sont intégralement sauvegardées dans l'entité de livraison physique (`PhysicalDelivery`),  
   **And** une alerte automatique est générée pour les gestionnaires logistiques (`manager`),  
   **And** le client dispose du suivi d'expédition dans son espace client (`/student/orders`).

5. **Scénario 2.5 (Déverrouillage instantané des formats numériques et audio)** :  
   **Given** une commande réglée avec succès comportant des livres numériques ou audio,  
   **When** le paiement est validé,  
   **Then** les droits d'accès sont immédiatement activés dans sa bibliothèque personnelle (`/student/books`),  
   **And** le livre numérique est directement lisible dans la liseuse FlipBook sécurisée avec filigrane,  
   **And** le livre audio est immédiatement écoutable dans le lecteur streaming intégré,  
   **And** un e-mail de confirmation avec facture officielle acquittée est expédié à l'acheteur.

---

### User Story 3 - Console Logs Granulaires & Observabilité du Tunnel (Priority: P2)

En tant qu'ingénieur support et développeur,  
Je veux que chaque action sur le formulaire de contact et chaque étape du tunnel de commande émette des logs précis et horodatés dans la console du navigateur et les logs serveurs,  
Afin de détecter et résoudre instantanément tout blocage utilisateur.

**Why this priority**: Principe constitutionnel XI et demande explicite de l'utilisateur ("toujours mettre des console logs pour les trucs afin de faciliter plus tard la détection d'un problème de façon précis").

**Independent Test**:  
Ouvrir les DevTools Console lors de la soumission de contact ou du checkout. Vérifier la présence des groupes `[CONTACT FORM]` et `[CHECKOUT FLOW]` avec les statuts, payloads sanitisés, et durées d'exécution en millisecondes.

**Acceptance Scenarios**:

1. **Scénario 3.1** :  
   **Given** une tentative d'envoi du formulaire de contact,  
   **When** le bouton est cliqué,  
   **Then** un log `[CONTACT FORM] Soumission démarrée...` détaille le profil et les besoins, suivi du résultat du serveur.

2. **Scénario 3.2** :  
   **Given** un utilisateur naviguant dans le checkout,  
   **When** il s'identifie ou valide sa commande,  
   **Then** des logs `[CHECKOUT AUTH]` et `[CHECKOUT ORDER]` tracent chaque transition d'état.

---

### Edge Cases

- **Demande de contact avec numéro international complexe** : Le composant `PhoneInput` doit valider le numéro ou permettre la soumission avec l'indicatif sans planter.
- **Panier mixte (numérique + papier) avec utilisateur déconnecté** : L'adresse de livraison n'est demandée que pour les articles papier, une fois l'utilisateur authentifié.
- **Utilisateur s'inscrivant pendant le checkout dont l'e-mail existe déjà** : Le système doit afficher un message explicite invitant à basculer sur "Déjà client ? Se connecter" en conservant son panier.
- **Déconnexion pendant la commande** : Si la session expire pendant le paiement, le panier n'est pas effacé et l'utilisateur est réinvité à se reconnecter.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le sélecteur de profil du formulaire de contact MUST restreindre les choix aux profils officiels de la plateforme : Université / Établissement (`university`), Éditeur Tiers (`publisher`), Grossiste / Distributeur (`wholesaler`), Auteur (`author`), et Autre (`other`).
- **FR-002**: Le sélecteur des besoins du formulaire de contact MUST proposer les options partenariales "Demande de partenariat institutionnel" et "Commande en gros (gros volumes)" aux côtés des prestations éditoriales et de la case "Autre".
- **FR-003**: Lors de la soumission du formulaire de contact, le backend MUST notifier simultanément les trois adresses e-mails désignées : `lahaeditions1@gmail.com`, `firinzegbenitodossou@gmail.com`, et `alhtdharry7@gmail.com`.
- **FR-004**: Le système MUST envoyer un e-mail d'accusé de réception élégant au demandeur avec son identifiant de ticket.
- **FR-005**: Le catalogue public et le panier MUST permettre à un visiteur non authentifié d'ajouter, modifier et supprimer des articles de son panier avec persistance locale.
- **FR-006**: La page de validation de commande (`/checkout`) MUST exiger une authentification client avant la finalisation de la commande sans jamais perdre le contenu du panier.
- **FR-007**: Si un visiteur non authentifié arrive au checkout, le système MUST lui présenter une interface d'identification intégrée ("Se connecter" ou "Créer un compte client rapide").
- **FR-008**: La création de compte client depuis le tunnel de commande MUST attribuer le rôle `student` (Client / Lecteur standard) et connecter automatiquement l'utilisateur à l'issue de la validation OTP sans passer par `/login`.
- **FR-009**: Après identification réussie au checkout, le système MUST préserver l'intégralité du panier et afficher immédiatement l'étape de sélection de paiement et de renseignement de l'adresse de livraison.
- **FR-010**: Les flux de contact et de commande MUST comporter des `console.log` détaillés et balisés (`[CONTACT FORM]`, `[CHECKOUT FLOW]`) pour une observabilité totale.

### Key Entities

- **ContactMessage**: Message reçu via le formulaire de contact, comportant le nom, l'email, le téléphone, le profil (`role`), les besoins sélectionnés, le message et la référence d'accusé de réception.
- **CartItem**: Article présent dans le panier client (ouvrage, format papier ou numérique, quantité, langue sélectionnée, prix unitaire).
- **Order & LigneCommande**: Commande validée rattachée à l'utilisateur authentifié (rôle `student`), avec transaction de paiement et octroi des droits de lecture numériques (`UserBookAccess`) ou livraison physique (`PhysicalDelivery`).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% des soumissions de contact réussies déclenchent la réception de l'e-mail interne sur les 3 boîtes `lahaeditions1@gmail.com`, `firinzegbenitodossou@gmail.com` et `alhtdharry7@gmail.com`.
- **SC-002**: 100% des paniers créés par un visiteur anonyme sont conservés intacts lors de la connexion ou création de compte au checkout (zéro panier perdu).
- **SC-003**: Un nouveau client peut créer son compte et finaliser sa commande en moins de 90 secondes directement depuis le tunnel d'achat.
- **SC-004**: Zéro appel bloqué par une erreur 401 silencieuse sur `/checkout` ; toute absence de session présente l'interface d'identification guidée.
- **SC-005**: 100% des règles d'intégration (tokens sémantiques `navy`/`gold`/`border`, typographie Playfair/Poppins, zéro émoji) sont respectées.

---

## Assumptions

- Les 3 adresses e-mails administratives sont configurées dans les paramètres ou constantes du backend `apps/communications/views.py`.
- Le rôle attribué à un acheteur public particulier est `student` (rôle standard pour les commandes et lectures personnelles).
- Les acheteurs professionnels (Grossistes ou Universités) passent soit par une demande de contact B2B pour convention, soit par leur compte dédié s'ils disposent déjà d'un compte validé par l'administrateur.
