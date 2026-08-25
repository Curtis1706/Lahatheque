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
        logger.warning(f"[Commerce] Erreur notification: {e}")


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
