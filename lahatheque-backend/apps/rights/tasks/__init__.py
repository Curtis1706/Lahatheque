"""Tâches asynchrones pour l'application rights."""
from celery import shared_task
from .ocr_tasks import process_contract_ocr_task, trigger_contract_ocr

@shared_task
def calculate_monthly_royalties_task():
    """Tâche Celery Beat pour le calcul mensuel des redevances."""
    # TODO: Implémenter le calcul automatique
    pass

__all__ = [
    "calculate_monthly_royalties_task",
    "process_contract_ocr_task",
    "trigger_contract_ocr",
]
