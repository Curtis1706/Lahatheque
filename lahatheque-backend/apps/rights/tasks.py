from celery import shared_task

@shared_task
def calculate_monthly_royalties_task():
    """Tâche Celery Beat pour le calcul mensuel des redevances."""
    # TODO: Implémenter le calcul automatique
    pass
