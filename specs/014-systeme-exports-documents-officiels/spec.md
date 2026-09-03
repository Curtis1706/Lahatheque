# Feature Specification: Module 14 - Système Universel d'Exportation & Documents Officiels (LAHAThèque v3.2)

**Feature Branch**: `014-systeme-exports-documents-officiels`  
**Created**: 2026-09-03  
**Status**: Ready for Implementation  
**Source Métier**: Cahier des charges LAHAThèque v3.2 (Section 4.1 « Rôles & Tableaux de bord », Section 4.2 « Rapports Financiers & Redevances », Section 4.3 « Facturation & Normes Comptables SYSCOHADA », Section 11 « Bouquets Documentaires ») ; Normes Légales UEMOA ; Workflow `/build-lahatheque-screen`.

---

## 1. Résumé Exécutif & Vision Produit

Le **Système Universel d'Exportation et de Documents Officiels** constitue l'épine dorsale de la traçabilité, de la conformité comptable, du reporting exécutif et de l'interopérabilité documentaire de **LAHAThèque v3.2**.

Il apporte une solution de génération instantanée, élégante et standardisée pour l'ensemble des **14 points d'exportation** de la plateforme, couvrant :
1. **Les Documents PDF Officiels de Haute Fidélité** (Factures clients, Bons de commande grossistes B2B, Bordereaux de redevances auteurs/éditeurs/universités, Rapports exécutifs et fiches logistiques) avec l'identité de marque LAHAThèque (Couleurs Navy & Gold, typographies Playfair Display et Poppins, en-tête légal avec IFU/RCCM, QR code d'authenticité et pagination dynamique).
2. **Les Exports de Données Tabulaires CSV & Excel (XLSX)** encodés en **UTF-8 avec BOM** (`\uFEFF`) pour une compatibilité native et parfaite avec Microsoft Excel, LibreOffice et les ERP comptables.
3. **Les Bibliographies & Catalogues de Bouquets en format Word (.doc/.docx)** structurés pour les enseignants, universités et commissions d'accréditation académique.

---

## 2. Principes Fondamentaux & Identité de Marque

### 2.1 En-tête et Mentions Légales Obligatoires (Norme SYSCOHADA / UEMOA)
Tout document officiel généré (Facture, Bordereau, Reçu, Rapport) doit comporter les métadonnées de l'émetteur :
- **Raison Sociale** : LAHAThèque Éditions & Numérique S.A.
- **Identifiant Fiscal Unique (IFU)** : N° 3202415897451
- **Registre du Commerce (RCCM)** : RB/COT/24 B 12458
- **Siège Social** : Immeuble LAHA Éditions, Boulevard de la Marina, Cotonou, République du Bénin
- **Contact Officiel** : contact@lahatheque.bj | (+229) 21 30 45 80 / (+229) 97 00 11 22
- **Portail Web** : https://lahatheque.bj

### 2.2 Charte Graphique du Document
- **Couleur Primaire (Titres, En-têtes, Cartouches)** : Navy `#1B2A4E` (Variable sémantique `var(--navy)`)
- **Couleur d'Emphase (Liserés, Totaux, Badges)** : Gold `#B08D42` (Variable sémantique `var(--gold)`)
- **Arrière-plans de tableaux** : Blanc pur et Gris très clair `#F8F9FA` en alternance
- **Typographie** : Polices vectorielles standard avec hiérarchie stricte (En-têtes en Playfair / Corps et Chiffres en Poppins/Helvetica)
- **Sécurité & Traçabilité** : Date/heure de génération à la seconde, identifiant unique de document (ex: `DOC-2026-X8491`), et QR code de vérification instantanée.

---

## 3. Matrice des 14 Points d'Exportation du Système

| ID | Espace / Page | Libellé Fonctionnel | Formats Pris en Charge | Contenu & Structure du Document |
| :--- | :--- | :--- | :--- | :--- |
| **EXP-01** | `admin/reports` | **Exporter en CSV (Données réelles)** | CSV (UTF-8 BOM) | Ventes globales, volumes bouquets, revenus par pays et formats |
| **EXP-02** | `admin/reports` | **Exporter en PDF** | PDF Haute Fidélité | Synthèse exécutive, KPIs de croissance, top ouvrages, répartition devises |
| **EXP-03** | `admin/reports` | **Exporter en Excel** | XLSX / Excel Multi-feuilles | Ventes, Utilisateurs, Redevances, Bouquets |
| **EXP-04** | `admin/sales` | **Exporter le Journal** | CSV / XLSX | Journal chronologique des transactions, moyens de paiement (MTN, Moov, Carte) |
| **EXP-05** | `admin/security/traces` | **Exporter Audit (CSV)** | CSV / PDF | Registre de sécurité DRM, sessions actives, alertes d'accès anormal |
| **EXP-06** | `admin/royalties` | **Bordereaux de Redevances** | PDF / CSV | Consolidation trimestrielle des droits d'auteurs, éditeurs tiers et universités |
| **EXP-07** | `manager/reports` | **Exporter (Excel/CSV)** | CSV | Mouvements de stocks, inventaires par entrepôt, réapprovisionnements |
| **EXP-08** | `manager/reports` | **Export PDF** | PDF Logistique | Fiche imprimable d'inventaire physique et bordereaux d'expédition |
| **EXP-09** | `chief-layout/history` | **Exporter l'Historique (CSV)** | CSV | Historique des BAT (Bon À Tirer), délais de validation et conformité technique |
| **EXP-10** | `university/royalties` | **Télécharger le Relevé Trimestriel** | PDF / CSV | Relevé institutionnel des quotes-parts d'abonnements des étudiants affiliés |
| **EXP-11** | `components/features/university/bouquet-card.tsx` | **Exporter la liste des ouvrages (Word)** | DOC / DOCX | Bibliographie complète du bouquet documentaire avec ISBN et auteurs |
| **EXP-12** | `student/university` | **Exporter le Catalogue Faculté (Word)** | DOC / DOCX | Liste académique des manuels disponibles pour les étudiants de la faculté |
| **EXP-13** | `publisher/royalties` & `author/royalties` | **Télécharger le Relevé de Redevances** | PDF Certifié | Décompte individuel de droits d'auteur / éditeur avec retenue à la source légale |
| **EXP-14** | `student/orders` & `wholesaler/orders` | **Télécharger la Facture / Bon Proforma** | PDF Comptable | Facture officielle avec TVA, remises B2B, adresses de facturation et livraison |

