# Feature Specification: Répartition Dynamique des Redevances sur Bouquets Documentaires

**Feature Branch**: `002-bouquet-royalties-distribution`

**Created**: 2026-09-08

**Status**: Ready for Planning

**Input**: User description: "Répartition des Redevances – Bouquets Documentaires Consolidation multi-campus et répartition proportionnelle • Taux conventionné : 15 % on doit rendre les graphiques ici vraiment fonctionnelles aucune donnée mock pour ce camembert et autre, aussi le taux n'est pas fixe , ça suit ce que l'admin configure de façon globale ou personnalisé pour les divers et respectifs université non /speckit-specify tu peux lire le cahier de charge et attentive l'image joint ici surtout mais on doit vraiment rendre ça fonctionnel et aucune donnée mock dessus"

## Clarifications

### Session 2026-09-08
- Q: Doit-on ventiler les bouquets et redevances par faculté ou au niveau global de l'université ? → A: Suppression intégrale de la notion de faculté. Les bouquets documentaires et les redevances sont suivis et gérés exclusivement au niveau institutionnel de l'université partenaire.
- Q: Que consulte l'Administrateur dans son diagramme circulaire (camembert) et ses graphiques de redevances sur les bouquets ? → A: L'administrateur consulte la répartition macroscopique inter-universitaire de chaque bouquet : la part d'audience réelle (%) de chaque établissement contributeur, les montants des redevances dus à chacun selon son taux conventionné respectif, ainsi que la marge résiduelle conservée par la plateforme LAHA.
- Q: Que doit représenter exactement le diagramme circulaire (camembert) lorsque l'Administrateur consulte la répartition d'un bouquet documentaire ? → A: Option A : Le camembert ventile 100 % de l'usage entre les universités partenaires détentrices des ouvrages (UAC, Parakou, UNA...), avec le détail des redevances par barre horizontale et la part résiduelle de la plateforme LAHA affichée en synthèse financière à côté (reproduction fidèle du schéma Section 11 du Cahier des Charges).
- Q: Sur le tableau de bord principal de l'Administrateur (/admin), comment doit être sélectionné le bouquet documentaire affiché dans le bloc de synthèse ? → A: Option A : Afficher par défaut le premier bouquet actif, avec un sélecteur déroulant pour basculer instantanément d'un bouquet à l'autre.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultation de la répartition réelle des redevances par bouquet documentaire (Université) (Priority: P1)

En tant que responsable financier ou recteur d'une université partenaire, je souhaite accéder à l'onglet dédié aux bouquets documentaires dans mon espace redevances et visualiser la quote-part réelle générée par les ouvrages de mon établissement, calculée selon l'utilisation effective (consultations, sessions de lecture certifiées) sur l'assiette financière de chaque bouquet souscrit, avec un diagramme circulaire (camembert) et un graphique en barres horizontales alimentés par des données réelles, afin de vérifier la juste rémunération de nos contributions documentaires sans données mockées.

**Why this priority**: C'est le cœur de la demande métier stipulée dans le Cahier des Charges (Section 11.1 & 11.2). L'université doit auditer en direct ses reversements issus des abonnements bouquets sans aucun chiffre factice.

**Independent Test**: Connecter un compte universitaire partenaire disposant d'ouvrages inclus dans un bouquet souscrit, naviguer vers la page des redevances institutionnelles, activer l'onglet "Redevances Bouquets", et vérifier que les graphiques (camembert de répartition d'usage et barres de redevances) s'affichent avec des volumes de lecture et montants réels issus de la base de données.

**Acceptance Scenarios**:

1. **Given** une université partenaire dont les ouvrages font partie d'un bouquet documentaire actif ayant enregistré des lectures réelles, **When** le responsable consulte la section "Redevances Bouquets (Prorata Consultations)", **Then** le système affiche la liste des bouquets souscrits avec le nombre d'ouvrages inclus, le volume de consultations de l'université par rapport au total global du bouquet, et le pourcentage de part d'audience exact.
2. **Given** un bouquet documentaire souscrit, **When** l'utilisateur clique sur "Répartition & Redevances", **Then** une modale analytique s'ouvre et affiche :
   - Un diagramme circulaire montrant la part d'utilisation réelle de chaque université contributrice du bouquet (avec mise en exergue de l'établissement connecté).
   - Un graphique en barres horizontales affichant les redevances calculées en monnaie locale pour chaque université.
   - Un tableau comparatif détaillant : Part d'utilisation (%), Part du chiffre d'affaires allouée, et Redevance nette reversée selon le taux conventionné.
