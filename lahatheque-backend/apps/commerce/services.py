import logging
from django.db import transaction
from django.utils import timezone

logger = logging.getLogger(__name__)


def _unlock_order_content(commande):
    """
    Logique commune de déverrouillage — INDÉPENDANTE du statut de paiement.
    NE MODIFIE JAMAIS statut_paiement — cette responsabilité reste à l'appelant.
    """
    from .models import LigneCommande, StockOuvrage, MouvementStock
    from apps.student.models import ReadingProgress

    lignes = LigneCommande.objects.filter(commande=commande).select_related('ouvrage')

    for ligne in lignes:
        ouvrage = ligne.ouvrage

        if ligne.format_type in ('digital', 'pdf', 'epub'):
            ReadingProgress.objects.get_or_create(
                user=commande.user,
                ouvrage=ouvrage,
                defaults={
                    'progress_percent': 0,
                    'current_page': 1,
                    'total_pages': ouvrage.page_count or 0,
                }
            )
            logger.info(f"[Commerce] Accès numérique déverrouillé: {ouvrage.title} pour {commande.user.email}")

        elif ligne.format_type == 'audio':
            ReadingProgress.objects.get_or_create(
                user=commande.user,
                ouvrage=ouvrage,
                defaults={
                    'progress_percent': 0,
                    'current_page': 0,
                    'total_pages': 0,
                }
            )
            logger.info(f"[Commerce] Accès audio déverrouillé: {ouvrage.title} pour {commande.user.email}")

        elif ligne.format_type in ('paper', 'papier'):
            from django.db.models import F

            remaining_to_release = ligne.quantity
            stocks_with_reservation = list(
                StockOuvrage.objects.select_for_update()
                .filter(ouvrage=ouvrage, quantite_reservee__gt=0)
            )

            for stock in stocks_with_reservation:
                if remaining_to_release <= 0:
                    break
                release_here = min(stock.quantite_reservee, remaining_to_release)
                if release_here <= 0:
                    continue

                stock.quantite_reelle = F('quantite_reelle') - release_here
                stock.quantite_reservee = F('quantite_reservee') - release_here
                stock.save(update_fields=['quantite_reelle', 'quantite_reservee'])

                MouvementStock.objects.create(
                    stock=stock,
                    type_mouvement='sale',
                    quantite=release_here,
                    reference_document=f"Commande #{commande.id}",
                    motif="Vente confirmée" if commande.statut_paiement == 'paid' else "Sortie sur achat à crédit",
                    auteur=commande.user,
                )
                logger.info(f"[Commerce] Stock décrémenté et réservation libérée: -{release_here} pour {ouvrage.title}")
                remaining_to_release -= release_here

            if remaining_to_release > 0:
                fallback_stock = StockOuvrage.objects.filter(
                    ouvrage=ouvrage, quantite_reelle__gte=remaining_to_release
                ).select_for_update().first()
                if fallback_stock:
                    fallback_stock.quantite_reelle = F('quantite_reelle') - remaining_to_release
                    fallback_stock.save(update_fields=['quantite_reelle'])
                    MouvementStock.objects.create(
                        stock=fallback_stock,
                        type_mouvement='sale',
                        quantite=remaining_to_release,
                        reference_document=f"Commande #{commande.id}",
                        motif="Vente confirmée (repli — aucune réservation trouvée)",
                        auteur=commande.user,
                    )
                    logger.warning(
                        f"[Commerce] Aucune réservation StockOuvrage trouvée pour la commande "
                        f"{commande.id} / {ouvrage.title} — décrémentation directe en repli."
                    )
                else:
                    logger.warning(f"[Commerce] Stock insuffisant pour {ouvrage.title} (quantité demandée: {ligne.quantity})")


