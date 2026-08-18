# Feature Specification: Module 2 - Gestion des Stocks et Livraisons (Gestionnaire)

**Feature Branch**: `002-gestion-stocks-livraisons`  
**Created**: 2026-08-18  
**Status**: In Review  
**Source Metier**: Cahier des charges LAHATheque v3.2 - Section 3 (Gestionnaire : Stock, Entrepots, Livraisons, Reassorts, Exports)

---

## 1. Resume Executif de la Fonctionnalite

Permettre au **Gestionnaire** de :
1. Suivre en temps reel les quantites disponibles pour les livres physiques (papier), par entrepot et par pays (Benin, Senegal, Cote d'Ivoire, Niger, Togo, Gabon, RDC, etc.).
2. Gerer les alertes automatiques de seuil bas et de rupture de stock (avec remontee automatique pour impacter la disponibilite a la vente sur la vitrine).
3. Enregistrer les mouvements de stock physiques (reassorts fournisseurs, entrees, sorties, retours, avaries et ajustements d'inventaire) avec tracabilite immuable.
4. Piloter l'expedition des commandes physiques : affectation d'un transporteur et d'un numero de suivi, suivi des etapes jusqu'a la livraison et notification automatique du client.
5. Exporter des rapports de stock et de livraison en formats Excel (`.xlsx`) et PDF.

---

## 2. User Scenarios & Acceptance Criteria (Prioritises)

### User Story 1 - Suivi des stocks multi-entrepots et alertes (Priorite: P1 - MVP)

En tant que Gestionnaire, je veux visualiser l'etat des stocks papier par pays et entrepot avec alertes visuelles sur les seuils critiques, afin de prevenir toute rupture de stock non anticipee.

**Scenarios d'acceptation** :
1. **Etant donne** un livre avec une quantite en stock inferieure ou egale au seuil d'alerte configure, **Quand** le gestionnaire consulte le tableau de bord, **Alors** la ligne apparait avec le badge d'alerte `seuil_bas`.
2. **Etant donne** un stock atteignant zero, **Quand** l'inventaire est mis a jour, **Alors** l'alerte `rupture` est declenchee et la commande papier de cet ouvrage est desactivee sur la vitrine publique.

---

### User Story 2 - Enregistrement des mouvements de stock et reassorts (Priorite: P1 - MVP)

En tant que Gestionnaire, je veux enregistrer une reception de reassort ou un retour client avec reference de document, afin de mettre a jour le stock physique de maniere atomique et verifiable.

**Scenarios d'acceptation** :
1. **Etant donne** une reception de 500 exemplaires dans l'entrepot de Cotonou, **Quand** le gestionnaire saisit le mouvement de type `reassort` avec le numero de bon de livraison, **Alors** la quantite reelle est incrementee de 500 et un enregistrement `MouvementStock` immuable est cree.
2. **Etant donne** une tentative de sortie de stock superieure a la quantite disponible, **Quand** le formulaire est soumis, **Alors** le systeme bloque l'operation avec un message d'erreur explicite sans alterer le solde.

---

### User Story 3 - Traitement et expedition des commandes (Priorite: P1 - MVP)

En tant que Gestionnaire, je veux associer un transporteur et un numero de suivi a une commande prete a expedier, afin de passer le statut a `en_cours_de_livraison` et notifier le client.

**Scenarios d'acceptation** :
1. **Etant donne** une commande au statut `a_expedier`, **Quand** le gestionnaire selectionne un transporteur (ex: DHL, Chronopost, transporteur local) et saisit le numero de suivi, **Alors** le statut passe a `expediee` et une notification d'expedition est declenchee vers le client.
2. **Etant donne** une commande livree au client, **Quand** la confirmation de livraison est enregistree, **Alors** le statut passe a `livree` et la date de livraison finale est horodatee.

---

### User Story 4 - Exportation des rapports de stock (Excel et PDF) (Priorite: P2)

En tant que Gestionnaire, je veux telecharger des etats de stocks et des rapports d'activite filtres par pays ou entrepot en formats Excel et PDF.

**Scenarios d'acceptation** :
1. **Etant donne** un filtre sur l'entrepot de Dakar, **Quand** le gestionnaire clique sur "Exporter Excel", **Alors** un fichier `.xlsx` bien formate avec les niveaux de stock, quantites reservees et seuils est genere et telecharge.

---

## 3. Traque des Non-Dits et Cas Limites (Etape Clarify)

1. **Gestion des surventes et stock reserve** : Quand un client passe commande en ligne sur la vitrine, la quantite commandee passe immediatement en `quantite_reservee` avant confirmation de paiement. En cas d'annulation ou timeout de paiement (15 min), le stock reserve est automatiquement libere.
2. **Verrouillage concurrentiel** : Utilisation de `select_for_update()` dans une transaction atomique `@transaction.atomic` pour garantir qu'aucune requete concurrente ne puisse vendre le meme exemplaire.
3. **Cas d'avarie ou vol** : Le type de mouvement `ajustement` exige un motif obligatoire (ex: "Livres endommages pendant transport", "Ecart inventaire physique").
4. **Transporteurs sans tracking en ligne** : Si le transporteur local ne fournit pas d'URL de tracking automatique, le numero de suivi reste obligatoire et un champ de notes/contact transporteur est mis a disposition.

---

## 4. Exigences Fonctionnelles (FR)

- **FR-001** : Authentification et controle de permission `IsGestionnaireOrAdmin`.
- **FR-002** : Modeles `Entrepot`, `StockOuvrage`, `MouvementStock`, `ExpeditionCommande`.
- **FR-003** : Calcul dynamique de la quantite disponible : `quantite_disponible = quantite_reelle - quantite_reservee`.
- **FR-004** : Alerte automatique transmise a la vitrine des que `quantite_disponible == 0`.
- **FR-005** : Immutabilite totale de la table `MouvementStock` (interdiction d'UPDATE ou DELETE).
- **FR-006** : Generation d'exports Excel (`openpyxl`) et PDF (`reportlab`) filtres par pays/entrepot.
- **FR-007** : Eradication des requetes SQL N+1 via `select_related("ouvrage", "entrepot")`.
- **FR-008** : Format JSON unifie `{ "success": boolean, "data": object|array, "error": string|null }`.

---

## 5. Criteres de Succes Mesurables (SC)

- **SC-001** : 0 survente enregistree grace au verrouillage pessimiste `select_for_update()`.
- **SC-002** : Generation des exports Excel pour 10 000 lignes de stock en moins de 2 secondes.
- **SC-003** : 100% des requetes API conformes au format JSON unifie.
