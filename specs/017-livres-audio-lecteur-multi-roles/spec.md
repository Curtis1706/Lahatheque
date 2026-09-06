# Feature Specification: Livres Audio et Lecteur Multi-Rôles

**Feature Branch**: `017-livres-audio-lecteur-multi-roles`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: "les livres avec audio sur le compte client et où il faut on aura un bouton écouter qui jouera l'audio du livre et un bouton lire (extrait ou entièreté quand ils ont déjà payé), quels sont les autres comptes concernés, les pages concernées, vues d'ensemble, ma bibliothèque etc, l'admin, le chef maquettiste et le maquettiste doivent aussi pouvoir écouter non, dans l'édition aussi ils peuvent upload un autre audio pour remplacer, aussi pour la page dédiée pour la lecture audio utilisions ceci qui suit, on l'adapte à nos couleurs, logo pour remplacer le spotify, book cover etc [SpotifyCard component]"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Écoute et Achat Client / Étudiant (Priority: P1)

En tant qu'étudiant ou client connecté sur LAHAThèque, lorsqu'un ouvrage dispose d'une version audio, je veux pouvoir écouter un extrait gratuit depuis le catalogue ou la vue d'ensemble, acheter la version audio, et accéder à la lecture audio complète dans « Ma Bibliothèque » via un lecteur audio dédié, fluide et élégant, tout en conservant le bouton « Lire » pour la version écrite (PDF/EPUB).

**Why this priority**: L'accès au savoir par le format audio et la monétisation des livres audio pour les étudiants et clients constituent le cœur de la valeur ajoutée et de l'expérience utilisateur de la plateforme.

**Independent Test**: Un étudiant consulte le catalogue, visualise un ouvrage avec version audio, écoute un extrait dans le lecteur audio, commande la version audio, retrouve l'ouvrage dans « Ma Bibliothèque », clique sur « Écouter » et reprend l'écoute complète avec sauvegarde automatique de la position d'écoute.

**Acceptance Scenarios**:

1. **Given** un ouvrage possédant une version audio sur le catalogue étudiant, **When** l'étudiant clique sur « Écouter l'extrait », **Then** le lecteur audio démarre la lecture de la portion d'extrait autorisée sans exiger d'achat préalable.
2. **Given** un étudiant ayant acheté la version audio d'un ouvrage, **When** il se rend dans « Ma Bibliothèque », **Then** deux boutons distincts sont visibles : « Lire » (ouvre le lecteur PDF) et « Écouter » (ouvre le lecteur audio complet).
3. **Given** un étudiant en cours d'écoute, **When** il met en pause ou quitte la page et y revient plus tard, **Then** le lecteur reprend automatiquement à la seconde exacte où il s'était arrêté.

---

### User Story 2 - Contrôle et Remplacement Audio par les Maquettistes et Administrateurs (Priority: P2)

En tant que maquettiste, chef maquettiste ou administrateur, je veux pouvoir écouter l'intégralité de la piste audio d'un ouvrage en cours de traitement ou déjà publié, et avoir la possibilité de remplacer le fichier audio existant par un nouveau fichier lors de l'édition d'un ouvrage, avec ré-encodage et verrouillage automatique des flux.

**Why this priority**: Les équipes éditoriales et administratives doivent garantir la qualité acoustique des ouvrages avant et après publication, et disposer d'un moyen simple de corriger un enregistrement sonore sans avoir à recréer entièrement le dossier de l'ouvrage.

**Independent Test**: Un chef maquettiste accède à l'écran de validation ou d'édition d'un ouvrage doté d'une piste audio, lance l'écoute de vérification, dépose un nouveau fichier audio de remplacement, et constate que la nouvelle piste remplace l'ancienne et devient immédiatement disponible à l'écoute sécurisée.

**Acceptance Scenarios**:

