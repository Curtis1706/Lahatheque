# Feature Specification: Module 4 - Espace Éditeur Tiers, Dépôt de Catalogue & Synchronisation ONIX

**Feature Branch**: `004-depot-editeurs-tiers-onix`  
**Created**: 2026-08-20  
**Status**: Ready for Implementation  
**Source Métier**: Cahier des charges LAHAThèque v3.2 - Section 5 (Éditeurs Tiers : Espace Dédié, Dépôt Unitaire/Masse ONIX 3.0, API REST, Validation 5 Étapes, Redevances & Sécurité)  
**Règles de Design & Intuitivité**: `.agents/AGENTS.md` (Zéro emoji, Lucide React exclusif, tokens sémantiques `bg-navy`, `bg-gold`, feedback visuel permanent par toasts, skeletons et spinners d'attente sur boutons).

---

## 1. Résumé Exécutif & Objectif Produit

L'**Espace Éditeur Tiers** permet aux maisons d'édition partenaires académiques et professionnelles de valoriser et commercialiser leur catalogue sur la vitrine LAHAThèque tout en conservant une traçabilité totale et une protection DRM étanche.

### Objectifs Principaux :
1. **Dépôt Unitaire & Formulaire Assisté** : Téléversement d'épreuves numériques (PDF, EPUB, Audio) avec qualification rigoureuse des métadonnées (titres, sous-titres, ISBNs, DOI, auteurs & ORCID, classification thématique, territoires autorisés, dates d'embargo).
2. **Import de Catalogue en Masse (ONIX 3.0, CSV, ZIP)** : Téléversement et ingestion automatisée avec parsing conforme aux spécifications EDItEUR ONIX 3.0 et génération d'un rapport de validation détaillé ligne par ligne.
3. **Synchronisation Programmatique (API REST & Webhooks)** : Gestion autonome des clés d'API (Client ID / Client Secret), révocation instantanée et monitoring des requêtes automatisées.
4. **Suivi du Workflow de Validation en 5 Étapes** :
   - *Étape 1* : Dépôt effectué
   - *Étape 2* : Contrôle technique automatisé (antivirus, intégrité PDF/EPUB, complétude des métadonnées)
   - *Étape 3* : Examen éditorial par le comité de lecture LAHA Éditions
   - *Étape 4* : Notification d'approbation ou de demande de correction motivée
   - *Étape 5* : Publication effective sur la vitrine et monétisation
5. **Relevés Financiers & Redevances Contractuelles** : Suivi des ventes et consultations, application automatique du taux de redevance contractuel (fixé au contrat de mandat), téléchargement des états de paiement certifiés.
6. **Protection & Traçabilité DRM** : Configuration du tatouage visible/invisible personnalisé, DRM Readium LCP, limitation des appareils et monitoring des logs d'accès.
7. **Profil Entreprise & Facturation** : Gestion de la raison sociale, RCCM, NIF, coordonnées bancaires pour reversement, téléphone d'astreinte et sécurité du compte.

---

## 2. User Scenarios & Critères d'Acceptation (Gherkin)

### User Story 1 — Dépôt Unitaire d'Ouvrage avec Métadonnées et Protection (Priorité: P1)
**En tant que** responsable éditorial d'une maison d'édition partenaire,  
**Je veux** soumettre un nouvel ouvrage via un formulaire structuré en étapes avec fichier numérique et couverture,  
**Afin de** le soumettre au circuit de validation officiel de LAHA Éditions.

#### Critères d'Acceptation :
- **Given** un éditeur tiers connecté à son espace,
- **When** il téléverse le fichier PDF/EPUB et la couverture haute définition, puis renseigne les ISBN (papier et numérique), auteurs, discipline, prix et territoires autorisés,
- **And** clique sur "Soumettre au comité éditorial",
- **Then** un indicateur d'attente animé (spinner) s'affiche sur le bouton d'action qui est désactivé pendant le transfert,
- **And** un toast de succès confirme le dépôt,
- **And** le statut de l'ouvrage passe à `pending` avec l'étape 1 validée sur la timeline.

---

### User Story 2 — Import de Catalogue en Masse via Flux ONIX 3.0 / ZIP (Priorité: P1)
**En tant que** gestionnaire de catalogue d'un grand éditeur partenaire,  
**Je veux** déposer un fichier XML standardisé ONIX 3.0 ou une archive ZIP,  
**Afin de** synchroniser des dizaines d'ouvrages simultanément sans saisie manuelle unitaire.

#### Critères d'Acceptation :
- **Given** un fichier XML conforme à la norme ONIX 3.0 Release 3.0.8,
- **When** l'utilisateur glisse-dépose le fichier dans la zone d'importation,
- **Then** une barre de progression simule l'analyse syntaxique en temps réel,
- **And** un rapport structuré affiche le nombre de notices validées et le détail des anomalies éventuelles (ISBN manquant, balise invalide, prix absent),
- **And** un toast de notification informe de la fin du traitement.

