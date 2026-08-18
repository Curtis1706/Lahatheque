# Feature Specification: Module 3 - Contrats, Droits d'Auteur et Relances (Juriste)

**Feature Branch**: `003-contrats-droits-juriste`  
**Created**: 2026-08-18  
**Status**: In Review  
**Source Metier**: Cahier des charges LAHATheque v3.2 - Section 4 (Juriste : Contrats, Droits d'auteur, Pre-edition, Relances)

---

## 1. Resume Executif de la Fonctionnalite

Permettre au **Juriste** de :
1. Stocker de maniere securisee et indexer en recherche plein texte (PostgreSQL FTS) l'ensemble des contrats d'edition, accords de partenariat universitaires et contrats d'editeurs tiers (PDF, Word).
2. Definir et verrouiller les pourcentages de repartition des droits d'auteur pour chaque ouvrage (avec differenciation possible papier / numerique / audio).
3. Gerer les dossiers de pre-edition (pre-enregistrement d'un livre avant production : titre, auteur, universite, faculte).
4. Piloter les relances automatiques par e-mail : rapports de ventes et releves de droits aux auteurs, et relances automatiques graduees pour les clients debiteurs ou factures impayees.

---

## 2. User Scenarios & Acceptance Criteria (Prioritises)

### User Story 1 - Indexation et Recherche Plein Texte des Contrats (Priorite: P1 - MVP)

En tant que Juriste connecte, je veux televerser un contrat au format PDF ou Word afin que son contenu soit automatiquement extrait et indexe, et que je puisse le retrouver par recherche de mots-cles, noms d'auteurs, universites ou dates.

**Scenarios d'acceptation** :
1. **Etant donne** un fichier de contrat PDF/Word valide, **Quand** le juriste le televerse, **Alors** le fichier est stocke sur Cloudflare R2 chiffre, son texte integral est extrait dans `texte_integral_index` et l'entite `ContratLegal` est creee.
2. **Etant donne** une recherche textuelle sur "Convention UAC 2026", **Quand** le juriste execute la requete, **Alors** les contrats pertinents sont retournes en moins de 100 ms avec surbrillance des termes.

---

### User Story 2 - Attribution et Verrouillage des Droits d'Auteur (Priorite: P1 - MVP)

En tant que Juriste connecte, je veux attribuer les pourcentages de droits d'auteur par ayant droit sur un ouvrage, afin que le module financier applique automatiquement ces regles lors des ventes.

**Scenarios d'acceptation** :
1. **Etant donne** un livre avec un auteur principal a 70% et un co-auteur a 30%, **Quand** le juriste enregistre la cle de repartition, **Alors** le systeme verifie que le total est strictement egal a 100.00% et verrouille l'enregistrement.
2. **Etant donne** une saisie dont la somme des pourcentages est differente de 100%, **Quand** la requete est soumise, **Alors** le systeme renvoie une erreur 400 Bad Request explicite ("La somme des droits doit etre exactement egale a 100%").

---

### User Story 3 - Gestion des Dossiers de Pre-edition (Priorite: P2)

En tant que Juriste connecte, je veux creer une fiche de pre-edition pour un manuscrit a venir, afin de preparer le cadre contractuel avant le travail des maquettistes.

**Scenarios d'acceptation** :
1. **Etant donne** un titre previsionnel et un auteur affilie a une universite, **Quand** le juriste cree le dossier de pre-edition, **Alors** le dossier est cree et peut etre lie au futur depot maquettiste.

---

### User Story 4 - Moteur de Relances Automatiques (Auteurs et Impayes) (Priorite: P1 - MVP)

En tant que Juriste connecte, je veux que la plateforme emette automatiquement les e-mails periodiques de rapports de droits aux auteurs et les relances de paiement aux clients ayant des factures impayees.

**Scenarios d'acceptation** :
1. **Etant donne** une facture client depassant la date d'echeance de 7 jours, **Quand** la tache Celery nocturne s'execute, **Alors** un email de relance de niveau 1 est envoye et consigne dans `RelanceEmailJournal`.

---

## 3. Traque des Non-Dits et Cas Limites (Etape Clarify)

1. **Extraction de texte robuste** : Prise en charge des PDF scannes ou natifs via `pypdf` / `pdfplumber` et des `.docx` via `python-docx`. Si l'extraction echoue, le contrat reste consultable et telechargeable par le Juriste.
2. **Avenants contractuels** : Gestion de l'historique des contrats (un avenant remplace une ancienne cle de repartition a partir d'une `date_effet` sans retroactivite sur les ventes passees).
3. **Plafonds et relances anti-spam** : Une facture impayee ne peut declencher plus d'une relance tous les 7 jours, avec un maximum de 3 relances avant alerte administrative.

---

## 4. Exigences Fonctionnelles (FR)

- **FR-001** : Authentification et controle de permission `IsJuristeOrAdmin`.
- **FR-002** : Modeles `ContratLegal`, `RepartitionDroits`, `PreEditionDossier`, `RelanceEmailJournal`.
- **FR-003** : Recherche plein texte FTS (`SearchVector`, `SearchQuery`, `SearchRank`) sur PostgreSQL.
- **FR-004** : Validation stricte `sum(pourcentages) == 100.00` sur les cles de repartition.
- **FR-005** : Taches Celery planifiees pour les relances automatiques avec journalisation de l'envoi.
- **FR-006** : Format JSON unifie `{ "success": boolean, "data": object|array, "error": string|null }`.

---

## 5. Criteres de Succes Mesurables (SC)

- **SC-001** : Recherche de contrat plein texte en moins de 100 ms sur une base de 10 000 contrats.
- **SC-002** : 100% des repartition de droits appliquees sans ecart d'arrondi superieur a 0.01 devise.
