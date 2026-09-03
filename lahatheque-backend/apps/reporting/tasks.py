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
    cutoff_date = timezone.now() - timedelta(days=int(config.delai_relance_depots_jours or 7))
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

            from django.core.mail import send_mail
            from django.conf import settings as django_settings

            email_sent = False
            error_detail = ""
            try:
                send_mail(
                    subject=subject,
                    message=body_text,
                    from_email=getattr(django_settings, 'DEFAULT_FROM_EMAIL', 'contact@lahatheque.com'),
                    recipient_list=[recipient_email],
                    fail_silently=False,
                )
                email_sent = True
            except Exception as mail_err:
                error_detail = str(mail_err)
                logger.error(f"Échec envoi relance dépôt {deposit.id} à {recipient_email}: {mail_err}")

            try:
                RelanceAutomatiqueLog.objects.create(
                    type_relance=RelanceAutomatiqueLog.TypeRelance.DEPOT_EN_ATTENTE,
                    canal=RelanceAutomatiqueLog.CanalRelance.EMAIL,
                    destinataire_email=recipient_email,
                    destinataire_nom=recipient_name,
                    objet=subject,
                    message=body_text if email_sent else f"{body_text}\n\n[ÉCHEC: {error_detail}]",
                    reference_id=str(deposit.id),
                    statut=RelanceAutomatiqueLog.StatutRelance.ENVOYE if email_sent else RelanceAutomatiqueLog.StatutRelance.ECHEC
                )
                if email_sent:
                    results["sent"] += 1
                else:
                    results["errors"] += 1
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
    cutoff_date = timezone.now() - timedelta(days=int(config.delai_relance_impayes_jours or 7))
    results = {"processed": 0, "sent": 0, "errors": 0}

    try:
        from apps.commerce.models import Order
        filter_field = 'statut_paiement' if hasattr(Order, 'statut_paiement') else 'payment_status'
        unpaid_orders = Order.objects.filter(
            **{filter_field: 'pending'},
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

            from django.core.mail import send_mail
            from django.conf import settings as django_settings

            email_sent = False
            error_detail = ""
            try:
                send_mail(
                    subject=subject,
                    message=body_text,
                    from_email=getattr(django_settings, 'DEFAULT_FROM_EMAIL', 'contact@lahatheque.com'),
                    recipient_list=[recipient_email],
                    fail_silently=False,
                )
                email_sent = True
            except Exception as mail_err:
                error_detail = str(mail_err)
                logger.error(f"Échec envoi relance impayé {order.id} à {recipient_email}: {mail_err}")

            try:
                RelanceAutomatiqueLog.objects.create(
                    type_relance=RelanceAutomatiqueLog.TypeRelance.FACTURE_IMPAYEE,
                    canal=RelanceAutomatiqueLog.CanalRelance.EMAIL,
                    destinataire_email=recipient_email,
                    destinataire_nom=recipient_name,
                    objet=subject,
                    message=body_text if email_sent else f"{body_text}\n\n[ÉCHEC: {error_detail}]",
                    reference_id=str(order.id),
                    statut=RelanceAutomatiqueLog.StatutRelance.ENVOYE if email_sent else RelanceAutomatiqueLog.StatutRelance.ECHEC
                )
                if email_sent:
                    results["sent"] += 1
                else:
                    results["errors"] += 1
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
    target_date_max = timezone.now() + timedelta(days=int(config.delai_relance_abonnements_jours or 15))
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

            from django.core.mail import send_mail
            from django.conf import settings as django_settings

            email_sent = False
            error_detail = ""
            try:
                send_mail(
                    subject=subject,
                    message=body_text,
                    from_email=getattr(django_settings, 'DEFAULT_FROM_EMAIL', 'contact@lahatheque.com'),
                    recipient_list=[recipient_email],
                    fail_silently=False,
                )
                email_sent = True
            except Exception as mail_err:
                error_detail = str(mail_err)
                logger.error(f"Échec envoi relance abonnement {sub.id} à {recipient_email}: {mail_err}")

            try:
                RelanceAutomatiqueLog.objects.create(
                    type_relance=RelanceAutomatiqueLog.TypeRelance.ABONNEMENT_EXPIRATION,
                    canal=RelanceAutomatiqueLog.CanalRelance.EMAIL,
                    destinataire_email=recipient_email,
                    destinataire_nom=recipient_name,
                    objet=subject,
                    message=body_text if email_sent else f"{body_text}\n\n[ÉCHEC: {error_detail}]",
                    reference_id=str(sub.id),
                    statut=RelanceAutomatiqueLog.StatutRelance.ENVOYE if email_sent else RelanceAutomatiqueLog.StatutRelance.ECHEC
                )
                if email_sent:
                    results["sent"] += 1
                else:
                    results["errors"] += 1
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


@shared_task
def task_calculate_monthly_royalties():
    """
    Calcul mensuel automatique des redevances : part université (ventes directes hors bouquet
    partagé), part éditeur tiers, part auteur sur le reste. Exécuté le 1er de chaque mois.
    """
    from decimal import Decimal
    from django.db.models import Sum, Count
    from apps.catalog.models import Ouvrage
    from apps.commerce.models import LigneCommande
    from apps.rights.models import RoyaltyCalculation, RoyaltyPayoutLine, AuthorRight
    from apps.partners.models import UniversityRoyaltyStatement

    now = timezone.now()
    last_month_start = (now.replace(day=1) - timedelta(days=1)).replace(day=1)
    last_month_end = now.replace(day=1) - timedelta(days=1)
    period_month_date = last_month_start.date()
    period_label = period_month_date.strftime("%Y-%m")

    lignes = LigneCommande.objects.filter(
        commande__created_at__gte=last_month_start,
        commande__created_at__lte=last_month_end,
        commande__statut_paiement='paid',
    ).values('ouvrage').annotate(
        total_sales=Sum('unit_price'),
        units_sold=Count('id'),
    )

    calculations_created = 0
    payout_lines_created = 0
    payout_lines_corrected = 0
    university_statements_created = 0

    for ligne in lignes:
        ouvrage = Ouvrage.objects.filter(id=ligne['ouvrage']).select_related('institution', 'publisher').first()
        if not ouvrage:
            continue

        total_sales = Decimal(str(ligne['total_sales'] or 0))

        university_payout = Decimal("0.00")
        if ouvrage.institution:
            univ_rate = Decimal(str(getattr(ouvrage.institution, 'royalty_rate', 15))) / Decimal("100")
            university_payout = (total_sales * univ_rate).quantize(Decimal("0.01"))

            if university_payout > 0:
                ref = f"REP-DIRECT-{period_label}-{str(ouvrage.id)[:8]}"
                UniversityRoyaltyStatement.objects.get_or_create(
                    institution=ouvrage.institution,
                    reference=ref,
                    defaults={
                        "period": f"{period_label}-direct-{str(ouvrage.id)[:8]}",
                        "total_sales_catalog": total_sales,
                        "royalty_rate": getattr(ouvrage.institution, 'royalty_rate', Decimal("15.00")),
                        "net_royalty_amount": university_payout,
                        "status": "available",
                    }
                )
                university_statements_created += 1

        publisher_payout = Decimal("0.00")
        if ouvrage.publisher and hasattr(ouvrage.publisher, 'contractual_royalty_rate'):
            pub_rate = Decimal(str(ouvrage.publisher.contractual_royalty_rate)) / Decimal("100")
            publisher_payout = (total_sales * pub_rate).quantize(Decimal("0.01"))

        calculation, _ = RoyaltyCalculation.objects.update_or_create(
            ouvrage=ouvrage,
            period_month=period_month_date,
            defaults={
                'total_reads_count': ligne['units_sold'],
                'total_revenue': total_sales,
                'publisher_payout_amount': publisher_payout,
            }
        )
        calculations_created += 1

        author_pool = total_sales - university_payout - publisher_payout
        if author_pool <= 0:
            continue

        author_rights = AuthorRight.objects.filter(ouvrage=ouvrage, user__isnull=False)
        for right in author_rights:
            share = Decimal(str(right.pool_share_percent)) / Decimal("100")
            amount = (author_pool * share).quantize(Decimal("0.01"))
            if amount <= 0:
                continue

            existing_line = RoyaltyPayoutLine.objects.filter(calculation=calculation, author_right=right).first()

            if existing_line:
                if not existing_line.is_settled and existing_line.payout_amount != amount:
                    existing_line.payout_amount = amount
                    existing_line.save(update_fields=['payout_amount'])
                    payout_lines_corrected += 1
            else:
                RoyaltyPayoutLine.objects.create(
                    calculation=calculation, author_right=right,
                    payout_amount=amount, is_settled=False
                )
                payout_lines_created += 1

    return {
        "period": period_label,
        "calculations_created": calculations_created,
        "payout_lines_created": payout_lines_created,
        "payout_lines_corrected": payout_lines_corrected,
        "university_statements_created": university_statements_created,
    }


@shared_task
def task_check_stock_alerts():
    """
    Vérifie les stocks sous le seuil d'alerte et notifie Gestionnaires + Administrateurs.
    Exécutée périodiquement (toutes les 6h).
    """
    from apps.commerce.models import StockOuvrage
    from apps.accounts.models import User
    from apps.reporting.models import Notification
    from apps.reporting.services import notify_user

    stocks = StockOuvrage.objects.select_related('ouvrage', 'entrepot').all()
    alert_stocks = [s for s in stocks if s.quantite_disponible <= s.seuil_alerte]

    if not alert_stocks:
        return {"alerts_sent": 0}

    recipients = User.objects.filter(role__in=['manager', 'admin', 'super_admin'], is_active=True)
    if not recipients.exists():
        return {"alerts_sent": 0, "warning": "Aucun gestionnaire/admin actif trouvé."}

    sent = 0
    for stock in alert_stocks:
        already_notified = Notification.objects.filter(
            notification_type='system',
            resource_id=str(stock.id),
            is_read=False,
        ).exists()
        if already_notified:
            continue

        for recipient in recipients:
            try:
                notify_user(
                    user=recipient,
                    notification_type=Notification.NotificationType.SYSTEM,
                    title="Alerte de stock bas" if stock.quantite_disponible > 0 else "Rupture de stock",
                    message=(
                        f"« {stock.ouvrage.title} » — {stock.quantite_disponible} exemplaire(s) "
                        f"disponible(s) à {stock.entrepot.nom} (seuil : {stock.seuil_alerte})."
                    ),
                    action_url="/manager/stock/alerts",
                    resource_id=str(stock.id),
                )
                sent += 1
            except Exception:
                pass

    return {"alerts_sent": sent, "articles_en_alerte": len(alert_stocks)}


def check_and_generate_legal_notifications(user=None):
    """
    Génère et synchronise les alertes et notifications réelles pour les juristes et administrateurs.
    - Contrats expirant dans moins de 30 jours ou expirés
    - Contrats en attente de signature
    - Suggestions IA de redevances non validées
    - Dossiers de pré-édition actifs en attente de dépôt
    - Factures clients impayées dépassant le seuil configuré
    """
    from apps.rights.models import ContratLegal, AIRoyaltySuggestion, PreEditionDossier, DebtReminderConfig
    from apps.commerce.models import Order
    from apps.accounts.models import User
    from apps.reporting.models import Notification
    from apps.reporting.services import notify_user
    from django.utils import timezone
    from datetime import timedelta

    recipients = [user] if user else list(User.objects.filter(role__in=['legal_reviewer', 'admin', 'super_admin'], is_active=True))
    if not recipients:
        return 0

    now = timezone.now()
    today = now.date()
    sent_count = 0

    # 1. Contrats approchant de l'échéance (< 30 jours)
    expiring_contracts = ContratLegal.objects.filter(
        status='active',
        date_expiration__isnull=False,
        date_expiration__lte=today + timedelta(days=30),
        date_expiration__gte=today
    )
    for c in expiring_contracts:
        res_id = f"contract_expiry_{c.id}_{c.date_expiration}"
        for r in recipients:
            if not Notification.objects.filter(user=r, resource_id=res_id).exists():
                notify_user(
                    user=r,
                    notification_type=Notification.NotificationType.SYSTEM,
                    title="Échéance contractuelle proche",
                    message=f"Le contrat « {c.titre} » ({c.numero_contrat}) avec {c.contracting_party} expire le {c.date_expiration.strftime('%d/%m/%Y')}.",
                    action_url=f"/legal-reviewer/contracts/{c.id}",
                    resource_id=res_id,
                )
                sent_count += 1

    # 2. Contrats en attente de signature
    pending_contracts = ContratLegal.objects.filter(status='pending_signature')
    for c in pending_contracts:
        res_id = f"contract_pending_sig_{c.id}"
        for r in recipients:
            if not Notification.objects.filter(user=r, resource_id=res_id).exists():
                notify_user(
                    user=r,
                    notification_type=Notification.NotificationType.SYSTEM,
                    title="Contrat en attente de signature",
                    message=f"L'acte contractuel « {c.titre} » ({c.numero_contrat}) est en attente de signature de {c.contracting_party}.",
                    action_url=f"/legal-reviewer/contracts/{c.id}",
                    resource_id=res_id,
                )
                sent_count += 1

    # 3. Suggestions IA de redevances non validées
    ai_suggs = AIRoyaltySuggestion.objects.filter(is_validated=False).select_related('ouvrage')
    for sug in ai_suggs:
        book_title = sug.ouvrage.titre if sug.ouvrage else sug.contrat.titre
        res_id = f"ai_royalty_sug_{sug.id}"
        for r in recipients:
            if not Notification.objects.filter(user=r, resource_id=res_id).exists():
                notify_user(
                    user=r,
                    notification_type=Notification.NotificationType.SYSTEM,
                    title="Suggestion IA de redevances",
                    message=f"L'analyse IA propose une clé de répartition pour « {book_title} » ({sug.pourcentage_suggere}% pour {sug.beneficiaire_nom}).",
                    action_url="/legal-reviewer/royalties?tab=suggestions",
                    resource_id=res_id,
                )
                sent_count += 1

    # 4. Dossiers de pré-édition actifs
    pre_editions = PreEditionDossier.objects.filter(status='en_attente_depot')
    for d in pre_editions:
        res_id = f"pre_edition_{d.id}"
        for r in recipients:
            if not Notification.objects.filter(user=r, resource_id=res_id).exists():
                notify_user(
                    user=r,
                    notification_type=Notification.NotificationType.SYSTEM,
                    title="Dossier de pré-édition actif",
                    message=f"Le dossier « {d.titre_previsionnel} » ({d.code_dossier}) pour {d.auteur_nom} est en attente du dépôt maquette.",
                    action_url="/legal-reviewer/pre-editions",
                    resource_id=res_id,
                )
                sent_count += 1

    # 5. Créances et impayés clients
    config = DebtReminderConfig.get_or_create_singleton()
    if config.auto_remind_enabled:
        cutoff = now - timedelta(days=int(config.first_reminder_days or 7))
        unpaid_orders = Order.objects.filter(
            statut_paiement='pending',
            created_at__lte=cutoff,
            total_amount__gte=config.min_amount_threshold
        ).select_related('user')

        for o in unpaid_orders:
            client_name = o.user.get_full_name() or o.user.email if o.user else "Client"
            res_id = f"unpaid_order_{o.id}"
            for r in recipients:
                if not Notification.objects.filter(user=r, resource_id=res_id).exists():
                    notify_user(
                        user=r,
                        notification_type=Notification.NotificationType.SYSTEM,
                        title="Facture client impayée",
                        message=f"La commande #{o.id} de {client_name} ({float(o.total_amount):,.0f} XOF) a dépassé le délai de paiement.",
                        action_url="/legal-reviewer/relances?tab=debts",
                        resource_id=res_id,
                    )
                    sent_count += 1

    return sent_count


@shared_task
def task_check_legal_alerts():
    """Tâche périodique pour la génération des alertes et notifications juridiques."""
    sent = check_and_generate_legal_notifications()
    return {"legal_alerts_sent": sent}


@shared_task
def task_distribute_bouquet_revenue():
    """
    Répartition mensuelle des revenus des bouquets partagés entre plusieurs universités,
    au prorata de l'utilisation réelle (CDC section 11).
    """
    from apps.partners.models import (
        BouquetOffering, UniversityBouquetSubscription, UniversityRoyaltyStatement
    )
    from apps.protection.models import TraceAcces
    from django.db.models import Count
    from django.utils import timezone
    from datetime import timedelta
    import uuid as uuid_lib

    now = timezone.now()
    period_start = (now.replace(day=1) - timedelta(days=1)).replace(day=1)
    period_end = now.replace(day=1) - timedelta(days=1)
    period_label = period_start.strftime("%Y-%m")

    shared_offering_ids = (
        UniversityBouquetSubscription.objects
        .filter(status="active", offering_id__isnull=False)
        .values("offering_id")
        .annotate(n=Count("institution", distinct=True))
        .filter(n__gte=2)
        .values_list("offering_id", flat=True)
    )

    statements_created = 0

    for offering_id in shared_offering_ids:
        subs = UniversityBouquetSubscription.objects.filter(
            offering_id=offering_id, status="active"
        ).select_related("institution")

        total_pool = sum(float(s.annual_price) for s in subs) / 12

        if total_pool <= 0:
            continue

        usage_by_institution = {}
        total_usage = 0

        for sub in subs:
            count = TraceAcces.objects.filter(
                bouquet_subscription=sub,
                timestamp__gte=period_start,
                timestamp__lte=period_end,
            ).count()

            usage_by_institution[sub.institution_id] = usage_by_institution.get(sub.institution_id, 0) + count
            total_usage += count

        if total_usage == 0:
            n_inst = len(set(s.institution_id for s in subs))
            usage_by_institution = {s.institution_id: 1 for s in subs}
            total_usage = n_inst

        for sub in subs:
            part_utilisation = usage_by_institution.get(sub.institution_id, 0) / total_usage
            ca_institution = total_pool * part_utilisation
            taux = float(sub.institution.royalty_rate) if hasattr(sub.institution, 'royalty_rate') else 15.0
            redevance = ca_institution * (taux / 100)

            if redevance <= 0:
                continue

            ref = f"REP-BOUQ-{period_label}-{str(uuid_lib.uuid4())[:6].upper()}"

            UniversityRoyaltyStatement.objects.get_or_create(
                institution=sub.institution,
                period=f"{period_label}-bouquet-{str(offering_id)[:8]}",
                defaults={
                    "reference": ref,
                    "total_sales_catalog": ca_institution,
                    "royalty_rate": taux,
                    "net_royalty_amount": redevance,
                    "currency": sub.currency,
                    "status": "available",
                }
            )
            statements_created += 1

    return {
        "period": period_label,
        "shared_bouquets_processed": len(list(shared_offering_ids)),
        "statements_created": statements_created,
    }


