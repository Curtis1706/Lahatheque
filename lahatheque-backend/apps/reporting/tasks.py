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
    Tâche Celery pour envoyer des emails transactionnels et alertes système.
    Passe par la façade EmailService (avec support Resend API et failover SMTP unifié).
    """
    if not recipient_list:
        logger.warning("send_email_task: Liste de destinataires vide.")
        return False

    sender = from_email or getattr(settings, 'DEFAULT_FROM_EMAIL', 'Lahatheque <contact@mail.lahalex.com>')
    success = True
    
    if isinstance(recipient_list, str):
        recipient_list = [recipient_list]
        
    for recipient in recipient_list:
        try:
            from apps.communications.services.email_service import EmailService
            result = EmailService.send(
                email_type="system_alert",
                to_email=recipient,
                subject=subject,
                template_name="emails/admin/custom_message.html",
                context={
                    "body_text": html_content,
                    "message_body": html_content,
                    "custom_subject": subject,
                },
                from_email=sender,
            )
            if result.success:
                logger.info(f"Email envoyé avec succès à {recipient} via {result.provider}: {subject}")
            else:
                logger.error(f"Échec de l'envoi d'email à {recipient}: {result.error}")
                success = False
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
    cutoff_date = timezone.now() - timedelta(days=int(getattr(config, 'delai_relance_depots_jours', 7) or 7))
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

            from apps.communications.services.email_service import send_transactional_email

            email_sent = False
            error_detail = ""
            try:
                result = send_transactional_email(
                    email_type="deposit_reminder",
                    to_email=recipient_email,
                    subject=subject,
                    template_name="emails/admin/custom_message.html",
                    context={
                        "body_text": body_text,
                        "message_body": body_text,
                        "recipient_name": recipient_name,
                        "custom_subject": subject,
                    },
                    recipient_name=recipient_name,
                    async_send=False,
                )
                email_sent = bool(getattr(result, "success", False))
                if not email_sent:
                    error_detail = str(getattr(result, "error", "Échec inconnu"))
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
    cutoff_date = timezone.now() - timedelta(days=int(config.delai_relance_impayes_jours or 7) if config.delai_relance_impayes_jours is not None else 7)
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

            from apps.communications.services.email_service import send_transactional_email

            email_sent = False
            error_detail = ""
            try:
                result = send_transactional_email(
                    email_type="unpaid_reminder",
                    to_email=recipient_email,
                    subject=subject,
                    template_name="emails/admin/custom_message.html",
                    context={
                        "body_text": body_text,
                        "message_body": body_text,
                        "recipient_name": recipient_name,
                        "custom_subject": subject,
                    },
                    recipient_name=recipient_name,
                    async_send=False,
                )
                email_sent = bool(getattr(result, "success", False))
                if not email_sent:
                    error_detail = str(getattr(result, "error", "Échec inconnu"))
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
    target_date_max = timezone.now() + timedelta(days=int(config.delai_relance_abonnements_jours or 15) if config.delai_relance_abonnements_jours is not None else 15)
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

            from apps.communications.services.email_service import send_transactional_email

            email_sent = False
            error_detail = ""
            try:
                result = send_transactional_email(
                    email_type="subscription_expiry_reminder",
                    to_email=recipient_email,
                    subject=subject,
                    template_name="emails/admin/custom_message.html",
                    context={
                        "body_text": body_text,
                        "message_body": body_text,
                        "recipient_name": recipient_name,
                        "custom_subject": subject,
                    },
                    recipient_name=recipient_name,
                    async_send=False,
                )
                email_sent = bool(getattr(result, "success", False))
                if not email_sent:
                    error_detail = str(getattr(result, "error", "Échec inconnu"))
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
def task_calculate_monthly_royalties(include_current_month=False):
    """
    Calcul automatique des redevances : part université (ventes directes hors bouquet
    partagé), part éditeur tiers, part auteur sur le reste.

    NOTE ARCHITECTURALE — SÉPARATION DES FLUX :
    Cette tâche traite UNIQUEMENT les ventes unitaires (LigneCommande payées).
    Les revenus issus des bouquets documentaires sont traités séparément par
    task_distribute_bouquet_revenue (CDC section 11) sur la base du prix d'abonnement.
    Il n'y a pas de doublon : les ventes unitaires génèrent des références REP-DIRECT-*
    et les bouquets génèrent des références REP-BOUQ-*. Une université peut percevoir
    les deux types de redevances simultanément (vente directe + part bouquet), ce qui
    est conforme au CDC.

    Exécuté le 1er de chaque mois via Celery Beat (mois précédent), ou manuellement
    par l'administrateur avec include_current_month=True (mois précédent + mois en cours).
    """
    from decimal import Decimal
    from django.db import models
    from django.db.models import Sum, Count
    from apps.catalog.models import Ouvrage
    from apps.commerce.models import LigneCommande
    from apps.rights.models import RoyaltyCalculation, RoyaltyPayoutLine, AuthorRight, RoyaltyRate, RepartitionDroits
    from apps.partners.models import UniversityRoyaltyStatement

    now = timezone.now()

    # Construction de la liste des périodes à traiter
    periods = []

    # 1. Mois civil précédent (période standard mensuelle)
    last_month_start = (now.replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)).replace(day=1)
    last_month_end = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(seconds=1)
    periods.append((last_month_start, last_month_end, last_month_start.date()))

    # 2. Mois civil en cours (si déclenché manuellement ou requis)
    if include_current_month:
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        current_month_end = now
        periods.append((current_month_start, current_month_end, current_month_start.date()))

    total_calculations_created = 0
    total_payout_lines_created = 0
    total_payout_lines_corrected = 0
    total_university_statements_created = 0
    processed_periods = []

    for start_dt, end_dt, period_month_date in periods:
        period_label = period_month_date.strftime("%Y-%m")
        processed_periods.append(period_label)

        lignes = LigneCommande.objects.filter(
            commande__created_at__gte=start_dt,
            commande__created_at__lte=end_dt,
            commande__statut_paiement='paid',
        ).values('ouvrage').annotate(
            total_sales=Sum(models.F('unit_price') * models.F('quantity')),
            units_sold=Sum('quantity'),
        )

        ventes_par_format = {}
        for row in LigneCommande.objects.filter(
            commande__created_at__gte=start_dt,
            commande__created_at__lte=end_dt,
            commande__statut_paiement='paid',
        ).values('ouvrage', 'format_type').annotate(sous_total=Sum(models.F('unit_price') * models.F('quantity'))):
            ouvrage_id = row['ouvrage']
            ventes_par_format.setdefault(ouvrage_id, {'digital': Decimal('0.00'), 'paper': Decimal('0.00'), 'audio': Decimal('0.00')})
            fmt = row['format_type'] if row['format_type'] in ('digital', 'paper', 'audio') else 'digital'
            ventes_par_format[ouvrage_id][fmt] += Decimal(str(row['sous_total'] or 0))

        for ligne in lignes:
            ouvrage = Ouvrage.objects.filter(id=ligne['ouvrage']).select_related('institution', 'publisher').first()
            if not ouvrage:
                continue

            total_sales = Decimal(str(ligne['total_sales'] or 0))

            university_payout = Decimal("0.00")
            if ouvrage.institution:
                book_rate = RoyaltyRate.objects.filter(ouvrage=ouvrage).first()

                if book_rate and book_rate.university_share_percent is not None:
                    univ_rate = Decimal(str(book_rate.university_share_percent)) / Decimal("100")
                else:
                    univ_rate = Decimal(str(getattr(ouvrage.institution, 'royalty_rate', 15))) / Decimal("100")

                university_payout = (total_sales * univ_rate).quantize(Decimal("0.01"))

                if university_payout > 0:
                    ref = f"REP-DIRECT-{period_label}-{str(ouvrage.id)[:8]}"
                    applied_rate_val = (univ_rate * Decimal("100")).quantize(Decimal("0.01"))
                    UniversityRoyaltyStatement.objects.get_or_create(
                        institution=ouvrage.institution,
                        reference=ref,
                        defaults={
                            "period": f"{period_label}-direct-{str(ouvrage.id)[:8]}",
                            "total_sales_catalog": total_sales,
                            "royalty_rate": applied_rate_val,
                            "net_royalty_amount": university_payout,
                            "status": "available",
                        }
                    )
                    total_university_statements_created += 1

            publisher_payout = Decimal("0.00")
            book_specific_rate = RoyaltyRate.objects.filter(ouvrage=ouvrage).first()

            if book_specific_rate:
                pub_rate = Decimal(str(book_specific_rate.publisher_share_percent)) / Decimal("100")
                publisher_payout = (total_sales * pub_rate).quantize(Decimal("0.01"))
            elif ouvrage.publisher and hasattr(ouvrage.publisher, 'contractual_royalty_rate'):
                pub_rate = Decimal(str(ouvrage.publisher.contractual_royalty_rate)) / Decimal("100")
                publisher_payout = (total_sales * pub_rate).quantize(Decimal("0.01"))

            if total_sales <= Decimal("0.00"):
                continue

            book_royalty_rate_obj = RoyaltyRate.objects.filter(ouvrage=ouvrage).first()
            if book_royalty_rate_obj and book_royalty_rate_obj.author_share_percent is not None:
                global_author_rate = Decimal(str(book_royalty_rate_obj.author_share_percent)) / Decimal("100")
            else:
                global_author_rate = Decimal("0.15")

            author_pool = (total_sales * global_author_rate).quantize(Decimal("0.01"))
            platform_revenue = max(Decimal("0.00"), total_sales - author_pool - publisher_payout - university_payout)

            calculation, _ = RoyaltyCalculation.objects.update_or_create(
                ouvrage=ouvrage,
                period_month=period_month_date,
                defaults={
                    'total_reads_count': ligne['units_sold'],
                    'total_revenue': total_sales,
                    'publisher_payout_amount': publisher_payout,
                    'platform_revenue_amount': platform_revenue,
                }
            )
            total_calculations_created += 1

            if author_pool <= 0:
                continue

            ventes_fmt = ventes_par_format.get(ouvrage.id, {'digital': Decimal('0.00'), 'paper': Decimal('0.00'), 'audio': Decimal('0.00')})

            author_rights = AuthorRight.objects.filter(ouvrage=ouvrage, user__isnull=False)
            if not author_rights.exists():
                # Auto-réconciliation des droits d'auteur pour cet ouvrage vendu
                from apps.rights.models import RepartitionDroits, ContratLegal
                from apps.catalog.models import BookAuthor
                from apps.accounts.models import User

                # 1. Depuis RepartitionDroits
                for rep in RepartitionDroits.objects.filter(ouvrage=ouvrage).select_related('beneficiaire'):
                    if rep.beneficiaire:
                        ba = ouvrage.authors.filter(
                            models.Q(user=rep.beneficiaire) |
                            models.Q(first_name__iexact=rep.beneficiaire.first_name, last_name__iexact=rep.beneficiaire.last_name)
                        ).first()
                        if ba and not ba.user:
                            ba.user = rep.beneficiaire
                            ba.save(update_fields=['user'])
                        AuthorRight.objects.get_or_create(
                            ouvrage=ouvrage,
                            user=rep.beneficiaire,
                            defaults={
                                'author': ba,
                                'role': rep.role_libelle or 'auteur_principal',
                                'pool_share_percent': rep.pourcentage or 100.0,
                            }
                        )

                # 2. Depuis ContratLegal
                for c in ContratLegal.objects.filter(ouvrage=ouvrage).select_related('signataire_user'):
                    author_u = c.signataire_user
                    if not author_u and c.contracting_party_email:
                        author_u = User.objects.filter(email__iexact=c.contracting_party_email).first()
                    if author_u:
                        ba = ouvrage.authors.filter(
                            models.Q(user=author_u) |
                            models.Q(first_name__iexact=author_u.first_name, last_name__iexact=author_u.last_name)
                        ).first()
                        if ba and not ba.user:
                            ba.user = author_u
                            ba.save(update_fields=['user'])
                        AuthorRight.objects.get_or_create(
                            ouvrage=ouvrage,
                            user=author_u,
                            defaults={
                                'author': ba,
                                'role': 'auteur_principal',
                                'pool_share_percent': 100.0,
                            }
                        )

                # 3. Depuis BookAuthor
                for ba in ouvrage.authors.all():
                    if not ba.user and (ba.first_name or ba.last_name):
                        matched_u = User.objects.filter(role='author', first_name__iexact=ba.first_name, last_name__iexact=ba.last_name).first()
                        if matched_u:
                            ba.user = matched_u
                            ba.save(update_fields=['user'])
                    if ba.user:
                        AuthorRight.objects.get_or_create(
                            ouvrage=ouvrage,
                            user=ba.user,
                            defaults={
                                'author': ba,
                                'role': 'auteur_principal',
                                'pool_share_percent': 100.0,
                            }
                        )

                author_rights = AuthorRight.objects.filter(ouvrage=ouvrage, user__isnull=False)

            from apps.rights.models import RepartitionDroits, AuthorRight

            repartition = RepartitionDroits.objects.filter(ouvrage=ouvrage).first()
            author_right = AuthorRight.objects.filter(ouvrage=ouvrage, user__isnull=False).first()

            if not author_right or not author_right.user:
                continue

            taux_papier = Decimal(str(repartition.taux_papier)) / Decimal("100") if (repartition and repartition.taux_papier is not None) else Decimal("0.05")
            taux_numerique = Decimal(str(repartition.taux_numerique)) / Decimal("100") if (repartition and repartition.taux_numerique is not None) else Decimal("0.05")
            taux_audio = Decimal(str(repartition.taux_audio_tts)) / Decimal("100") if (repartition and repartition.taux_audio_tts is not None) else Decimal("0.05")

            ventes_fmt = ventes_par_format.get(ouvrage.id, {'digital': Decimal('0.00'), 'paper': Decimal('0.00'), 'audio': Decimal('0.00')})

            author_pool = (
                (ventes_fmt['paper'] * taux_papier) +
                (ventes_fmt['digital'] * taux_numerique) +
                (ventes_fmt['audio'] * taux_audio)
            ).quantize(Decimal("0.01"))

            if author_pool <= 0:
                continue

            payout_line, created = RoyaltyPayoutLine.objects.update_or_create(
                calculation=calculation,
                author_right=author_right,
                defaults={"payout_amount": author_pool}
            )
            if created:
                total_payout_lines_created += 1
            else:
                total_payout_lines_corrected += 1

    return {
        "periods": processed_periods,
        "calculations_created": total_calculations_created,
        "payout_lines_created": total_payout_lines_created,
        "payout_lines_corrected": total_payout_lines_corrected,
        "university_statements_created": total_university_statements_created,
    }


def check_and_generate_stock_notifications(user=None, force_email=False):
    """
    Vérifie les stocks en alerte (rupture critique ou seuil bas) et notifie automatiquement
    les administrateurs et gestionnaires via notifications in-app et emails immédiats.
    """
    from apps.commerce.models import StockOuvrage
    from apps.accounts.models import User
    from apps.reporting.models import Notification
    from apps.reporting.services import notify_user
    from django.utils import timezone
    from django.core.mail import send_mail
    from django.conf import settings

    stocks = StockOuvrage.objects.select_related('ouvrage', 'entrepot').all()
    alert_stocks = [s for s in stocks if s.quantite_disponible <= s.seuil_alerte]

    if not alert_stocks:
        return {"alerts_sent": 0, "articles_en_alerte": 0}

    recipients = [user] if user else list(User.objects.filter(role__in=['manager', 'admin', 'super_admin'], is_active=True))
    if not recipients:
        return {"alerts_sent": 0, "warning": "Aucun gestionnaire/admin actif trouvé."}

    today = timezone.now().strftime('%Y-%m-%d')
    sent = 0

    for stock in alert_stocks:
        is_rupture = (stock.quantite_disponible == 0)
        statut_label = "Rupture de stock critique" if is_rupture else "Alerte seuil de stock bas"
        res_id = f"stock_alert_{stock.id}_{'rupture' if is_rupture else 'low'}_{today}"

        title = f"{statut_label} : {stock.ouvrage.title}"
        message = (
            f"L'ouvrage « {stock.ouvrage.title} » (ISBN : {stock.ouvrage.isbn or 'N/A'}) "
            f"est à {stock.quantite_disponible} exemplaire(s) disponible(s) à l'entrepôt {stock.entrepot.nom} "
            f"(seuil d'alerte configuré : {stock.seuil_alerte} ex.). "
            f"Une intervention rapide de réassort est recommandée."
        )

        # 1. Envoi / création des notifications In-App
        email_destinataires = []
        for r in recipients:
            if not Notification.objects.filter(user=r, resource_id=res_id).exists():
                try:
                    notify_user(
                        user=r,
                        notification_type=Notification.NotificationType.SYSTEM,
                        title=title,
                        message=message,
                        action_url="/manager/stock/alerts",
                        resource_id=res_id,
                    )
                    sent += 1
                    if r.email and r.role in ['admin', 'super_admin']:
                        email_destinataires.append(r.email)
                except Exception as exc:
                    logger.warning(f"Erreur notification user {r.id}: {exc}")

        # 2. Envoi d'un email dédié si de nouveaux administrateurs sont concernés
        if email_destinataires:
            email_subject = f"[LAHAThèque Alerte Logistique] {statut_label} : {stock.ouvrage.title}"
            email_body = (
                f"Bonjour,\n\n"
                f"Ceci est une alerte logistique automatique de la plateforme LAHAThèque.\n\n"
                f"Statut : {statut_label.upper()}\n"
                f"Ouvrage : {stock.ouvrage.title}\n"
                f"ISBN : {stock.ouvrage.isbn or 'N/A'}\n"
                f"Entrepôt : {stock.entrepot.nom} ({stock.entrepot.ville}, {stock.entrepot.pays})\n"
                f"Quantité restante disponible : {stock.quantite_disponible} exemplaire(s)\n"
                f"Seuil d'alerte configuré : {stock.seuil_alerte} exemplaire(s)\n\n"
                f"Pour consulter les détails et valider un réassort express, connectez-vous au tableau de bord logistique :\n"
                f"{getattr(settings, 'FRONTEND_URL', 'https://lahatheque.com')}/manager/stock/alerts\n\n"
                f"Cordialement,\n"
                f"Système Logistique LAHAThèque"
            )
            sender = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Lahatheque <lahaeditions1@gmail.com>')
            try:
                from apps.communications.services.email_service import EmailService
                EmailService.send(
                    email_type="stock_alert",
                    to_email=list(set(email_destinataires)),
                    subject=email_subject,
                    template_name="emails/admin/custom_message.html",
                    context={
                        "body_text": email_body,
                        "message_body": email_body,
                        "custom_subject": email_subject,
                    },
                    from_email=sender,
                )
            except Exception as mail_err:
                logger.warning(f"Erreur envoi email alerte stock: {mail_err}")

    return {"alerts_sent": sent, "articles_en_alerte": len(alert_stocks)}


@shared_task
def task_check_stock_alerts():
    """
    Vérifie les stocks sous le seuil d'alerte et notifie Gestionnaires + Administrateurs.
    Exécutée périodiquement (toutes les 6h).
    """
    return check_and_generate_stock_notifications()


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
    from django.db.models import Q, Count, Sum as DjangoSum
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

    from apps.catalog.models import Ouvrage

    for offering_id in shared_offering_ids:
        # Résoudre le BouquetOffering pour accéder à get_books_queryset
        offering = BouquetOffering.objects.filter(id=offering_id).first()
        if not offering:
            continue

        subs = UniversityBouquetSubscription.objects.filter(
            offering_id=offering_id, status="active"
        ).select_related("institution")

        total_pool = sum(float(s.annual_price) for s in subs) / 12

        if total_pool <= 0:
            continue

        usage_by_institution = {}
        total_usage = 0

        for sub in subs:
            bouquet_books = offering.get_books_queryset(
                requesting_institution=sub.institution
            ) if offering else Ouvrage.objects.none()

            # 1. Lectures numériques étudiantes qualifiées : durée >= 30s et au moins 3 pages (anti-rebond COUNTER)
            from apps.student.models import ReadingSession as StudentReadingSession
            qualified_readings = StudentReadingSession.objects.filter(
                Q(user__affiliations__institution=sub.institution) |
                Q(ouvrage__institution=sub.institution),
                ouvrage__in=bouquet_books,
                duration_seconds__gte=30,
                pages_read__gte=3,
                session_date__gte=period_start.date(),
                session_date__lte=period_end.date(),
            ).count()

            # 2. Lectures partenaires SaaS via ReaderSession (API Lecteur Hébergé) : durée >= 30s et >= 3 pages
            from apps.reader.models import ReaderSession
            qualified_partner_readings = ReaderSession.objects.filter(
                Q(partner__linked_institution=sub.institution) |
                Q(ouvrage__institution=sub.institution),
                ouvrage__in=bouquet_books,
                reading_time_seconds__gte=30,
                last_page__gte=3,
                created_at__date__gte=period_start.date(),
                created_at__date__lte=period_end.date(),
            ).count()

            # 3. Écoutes audio qualifiées : >= 10% du livre complet ou chapitre terminé (>= 90%)
            from apps.audio.models import AudioListeningSession
            qualified_audio = 0
            try:
                qualified_audio = AudioListeningSession.objects.filter(
                    Q(user__affiliations__institution=sub.institution) |
                    Q(institution=sub.institution) |
                    Q(ouvrage__institution=sub.institution),
                    ouvrage__in=bouquet_books,
                    session_date__gte=period_start.date(),
                    session_date__lte=period_end.date(),
                ).filter(
                    Q(audio_track__track_type='full', completion_percent__gte=10.0) |
                    Q(audio_track__track_type='chapter', completion_percent__gte=90.0) |
                    Q(completion_percent__gte=10.0)
                ).count()
            except Exception:
                pass

            # Note : Les téléchargements sont exclus du calcul d'usage du streaming bouquet
            institution_usage = qualified_readings + qualified_partner_readings + qualified_audio
            usage_by_institution[sub.institution_id] = institution_usage
            total_usage += institution_usage

        if total_usage == 0:
            # ZÉRO MOCK, ZÉRO SIMULATION : aucune lecture qualifiée enregistrée pour cette période
            continue

        for sub in subs:
            part_utilisation = usage_by_institution.get(sub.institution_id, 0) / total_usage
            ca_institution = total_pool * part_utilisation
            from apps.reporting.pricing_service import get_institution_royalty_rate
            taux = get_institution_royalty_rate(sub.institution)
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


def send_bouquet_subscription_emails(subscription_id: str):
    """
    Envoie les emails transactionnels officiels lors de l'activation d'un bouquet :
    1. À l'établissement / client avec détails, date d'échéance et facture PDF acquittée en pièce jointe.
    2. À l'administrateur de LAHAThèque avec référence Moneroo, formule et échéance.
    """
    from apps.partners.models import UniversityBouquetSubscription
    from apps.commerce.models import ClientBouquetSubscription
    from apps.communications.services.email_service import send_transactional_email
    from apps.accounts.models import User
    from django.conf import settings
    from django.utils import timezone

    univ_sub = UniversityBouquetSubscription.objects.filter(id=subscription_id).select_related('institution', 'institution__user').first()
    client_sub = None
    if not univ_sub:
        client_sub = ClientBouquetSubscription.objects.filter(id=subscription_id).select_related('user').first()

    if not univ_sub and not client_sub:
        logger.warning(f"[EMAIL BOUQUET] Aucune souscription trouvée pour ID {subscription_id}")
        return

    sub = univ_sub or client_sub
    is_univ = bool(univ_sub)
    institution = getattr(univ_sub, 'institution', None)
    user = institution.user if (institution and institution.user) else getattr(client_sub, 'user', None)

    recipient_email = (
        (user.email if user else None)
        or (institution.contact_email if institution else None)
    )
    recipient_name = (
        institution.name if institution
        else (f"{user.first_name} {user.last_name}".strip() or user.email if user else "Abonné")
    )
    period = getattr(sub, 'subscription_period', 'annual')
    period_label = "Formule Mensuelle (30 jours)" if period == "monthly" else "Formule Annuelle (365 jours)"
    invoice_number = f"FAC-BOUQ-{str(sub.id)[:8].upper()}"
    date_str = sub.created_at.strftime("%d/%m/%Y") if hasattr(sub, 'created_at') and sub.created_at else timezone.now().strftime("%d/%m/%Y")
    end_date_str = sub.end_date.strftime("%d/%m/%Y") if sub.end_date else "Indéterminée"
    amount = float(getattr(sub, 'price_paid', None) or getattr(sub, 'annual_price', 0.0) or 0.0)
    currency = getattr(sub, 'currency', 'XOF') or 'XOF'
    if currency == "XOF":
        currency = "FCFA"

    tx_ref = ""
    if sub.payment_transaction:
        tx_ref = sub.payment_transaction.moneroo_id or str(sub.payment_transaction.id)[:8]

    # Génération de la facture PDF acquittée (aligné sur le flux officiel des achats d'ouvrages)
    customer_addr = getattr(institution, 'address', None) or "Cotonou, Bénin"
    pdf_invoice_data = {
        "order_number": invoice_number,
        "customer_name": recipient_name,
        "customer_email": recipient_email or "",
        "customer_address": customer_addr,
        "date": date_str,
        "items": [
            {
                "title": f"Abonnement Bouquet Documentaire « {sub.title} » ({period_label})",
                "quantity": 1,
                "unit_price": amount,
                "total": amount,
            }
        ],
        "total_amount": amount,
        "currency": currency,
        "payment_method": "Moneroo Mobile Money",
        "is_paid": True,
    }

    # 1. Envoi au client ou à l'université avec facture PDF jointe
    if recipient_email:
        context_client = {
            "recipient_name": recipient_name,
            "bouquet_title": sub.title,
            "period_label": period_label,
            "end_date": end_date_str,
            "amount": f"{amount:,.0f} {currency}".replace(",", " "),
            "invoice_number": invoice_number,
            "site_url": getattr(settings, 'FRONTEND_URL', 'https://lahatheque.com'),
        }
        try:
            send_transactional_email(
                email_type="bouquet_subscription_confirmed",
                to_email=recipient_email,
                subject=f"Confirmation d'abonnement Bouquet • {sub.title} • Facture Acquittée",
                template_name="emails/orders/bouquet_confirmation.html",
                context=context_client,
                recipient_name=recipient_name,
                pdf_invoice_data=pdf_invoice_data,
                async_send=True
            )
            logger.info(f"[EMAIL BOUQUET] Email avec facture PDF envoyé à {recipient_email}")
        except Exception as mail_err:
            logger.error(f"[EMAIL BOUQUET] Erreur envoi email client {recipient_email}: {mail_err}")

    # 2. Notification administrateur avec facture PDF jointe
    try:
        admin_emails = list(
            User.objects.filter(role__in=['admin', 'super_admin'], is_active=True)
            .exclude(email='')
            .values_list('email', flat=True)
        )
        official_admin = getattr(settings, 'ADMIN_NOTIFICATION_EMAIL', 'lahaeditions1@gmail.com')
        if official_admin and official_admin not in admin_emails:
            admin_emails.append(official_admin)

        context_admin = {
            "institution_name": recipient_name,
            "bouquet_title": sub.title,
            "period_label": period_label,
            "end_date": end_date_str,
            "amount": f"{amount:,.0f} {currency}".replace(",", " "),
            "payment_ref": tx_ref or "Moneroo",
            "invoice_number": invoice_number,
        }
        for a_email in set(admin_emails):
            send_transactional_email(
                email_type="admin_bouquet_subscription_alert",
                to_email=str(a_email),
                subject=f"[ADMIN LAHAThèque] Nouvelle souscription bouquet : {sub.title} ({recipient_name})",
                template_name="emails/orders/admin_bouquet_alert.html",
                context=context_admin,
                recipient_name="Administration LAHA",
                pdf_invoice_data=pdf_invoice_data,
                async_send=True
            )
    except Exception as adm_err:
        logger.error(f"[EMAIL BOUQUET] Erreur notification admin: {adm_err}")


@shared_task
def check_bouquet_subscriptions_and_remind():
    """
    Tâche quotidienne Celery :
    1. Relance préventive par email :
       - J-7 pour les formules annuelles (décision Q4)
       - J-3 pour les formules mensuelles (décision Q4)
       avec lien direct de renouvellement.
    2. Expiration automatique :
       - Passage à status='expired' des souscriptions dont end_date < aujourd'hui
       et coupure granulaire des accès.
    """
    from apps.partners.models import UniversityBouquetSubscription
    from apps.commerce.models import ClientBouquetSubscription
    from apps.communications.services.email_service import send_transactional_email
    from django.conf import settings
    from django.utils import timezone

    today = timezone.now().date()
    results = {"reminders_sent": 0, "expired_count": 0}

    # 1. Universités
    univ_subs = UniversityBouquetSubscription.objects.filter(status='active').select_related('institution', 'institution__user')
    for sub in univ_subs:
        if not sub.end_date:
            continue

        days_remaining = (sub.end_date - today).days

        # Expiration échue
        if days_remaining < 0:
            sub.status = 'expired'
            sub.save(update_fields=['status'])
            results["expired_count"] += 1
            logger.info(f"[BOUQUET EXPIRY] Bouquet univ {sub.id} ({sub.institution.name}) marqué expiré.")
            continue

        # Relance préventive (J-7 annuel ou J-3 mensuel)
        is_annual_reminder = (sub.subscription_period == 'annual' and days_remaining == 7)
        is_monthly_reminder = (sub.subscription_period == 'monthly' and days_remaining == 3)

        if is_annual_reminder or is_monthly_reminder:
            recip_email = (
                (sub.institution.user.email if sub.institution.user else None)
                or sub.institution.contact_email
            )
            if recip_email:
                frontend_url = getattr(settings, 'FRONTEND_URL', 'https://lahatheque.com')
                renew_url = f"{frontend_url}/university/bouquets"
                try:
                    send_transactional_email(
                        email_type="bouquet_expiration_warning",
                        to_email=recip_email,
                        subject=f"Rappel d'échéance : Votre accès au bouquet « {sub.title} » expire dans {days_remaining} jours",
                        template_name="emails/admin/custom_message.html",
                        context={
                            "recipient_name": sub.institution.name,
                            "subject": f"Expiration imminente du bouquet « {sub.title} »",
                            "message_content": (
                                f"Nous vous informons que la licence de votre établissement pour le bouquet "
                                f"« {sub.title} » arrivera à échéance le {sub.end_date.strftime('%d/%m/%Y')} (dans {days_remaining} jours).\n\n"
                                f"Afin de maintenir sans interruption la continuité des lectures et l'accès API pour vos étudiants, "
                                f"nous vous invitons à renouveler votre abonnement dès maintenant."
                            ),
                            "action_label": "Renouveler le Bouquet",
                            "action_url": renew_url,
                        },
                        recipient_name=sub.institution.name,
                        async_send=True
                    )
                    results["reminders_sent"] += 1
                    logger.info(f"[BOUQUET REMINDER] Relance J-{days_remaining} envoyée à {recip_email} pour bouquet {sub.id}")
                except Exception as mail_err:
                    logger.error(f"[BOUQUET REMINDER] Erreur envoi relance {recip_email}: {mail_err}")

    # 2. Clients Individuels (B2C)
    client_subs = ClientBouquetSubscription.objects.filter(status='active').select_related('user')
    for csub in client_subs:
        if not csub.end_date:
            continue

        days_remaining = (csub.end_date - today).days

        if days_remaining < 0:
            csub.status = 'expired'
            csub.save(update_fields=['status'])
            results["expired_count"] += 1
            logger.info(f"[BOUQUET EXPIRY] Bouquet client {csub.id} marqué expiré.")
            continue

        is_annual_reminder = (csub.subscription_period == 'annual' and days_remaining == 7)
        is_monthly_reminder = (csub.subscription_period == 'monthly' and days_remaining == 3)

        if (is_annual_reminder or is_monthly_reminder) and csub.user and csub.user.email:
            frontend_url = getattr(settings, 'FRONTEND_URL', 'https://lahatheque.com')
            renew_url = f"{frontend_url}/student/bouquets"
            try:
                send_transactional_email(
                    email_type="bouquet_expiration_warning",
                    to_email=csub.user.email,
                    subject=f"Rappel : Votre bouquet « {csub.title} » expire dans {days_remaining} jours",
                    template_name="emails/admin/custom_message.html",
                    context={
                        "recipient_name": f"{csub.user.first_name} {csub.user.last_name}".strip() or csub.user.email,
                        "subject": f"Expiration imminente de votre bouquet « {csub.title} »",
                        "message_content": (
                            f"Votre accès au bouquet « {csub.title} » arrive à expiration le "
                            f"{csub.end_date.strftime('%d/%m/%Y')} (dans {days_remaining} jours).\n\n"
                            f"Renouvelez votre abonnement dès maintenant pour conserver vos lectures."
                        ),
                        "action_label": "Renouveler mon Bouquet",
                        "action_url": renew_url,
                    },
                    recipient_name=csub.user.email,
                    async_send=True
                )
                results["reminders_sent"] += 1
                logger.info(f"[BOUQUET REMINDER] Relance J-{days_remaining} envoyée au client {csub.user.email}")
            except Exception as mail_err:
                logger.error(f"[BOUQUET REMINDER] Erreur relance client {csub.user.email}: {mail_err}")

    return results



