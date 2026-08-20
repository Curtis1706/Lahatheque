# Feature Specification: Module 8 - Administration Globale, Tarification, Supervision et Relances

**Feature Branch**: `008-administration-supervision-globale`  
**Created**: 2026-08-18  
**Status**: Ready for Implementation  
**Source Métier**: Cahier des charges LAHAThèque v3.2 (Section 19-20, Section 4.1.1, Section 15)

---

## 1. Résumé Exécutif et Périmètre Strict

L'**Administrateur (Super Admin)** assure le pilotage stratégique et la configuration globale de LAHAThèque :
1. **Vision Globale & Statistiques Consolidées** : Accès à tous les indicateurs (ventes, consultations, utilisateurs, abonnements, redevances par pays en devises locales XOF/XAF/CDF/USD).
2. **Gestion de la Tarification (Cascade Tarifaire)** :
   - Fixation d'un prix global par défaut applicable à tout le catalogue (ex: 3 000 FCFA).
   - Modification manuelle du prix livre par livre au cas par cas (le prix spécifique prévaut sur le prix par défaut).
   - Réalignement possible en 1 clic d'un livre spécifique sur le tarif global.
3. **Moteur Automatique de Relances** :
   - Relance automatique des Auteurs/Éditeurs ayant des dépôts en attente de validation depuis plus de 7 jours.
   - Relance automatique des clients ayant des factures impayées (J+7, J+15, J+30) avec lien de paiement direct Mobile Money.
   - Relance automatique des abonnements individuels et bouquets arrivant à expiration (J-15 et J-3).
4. **Supervision des 10 Rôles & Sécurité** :
   - Activation, suspension ou révocation de tout compte utilisateur ou clé API partenaire.
   - Configuration des switchs globaux de protection DRM (filigrane dynamique par défaut, opacité, blocage impression).

---

## 2. User Scenarios & Acceptance Criteria (Priorisés)

### User Story 1 - Tableau de Bord Consolidé Multi-Pays (Priorité: P1 - MVP)
En tant qu'Administrateur connecté, je veux visualiser sur un tableau de bord panoramique les ventes totales, les consultations en ligne, le nombre d'utilisateurs actifs par rôle et filtrer par pays d'Afrique de l'Ouest et Centrale.

- **Critères d'Acceptation :**
  - KPI financiers affichés en FCFA (XOF/XAF) avec conversion transparente.
  - Graphiques de distribution des ventes (numérique, papier, audio, bouquets).
  - Temps de chargement inférieur à 300 ms grâce à des agrégations SQL optimisées.

### User Story 2 - Définition du Prix Global et Tarification au Cas par Cas (Priorité: P1 - MVP)
En tant qu'Administrateur, je veux configurer le prix global par défaut du catalogue et modifier individuellement le prix d'un livre spécifique.

- **Critères d'Acceptation :**
  - Modification du prix global : met à jour immédiatement le prix affiché sur la vitrine pour tous les livres n'ayant pas de prix spécifique.
  - Surcharge individuelle : un livre avec `prix_specifique = 5000` reste à 5 000 FCFA même si le prix global passe à 3 500 FCFA.
  - Bouton "Réinitialiser au prix par défaut" sur chaque fiche livre.

### User Story 3 - Pilotage des Relances Automatiques (Priorité: P1 - MVP)
En tant qu'Administrateur, je veux visualiser la liste des relances programmées et exécutées (dépôts en attente, impayés, abonnements expirants) et pouvoir déclencher manuellement une vague de relances.

- **Critères d'Acceptation :**
  - Tableau de bord `/admin/reminders` listant les 3 catégories de relances avec statut d'envoi.
  - Tâche Celery Beat quotidienne envoyant les notifications par email/SMS sans doublon.

---

## 3. Exigences Fonctionnelles (FR)

- **FR-001** : Modèle `ConfigurationPlateformeGlobale` (prix_defaut_xof, copyright_watermark_defaut, opacite_watermark, delai_relance_depot_jours).
- **FR-002** : Modèle `RelanceAutomatiqueLog` pour tracer chaque notification de relance émise.
- **FR-003** : Endpoint `GET/PATCH /api/v1/admin/settings/pricing/` pour la gestion du prix global.
- **FR-004** : Endpoint `GET/POST /api/v1/admin/reminders/trigger/` pour l'exécution des relances.
- **FR-005** : Zéro code couleur hexadécimal en dur dans les composants frontend et zéro emoji dans le code et les logs.
