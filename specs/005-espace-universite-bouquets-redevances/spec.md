# Feature Specification: Module 5 - Espace Université (Portail Établissement Partenaire)

**Feature Branch**: `005-espace-universite-bouquets-redevances`  
**Created**: 2026-08-20  
**Status**: Ready for Implementation  
**Source Métier**: Cahier des charges LAHAThèque v3.2 — Sections 4.1.6, 4.1.C, 4.2, 4.3, 7, 10, 11, 12

---

## 1. Périmètre & Rôle Métier

L'**Espace Université** est un portail **partenaire externe** (Section 4.1 du cahier des charges). Il est destiné aux équipes de l'établissement partenaire lui-même (Rectorat, Direction des Affaires Académiques, Service de la Scolarité et des Ressources Documentaires de l'UAC, de l'UNA, de Parakou, de l'UCAD, etc.).

### Règle d'Isolation Stricte
Chaque université connectée accède de manière **strictement étanche et confidentielle** à ses seules données :
- Ses propres facultés / UFRs (ex: FADESP, FSS, FASEG, FAST, FLASH).
- Ses propres statistiques d'usage et de consultation par ses étudiants et enseignants.
- Ses propres abonnements aux bouquets documentaires numériques.
- Ses propres commandes de livres papier pour équiper ses bibliothèques de campus.
- Ses propres redevances de 15% cumulées sur les ventes de ses ouvrages et ses demandes de versement.
- La validation des affiliations de ses étudiants (sur la base du **matricule académique** et du **justificatif d'inscription/carte d'étudiant**, sans supposer d'adresse e-mail institutionnelle `@uac.bj` inexistante pour les étudiants en Afrique).

*(Note : La gestion globale et le monitoring de l'ensemble des universités par l'équipe interne de LAHA relèvent exclusivement du dashboard `admin`).*

---

## 2. User Scenarios & Acceptance Criteria (Gherkin)

### User Story 1 — Consultation de ses Propres Statistiques par Faculté & Discipline (Priorité: P1)
En tant qu'université partenaire connectée, je veux consulter les statistiques réelles d'utilisation de mes étudiants ventilées par faculté et par discipline, afin d'adapter les acquisitions de notre établissement.

```gherkin
Scenario: L'université consulte ses métriques d'usage
  Given L'Université d'Abomey-Calavi (UAC) est connectée sur son portail
  When Le responsable consulte les statistiques de la Faculté de Droit (FADESP)
  Then Le tableau affiche uniquement les données de l'UAC : 14 250 consultations, 82 400 pages lues
  And Les données des autres universités (UCAD, Parakou, etc.) ne sont jamais visibles
```

---

### User Story 2 — Souscription & Export Word de Bouquets Documentaires (Priorité: P1)
En tant qu'université partenaire, je veux souscrire à des bouquets documentaires pour donner un accès numérique à nos étudiants et exporter la liste officielle des livres en Word / PDF.

```gherkin
Scenario: Souscription et export du catalogue
  Given L'université consulte les bouquets disponibles (ex: Bouquet Sciences Juridiques & Politiques)
  When Elle clique sur "Souscrire au Bouquet"
  Then Le bouton affiche un spinner de chargement et le statut passe à "Actif"
  And Un toast Sonner confirme "Bouquet souscrit avec succès pour votre établissement"
  And Le bouton "Exporter en Word (DOCX)" télécharge la liste bibliographique officielle
```

---

### User Story 3 — Commande de Livres Papier pour les Bibliothèques de Faculté (Priorité: P1)
En tant qu'université partenaire, je veux commander des exemplaires papier en gros ou par bouquet pour approvisionner les bibliothèques physiques de nos campus.

```gherkin
Scenario: Commande d'ouvrages papier pour la bibliothèque centrale
  Given L'université sélectionne 50 exemplaires du "Précis de Droit Administratif"
  When Elle valide la commande avec l'adresse de livraison "Bibliothèque Centrale Campus Calavi"
  Then Le bon de commande PDF est généré et le statut passe à "En préparation"
  And Un suivi d'expédition avec transporteur est disponible
```

---

### User Story 4 — Suivi et Versement de la Redevance Universitaire de 15% (Priorité: P1)
En tant qu'université partenaire, je veux suivre le cumul de nos 15% de redevance sur les ventes de nos ouvrages et demander un versement sur notre compte bancaire / Mobile Money.

```gherkin
Scenario: Demande de versement des redevances
  Given Le solde de redevance disponible est de 1 250 000 XOF (seuil minimal : 100 000 XOF)
  When L'université clique sur "Demander le versement des redevances"
  Then Une demande "REQ-ROY-UNIV-2026-04" est enregistrée avec le statut "En cours de traitement"
  And Un toast Sonner confirme la transmission du dossier à la comptabilité LAHA
```

---

### User Story 5 — Validation des Affiliations Étudiants par Matricule & Carte (Priorité: P1)
En tant qu'université partenaire, je veux valider les demandes d'accès des étudiants inscrits dans nos facultés sur présentation de leur matricule et carte d'étudiant, sans exiger d'e-mail institutionnel.

```gherkin
Scenario: Approbation d'un étudiant par son matricule et sa faculté
  Given Une demande d'affiliation est en attente pour l'étudiant "Koffi MENSAH" (Matricule: "2024-UAC-10492", Faculté: FADESP, Email: "koffimensah@gmail.com")
  When Le gestionnaire clique sur "Approuver l'affiliation"
  Then Le statut passe à "Affilié & Actif" et l'étudiant bénéficie immédiatement des bouquets de l'université
  And Un toast Sonner confirme la validation
```

---

## 3. Matrice de Feedback Visuel & Intuitivité

1. **Zéro Émoji** : Utilisation exclusive des icônes vectorielles Lucide React.
2. **Indicateurs de Chargement Systématiques** : Tout bouton asynchrone passe immédiatement en `disabled={loading}` avec un spinner vectoriel.
3. **Toasts Sonner** : Feedback immédiat de succès ou d'erreur sur chaque opération.
4. **Squelettes de Chargement (Skeletons)** : Aucun layout shift lors du chargement des tables et des graphiques.
5. **Prévisualisation Liseuse** : Bouton direct vers `/catalog/reader/[id]` sur chaque ouvrage.
6. **Pagination Active** : `DataTable` avec `pageSize={10}` sur tous les tableaux.
