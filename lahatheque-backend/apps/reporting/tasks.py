import logging
from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags
from django.conf import settings

from core.services.notification import NotificationService

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def send_email_task(self, recipient_list, subject, html_content, from_email=None):
    """
    Tâche Celery pour envoyer des emails via Resend (NotificationService).
    """
    if not recipient_list:
        logger.warning("send_email_task: Liste de destinataires vide.")
        return False

    service = NotificationService()
    success = True
    
    # Si c'est une chaîne simple, on la met en liste
    if isinstance(recipient_list, str):
        recipient_list = [recipient_list]
        
    for recipient in recipient_list:
        try:
            # On utilise le service centralisé qui gère déjà les logs et Resend
            res = service.send_email(to=recipient, subject=subject, html_content=html_content)
            if not res:
                success = False
                logger.error(f"Échec de l'envoi d'email à {recipient} via NotificationService")
        except Exception as exc:
            logger.error(f"Erreur lors de l'envoi à {recipient}: {exc}")
            success = False
            # Optionnel: retry seulement si c'est une erreur temporaire
            # raise self.retry(exc=exc, countdown=60)

    return success
