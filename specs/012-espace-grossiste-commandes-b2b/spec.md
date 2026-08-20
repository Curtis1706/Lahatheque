# Feature Specification: Module 12 - Espace Grossiste & Commandes Groupées B2B (LAHAThèque v3.2)

**Feature Branch**: `012-espace-grossiste-commandes-b2b`  
**Created**: 2026-08-20  
**Status**: Ready for Implementation  
**Source Métier**: Cahier des charges LAHAThèque v3.2 - Sections 4.1.9, 4.3, 7.1, 10 ; Workflow `/build-lahatheque-screen` ; Règles `AGENTS.md` (sobriété visuelle, zéro emoji, zéro code hex en dur, mobile-first).

---

## 1. Résumé Exécutif de la Fonctionnalité

Le module **Espace Grossiste (`/wholesaler`)** permet aux librairies partenaires nationales et internationales, distributeurs scolaires et revendeurs agréés d'Afrique de l'Ouest et Centrale (Bénin, Sénégal, Côte d'Ivoire, Togo, Niger, RDC, Cameroun, etc.) de :

1. **Consulter un catalogue B2B dédié** présentant les prix de gros et les barèmes de remises dégressives par tranche de quantité, tant sur les **licences numériques** que sur les **exemplaires papier physiques**.
2. **Constituer et valider des commandes groupées volumétriques** via un panier latéral réactif multi-formats (`WholesaleCartDrawer`) avec respect strict des seuils minimaux de commande (`min_quantity`).
3. **Piloter le cycle de vie complet de chaque commande** : soumission, génération de facture proforma PDF téléchargeable, validation administrative, préparation en entrepôt, expédition avec suivi transporteur et mise à disposition des lots de clés de licences numériques.
4. **Recevoir des alertes et notifications automatiques** ciblées : nouveautés au catalogue, alertes de réapprovisionnement de stock papier et meilleures ventes.
5. **Gérer les paramètres de l'entreprise grossiste** : raison sociale, NIF / RCCM, contact d'approvisionnement, adresse de l'entrepôt de livraison et historique comptable.

---

## 2. User Scenarios & Acceptance Criteria (Priorisés)

### User Story 1 - Consultation du Catalogue B2B et Barèmes de Remise (Priorité: P1 - MVP)

En tant que Grossiste connecté, je veux explorer le catalogue avec les grilles de tarifs de gros et les remises dégressives par volume en devises locales (Franc CFA XOF / XAF, USD), afin de sélectionner les références à réapprovisionner.

**Scénarios d'acceptation** :
1. **Étant donné** un grossiste sur `/wholesaler/catalog`, **Quand** il consulte un ouvrage, **Alors** il voit le prix public indicatif, le prix de gros numérique, le prix de gros papier, le seuil de quantité minimale (`min_quantity`) et la disponibilité du stock physique en temps réel.
2. **Étant donné** un filtre par discipline ou une recherche textuelle (titre, auteur, ISBN), **Quand** le grossiste saisit une requête, **Alors** les résultats s'actualisent instantanément sans rechargement de page.
3. **Étant donné** un livre en stock physique limité, **Quand** le stock papier est inférieur au seuil minimal, **Alors** un badge d'avertissement informe que seul le format numérique est immédiatement disponible en gros.

---

### User Story 2 - Constitution du Panier Groupé et Soumission de Commande (Priorité: P1 - MVP)

En tant que Grossiste, je veux ajuster les quantités numériques et papier de plusieurs ouvrages dans un panier latéral rapide (`WholesaleCartDrawer`), visualiser les sous-totaux avec remises calculées et soumettre la commande en 1 clic.

**Scénarios d'acceptation** :
1. **Étant donné** des articles ajoutés au panier, **Quand** le grossiste ouvre le drawer, **Alors** il peut ajuster les quantités numériques et papier avec calcul instantané du montant total HT et TTC en FCFA (XOF).
2. **Étant donné** une quantité inférieure au minimum requis (`min_quantity`), **Quand** l'utilisateur tente de valider, **Alors** un message inline d'erreur explicite lui indique le seuil minimal à atteindre.
3. **Étant donné** un panier valide avec adresse de livraison et téléphone de contact confirmés, **Quand** le grossiste valide la commande, **Alors** la commande est créée avec le statut `pending` (En attente de validation) et une référence unique (ex: `CMD-GROS-2026-0801`).

---

### User Story 3 - Suivi du Cycle de Vie et Facture Proforma (Priorité: P1 - MVP)

En tant que Grossiste, je veux suivre l'avancement de mes commandes groupées, télécharger la facture proforma officielle et suivre la livraison des cartons papier.

**Scénarios d'acceptation** :
1. **Étant donné** une commande sur `/wholesaler/orders/[id]`, **Quand** le grossiste accède à la fiche, **Alors** il visualise un stepper interactif retraçant les 4 étapes : `Dépôt de commande` -> `Validation & Proforma` -> `Préparation & Expédition` -> `Livraison & Licences activées`.
2. **Étant donné** une commande validée, **Quand** le grossiste clique sur "Télécharger la facture proforma (PDF)", **Alors** le document PDF conforme aux mentions légales (NIF, RCCM, TVA, détails des lignes) est généré.
3. **Étant donné** une commande en cours de livraison, **Quand** le gestionnaire lui a attribué un transporteur et un N° de suivi (DHL/Chronopost), **Alors** le lien de suivi externe et les informations de livraison sont affichés en direct.

---

### User Story 4 - Annulation Sécurisée de Commande (Priorité: P2)

En tant que Grossiste, je veux pouvoir demander l'annulation d'une commande en attente avant le début de la préparation logistique.

**Scénarios d'acceptation** :
1. **Étant donné** une commande au statut `pending` ou `validated`, **Quand** le grossiste clique sur "Demander l'annulation", **Alors** une modale lui demande obligatoirement de saisir un motif explicite.
2. **Étant donné** la confirmation de l'annulation, **Quand** la demande est traitée, **Alors** le statut passe à `cancelled`, le stock réservé est libéré et une notification est envoyée à l'administration.

---

### User Story 5 - Centre de Notifications & Nouveautés Catalogue (Priorité: P2)

En tant que Grossiste, je veux être alerté des parutions récentes, des meilleures ventes académiques et des campagnes de réapprovisionnement.

**Scénarios d'acceptation** :
1. **Étant donné** de nouvelles parutions validées par le Chef Maquettiste, **Quand** le grossiste consulte `/wholesaler/notifications`, **Alors** la liste affiche les alertes classées avec badges "Nouveauté" ou "Meilleure Vente" et bouton d'ajout direct au panier.

---

### User Story 6 - Profil Entreprise & Paramètres de Facturation (Priorité: P2)

En tant que Grossiste, je veux gérer les informations de ma structure commerciale (Raison sociale, NIF, RCCM, adresse d'entrepôt, contact d'astreinte) et la sécurité de mon compte.

**Scénarios d'acceptation** :
1. **Étant donné** la page `/wholesaler/profile`, **Quand** le grossiste modifie ses coordonnées d'entrepôt ou son mot de passe, **Alors** les modifications sont enregistrées avec feedback visuel immédiat (toast de confirmation).

---

## 3. Traque des Non-Dits et Cas Limites (Étape Clarify)

1. **Devises africaines sans centimes (XOF / XAF)** :
   - Tous les calculs de montants de gros sont arrondis à l'entier le plus proche (`Decimal('1')`), sans centimes artificiels.
2. **Commandes mixtes (Papier + Numérique)** :
   - Une même commande peut contenir à la fois des licences numériques (débloquées dès confirmation de paiement) et des exemplaires papier (transmis au gestionnaire de stock pour expédition physique).
3. **Disponibilité des stocks physiques** :
   - Lors de la validation de la commande, le stock papier est automatiquement placé au statut `réservé` chez le gestionnaire pour éviter toute rupture imprévue.
4. **Zéro emoji & design chic** :
   - Strict respect de la charte LAHAThèque : pas d'emojis, utilisation exclusive des icônes vectorielles Lucide React (`lucide-react`), tokens sémantiques purs (`bg-navy`, `bg-gold`, `border-border`).

---

## 4. Exigences Fonctionnelles (FR)

- **FR-001** : Modèle de données `WholesaleOrder`, `WholesaleOrderItem`, `WholesaleDiscountTier`.
- **FR-002** : Calcul dynamique des remises sur volume selon les grilles de paliers configurées.
- **FR-003** : Panier réactif `WholesaleCartDrawer` supportant l'édition rapide des volumes papier et numériques.
- **FR-004** : Stepper interactif de progression des commandes B2B avec téléchargement de facture proforma PDF.
- **FR-005** : Modale d'annulation de commande avec saisie obligatoire d'un motif.
- **FR-006** : Centre de notifications B2B (nouveautés, alertes réapprovisionnement, meilleures ventes).
- **FR-007** : Page profil grossiste avec coordonnées d'entreprise (NIF, RCCM, entrepôt) et changement de mot de passe.
- **FR-008** : Format JSON unifié pour toutes les réponses d'API `{ "success": boolean, "data": object|array, "error": string|null }`.

---

## 5. Critères de Succès Mesurables (SC)

- **SC-001** : 100% des commandes groupées créées avec calcul arithmétique exact au Franc CFA près.
- **SC-002** : Zéro code couleur hexadécimal en dur dans les composants frontend.
- **SC-003** : Zéro emoji dans l'ensemble des pages et composants de l'espace grossiste.
- **SC-004** : Interface 100% responsive et utilisable sur mobile (< 400px), tablette et desktop.