3. **Given** une université sans aucun bouquet actif ou sans consultation enregistrée, **When** l'utilisateur accède à l'onglet, **Then** un message explicatif clair et actionnable est affiché, sans graphique vide cassé ni données factices résiduelles.

---

### User Story 2 - Supervision globale et audit financier des bouquets documentaires (Administrateur) (Priority: P1)

En tant qu'administrateur financier de la plateforme LAHA, je souhaite accéder à la vue consolidée de chaque bouquet documentaire dans le portail d'administration (`/admin/royalties/universities` et `/admin/catalog/bouquets`), afin d'inspecter le diagramme circulaire de répartition d'audience ventillant 100% de l'usage entre les universités partenaires détentrices des livres, d'auditer les redevances dues à chacune via les barres horizontales selon leur taux contractuel respectif, de constater la part restante revenant à la plateforme, et de valider les règlements officiels.

**Why this priority**: L'administrateur est l'arbitre financier qui perçoit les abonnements bouquets et liquide les redevances aux universités. Il doit disposer d'une vision panoramique non biaisée sur 100% des flux financiers de chaque bouquet conformément au modèle de la Section 11 du CDC.

**Independent Test**: Connecter un compte administrateur, naviguer vers `/admin/royalties/universities` ou `/admin/catalog/bouquets`, ouvrir la modale de répartition d'un bouquet documentaire, et vérifier que le camembert affiche toutes les universités partenaires contributrices, le graphique en barres montre les montants nets à liquider pour chacune, et la synthèse financière récapitule la quote-part totale distribuée vs la part de la plateforme.

**Acceptance Scenarios**:

