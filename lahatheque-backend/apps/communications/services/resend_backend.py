"""
Backend de messagerie Django personnalisé pour expédier tous les e-mails via l'API REST de Resend.
Permet d'utiliser send_mail(), EmailMultiAlternatives, et toutes les fonctions natives Django
directement avec Resend sans passer par le protocole SMTP.
"""
import logging
from typing import List
from django.core.mail.backends.base import BaseEmailBackend
from .resend_provider import ResendEmailProvider
from .email_provider_base import EmailAttachment

logger = logging.getLogger(__name__)


class ResendEmailBackend(BaseEmailBackend):
    """
    Backend de messagerie Django connecté à l'API HTTPS officielle de Resend.
    """

    def __init__(self, fail_silently: bool = False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.provider = ResendEmailProvider()

    def send_messages(self, email_messages) -> int:
        """
        Envoie une liste d'instances EmailMessage / EmailMultiAlternatives via l'API Resend.
        """
        if not email_messages:
            return 0

        sent_count = 0
        for message in email_messages:
            try:
                # 1. Extraction du contenu HTML (si alternatives text/html présentes)
                html_content = ""
                if hasattr(message, "alternatives"):
                    for alt_content, alt_type in message.alternatives:
                        if alt_type == "text/html":
                            html_content = alt_content
                            break

                if not html_content:
                    html_content = f"<div style='font-family: sans-serif; line-height: 1.5;'>{message.body}</div>"

                # 2. Extraction des pièces jointes
                attachments: List[EmailAttachment] = []
                for att in getattr(message, "attachments", []):
                    if isinstance(att, tuple) and len(att) >= 2:
                        filename = att[0]
                        content = att[1]
                        content_type = att[2] if len(att) > 2 else "application/octet-stream"
                        if isinstance(content, str):
                            content = content.encode("utf-8")
                        attachments.append(EmailAttachment(
                            filename=filename,
                            content=content,
                            content_type=content_type,
                        ))

                reply_to = message.reply_to if hasattr(message, "reply_to") else None

                # 3. Envoi via le provider Resend
                result = self.provider.send_email(
                    to_email=list(message.to),
                    subject=message.subject,
                    html_content=html_content,
                    text_content=message.body,
                    from_email=message.from_email,
                    reply_to=reply_to,
                    attachments=attachments if attachments else None,
                )

                if result.success:
                    sent_count += 1
                else:
                    logger.error(f"[ResendEmailBackend] Échec envoi à {message.to}: {result.error}")
                    if not self.fail_silently:
                        raise Exception(result.error or "Échec de distribution par Resend")

            except Exception as exc:
                logger.error(f"[ResendEmailBackend] Exception lors de l'envoi de l'e-mail: {exc}")
                if not self.fail_silently:
                    raise exc

        return sent_count