1. **Given** un chef maquettiste ou un administrateur sur la fiche d'un ouvrage, **When** il clique sur « Écouter l'audio », **Then** la session d'écoute s'ouvre sans restriction de paiement ni blocage d'accès.
2. **Given** un maquettiste ou un administrateur en mode édition d'ouvrage, **When** il sélectionne un nouveau fichier audio pour remplacer la piste actuelle et valide le formulaire, **Then** l'ancien fichier est remplacé, le nouveau flux est envoyé et verrouillé sur le serveur de streaming, et les métadonnées de l'ouvrage sont mises à jour.
3. **Given** un contrat signé pour l'ouvrage, **When** un audio est ajouté ou remplacé, **Then** une notification est émise pour le juriste si le contrat requiert une vérification de la quote-part des droits audio.

---

### User Story 3 - Expérience de Lecture Audio Immersive (Priority: P3)

En tant qu'auditeur (étudiant, auteur, administrateur), je veux disposer d'un composant de lecture audio riche inspiré du design SpotifyCard adapté aux couleurs nobles de LAHAThèque (bleu nuit, or, typographie Playfair/Poppins), avec contrôle du volume, scrubbing sur la barre de progression, ondes sonores animées en cours de lecture, affichage de la couverture du livre et gestion des chapitres.

**Why this priority**: L'expérience d'écoute doit être luxueuse, immersive et ergonomique afin de valoriser les productions intellectuelles et encourager l'assiduité d'écoute des étudiants.

**Independent Test**: L'utilisateur ouvre la page dédiée du lecteur audio, contrôle la lecture avec la barre d'espace ou les boutons interactifs, ajuste le volume, navigue entre chapitres/pistes, et observe la conformité visuelle absolue avec la charte graphique LAHAThèque.

**Acceptance Scenarios**:

1. **Given** le lecteur audio affiché à l'écran, **When** la lecture est active, **Then** les barres d'ondes sonores s'animent subtilement en doré, le curseur temporel progresse, et le temps écoulé / durée totale s'affichent au format standard (ex: 04:32 / 45:10).
2. **Given** un appareil mobile avec écran étroit (< 400px), **When** l'utilisateur accède au lecteur audio, **Then** l'interface s'adapte en colonne unique sans aucun débordement horizontal, avec des zones tactiles d'au moins 44px.

---

### Edge Cases