---

### User Story 3 — Gestion des Clés API et Synchronisation Programmatique (Priorité: P2)
**En tant que** développeur technique d'un éditeur partenaire,  
**Je veux** générer et révoquer des identifiants API (Client ID et Client Secret),  
**Afin d'**intégrer notre progiciel ERP/GED directement avec l'API REST de LAHAThèque.

#### Critères d'Acceptation :
- **Given** un éditeur souhaitant automatiser ses dépôts,
- **When** il clique sur "Générer une nouvelle clé API",
- **Then** une modale affiche le Client Secret en clair une seule fois avec bouton de copie dans le presse-papier et feedback par toast,
- **And** toute action de révocation exige une confirmation explicite dans une modale modale sécurisée avant désactivation.

---

### User Story 4 — Suivi des Redevances et Relevés Financiers (Priorité: P1)
**En tant que** directeur financier d'un éditeur partenaire,  
**Je veux** consulter les ventes générées par mes ouvrages et le montant de mes redevances nettes,  
**Afin de** vérifier mes reversements mensuels et télécharger les relevés de compte certifiés.

#### Critères d'Acceptation :
- **Given** des ventes enregistrées sur la période,
- **When** l'éditeur consulte l'onglet "Droits & Redevances",
- **Then** le taux contractuel négocié (ex: 22%) est affiché en lecture seule avec le calcul exact de la part éditeur,
- **And** un tableau liste les règlements passés avec lien de téléchargement du bordereau PDF,
- **And** un bouton permet de demander un virement si le seuil minimum de reversement (50 000 XOF) est atteint.

---

### User Story 5 — Profil Maison d'Édition, Mandat & Coordonnées Bancaires (Priorité: P1)
**En tant que** gérant de la maison d'édition,  
**Je veux** actualiser nos coordonnées d'entreprise (NIF, RCCM, IBAN, contact d'astreinte),  
**Afin de** garantir la conformité juridique de nos contrats et la réception des paiements.

#### Critères d'Acceptation :
- **Given** la page `/publisher/profile`,
- **When** l'éditeur met à jour ses identifiants fiscaux et coordonnées bancaires et valide le formulaire,
- **Then** un spinner s'affiche sur le bouton de sauvegarde,
- **And** un toast de confirmation s'affiche dès la persistance des données.

---

## 3. Traque des Non-Dits et Cas Limites (Clarify)

1. **Doublons d'ISBN Trans-Éditeurs** : Si un ISBN existe déjà pour un autre éditeur dans la base LAHAThèque, l'import est immédiatement bloqué avec message explicite renvoyant vers le support légal.
2. **Gestion des Embargos Temporels** : Un ouvrage validé ayant une date de disponibilité future reste masqué au public jusqu'à la date convenu, avec badge informatif *En embargo jusqu'au JJ/MM/AAAA*.
3. **Multi-Devises et Territoires** : Si un territoire est exclu, le système applique un géoblocage strict sur la vitrine et le lecteur DRM.
4. **Intuitivité & Zéro Clic Silencieux** : Toute requête réseau asynchrone (soumission, filtre, génération de clé, export CSV/PDF) affiche un feedback immédiat (spinner sur bouton, skeleton sur table, toast d'information).

---

## 4. Exigences Fonctionnelles (FR)

- **FR-PUB-01** : Protection de l'espace par `AuthGuard` sur le rôle `publisher`.
- **FR-PUB-02** : Vue d'ensemble avec 4 KPI cards (Titres catalogue, Validations en cours, Ventes/Consultations, Redevances cumulées).
- **FR-PUB-03** : Catalogue avec recherche multicritère, filtres par statut et discipline, et fiches détaillées avec visualiseur 3D.
- **FR-PUB-04** : Formulaire multi-étapes de dépôt unitaire avec glisser-déposer de fichiers et indicateurs de complétude.
- **FR-PUB-05** : Interface d'import par lots (ONIX 3.0 / CSV / ZIP) avec rapport syntaxique d'erreurs.
- **FR-PUB-06** : Gestion des clés API REST (génération sécurisée, copie presse-papier, révocation avec modale).
- **FR-PUB-07** : Journal d'audit et de traçabilité DRM (accès, appareils, consultations).
- **FR-PUB-08** : Relevés de redevances certifiés et demande de virement.
- **FR-PUB-09** : Profil complet d'entreprise avec NIF, RCCM, coordonnées bancaires et changement de mot de passe.

---

## 5. Critères de Succès Mesurables (SC)

- **SC-001** : 100% des flux d'action disposent d'un feedback visuel (spinner d'attente ou skeleton de chargement).
- **SC-002** : Zéro code couleur hexadécimal en dur dans les composants.
- **SC-003** : Zéro emoji sur l'ensemble des pages et modales.
- **SC-004** : Ergonomie mobile validée pour toutes largeurs d'écran dès 360px.
