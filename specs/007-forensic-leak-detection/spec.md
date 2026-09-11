# Feature Specification: Forensic Leak Detection & Watermark Extraction

**Feature Branch**: `007-forensic-leak-detection`

**Created**: 2026-09-11

**Status**: Draft

**Input**: User description: "voilà implémentons, aussi on devrait pouvoir analyser une capture d'écran avec une grande précision, une image au cas où ils font une capture d'écran ou une photo"

## Clarifications

### Session 2026-09-11
- Q: Quelle stratégie de détection visuelle le système doit-il prioriser pour décoder les filigranes sur les captures d'écran et photos de smartphone ? → A: Option A (Pipeline hybride : prétraitement d'image et OCR local par défaut sur le serveur LAHAThèque, avec recours au modèle de vision multimodale haute précision pour les photos complexes, floues ou dégradées).
- Q: Quelles actions directes l'administrateur doit-il pouvoir déclencher depuis la fiche de résultat lorsqu'une fuite est confirmée ? → A: Option A (Actions directes intégrées : suspendre le compte du lecteur, révoquer immédiatement ses sessions de lecture actives et télécharger le rapport de preuve certifié).
- Q: Quels profils d'utilisateurs doivent être autorisés à utiliser cet outil d'investigation et de détection de fuite ? → A: Accès strictement réservé au dashboard administrateur seul (administrateurs et super-administrateurs).
- Q: Quelle stratégie d'exécution et de ressources adopter pour garantir une analyse infaillible sans saturer le serveur ? → A: Analyse synchrone ultra-rapide en mémoire (BytesIO) pour les fichiers courants (< 15 Mo), avec bascule automatique sur tâche de fond Celery / Redis pour les documents très volumineux afin de ne jamais saturer la mémoire vive du serveur.
- Q: Comment la carte 'Intégrité & Fuites' sur le tableau de bord des Traces d'Accès DRM doit-elle refléter les résultats d'analyse ? → A: Calcul dynamique connecté : la carte 'Intégrité & Fuites' affiche le nombre exact d'investigations forensiques avec statut 'Fuite Identifiée' et calcule un taux d'intégrité réel basé sur les sessions saines.
- Q: Comment bloquer efficacement l'accès d'un lecteur tiers utilisant un SaaS partenaire sans compte local chez LAHAThèque ? → A: Liste noire active au niveau du streaming DRM : enregistrement de l'identifiant partenaire, de l'e-mail et du device_fingerprint dans une table de blocage (BlockedReaderIdentity) et dans Redis, coupant instantanément tout flux Range HTTP 206 pour ce lecteur.

## User Scenarios & Testing

### User Story 1 - Analyse et Détection Immédiate sur Fichier PDF Fuité (Priority: P1)

En tant qu'administrateur de la plateforme LAHAThèque, lorsqu'un ouvrage numérique circule de manière illicite sur Internet sous forme de fichier PDF, je veux pouvoir téléverser ce document suspect dans mon espace de sécurité afin que le système identifie automatiquement et formellement le compte de l'utilisateur à l'origine de la fuite grâce au tatouage invisible et aux signatures cryptographiques.

**Why this priority**: Il s'agit du vecteur de fuite le plus courant et le plus préjudiciable (diffusion de fichiers PDF complets). La détection automatique du tatouage invisible et des métadonnées signées fournit une preuve infaillible et instantanée.

**Independent Test**: Téléverser un extrait ou un livre PDF généré par la liseuse contenant un tatouage invisible. Le système doit extraire sans action manuelle le nom, l'e-mail, l'adresse IP et la signature de l'acheteur en moins de 3 secondes.

**Acceptance Scenarios**:

1. **Given** un fichier PDF authentique ayant été consulté sur LAHAThèque, **When** l'administrateur dépose le fichier dans l'espace d'analyse et clique sur analyser, **Then** le système confirme l'authenticité de la signature, extrait l'identifiant utilisateur, l'e-mail et l'adresse IP d'origine, et affiche un score de certitude de 100%.
2. **Given** un fichier PDF dont le nom a été modifié et dont les premières pages ont été coupées, **When** l'administrateur soumet ce fichier, **Then** le système scanne l'ensemble des pages restantes, localise les marqueurs résiduels sur les pages intérieures et identifie le compte d'origine.
3. **Given** un fichier PDF externe non issu de LAHAThèque ou totalement altéré, **When** l'administrateur lance l'analyse, **Then** le système indique clairement qu'aucune empreinte LAHAThèque valide n'a été détectée.