def notify_admin_order_event(commande, event_type: str = "order_created", extra_context: dict | None = None):
    """
    Notifie systématiquement la direction et les administrateurs pour chaque commande (créée, payée, à crédit, etc.).
    Envoi d'un e-mail récapitulatif ultra-détaillé à l'adresse officielle lahaeditions1@gmail.com et aux comptes admin.
    """
    from apps.communications.services.email_service import send_transactional_email
    from apps.accounts.models import User
    from .models import LigneCommande, PhysicalDelivery
    from django.conf import settings

    try:
        # Récupération des destinataires administrateurs
        admin_emails = list(
            User.objects.filter(role__in=['admin', 'super_admin'], is_active=True)
            .exclude(email='')
            .values_list('email', flat=True)
        )
        official_admin = getattr(settings, 'ADMIN_NOTIFICATION_EMAIL', 'lahaeditions1@gmail.com')
        if official_admin and official_admin not in admin_emails:
            admin_emails.append(official_admin)

        if not admin_emails:
            admin_emails = ['lahaeditions1@gmail.com']

        order_num = str(getattr(commande, 'numero_commande', '') or str(commande.id)[:8].upper())
        user = commande.user
        customer_name = (
            f"{user.first_name or ''} {user.last_name or ''}".strip() or str(user.email)
            if user else str(getattr(commande, 'guest_name', 'Client Comptoir') or 'Client')
        )
        customer_email = str(user.email if user else getattr(commande, 'guest_email', 'Non renseigné'))
        customer_phone = str(getattr(user, 'phone', None) or getattr(user, 'phone_number', None) or getattr(commande, 'guest_phone', '') or '')
        customer_role = str(getattr(user, 'role', 'Client')).capitalize() if user else "Client Boutique"
        customer_inst = str(getattr(user, 'university_affiliation', '') or (getattr(user, 'institution', None).name if getattr(user, 'institution', None) else ''))

        # Lignes d'articles
        lignes = LigneCommande.objects.filter(commande=commande).select_related('ouvrage')
        items_list = []
        has_physical = False
        format_map = {
            'digital': 'Numérique (EPUB/PDF)',
            'pdf': 'Numérique (PDF)',
            'epub': 'Numérique (EPUB)',
            'paper': 'Exemplaire Papier',
            'papier': 'Exemplaire Papier',
            'audio': 'Livre Audio (Streaming)',
        }
        for l in lignes:
            if l.format_type in ('paper', 'papier'):
                has_physical = True
            items_list.append({
                "title": l.ouvrage.title if l.ouvrage else "Ouvrage LAHAThèque",
                "format_label": format_map.get(l.format_type, l.format_type),
                "quantity": l.quantity,
                "unit_price": float(l.unit_price or 0.0),
                "total": float(getattr(l, 'total_price', None) or (l.quantity * (l.unit_price or 0))),
            })

        # Données de livraison si commande physique
        shipping_addr = ""
        city = ""
        country = "Bénin"
        delivery = PhysicalDelivery.objects.filter(commande=commande).first()
        if delivery:
            shipping_addr = delivery.shipping_address
            city = delivery.city
            country = delivery.country

        total_amt = float(getattr(commande, 'total_ttc', 0.0) or getattr(commande, 'total_amount', 0.0) or 0.0)
        curr_code = getattr(commande.currency, 'code', None) or str(getattr(commande, 'currency', 'FCFA') or 'FCFA')
        if curr_code == "XOF":
            curr_code = "FCFA"

        is_paid = (commande.statut_paiement == 'paid')
        status_paiement_display = dict(commande.PAYMENT_STATUS_CHOICES).get(commande.statut_paiement, commande.statut_paiement)
        status_commande_display = dict(commande.ORDER_STATUS_CHOICES).get(commande.statut_commande, commande.statut_commande)
        mode_paiement_display = dict(commande.PAYMENT_METHOD_CHOICES).get(commande.mode_paiement, commande.mode_paiement)

        if event_type == "payment_success":
            badge_label = "Paiement Encaissé • Validé"
            event_title = f"Paiement Confirmé pour la Commande #{order_num}"
            intro_msg = f"Le paiement de la commande #{order_num} a été encaissé avec succès via {mode_paiement_display}."
        elif event_type == "credit_granted":
            badge_label = "Vente à Crédit • Dépôt Validé"
            event_title = f"Nouvelle Commande à Crédit #{order_num}"
            due_date = commande.credit_due_date.strftime('%d/%m/%Y') if getattr(commande, 'credit_due_date', None) else "Non définie"
            intro_msg = f"Une commande à crédit (#{order_num}) a été accordée au client. Échéance de règlement fixée au {due_date}."
        elif event_type == "manual_confirmed":
            badge_label = "Règlement Manuel Validé"
            event_title = f"Règlement Encaissé pour la Commande #{order_num}"
            intro_msg = f"Le paiement manuel de la commande #{order_num} a été certifié par l'administrateur."
        elif event_type == "payment_failed":
            badge_label = "Échec de Paiement"
            event_title = f"Échec de Paiement sur la Commande #{order_num}"
            intro_msg = f"La tentative de paiement pour la commande #{order_num} a échoué auprès de l'opérateur."
        else:
            badge_label = "Nouvelle Commande Enregistrée"
            event_title = f"Nouvelle Commande #{order_num} ({status_paiement_display})"
            intro_msg = f"Une nouvelle commande (#{order_num}) vient d'être enregistrée sur la plateforme (Statut paiement : {status_paiement_display})."

        order_date_str = commande.created_at.strftime("%d/%m/%Y à %H:%M") if hasattr(commande, 'created_at') and commande.created_at else timezone.now().strftime("%d/%m/%Y à %H:%M")

        context = {
            "order_number": order_num,
            "order_date": order_date_str,
            "badge_label": badge_label,
            "event_title": event_title,
            "intro_message": intro_msg,
            "is_paid": is_paid,
            "status_paiement_label": status_paiement_display,
            "status_commande_label": status_commande_display,
            "payment_method_label": mode_paiement_display,
            "payment_reference": getattr(commande, 'manual_payment_reference', '') or getattr(getattr(commande, 'payment_transaction', None), 'moneroo_id', ''),
            "customer_name": customer_name,
            "customer_email": customer_email,
            "customer_phone": customer_phone,
            "customer_role": customer_role,
            "customer_institution": customer_inst,
            "items": items_list,
            "total_amount": f"{total_amt:,.0f}".replace(",", " "),
            "currency": curr_code,
            "has_physical": has_physical,
            "shipping_address": shipping_addr,
            "city": city,
            "country": country,
            "site_url": getattr(settings, 'FRONTEND_URL', 'https://lahatheque.com') or 'https://lahatheque.com',
        }
        if extra_context:
            context.update(extra_context)

        for admin_email in set(admin_emails):
            send_transactional_email(
                email_type="admin_order_notification",
                to_email=str(admin_email),
                subject=f"[ADMIN LAHAThèque] {event_title}",
                template_name="emails/orders/admin_order_notification.html",
                context=context,
                recipient_name="Direction & Administration LAHA",
                async_send=True,
            )
        logger.info(f"[Commerce] Notification email administrateur déclenchée pour commande {order_num} vers {admin_emails}")
    except Exception as notify_err:
        logger.error(f"[Commerce] Erreur notification admin pour commande {commande.id}: {notify_err}", exc_info=True)


