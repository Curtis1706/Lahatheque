import logging
from django.db import transaction
from django.utils import timezone

logger = logging.getLogger(__name__)


def handle_payment_success(payment_tx):
    """
    Traitement métier complet lors de la confirmation de paiement Moneroo.
    1. Basculer la commande en PAID
    2. Déverrouiller l'accès aux ouvrages numériques (ReadingProgress)
    3. Décrémenter le stock pour les livres papier
    4. Envoyer une notification à l'utilisateur
    """
    from .models import Order, LigneCommande, StockOuvrage, MouvementStock
    from apps.student.models import ReadingProgress
    from apps.reporting.services import notify_user

    logger.info(f"[Commerce] Traitement paiement réussi pour transaction {payment_tx.id}")

    # 1. Trouver la commande associée
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
        # 2. Basculer les statuts
        commande.statut_paiement = 'paid'
        commande.statut_commande = 'completed'
        commande.save(update_fields=['statut_paiement', 'statut_commande'])

        lignes = LigneCommande.objects.filter(commande=commande).select_related('ouvrage')

        for ligne in lignes:
            ouvrage = ligne.ouvrage

            if ligne.format_type in ('digital', 'pdf', 'epub'):
                # 3. Déverrouiller l'accès numérique
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
                # 4. Décrémenter le stock physique
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
                        motif=f"Vente confirmée via Moneroo",
                        auteur=commande.user,
                    )
                    logger.info(f"[Commerce] Stock décrémenté: -{ligne.quantity} pour {ouvrage.title}")
                else:
                    logger.warning(f"[Commerce] Stock insuffisant pour {ouvrage.title} (quantité demandée: {ligne.quantity})")

        # 5. Notification utilisateur
        try:
            notify_user(
                user=commande.user,
                title="Paiement confirmé",
                message=f"Votre commande #{str(commande.id)[:8]} a été payée avec succès. "
                        f"Vos ouvrages numériques sont maintenant accessibles dans votre bibliothèque.",
                notification_type="payment_success",
                action_url="/student/books",
            )
        except Exception as e:
            logger.warning(f"[Commerce] Erreur notification: {e}")

    logger.info(f"[Commerce] Commande {commande.id} finalisée avec succès.")


def handle_payment_failure(payment_tx):
    """Traitement lors d'un échec de paiement."""
    from .models import Order
    from apps.reporting.services import notify_user

    logger.info(f"[Commerce] Échec paiement pour transaction {payment_tx.id}")

    try:
        commande = Order.objects.get(payment_transaction=payment_tx)
        commande.statut_paiement = 'failed'
        commande.save(update_fields=['statut_paiement'])

        try:
            notify_user(
                user=commande.user,
                title="Échec de paiement",
                message=f"Le paiement pour votre commande #{str(commande.id)[:8]} a échoué. "
                        f"Veuillez réessayer ou contacter le support.",
                notification_type="payment_failed",
                action_url="/student/orders",
            )
        except Exception:
            pass
    except Order.DoesNotExist:
        logger.error(f"[Commerce] Aucune commande trouvée pour la transaction {payment_tx.id}")