1. **Given** un administrateur sur la section "Répartition des Bouquets par Université Partenaire", **When** il clique sur "Répartition & Statistiques" pour un bouquet, **Then** le camembert ventile 100 % de l'usage entre les universités partenaires détentrices des ouvrages (ex: UAC 90,91 %, Université de Parakou 8,18 %, UNA 0,91 %) avec leurs volumes de consultation respectifs.
2. **Given** le graphique en barres horizontales côté administrateur, **When** les taux contractuels diffèrent entre universités (ex: 15% pour l'une, 18% dérogatoire pour une autre), **Then** chaque barre reflète le calcul exact propre à chaque institution sur sa part de CA réservée.
3. **Given** la synthèse financière globale du bouquet affichée dans la vue administrateur, **When** les redevances sont calculées, **Then** les cartes récapitulatives affichent distinctement le CA total du bouquet, le cumul des redevances universitaires dues, et la marge nette conservée par la plateforme LAHA.
4. **Given** une demande de liquidation de redevances universitaires, **When** l'administrateur valide le versement avec référence de virement bancaire, **Then** le statut passe à "Réglé" et le solde disponible de l'université est immédiatement débité en cohérence.

---

### User Story 3 - Application dynamique du barème de redevance (Taux global admin vs Taux spécifique par université) (Priority: P2)

En tant qu'administrateur de la plateforme ou gestionnaire universitaire, je souhaite que le taux de redevance appliqué aux bouquets documentaires ne soit jamais rigide, mais reflète fidèlement la politique contractuelle en vigueur : soit le taux standard global configuré par l'administrateur dans les barèmes généraux (ex: 15%), soit le taux dérogatoire ou préférentiel négocié individuellement pour l'institution ou l'ouvrage, afin que les calculs de redevances restent toujours synchronisés avec les conventions signées.

**Why this priority**: L'administrateur peut modifier le taux standard de redevance des universités partenaires (ex: passage de 15% à 18%) ou accorder un barème spécifique à un campus. Le moteur de calcul et les graphiques doivent automatiquement prendre en compte ce taux effectif sans nécessiter de modification de code.

**Independent Test**: Modifier le taux général des universités partenaires dans les paramètres de la plateforme ou sur la fiche d'une institution spécifique, puis actualiser la vue des redevances côté université ou admin : le libellé du taux contractuel et le montant des redevances calculées dans le graphique et le tableau doivent immédiatement refléter la nouvelle valeur.

**Acceptance Scenarios**:

1. **Given** un taux global de redevance université configuré à 15% dans l'administration, et une université sans taux dérogatoire spécifique, **When** le système calcule la quote-part sur un bouquet de 10 000 000 XOF avec 40% de part d'usage, **Then** la redevance nette affichée est exactement de 600 000 XOF (10 000 000 &times; 40% &times; 15%), et le badge affiche "Taux conventionné : 15%".
2. **Given** une université bénéficiant d'une convention particulière stipulant un taux de 18%, **When** cette université ou l'admin consulte la répartition de ses bouquets, **Then** le système applique 18% sur sa part de chiffre d'affaires, tandis que les autres universités contributrices conservent leur propre taux respectif.
3. **Given** une mise à jour du barème par l'administrateur central dans les paramètres généraux, **When** la page est consultée ou actualisée, **Then** les bordereaux et synthèses financières se recalculent instantanément sur la base des nouvelles règles sans mise en cache trompeuse.

---

### Edge Cases

- Que se passe-t-il si un bouquet documentaire n'a enregistré aucune lecture sur la période considérée ?
  Le système affiche une part d'utilisation de 0%, une redevance nette de 0 XOF, et le camembert indique un état "Aucune consultation enregistrée sur la période" sans division par zéro.
- Comment le système réagit-il si deux universités ont des taux contractuels conventionnés différents sur un même bouquet partagé ?
  La part de chiffre d'affaires est répartie selon l'audience (100% de la somme des parts d'usage = montant total du bouquet). Ensuite, chaque université voit son propre taux contractuel respectif appliqué sur sa part de CA réservée, sans altérer le montant des autres universités.
- Que se passe-t-il si des ouvrages du bouquet n'appartiennent à aucune université partenaire (ex: fonds propre LAHA Éditions) ?
  L'utilisation de ces ouvrages est affectée à la part résiduelle "Éditions LAHA / Fonds Propre", assurant que la somme des parts d'utilisation égale toujours strictement 100%.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT calculer la répartition d'audience des bouquets documentaires au prorata strict de l'utilisation réelle des contenus (consultations vérifiées, sessions de lecture certifiées).
- **FR-002**: Le système DOIT éliminer tout reliquat de données fictives ou statiques ("mock") sur les graphiques de redevances des bouquets documentaires, tant dans l'espace universitaire que dans l'espace administration.
- **FR-003**: Le système DOIT afficher un diagramme circulaire (camembert) dynamique représentant fidèlement la part d'utilisation (%) de chaque université partenaire contributrice pour chaque bouquet sélectionné, accessible aux universités et à l'administrateur (100% de l'audience répartie entre les détenteurs des droits).
- **FR-004**: Le système DOIT afficher un graphique en barres horizontales proportionnelles représentant le montant monétaire exact de la redevance revenant à chaque université contributrice.
- **FR-005**: Le système DOIT appliquer dynamiquement le taux de redevance universitaire convenu :
  - En utilisant en priorité le taux contractuel spécifique défini sur la fiche de l'institution (`Institution.royalty_rate`).
  - En utilisant par défaut le taux général des universités partenaires configuré au niveau de la plateforme par l'administrateur central (`ConfigurationPlateformeGlobale.default_university_royalty_rate`).
- **FR-006**: Le système DOIT afficher l'onglet "Redevances Bouquets (Prorata Consultations)" de manière pleinement accessible, visible et active dans l'interface du tableau de bord universitaire (suppression de tout masque d'affichage).
- **FR-007**: Le système DOIT exclure toute segmentation ou filtrage par faculté dans les tableaux de bord de redevances, la gestion des abonnements et des redevances bouquets s'effectuant exclusivement au niveau global de l'Université.
- **FR-008**: Dans l'espace administration (sur le tableau de bord principal `/admin` avec sélecteur déroulant de bouquet, ainsi que sur `/admin/royalties/universities` et `/admin/catalog/bouquets`), le système DOIT afficher pour chaque bouquet :
  - Le camembert complet ventilant l'audience réelle entre toutes les universités partenaires détentrices des livres.
  - Le graphique en barres horizontales des redevances dues à chaque université partenaire.
  - La synthèse financière distinguant le montant global reversé aux universités et la marge résiduelle conservée par la plateforme LAHA.
  - Le déclenchement du flux de validation du versement au compte de l'institution.
- **FR-009**: Toute modification par l'administrateur du barème conventionné global ou spécifique DOIT se répercuter immédiatement sur l'affichage et les calculs des redevances sans mise en cache rigide.

### Key Entities

- **BouquetDocumentaire (BouquetOffering / Subscription)** : Ensemble thématique d'ouvrages universitaires commercialisé sous forme d'abonnement périodique institutionnel (annuel ou semestriel), caractérisé par un titre, une assiette financière globale, une devise, une liste d'ouvrages éligibles et un statut actif.
- **SessionUtilisation (ReaderSession / TraceAcces)** : Enregistrement certifié d'une consultation ou session de lecture sur un ouvrage donné, permettant de tracer l'audience par livre, par établissement d'origine et par bouquet.
- **RepartitionBouquetItem** : Résultat consolidé pour une université sur un bouquet donné, regroupant le nombre d'ouvrages, les consultations cumulées, la quote-part d'usage (%), la part de CA correspondante, le taux de redevance appliqué et le montant net à reverser.
- **Institution (Université Partenaire)** : Établissement d'enseignement supérieur détenteur des droits sur son fonds documentaire, disposant d'un taux de redevance contractuel propre et/ou hérité de la politique générale de la plateforme.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% des données restituées sur les graphiques (camembert et barres horizontales) et dans le tableau de bord des redevances bouquets proviennent d'enregistrements et de calculs réels vérifiables de la plateforme, avec un taux de mocks résiduels égal à 0%.
- **SC-002**: La somme des parts d'utilisation de l'ensemble des institutions contributrices sur tout bouquet affiché est toujours égale à 100,00% (&plusmn;0,01% pour arrondis).
- **SC-003**: Le taux contractuel affiché dans l'en-tête et utilisé dans les formules de calcul correspond à 100% au taux configuré en base de données pour l'université ou défini dans les paramètres globaux d'administration.
- **SC-004**: Côté administration, l'ensemble des universités partenaires contributrices d'un bouquet ainsi que la part revenant à LAHA sont calculés et affichés en moins de 1,5 seconde.
- **SC-005**: La navigation et l'affichage des graphiques restent parfaitement lisibles et adaptatifs sur tous les formats d'écran, du mobile (375px) au poste de travail (1280px+), sans débordement horizontal.

## Assumptions

- Les lectures réelles effectuées par les étudiants ou enseignants authentifiés sont tracées dans le système de lectorat de la plateforme et rattachables aux ouvrages respectifs du catalogue.
- La monnaie principale de calcul pour les partenaires régionaux est le Franc CFA (XOF), avec conversion automatique possible si le bouquet est valorisé en euros (EUR) selon le cours conventionné de la plateforme.
- L'administrateur dispose des permissions requises pour éditer les barèmes globaux de répartition dans le tableau de bord administratif.
