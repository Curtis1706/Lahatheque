# Phase 0 : Recherche Technique & Décisions d'Architecture (Courriers Officiels LAHAThèque)

**Feature** : `008-courrier-redevances-relances`
**Date** : 2026-09-17
**Auteur** : Antigravity (Product Experience Partner)

---

## 1. Contexte & Problématique

Le client (LAHA Éditions) a transmis un gabarit officiel papier à en-tête (`Lahatheque-PapierEntete-SansNumero.pdf`) comportant l'en-tête graphique (logo + devise « Le savoir africain, sans frontières ») et le pied de page institutionnel (coordonnées, IFU, RCCM, adresse).
Auparavant, les tableaux de bord juriste (redevances universités/éditeurs et relances d'impayés) expédiaient des bordereaux directs sans étape de formalisation, de révision textuelle ni de validation certifiée.

L'objectif de cette fonctionnalité est :
1. Remplacer les boutons "Envoyer Relevé" et "Déclencher Relance" par **"Préparer le courrier"** (action unitaire) et **"Préparer les courriers de la période"** (action groupée).
2. Centraliser la gestion sur une page dédiée (`/legal-reviewer/courriers`) sous forme de **DataTable** avec un cycle de vie en 4 statuts : **Brouillon**, **Validé**, **Annulé**, **Envoyé**.
3. Permettre la prévisualisation PDF instantanée dans le navigateur à tout moment (brouillon ou validé) en appliquant le gabarit officiel.
4. Offrir une modale d'ajustement ("Corriger") pour modifier l'objet et le corps du message type sans impacter le modèle global ni les montants calculés.
5. Sceller le PDF final à la validation et expédier l'email au destinataire avec le corps du texte rédigé et le PDF certifié en pièce jointe.

---

## 2. Décisions Techniques Majeures

### Décision 1 : Génération & Fusion PDF sur le Gabarit Officiel
- **Choix technique** : **PyMuPDF (`fitz`)**.
- **Rationale** :
  - PyMuPDF est déjà installé et configuré en production dans `apps/communications/services/pdf_attachment_service.py`.
  - L'inspection binaire du fichier `Lahatheque-PapierEntete-SansNumero.pdf` (format A4 595.32 x 841.92 pt) démontre que le bandeau d'en-tête s'arrête à `y=92 pt` et le pied de page commence à `y=782 pt`.
  - PyMuPDF permet d'ouvrir ce template natif en mémoire, de cloner la page modèle, et d'insérer le bloc de texte rédigé (objet, destinataire, corps du courrier, montant, tableau récapitulatif si besoin, signature) dans le rectangle utile sécurisé `Rect(65, 115, 530, 765)` avec retour automatique à la ligne (`insert_textbox`).
  - En cas de texte long dépassant une page, une seconde page à en-tête est instanciée dynamiquement pour accueillir la suite du texte.
- **Alternatives rejetées** :
  - *ReportLab* : Nécessiterait de reconstruire de zéro l'en-tête vectoriel ou d'utiliser `pypdf`/`PdfReader` pour faire du merging de calque (overlay), ce qui alourdit le pipeline et risque de décaler les polices et marges.
  - *Weasyprint* : Trop gourmand en mémoire (reflow CSS complet) et nécessite des dépendances système externes (Pango, Cairo) parfois instables dans les conteneurs Alpine/Debian minimaux.

### Décision 2 : Stockage et Disponibilité du PDF (Brouillon vs Scellé)
- **Choix technique** :
  - **Statut Brouillon** : Génération dynamique à la volée via un endpoint de prévisualisation en streaming binaire (`/api/v1/rights/legal/courriers/<id>/preview-pdf/`) avec en-tête HTTP `Content-Disposition: inline; filename="courrier-preview.pdf"`. Aucune persistance disque inutile en phase de rédaction.
  - **Statut Validé & Envoyé** : Le document PDF est généré définitivement lors du clic sur "Valider", sauvegardé sous forme de fichier certifié sur Cloudflare R2 / stockage Django (`upload_to='courriers_officiels/%Y/%m/'`) et référencé dans le champ `pdf_file` du modèle `CourrierOfficiel`. L'URL ou le stream de téléchargement renvoie ce fichier immuable.
- **Rationale** : Évite d'encombrer le stockage Cloudflare R2 avec des dizaines d'ébauches de brouillons temporaires, tout en garantissant l'intégrité juridique absolue du fichier scellé dès la validation.

### Décision 3 : Modèle de Données Backend (`CourrierOfficiel`)
- **Choix technique** : Nouveau modèle Django `CourrierOfficiel` au sein de l'application `apps/rights/models.py`.
- **Champs principaux** :
  - `id`: UUIDv4
  - `category`: `royalty_author`, `royalty_university`, `royalty_publisher`, `debt_reminder`, `other`
  - `recipient_type`: `author`, `university`, `publisher`, `client`
  - `recipient_id`: UUID ou chaîne identifiant l'entité source
  - `recipient_name`: Nom de l'ayant-droit ou de l'institution
  - `recipient_email`: Adresse e-mail officielle de destination
  - `reference`: Référence unique (ex: `LTQ-CR-202609-0042`)
  - `period`: Libellé de la période (ex: `Septembre 2026`)
  - `amount`: Montant total des redevances ou de l'impayé concerné
  - `currency`: Devise strictement fixée à `FCFA`
  - `subject`: Objet du courrier
  - `body_text`: Texte rédigé / personnalisé du courrier
  - `status`: `draft`, `validated`, `canceled`, `sent`
  - `pdf_file`: Fichier PDF scellé (généré à la validation)
  - `created_by`: Juriste créateur
  - `created_at`, `updated_at`, `validated_at`, `sent_at`, `canceled_at`
- **Rationale** : Cloisonnement strict dans l'application `rights` (responsable de la gestion des droits, des contrats et des relances), avec indexation pour des filtres rapides dans la DataTable.

### Décision 4 : Ergonomie Frontend & Navigation
- **Choix technique** :
  - Page dédiée : `lahatheque-frontend/app/(dashboard)/legal-reviewer/courriers/page.tsx`.
  - Intégration dans la barre de breadcrumb : Permet de revenir en 1 clic à `/legal-reviewer/redevances` ou `/legal-reviewer/relances`.
  - DataTable responsive : Utilisation du composant réutilisable `@/components/ui/data-table`.
  - Modale de correction : `@/components/ui/modal` avec champs Objet + Textarea multiligne, stylisée avec les tokens sémantiques `font-sans`, `bg-background`, `border-border`, `text-navy`, `focus:border-gold`.
  - Modale de confirmation : Système d'alerte non bloquant pour Valider, Envoyer et Annuler.

### Décision 5 : Modèles de Textes Types par Défaut
- **Choix technique** : Dictionnaire / Factory de gabarits textuels professionnels paramétrés par type de destinataire :
  - **Redevances Auteurs** : Salutation officielle, rappel de la période écoulée, nombre d'exemplaires vendus, assiette brute et montant net des droits d'auteur calculés, rappel du bordereau joint.
  - **Redevances Universités** : Mention de l'accord-cadre interinstitutionnel, taux conventionné (15%), récapitulatif des consultations institutionnelles, montant net dû.
  - **Redevances Éditeurs Tiers** : Rappel du contrat de co-édition, taux négocié, assiette des ventes nettes et bordereau de décompte joint.
  - **Relances d'Impayés** : Rappel de la facture/créance échue, montant exigible, invitation à régulariser sous huitaine avec justificatif.
