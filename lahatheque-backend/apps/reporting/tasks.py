import logging
from datetime import timedelta
from celery import shared_task
from django.utils import timezone
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from apps.reporting.models import ConfigurationPlateformeGlobale, RelanceAutomatiqueLog

logger = logging.getLogger(__name__)


def _get_platform_config() -> ConfigurationPlateformeGlobale:
    config = ConfigurationPlateformeGlobale.objects.first()
    if not config:
        config = ConfigurationPlateformeGlobale.objects.create()
    return config


@shared_task(bind=True, max_retries=3)
def send_email_task(self, recipient_list, subject, html_content, from_email=None):
    """
    Tâche Celery pour envoyer des emails transactionnels (SMTP Hostinger / Brevo).
    """
    if not recipient_list:
        logger.warning("send_email_task: Liste de destinataires vide.")
        return False

    sender = from_email or getattr(settings, 'DEFAULT_FROM_EMAIL', 'LAHATHEQUE <contact@lahacademia.com>')
    success = True
    
    if isinstance(recipient_list, str):
        recipient_list = [recipient_list]
        
    for recipient in recipient_list:
        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=html_content,
                from_email=sender,
                to=[recipient],
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
            logger.info(f"Email envoyé avec succès à {recipient}: {subject}")
        except Exception as exc:
            logger.error(f"Erreur lors de l'envoi d'email à {recipient}: {exc}")
            success = False

    return success


@shared_task
def task_scan_and_send_deposit_reminders():
    """
    Scan des dépôts de maquettes en attente ou incomplets depuis plus de N jours.
    """
    config = _get_platform_config()
    cutoff_date = timezone.now() - timedelta(days=config.delai_relance_depots_jours)
    results = {"processed": 0, "sent": 0, "errors": 0}

    try:
        from apps.publishers_portal.models import PublisherBookDeposit, PublisherDepositStatus
        pending_deposits = PublisherBookDeposit.objects.filter(
            status__in=[PublisherDepositStatus.PENDING, PublisherDepositStatus.REVISION_REQUESTED],
            created_at__lte=cutoff_date
        ).select_related('publisher')

        for deposit in pending_deposits:
            results["processed"] += 1
            recipient_email = deposit.publisher.contact_email or (deposit.publisher.user.email if deposit.publisher.user else None)
            recipient_name = deposit.publisher.company_name or deposit.publisher.name or "Éditeur Partenaire"
            
            if not recipient_email:
                continue

            subject = f"Rappel : Dépôt en attente de finalisation - {deposit.title}"
            body_text = (
                f"Bonjour {recipient_name},\n\n"
                f"Votre soumission de maquette pour l'ouvrage \"{deposit.title}\" (ISBN: {deposit.isbn_digital}) "
                f"est en attente depuis plus de {config.delai_relance_depots_jours} jours.\n"
                f"Veuillez vous connecter à votre espace éditeur LAHAThèque pour finaliser le processus.\n\n"
                f"Cordialement,\nL'équipe LAHAThèque"
            )

            try:
                RelanceAutomatiqueLog.objects.create(
                    type_relance=RelanceAutomatiqueLog.TypeRelance.DEPOT_EN_ATTENTE,
                    canal=RelanceAutomatiqueLog.CanalRelance.EMAIL,
                    destinataire_email=recipient_email,
                    destinataire_nom=recipient_name,
                    objet=subject,
                    message=body_text,
                    reference_id=str(deposit.id),
                    statut=RelanceAutomatiqueLog.StatutRelance.ENVOYE
                )
                results["sent"] += 1
            except Exception as e:
                logger.error(f"Erreur enregistrement relance dépôt {deposit.id}: {e}")
                results["errors"] += 1

    except Exception as e:
        logger.error(f"Erreur scan dépôts en attente: {e}")
        results["errors"] += 1

    return results


