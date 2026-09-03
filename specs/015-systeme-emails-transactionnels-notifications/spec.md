# Feature Specification: 015-systeme-emails-transactionnels-notifications

**Feature Branch**: `015-systeme-emails-transactionnels-notifications`  
**Created**: 2026-09-03  
**Status**: Ready for Planning  
**Input**: Système complet d'envois d'emails transactionnels et notifications avec génération et pièces jointes PDF (factures, reçus, bordereaux), traque intégrale des non-dits sur tous les parcours métier (y compris les envois administratifs dans la gestion des utilisateurs et le dialogue Aide & Contact sur les dashboards), et architecture multi-fournisseurs interchangeable (Resend vs SMTP professionnel).

---

## 1. Contexte & Cadrage Métier

La plateforme LAHAThèque nécessite un système centralisé, résilient et unifié d'émission d'emails transactionnels et de notifications pour l'ensemble des rôles de son écosystème :
- **Clients / Lecteurs Particuliers** (achats unitaires, pass abonnements, suivi de commandes papier).
- **Grossistes Commerciaux B2B** (commandes groupées, factures proforma, gestion du crédit et dépôts).
- **Universités & Établissements Partenaires** (bouquets académiques, affiliations étudiants, relevés trimestriels de redevances, commandes papier campus).
- **Auteurs & Créateurs de Contenu** (manuscrits, contrats, bordereaux de droits d'auteur et avis de virement).
- **Éditeurs Tiers** (dépôts d'ouvrages, validations éditoriales, décomptes de redevances).
- **Maquettistes & Chefs Maquettistes** (assignations, validations BAT).
- **Gestionnaires de Stock & Logistique** (commandes à expédier, alertes de réassort).
- **Juristes & Administrateurs** (contrats, alertes d'échéance, relances d'impayés, **envoi d'emails officiels personnalisés à un utilisateur**, **envoi d'identifiants de connexion lors de la création manuelle d'un compte**, et **traitement des messages d'aide et contact support**).

Le système doit garantir :
1. **L'envoi systématique d'une facture / reçu PDF officiel en pièce jointe** pour toute commande ou transaction validée.
2. **L'interchangeabilité immédiate entre fournisseurs** : basculement transparent entre l'API moderne **Resend** et un serveur **SMTP Professionnel** (Hostinger, Brevo, Google Workspace, Infomaniak, etc.) par simple variable d'environnement, avec mécanisme de repli (fallback).
3. **La couverture complète des actions administratives** : envoi d'emails directs à un utilisateur depuis la table des rôles (`SendEmailModal`), transmission sécurisée des mots de passe temporaires lors de la création de compte (`CreateAccountModal`), et accusé de réception / alerte sur le formulaire Aide & Contact Support (`ContactSupportDialog`).
4. **Le respect absolu des standards de marque LAHAThèque** : templates HTML responsive aux couleurs de la charte (**Navy** `#1B2A4E`, **Gold** `#B08D42`), typographie Google Fonts Playfair Display & Poppins, zéro emoji.

---

## 2. Traque Exhaustive des Non-Dits & Matrice Décisionnelle

| Problématique / Non-Dit | Risques Identifiés | Solution Retenue & Implémentée |
| :--- | :--- | :--- |
| **Génération et attachement de la facture PDF** | Échec d'envoi si le fichier est volumineux ou corrompu ; blocage du thread HTTP client. | Génération asynchrone du document PDF en tâche de fond Celery via buffer mémoire, validation de taille (`< 10 Mo`), compression des flux vectoriels, et attachement MIME `application/pdf`. |
| **Envoi d'e-mail officiel depuis l'Administration des Utilisateurs** | Perte de traçabilité, absence de formatage officiel ou blocage si l'utilisateur est introuvable. | Intégration dans `SendEmailModal` et endpoint `/api/bff/admin/users/<id>/send-email/` utilisant le template officiel d'administration LAHAThèque avec signature de la Direction, historique enregistré dans `EmailNotificationLog`. |
| **Création manuelle de compte par l'Admin** | Divulgation non sécurisée du mot de passe sur l'écran ou échec de délivrance des identifiants. | Génération d'un mot de passe temporaire fort chiffré, non affiché sur l'écran d'admin, transmis immédiatement par email de bienvenue sécurisé (`account_created_by_admin`) avec invitation à renouveler le mot de passe dès la première connexion. |
| **Aide & Contact Support sur les Dashboards** | Messages de contact ignorés ou sans accusé de réception pour l'utilisateur. | Double émission asynchrone lors de la soumission de `ContactSupportDialog` : (1) Email d'accusé de réception officiel au demandeur avec numéro de ticket, et (2) Alerte enrichie à l'équipe support avec contexte du rôle et métadonnées techniques. |
| **Affiliation Étudiante Universitaire** | L'étudiant ne sait pas si sa carte d'étudiant a été validée ou rejetée par la scolarité. | Email automatique notifiant l'approbation de l'affiliation (débloquant l'accès au bouquet de l'université) ou le refus avec motif explicite (`StudentAffiliation.motif_rejet`). |
| **Commandes physiques avec livraison différée** | Le client reçoit la facture mais ignore quand son colis est préparé et expédié. | Flux en 2 étapes : (1) Email immédiat de confirmation d'achat avec facture PDF jointe, puis (2) Email d'avis d'expédition déclenché dès que le Gestionnaire renseigne le transporteur et le numéro de tracking. |
| **Achats à crédit grossiste & Dépôts-ventes** | Confusion entre facture acquittée et facture proforma / bon de commande. | Détection automatique du mode de règlement : émission d'une **Facture Proforma & Bon de Commande** pour les commandes à crédit/dépôt (avec date d'échéance à 30 jours), et d'une **Facture Acquittée Définitive** pour les paiements comptants. |
| **Délivrabilité & Filtrage Spam** | Emails arrivant dans les courriers indésirables des étudiants et universités. | En-têtes conformes (SPF, DKIM, DMARC), adresse `From` avec nom de domaine authentifié (`contact@lahatheque.bj` ou `notifications@lahatheque.bj`), lien de désinscription/contact légal et version texte brut (Plain Text) générée automatiquement pour chaque template HTML. |
| **Changement de fournisseur (Resend ↔ SMTP)** | Réécriture du code métier ou dépendance forte à un SDK propriétaire. | **Provider Pattern** avec interface abstraite `EmailProviderBase`. Le code métier appelle uniquement `send_transactional_email()`, la couche d'infrastructure choisit l'adaptateur (`ResendProvider` ou `SmtpProvider`) selon `EMAIL_PROVIDER=resend|smtp`. |
| **Traçabilité & Débogage** | Impossibilité de vérifier si un utilisateur a bien reçu son email ou son code OTP. | Modèle de journalisation persistant `EmailNotificationLog` enregistrant : destinataire, template, sujet, statut (`pending`, `sent`, `delivered`, `failed`), message ID du fournisseur, timestamp et stacktrace d'erreur. |

---

## 3. Matrice Exhaustive des 22 Typologies d'Emails & Notifications

| # | Code Template | Domaine & Déclencheur | Destinataire Cible | Contenu & Pièce(s) Jointe(s) |
| :---: | :--- | :--- | :--- | :--- |
| **1** | `order_confirmation_client` | Paiement commande B2C validé | Client Lecteur | Détails des livres + **Facture officielle PDF acquittée** + liens liseuse instantanés. |
| **2** | `order_shipped` | Expédition commande papier | Client / Grossiste | Nom du transporteur, lien et numéro de tracking, délai indicatif. |
| **3** | `order_cancelled_refunded` | Annulation / Remboursement commande | Client | Motif de l'annulation, justificatif d'avoir et modalités de remboursement. |
| **4** | `subscription_confirmation` | Souscription Pass / Bouquet | Abonné / Institution | **Reçu fiscal PDF**, dates de validité, liste des accès accordés. |
| **5** | `order_confirmation_wholesaler` | Validation commande grossiste B2B | Grossiste | **Facture Proforma / Bon de Commande PDF officiel** avec calcul des remises de volume (25-30%) et conditions de crédit Net 30 jours. |
| **6** | `wholesale_credit_decision` | Approbation/Rejet achat à crédit grossiste | Grossiste | Décision d'octroi de crédit, échéance de règlement ou motif de refus. |
| **7** | `wholesale_catalog_alert` | Nouveauté catalogue ou réassort | Grossistes abonnés | Alertes nouveautés éditoriales et stocks disponibles pour commande groupée. |
| **8** | `account_welcome_verification` | Inscription nouveau compte | Nouvel utilisateur | Email de bienvenue et lien tokenisé d'activation / vérification email. |
| **9** | `account_created_by_admin` | Création de compte via `CreateAccountModal` | Utilisateur créé | Identifiants officiels et mot de passe temporaire chiffré avec invitation de renouvellement. |
| **10** | `password_reset_request` | Mot de passe oublié | Utilisateur | Lien sécurisé temporaire (15 min) avec avertissement de sécurité. |
| **11** | `otp_security_code` | Code d'authentification MFA / OTP | Utilisateur | Code à 6 chiffres grand format monospace (validité 10 min). |
| **12** | `security_alert_login` | Détection d'accès suspect / nouvel appareil | Utilisateur | Alerte de sécurité avec date, heure, adresse IP et pays d'accès. |
| **13** | `admin_custom_user_email` | Envoi d'email officiel depuis `SendEmailModal` | Utilisateur ciblé | Message administratif direct personnalisé avec signature de la Direction. |
| **14** | `support_contact_ack` | Soumission du dialogue Aide & Contact | Demandeur | Accusé de réception avec numéro de ticket et engagement de réponse sous 2h. |
| **15** | `support_internal_alert` | Soumission du dialogue Aide & Contact | Équipe Support | Fiche d'incident enrichie avec rôle, coordonnées et message du demandeur. |
| **16** | `deposit_received` | Dépôt de maquette / manuscrit éditeur | Éditeur Tiers | Accusé de réception formel avec identifiant unique de soumission. |
| **17** | `deposit_editorial_decision` | Validation BAT ou demande de révisions | Éditeur / Auteur | Décision du comité éditorial avec commentaires détaillés du chef maquettiste. |
| **18** | `author_royalty_statement` | Décompte périodique droits d'auteur | Auteur | **Bordereau officiel de droits d'auteur certifié PDF** et avis de virement. |
| **19** | `publisher_royalty_statement` | Décompte périodique redevances éditeur | Maison d'édition | **Bordereau officiel de redevances certifié PDF** (assiette brute, taux contractuel, montant viré). |
| **20** | `university_affiliation_decision` | Décision affiliation étudiante | Étudiant | Notification d'approbation d'affiliation campus ou de refus avec motif. |
| **21** | `university_royalty_statement` | Décompte trimestriel redevances université | Université | **Relevé trimestriel de redevances certifié PDF** (quote-part 15%). |
| **22** | `automated_reminder` | Relances impayés, expirations abonnements, dépôts | Utilisateur concerné | Rappel courtois avec lien d'action immédiate (paiement direct, renouvellement en 1 clic). |

---

## 4. Exigences d'Architecture Multi-Fournisseurs (Resend vs SMTP Pro)

- **FR-ARCH-001** : Interface abstraite `EmailProviderBase` définissant `send(to, subject, html_content, text_content, attachments, from_email, reply_to)`.
- **FR-ARCH-002** : Deux adaptateurs prêts à l'emploi :
  - `ResendEmailProvider` (API REST moderne).
  - `SmtpEmailProvider` (SMTP Hostinger, Brevo, Google Workspace, Infomaniak).
- **FR-ARCH-003** : Basculement instantané via variable d'environnement `EMAIL_PROVIDER=resend` ou `EMAIL_PROVIDER=smtp`.
- **FR-ARCH-004** : Failover automatique : si le fournisseur principal échoue, basculement automatique sur le fournisseur secondaire avec alerte consignée.

---

## 5. Critères de Succès & Métriques

- **SC-001** : 100% des commandes validées génèrent et expédient un email de confirmation avec facture PDF jointe en moins de 15 secondes.
- **SC-002** : L'envoi d'e-mail depuis `SendEmailModal` et la création de compte depuis `CreateAccountModal` délivrent instantanément un email officiel tracé dans `EmailNotificationLog`.
- **SC-003** : Toute soumission via le dialogue Aide & Contact déclenche un accusé de réception au client et une alerte à l'équipe support.
- **SC-004** : Le basculement entre `Resend` et `SMTP` s'opère instantanément par modification de la variable d'environnement `EMAIL_PROVIDER` sans redémarrage destructif ni modification de code.
- **SC-005** : 100% des emails émis affichent un rendu HTML responsive parfait et typographié Playfair/Poppins sur les principaux clients de messagerie (Gmail, Apple Mail, Outlook, Thunderbird).
- **SC-006** : Zéro emoji présent dans l'ensemble des templates HTML, sujets d'emails ou notifications.
