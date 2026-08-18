# Feature Specification: Module 5 - Ventes, Redevances et Bouquets Documentaires

**Feature Branch**: `005-ventes-redevances-bouquets`  
**Created**: 2026-08-18  
**Status**: In Review  
**Source Metier**: Cahier des charges LAHATheque v3.2 - Sections 7, 10, 11, 12 (Ventes, Redevances 15% Universites, Bouquets Documentaires, Devises Africaines XOF/XAF/CDF/USD)

---

## 1. Resume Executif de la Fonctionnalite

Ce module pilote le moteur financier et comptable de LAHATheque deploye sur l'ensemble des filiales africaines (Benin, Senegal, Cote d'Ivoire, Togo, Niger, Gabon, Cameroun, RDC, etc.) :
1. **Enregistrement des ventes multi-formats et multi-devises** : Livre papier, livre numerique, livre audio, bouquet documentaire et abonnements, libelles en devises locales africaines (Franc CFA **XOF** et **XAF**, Franc congolais **CDF**, Franc guineen **GNF**) et **USD**.
2. **Calcul automatique des redevances** :
   - **Universites partenaires** (ex: Universite d'Abomey-Calavi UAC, UNA, Universite de Parakou, UCAD Dakar, etc.) : 15% des revenus generes par les ouvrages qui leur sont rattaches.
   - **Editeurs tiers partenaires** : Taux contractuel convenu (ex: 70%).
   - **Auteurs** : Partage selon la cle de repartition validee par le Juriste.
3. **Moteur de repartition des Bouquets Documentaires a l'usage reel** : Ventilation du chiffre d'affaires des bouquets au prorata exact des metriques de consommation reelle (pages lues, temps de lecture en secondes, consultations en ligne, ecoutes audio).
4. **Tableaux de bord financiers dedies** pour Universites, Auteurs, Editeurs tiers et Administrateur.

---

## 2. User Scenarios & Acceptance Criteria (Prioritises)

### User Story 1 - Calcul de la Redevance Universitaire de 15% sur Vente Unitaire (Priorite: P1 - MVP)

En tant qu'Universite partenaire (ex: UAC Benin ou UCAD Senegal), je veux que chaque vente d'un livre affilie a mon etablissement genere automatiquement un credit de 15% hors taxe sur mon compte en Franc CFA (XOF / XAF), consultable en temps reel sur mon tableau de bord.

**Scenarios d'acceptation** :
1. **Etant donne** un livre vendu 10 000 XOF HT affilie a l'Universite d'Abomey-Calavi (UAC), **Quand** le paiement Mobile Money ou Carte est confirme, **Alors** le systeme credite instantanement 1 500 XOF sur le compte de l'UAC dans `RedevanceUniversite`.

---

### User Story 2 - Ventilation des Revenus d'un Bouquet Documentaire a l'Usage (Priorite: P1 - MVP)

En tant qu'Administrateur financier, je veux que les revenus issus des souscriptions aux bouquets documentaires (en Franc CFA XOF/XAF ou USD) soient repartis periodiquement entre les universites selon la formule d'usage reel du cahier des charges.

**Formule d'usage** :
$$\text{Score}(u) = \sum (\text{pages\_lues} \times 1.0 + \frac{\text{secondes\_lecture}}{60} \times 0.5 + \text{ecoutes\_audio} \times 1.5)$$
$$\text{Part CA}(u) = \text{CA Bouquet} \times \frac{\text{Score}(u)}{\text{Score Total}}$$
$$\text{Redevance}(u) = \text{Part CA}(u) \times 15\%$$

**Scenarios d'acceptation** :
1. **Etant donne** un bouquet institutionnel de 10 000 000 XOF avec une repartition d'usage : UAC 90.91%, UNA 0.91%, Parakou 8.18%, **Quand** le calcul de cloture est execute, **Alors** les montants de redevance (15%) sont exactement :
   - UAC (Part CA = 9 091 000 XOF) -> Redevance 15% = 1 363 650 XOF
   - UNA (Part CA = 91 000 XOF) -> Redevance 15% = 13 650 XOF
   - Universite de Parakou (Part CA = 818 000 XOF) -> Redevance 15% = 122 700 XOF

---

### User Story 3 - Tableaux de Bord Financiers dedies (Priorite: P1 - MVP)

En tant qu'Universite, Auteur ou Editeur partenaire, je veux consulter mes revenus generes, les redevances dues, les paiements effectues et le solde restant dans ma devise locale (XOF, XAF, CDF, USD).

---

## 3. Traque des Non-Dits et Cas Limites (Etape Clarify)

1. **Rigueur arithmetique et devises sans centimes (XOF / XAF)** : Les devises XOF et XAF fonctionnent sans centimes divisionnaires dans la pratique comptable locale, tandis que l'USD utilise 2 decimales. Le moteur comptable quantifie selon la devise :
   - Pour `XOF` et `XAF` : Arrondi a l'entier le plus proche (`Decimal('1')`).
   - Pour `USD` : Arrondi au centime (`Decimal('0.01')`).
2. **Report d'ajustement** : L'ecart d'arrondi residentiel est affecte a l'etablissement ayant la plus grande part pour que `sum(parts) == montant_total` exactement.
3. **Moyens de paiement locaux** : Prise en compte des modes de paiement africains (MTN Mobile Money, Moov Money, Orange Money, Wave, Wave CI/SN, Cartes bancaires GIM-UEMOA, Virements bancaires).

---

## 4. Exigences Fonctionnelles (FR)

- **FR-001** : Modeles `VenteTransaction`, `BouquetDocumentaire`, `MetriqueUsageLivre`, `RedevanceUniversite`, `RedevanceEditeur`, `RedevanceAuteur`.
- **FR-002** : Prise en charge des devises africaines : `XOF` (UEMOA), `XAF` (CEMAC), `CDF` (RDC), `GNF` (Guinée), `USD` (International).
- **FR-003** : Calcul automatique de 15% pour les universites sur toutes les ventes de leur catalogue.
- **FR-004** : Agregation asynchrone Celery des metriques d'usage des lecteurs (`TraceAcces` -> `MetriqueUsageLivre`).
- **FR-005** : Format JSON unifie `{ "success": boolean, "data": object|array, "error": string|null }`.

---

## 5. Criteres de Succes Mesurables (SC)

- **SC-001** : Exactitude stricte a 0 Franc CFA pres sur la repartition du bouquet test de 10 000 000 XOF.
- **SC-002** : 100% des transactions enregistrees avec la devise locale du pays de l'acheteur.
