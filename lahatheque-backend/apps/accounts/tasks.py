import logging
from celery import shared_task
from django.core.management import call_command

logger = logging.getLogger(__name__)


@shared_task(name="accounts.purge_expired_tokens")
def purge_expired_tokens():
    """SEC-08: Purge quotidienne des tokens JWT révoqués/expirés dans la base de données."""
    try:
        call_command("flushexpiredtokens")
        logger.info("Purge des tokens JWT expires effectuee avec succes.")
    except Exception as exc:
        logger.error(f"Erreur lors de la purge des tokens JWT: {exc}")
        raise exc
