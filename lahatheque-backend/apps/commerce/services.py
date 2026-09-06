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

        elif ligne.format_type in ('paper', 'papier'):
            stock = StockOuvrage.objects.filter(
                ouvrage=ouvrage,
                quantite_reelle__gte=ligne.quantity
            ).select_for_update().first()

            if stock:
                stock.quantite_reelle -= ligne.quantity
                stock.save(update_fields=['quantite_reelle'])

                MouvementStock.objects.create(
                    stock=stock,
                    type_mouvement='sale',
                    quantite=ligne.quantity,
                    reference_document=f"Commande #{commande.id}",
                    motif="Vente confirmée" if commande.statut_paiement == 'paid' else "Sortie sur achat à crédit",
                    auteur=commande.user,
                )
                logger.info(f"[Commerce] Stock décrémenté: -{ligne.quantity} pour {ouvrage.title}")
            else:
                logger.warning(f"[Commerce] Stock insuffisant pour {ouvrage.title} (quantité demandée: {ligne.quantity})")


def _notify_order_finalized(commande, context_label):
    from apps.reporting.services import notify_user
    from apps.reporting.models import Notification
    from apps.communications.services.email_service import send_transactional_email
    from .models import LigneCommande

    # 1. Notification in-app interne
    try:
        notify_user(
            user=commande.user,
            notification_type=Notification.NotificationType.PAYMENT_SUCCESS if hasattr(Notification.NotificationType, 'PAYMENT_SUCCESS') else Notification.NotificationType.SYSTEM,
            title="Paiement confirmé" if commande.statut_paiement == 'paid' else "Commande à crédit activée",
            message=(
                f"Votre commande #{str(commande.id)[:8]} ({context_label}) a été traitée avec succès. "
                f"Vos ouvrages numériques sont accessibles dans votre bibliothèque."
            ),
            action_url="/student/books",
            resource_id=str(commande.id),
        )
    except Exception as e:
        logger.warning(f"[Commerce] Erreur notification in-app: {e}")

    # 2. Envoi d'email transactionnel officiel avec Facture PDF jointe
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

            pdf_invoice_data = {
                "order_number": order_num,
                "customer_name": full_name,
                "customer_email": str(commande.user.email),
                "customer_address": getattr(commande, 'shipping_address', 'Cotonou, Bénin') or 'Cotonou, Bénin',
                "date": commande.created_at.strftime("%d/%m/%Y") if hasattr(commande, 'created_at') and commande.created_at else timezone.now().strftime("%d/%m/%Y"),
                "items": items_list,
                "total_amount": total_amt,
                "currency": getattr(commande, 'currency', 'FCFA') or 'FCFA',
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
                },
                recipient_name=full_name,
                pdf_invoice_data=pdf_invoice_data,
                async_send=True,
            )
            logger.info(f"[Commerce] Email de confirmation avec facture PDF déclenché pour commande {order_num} vers {commande.user.email}")
    except Exception as mail_err:
        logger.error(f"[Commerce] Erreur envoi email facture pour commande {commande.id}: {mail_err}")



def handle_payment_success(payment_tx):
    """Point d'entrée webhook Moneroo — paiement réellement encaissé."""
    from .models import Order

    logger.info(f"[Commerce] Traitement paiement réussi pour transaction {payment_tx.id}")

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

    with transaction.atomic():
        commande.statut_paiement = 'paid'
        commande.statut_commande = 'completed'
        commande.save(update_fields=['statut_paiement', 'statut_commande'])
        _unlock_order_content(commande)

    _notify_order_finalized(commande, "Moneroo")
    logger.info(f"[Commerce] Commande {commande.id} finalisée avec succès.")


def confirm_manual_payment(commande, confirmed_by_user):
    """Confirmation manuelle (Virement, Espèces, Carte) par le Gestionnaire."""
    if commande.statut_paiement == 'paid':
        logger.info(f"[Commerce] Commande {commande.id} déjà payée. Ignoré.")
        return

    label = commande.get_mode_paiement_display() if hasattr(commande, 'get_mode_paiement_display') else "manuel"

    with transaction.atomic():
        commande.statut_paiement = 'paid'
        commande.statut_commande = 'completed'
        commande.save(update_fields=['statut_paiement', 'statut_commande'])
        _unlock_order_content(commande)

    _notify_order_finalized(commande, label)
    logger.info(f"[Commerce] Commande {commande.id} confirmée manuellement par {confirmed_by_user.email}.")


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
    except Order.DoesNotExist:
        logger.error(f"[Commerce] Aucune commande trouvée pour la transaction {payment_tx.id}")
