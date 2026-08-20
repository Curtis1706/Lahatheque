# Feature Specification: Module 011 — Espace Auteur, Redevances & Dépôts de Manuscrits

**Feature Branch**: `011-espace-auteur-redevances-manuscrits`  
**Created**: 2026-08-20  
**Status**: Ready for Implementation  
**Source Métier**: Cahier des charges LAHAThèque v3.2 - Section 4.1 (Espace Auteur : Suivi des ventes, Droits rétribués, Demandes de versement, Soumissions de manuscrits, Profil & Délégation)

---

## 1. Résumé Exécutif de la Fonctionnalité

L'**Espace Auteur** permet à tout auteur publié ou en cours d'édition sur LAHAThèque de :
1. **Consulter ses Ouvrages Publiés** : Suivi commercial strict des livres mis en vente (chiffre d'affaires net, ventilation numérique/papier/streaming, répartition géographique par pays africains UEMOA/CEDEAO).
2. **Piloter ses Redevances & Demander des Versements** : Visualiser les relevés périodiques certifiés, son solde en attente de versement, et émettre des **demandes de retrait direct** via **Mobile Money (MTN MoMo, Moov Money, Orange Money, Wave)** ou **Virement Bancaire (RIB/IBAN UEMOA)**.
3. **Validation / Rejet Admin des Retraits** : L'administrateur financier ou super-admin peut approuver (avec référence de transaction) ou rejeter (avec motif) chaque demande de versement.
4. **Déposer des Projets de Manuscrits (Circuit en 2 Étapes)** :
   - **Étape 1 (Étude Éditoriale)** : Dépôt du fichier brut (PDF/Word) avec analyse IA PyMuPDF + OpenAI, résumé et langue. Évaluation par le comité éditorial de LAHA Éditions.
   - **Étape 2 (Préparation Catalogue)** : Une fois accepté, le dossier bascule vers l'espace Maquettiste pour enrichissement, classification Dewey et création de la notice vitrine ONIX 3.0.
5. **Gérer son Profil & Délégations** : Nom de plume, affiliation universitaire, coordonnées de paiement, gestion des accès délégués (co-auteurs / assistants) et modification de mot de passe sécurisée.

---

## 2. User Stories & Critères d'Acceptation

### User Story 1 — Consultation des Ventes & Droits Rétribués (Priorité: P1 - MVP)
En tant qu'Auteur connecté, je veux consulter mes KPIs réels et mes livres publiés afin de connaître précisément les ventes et ma part de redevances perçues.
- **AC 1.1** : Les KPIs affichent en temps réel les ventes cumulées, les lectures protégées par DRM, les droits en attente et les droits versés.
- **AC 1.2** : La page `/author/books` liste exclusivement les livres publiés avec ventilation par pays et par format.
- **AC 1.3** : La page `/author/books/[id]` détaille l'historique des ventes et le taux contractuel négocié (ex: 15%).

### User Story 2 — Demandes de Retrait & Gestion Financière (Priorité: P1 - MVP)
En tant qu'Auteur connecté, je veux demander un versement de mes droits d'auteur vers mon compte Mobile Money ou bancaire dès que mon solde est positif.
- **AC 2.1** : Le formulaire de retrait permet de choisir le canal (MTN MoMo, Moov Money, Orange, Wave, Virement) et de saisir le compte bénéficiaire.
- **AC 2.2** : Le montant demandé ne peut excéder le solde en attente.
- **AC 2.3** : La demande est enregistrée avec le statut `pending` et devient visible dans le dashboard Admin pour validation.
- **AC 2.4** : Dès validation par l'admin, le statut passe à `paid` avec référence de transaction et le solde en attente est débité.

### User Story 3 — Dépôt de Manuscrit & Assistance IA (Priorité: P1 - MVP)
En tant qu'Auteur, je veux déposer un manuscrit avec extraction automatique par l'IA du titre, du résumé et des métadonnées clés.
- **AC 3.1** : La dropzone accepte les formats PDF, EPUB et DOCX.
- **AC 3.2** : L'IA PyMuPDF extrait le titre et propose un résumé préliminaire modifiable.
- **AC 3.3** : Le stepper à 2 étapes reflète fidèlement la progression du dossier (Étude éditoriale → Préparation maquette → Publication).

### User Story 4 — Paramètres du Profil, Délégation & Sécurité (Priorité: P1)
En tant qu'Auteur, je veux gérer mes coordonnées bancaires, inviter des co-auteurs et modifier mon mot de passe.
- **AC 4.1** : L'invitation d'un co-auteur ou assistant met à jour la liste des délégations sans rechargement.
- **AC 4.2** : La modification du mot de passe vérifie l'ancien mot de passe via `user.check_password()` et applique le chiffrement PBKDF2 / Argon2.
