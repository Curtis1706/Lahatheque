"""
Tâches asynchrones Celery pour le module Catalogue (LAHAThèque).
Inclut la synchronisation périodique automatique du bucket Cloudflare R2 (laha-books-production).
"""

import logging
from typing import Any, Dict
from celery import shared_task
from celery.signals import worker_ready
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


@worker_ready.connect
def on_celery_worker_ready(sender=None, **kwargs):
    """
    Déclenche automatiquement la synchronisation R2 dès que le worker Celery démarre
    (après chaque commit, redémarrage ou déploiement Coolify), sans avoir à attendre
    l'intervalle périodique de 6 heures.
    """
    logger.info("[Celery Catalog] Worker Celery prêt : planification immédiate du scan R2 des ouvrages...")
    try:
        task_sync_r2_multilingual_books.apply_async(countdown=10)
        logger.info("[Celery Catalog] Tâche task_sync_r2_multilingual_books planifiée avec succès (délai 10s après démarrage).")
    except Exception as exc:
        logger.warning(f"[Celery Catalog] Échec de la planification de la synchronisation R2 au démarrage: {exc}")

