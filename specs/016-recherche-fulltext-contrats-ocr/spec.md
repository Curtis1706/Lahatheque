# Spécification Fonctionnelle : Recherche Documentaire Plein Texte & OCR sur Contrats Juridiques

**Feature Branch** : `016-recherche-fulltext-contrats-ocr`

**Date de création** : 2026-09-06

**Statut** : Brouillon Prêt pour Clarification / Planification

**Description utilisateur** : "J’espère que le moteur est puissant ? Que même quand on tape un mot clé qui est dans un PDF ça ressort"

---

## Scénarios Utilisateurs & Parcours *(obligatoire)*

### User Story 1 - Recherche plein texte dans les documents PDF natifs (Priorité : P1)

En tant que Juriste ou Administrateur de la plateforme LAHAThèque,  
Je veux rechercher n'importe quel mot-clé, clause juridique, nom de signataire ou montant spécifique situé à l'intérieur d'un contrat PDF numérisé,  
Afin de retrouver immédiatement et avec certitude le bon contrat contractuel sans devoir ouvrir manuellement chaque fichier.

**Pourquoi cette priorité** : C'est le cœur de valeur de la base documentaire légale (GED). Un juriste doit pouvoir identifier en quelques secondes tous les contrats contenant une clause spécifique (ex: "redevance 15%", "exclusivité territoriale", "audit des tirages").

**Test indépendant** : Peut être testé en déposant un document PDF textuel contenant un terme rare dans le corps du texte (ex: "arbitrage CCJA"), puis en tapant ce terme dans la barre de recherche documentaire pour vérifier que le contrat ressort en tête de liste.

**Critères d'acceptation** :
1. **Étant donné** un contrat PDF contenant une clause textuelle spécifique, **Quand** le juriste saisit un ou plusieurs mots de cette clause dans la barre de recherche plein texte, **Alors** le contrat apparaît dans les résultats avec un aperçu contextuel de l'extrait correspondant.
2. **Étant donné** une recherche comportant des variations grammaticales ou des pluriels (ex: "cessions de droits"), **Quand** le juriste lance la recherche, **Alors** le système identifie les contrats contenant les formes fléchies associées ("cession", "céder").

---

### User Story 2 - Indexation et recherche dans les contrats scannés / images via OCR (Priorité : P1)

En tant que Juriste,  
Je veux que les contrats physiques scannés (copies papier signées au stylo, documents photographiés ou numérisés sans couche textuelle native) soient automatiquement retranscrits et indexés,  
Afin que leurs termes, noms de signataires manuscrits identifiés et clauses dactylographiées soient aussi facilement recherchables que les documents numériques natifs.

**Pourquoi cette priorité** : En Afrique de l'Ouest, une proportion importante de conventions universitaires et d'accords d'édition est signée physiquement avec tampons humides et numérisée via des scanners de bureau sans OCR intégré. Sans traitement d'image, ces documents demeurent invisibles pour le moteur de recherche.

**Test indépendant** : Peut être testé en téléversant un PDF composé exclusivement d'images scannées sans texte sélectionnable, puis en recherchant un mot présent sur l'image pour vérifier son indexation effective.

**Critères d'acceptation** :
1. **Étant donné** un contrat téléversé dont les pages ne contiennent aucun texte informatique sélectionnable, **Quand** le document est traité par la chaîne d'ingestion documentaire, **Alors** un processus de reconnaissance optique de caractères extrait automatiquement le contenu textuel des pages pour alimenter l'index de recherche.
2. **Étant donné** un document partiellement textuel comportant une annexe scannée, **Quand** le juriste recherche un terme de l'annexe scannée, **Alors** le contrat est correctement indexé et restitué dans la liste des résultats.

---

### User Story 3 - Filtrage multicritère combiné et recherche d'acronymes ou codes partiels (Priorité : P2)

En tant que Juriste ou Super-Administrateur,  
Je veux combiner ma recherche textuelle avec des filtres par catégorie de partenaire (Auteur, Université, Éditeur tiers) et par statut contractuel (Actif, En attente de signature, Expiré),  
Afin d'isoler rapidement un sous-ensemble précis d'accords juridiques.

**Pourquoi cette priorité** : Permet d'éviter le bruit dans les résultats lorsque le volume documentaire dépasse plusieurs centaines de conventions.

**Test indépendant** : Peut être testé en cherchant le mot "droit" filtré uniquement sur la catégorie "Universités" et le statut "Actifs".

