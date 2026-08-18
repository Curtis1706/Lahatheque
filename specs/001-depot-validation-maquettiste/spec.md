# Feature Specification: Module 1 - Depot et Validation du Catalogue (Maquettiste & Chef Maquettiste)

**Feature Branch**: `001-depot-validation-maquettiste`  
**Created**: 2026-08-18  
**Status**: In Review  
**Source Metier**: Cahier des charges LAHATheque v3.2 (Section 2, Section C), Architecture DRM (`docs/drm/`)

---

## 1. Resume Executif de la Fonctionnalite

Ce module gere l'entree de tout nouvel ouvrage dans la LAHATheque :
1. Le **Maquettiste** televerse les fichiers sources (PDF, EPUB, pistes audio eventuelles) et l'image de couverture haute resolution, renseigne les metadonnees et beneficie de l'assistance automatique de l'IA (suggestions de resume, discipline, langue, pays et universite/faculte).
2. Le **Chef Maquettiste** examine les depots en attente, verifie la conformite des fichiers et des metadonnees, et valide ou rejette avec motif.
3. **Mise en ligne automatique et immediate** : La validation declenche instantanement la publication de l'ouvrage sur la vitrine publique avec chiffrement au repos AES-256-GCM sur Cloudflare R2, creation de la configuration DRM par defaut (`ProtectionConfig`) et disponibilite immediate pour les lecteurs.

---

## 2. User Scenarios & Acceptance Criteria (Prioritises)

### User Story 1 - Depot d'un ouvrage avec assistance IA (Priorite: P1 - MVP)

En tant que Maquettiste connecte, je veux deposer les fichiers d'un livre (PDF/EPUB, couverture, eventuellement audio) et saisir les metadonnees avec pre-remplissage automatique par l'IA, afin d'enregistrer une maquette prete pour validation.

**Valeur Metier** : Point d'entree unique et obligatoire du catalogue de LAHATheque.

**Test d'independance** : Soumission d'un formulaire de depot avec fichier PDF valide et couverture ; verification de la creation d'un enregistrement `OuvrageDepot` au statut `en_attente`.

**Scenarios d'acceptation** :
1. **Etant donne** un utilisateur authentifie avec le role `maquettiste`, **Quand** il soumet le titre, l'auteur, le fichier PDF et la couverture, **Alors** le fichier est stocke de maniere securisee, l'entite `OuvrageDepot` est creee au statut `en_attente` et renvoie un code 201 Created.
2. **Etant donne** un fichier PDF televerse, **Quand** le service IA transverse est sollicite, **Alors** des suggestions de classification (discipline, langue, pays, resume) sont retournees et peuvent etre validees ou surchargees manuellement par le maquettiste.
3. **Etant donne** un livre comportant des pistes audio, **Quand** le maquettiste joint des fichiers MP3/M4B, **Alors** ces pistes sont associees au depot avec le flag `has_audio = True`.

---

### User Story 2 - Examen et Validation par le Chef Maquettiste (Priorite: P1 - MVP)

En tant que Chef Maquettiste connecte, je veux examiner la liste des depots en attente et valider un depot conforme pour declencher sa publication automatique et immediate sur la vitrine publique.

**Valeur Metier** : Garantie de qualite editoriale et mise sur le marche instantanee sans etape manuelle supplementaire.

**Test d'independance** : Appel de l'endpoint de validation sur un depot `en_attente` ; verification du passage au statut `valide` et de la creation transactionnelle de l'entite `Ouvrage` publiee.

**Scenarios d'acceptation** :
1. **Etant donne** un depot au statut `en_attente`, **Quand** le Chef Maquettiste valide le depot, **Alors** :
   - Le statut du depot passe a `valide` et le champ `validateur` enregistre son identifiant.
   - Une entite `Ouvrage` est creee et marquee `is_published = True`.
   - Une `ProtectionConfig` par defaut est associee a l'ouvrage.
   - La reponse API renvoie les identifiants du depot et de l'ouvrage publie.
