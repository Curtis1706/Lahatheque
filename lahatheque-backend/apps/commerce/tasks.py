import logging
from datetime import timedelta
from celery import shared_task
from django.utils import timezone
from .models import Order

logger = logging.getLogger(__name__)

def auto_mark_abandoned_orders(hours_threshold: int = 24) -> int:
    """
    Bascule automatiquement les commandes au statut 'pending' de plus de X heures
    en statut 'abandoned' (panier abandonné).
    Ne touche pas aux commandes à crédit autorisées (is_credit_purchase=True).
    """
    cutoff_time = timezone.now() - timedelta(hours=hours_threshold)
    pending_orders = Order.objects.filter(
        statut_paiement='pending',
        is_credit_purchase=False,
        created_at__lte=cutoff_time
    )

    count = pending_orders.count()
    if count > 0:
        now = timezone.now()
        updated_count = pending_orders.update(
            statut_paiement='abandoned',
            abandoned_at=now,
            updated_at=now
        )
        logger.info(
            "Bascule automatique de %d commande(s) non payées vers le statut 'abandoned'.",
            updated_count
        )
        return updated_count
    return 0

@shared_task
def auto_mark_abandoned_orders_task(hours_threshold: int = 24) -> int:
    """Tâche Celery périodique pour marquer les paniers abandonnés."""
    return auto_mark_abandoned_orders(hours_threshold=hours_threshold)

@shared_task
def update_cdf_exchange_rate_task():
    """Mise à jour périodique du taux du Franc Congolais (CDF)."""
    # Requête API taux de change externe
    pass

