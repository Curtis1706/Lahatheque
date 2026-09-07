# Feature Specification: Détail des Redevances par Ouvrage, Déduction des Retraits & Export PDF Auteur

**Feature Branch**: `020-redevances-detail-ouvrages-solde`

**Created**: 2026-09-07

**Status**: Ready for Planning

**Input**: User description: "je pense qu'ici c'est à revoir, il doit voir le livre vendu dans le tableau, book cover et tout, le nombre d'achat la redevance à prendre, supposant y a eu trois vente et il prend 1000 au total , puis il a fait une demande de versement, supposons la demande soit en attente ou payer, à la quatrième commanque qui va lui générer des redevances, supposons lui a généré 300 , s'il fais une demande de versement, ce sera que de 300 et non de 1399, on est d'accord ? bon de toute façon les auteurs sont payés de façon trimestrielle. même dans le pdf on doit voir bien listé le livre, le nombre de vente, nette à recevoir et etc /speckit-specify /speckit-clarify on garde la data table et on opte pour des lignes pliableset dépliables"

## Clarifications

### Session 2026-09-07
- Q: Comment afficher le détail des livres vendus sous chaque trimestre dans l'interface ? → A: Conserver le composant DataTable existant et ajouter des lignes pliables et dépliables (expandable rows avec chevron), sans modal ni tiroir externe.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Détail des Ouvrages Vendus dans les Lignes Dépliables de la DataTable (Priority: P1)

En tant qu'auteur consultant mon relevé trimestriel de redevances sur `/author/royalties`,
Je veux pouvoir cliquer sur un bouton d'expansion (chevron) sur la ligne d'un trimestre dans la DataTable existante pour déplier directement sous cette ligne la liste complète des livres vendus (avec couverture, titre, formats achetés, quantités, CA brut, taux et redevance nette),
Afin de comprendre immédiatement et sans changer de page ni ouvrir de modale d'où provient ma rémunération.

**Why this priority**:
Actuellement, la DataTable n'affiche qu'une ligne agrégée par trimestre sans aucun détail des livres vendus. L'auteur ne peut pas vérifier quel livre a généré quelle part de ses gains.

**Independent Test**:
Accéder à `/author/royalties`. Dans l'onglet "Relevés Trimestriels", chaque ligne de trimestre comporte un chevron. Cliquer sur le chevron : la ligne se déplie avec animation fluide et affiche la sous-table intégrée listant chaque livre vendu avec sa miniature de couverture, son titre, son volume de ventes (papier/numérique/audio), son CA brut et sa redevance nette associée. Cliquer à nouveau : la ligne se replie.

**Acceptance Scenarios**:
1. **Given** un auteur ayant 2 ouvrages vendus au 3ème trimestre 2026 (ex: "Aplicação de Agentes Remineralizantes" et "Agile : Les Fondamentaux"),
   **When** l'auteur clique sur le chevron de la ligne du 3ème trimestre,
   **Then** la ligne se déplie et affiche les 2 livres avec leur couverture, leur nombre de ventes respectif (1 num. pour le 1er, 2 papier + 1 num. pour le 2nd) et le sous-total de redevances correspondant à chacun (500 XOF et 1 050 XOF).
2. **Given** un affichage sur mobile (écran < 1024px),
   **When** l'auteur consulte la carte trimestrielle,
   **Then** la carte intègre également la section dépliable affichant la liste des livres vendus adaptée au format mobile.
3. **Given** un trimestre sans aucune vente,
   **When** l'auteur déplie la ligne,
   **Then** un état vide clair indique qu'aucun livre n'a été vendu sur ce trimestre.

---

### User Story 2 - Déduction Stricte des Retraits dans le Solde Disponible Retirable (Priority: P1)

