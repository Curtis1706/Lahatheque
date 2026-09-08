# Requirements Quality Checklist: Revue Multi-Axes Suite « Gestion des Finances »

**Purpose**: Valider la complétude, la clarté, la cohérence et la testabilité des exigences de la suite « Gestion des Finances » avant l'implémentation.
**Created**: 2026-09-08
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md)

**Note**: Cette checklist personnalisée est un artefact d'évaluation de la qualité des exigences, piloté par le réviseur.
**Review Ownership**: Un élément est coché `[x]` uniquement lorsque le réviseur confirme que le critère de qualité de rédaction de l'exigence est pleinement satisfait.
**Marker Semantics**: `[x]` signifie que l'exigence est bien rédigée, non ambiguë et testable. Cela ne signifie pas que le code est écrit.

---

## 1. Réconciliation Financière & Intégrité du Chiffre d'Affaires

- [x] CHK001 L'exigence de réconciliation dynamique entre les transactions réelles et le Chiffre d'Affaires consolidé est-elle formulée sans valeur codée en dur ? [Clarity, Spec §FR-005]
- [x] CHK002 Les critères d'agrégation des trois canaux de vente (B2C direct, universités B2B, grossistes B2B) sont-ils exhaustivement définis sans omission de source de revenus ? [Completeness, Spec §FR-005]
- [x] CHK003 La règle de non-double comptage pour les commandes multi-articles est-elle explicitement stipulée ? [Consistency, Spec §FR-006]
- [x] CHK004 Le traitement des transactions à statut en cours (ex: Mobile Money initié mais non dénoué) est-il clairement spécifié quant à son inclusion ou exclusion du CA ferme ? [Clarity, Spec §Edge-Cases]
- [x] CHK005 La devise monétaire et le formatage standardisé des montants (séparateurs de milliers, décimales) sont-ils unifiés sur l'ensemble des spécifications ? [Consistency, Spec §Assumptions]

---

## 2. Ergonomie des Data Tables & Zéro Encombrement

- [x] CHK006 Les spécifications définissent-elles précisément le comportement des accordéons interactifs pour les commandes multi-articles sur `/admin/sales` ? [Completeness, Spec §FR-006]
- [x] CHK007 Les colonnes obligatoires visibles par défaut sont-elles documentées pour éviter toute surcharge cognitive ? [Clarity, Spec §FR-011]
- [x] CHK008 Les spécifications précisent-elles le comportement de repli automatique ou d'accordéons multiples lorsqu'une nouvelle ligne est déployée ? [Clarity, Gap]
- [x] CHK009 Le comportement des tableaux lors d'une absence de résultats après application de filtres (état vide informatif et actionnable) est-il documenté ? [Coverage, Spec §Edge-Cases]
- [x] CHK010 Les spécifications imposent-elles le respect strict de la charte visuelle (polices Playfair Display / Poppins, absence totale d'émojis, tokens sémantiques exclusifs) ? [Consistency, Spec §FR-011]

---

## 3. Sécurité, Audit & Décaissements (`/admin/payouts`)

- [x] CHK011 Les champs obligatoires (référence de transaction, date de valeur) et facultatifs (justificatif PDF/image) sont-ils spécifiés sans ambiguïté pour la validation d'un versement ? [Clarity, Spec §FR-004]
- [x] CHK012 L'obligation de saisie d'un motif motivé en cas de rejet d'une demande est-elle explicitement formulée ? [Completeness, Spec §FR-004]
- [x] CHK013 Le traitement des demandes de versement excédant le solde disponible calculé du partenaire est-il spécifié avec un blocage préventif ? [Edge Cases, Spec §Edge-Cases]
- [x] CHK014 Les 4 KPIs décisionnels supérieurs de la page `/admin/payouts` sont-ils tous assortis d'une méthode de calcul objective et vérifiable ? [Measurability, Spec §FR-002]
- [x] CHK015 Les exigences de masquage partiel des coordonnées bancaires ou Mobile Money pour la confidentialité sont-elles documentées ? [Security, Spec §FR-003]

---

## 4. Consolidation Multi-Partenaires & Droits (`/admin/finance`)

- [x] CHK016 Les trois typologies d'ayant-droits (auteurs, éditeurs tiers, universités) sont-elles intégrées dans les critères de réconciliation globale ? [Completeness, Spec §FR-008]
- [x] CHK017 La ventilation entre droits issus des ventes directes et quote-part au prorata des bouquets universitaires est-elle clairement différenciée dans les spécifications ? [Clarity, Spec §FR-008]
- [x] CHK018 Les formules mathématiques de détermination de la marge nette conservée par la plateforme sont-elles documentées de façon univoque ? [Measurability, Spec §FR-007]
- [x] CHK019 Les règles de filtrage par onglets de rôle (`Tous`, `Auteurs`, `Éditeurs`, `Universités`) sont-elles exemptes de conflits de typage ? [Consistency, Spec §FR-008]

---

## 5. Épuration de `/admin/royalties` & Navigation Globale

- [x] CHK020 La suppression des 3 boutons orphelins de l'en-tête et du bloc de versements est-elle explicitement actée comme critère d'acceptation ? [Completeness, Spec §FR-009]
- [x] CHK021 Le périmètre résiduel de `/admin/royalties` (barèmes globaux + tableau des taux conventionnés) est-il circonscrit sans chevauchement ? [Consistency, Spec §FR-010]
- [x] CHK022 L'arborescence à 4 sous-liens du menu « Gestion des Finances » dans la sidebar est-elle définie avec ses routes cibles respectives ? [Traceability, Spec §FR-012]
- [x] CHK023 Les exigences d'adaptation mobile-first (scroll contrôlé sous 400px sans layout shift) sont-elles quantifiées de manière vérifiable ? [Measurability, Spec §SC-005]

---

## Notes

- Cocher `[x]` chaque critère uniquement après relecture et validation de la qualité rédactionnelle de la spécification.
- La commande `/speckit-implement` lira l'état de cette checklist comme indicateur de maturité.