**Critères d'acceptation** :
1. **Étant donné** une recherche textuelle active, **Quand** l'utilisateur sélectionne un filtre de partenaire ou de statut, **Alors** les résultats sont immédiatement affinés selon la combinaison de tous les critères.
2. **Étant donné** la recherche d'un sigle institutionnel (ex: "UAC", "UNSTIM", "FASEG") ou d'une référence partielle (ex: "CTR-JUR-2026"), **Quand** le juriste saisit ces lettres, **Alors** les résultats incluent les contrats correspondants sans être rejetés par les filtres linguistiques.

---

### Cas Limites & Gestion d'Erreurs

- **Document PDF volumineux (jusqu'à 800 Mo)** : Le système doit pouvoir ingérer de volumineux recueils de contrats sans bloquer l'interface utilisateur pendant l'extraction ou la reconnaissance OCR.
- **Scan de mauvaise qualité ou incliné** : Si la lisibilité optique est insuffisante pour un décryptage certain, le système indexe les parties reconnues et signale discrètement à l'opérateur que le document est un document numérisé basse résolution.
- **Caractères spéciaux et accents** : Une recherche sans accent (ex: "repertoire") doit retourner les occurrences accentuées (ex: "répertoire") et inversement.
- **Fichier protégé par mot de passe** : Si un document juridique téléversé est verrouillé par mot de passe, le système invite le juriste à fournir la version déverrouillée ou indique l'impossibilité d'indexation plein texte.

---

## Exigences Fonctionnelles *(obligatoire)*

### Exigences Générales

- **FR-001** : Le système DOIT extraire automatiquement l'intégralité du texte numérique de tout document contractuel téléversé aux formats PDF et traitement de texte courant.
- **FR-002** : Le système DOIT détecter automatiquement les documents ne comportant pas de texte numérique exploitable et déclencher une transcription optique (OCR) pour extraire le texte des images.
- **FR-003** : Le système DOIT indexer le texte intégral extrait dans un index documentaire dédié, associé de manière pérenne à la fiche du contrat.
- **FR-004** : Le moteur de recherche DOIT permettre une recherche par mot simple, groupe de mots et expressions exactes dans le corps du texte, le titre, la référence et le nom des signataires.
- **FR-005** : Le système DOIT ordonner les résultats par score de pertinence, en accordant une pondération supérieure aux correspondances trouvées dans les métadonnées officielles (titre, partie contractante, référence).
- **FR-006** : Le système DOIT afficher pour chaque contrat trouvé un extrait de contexte mettant en évidence les termes recherchés.
- **FR-007** : Le système DOIT supporter la recherche insensible à la casse et insensible aux accents sur l'ensemble de la base documentaire.
- **FR-008** : Le système DOIT garantir la confidentialité absolue des textes indexés, strictement réservés aux profils autorisés (Direction Juridique et Administration).

---

### Entités Clés

- **Contrat Légal** : Document contractuel liant LAHA Éditions à un tiers (auteur, université, éditeur tiers). Attributs clés : référence officielle, intitulé, partie contractante, type d'accord, statut d'instruction, texte intégral indexé, statut d'indexation OCR, date d'effet.
- **Résultat de Recherche Documentaire** : Représentation d'un contrat répondant à une requête de recherche avec extrait contextualisé des passages correspondants et indicateur de pertinence.
- **Tâche d'Ingestion Documentaire** : Processus d'arrière-plan analysant le fichier déposé, extrayant le texte natif ou exécutant la reconnaissance optique en cas de document scanné.

---

## Critères de Succès Mesurables *(obligatoire)*

- **SC-001** : 100% des documents PDF natifs téléversés ont leur texte intégral indexé et interrogeable dans un délai inférieur à 5 secondes après le dépôt.
- **SC-002** : Au moins 95% des termes textuels lisibles sur un contrat scanné de qualité standard sont correctement indexés via le pipeline de reconnaissance optique.
- **SC-003** : La recherche plein texte sur une base de 10 000 contrats restitue les résultats pertinents en moins de 500 millisecondes.
- **SC-004** : Zéro contrat n'est exclu de la recherche en raison de variations d'accents ou de casse dans le mot-clé saisi.
- **SC-005** : Les juristes trouvent le contrat recherché dès la première tentative de recherche dans plus de 90% des cas documentaires.

---

## Hypothèses & Dépendances

- **Hypothèse 1** : Les utilisateurs disposent d'une connexion internet suffisante pour téléverser et consulter des documents numérisés.
- **Hypothèse 2** : La langue principale des contrats juridiques est le français, avec d'éventuels termes ou dénominations en langues locales ou en anglais.
- **Dépendance 1** : Disponibilité d'un moteur de reconnaissance optique (local ou via service managé) capable de traiter des fichiers PDF scannés multi-pages.
- **Dépendance 2** : Respect des règles de sécurité et de chiffrement des documents juridiques confidentiels de la plateforme LAHAThèque.
