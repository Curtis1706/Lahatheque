# Feature Specification: Module 4 - Espace Éditeur Tiers, Dépôt Assisté par IA & Synchronisation ONIX

**Feature Branch**: `004-depot-editeurs-tiers-onix`  
**Created**: 2026-08-20  
**Status**: Ready for Implementation  
**Source Métier**: Cahier des charges LAHAThèque v3.2 - Section 4.1.7, 4.1.C, Section 5 (Éditeurs Tiers, Dépôt Assisté par IA, ONIX 3.0, API REST, Validation en 5 étapes, Redevances & Sécurité)  
**Règles de Design & Intuitivité**: `.agents/AGENTS.md` (Zéro emoji, Lucide React exclusif, tokens sémantiques `bg-navy`, `bg-gold`, feedback visuel permanent par toasts, skeletons et spinners d'attente sur boutons).

---

## 1. Résumé Exécutif & Périmètre Métier Conforme au Cahier des Charges

L'**Espace Éditeur Tiers** est le portail dédié aux partenaires éditoriaux de LAHAThèque. Il s'adresse indifféremment à deux types d'acteurs :
1. **Les Maisons d'Édition Partenaires** (personnes morales : raison sociale, RCCM, NIF, représentant légal, compte bancaire).
2. **Les Éditeurs Indépendants & Auto-Éditeurs** (personnes physiques : nom, prénom, NIF/IFU individuel ou pièce d'identité, compte bancaire ou Mobile Money).

### Fonctionnalités Clés du Cahier des Charges :
1. **Assistance par Intelligence Artificielle (Section 5.3 & 4.1.C)** :
   - Analyse du fichier d'épreuve (PDF/EPUB) ou du titre pour suggérer automatiquement :
     - Le résumé / 4e de couverture.
     - La discipline académique (ex. Droit Public, Sciences Éco, Médecine, Agronomie).
     - La langue du livre (détection automatique, modifiable manuellement).
     - Le ou les pays de rattachement / diffusion (Bénin, Sénégal, Niger, Togo, Côte d'Ivoire, Gabon, RDC, etc.).
     - Les mots-clés thématiques et le classement universitaire.
     - La détection d'incohérences dans les métadonnées (ISBN manquant, format corrompu).
2. **Trois Modalités de Dépôt (Section 5.2)** :
   - *Formulaire Web Unitaire & Lot ZIP* avec assistant IA de pré-remplissage.
   - *Import de Catalogue en Masse* : upload de fichiers ONIX 3.0 (XML EDItEUR), CSV ou JSON avec rapport d'erreurs ligne par ligne.
   - *API REST Sécurisée* : téléversement programmatique avec authentification par clés d'API (Client ID / Client Secret révocables) ou OAuth 2.0.
3. **Flux de Validation en 5 Étapes (Section 5.5)** :
   - *Étape 1* : Dépôt par l'éditeur (web ou API).
   - *Étape 2* : Contrôle technique automatique (format des fichiers, complétude des métadonnées, antivirus).
   - *Étape 3* : Examen par l'équipe LAHA Éditions (conformité éditoriale et vérification des droits).
   - *Étape 4* : Notification à l'éditeur (approbation ou demande de correction avec commentaires détaillés).
   - *Étape 5* : Publication sur la vitrine LAHAThèque et mise en ligne catalogue.
4. **Protection Anti-Piratage & Sécurité (Section 6)** :
   - Filigrane visible configurable (position, opacité).
   - Tatouage invisible par utilisateur authentifié.
   - DRM Readium LCP (appareils max, durée de prêt).
   - Blocage copier-coller et impression.
   - Traçabilité complète (ID, IP, appareil, code fichier).
5. **Suivi des Ventes, Redevances & Mandat (Section 4.1.7, 4.3 & 5.1)** :
   - Taux de redevance contractuel appliqué automatiquement (affiché en lecture seule selon le contrat signé).
   - Statistiques de consultation et de téléchargements en temps réel.
   - Relevés financiers PDF certifiés téléchargeables et demande de virement (IBAN / Momo).
6. **Profil Personnalisé (Personne Morale vs Personne Physique)** :
   - Bascule de type d'entité (*Maison d'édition* ou *Éditeur indépendant*).
   - Coordonnées de contact, d'astreinte et informations de paiement.

---

## 2. User Scenarios & Critères d'Acceptation (Gherkin)

### User Story 1 — Dépôt Unitaire d'Ouvrage avec Pré-remplissage par Assistant IA (Priorité: P1)
**En tant qu'** éditeur tiers (maison d'édition ou éditeur indépendant),  
**Je veux** téléverser mon fichier d'ouvrage (PDF/EPUB) et utiliser l'assistant IA pour générer instantanément le résumé, la discipline, la langue et les mots-clés,  
**Afin de** soumettre rapidement mon ouvrage au comité de lecture LAHA sans saisie rébarbative.

#### Critères d'Acceptation :
- **Given** un éditeur sur la page `/publisher/catalog/new`,
- **When** il téléverse le fichier et clique sur "Analyser et Compléter par IA",
- **Then** un indicateur d'analyse IA avec spinner s'anime,
- **And** les champs Résumé, Discipline, Langue, Pays de diffusion et Mots-clés sont pré-remplis automatiquement,
- **And** un toast confirme les suggestions de l'IA avec possibilité de correction manuelle,
- **And** lors de la soumission finale, le bouton affiche un spinner, se désactive et affiche un toast de confirmation.

---

### User Story 2 — Import de Catalogue en Masse ONIX 3.0 / CSV (Priorité: P1)
**En tant que** responsable de catalogue d'un éditeur partenaire,  
**Je veux** téléverser un fichier ONIX 3.0 XML ou un tableur CSV,  
**Afin d'**ingérer des dizaines d'ouvrages avec validation syntaxique automatique.

#### Critères d'Acceptation :
- **Given** un fichier XML ONIX 3.0,
- **When** l'éditeur le glisse dans la zone d'importation,
- **Then** une barre de progression indique l'avancement de l'analyse,
- **And** un tableau de rapport détaille le nombre d'ouvrages acceptés et les erreurs ligne par ligne (ISBN manquant, format non supporté),
- **And** un toast informe de la complétion du traitement.

---

### User Story 3 — Gestion des Clés API REST pour Synchronisation ERP (Priorité: P2)
**En tant que** développeur d'une maison d'édition,  
**Je veux** créer et révoquer des identifiants API (Client ID / Client Secret),  
**Afin d'**automatiser le dépôt de nos parutions depuis notre système informatique.

#### Critères d'Acceptation :
- **Given** la page `/publisher/api`,
- **When** l'utilisateur génère une clé,
- **Then** une modale affiche le Client Secret avec bouton de copie et notification toast,
- **And** toute action de révocation ouvre une modale de confirmation explicite avec bouton rouge d'action irréversible.

---

### User Story 4 — Suivi des Redevances, Relevés Financiers & Demande de Virement (Priorité: P1)
**En tant qu'** éditeur partenaire,  
**Je veux** visualiser mes revenus générés, mon taux contractuel (ex: 22%) et demander un virement bancaire ou Mobile Money,  
**Afin de** percevoir mes gains sur les ventes et abonnements.

#### Critères d'Acceptation :
- **Given** la page `/publisher/royalties`,
- **When** le solde disponible dépasse le seuil minimum (50 000 XOF),
- **Then** le bouton "Demander un Virement" devient actif,
- **And** au clic, un spinner d'attente s'affiche sur le bouton, une demande est transmise à la comptabilité et un toast confirme l'opération.

---

### User Story 5 — Profil Modulaire : Maison d'Édition ou Éditeur Indépendant (Priorité: P1)
**En tant qu'** éditeur,  
**Je veux** configurer mon profil en choisissant entre "Maison d'édition (Personne morale)" ou "Éditeur indépendant (Personne physique)",  
**Afin de** renseigner les identifiants fiscaux et coordonnées de paiement adaptés.

#### Critères d'Acceptation :
- **Given** la page `/publisher/profile`,
- **When** l'utilisateur bascule entre les types d'entités,
- **Then** les champs s'adaptent (Raison sociale + RCCM pour société, Nom/Prénom + NIF/CNI pour indépendant),
- **And** l'enregistrement déclenche un spinner et un toast de succès.

---

## 3. Exigences Fonctionnelles (FR)

- **FR-PUB-01** : Protection d'accès par rôle `publisher`.
- **FR-PUB-02** : Tableau de bord avec 4 KPI cards (Titres, Validations, Ventes, Redevances).
- **FR-PUB-03** : Module d'assistance IA pour l'extraction de métadonnées, classification, résumés et pays.
- **FR-PUB-04** : Formulaire de dépôt unitaire multi-étapes avec configuration des DRM et du filigrane.
- **FR-PUB-05** : Parseur de lots ONIX 3.0 / CSV avec rapport d'erreurs détaillé.
- **FR-PUB-06** : Gestion des clés d'API REST avec révocation sécurisée.
- **FR-PUB-07** : Suivi du workflow de validation en 5 étapes avec motifs de correction.
- **FR-PUB-08** : Relevés financiers avec taux contractuel en lecture seule et demande de paiement.
- **FR-PUB-09** : Journal d'audit et de traçabilité DRM.
- **FR-PUB-10** : Profil modulaire (Société / Particulier) avec NIF, RCCM, IBAN/Momo et sécurité.

---

## 4. Critères de Succès Mesurables (SC)

- **SC-001** : 100% des actions asynchrones ont un feedback immédiat (spinner sur bouton désactivé, skeleton ou toast).
- **SC-002** : Zéro code couleur hexadécimal en dur et zéro emoji sur toutes les pages.
- **SC-003** : Conformité mobile-first garantie pour les écrans < 400px.
