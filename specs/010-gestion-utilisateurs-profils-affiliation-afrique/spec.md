# Feature Specification: Module 10 - Gestion des Comptes, Profils et Accès par Rôle (LAHAThèque v3.2)

**Feature Branch**: `010-gestion-utilisateurs-profils-affiliation-afrique`  
**Created**: 2026-08-20  
**Status**: Approved & Aligned  
**Source Métier**: Cahier des charges LAHAThèque v3.2 (Section 4.1, 4.2, 4.3, Tableau Synthèse des accès par rôle).

---

## 1. Analyse Précise du Cahier des Charges & Réponses Claires

### 1.1. L'Élève / Client est-il obligatoirement rattaché à une Université ?
**Non, le rattachement n'est pas obligatoire pour créer un compte.**  
Dans le cahier des charges (Section 4.1, Rôle 8 « CLIENTS (LECTEURS / ÉTUDIANTS) ») :
- Tout client/étudiant peut créer son compte librement en auto-inscription.
- Il peut acheter des livres à l'unité (numérique ou papier), lire des extraits gratuits, ou souscrire à un abonnement individuel sans dépendre d'une université.
- Le rôle **« UNIVERSITÉS »** (Section 4.1, Rôle 6) est un partenaire qui achète des **bouquets institutionnels** pour mettre à disposition des packs d'ouvrages à ses étudiants/enseignants.
- L'étudiant peut donc soit être un **client individuel autonome**, soit lier son compte à son université pour bénéficier des bouquets déjà payés par son établissement.

### 1.2. Données Minimales et Efficaces pour l'Auteur
Conformément aux directives :
- **Nom et Prénom** (état civil).
- **Numéro de téléphone** (avec indicatif pays africain ex: +229, +225, +221...).
- **Adresse email** et mot de passe.
- Pas d'identifiant ORCID obligatoire.
- Pas de compte bancaire obligatoire à l'inscription (les coordonnées de paiement de redevance sont renseignées ultérieurement lors de la signature du contrat avec le Juriste).
- Photo de profil (optionnelle mais disponible).

---

## 2. Typologie des Créations de Comptes par Rôle

### 2.1. Comptes en Auto-Inscription Publique (Formulaire Web)

