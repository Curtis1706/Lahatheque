# Tasks: 015-systeme-emails-transactionnels-notifications

**Feature**: [spec.md](./spec.md) | [plan.md](./plan.md)  
**Status**: Ready for Implementation

---

## Phase 1 : Infrastructure & Modèles (Fondation)

- [ ] **Task 1.1** : Créer le modèle `EmailNotificationLog` dans `apps/communications/models.py` pour enregistrer l'ensemble des métadonnées d'envois d'emails (destinataire, type d'email parmi les 22 flux, sujet, fournisseur utilisé, message ID, statut, nom des pièces jointes, erreurs).
- [ ] **Task 1.2** : Générer et appliquer la migration Django pour `EmailNotificationLog`.
- [ ] **Task 1.3** : Mettre à jour `apps/communications/serializers.py` et `admin.py` pour visualiser les logs d'emails dans le tableau de bord administrateur.

---

## Phase 2 : Fournisseurs d'Emails Interchangeables (Resend & SMTP)

- [ ] **Task 2.1** : Créer l'interface abstraite `EmailProviderBase` dans `apps/communications/services/email_provider_base.py`.
- [ ] **Task 2.2** : Implémenter l'adaptateur `ResendEmailProvider` dans `apps/communications/services/resend_provider.py` avec support de l'API REST Resend et pièces jointes.
- [ ] **Task 2.3** : Implémenter l'adaptateur `SmtpEmailProvider` dans `apps/communications/services/smtp_provider.py` avec `django.core.mail.EmailMultiAlternatives`.
- [ ] **Task 2.4** : Implémenter la façade `EmailService` avec sélection automatique du fournisseur via `EMAIL_PROVIDER` et mécanisme de secours (failover).

---

## Phase 3 : Génération Asynchrone des Pièces Jointes PDF & Tâches Celery

- [ ] **Task 3.1** : Créer le service serveur de génération PDF unifié `apps/communications/services/pdf_attachment_service.py` pour produire les buffers mémoires des factures acquittées, bons de commande / proforma, et bordereaux de redevances.
- [ ] **Task 3.2** : Créer la tâche Celery asynchrone `task_send_transactional_email` dans `apps/communications/tasks.py` avec politique de réessai automatique (3 retries exponentiels).

---

## Phase 4 : Templates HTML Responsive de la Charte LAHAThèque (22 Gabarits)

- [ ] **Task 4.1** : Créer le template de base `templates/emails/base_email.html` aux couleurs Navy (`#1B2A4E`) et Gold (`#B08D42`), avec typographie Playfair/Poppins, en-tête officiel, pied de page légal et zéro emoji.
- [ ] **Task 4.2** : Créer les templates de commande (`templates/emails/orders/confirmation_client.html`, `confirmation_wholesaler.html`, `order_shipped.html`, `order_cancelled.html`).
- [ ] **Task 4.3** : Créer les templates d'authentification & gestion de comptes (`templates/emails/auth/welcome_verification.html`, `account_created_by_admin.html`, `password_reset.html`, `otp_code.html`, `security_alert.html`).
- [ ] **Task 4.4** : Créer le template d'email administratif direct (`templates/emails/admin/custom_message.html`) utilisé par `SendEmailModal`.
- [ ] **Task 4.5** : Créer les templates du support d'assistance (`templates/emails/support/contact_ack.html`, `templates/emails/support/internal_alert.html`) utilisés par `ContactSupportDialog`.
- [ ] **Task 4.6** : Créer les templates de droits et redevances (`templates/emails/royalties/author_statement.html`, `publisher_statement.html`, `university_statement.html`).
- [ ] **Task 4.7** : Créer les templates pour les affiliations étudiantes (`templates/emails/university/affiliation_decision.html`) et alertes grossistes (`templates/emails/wholesale/credit_decision.html`, `catalog_alert.html`).
- [ ] **Task 4.8** : Créer les templates de relances programmées (`templates/emails/reminders/unpaid_order.html`, `subscription_expiry.html`, `deposit_pending.html`).

---

## Phase 5 : Raccordement aux Déclencheurs Métier & Webhooks

- [ ] **Task 5.1** : Raccorder le webhook Moneroo/Stripe et les commandes B2C dans `apps/commerce/views.py` et `webhooks.py` pour déclencher l'envoi de l'email de confirmation avec facture PDF jointe.
- [ ] **Task 5.2** : Raccorder les commandes grossistes B2B dans `apps/commerce/wholesaler_views.py` pour expédier le bon de commande / facture proforma PDF et les décisions de crédit.
- [ ] **Task 5.3** : Raccorder l'envoi d'emails administratifs personnalisés dans `apps/accounts/admin_views.py` (`POST /api/v1/admin/users/<id>/send-email/`).
- [ ] **Task 5.4** : Raccorder la création de compte par l'administrateur dans `apps/accounts/admin_views.py` (`POST /api/v1/admin/users/`) pour transmettre les identifiants temporaires chiffrés.
- [ ] **Task 5.5** : Raccorder le formulaire de contact support dans `apps/communications/views.py` (`POST /api/v1/communications/contact/`) pour émettre l'accusé de réception et l'alerte interne.
- [ ] **Task 5.6** : Raccorder les décisions d'affiliation étudiante dans `apps/partners/views.py` pour notifier les étudiants de la validation ou du refus de leur carte.
- [ ] **Task 5.7** : Raccorder les flux d'expédition logistique (`apps/commerce/manager_views.py`) pour notifier le client lors de la saisie du numéro de suivi.
- [ ] **Task 5.8** : Raccorder les flux de clôture de redevances (`apps/reporting/tasks.py`, `apps/admin/royalties`) pour expédier les bordereaux PDF aux auteurs, éditeurs et universités.
- [ ] **Task 5.9** : Raccorder les relances automatiques (`apps/reporting/tasks.py`) pour substituer les appels `send_mail` basiques par `EmailService` avec templates riches.

---

## Phase 6 : Tests, Validation & Documentation

- [ ] **Task 6.1** : Écrire des tests unitaires validant l'interchangeabilité Resend ↔ SMTP et le mécanisme de failover.
- [ ] **Task 6.2** : Tester l'envoi réel avec génération de facture PDF sur une commande fictive.
- [ ] **Task 6.3** : Tester l'envoi d'email officiel depuis `SendEmailModal`, la création de compte via `CreateAccountModal`, et la soumission Aide & Contact.
- [ ] **Task 6.4** : Mettre à jour la documentation d'exploitation technique et le guide des variables d'environnement.