---

### User Story 2 - Analyse Haute Précision sur Captures d'Écran et Photos (Priority: P2)

En tant qu'administrateur ou juriste, lorsqu'une fuite consiste en des captures d'écran prises sur un ordinateur ou des photographies d'écran prises avec un smartphone (partagées sur les réseaux sociaux ou messageries), je veux pouvoir soumettre cette image afin que le système rehausse les contrastes et lise avec une grande précision le filigrane semi-transparent présent sur la page.

**Why this priority**: Les fraudeurs contournent souvent le téléchargement direct en prenant des photos de leur écran. Le filigrane semi-transparent à faible opacité (20%) nécessite un traitement visuel approfondi pour être décodé avec exactitude.

**Independent Test**: Téléverser une photographie de mauvaise qualité ou une capture d'écran contenant un filigrane visible semi-transparent. Le système doit isoler les informations textuelles (adresse e-mail, adresse IP ou nom) et restituer l'identité du lecteur avec un indice de confiance élevé.

**Acceptance Scenarios**:

1. **Given** une capture d'écran d'une page de livre comportant un filigrane semi-transparent en diagonale ou en pied de page, **When** l'administrateur téléverse l'image, **Then** le système effectue un traitement de rehaussement de contraste, détecte les segments textuels du filigrane et extrait l'e-mail ou l'IP de l'utilisateur.
2. **Given** une photo smartphone floue ou avec un angle incliné, **When** l'analyse est lancée, **Then** le système redresse l'image, applique les filtres de luminance et extrait les informations discernables.
3. **Given** une image où seul un fragment d'e-mail ou une adresse IP partielle est lisible, **When** l'analyse est effectuée, **Then** le système propose les correspondances probables issues de la base des traces d'accès avec un pourcentage de vraisemblance.

---

### User Story 3 - Corrélation avec les Traces d'Accès et Constitution du Dossier de Preuve (Priority: P3)

En tant qu'administrateur ou gestionnaire des droits d'auteur, après avoir identifié un lecteur suspect, je veux accéder immédiatement au dossier d'audit complet de l'utilisateur (historique d'achat, méthode de paiement, date et heure exacte de lecture, université d'affiliation) et pouvoir exporter un rapport de preuve certifié pour transmission aux éditeurs ou aux autorités légales.

**Why this priority**: Disposer de l'identité du lecteur ne suffit pas sur le plan juridique : il faut prouver la relation contractuelle, la transaction financière et la session de consultation exacte pour que la réclamation soit irréfutable.

**Independent Test**: Cliquer sur le résultat d'une analyse réussie pour afficher la fiche de corrélation complète reliant le fichier analysé à la transaction d'achat réelle en base de données.

**Acceptance Scenarios**:

1. **Given** une analyse ayant extrait un e-mail ou une signature valide, **When** l'administrateur consulte le résultat, **Then** le système affiche automatiquement la commande associée, le moyen de paiement utilisé, l'horodatage de la session de lecture et l'université concernée.
2. **Given** un dossier d'audit constitué, **When** l'administrateur clique sur exporter la preuve, **Then** le système génère un document récapitulatif horodaté contenant les éléments d'investigation.

---

### Edge Cases

- Que se passe-t-il si le fichier téléversé dépasse la taille maximale autorisée (50 Mo) ? Le système affiche un message explicatif guidant l'utilisateur pour compresser ou extraire uniquement les pages concernées.
- Comment le système réagit-il face à une image totalement noire, blanche ou sans texte ? L'outil informe l'administrateur qu'aucun élément textuel ou visuel n'a pu être extrait.
- Que se passe-t-il si un utilisateur a partagé un document mais que son compte a été supprimé ou anonymisé entre-temps ? Les données de la table immuable de traçabilité des accès conservent l'adresse IP, le nom au moment de l'achat et les détails de transaction pour maintenir la chaîne de responsabilité.
- Comment sont traitées les images aux formats variés (PNG, JPEG, WEBP, HEIC) ? Le système normalise les formats en entrée avant d'appliquer les filtres d'amélioration de contraste.