1. **Client / Lecteur / Étudiant (Rôle `student`) :**
   - Nom, Prénom.
   - Email, Mot de passe.
   - Numéro de téléphone (avec indicatif pays).
   - Photo de profil (optionnelle).
   - Université / Établissement (optionnel : sélectionnable si l'étudiant souhaite activer les bouquets de son université).

2. **Auteur (Rôle `author`) :**
   - Nom, Prénom.
   - Email, Mot de passe.
   - Numéro de téléphone (avec indicatif pays).
   - Photo de profil (optionnelle).
   - Biographie courte (optionnelle).

---

### 2.2. Comptes Créés Exclusivement par l'Administrateur (Back-Office Admin)

Ces comptes correspondent aux fonctions internes de LAHA Éditions ou aux partenaires institutionnels :

1. **Utilisateurs Internes :**
   - `maquettiste` : Dépôt de fichiers PAO (PDF, EPUB, Audio) et saisie des métadonnées.
   - `chef_maquettiste` : Examen, validation et mise en ligne automatique du catalogue, ou rejet avec motif.
   - `juriste` : Référencement des contrats, taux de redevances et relances d'impayés.
   - `gestionnaire_stock` : Gestion des stocks physiques papier et suivi des expéditions de livraison.
   - `super_admin` : Gestion globale, tarification et configuration de la plateforme.

2. **Partenaires Institutionnels :**
   - `bibliothecaire` : Gestion des bouquets achetés par son université et suivi des consultations de son établissement.
   - `editeur_tiers` : Dépôt d'ouvrages partenaires via interface ou flux ONIX 3.0.
   - `grossiste` : Commandes groupées et achats en gros avec remises volumétriques.

- **Processus de Création Admin :**
  - Formulaire `/admin/users` : Nom, Prénom, Email, Téléphone, Rôle assigné, Institution de rattachement (si bibliothécaire/éditeur).
  - Génération d'un mot de passe temporaire ou lien sécurisé d'activation envoyé par email/SMS.

---

## 3. Spécifications du Workflow « Chef Maquettiste »

Le Chef Maquettiste assure la validation finale et la mise en ligne du catalogue :
1. **File d'Attente (`/chief-layout`)** : Liste des dépôts en attente soumis par les maquettistes.
2. **Inspection Technique (`/chief-layout/validation/[id]`)** :
   - Vérification de la couverture HD.
   - Contrôle du fichier PDF/EPUB de maquette.
   - Contrôle des métadonnées (titre, auteur, discipline, faculté, université, pays, langue, résumé IA).
   - Contrôle des fichiers audio associés (si livre audio).
3. **Validation & Mise en Ligne Immédiate** :
   - Action atomique passant le dépôt à `valide`.
   - Création de l'entité `Ouvrage` avec `is_published = True`.
   - Application de la configuration DRM par défaut (`ProtectionConfig`).
   - Publication instantanée sur la vitrine publique ([`/catalog`](file:///e:/Lahatheque/lahatheque-frontend/app/%28public%29/catalog/page.tsx)).
4. **Rejet avec Motif Obligatoire** :
   - Statut `rejete` avec enregistrement du motif explicite pour guider le maquettiste dans ses corrections.

---

## 4. Exigences Fonctionnelles Clés (FR)

- **FR-001** : Formulaire d'auto-inscription simple pour Client et Auteur (Nom, Prénom, Email, Téléphone, Mot de passe).
- **FR-002** : Gestion du profil utilisateur avec mise à jour des coordonnées et photo de profil.
- **FR-003** : Écran d'administration `/admin/users` permettant à l'Admin de créer, modifier, suspendre ou supprimer les comptes de tous les rôles.
- **FR-004** : Affiliation universitaire optionnelle pour les étudiants souhaitant lier leur compte à une université partenaire (saisie de matricule ou code coupon bouquet).
- **FR-005** : Espace Chef Maquettiste avec file d'attente, prévisualisation complète et publication instantanée sur le catalogue public.
- **FR-006** : Zéro code couleur hexadécimal en dur dans les composants et zéro emoji dans le code et les messages.

---

## 3. Workflow Spécifique : Chef Maquettiste (Validation & Mise en Ligne du Catalogue)

### 3.1. Rôle et Responsabilités du Chef Maquettiste
Le Chef Maquettiste est le garant de la qualité éditoriale, visuelle et technique de tout livre avant sa publication sur la vitrine publique de LAHAThèque.

### 3.2. Scénarios Utilisateur & Parcours Fonctionnels

#### User Story 1 - Tableau de Bord et File d'Attente de Validation (Priorité: P1)
En tant que Chef Maquettiste connecté, je veux consulter la liste des maquettes soumises par les maquettistes classées par ordre antichronologique avec indicateur de statut (`en_attente`, `rejete`, `valide`), afin d'identifier immédiatement les ouvrages prêts à être examinés.

- **Critères d'Acceptation :**
  - Affichage des cartes/lignes de maquettes avec : Titre, Auteur, Maquettiste assigné, Date de soumission, Nombre de pages, Discipline, Langue, Pays.
  - Filtres par Maquettiste, par Discipline, par Date et par Présence de pistes audio.
  - Statistiques en en-tête : Total en attente, Validés ce mois-ci, Taux d'approbation, Temps moyen de revue.

#### User Story 2 - Écran de Prévisualisation et d'Inspection Technique (Priorité: P1)
En tant que Chef Maquettiste, je veux inspecter en détail un dépôt de livre avant validation :
1. Vérification de la Couverture HD (dimensions, lisibilité du titre et du nom de l'auteur).
2. Feuilletage du Document PDF/EPUB de contrôle avec filigrane provisoire d'épreuve.
3. Contrôle des métadonnées enrichies par l'IA (Résumé, Disciplines, Faculté, Université, Langue, Pays, Mots-clés).
4. Écoute des pistes audio attachées (si livre audio).

#### User Story 3 - Validation et Publication Automatique Instantanée (Priorité: P1)
En tant que Chef Maquettiste, lorsque j'approuve un dépôt conforme, le système doit :
1. Passer le statut du dépôt à `valide`.
2. Créer transactionnellement l'enregistrement officiel `Ouvrage` dans le catalogue avec `is_published = True`.
3. Générer la configuration de protection DRM par défaut (`ProtectionConfig`).
4. Rendre l'ouvrage immédiatement visible et achetable sur la vitrine publique ([`http://localhost:3000/catalog`](http://localhost:3000/catalog)).
5. Envoyer une notification interne au maquettiste ayant soumis l'ouvrage.

#### User Story 4 - Rejet avec Motif Obligatoire et Demande de Correction (Priorité: P1)
En tant que Chef Maquettiste, si une maquette comporte des anomalies (ex: texte tronqué, couverture basse définition, ISBN erroné), je veux rejeter la soumission en rédigeant un commentaire explicatif obligatoire.
- Le statut passe à `rejete`.
- Le motif est horodaté et associé au dépôt.
- Le maquettiste reçoit la notification et peut éditer sa soumission pour renvoyer une nouvelle version corrigée sans repartir de zéro.

---

## 4. Exigences Fonctionnelles Détaillées (FR)

### Module Gestion des Utilisateurs & Profils
- **FR-AUTH-001** : Le formulaire d'auto-inscription publique permet de choisir entre les rôles `student` (Lecteur/Étudiant) et `author` (Auteur).
- **FR-AUTH-002** : L'inscription exige un numéro de téléphone valide avec sélection obligatoire de l'indicatif pays international (+229, +225, +221, +228, +227, etc.).
- **FR-AUTH-003** : Le profil utilisateur permet le téléversement et le recadrage d'une photo de profil (avatar) stockée sur Cloudflare R2 avec URL sécurisée.
- **FR-AUTH-004** : Le profil Auteur comporte les champs obligatoires : nom de plume, biographie, ORCID, téléversement de la pièce d'identité (CNI/Passeport) et sélection du mode de versement des redevances (Mobile Money ou Virement Bancaire).
- **FR-AUTH-005** : L'Administrateur dispose d'un écran de création de comptes privilégiés (`maquettiste`, `chef_maquettiste`, `juriste`, `gestionnaire_stock`, `bibliothecaire`, `editeur_tiers`, `grossiste`) avec génération d'identifiants temporaires et envoi d'email d'activation.
- **FR-AUTH-006** : L'Administrateur peut suspendre ou révoquer un utilisateur en un clic, entraînant la déconnexion immédiate et la révocation de toutes ses sessions actives.

### Module Affiliation Universitaire en Contexte Africain
- **FR-AFFIL-001** : Le profil étudiant propose une section "Affiliation Universitaire" permettant de sélectionner son établissement parmi les universités partenaires configurées.
- **FR-AFFIL-002** : Le système permet au Bibliothécaire d'importer un fichier CSV de matricules étudiants par année académique.
- **FR-AFFIL-003** : Si le matricule saisi par l'étudiant correspond à un matricule de la base de son université, l'affiliation passe instantanément au statut `affilie` sans intervention humaine.
- **FR-AFFIL-004** : Si l'étudiant ne dispose pas de matricule pré-chargé, il peut téléverser la photo de sa carte d'étudiant ou de son attestation de scolarité. L'affiliation passe au statut `en_attente_validation`.
- **FR-AFFIL-005** : Le tableau de bord Bibliothécaire (`/librarian/affiliations`) affiche la liste des demandes en attente avec visualisation de la carte d'étudiant et boutons d'approbation / rejet avec motif.
- **FR-AFFIL-006** : Le système supporte la saisie de "Codes Coupons Bouquets" permettant à tout étudiant de débloquer instantanément les droits de lecture d'une collection universitaire.
- **FR-AFFIL-007** : Le middleware de consultation vérifie les plages d'adresses IP campus configurées pour l'université pour accorder l'accès libre aux postes du campus.

### Module Chef Maquettiste
- **FR-CHEF-001** : Le tableau de bord `/chief-layout` liste toutes les maquettes soumises par les maquettistes avec statut de validation et pagination standardisée.
- **FR-CHEF-002** : La page de détail `/chief-layout/validation/[id]` permet l'inspection visuelle du PDF/EPUB, de la couverture HD, des fichiers audio et des métadonnées classifiées par l'IA.
- **FR-CHEF-003** : L'action de validation (`POST /api/v1/catalog/deposits/[id]/validate/`) est atomique : elle passe le dépôt en `valide`, crée l'ouvrage dans le catalogue et active sa publication publique.
- **FR-CHEF-004** : L'action de rejet (`POST /api/v1/catalog/deposits/[id]/reject/`) exige un champ `motif_rejet` non vide d'au moins 10 caractères.

---

## 5. Critères de Succès et Indicateurs de Performance (SC)

- **SC-001** : 100% des étudiants inscrits avec un matricule valide pré-chargé obtiennent l'accès à leur bouquet universitaire en moins de 3 secondes sans intervention administrative.
- **SC-002** : Les bibliothécaires universitaires peuvent traiter et valider une demande d'affiliation par carte d'étudiant en moins de 30 secondes.
- **SC-003** : Dès la validation par le Chef Maquettiste, l'ouvrage est visible, indexé et achetable sur la vitrine publique en moins de 500 ms.
- **SC-004** : 100% des auteurs enregistrent leurs coordonnées Mobile Money ou IBAN et leur pièce d'identité avant de soumettre leur premier manuscrit.
- **SC-005** : Zéro code couleur hexadécimal en dur dans les composants frontend et zéro emoji dans le code, les logs et les messages d'erreur.