2. **Etant donne** un utilisateur sans role `chef_maquettiste` ou `admin`, **Quand** il tente de valider un depot, **Alors** le systeme bloque l'operation avec un code 403 Forbidden.

---

### User Story 3 - Rejet d'un depot avec motif obligatoire (Priorite: P2)

En tant que Chef Maquettiste connecte, je veux rejeter un depot non conforme en saisissant un motif obligatoire, afin que le maquettiste soit notifie et effectue les corrections.

**Test d'independance** : Rejet avec motif textuel ; verification du statut `rejete` et de l'enregistrement du motif.

**Scenarios d'acceptation** :
1. **Etant donne** un depot `en_attente`, **Quand** le Chef Maquettiste soumet un rejet avec un motif explicite ("Couverture pixellisee"), **Alors** le statut devient `rejete` et le motif est enregistre.
2. **Etant donne** une requete de rejet sans motif ou avec un motif vide, **Quand** la requete est executee, **Alors** le systeme renvoie une erreur 400 Bad Request.

---

## 3. Traque des Non-Dits et Cas Limites (Etape Clarify)

1. **Validation stricte des types MIME** : Verification des en-tetes reels (magic bytes) des fichiers PDF (`application/pdf`), EPUB (`application/epub+zip`), images (`image/jpeg`, `image/png`) et audio (`audio/mpeg`, `audio/mp4`). Rejet immediat de tout executable ou format frelate.
2. **Quotas de taille et timeouts** : Limite a 200 Mo pour les PDF, 50 Mo pour les couvertures et 500 Mo pour les archives audio. Uploads volumineux traites par flux ou URLs pre-signees.
3. **Resilience du service IA** : Si l'API LLM / IA est indisponible ou depasse 5 secondes de timeout, le depot continue normalement avec des valeurs par defaut sans bloquer l'enregistrement du maquettiste.
4. **Protection contre la concurrence** : Verrouillage transactionnel `@transaction.atomic` et verification du statut `en_attente` pour empecher une double validation simultanee.
5. **Immutabilite post-validation** : Un depot valide ne peut plus etre modifie ; toute correction ulterieure passe par une nouvelle version de catalogue.

---

## 4. Exigences Fonctionnelles (FR)

- **FR-001** : Authentification obligatoire basee sur cookies HttpOnly JWT et controle de permissions (`IsMaquettiste`, `IsChefMaquettisteOrAdmin`).
- **FR-002** : Stockage des fichiers sources sur Cloudflare R2 chiffre (AES-256-GCM) sans exposition d'URL publique.
- **FR-003** : Saisie et stockage des metadonnees : titre, sous-titre, auteur(s), co-auteurs, ISBN, discipline, langue, pays, universite, faculte, resume, mots-cles.
- **FR-004** : Endpoint IA transverse de suggestion de classification (`POST /api/v1/ai/classify/`).
- **FR-005** : Prise en charge des fichiers audio multiples associes a un depot.
- **FR-006** : Creation atomique de l'entite `Ouvrage` publiee des validation par le Chef Maquettiste.
- **FR-007** : Enregistrement obligatoire du motif lors de tout rejet de maquette.
- **FR-008** : Eradication des requetes SQL N+1 via `select_related("maquettiste", "validateur")`.
- **FR-009** : Format de reponse unifie `{ "success": boolean, "data": object|array, "error": string|null }`.
- **FR-010** : Zero emoji dans tout le code, les logs et les messages d'erreur.

---

## 5. Criteres de Succes Mesurables (SC)

- **SC-001** : 100% des depots valides par le Chef Maquettiste sont immediatement accessibles sur la vitrine.
- **SC-002** : Temps moyen de validation / publication < 200 ms.
- **SC-003** : 0 requete SQL N+1 detectee sur les listings de maquettes.
- **SC-004** : 100% des routes couvertes par des tests Pytest d'integration.
