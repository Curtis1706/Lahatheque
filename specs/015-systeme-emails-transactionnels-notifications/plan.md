# Implementation Plan: 015-systeme-emails-transactionnels-notifications

**Feature Branch**: `015-systeme-emails-transactionnels-notifications`  
**Created**: 2026-09-03  
**Status**: Ready for Implementation  
**Specification**: [spec.md](./spec.md)

---

## 1. Contexte Technique & Stack

- **Backend** : Django 5.x / Django REST Framework, Python 3.11+, Celery + Redis pour l'exécution asynchrone des tâches d'envoi.
- **Fournisseur Actif** : **Resend** (API REST `https://api.resend.com/emails`).
  - Clé API : `re_YOUR_RESEND_API_KEY` (stockée dans .env)
  - Domaine d'émission : `mail.lahalex.com`
  - Nom d'expéditeur : `Lahatheque`
  - Expéditeur par défaut : `Lahatheque <contact@mail.lahalex.com>`
  - Expéditeur système / notifications : `Lahatheque <notifications@mail.lahalex.com>`
- **Fournisseur de Secours & Alternative Directe** : **SMTP Professionnel** (`django.core.mail.backends.smtp.EmailBackend` avec support Hostinger, Brevo, Google Workspace, Infomaniak).
- **Génération PDF dynamique** :
  - Module serveur d'exportation unifié (`apps/reporting/services/invoice_generator.py` ou `apps/commerce/services/pdf_service.py`) générant les flux binaires PDF certifiés (Factures acquittées, Factures proforma, Relevés de redevances, Attestations).
- **Templates de Messagerie** :
  - Django Template Engine (`templates/emails/`) avec layout de base responsive `base_email.html` aux normes de la charte (**Navy** `#1B2A4E`, **Gold** `#B08D42`, Google Fonts Playfair Display & Poppins, zéro emoji).

---

## 2. Architecture Technique : Provider Pattern Interchangeable

```
                         ┌──────────────────────────────────────────────────┐
                         │           Déclencheur Métier / UI                │
                         │ (Order, Admin SendEmailModal, ContactSupport, ...)│
                         └─────────────────────────┬────────────────────────┘
                                                   │
                                                   ▼
                         ┌──────────────────────────────────────────────────┐
                         │          send_transactional_email_task           │
                         │               (Celery Asynchrone)                │
                         └─────────────────────────┬────────────────────────┘
                                                   │
                                                   ▼
                         ┌──────────────────────────────────────────────────┐
                         │              EmailService (Façade)               │
                         │   - Rendu template HTML + Plain Text             │
                         │   - Génération pièces jointes PDF (si requises)  │
                         └─────────────────────────┬────────────────────────┘
                                                   │
                                                   ▼
                         ┌──────────────────────────────────────────────────┐
                         │              EmailProviderBase (ABC)             │
                         └─────────────────┬───────────────┬────────────────┘
                                           │               │
                    EMAIL_PROVIDER=resend  │               │  EMAIL_PROVIDER=smtp
                                           ▼               ▼
                                ┌────────────────┐  ┌────────────────┐
                                │ ResendProvider │  │  SmtpProvider  │
                                │ (Resend REST)  │  │ (Django SMTP)  │
                                └────────────────┘  └────────────────┘
                                           │               │
                                           └───────┬───────┘
                                                   │
                                                   ▼
                         ┌──────────────────────────────────────────────────┐
                         │             EmailNotificationLog (DB)            │
                         │             (Journalisation immuable)            │
                         └──────────────────────────────────────────────────┘
```

---

## 3. Configuration des Variables d'Environnement (`.env`)

