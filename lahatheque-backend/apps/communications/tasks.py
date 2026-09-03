"""
Tâches Celery asynchrones pour l'envoi d'emails transactionnels et notifications.
Fournit une politique de réessais automatique (max 3 retries avec backoff exponentiel).
"""
import logging
from typing import Dict, Any, Optional, Union, List
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=300,
    retry_jitter=True,
    name="apps.communications.tasks.task_send_transactional_email",
)
def task_send_transactional_email(
    self,
    email_type: str,
    to_email: Union[str, List[str]],
    subject: str,
    template_name: str,
    context: Optional[Dict[str, Any]] = None,
    recipient_name: str = "",
    from_email: Optional[str] = None,
    reply_to: Optional[Union[str, List[str]]] = None,
    pdf_invoice_data: Optional[Dict[str, Any]] = None,
    pdf_royalty_data: Optional[Dict[str, Any]] = None,
    tags: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """
    Exécution en tâche de fond Celery d'un envoi d'email transactionnel.
    """
    from apps.communications.services.email_service import EmailService

    logger.info(f"[Celery Task] Envoi email {email_type} à {to_email}")

    result = EmailService.send(
        email_type=email_type,
        to_email=to_email,
        subject=subject,
        template_name=template_name,
        context=context,
        recipient_name=recipient_name,
        from_email=from_email,
        reply_to=reply_to,
        pdf_invoice_data=pdf_invoice_data,
        pdf_royalty_data=pdf_royalty_data,
        tags=tags,
    )

    if not result.success:
        logger.error(f"[Celery Task Failed] {email_type} vers {to_email}: {result.error}")
        # Déclenche un retry si nécessaire
        raise Exception(result.error or "Échec d'envoi de l'email")

    return {
        "success": True,
        "provider": result.provider,
        "message_id": result.message_id,
        "recipient": to_email,
    }
