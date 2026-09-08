# Research & Technical Decisions: Répartition Dynamique des Redevances sur Bouquets Documentaires

**Feature**: `002-bouquet-royalties-distribution`
**Date**: 2026-09-08

Ce document consigne les décisions d'architecture, les rationales techniques et l'évaluation des alternatives pour la mise en œuvre de la répartition réelle et dynamique des bouquets documentaires, conformément aux sections 11.1, 11.2 et 12 du Cahier des Charges.

---

## 1. Moteur de Calcul d'Audience et de Redevances en Temps Réel

### Contexte
La section 11.1 du Cahier des Charges stipule : *« Les revenus issus des bouquets documentaires sont répartis selon l'utilisation réelle des contenus, en tenant compte des consultations, pages lues, téléchargements, temps de lecture et écoutes audio. »*
Auparavant, le moteur `compute_bouquet_distribution_payload` utilisait le nombre d'ouvrages comme proxy d'usage (`usage_pct = (count / total_inst_books) * 100`) ou des données précalculées factices.

### Décision
* **Source d'audience certifiée** : Agrégation directe des sessions de lecture `ReaderSession` et des événements `TraceAcces` filtrés sur les ouvrages appartenant aux universités partenaires contributrices du bouquet.
* **Formule de répartition** :
  $$\text{Part d'audience } (\%) = \frac{\text{Consultations des ouvrages de l'Université } i}{\sum \text{Consultations totales du bouquet}} \times 100$$
  $$\text{Assiette CA allouée } (i) = \text{Prix annuel du bouquet} \times \text{Part d'audience } (i)$$
  $$\text{Redevance nette } (i) = \text{Assiette CA allouée } (i) \times \frac{\text{Taux conventionné } (i)}{100}$$
  $$\text{Part résiduelle Plateforme LAHA} = \text{Prix annuel du bouquet} - \sum \text{Redevances nettes des universités}$$
* **Cas limite (Zéro consultation)** : Si un bouquet actif n'a pas encore enregistré de lecture, la part théorique se ventile à parts égales ou au prorata du nombre de titres mis à disposition, avec un indicateur visuel explicite *« Période initiale avant relevé d'usage »*.

### Rationale
Garantit la conformité contractuelle stricte avec les exigences légales et les audits des universités publiques partenaires.

### Alternatives écartées
* *Répartition forfaitaire par nombre de livres* : Rejetée car elle pénalise les ouvrages à fort lectorat et contredit explicitement la section 11.1 du CDC.
* *Calcul batch mensuel différé uniquement* : Rejeté car les tableaux de bord et modales d'analyse exigent une restitution dynamique en temps réel lors de l'inspection.

---

## 2. Résolution Hiérarchique et Dynamique du Taux de Redevance

### Contexte
L'utilisateur a précisé : *« le taux n'est pas fixe, ça suit ce que l'admin configure de façon globale ou personnalisé pour les divers et respectifs université »*.

### Décision
Mise en place d'une cascade de résolution stricte en 3 niveaux dans le backend Django :
1. **Niveau 1 (Spécifique Ouvrage / Contrat)** : Si `RoyaltyRate.university_share_percent` est défini pour un ouvrage du bouquet, ce taux prévaut.
2. **Niveau 2 (Spécifique Institution)** : Si l'université dispose d'un taux conventionné dérogatoire enregistré dans `Institution.royalty_rate` (ex: 18%), ce taux est appliqué.
3. **Niveau 3 (Barème Global Plateforme)** : À défaut de taux dérogatoire, le moteur applique le taux configuré par l'administrateur dans `ConfigurationPlateformeGlobale.default_university_royalty_rate` (champ existant dans `apps/reporting/models.py`, valeur par défaut 15.00%).

### Rationale
Permet à l'administrateur de piloter globalement la politique tarifaire de la plateforme depuis son écran de configuration tout en respectant les accords bilatéraux négociés avec certaines universités.

---

## 3. Éradication Totale des Mocks et Découplage des Facultés

### Contexte
* Deux blocages identifiés dans le code existant :
  1. `lib/mock/university-royalties.ts` fournissait `mockUniversityBouquetUsage` avec des chiffres figés.
  2. L'onglet des bouquets dans `app/(dashboard)/university/royalties/page.tsx` était masqué via `<div className="hidden">`.
  3. Des filtres et libellés mentionnaient des codes de facultés (FSS, FADESP, FASEG).

### Décision
* **Suppression intégrale de la notion de faculté** : Les abonnements, les quotas et les reversements sont exclusivement rattachés à l'entité institutionnelle `Institution` (Université).
* **Démasquage et activation de l'onglet Bouquets** : Rétablissement immédiat du bouton d'onglet dans le sous-menu des redevances universitaires.
* **Suppression de tout mock résiduel** :
  - `lib/services/university.ts` : `getUniversityRoyalties()` transmet directement le tableau `bouquet_royalties` calculé par Django.
  - `lib/services/bouquet-distribution.ts` : Suppression du recours à `localStorage` et aux 3 universités codées en dur (`DEFAULT_UNIVERSITIES_DATA`). Appel systématique de `/api/v1/partners/university/bouquets/<pk>/distribution/` (côté université) et `/api/v1/admin/bouquet-offerings/<pk>/distribution/` (côté admin).

### Rationale
Respecte le principe fondamental XII de la Constitution LAHAThèque interdisant les mocks et répond à la demande expresse de l'utilisateur.

---

## 4. Double Restitution Visuelle Conforme au Cahier des Charges

### Contexte
La capture fournie par l'utilisateur (Cahier des Charges Section 11) présente :
1. Un diagramme circulaire (camembert) avec titre *« Répartition des consultations (Total bouquet : 10 000 € / XOF) »* et étiquettes extérieures avec pourcentages et volumes.
2. Un graphique en barres horizontales avec titre *« Redevances universitaires (15 %) versées automatiquement »* avec les montants en euros ou en francs CFA.

### Décision
* Réutilisation et fiabilisation du composant vectoriel SVG `BouquetPieDistribution` (`components/features/bouquets/bouquet-pie-distribution.tsx`).
* Remplacement des couleurs aléatoires par une palette harmonieuse de tokens sémantiques.
* Côté Administrateur :
  - Camembert : Répartition d'usage entre 100% des universités détentrices (Option A validée).
  - Barres : Montants des redevances par institution.
  - Cartes de synthèse : Total CA bouquet, total redevances à verser, marge nette LAHA.
* Côté Université :
  - Même structure visuelle, avec mise en exergue de l'université connectée (`isHighlighted`).

---

## 5. Synthèse des Impacts et Fichiers Cibles

| Fichier | Composant | Nature des Modifications |
| :--- | :--- | :--- |
| `apps/reporting/admin_views.py` | Backend Django | Dynamisation de `compute_bouquet_distribution_payload` (taux global admin, lectures réelles `ReaderSession`). |
| `apps/partners/university_views.py` | Backend Django | Nettoyage de `UniversityRoyaltiesView` et `UniversityBouquetDistributionView` (suppression facultés, liaison institutionnelle). |
| `lib/services/bouquet-distribution.ts` | Service Frontend | Suppression des mocks et fallback localStorage ; connexion stricte aux endpoints Django via BFF. |
| `lib/services/university.ts` | Service Frontend | Consommation directe du tableau `bouquet_royalties` renvoyé par l'API réelle. |
| `app/(dashboard)/university/royalties/page.tsx` | Page Frontend | Activation de l'onglet Bouquets (suppression `hidden`), suppression des libellés facultés. |
| `components/features/bouquets/bouquet-distribution-modal.tsx` | Composant UI | Connexion aux données réelles synchronisées de l'API. |
| `components/features/bouquets/bouquet-pie-distribution.tsx` | Composant Graphique | Affichage dynamique strict et gestion de la part plateforme LAHA en synthèse. |