```ini
# Configuration Fournisseur Email LAHAThèque
EMAIL_PROVIDER=resend # Actif actuellement (ou 'smtp' pour basculer)

# Configuration Resend (Domaine mail.lahalex.com & Expéditeur Lahatheque)
RESEND_API_KEY=re_YOUR_RESEND_API_KEY
EMAIL_DOMAIN=mail.lahalex.com
DEFAULT_FROM_EMAIL=Lahatheque <contact@mail.lahalex.com>
SERVER_EMAIL=Lahatheque <notifications@mail.lahalex.com>
SUPPORT_EMAIL_RECIPIENTS=["contact@mail.lahalex.com", "support@mail.lahalex.com"]

# Configuration SMTP Professionnel (Serveur de secours ou bascule directe)
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
EMAIL_USE_SSL=True
EMAIL_USE_TLS=False
EMAIL_HOST_USER=contact@mail.lahalex.com
EMAIL_HOST_PASSWORD=
EMAIL_ENABLE_FALLBACK=True
```

---

## 4. Découpage des Composants & Fichiers

### Backend Django
1. **Noyau Fournisseur & Services (`apps/communications/services/`)** :
   - `email_provider_base.py` : Classe abstraite `EmailProviderBase`.
   - `resend_provider.py` : Adaptateur pour l'API Resend (`https://api.resend.com/emails`) avec payload JSON et gestion des pièces jointes en base64.
   - `smtp_provider.py` : Adaptateur pour le SMTP Django via `django.core.mail.EmailMultiAlternatives`.
   - `email_service.py` : Façade d'envoi avec rendu HTML, fallback et enregistrement dans `EmailNotificationLog`.
   - `pdf_attachment_service.py` : Générateur de flux binaires PDF pour les pièces jointes.
2. **Modèles de Données (`apps/communications/models.py`)** :
   - Modèle `EmailNotificationLog` pour tracer chaque message.
3. **Tâches Asynchrones (`apps/communications/tasks.py`)** :
   - `task_send_transactional_email` : Exécution Celery avec politique de retry (3 tentatives).
4. **Templates HTML (`templates/emails/`)** :
   - `base_email.html` : Layout principal chic & sobre aux couleurs Navy et Gold.
   - `orders/confirmation_client.html` (Facture PDF jointe).
   - `orders/confirmation_wholesaler.html` (Proforma PDF jointe).
   - `orders/shipped.html` (Tracking transporteur).
   - `orders/cancelled.html` (Avoir / Annulation).
   - `auth/welcome_verification.html`.
   - `auth/account_created_by_admin.html` (Identifiants temporaires créés par l'admin).
   - `auth/password_reset.html`.
   - `auth/otp_code.html`.
   - `auth/security_alert.html`.
   - `admin/custom_message.html` (Email direct envoyé depuis `SendEmailModal`).
   - `support/contact_ack.html` (Accusé de réception formulaire `ContactSupportDialog`).
   - `support/internal_alert.html` (Notification interne équipe support).
   - `royalties/author_statement.html` (Bordereau PDF joint).
   - `royalties/publisher_statement.html` (Bordereau PDF joint).
   - `royalties/university_statement.html` (Relevé PDF joint).
   - `university/affiliation_decision.html` (Décision validation/rejet carte étudiant).
   - `wholesale/credit_decision.html` (Décision crédit grossiste).
   - `wholesale/catalog_alert.html` (Nouveauté / Réassort grossiste).
   - `reminders/unpaid_order.html`.
   - `reminders/subscription_expiry.html`.
   - `reminders/deposit_pending.html`.

---

## 5. Matrice de Test & Validation

- Test unitaire sur l'interface `EmailProviderBase` et l'adaptateur `ResendProvider` avec la clé fournie.
- Test d'intégration de l'envoi direct depuis `SendEmailModal` (`/api/bff/admin/users/<id>/send-email/`).
- Test d'intégration de la création manuelle d'un compte avec envoi d'identifiants (`CreateAccountModal`).
- Test d'intégration de la soumission Aide & Contact Support (`ContactSupportDialog`).
- Test de failover : simulation d'indisponibilité de Resend et basculement instantané sur SMTP.
