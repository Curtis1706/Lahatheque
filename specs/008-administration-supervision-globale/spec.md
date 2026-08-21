# Feature Specification: Module 8 - Espace Administration Globale, Tarification, Supervision & Relances

**Feature Branch**: `008-administration-supervision-globale`  
**Created**: 2026-08-21  
**Status**: Ready for Implementation  
**Source Métier**: Cahier des charges LAHAThèque v3.2 (Sections 1, 4.1.1, 4.1.6, 7, 10, 11, 12, 15, 19, 20)

---

## 1. Résumé Exécutif & Périmètre Métier

L'**Espace Administration** (`/admin`) est le centre de commandement névralgique et régalien de LAHAThèque. Réservé aux profils `admin` et `super_admin`, il assure la gouvernance globale de la plateforme, le pilotage financier multi-pays, la cascade tarifaire, la modération et la validation directe des flux de maquettage, l'arbitrage des contrats juridiques, la supervision des stocks physiques et entrepôts, la validation des versements de redevances et la sécurité des accès partenaires.

### Règle d'Architecture Dédiée :
L'administrateur dispose de **ses propres pages dédiées sous `/admin/...`** pour chaque domaine métier (aucune redirection ni partage d'interface avec les pages `/manager`, `/legal-reviewer`, `/chief-layout`, `/student`).

---

## 2. Périmètre Fonctionnel Exhaustif

### A. Tableau de Bord Panoramique 360° (`/admin`)
- Agrégation consolidée des ventes en devises locales africaines (XOF, XAF, CDF, USD) et conversions automatiques.
- Répartition des revenus par format : eBooks numériques, Livres papier physiques, Livres audio, Bouquets universitaires, Abonnements individuels.
- Répartition des 13 rôles de la plateforme, volume d'utilisateurs actifs, consultations et sessions de lecture en direct.

### B. Gestion des Utilisateurs & Attribution des Rôles (`/admin/users`, `/admin/users/[role]`)
- Annuaire filtrable global et **pages spécialisées par rôle** (`/admin/users/auteurs`, `/admin/users/editeurs`, `/admin/users/juristes`, `/admin/users/maquettistes`, `/admin/users/universites`, `/admin/users/clients`, `/admin/users/grossistes`).
- Assistant de création de compte en 3 étapes avec génération automatique d'un mot de passe temporaire robuste (12 caractères).
- **Confidentialité Administrateur** : Le mot de passe temporaire n'est pas affiché sur l'écran d'administration mais transmis directement et exclusivement par email au titulaire.
- **Envoi d'e-mail de bienvenue officiel HTML & Texte via SMTP Hostinger** avec guide métier personnalisé selon le rôle, charte Navy & Or et consignes de sécurité.
- Actions administratives : Suspension/Réactivation en 1 clic, Suppression définitive avec modale de confirmation, Envoi d'e-mail administratif personnalisé, Réinitialisation de mot de passe.

### C. Supervision du Maquettisme & Validation BAT Directe (`/admin/validation`, `/admin/validation/[id]`)
- **Traçabilité Complète (Qui & Quand)** :
  - Identification de l'intervenant ayant déposé ou validé l'épreuve (Nom, prénom, rôle : Maquettiste ou Chef Maquettiste).
  - Horodatage précis (date, heure et fuseau horaire).
  - Version de l'épreuve (`v1.0`, `v1.1`, `v2.0 - BAT`), fichier associé et notes de correction.
- **Pouvoir de Validation Souverain de l'Admin** :
  - L'Admin peut lui-même examiner l'épreuve et valider le Bon à Tirer ou refuser la maquette.
  - **Synchronisation des statuts avec motif** :
    - En attente de validation admin : statut `pending_admin_approval` affiché aux acteurs.
    - Validé par l'Admin : statut `published` / `approved` immédiatement synchronisé chez le maquettiste, chef maquettiste et éditeur.
    - Rejeté par l'Admin : statut `rejected` avec saisie obligatoire d'un **motif de rejet explicite** consultable immédiatement par les acteurs pour correction.

### D. Supervision Juridique, Contrats & Arbitrage (`/admin/contracts`, `/admin/contracts/[id]`)
- File de suivi des contrats d'auteurs, partenariats éditeurs tiers et pré-éditions instruits par le Juriste.
- **Actions soumises à validation Admin** :
  - Approbation finale des contrats cadres et accords éditeurs.
  - Validation des barèmes dérogatoires de redevances négociés hors barème standard.
  - Levée ou confirmation de litiges et blocages de compte.