---

## 4. Parcours Utilisateur & Scénarios d'Acceptation (User Stories)

### User Story 1 : Génération et Téléchargement de Factures & Reçus Comptables (P1 - MVP)
**En tant que** client (étudiant, particulier ou grossiste),  
**Je veux** cliquer sur « Télécharger la Facture » depuis mon historique de commande,  
**Afin d'**obtenir instantanément un document PDF officiel aux normes fiscales avec le logo et les mentions légales.

**Scénarios d'acceptation** :
1. **Étant donné** la page `/student/orders` ou `/wholesaler/orders/[id]`, **Quand** l'utilisateur clique sur l'icône de téléchargement de facture, **Alors** un PDF vectoriel propre est généré en moins de 500ms sous le nom `facture_LAHA_CMD-[ID].pdf`.
2. **Étant donné** l'ouverture du PDF, **Quand** le document est consulté, **Alors** il contient l'en-tête officiel LAHAThèque, le numéro de commande, la date, l'adresse de facturation, la grille détaillée des articles avec prix unitaire, quantité, TVA et total TTC en FCFA, ainsi que le cachet officiel et le QR code de vérification.

---

### User Story 2 : Export de Données Réelles en CSV et Excel avec Encodage Parfait (P1 - MVP)
**En tant qu'**administrateur ou gestionnaire logistique,  
**Je veux** exporter des registres de données complexes (ventes, audits, stocks, redevances),  
**Afin de** les ouvrir directement dans Excel sans caractères corrompus (accents français préservés).

**Scénarios d'acceptation** :
1. **Étant donné** les boutons d'export CSV sur `/admin/reports`, `/admin/sales`, `/admin/security/traces` ou `/chief-layout/history`, **Quand** l'utilisateur déclenche l'export, **Alors** le fichier téléchargé commence par l'octet `\uFEFF` (BOM UTF-8) avec des délimiteurs virgules/point-virgules standards et des en-têtes en français lisibles.
2. **Étant donné** un tableau vide ou sans données filtrées, **Quand** l'utilisateur clique sur exporter, **Alors** un toast informatif « Aucune donnée à exporter pour la période sélectionnée » apparaît sans planter l'interface.

---

### User Story 3 : Export de Bibliographie en Format Word (.doc / .docx) (P1 - MVP)
**En tant que** responsable universitaire ou enseignant,  
**Je veux** exporter la liste des ouvrages d'un bouquet documentaire en format Word,  
**Afin d'**intégrer la bibliographie officielle dans les syllabus de cours et rapports de faculté.

**Scénarios d'acceptation** :
1. **Étant donné** la carte d'un bouquet documentaire sur `/university/bouquets` ou `/student/university`, **Quand** l'utilisateur clique sur « Exporter la liste des ouvrages du bouquet en Word », **Alors** un fichier `.doc` richement formaté est téléchargé avec le titre du bouquet, l'université partenaire, la table des ouvrages (Titre, Auteur, ISBN, Année, Format) et les conditions de prêt.

---

### User Story 4 : Bordereaux de Redevances Officiels pour Auteurs & Éditeurs (P1 - MVP)
**En tant qu'**auteur ou éditeur partenaire,  
**Je veux** télécharger mon relevé de redevances certifié en PDF,  
**Afin de** justifier de mes revenus auprès de l'administration fiscale et suivre mes ventes par pays.

**Scénarios d'acceptation** :
1. **Étant donné** les pages `/author/royalties` et `/publisher/royalties`, **Quand** l'utilisateur clique sur « Télécharger le Relevé », **Alors** un PDF certifié détaille les ventes numériques, papier et quotes-parts bouquets avec le calcul du net à verser.

---

## 5. Exigences Non-Fonctionnelles & Performance
1. **Génération Client Instantanée** : Aucune dépendance à un service externe payant. Les PDF, CSV et Word sont générés côté client / Next.js de manière ultra-rapide (< 1 seconde).
2. **Zéro Émoji, Zéro Hexadécimal en Dur** : Strict respect de la constitution et des règles LAHAThèque.
3. **Mobile-First & Feedback Visuel** : Les boutons d'export intègrent un état de chargement inline (`Génération...`) pour informer l'utilisateur pendant la création du fichier.
4. **Accessibilité** : Tous les boutons d'export possèdent un `title` et un `aria-label` descriptifs.