def _notify_order_finalized(commande, context_label):
    from apps.reporting.services import notify_user
    from apps.reporting.models import Notification
    from apps.communications.services.email_service import send_transactional_email
    from .models import LigneCommande
    from django.conf import settings

    # 1. Notification in-app interne (mentionne la validité 12 mois pour le numérique)
    try:
        notify_user(
            user=commande.user,
            notification_type=Notification.NotificationType.PAYMENT_SUCCESS if hasattr(Notification.NotificationType, 'PAYMENT_SUCCESS') else Notification.NotificationType.SYSTEM,
            title="Paiement confirmé" if commande.statut_paiement == 'paid' else "Commande à crédit activée",
            message=(
                f"Votre commande #{str(commande.id)[:8]} ({context_label}) a été traitée avec succès. "
                f"Vos ouvrages numériques sont accessibles dans votre bibliothèque pour une durée de 12 mois."
            ),
            action_url="/student/books",
            resource_id=str(commande.id),
        )
    except Exception as e:
        logger.warning(f"[Commerce] Erreur notification in-app: {e}")

    # 2. Envoi d'email transactionnel officiel avec Facture PDF jointe (Client)
    try:
        if commande.user and commande.user.email:
            lignes = LigneCommande.objects.filter(commande=commande).select_related('ouvrage')
            items_list = []
            has_physical = False
            for l in lignes:
                if l.format_type in ('paper', 'papier'):
                    has_physical = True
                items_list.append({
                    "title": l.ouvrage.title if l.ouvrage else "Ouvrage LAHAThèque",
                    "quantity": l.quantity,
                    "unit_price": float(l.unit_price or 0.0),
                    "total": float(getattr(l, 'total_price', None) or (l.quantity * (l.unit_price or 0))),
                })

            order_num = str(getattr(commande, 'numero_commande', '') or str(commande.id)[:8])
            full_name = f"{commande.user.first_name or ''} {commande.user.last_name or ''}".strip() or str(commande.user.email)
            total_amt = float(getattr(commande, 'total_ttc', 0.0) or getattr(commande, 'total_amount', 0.0) or 0.0)

            curr_code = getattr(commande.currency, 'code', None) or str(getattr(commande, 'currency', 'FCFA') or 'FCFA')
            if curr_code == "XOF":
                curr_code = "FCFA"

            pdf_invoice_data = {
                "order_number": order_num,
                "customer_name": full_name,
                "customer_email": str(commande.user.email),
                "customer_address": getattr(commande, 'shipping_address', 'Cotonou, Bénin') or 'Cotonou, Bénin',
                "date": commande.created_at.strftime("%d/%m/%Y") if hasattr(commande, 'created_at') and commande.created_at else timezone.now().strftime("%d/%m/%Y"),
                "items": items_list,
                "total_amount": total_amt,
                "currency": curr_code,
                "payment_method": context_label,
                "is_paid": (commande.statut_paiement == 'paid'),
            }

            send_transactional_email(
                email_type="order_confirmation_client",
                to_email=str(commande.user.email),
                subject=f"Confirmation de commande #{order_num} • Facture Acquittée",
                template_name="emails/orders/confirmation_client.html",
                context={
                    "recipient_name": full_name,
                    "order_number": order_num,
                    "order_date": pdf_invoice_data["date"],
                    "items": items_list,
                    "total_amount": f"{total_amt:,.0f}".replace(",", " "),
                    "currency": pdf_invoice_data["currency"],
                    "is_physical": has_physical,
                    "site_url": getattr(settings, 'FRONTEND_URL', 'https://lahatheque.com') or 'https://lahatheque.com',
                },
                recipient_name=full_name,
                pdf_invoice_data=pdf_invoice_data,
                async_send=True,
            )
            logger.info(f"[Commerce] Email de confirmation avec facture PDF déclenché pour commande {order_num} vers {commande.user.email}")
    except Exception as mail_err:
        logger.error(f"[Commerce] Erreur envoi email facture pour commande {commande.id}: {mail_err}")

    # 3. Notification systématique de la Direction / Administration LAHA
    try:
        event = "payment_success" if commande.statut_paiement == 'paid' else "credit_granted"
        notify_admin_order_event(commande, event_type=event)
    except Exception as admin_mail_err:
        logger.error(f"[Commerce] Erreur envoi notification admin pour commande {commande.id}: {admin_mail_err}")