@shared_task
def task_scan_and_send_unpaid_reminders():
    """
    Scan des commandes et factures impayées depuis plus de N jours.
    """
    config = _get_platform_config()
    cutoff_date = timezone.now() - timedelta(days=config.delai_relance_impayes_jours)
    results = {"processed": 0, "sent": 0, "errors": 0}

    try:
        from apps.commerce.models import Order
        unpaid_orders = Order.objects.filter(
            payment_status='pending',
            created_at__lte=cutoff_date
        ).select_related('user')

        for order in unpaid_orders:
            results["processed"] += 1
            recipient_email = order.user.email if order.user else getattr(order, 'guest_email', None)
            recipient_name = f"{order.user.first_name} {order.user.last_name}" if order.user else "Client LAHAThèque"

            if not recipient_email:
                continue

            order_num = getattr(order, 'order_number', str(order.id)[:8])
            amount = getattr(order, 'total_amount', 0)
            subject = f"Rappel : Commande {order_num} en attente de règlement"
            body_text = (
                f"Bonjour {recipient_name},\n\n"
                f"Votre commande n°{order_num} d'un montant de {amount} XOF est toujours en attente de paiement.\n"
                f"Vous pouvez régler en toute sécurité via Mobile Money (MTN / Moov / Orange) ou Carte Bancaire.\n\n"
                f"L'équipe LAHAThèque"
            )

            try:
                RelanceAutomatiqueLog.objects.create(
                    type_relance=RelanceAutomatiqueLog.TypeRelance.FACTURE_IMPAYEE,
                    canal=RelanceAutomatiqueLog.CanalRelance.EMAIL,
                    destinataire_email=recipient_email,
                    destinataire_nom=recipient_name,
                    objet=subject,
                    message=body_text,
                    reference_id=str(order.id),
                    statut=RelanceAutomatiqueLog.StatutRelance.ENVOYE
                )
                results["sent"] += 1
            except Exception as e:
                logger.error(f"Erreur enregistrement relance impayé {order.id}: {e}")
                results["errors"] += 1

    except Exception as e:
        logger.error(f"Erreur scan commandes impayées: {e}")
        results["errors"] += 1

    return results


@shared_task
def task_scan_and_send_subscription_expiry_reminders():
    """
    Scan des abonnements et bouquets arrivant à expiration sous N jours.
    """
    config = _get_platform_config()
    target_date_max = timezone.now() + timedelta(days=config.delai_relance_abonnements_jours)
    results = {"processed": 0, "sent": 0, "errors": 0}

    try:
        from apps.commerce.models import Subscription
        expiring_subs = Subscription.objects.filter(
            is_active=True,
            expires_at__gt=timezone.now(),
            expires_at__lte=target_date_max
        ).select_related('user', 'institution', 'plan')

        for sub in expiring_subs:
            results["processed"] += 1
            recipient_email = sub.user.email if sub.user else (sub.institution.contact_email if sub.institution else None)
            recipient_name = f"{sub.user.first_name} {sub.user.last_name}" if sub.user else (sub.institution.name if sub.institution else "Abonné")

            if not recipient_email:
                continue

            days_remaining = max(1, (sub.expires_at - timezone.now()).days)
            plan_name = sub.plan.name if sub.plan else "Abonnement LAHAThèque"
            subject = f"Votre abonnement {plan_name} expire dans {days_remaining} jours"
            body_text = (
                f"Bonjour {recipient_name},\n\n"
                f"Nous vous informons que votre abonnement '{plan_name}' arrivera à échéance le {sub.expires_at.strftime('%d/%m/%Y')}.\n"
                f"Pour conserver votre accès illimité aux ouvrages académiques et outils de révision, renouvelez votre Pass dès maintenant.\n\n"
                f"L'équipe LAHAThèque"
            )

            try:
                RelanceAutomatiqueLog.objects.create(
                    type_relance=RelanceAutomatiqueLog.TypeRelance.ABONNEMENT_EXPIRATION,
                    canal=RelanceAutomatiqueLog.CanalRelance.EMAIL,
                    destinataire_email=recipient_email,
                    destinataire_nom=recipient_name,
                    objet=subject,
                    message=body_text,
                    reference_id=str(sub.id),
                    statut=RelanceAutomatiqueLog.StatutRelance.ENVOYE
                )
                results["sent"] += 1
            except Exception as e:
                logger.error(f"Erreur enregistrement relance abonnement {sub.id}: {e}")
                results["errors"] += 1

    except Exception as e:
        logger.error(f"Erreur scan abonnements expirants: {e}")
        results["errors"] += 1

    return results


def run_all_automated_reminders() -> dict:
    """
    Exécution manuelle synchrone de tous les moteurs de relances (pour déclenchement par l'admin).
    """
    dep_res = task_scan_and_send_deposit_reminders()
    unpaid_res = task_scan_and_send_unpaid_reminders()
    exp_res = task_scan_and_send_subscription_expiry_reminders()

    return {
        "deposits": dep_res,
        "unpaid": unpaid_res,
        "subscriptions": exp_res,
        "total_sent": dep_res.get("sent", 0) + unpaid_res.get("sent", 0) + exp_res.get("sent", 0),
        "total_processed": dep_res.get("processed", 0) + unpaid_res.get("processed", 0) + exp_res.get("processed", 0),
        "total_errors": dep_res.get("errors", 0) + unpaid_res.get("errors", 0) + exp_res.get("errors", 0),
    }
