# 📜 Feature Specification: Module 3 — Contrats, Droits d'Auteur, Pré-Édition et Relances (Espace Juriste)

**Feature Branch**: `003-contrats-droits-juriste`  
**Created / Updated**: 2026-08-20  
**Status**: Ready for Implementation  
**Role**: `legal_reviewer` (Juriste / Relecteur Juridique & Conformité)  
**Source Métier**: Cahier des charges LAHAThèque v3.2 — Section 4 (*Juriste : Contrats, Droits d'auteur, Pré-édition, Relances*) & Section 10 (*Affiliation & Profils*)

---

## 1. 🎯 Résumé Exécutif de la Fonctionnalité

L'Espace Juriste fournit à l'équipe juridique et conformité de LAHA Éditions l'ensemble des outils pour encadrer le cycle de vie contractuel et financier des œuvres :
1. **GED Juridique & Recherche Plein Texte (PostgreSQL FTS)** : Stockage chiffré (Cloudflare R2, limite 800 Mo) et indexation automatique du texte intégral des contrats d'édition, conventions universitaires (UAC, UNA, Parakou, etc.), accords éditeurs tiers et avenants.
2. **Attribution & Verrouillage des Droits d'Auteur** : Configuration des quotes-parts de redevances par ayant droit avec différentiation possible : **Ventes Papier**, **Lectures Numériques** et **Écoutes Audio TTS** (Text-To-Speech / Synthèse vocale intégrée à la liseuse), avec **validation stricte de la somme à 100.00%**.
3. **Gestion des Dossiers de Pré-Édition** : Enregistrement préalable des projets d'ouvrages avant fabrication (titre prévisionnel, auteur, affiliation universitaire, cadre contractuel) et passage de relais fluide vers l'équipe maquette.
4. **Moteur de Relances Automatiques & Journal Immuable** :
   - Émission des rapports périodiques de droits aux auteurs.
   - Relances graduées automatiques pour les clients débiteurs / factures impayées (J+7, J+14, J+21) avec plafonnement anti-spam.
5. **Gestion du Profil & Sécurité Juriste** : Informations civiles officielles, photo de profil, affiliation et changement de mot de passe sécurisé.

---

## 2. 👥 Matrice des Utilisateurs & Permissions

| Rôle | Périmètre d'Action | Restrictions |
| :--- | :--- | :--- |
| **`legal_reviewer` (Juriste)** | Création/édition des contrats, indexation FTS, configuration des clés de répartition de droits, création de dossiers de pré-édition, déclenchement/suivi des relances, gestion de son profil. | Pas d'accès aux paramètres de configuration DRM système ou validation des virements bancaires administratifs. |
| **`admin` / `super_admin`** | Supervision complète de l'activité juridique, validation finale des avenants majeurs, audit des journaux de relance. | - |
| **`author` / `publisher`** | Consultation en lecture seule de leurs propres contrats signés et relevés de droits certifiés. | Aucun accès aux contrats des tiers ou aux dossiers de pré-édition internes. |

---

## 3. 📖 User Stories & Critères d'Acceptation Détaillés

### User Story 1 — Dépôt, Indexation & Recherche Plein Texte des Contrats (Priorité: P1 - MVP)
**En tant que** Juriste connecté,  
**Je veux** téléverser des contrats (PDF, DOCX jusqu'à 800 Mo) avec extraction automatique du texte et recherche plein texte PostgreSQL (`SearchVector`, `SearchQuery`, `SearchRank`),  
**Afin de** retrouver instantanément n'importe quel contrat par mot-clé, clause, nom d'auteur, numéro ou université partenaire.

#### Critères d'Acceptation :
1. **Dépôt sécurisé** : Téléversement via le composant 21st.dev `AuthorFileDropzone` (jusqu'à 800 Mo). Stockage chiffré et extraction automatique du contenu textuel (`pypdf` / `python-docx`).
2. **Recherche FTS** : La barre de recherche interroge le vecteur de recherche `texte_integral_index` et retourne les résultats en moins de 100 ms avec score de pertinence et surbrillance des termes trouvés.
3. **Filtrage multicritères** : Filtrage combiné par type de contrat (`edition_auteur`, `partenariat_universite`, `editeur_tiers`, `pre_edition`, `avenant`), statut (`active`, `expired`, `pending_signature`) et date de signature.

---

### User Story 2 — Clés de Répartition des Redevances & Somme Stricte 100% (Priorité: P1 - MVP)
**En tant que** Juriste connecté,  
**Je veux** définir et verrouiller la grille de répartition des droits d'auteur pour chaque livre ou format (Papier, Numérique, Audio),  
**Afin de** garantir que les calculs financiers automatisés lors des ventes reversent exactement les quotes-parts convenues aux ayants droit.

#### Critères d'Acceptation :
1. **Validation 100% absolue** : Le système refuse tout enregistrement dont la somme des quotes-parts d'un pool d'auteurs n'est pas **strictement égale à 100.00%** (erreur 400 claire : *"La somme des pourcentages de droits doit être exactement de 100.00% (actuel: X%)"*).
2. **Différentiation par support** : Possibilité d'ajuster des taux spécifiques (ex: 12% sur les ventes papier, 15% sur les lectures numériques).
3. **Suggestions IA & Validation manuelle** : L'IA analyse les clauses de droits dans le contrat numérisé et suggère une clé de répartition que le juriste peut approuver, modifier ou rejeter en un clic.

---

### User Story 3 — Dossiers de Pré-Édition Avant Dépôt Maquette (Priorité: P2)
**En tant que** Juriste connecté,  
**Je veux** créer et suivre les dossiers de pré-édition pour les ouvrages en cours de contractualisation,  
**Afin de** valider le cadre légal avant que les maquettistes ne commencent la production technique.

#### Critères d'Acceptation :
1. **Création du dossier** : Saisie du titre prévisionnel, auteur(s), université, faculté, date estimée de remise et notes juridiques.
2. **Liaison contractuelle** : Association avec le contrat cadre ou accord de principe.
3. **Transition de statut** : Passage des statuts `en_attente_depot` $\rightarrow$ `maquette_en_cours` $\rightarrow$ `valide_legalement`.

---

### User Story 4 — Moteur de Relances Automatiques & Journal des Notifications (Priorité: P1 - MVP)
**En tant que** Juriste connecté,  
**Je veux** piloter l'envoi des rapports périodiques de droits d'auteur et les relances de factures impayées,  
**Afin de** maintenir un recouvrement rigoureux et une information transparente des créanciers et partenaires.

#### Critères d'Acceptation :
1. **Relances impayés graduées** :
   - Niveau 1 (J+7 après échéance) : E-mail de courtoisie.
   - Niveau 2 (J+14) : Rappel d'échéance avec récapitulatif de commande.
   - Niveau 3 (J+21) : Mise en demeure formelle avant suspension d'accès institutionnel.
2. **Anti-Spam & Plafonds** : Une même facture ne peut être relancée plus d'une fois tous les 7 jours (maximum 3 relances automatiques avant escalade manuelle).
3. **Journal immuable** : Chaque émission est tracée dans `RelanceEmailJournal` avec statut (`envoye`, `echec`), horodatage et corps du message.

---

### User Story 5 — Profil Officiel & Sécurité du Juriste (Priorité: P1 - MVP)
**En tant que** Juriste connecté,  
**Je veux** consulter mes informations de compte, mon affiliation et mettre à jour mon mot de passe,  
**Afin de** sécuriser l'accès aux documents confidentiels de la maison d'édition.

---

## 4. 🗂️ Cartographie des Écrans de l'Espace Juriste

1. [`/legal-reviewer`](file:///e:/Lahatheque/lahatheque-frontend/app/(dashboard)/legal-reviewer/page.tsx) : Tableau de bord principal (4 KPIs temps réel, contrats récents, alertes d'échéance et suggestions IA).
2. [`/legal-reviewer/contracts`](file:///e:/Lahatheque/lahatheque-frontend/app/(dashboard)/legal-reviewer/contracts/page.tsx) : GED Contrats & Moteur de recherche plein texte FTS.
3. [`/legal-reviewer/contracts/new`](file:///e:/Lahatheque/lahatheque-frontend/app/(dashboard)/legal-reviewer/contracts/new/page.tsx) : Dépôt & indexation d'un nouveau contrat (Dropzone 21st.dev, limite 800 Mo).
4. [`/legal-reviewer/contracts/[id]`](file:///e:/Lahatheque/lahatheque-frontend/app/(dashboard)/legal-reviewer/contracts/[id]/page.tsx) : Fiche détaillée du contrat, texte extrait, clauses et avenants.
5. [`/legal-reviewer/pre-editions`](file:///e:/Lahatheque/lahatheque-frontend/app/(dashboard)/legal-reviewer/pre-editions/page.tsx) : Gestion des dossiers de pré-édition.
6. [`/legal-reviewer/redevances`](file:///e:/Lahatheque/lahatheque-frontend/app/(dashboard)/legal-reviewer/redevances/page.tsx) : Attribution des droits d'auteur (somme 100%), redevances universités et éditeurs tiers.
7. [`/legal-reviewer/relances`](file:///e:/Lahatheque/lahatheque-frontend/app/(dashboard)/legal-reviewer/relances/page.tsx) : Journal des relances automatiques et débiteurs.
8. [`/legal-reviewer/profile`](file:///e:/Lahatheque/lahatheque-frontend/app/(dashboard)/legal-reviewer/profile/page.tsx) : Profil officiel, photo, affiliation et changement de mot de passe réel.

---

## 5. 🛡️ Traque des Non-Dits et Cas Limites

1. **Extraction de texte sur documents volumineux (jusqu'à 800 Mo)** : Extraction asynchrone sécurisée avec gestion de timeout ; si le document est scanné sans OCR, le contrat est quand même persisté et consultable.
2. **Avenants contractuels** : Un avenant conserve la traçabilité des anciennes clés de répartition sans modifier rétroactivement les calculs de redevances des périodes clôturées et payées.
3. **Protection des données sensibles** : Les montants de redevances et les IBAN/MoMo sont chiffrés et accessibles uniquement aux rôles habilités (`legal_reviewer`, `admin`, `super_admin`).

---

## 6. 📊 Critères de Succès & Performance

- **SC-001** : Recherche plein texte exécutée en $<100$ ms sur PostgreSQL.
- **SC-002** : 100% des clés de répartition respectent la validation `sum == 100.00%`.
- **SC-003** : Zéro mock côté frontend — 100% des données alimentées par Django via `/api/bff/legal/*`.
- **SC-004** : 100% des composants UI conformes à 21st.dev et respect strict des tokens CSS sémantiques.