def handle_payment_success(payment_tx):
    """Point d'entrée webhook Moneroo ou réconciliation API — paiement réellement encaissé."""
    from .models import Order

    logger.info(f"[Commerce] Traitement paiement réussi pour transaction {payment_tx.id}")

    commande = None
    with transaction.atomic():
        try:
            commande = Order.objects.select_for_update().get(payment_transaction=payment_tx)
        except Order.DoesNotExist:
            logger.error(f"[Commerce] Aucune commande trouvée pour la transaction {payment_tx.id}")
            return
        except Order.MultipleObjectsReturned:
            commande = Order.objects.filter(payment_transaction=payment_tx).first()

        if commande.statut_paiement == 'paid':
            logger.info(f"[Commerce] Commande {commande.id} déjà payée. Ignoré.")
            return

        commande.statut_paiement = 'paid'
        commande.statut_commande = 'completed'
        commande.save(update_fields=['statut_paiement', 'statut_commande'])
        _unlock_order_content(commande)

    if commande:
        _notify_order_finalized(commande, "Moneroo")
        logger.info(f"[Commerce] Commande {commande.id} finalisée avec succès.")


def reconcile_moneroo_payment(moneroo_id: str | None = None, order_id: str | None = None, user=None):
    """
    Vérifie et réconcilie une transaction directement via l'API Moneroo.
    Met à jour PaymentTransaction, Order, déverrouille l'ouvrage dans ReadingProgress,
    et notifie l'utilisateur.
    """
    from .models import Order, PaymentTransaction
    from .moneroo_client import client

    tx = None
    order = None

    if moneroo_id:
        tx = PaymentTransaction.objects.filter(moneroo_id=moneroo_id).first()
        if tx:
            order = Order.objects.filter(payment_transaction=tx).first()

    if not order and order_id:
        order = Order.objects.filter(id=order_id).first()
        if order and order.payment_transaction:
            tx = order.payment_transaction
            if not moneroo_id and tx.moneroo_id:
                moneroo_id = tx.moneroo_id

    if not moneroo_id and order and getattr(order, 'payment_transaction', None):
        moneroo_id = order.payment_transaction.moneroo_id

    if not moneroo_id:
        return {"success": False, "error": "Identifiant de transaction Moneroo introuvable."}

    # Si la commande est déjà marquée comme payée
    if order and order.statut_paiement == 'paid':
        return {"success": True, "status": "paid", "order_id": str(order.id), "already_paid": True}

    # Interrogation directe et sécurisée de l'API Moneroo
    try:
        moneroo_data = client.verify_transaction(moneroo_id)
    except Exception as e:
        logger.error(f"[Commerce] Erreur lors de l'appel verify_transaction Moneroo ({moneroo_id}): {e}")
        return {"success": False, "error": f"Erreur de communication avec Moneroo: {e}"}

    if not moneroo_data or not isinstance(moneroo_data, dict):
        return {"success": False, "error": "Données de paiement indisponibles auprès de Moneroo."}

    m_status = str(moneroo_data.get('status', '')).lower().strip()
    capture_data = moneroo_data.get('capture') or {}
    gateway_data = capture_data.get('gateway') if isinstance(capture_data, dict) else {}
    gateway_status = str(gateway_data.get('transaction_status', '')).lower().strip() if isinstance(gateway_data, dict) else ''

    is_success = (m_status in ('success', 'completed', 'paid', 'approved')) or (gateway_status in ('completed', 'success'))
    is_failed = (m_status in ('failed', 'cancelled', 'expired', 'rejected')) or (gateway_status in ('failed', 'cancelled', 'rejected'))

    if is_success:
        with transaction.atomic():
            if tx:
                tx.status = PaymentTransaction.Status.SUCCESS
                tx.save(update_fields=['status'])
                handle_payment_success(tx)
            elif order:
                order.statut_paiement = 'paid'
                order.statut_commande = 'completed'
                order.save(update_fields=['statut_paiement', 'statut_commande'])
                _unlock_order_content(order)
                _notify_order_finalized(order, "Moneroo")

        logger.info(f"[Commerce] Réconciliation Moneroo RÉUSSIE: {moneroo_id} -> Commande finalisée.")
        return {"success": True, "status": "paid", "order_id": str(order.id) if order else None}

    elif is_failed:
        with transaction.atomic():
            if tx:
                tx.status = PaymentTransaction.Status.FAILED
                tx.save(update_fields=['status'])
                handle_payment_failure(tx)
            elif order:
                order.statut_paiement = 'failed'
                order.save(update_fields=['statut_paiement'])

        logger.info(f"[Commerce] Réconciliation Moneroo ÉCHEC: {moneroo_id} -> Commande marquée échouée.")
        return {"success": False, "status": "failed", "order_id": str(order.id) if order else None}

    return {
        "success": True,
        "status": "pending",
        "order_id": str(order.id) if order else None,
        "message": "Paiement en attente de validation par l'opérateur Mobile Money."
    }


