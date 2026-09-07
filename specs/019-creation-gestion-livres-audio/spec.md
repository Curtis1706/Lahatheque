# Feature Specification: Création et Gestion des Livres Audio Multi-Rôles (Studio Audio & Rattachement Catalogue)

**Feature Branch**: `019-creation-gestion-livres-audio`  
**Created**: 2026-09-07  
**Status**: Draft  
**Input**: User description: "regarde comment se passe la création de livre audio sur un de leur site de base, C'est ça on doit suivre. y aura une page gestion de livre audio et une autre création de livre audio, ça va suivre le process, maquettiste, chef maquettiste, juriste, admin aussi aura la gestion et la création de livre audio. maintenant on va adapter aussi l'onglet d'ajout d'audio dans les phases de créations de livre, ou soit on l'enlève, et dans la création de livre audio tu as la possibilité de choisir un livre numérique ou papier et d'y ratacher une version audio, là utilises directement le book cover le titre et toutes les autres infos du livre en question plutôt que d'ajouter couverture et faire tout ça là. les livres audios sront vue aussi sur les catalogues si publiés, extrait et tout, y a une nuance, on peut commander un livre numérique papier pour se faire livrer, un livre audio pour écouter, un livre numérique pour lire, comander l'un et l'autre ou les trois, pas juste l'un ou l'autre. quand j'écoute un livre je dois voir la progression aussi sur la vue d'ensemble non, penser à tout, bien fait, le rattachement et la création"

---

## Clarifications

### Session 2026-09-07

- Q: Comment souhaitez-vous que l'achat et l'accès aux chapitres audio soient accordés à l'apprenant ? → A: Option A - Livre entier débloqué d'un coup. Un tarif unique donne accès à l'ensemble du livre et de ses chapitres dans les deux narrations (voix homme et voix femme). À l'écoute, l'utilisateur dispose d'une liste de lecture pour passer librement d'un chapitre à l'autre. Si les deux voix sont disponibles, il peut basculer entre l'une et l'autre avec la voix masculine activée par défaut. Si une seule voix existe, elle est sélectionnée automatiquement par défaut.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Studio Audio : Création autonome ou Rattachement à un Livre Existant (Priority: P1)

En tant que Maquettiste ou Administrateur, je souhaite créer un livre audio soit à partir de zéro, soit en le rattachant à un livre numérique ou papier existant dans le fonds éditorial LAHAThèque, afin de réutiliser automatiquement sa couverture, son titre, ses auteurs et ses métadonnées sans ressaisie fastidieuse, et d'y téléverser les pistes audio (voix homme, voix femme, livre complet et découpage par chapitres).

**Why this priority**: C'est le cœur fonctionnel du Studio Audio reproduisant fidèlement le modèle éprouvé de LAHA Éditions tout en offrant le rattachement direct aux ouvrages du catalogue LAHAThèque.

**Independent Test**:
- Sélectionner l'option "Rattacher à un ouvrage existant", choisir un livre du catalogue.
- Constater que le titre, l'auteur, la catégorie, le pays et la couverture se pré-remplissent instantanément.
- Téléverser une piste livre complet ou un chapitre pour la voix homme ou voix femme.
- Enregistrer : le livre audio est sauvegardé avec succès avec le statut "En attente de validation".

**Acceptance Scenarios**:
1. **Given** un Maquettiste sur la page "Créer un livre audio", **When** il sélectionne un livre existant "Guide de Droit Civil", **Then** le titre, la couverture officielle, les auteurs et la catégorie sont automatiquement verrouillés sur cet ouvrage, sans exiger de nouvel upload d'image.
2. **Given** un créateur saisissant un livre audio, **When** il dépose un fichier audio complet pour la voix masculine et aucun pour la voix féminine, **Then** le système valide l'enregistrement car une seule piste suffit pour amorcer le livre audio.
3. **Given** un créateur, **When** il ajoute 3 chapitres audio avec leurs libellés respectifs, **Then** les fichiers sont rattachés et ordonnés correctement avec leur durée calculée.

---

### User Story 2 - Workflow de Validation Multi-Rôles : Maquettiste -> Chef Maquettiste -> Juriste -> Admin (Priority: P1)

En tant qu'acteur de la chaîne éditoriale, je souhaite que chaque livre audio suive un workflow strict de validation technique et juridique avant sa mise en ligne publique, avec des interfaces de gestion dédiées pour chaque rôle.

**Why this priority**: Indispensable pour la gouvernance éditoriale de LAHAThèque, garantissant la qualité acoustique des fichiers et la conformité des répartitions de droits d'auteur sur l'audio.

