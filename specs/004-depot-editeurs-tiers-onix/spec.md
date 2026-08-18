# Feature Specification: Module 4 - Depot Editeurs Tiers et Synchronisation ONIX (Partenaires)

**Feature Branch**: `004-depot-editeurs-tiers-onix`  
**Created**: 2026-08-18  
**Status**: In Review  
**Source Metier**: Cahier des charges LAHATheque v3.2 - Section 5 (Editeurs Tiers : Espace, ONIX 3.0, API REST, Validation)

---

## 1. Resume Executif de la Fonctionnalite

Permettre aux **maisons d'edition partenaires** de :
1. Disposer d'un espace securise (OAuth2 / Cle API) pour administrer leur catalogue et consulter leurs ventes.
2. Deposer leurs ouvrages selon 3 modalites : formulaire web unitaire ou lot ZIP, import de catalogue en masse (ONIX 3.0, CSV, JSON) et API REST securisee.
3. Renseigner l'integralite des metadonnees : identification (titre, ISBN papier/numerique, DOI), contributeurs (auteurs, ORCID, traducteurs), classification academique, informations commerciales (prix par pays/devise, embargo), visuels et droits/licences.
4. Suivre le flux de validation rigoureux par LAHA Editions : controle automatique (anti-virus, completude), examen par l'equipe editoriale LAHA, notification d'approbation ou de demande de correction avec motif, puis publication finale sur la vitrine.

---

## 2. User Scenarios & Acceptance Criteria (Prioritises)

### User Story 1 - Import de catalogue en masse par flux ONIX 3.0 (Priorite: P1 - MVP)

En tant qu'Editeur partenaire, je veux televerser un fichier XML standard ONIX 3.0 avec les fichiers PDF/EPUB associes, afin d'injecter des dizaines d'ouvrages en une seule operation dans la file de validation de LAHATheque.

**Scenarios d'acceptation** :
1. **Etant donne** un flux ONIX 3.0 valide, **Quand** le fichier est televerse, **Alors** le parseur extrait toutes les balises `Product`, valide les ISBN et les prix par devise, stocke les fichiers sur R2 chiffre et cree les enregistrements `DepotEditeurTiers` au statut `en_attente_controle`.
2. **Etant donne** un fichier XML corrompu ou non conforme a la DTD/Schema ONIX 3.0, **Quand** il est traite, **Alors** le systeme renvoie un rapport d'erreurs detaille indiquant la ligne et le produit en defaut.

---

### User Story 2 - Synchronisation programmatique par API REST (Priorite: P1 - MVP)

En tant que developpeur ERP d'une maison d'edition tierce, je veux appeler l'API REST de LAHATheque (`POST /api/v1/publishers/depots/`) avec authentification OAuth2 (Client Credentials), afin d'automatiser l'envoi de nos parutions.

**Scenarios d'acceptation** :
1. **Etant donne** un client OAuth2 authentifie, **Quand** il transmet une notice en JSON multipart avec le fichier PDF, **Alors** le depot est cree et renvoie un statut 201 Created avec l'identifiant du depot.

---

### User Story 3 - Examen et Validation par l'equipe LAHA Editions (Priorite: P1 - MVP)

En tant qu'Administrateur / Validateur LAHA Editions, je veux examiner les depots d'un editeur tiers, verifier la conformite editoriale et juridique, et valider pour declencher la publication immediate sur la vitrine.

**Scenarios d'acceptation** :
1. **Etant donne** un depot `en_examen_laha`, **Quand** l'equipe LAHA clique sur "Valider et Publier", **Alors** l'ouvrage est publie sur la vitrine avec sa redevance contractuelle configuree.
2. **Etant donne** une anomalie constatee, **Quand** l'equipe LAHA demande une correction avec motif, **Alors** le statut passe a `demande_correction` et l'editeur est notifie par e-mail.

---

## 3. Traque des Non-Dits et Cas Limites (Etape Clarify)

1. **Gestion des doublons d'ISBN** : Un ISBN deja existant dans le catalogue LAHA actif bloque la creation d'un doublon, sauf s'il s'agit d'une mise a jour explicite par le meme editeur tiers proprietaire.
2. **Gestion des dates d'embargo** : Si un ouvrage a une `date_disponibilite` future, il est valide mais reste masque de la vitrine jusqu'a l'echeance de l'embargo (deverrouillage automatique par tache Celery).
3. **Multi-devises et territoires d'exploitation** : Verification que les prix sont bien renseignes pour les devises cibles (XOF, EUR, USD) avec restriction territoriale par pays.

---

## 4. Exigences Fonctionnelles (FR)

- **FR-001** : Espace editeur tiers securise par OAuth 2.0 (Client Credentials) et API Keys.
- **FR-002** : Modeles `CompteEditeurTiers`, `DepotEditeurTiers`, `ImportBatchLog`.
- **FR-003** : Parseur ONIX 3.0 conforme a la norme EDItEUR.
- **FR-004** : Traitement asynchrone Celery des imports volumineux avec notification de fin d'import.
- **FR-005** : Workflow complet : `en_attente_controle` -> `en_examen_laha` -> `valide_publie` / `demande_correction` / `rejete`.
- **FR-006** : Format JSON unifie `{ "success": boolean, "data": object|array, "error": string|null }`.

---

## 5. Criteres de Succes Mesurables (SC)

- **SC-001** : Traitement d'un lot ONIX de 100 ouvrages en moins de 30 secondes en arriere-plan.
- **SC-002** : 100% des erreurs de parsing ONIX explicitement detaillees dans le rapport d'import.