- Que se passe-t-il si un utilisateur tente d'écouter l'intégralité d'un livre audio sans l'avoir acheté ? Le système limite la diffusion à la durée d'extrait définie ou renvoie une erreur HTTP 403 explicite guidant l'utilisateur vers l'achat du format audio.
- Comment le système réagit-il si la connexion réseau est interrompue pendant l'écoute ? Le lecteur met en pause la piste, affiche un message d'information non intrusif et conserve en cache local la dernière position atteinte.
- Que se passe-t-il lors du remplacement d'un fichier audio en cours d'écoute par des utilisateurs ? Les sessions en cours restent valides jusqu'à expiration de leur jeton temporaire, et toute nouvelle session charge automatiquement le flux actualisé.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT afficher un indicateur visuel distinct (« Livre Audio ») sur tous les ouvrages du catalogue possédant au moins une piste audio active.
- **FR-002**: Le système DOIT proposer un bouton « Écouter l'extrait » sur le catalogue pour les utilisateurs n'ayant pas acheté l'audio, et un bouton « Écouter » pour ceux disposant de l'accès.
- **FR-003**: Le système DOIT afficher deux actions claires et séparées (« Lire » et « Écouter ») sur la carte de l'ouvrage dans « Ma Bibliothèque » (`/student/library`) et dans la vue d'ensemble (`/student`).
- **FR-004**: Le système DOIT intégrer une page dédiée ou une vue immersive de lecture audio exploitant le composant de carte audio haute fidélité aux couleurs LAHAThèque (`navy`, `navy-dark`, `gold`, typographie `Playfair Display` pour le titre et `Poppins` pour les métadonnées).
- **FR-005**: Le système DOIT permettre l'écoute complète sans restriction de paiement pour les rôles habilités : Administrateur (`admin`, `super_admin`), Chef Maquettiste (`chief_layout`), Maquettiste (`layout_artist`), et Auteur pour son propre ouvrage (`author`).
- **FR-006**: Le système DOIT permettre au Maquettiste, au Chef Maquettiste et à l'Administrateur de remplacer le fichier audio d'un ouvrage depuis le formulaire d'édition de l'ouvrage (`/layout-artist/deposits`, `/chief-layout/deposit`, `/admin/catalog`).
- **FR-007**: Le système DOIT verrouiller automatiquement tout nouveau fichier audio téléversé avec des URLs signées sécurisées et interdire tout téléchargement direct ou extraction de fichier brut.
- **FR-008**: Le système DOIT persister la progression d'écoute de l'utilisateur (position en secondes et pourcentage d'achèvement) à intervalles réguliers et restaurer la lecture à cette position lors de la session suivante.
- **FR-009**: Le système DOIT limiter la durée de l'extrait audio gratuit à 180 secondes (3 minutes) sur la première piste audio pour tout utilisateur n'ayant pas acheté l'ouvrage et non exempté.
- **FR-010**: Le système DOIT proposer un double affichage synchronisé : un mini-lecteur persistant flottant en bas d'écran permettant la navigation continue sans coupure sonore, et une vue immersive dédiée plein écran (`/student/audio/[id]` ou `/listen/[id]`) avec carte audio haute fidélité.
- **FR-011**: Le système DOIT appliquer le remplacement direct du flux Cloudflare Stream lors de l'upload d'une nouvelle piste par le maquettiste ou l'administrateur, actualiser la durée de l'ouvrage, et émettre une alerte automatique à destination du juriste si le contrat actif ne comporte pas de quote-part audio définie.

### Key Entities *(include if feature involves data)*

- **Ouvrage**: Livre du catalogue, comprenant les champs `has_audio_version` (booléen), `price_audio` (décimal en XOF), `format_type`, et la relation inverse avec les pistes audio.
- **AudioTrack**: Piste audio chapitrée liée à un ouvrage, contenant le titre, le numéro de chapitre, la durée en secondes, l'identifiant de flux sécurisé (`stream_id`), l'URL de manifeste HLS signé et les sous-titres optionnels (`captions_vtt_url`).
- **AudioListeningSession**: Enregistrement de session d'écoute pour un utilisateur et un ouvrage/piste, comprenant la date de session, la durée totale écoutée, le pourcentage de complétion et l'horodatage de dernière reprise.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: L'auditeur peut lancer la lecture d'un livre audio en moins de 2 secondes après avoir cliqué sur « Écouter ».
- **SC-002**: 100% des flux audio diffusés sont protégés par des jetons d'accès temporaires signés, sans aucune exposition de lien direct vers un fichier téléchargeable.
- **SC-003**: La position de reprise d'écoute est synchronisée avec une précision inférieure ou égale à 5 secondes lors d'une reconnexion.
- **SC-004**: Les maquettistes et administrateurs peuvent remplacer un fichier audio sur un ouvrage existant en moins de 3 clics dans l'interface d'édition.
- **SC-005**: L'interface du lecteur audio est 100% utilisable sur des appareils mobiles de 375px à 430px sans rupture de mise en page ni défilement horizontal.

## Assumptions

- Le service de stockage et de transcodage de streaming s'appuie sur Cloudflare Stream avec signature de jetons HLS à durée de vie limitée (60 minutes).
- Les formats de fichiers acceptés lors du téléversement ou du remplacement sont les fichiers audio standards (MP3, M4A, M4B, WAV).
- Les rôles Maquettiste, Chef Maquettiste et Administrateur partagent un droit de pré-écoute technique pour tous les ouvrages du catalogue sans restriction de droit d'auteur commercial.
- Pour les étudiants ayant souscrit à un bouquet institutionnel incluant l'option audio, l'accès audio complet est débloqué au même titre qu'un achat individuel.
