"""
Tâches asynchrones Celery pour le module Catalogue (LAHAThèque).
Inclut la synchronisation périodique automatique du bucket Cloudflare R2 (laha-books-production).
"""

import logging
from typing import Any, Dict
from celery import shared_task
from django.core.management import call_command

logger = logging.getLogger(__name__)


@shared_task(
    name="apps.catalog.tasks.task_sync_r2_multilingual_books",
    bind=True,
    max_retries=1,
    default_retry_delay=300,
)
def task_sync_r2_multilingual_books(self) -> Dict[str, Any]:
    """
    Tâche périodique Celery Beat :
    Synchronise les nouveaux ouvrages déposés sur Cloudflare R2 (laha-books-production).
    Grâce à l'idempotence de la commande, seuls les nouveaux livres ou ceux non encore
    traités sont ingérés, analysés par l'IA et publiés.
    """
    logger.info("[Celery Catalog] Démarrage de la synchronisation automatique R2...")
    try:
        call_command("import_r2_multilingual_books")
        logger.info("[Celery Catalog] Synchronisation R2 terminée avec succès.")
        return {"success": True, "status": "completed"}
    except Exception as exc:
        logger.error(f"[Celery Catalog] Erreur lors de la synchronisation R2: {exc}", exc_info=True)
        raise self.retry(exc=exc)
