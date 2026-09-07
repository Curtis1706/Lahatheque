# Feature Specification: Harmonisation Universelle du PhoneInput

**Feature Branch**: `018-harmonisation-phone-input`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: "tous les endroits ou y a champ téléphone c'est le phone input avec les indicatifs et tout là, y en a déjà implémenté, indicatif en fonction de pays actif sur la plateforme, c'est ce phone input on doit utiliser partout ou y a champ téléphone /speckit-specify"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Saisie Harmonisée dans les Formulaires Métier & Juridiques (Priority: P1)

En tant que juriste, administrateur, gestionnaire ou grossiste, lorsque je saisis ou modifie les coordonnées téléphoniques d'un partenaire, auteur, contact ou responsable logistique (ex: création de contrat d'édition, création de compte utilisateur, annuaire des contacts, commande grossiste), je veux disposer d'un composant de saisie téléphonique unifié affichant le drapeau et l'indicatif international du pays, pré-rempli et filtré selon les pays actifs sur la plateforme, afin d'éviter toute erreur de saisie ou de formatage international.

**Why this priority**: Les contrats juridiques, bons de commande B2B et créations de comptes requièrent une intégrité absolue des numéros de téléphone pour les notifications SMS, WhatsApp et appels officiels. Les champs texte bruts actuels créent des incohérences de formatage et de typage.