- **Synchronisation & Traçabilité** :
  - Le juriste suit l'état d'avancement (en attente d'approbation admin, validé avec horodatage, ou rejeté avec motif).

### E. Supervision des Stocks Physiques, Entrepôts & Pertes (`/admin/stock`, `/admin/stock/movements`, `/admin/stock/warehouses`)
- Supervision des entrepôts régionaux (Bénin - Cotonou, Sénégal - Dakar, Côte d'Ivoire - Abidjan...).
- Inventaire global, valorisation du stock physique et suivi des seuils d'alerte critique.
- **Validation des Régularisations d'Inventaire Exceptionnelles** :
  - Déclaration de pertes, avaries ou destructions d'exemplaires papier initiées par le gestionnaire.
  - L'Admin valide la passation en perte comptable ou rejette avec motif d'audit.
- Gestion des entrepôts (création, assignation de responsable, capacité maximale).

### F. Catalogue Global, Cascade Tarifaire & Lecteur Souverain (`/admin/catalog`, `/admin/catalog/[id]`, `/admin/catalog/pricing`, `/admin/catalog/protection`)
- **Catalogue Global** : Supervision consolidée des ouvrages (LAHA et Éditeurs Tiers), statut de publication, discipline et formats.
- **Accès Lecteur Souverain** : Bouton direct "Lire l'ouvrage" ouvrant le lecteur officiel sécurisé LAHAThèque (`/catalog/reader/[id]`) avec jeton superviseur sans restriction d'achat.
- **Cascade Tarifaire & Réalignement en 1 Clic (`/admin/catalog/pricing`)** :
  - Définition des tarifs par défaut (numérique, papier, audio).
  - Définition de prix spécifiques par ouvrage et bouton de réalignement en 1 clic sur la cascade globale.
- **Supervision DRM & Filigrane (`/admin/catalog/protection`, `/admin/settings/drm`)** :
  - Filigrane dynamique (texte, opacité 10% à 40%), switchs d'impression et capture.

### G. Validation & Ordonnancement des Versements de Redevances (`/admin/royalties`)
- Modification interactive des pourcentages globaux de redevances (Auteurs 70%, Éditeurs 22%, Universités 15%, Plateforme 8%).
- Réglage dérogatoire par maison d'édition ou auteur.
- Validation des demandes de retrait avec saisie de référence de virement bancaire / Mobile Money (MTN, Moov, Orange, Wave).

### H. Moteur de Relances Automatiques & Traçabilité (`/admin/reminders`)
- Relances des maquettes en attente > 7 jours, commandes impayées et abonnements expirants (J-15, J-3).
- Bouton de déclenchement forcé immédiat via Celery Beat et journal des envois.

### I. Journal d'Audit & Télémétrie (`/admin/logs`, `/admin/security/traces`)
- Journal d'audit immuable de toutes les actions d'administration (`JournalAuditAdmin`).
- Télémétrie en temps réel des accès de lecture LCP DRM.

---

## 3. Scénarios Utilisateurs & Critères d'Acceptation (Gherkin)

### User Story 1 — Validation BAT Maquettisme & Synchronisation Statut (Priorité: P1)
```gherkin
Scenario: L'administrateur examine et valide une épreuve de maquette
  Given L'administrateur est sur la page /admin/validation
  When Il consulte l'épreuve "Manuel de Droit Foncier v1.2"
  Then La fiche affiche l'historique : "Validé par Chef Maquettiste Kossi Dossou le 20/08/2026 à 14:32"
  When L'administrateur clique sur "Valider le BAT & Publier"
  Then Le statut de l'ouvrage passe à "Publié"
  And Le maquettiste et le chef maquettiste voient l'état "Validé par la Direction" sur leur portail

Scenario: L'administrateur rejette une maquette avec motif
  Given L'administrateur constate un défaut sur la couverture de l'épreuve "v1.1"
  When Il clique sur "Rejeter l'épreuve"
  And Il saisit le motif "Marges de reliure insuffisantes sur les pages 40 à 60"
  Then Le statut passe à "Rejeté"
  And Le chef maquettiste et le maquettiste voient le statut "Rejeté par la Direction" avec le motif complet
```

---

### User Story 2 — Approbation d'un Accord Juridique Dérogatoire (Priorité: P1)
```gherkin
Scenario: Approbation d'un contrat avec taux de redevance dérogatoire
  Given Le juriste a instruit le contrat "Éditions Clé d'Afrique" avec un taux dérogatoire de 25%
  When L'administrateur ouvre la fiche sur /admin/contracts/CTR-2026-088
  And Il clique sur "Approuver et Mettre en Vigueur"
  Then Le contrat passe au statut "En vigueur"
  And Le barème de 25% est automatiquement appliqué aux futures ventes de cet éditeur
```

---

### User Story 3 — Validation d'une Régularisation de Stock Exceptionnelle (Priorité: P1)
```gherkin
Scenario: Validation d'une mise au rebut de stock endommagé
  Given Le gestionnaire de stock a déclaré une perte de 50 exemplaires inondés à l'Entrepôt Cotonou
  When L'administrateur consulte /admin/stock/movements
  And Il clique sur "Valider la régularisation comptable"
  Then Le stock théorique de l'entrepôt est décrémenté de 50 exemplaires
  And Une ligne d'audit comptable est inscrite au Journal d'Audit Admin
```

---

### User Story 4 — Lecture Souveraine du Catalogue par l'Admin (Priorité: P1)
```gherkin
Scenario: L'administrateur consulte un ouvrage dans le lecteur officiel
  Given L'administrateur navigue sur /admin/catalog
  When Il clique sur le bouton "Lire l'ouvrage" sur "Précis d'Économie Africaine"
  Then La liseuse officielle s'ouvre sur /catalog/reader/[id]
  And Un jeton superviseur valide la session instantanément sans exiger d'achat
```

---

## 4. Matrice de Feedback Visuel, Intuitivité & Accessibilité

1. **Zéro Émoji** : Utilisation exclusive des icônes vectorielles Lucide React.
2. **Zéro Couleur Hexadécimale en Dur** : Variables sémantiques strictes (`bg-navy`, `bg-gold`, `bg-background`, `border-border`).
3. **Spinners & États de Chargement** : Boutons interactifs désactivés pendant l'exécution avec spinner animé.
4. **Toasts Systématiques** : Toasts Sonner explicites (Succès vert, Erreur rouge avec cause et suggestion).
5. **Modales de Confirmation Obligatoires** : Pour chaque action critique (rejet avec saisie de motif, validation de perte, suspension de contrat).
6. **Mobile-First** : Tableaux convertis en cartes empilées sous 1024px, zones tactiles ≥ 44px.