def confirm_manual_payment(commande, confirmed_by_user, mode_paiement=None, reference=''):
    """Confirmation manuelle (Virement, Espèces, MoMo direct, Chèque) par l'Administrateur ou le Gestionnaire."""
    if commande.statut_paiement == 'paid':
        logger.info(f"[Commerce] Commande {commande.id} déjà payée. Ignoré.")
        return

    with transaction.atomic():
        commande.statut_paiement = 'paid'
        commande.statut_commande = 'completed'
        fields_to_update = ['statut_paiement', 'statut_commande', 'manual_payment_confirmed_by']
        commande.manual_payment_confirmed_by = confirmed_by_user

        if mode_paiement:
            commande.mode_paiement = mode_paiement
            fields_to_update.append('mode_paiement')
        if reference:
            commande.manual_payment_reference = reference
            fields_to_update.append('manual_payment_reference')

        commande.save(update_fields=fields_to_update)
        _unlock_order_content(commande)

    label = commande.get_mode_paiement_display() if hasattr(commande, 'get_mode_paiement_display') else "manuel"
    _notify_order_finalized(commande, label)
    logger.info(f"[Commerce] Commande {commande.id} confirmée manuellement par {confirmed_by_user.email} (mode: {commande.mode_paiement}, ref: {reference}).")