**Independent Test**:
- Le Maquettiste soumet un livre audio.
- Le Chef Maquettiste le consulte dans sa table de gestion, vérifie l'intégrité des pistes audio et valide.
- Le Juriste reçoit le dossier pour validation des quotes-parts audio (`taux_audio_tts`) et valide.
- L'Admin peut à tout moment superviser, modifier, forcer la validation ou publier directement.

**Acceptance Scenarios**:
1. **Given** un livre audio déposé par un Maquettiste, **When** le Chef Maquettiste ouvre son tableau de gestion des livres audio, **Then** il voit le statut "En attente de validation maquette", peut écouter les pistes directement et valider ou demander des corrections avec motif textuel.
2. **Given** un livre audio validé techniquement, **When** le Juriste ouvre son tableau de bord juridique, **Then** il vérifie la conformité du contrat d'exploitation audio et valide le dossier.
3. **Given** un Administrateur, **When** il crée ou valide un livre audio, **Then** il dispose d'un bouton d'approbation et publication immédiate au catalogue.

---

### User Story 3 - Commande Multi-Formats Flexible : Numérique, Papier, Audio ou les Trois (Priority: P2)

En tant qu'étudiant, enseignant ou lecteur académique sur le catalogue, je souhaite pouvoir acheter ou commander sur un même ouvrage n'importe quelle combinaison de formats (papier seul, numérique seul, audio seul, papier + audio, numérique + audio, ou les trois formats réunis), sans être contraint à un choix mutuellement exclusif.

**Why this priority**: Corrige la rigidité des sélecteurs exclusifs radio "soit papier soit numérique", maximisant la conversion et répondant aux besoins réels d'apprentissage mixte (ex: livre papier livré chez soi + livre audio dans les transports).

**Independent Test**:
- Ouvrir la modale d'achat ou le panier sur un ouvrage disposant des 3 formats.
- Cocher à la fois "Livre Papier" et "Livre Audio".
- Valider la commande : le récapitulatif comptabilise le prix papier (avec livraison) et le prix audio, débloquant l'accès d'écoute immédiat pour l'audio et générant l'ordre logistique pour le papier.

**Acceptance Scenarios**:
1. **Given** un livre du catalogue avec prix numérique (3 000 XOF), papier (5 000 XOF) et audio (2 500 XOF), **When** l'utilisateur coche Numérique + Audio, **Then** le total s'élève à 5 500 XOF et les deux licences sont acquises à la confirmation.
2. **Given** un utilisateur ayant acheté la version audio, **When** il consulte le livre sur le catalogue, **Then** le bouton "Écouter" s'affiche directement, tandis que les options Numérique et Papier restent disponibles à l'achat unitaire.

---

### User Story 4 - Vue d'Ensemble & Tableau de Bord Étudiant : Suivi de Progression Audio (Priority: P2)

En tant qu'apprenant écoutant des livres audio, je souhaite voir mes livres audio en cours d'écoute directement sur ma Vue d'ensemble (Dashboard), avec la pochette, le pourcentage d'avancement, le dernier chapitre écouté et un bouton de reprise instantané en 1 clic.

**Why this priority**: Offre une continuité pédagogique sans friction et unifie le suivi des lectures visuelles et sonores.

**Independent Test**:
- Écouter 5 minutes d'un livre audio jusqu'au chapitre 2.
- Se rendre sur la Vue d'ensemble (`/student`).
- Constater la présence du bloc "Mes Écoutes Audio en Cours" affichant le titre, le chapitre en cours, la barre de progression en pourcentage et le bouton "Reprendre l'écoute".
- Cliquer sur "Reprendre l'écoute" : redirection directe vers `/listen/[id]` à la position exacte sauvegardée.

**Acceptance Scenarios**:
### User Story 5 - Catalogue Public : Découverte des Livres Audio & Combinaisons de Formats (Priority: P1)

En tant que visiteur ou lecteur sur le catalogue public (`/catalog`), je souhaite identifier au premier coup d'œil les formats disponibles pour chaque ouvrage (Papier • Numérique • Audio, Papier • Audio, Numérique • Audio, Audio Seul, Numérique Seul, Papier Seul), filtrer par livres audio ou livres audio seuls, écouter un extrait audio gratuit ou feuilleter l'épreuve écrite, et sélectionner librement un ou plusieurs formats à l'achat sur la fiche produit (`/catalog/[id]`).

**Why this priority**: Vitrine commerciale et académique essentielle de LAHAThèque permettant aux utilisateurs externes et non-connectés de découvrir le catalogue audio et de commander exactement le ou les formats souhaités.

