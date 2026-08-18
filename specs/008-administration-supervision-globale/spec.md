# Feature Specification: Module 8 - Administration Globale et Supervision (Administrateur)

**Feature Branch**: `008-administration-supervision-globale`  
**Created**: 2026-08-18  
**Status**: In Review  
**Source Metier**: Cahier des charges LAHATheque v3.2 - Section 1 et Section 15 (Administrateur : Supervision globale, Tarification multi-pays XOF/XAF, DRM, Relances)

---

## 1. Resume Executif de la Fonctionnalite

Permettre a l'**Administrateur** de :
1. Superviser l'ensemble de la plateforme LAHATheque deployee dans les differents pays africains (Benin, Senegal, Cote d'Ivoire, Niger, Togo, Gabon, Cameroun, RDC, etc.).
2. Visualiser les tableaux de bord consolidés : ventes par pays et par format, consultations, licences actives, revenus en devises locales (**XOF**, **XAF**, **CDF**, **USD**).
3. Fixer la politique tarifaire : prix par defaut du catalogue (ex: 5 000 XOF) et ajustement au cas par cas, livre par livre ou pays par pays (avec coefficients multiplicateurs par devise).
4. Superviser l'ensemble des comptes (Auteurs, Editeurs, Universites, Clients) et piloter les relances automatiques (depots en attente, impayes, abonnements expirant).
5. Configurer les options globales de securite et de DRM de la bibliotheque numerique.

---

## 2. User Scenarios & Acceptance Criteria (Prioritises)

### User Story 1 - Tableau de bord panoramique multi-pays (Priorite: P1 - MVP)

En tant qu'Administrateur, je veux visualiser sur un tableau de bord unique l'activite globale et filtrer par pays d'Afrique de l'Ouest et Centrale (ventes, consultations, abonnements, redevances).

**Scenarios d'acceptation** :
1. **Etant donne** un Administrateur authentifie, **Quand** il ouvre le tableau de bord d'administration, **Alors** les indicateurs cles sont calcules par aggregation SQL sans lenteur et affichent les volumes en Franc CFA (XOF/XAF) et USD.

---

### User Story 2 - Gestion de la tarification par defaut et par pays (Priorite: P1 - MVP)

En tant qu'Administrateur, je veux definir un prix unitaire numerique par defaut pour le catalogue (ex: 5 000 XOF) et surcharger individuellement certains titres ou zones monetaires.

---

## 3. Exigences Fonctionnelles (FR)

- **FR-001** : Modeles `ConfigurationPlateformeGlobale`, `TarificationPaysConfig`, `SupervisionAuditLog`.
- **FR-002** : Devise globale par defaut `XOF` (Franc CFA), avec support `XAF`, `CDF`, `GNF`, `USD`.
- **FR-003** : Vues d'agregation SQL directes pour les KPI financiers et d'usage.
- **FR-004** : Format JSON unifie `{ "success": boolean, "data": object|array, "error": string|null }`.

---

## 4. Criteres de Succes Mesurables (SC)

- **SC-001** : Chargement du tableau de bord global en moins de 300 ms.
- **SC-002** : 100% des modifications de parametres globaux tracees dans les logs d'audit.