def fulfill_credit_order(commande):
    """Débloque le contenu d'une commande à crédit — reste 'pending' en paiement."""
    with transaction.atomic():
        _unlock_order_content(commande)
        commande.statut_commande = 'processing'
        commande.save(update_fields=['statut_commande'])

    _notify_order_finalized(commande, "Achat à crédit")
    logger.info(f"[Commerce] Commande à crédit {commande.id} déverrouillée, paiement dû le {commande.credit_due_date}.")


def handle_payment_failure(payment_tx):
    """Traitement lors d'un échec de paiement."""
    from .models import Order
    from apps.reporting.services import notify_user
    from apps.reporting.models import Notification

    logger.info(f"[Commerce] Échec paiement pour transaction {payment_tx.id}")

    try:
        commande = Order.objects.get(payment_transaction=payment_tx)
        commande.statut_paiement = 'failed'
        commande.save(update_fields=['statut_paiement'])

        try:
            notify_user(
                user=commande.user,
                notification_type=Notification.NotificationType.PAYMENT_FAILED if hasattr(Notification.NotificationType, 'PAYMENT_FAILED') else Notification.NotificationType.SYSTEM,
                title="Échec de paiement",
                message=f"Le paiement pour votre commande #{str(commande.id)[:8]} a échoué. Veuillez réessayer ou contacter le support.",
                action_url="/student/orders",
            )
        except Exception:
            pass

        try:
            notify_admin_order_event(commande, event_type="payment_failed")
        except Exception as admin_err:
            logger.error(f"[Commerce] Erreur notification admin échec paiement: {admin_err}")
    except Order.DoesNotExist:
        logger.error(f"[Commerce] Aucune commande trouvée pour la transaction {payment_tx.id}")