**Independent Test**:
- Naviguer sur `/catalog` et filtrer par "Livres audio" ou "Audio seul".
- Constater que les ouvrages filtrés affichent les badges adéquats avec l'icône casque dorée.
- Ouvrir la fiche d'un livre disposant des 3 formats (`/catalog/[id]`).
- Sélectionner "Livre Audio" et "Livre Papier", vérifier que les deux formats s'ajoutent au panier.

**Acceptance Scenarios**:
1. **Given** un livre disponible en version audio seule (sans PDF ni papier), **When** un utilisateur consulte le catalogue public, **Then** la carte affiche le badge "Audio Seul" avec l'icône casque et le bouton "Extrait" lance directement l'écoute audio.
2. **Given** un livre disponible dans les trois formats, **When** l'utilisateur consulte la fiche détaillée, **Then** les trois options (Papier, Numérique, Audio) sont présentées avec leurs prix respectifs et peuvent être cochées ensemble.

---

## Edge Cases

- **Fichier audio corrompu ou format non supporté** : Validation stricte des extensions (`.mp3`, `.m4a`, `.aac`, `.wav`, `.ogg`) et de la taille maximale (500 Mo par fichier) dès la sélection côté navigateur avec feedback immédiat.
- **Rattachement à un ouvrage supprimé ou archivé** : Empêcher le rattachement à des ouvrages dont le statut n'est pas actif ou publié.
- **Ajout progressif des pistes** : Un livre audio peut être créé avec seulement le livre complet voix homme, puis complété ultérieurement par les chapitres voix femme lors d'une session d'édition.
- **Ouvrage sans version numérique (Audio Seul / Pure Audio)** : Possibilité de créer un livre audio "Pure Audio" sans aucun PDF ni livre physique rattaché.
- **Conflit de format lors de la commande** : Si l'utilisateur possède déjà la version numérique mais coche Numérique + Audio, le système désélectionne le numérique possédé avec mention "Déjà acquis" et conserve l'audio.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Studio Audio & Création
- **FR-001**: Le système DOIT fournir une page dédiée de création de livre audio (`/audio/new` ou dans chaque espace rôle `/chief-layout/audio/new`, `/layout-artist/audio/new`, `/admin/audio/new`).
- **FR-002**: La page de création DOIT proposer un sélecteur d'ouvrage permettant de rattacher le livre audio à un livre numérique ou papier existant.
- **FR-003**: Lors du rattachement, le système DOIT pré-remplir et verrouiller automatiquement le titre, les auteurs, la catégorie/discipline, le pays et la couverture de l'ouvrage sélectionné.
- **FR-004**: En mode autonome (sans rattachement), le système DOIT permettre la saisie manuelle des métadonnées (titre, auteur/éditeur, pays, description, catégorie, niveau d'étude, prix XOF, prix EUR, téléversement de la couverture).
- **FR-005**: L'interface de dépôt audio DOIT organiser les pistes en deux sections claires : **Voix Homme** et **Voix Femme**, chacune contenant le téléversement du "Livre complet" et une liste dynamique de "Chapitres" (ajout, libellé, fichier audio, suppression).
- **FR-006**: Le système DOIT autoriser l'enregistrement dès qu'au moins une piste audio (livre complet ou un chapitre) est fournie, avec statut d'avancement par voix ("Non commencé", "Partiel", "Complet").
- **FR-007**: Les fichiers audio DOIVENT être téléversés de façon sécurisée vers Cloudflare R2 / stockage média avec calcul automatique de la durée en secondes.

#### Pages de Gestion & Suivi Multi-Rôles
- **FR-008**: Le système DOIT intégrer un onglet de menu dédié "Livres audio" dans la barre latérale pour : Maquettiste (`/layout-artist/audio`), Chef Maquettiste (`/chief-layout/audio`), Juriste (`/legal-reviewer/audio`) et Administrateur (`/admin/audio`).
- **FR-009**: La table de gestion DOIT lister tous les livres audio avec filtre par statut (`draft`, `pending_layout_validation`, `pending_legal_validation`, `published`, `rejected`), recherche textuelle et affichage des voix disponibles (Homme, Femme, Mixte).
- **FR-010**: Le Chef Maquettiste DOIT pouvoir valider techniquement ou rejeter un livre audio avec commentaire obligatoire en cas de rejet.
- **FR-011**: Le Juriste DOIT pouvoir valider la conformité juridique et les taux de redevance audio des co-auteurs.
- **FR-012**: L'Administrateur DOIT pouvoir publier, dépublier, modifier ou supprimer tout livre audio du catalogue.

#### Commande Multi-Formats & Catalogue
- **FR-013**: La fiche catalogue et la modale de commande d'un ouvrage DOIVENT permettre la sélection combinée et non-exclusive de 1, 2 ou 3 formats : Papier, Numérique, Audio.
- **FR-014**: Le panier et le calcul du montant total DOIVENT agréger les prix de tous les formats cochés en temps réel.
- **FR-015**: L'acquisition d'un format audio DOIT débloquer immédiatement l'accès au streaming audio complet de l'ouvrage (livre entier débloqué avec tous ses chapitres, sans micro-paiement additionnel). Le lecteur audio (`/listen/[id]`) DOIT proposer une liste de lecture des chapitres permettant la navigation libre et un sélecteur de voix (Voix Homme par défaut, Voix Femme si disponible, ou voix unique par défaut).

#### Vue d'Ensemble & Progression
- **FR-016**: La vue d'ensemble du lecteur/étudiant (`/student`) DOIT afficher un widget dédié "Lectures & Écoutes en cours" incluant la progression des livres audio écoutés.
- **FR-017**: Le widget DOIT indiquer le titre du livre audio, la couverture, le chapitre en cours, la jauge de progression en pourcentage et un bouton "Reprendre l'écoute" ramenant sur `/listen/[id]`.

#### Catalogue Public & Différenciation des Combinaisons de Formats
- **FR-018**: Le catalogue public (`/catalog`) DOIT intégrer dans son sélecteur de format les options : "Tous les formats", "Livres audio (tous)", "Audio seul (Pure audio)", "Livre numérique", "Livre papier" et "Pack complet (Papier + Numérique + Audio)".
- **FR-019**: Chaque carte du catalogue public DOIT afficher un badge distinctif reflétant exactement la combinaison disponible : `Papier • Numérique • Audio`, `Numérique • Audio`, `Papier • Audio`, `Audio Seul`, `Papier • Numérique`, `Numérique Seul`, `Papier Seul`.
- **FR-020**: La fiche détaillée `/catalog/[id]` et le composant d'actions `BookActionButtons` DOIVENT proposer les 3 options (Papier, Numérique, Audio) avec prix dédiés et possibilité d'ajouter n'importe quelle combinaison au panier.

---

### Key Entities

- **AudioBook / AudioTrackSet**: Regroupement des pistes audio d'un ouvrage, avec métadonnées spécifiques au livre audio, narrateurs (voix masculine, voix féminine), prix audio spécifique (XOF et EUR), statut de workflow et lien optionnel vers l'entité `Ouvrage` du catalogue.
- **AudioTrack**: Piste audio individuelle (livre complet ou chapitre précis), typée par genre de voix (`male`, `female`), numéro de chapitre, titre, durée en secondes, clé de stockage Cloudflare R2 / URL de flux.
- **AudioListeningProgress**: Enregistrement de la progression d'écoute d'un utilisateur par piste et par livre audio (temps écoulé, pourcentage, date de dernière écoute).
- **MultiFormatOrderItem**: Ligne de commande associant un ouvrage à un ou plusieurs formats sélectionnés (`paper`, `digital`, `audio`).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Le temps nécessaire à un maquettiste pour créer une version audio rattachée à un livre existant est inférieur à 90 secondes (hors temps de téléversement réseau des fichiers audio).
- **SC-002**: 100% des livres audio rattachés reprennent fidèlement la couverture et les métadonnées de l'ouvrage parent sans aucune duplication de données inutile.
- **SC-003**: Les utilisateurs peuvent commander librement n'importe quelle combinaison des 3 formats (papier, numérique, audio) en une seule transaction sans blocage d'exclusivité.
- **SC-004**: 100% des écoutes audio interrompues peuvent être reprises depuis la vue d'ensemble en un seul clic à la seconde exacte sauvegardée.
- **SC-005**: 100% des actions destructrices ou de rejet de livre audio font l'objet d'une confirmation explicite avec traçabilité dans les logs.

---

## Assumptions

- Les fichiers audio téléversés sont au format standard MP3, AAC ou WAV, compatibles avec la lecture HTML5 native et le streaming Cloudflare R2.
- L'infrastructure Cloudflare R2 existante du projet prend en charge les téléversements directs sécurisés pour les fichiers audio jusqu'à 500 Mo.
- Le modèle de données existant `AudioTrack` et `AudioListeningSession` dans Django sera étendu pour intégrer la distinction des narrateurs (voix homme / voix femme) et la structure chapitrée.
- Les règles de style LAHAThèque (zéro émoji, tokens sémantiques `navy`/`gold`, Playfair Display & Poppins, mobile-first) s'appliquent à tous les écrans du Studio Audio.