**Independent Test**: Le juriste accède à l'écran de création d'un contrat d'édition (`/legal-reviewer/contracts/new`), visualise le sélecteur d'indicatif avec drapeau, sélectionne un pays actif (ex: Bénin `+229`, Côte d'Ivoire `+225`, Sénégal `+221`), saisit le numéro local, et constate que le numéro complet normalisé est enregistré et affiché sans erreur console.

**Acceptance Scenarios**:

1. **Given** un juriste sur le formulaire de contrat d'édition (`/legal-reviewer/contracts/new`), **When** la page se charge, **Then** le champ « Téléphone de la Partie Contractante » affiche le composant `PhoneInput` avec le drapeau national et l'indicatif des pays actifs sur LAHAThèque, sans aucune erreur JavaScript dans la console.
2. **Given** un administrateur ouvrant la modale de création de compte (`create-account-modal.tsx`), **When** il saisit les coordonnées, **Then** le champ téléphone utilise `PhoneInput` synchronisé avec les pays actifs.
3. **Given** un gestionnaire dans l'annuaire des contacts (`add-edit-contact-modal.tsx`), **When** il ajoute ou modifie un contact, **Then** le téléphone est saisi via le composant `PhoneInput`.
4. **Given** un grossiste passant une commande de livres papier (`wholesale-order-modal.tsx`), **When** il renseigne le numéro du responsable logistique, **Then** le composant `PhoneInput` valide la saisie avec indicatif.

---

### User Story 2 - Dynamisme des Pays Actifs & Détection Automatique de l'Indicatif (Priority: P2)

En tant qu'utilisateur remplissant un formulaire comportant un numéro existant ou pré-rempli (ex: rattachement automatique d'un auteur lors de la création d'un contrat), le système doit détecter automatiquement l'indicatif téléphonique international présent dans la chaîne pour sélectionner le bon pays et isoler le numéro local dans le champ de saisie. Si le pays est désactivé sur la plateforme, il ne doit plus apparaître dans le sélecteur.

**Why this priority**: Garantir la cohérence entre la configuration des pays gérés par la plateforme (Bénin, Togo, Côte d'Ivoire, Sénégal, Niger, etc.) et les formulaires de contact, tout en assurant une rétrocompatibilité parfaite avec les données pré-remplies.

**Independent Test**: Un utilisateur charge un profil ou un auteur dont le numéro est enregistré sous la forme `+225 07 12 34 56`. Le `PhoneInput` sélectionne automatiquement la Côte d'Ivoire (`CI`), affiche son drapeau, et renseigne `07 12 34 56` dans le champ local.

**Acceptance Scenarios**:

1. **Given** une chaîne de téléphone pré-remplie débutant par un indicatif reconnu (ex: `+229`, `+225`, `+221`), **When** le composant s'initialise, **Then** le drapeau et le sélecteur se calent immédiatement sur le pays correspondant et le numéro local affiche le reste des chiffres.
2. **Given** un appel API renvoyant la liste des pays actifs (`/api/v1/catalog/countries/?is_active=true`), **When** le composant est monté, **Then** seuls les pays avec `is_active=True` sont proposés dans la liste déroulante des indicatifs.

---

### User Story 3 - Résilience et Éradication des Erreurs de Rendu (Priority: P3)

En tant qu'utilisateur de la plateforme naviguant sur les formulaires de gestion (contrats, profils, commandes), l'interface ne doit jamais planter suite à des propriétés indéfinies (`undefined`) ou des valeurs nulles dans les sélecteurs ou fonctions de recherche textuelle.

**Why this priority**: L'analyse de l'écran réel `/legal-reviewer/contracts/new` a mis en évidence une exception non gérée `Cannot read properties of undefined (reading 'toLowerCase')` lors de la comparaison des noms d'auteurs, bloquant l'expérience utilisateur.

**Independent Test**: Accéder à `/legal-reviewer/contracts/new?book_id=...` avec un ouvrage dont l'auteur ou le signataire possède un label ou nom partiel/manquant : la page se charge de manière totalement stable sans aucune exception dans la console.

**Acceptance Scenarios**:

1. **Given** un paramètre ou objet auteur sans propriété `label` ou `name` définie, **When** la page initialise la recherche d'auteur, **Then** une garde défensive empêche tout appel à `.toLowerCase()` sur une valeur nulle/indéfinie.

---

### Edge Cases

- Que se passe-t-il si le backend ne répond pas ou est temporairement inaccessible lors du chargement des pays ? Le composant bascule silencieusement sur le catalogue de repli prédéfini (`AFRICAN_COUNTRIES_PRESET`) sans bloquer la saisie.
- Comment réagit le composant si l'utilisateur colle un numéro complet avec indicatif dans le champ de saisie locale ? Le composant extrait l'indicatif, sélectionne le pays correspondant et conserve uniquement le numéro national.
- Que se passe-t-il si un numéro historique commence par un indicatif étranger hors Afrique de l'Ouest ? Le composant conserve la valeur textuelle brute sans altération afin d'éviter toute corruption de données.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le composant `PhoneInput` (`components/ui/phone-input.tsx`) DOIT être le composant standard et unique utilisé pour toute saisie de numéro de téléphone dans l'ensemble de l'application.
- **FR-002**: Le système DOIT remplacer tous les champs de saisie manuelle `<input type="tel">` et `<input type="text">` destinés à un numéro de téléphone par `PhoneInput`.
- **FR-003**: Le composant `PhoneInput` DOIT récupérer la liste dynamique des pays actifs via le service `getCountries(true)` et proposer en priorité les pays configurés sur la plateforme.
- **FR-004**: Le composant DOIT afficher le drapeau du pays sélectionné (`CountryFlag`), le code pays (ex: `BJ`, `CI`, `SN`, `TG`, `NE`) et l'indicatif international (ex: `+229`, `+225`, `+221`).
- **FR-005**: Le composant DOIT supporter les propriétés `id`, `name`, `placeholder`, `disabled`, `required`, et `className` pour s'intégrer harmonieusement dans les grilles et formulaires existants.
- **FR-006**: Le formulaire de nouveau contrat juriste (`app/(dashboard)/legal-reviewer/contracts/new/page.tsx`) DOIT utiliser `PhoneInput` pour le champ « Téléphone de la Partie Contractante ».
- **FR-007**: La modale d'ajout/modification de contact (`components/features/contacts/add-edit-contact-modal.tsx`) DOIT utiliser `PhoneInput` pour le champ « Téléphone / WhatsApp ».
- **FR-008**: La modale d'administration de création de compte (`components/features/admin/create-account-modal.tsx`) DOIT utiliser `PhoneInput` pour le champ « Téléphone ».
- **FR-009**: La modale de commande grossiste (`components/features/wholesaler/wholesale-order-modal.tsx`) DOIT utiliser `PhoneInput` pour le champ « Numéro de téléphone du responsable logistique ».
- **FR-010**: Le système DOIT sécuriser les fonctions de filtrage et de comparaison textuelle de chaînes (notamment sur `legal-reviewer/contracts/new/page.tsx`) avec un chaînage optionnel `?.toLowerCase()` pour éliminer tout crash JavaScript `Cannot read properties of undefined`.
- **FR-011**: Le composant `PhoneInput` DOIT respecter la charte esthétique LAHAThèque (pas de couleur hexadécimale en dur, classes sémantiques `bg-background`, `border-border`, `focus-within:border-gold`, `text-navy`, typographie `Poppins`, zéro émoji).

---

### Key Entities

- **Country**: Entité pays du catalogue (`catalog.Country`), possédant `code` (ISO 2), `name`, `phone_code` (ex: `+229`), `currency` et `is_active` (booléen).
- **PhoneContact**: Donnée téléphonique formatée au standard international normalisé E.164 ou avec espace lisible (`+229 97 00 00 00`).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% des formulaires comportant un champ téléphone utilisent le composant unifié `PhoneInput`, avec 0 champ `<input type="tel">` isolé restant dans le code source.
- **SC-002**: L'indicatif s'ajuste automatiquement selon la liste des pays actifs retournée par le backend en moins de 300 ms.
- **SC-003**: 0 erreur console JavaScript (`Cannot read properties of undefined`) lors de la navigation et de la sélection d'auteurs sur `/legal-reviewer/contracts/new`.
- **SC-004**: L'accessibilité et la réactivité mobile sont assurées avec une zone tactile minimale de 44px sur tous les écrans d'au moins 375px de large.

---

## Assumptions

- Les pays gérés par défaut couvrent l'espace UEMOA/Afrique francophone (Bénin, Togo, Côte d'Ivoire, Sénégal, Niger, Burkina Faso, Mali, Guinée, Cameroun, Gabon, Congo, France) avec repli local si le réseau est déconnecté.
- Le formatage envoyé aux APIs backend reste une chaîne de caractères universelle incluant l'indicatif (ex: `+229 97000000`).
- Les composants de formulaires existants exposent une fonction de mise à jour d'état de type `(value: string) => void`.
