from celery import shared_task

@shared_task
def update_cdf_exchange_rate_task():
    """Mise à jour périodique du taux du Franc Congolais (CDF)."""
    # TODO: Requête API taux de change externe
    pass