---

## Requirements

### Functional Requirements

- **FR-001**: Le système DOIT fournir une interface d'investigation dédiée au sein du tableau de bord administrateur seul (accessible exclusivement aux administrateurs et super-administrateurs) pour le dépôt et l'analyse de documents suspects (PDF) et d'images (PNG, JPG, WEBP), interdisant strictement l'accès à tout autre rôle (lecteurs, enseignants, auteurs, éditeurs).
- **FR-002**: Le système DOIT être capable d'inspecter l'arborescence et le flux binaire d'un PDF pour extraire le marqueur stéganographique invisible contenant l'identifiant, l'e-mail, l'IP et la signature du lecteur.
- **FR-003**: Le système DOIT appliquer un pipeline hybride de détection visuelle débutant par un prétraitement d'image local sur le serveur (optimisation de contraste, séparation de luminance, binarisation adaptative) et OCR local afin de décoder immédiatement les captures d'écran nettes.
- **FR-004**: Le système DOIT basculer automatiquement sur une analyse par modèle de vision multimodale haute précision lorsque l'image est floue, prise de biais ou dégradée, afin d'extraire les motifs de filigranes nominatifs (adresses e-mail, adresses IP, noms de lecteurs, dates).
- **FR-005**: Le système DOIT croiser les informations extraites avec les données réelles de la plateforme (table des traces d'accès, commandes, comptes utilisateurs) pour identifier avec certitude le profil d'origine.
- **FR-006**: Le système DOIT calculer et afficher un score de confiance (en pourcentage) indiquant le degré de certitude de l'attribution de la fuite.
- **FR-007**: Le système DOIT présenter une fiche récapitulative claire des preuves : statut du compte, historique de lecture associé, date de la fuite, et lien vers les détails de commande.
- **FR-008**: Le système DOIT consigner chaque opération d'analyse forensique effectuée par l'administrateur dans un journal d'audit de sécurité interne.
- **FR-009**: Le système DOIT permettre à l'administrateur, directement depuis la fiche de résultat, de suspendre le compte du lecteur identifié, de révoquer immédiatement toutes ses sessions actives de lecture et d'exporter le rapport de preuve certifié en document téléchargeable.

---

### Key Entities

- **Document d'Enquête (Forensic Evidence)** : Représente le fichier suspect soumis par l'administrateur (type de fichier, taille, empreinte de hachage SHA-256, date d'analyse).
- **Rapport Forensique (Forensic Report)** : Résultat de l'investigation regroupant le score de confiance, les données brutes extraites (tatouage invisible, filigrane visible), la signature validée et les références aux entités réelles (utilisateur, ouvrage, commande, trace d'accès).
- **Empreinte de Filigrane (Watermark Fingerprint)** : Ensemble des éléments identificatoires (identifiant utilisateur, adresse IP de session, adresse e-mail, horodatage d'accès) inscrits lors de la consultation.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: L'analyse d'un document PDF suspect contenant un tatouage invisible aboutit à l'identification formelle du compte en moins de 3 secondes dans 100% des cas où le document n'a pas été dénaturé.
- **SC-002**: L'analyse d'une capture d'écran nette contenant un filigrane semi-transparent extrait correctement l'adresse e-mail ou l'adresse IP dans au moins 95% des cas.
- **SC-003**: L'administrateur peut déposer un fichier et obtenir le rapport complet en moins de 3 clics depuis son tableau de bord de sécurité.
- **SC-004**: Aucun faux positif : si un document ne provient pas de la plateforme LAHAThèque, le système signale l'absence de correspondance sans imputer la fuite à un utilisateur innocent.

---

## Assumptions

- Les administrateurs disposent des autorisations requises pour consulter les données d'investigation et les traces d'accès associées.
- Les documents PDF générés par la liseuse LAHAThèque intègrent le moteur de marquage invisible actif conforme à l'architecture de protection.
- Les captures d'écran et photos téléversées présentent une résolution minimale permettant de discerner les caractères typographiques du filigrane.
- L'infrastructure serveur dispose des capacités de calcul requises pour exécuter les algorithmes de traitement d'image et d'inspection documentaire sans ralentir la navigation globale.