def handle_bouquet_payment_success(payment_tx):
    """Active une souscription bouquet après confirmation de paiement Moneroo."""
    import secrets
    from django.core.cache import cache
    from apps.partners.models import UniversityBouquetSubscription, BouquetOffering
    from apps.reader.models import PartnerApp
    from apps.reader.auth_utils import generate_client_id, generate_client_secret, hash_secret

    subs = UniversityBouquetSubscription.objects.filter(
        payment_transaction=payment_tx, status='pending'
    )
    for sub in subs:
        sub.status = 'active'
        sub.save(update_fields=['status'])
        logger.info(f"[Commerce] Bouquet {sub.id} activé pour {sub.institution.name} après paiement.")

        offering = BouquetOffering.objects.filter(id=sub.offering_id).first() if sub.offering_id else None

        # Recherche ou création de l'application partenaire unique pour cette institution (Décision Q1)
        partner = PartnerApp.objects.filter(linked_institution=sub.institution).first()
        is_new = False
        raw_secret = None

        if not partner:
            is_new = True
            client_id = generate_client_id()
            raw_secret = generate_client_secret()
            secret_hash = hash_secret(raw_secret)
            last4 = raw_secret[-4:]
            wh_secret = secrets.token_hex(32)

            partner = PartnerApp.objects.create(
                name=f"LMS {sub.institution.name}",
                linked_institution=sub.institution,
                client_id=client_id,
                client_secret_hash=secret_hash,
                client_secret_last4=last4,
                webhook_secret=wh_secret,
                access_mode='catalog_only',
                quotas={'is_unlimited': True},
                is_active=True,
            )
            logger.info(f"[Commerce] Nouvelle PartnerApp créée pour {sub.institution.name}: client_id={client_id}")
        else:
            partner.is_active = True
            partner.access_mode = 'catalog_only'
            if not partner.quotas:
                partner.quotas = {'is_unlimited': True}
            partner.save(update_fields=['is_active', 'access_mode', 'quotas'])
            logger.info(f"[Commerce] PartnerApp existante réutilisée pour {sub.institution.name}: client_id={partner.client_id}")

        # Rattachement cumulatif du bouquet
        if offering:
            partner.restricted_bouquets.add(offering)

        # Stockage temporaire sécurisé en cache (TTL 15 minutes = 900s)
        cache_key = f"post_payment_credentials_{sub.id}"
        env_content = (
            f"# LAHAThèque API Credentials - {sub.institution.name}\n"
            f"LAHATHEQUE_CLIENT_ID={partner.client_id}\n"
            f"LAHATHEQUE_CLIENT_SECRET={raw_secret if is_new else '<VOTRE_SECRET_EXISTANT>'}\n"
            f"LAHATHEQUE_API_URL=https://api.lahatheque.com/api/v1\n"
        )
        cache.set(cache_key, {
            "client_id": partner.client_id,
            "client_secret": raw_secret,
            "client_secret_last4": partner.client_secret_last4,
            "institution_name": sub.institution.name,
            "subscription_id": str(sub.id),
            "offering_title": sub.title,
            "period": getattr(sub, 'subscription_period', 'annual'),
            "end_date": sub.end_date.strftime("%d/%m/%Y") if sub.end_date else None,
            "created": is_new,
            "env_content": env_content,
        }, timeout=900)

        # Envoi d'emails transactionnels (T022) si implémenté
        try:
            from apps.reporting.tasks import send_bouquet_subscription_emails
            send_bouquet_subscription_emails(str(sub.id))
        except Exception as mail_err:
            logger.warning(f"[Commerce] Notification email bouquet différée ou non configurée: {mail_err}")

        # Enregistrement comptable et validation transaction (T024)
        if payment_tx and payment_tx.status != 'success':
            payment_tx.status = 'success'
            payment_tx.save(update_fields=['status'])

    # Souscriptions client
    from apps.commerce.models import ClientBouquetSubscription
    client_subs = ClientBouquetSubscription.objects.filter(
        payment_transaction=payment_tx, status='pending'
    )
    for csub in client_subs:
        csub.status = 'active'
        csub.save(update_fields=['status'])
        logger.info(f"[Commerce] Bouquet client {csub.id} activé après paiement.")
        try:
            from apps.reporting.tasks import send_bouquet_subscription_emails
            send_bouquet_subscription_emails(str(csub.id))
        except Exception as mail_err:
            logger.warning(f"[Commerce] Notification email bouquet client différée: {mail_err}")