En tant qu'auteur ou système financier LAHAThèque,
Je veux que toute demande de versement (qu'elle soit en attente de traitement bancaire ou déjà réglée) soit immédiatement déduite du solde disponible pour les retraits suivants,
Afin d'empêcher formellement les doubles retraits sur des redevances déjà demandées ou déjà virées.

**Why this priority**:
La sécurité et la justesse comptable de la plateforme sont critiques : si un auteur gagne 1 000 XOF et demande 1 000 XOF, son solde retirable doit tomber immédiatement à 0 XOF. Si une 4ème commande lui génère 300 XOF, son nouveau solde retirable doit être de 300 XOF et en aucun cas de 1 300 XOF.

**Independent Test**:
Créer une demande de versement égale au montant total acquis. Vérifier que le solde disponible retirable devient 0 XOF et que le bouton ou formulaire de versement bloque toute demande excédentaire. Simuler une nouvelle vente générant 300 XOF : vérifier que le solde retirable passe exactement à 300 XOF.

**Acceptance Scenarios**:
1. **Given** un auteur ayant acquis 1 000 XOF de redevances cumulées,
   **When** il soumet une demande de versement de 1 000 XOF (statut "pending"),
   **Then** le solde en attente de retrait autorisé devient 0 XOF.
2. **Given** une demande antérieure de 1 000 XOF en attente ou payée, et une nouvelle vente survenant rapportant 300 XOF de redevance,
   **When** l'auteur ouvre la modale "Demander un Versement",
   **Then** le montant maximal autorisé est strictement de 300 XOF.
3. **Given** une demande de versement rejetée administrativement par la comptabilité,
   **When** le statut passe à "rejected",
   **Then** le montant correspondant est réintégré automatiquement dans le solde disponible retirable de l'auteur.

---

### User Story 3 - Bordereau PDF Trimestriel avec Décompte par Livre (Priority: P2)

En tant qu'auteur téléchargeant mon bordereau officiel de redevances PDF,
Je veux que le document PDF certifié contienne un tableau exhaustif détaillant chaque livre vendu, les quantités par format, le CA brut, le taux de redevance et le montant net à percevoir, ainsi qu'un récapitulatif des retraits et du net restant,
Afin d'avoir une pièce comptable et fiscale officielle opposable.

**Why this priority**:
Le bordereau PDF actuel est générique et n'identifie aucun livre. Il ne répond pas aux exigences légales de justification des droits d'auteur de l'édition.

**Independent Test**:
Cliquer sur "Relevé Trimestriel" sur une ligne de trimestre. Ouvrir le PDF généré : vérifier la présence du tableau récapitulatif par livre avec titres, quantités, taux et montants nets calculés.

**Acceptance Scenarios**:
1. **Given** un relevé contenant plusieurs livres vendus,
   **When** l'auteur clique sur "Relevé Trimestriel",
   **Then** le document PDF officiel présente un tableau des ouvrages vendus avec titre de l'ouvrage, format, exemplaires vendus, CA brut, quote-part contractuelle et net à percevoir, suivi du total général trimestriel certifié.

---

### Edge Cases

- Que se passe-t-il si un livre a des ventes sur plusieurs formats (ex: 2 papier et 1 numérique) avec des taux différents (ex: 12% papier et 10% numérique) ? La ligne dépliée du livre affiche les lignes détaillées par format avec leurs taux et sous-totaux respectifs.
- Que se passe-t-il si une commande a été annulée ou remboursée ? Seules les commandes au statut de paiement "paid" et statut de commande non annulé sont comptabilisées dans le calcul des redevances.
- Que se passe-t-il si un auteur a des co-auteurs sur un ouvrage ? La quote-part de redevance nette affichée pour l'auteur connecté correspond strictement à son pourcentage personnel (défini dans RepartitionDroits / AuthorRight).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système MUST agréger les relevés de redevances par trimestre calendaire (T1: Janv-Mars, T2: Avr-Juin, T3: Juil-Sept, T4: Oct-Déc) en associant à chaque trimestre la liste détaillée de tous les ouvrages vendus durant cette période.
- **FR-002**: Pour chaque ouvrage vendu dans un relevé trimestriel, le système MUST fournir les données suivantes : identifiant de l'ouvrage, titre, miniature de couverture (cover_url), ISBN, discipline, nombre de ventes total, ventilation par format (numérique, papier, audio), chiffre d'affaires brut généré, taux de redevance contractuel applicable et redevance nette acquise par l'auteur.
- **FR-003**: Le composant partagé `DataTable` (`components/ui/data-table.tsx`) MUST supporter l'extension optionnelle `renderExpandedRow?: (row: T) => React.ReactNode` et gérer l'état d'ouverture/fermeture des lignes (`expandedRows`), avec un chevron interactif par ligne dans la vue desktop (table) et dans la vue mobile (cards).
- **FR-004**: La page `/author/royalties` MUST utiliser cette fonctionnalité de lignes pliables/dépliables pour afficher sous chaque ligne de trimestre la sous-table complète des livres vendus sans rechargement de page.
- **FR-005**: Le système financier MUST calculer le solde retirable disponible selon la formule stricte :
  `solde_disponible = total_redevances_acquises - sum(demandes_versement where status in ['pending', 'approved', 'processed'])`.
- **FR-006**: La modale de demande de versement (`AuthorPayoutModal`) MUST plafonner la saisie au `solde_disponible` réel et refuser toute soumission excédant ce solde.
- **FR-007**: Si une demande de versement est rejetée (`status='rejected'`), le montant correspondant MUST être immédiatement réintégré dans le solde disponible.
- **FR-008**: Le service de génération de document officiel PDF MUST intégrer dans le bordereau trimestriel le tableau détaillé de tous les livres vendus durant la période, incluant titre, formats, volumes vendus, taux appliqué et montant net revenant à l'auteur.
- **FR-009**: L'API backend `/api/v1/rights/author/royalties/` MUST retourner dans chaque élément de relevé un champ `books` contenant la liste enrichie des ouvrages vendus, calculée dynamiquement à partir des commandes réelles (`LigneCommande` payées).

### Key Entities

- **AuthorRoyaltyPayment (Relevé Trimestriel)** : Représente la consolidation comptable d'un trimestre calendaire. Attributs : période légale, trimestre, année, date de début, date de fin, volume total de ventes, CA brut global, redevance nette globale, statut de liquidation, date d'échéance de paiement, et liste des ouvrages associés (`books`).
- **AuthorRoyaltyBookItem (Ligne Ouvrage du Relevé)** : Représente la contribution spécifique d'un ouvrage au sein du trimestre. Attributs : identifiant de l'ouvrage, titre, URL de couverture, discipline, quantité vendue par format, chiffre d'affaires brut généré, taux de droits applicable, montant de redevance nette calculée.
- **PayoutRequest (Demande de Versement)** : Représente une demande de retrait initiée par l'auteur vers Mobile Money ou Banque. Attributs : auteur, montant demandé, mode de règlement, coordonnées de compte, statut (pending, approved, rejected, processed), date de création, référence de transaction.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% des ouvrages ayant généré des ventes sur un trimestre sont visibles avec leur couverture, volume et redevance dans les lignes dépliables de la DataTable.
- **SC-002**: L'écart entre le solde retirable affiché et `(redevances_acquises - demandes_en_cours_ou_payees)` est rigoureusement de 0 XOF dans 100% des cas de test.
- **SC-003**: 100% des bordereaux PDF générés pour un relevé trimestriel contiennent la liste nominative des ouvrages vendus avec quantités et montants détaillés.
- **SC-004**: Aucune régression sur le calendrier officiel de liquidation trimestrielle (virement programmé le 5 du mois suivant la fin du trimestre : 05 Avril, 05 Juillet, 05 Octobre, 05 Janvier).

## Assumptions

- Les redevances des auteurs sont acquises dès lors que la commande client est marquée avec le statut de paiement "paid" et non retournée/remboursée.
- Le calendrier réglementaire de liquidation des droits d'auteur de LAHAThèque est trimestriel civil (T1 à T4).
- La demande de versement direct reste accessible comme avance/acompte sur le solde disponible non encore demandé.
- Les taux de droits prioritaires sont ceux définis dans `RepartitionDroits` pour chaque ouvrage et auteur concerné.
