"""
Adaptateur de messagerie pour le serveur SMTP Professionnel standard (Hostinger, Brevo, Infomaniak, etc.).
Supporte l'authentification sur boîte unique et l'attachement de fichiers PDF.
"""
import logging
from typing import List, Optional, Union, Dict
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.mail.backends.smtp import EmailBackend
from .email_provider_base import EmailProviderBase, EmailAttachment, EmailSendResult

logger = logging.getLogger(__name__)


class SmtpEmailProvider(EmailProviderBase):
    """
    Implémentation concrète pour l'envoi d'e-mails via SMTP avec une boîte mail professionnelle unique.
    """

    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        use_ssl: Optional[bool] = None,
        use_tls: Optional[bool] = None,
        default_from: Optional[str] = None,
    ) -> None:
        self.host = host or getattr(settings, "EMAIL_HOST", "smtp.hostinger.com")
        self.port = port or getattr(settings, "EMAIL_PORT", 465)
        self.username = username or getattr(settings, "EMAIL_HOST_USER", "contact@mail.lahalex.com")
        self.password = password or getattr(settings, "EMAIL_HOST_PASSWORD", "")
        self.use_ssl = use_ssl if use_ssl is not None else getattr(settings, "EMAIL_USE_SSL", True)
        self.use_tls = use_tls if use_tls is not None else getattr(settings, "EMAIL_USE_TLS", False)
        self.default_from = default_from or getattr(settings, "DEFAULT_FROM_EMAIL", f"Lahatheque <{self.username}>")

    def _get_connection(self) -> EmailBackend:
        return EmailBackend(
            host=self.host,
            port=self.port,
            username=self.username,
            password=self.password,
            use_ssl=self.use_ssl,
            use_tls=self.use_tls,
            timeout=10,
        )

    def send_email(
        self,
        to_email: Union[str, List[str]],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        reply_to: Optional[Union[str, List[str]]] = None,
        attachments: Optional[List[EmailAttachment]] = None,
        tags: Optional[Dict[str, str]] = None,
    ) -> EmailSendResult:
        """
        Envoi d'un email via la connexion SMTP.
        """
        recipients = [to_email] if isinstance(to_email, str) else list(to_email)
        sender = from_email or self.default_from
        reply_list = [reply_to] if isinstance(reply_to, str) else (list(reply_to) if reply_to else None)

        body_text = text_content or "Ce message nécessite un client de messagerie supportant le format HTML."

        try:
            connection = self._get_connection()
            msg = EmailMultiAlternatives(
                subject=subject,
                body=body_text,
                from_email=sender,
                to=recipients,
                reply_to=reply_list,
                connection=connection,
            )

            msg.attach_alternative(html_content, "text/html")

            if attachments:
                for att in attachments:
                    msg.attach(
                        filename=att.filename,
                        content=att.content,
                        mimetype=att.content_type,
                    )

            msg.send(fail_silently=False)
            logger.info(f"Email SMTP envoyé avec succès à {recipients}: {subject}")

            return EmailSendResult(
                success=True,
                provider="smtp",
                message_id="smtp-delivered",
            )

        except Exception as smtp_err:
            logger.error(f"Erreur lors de l'envoi SMTP à {recipients}: {smtp_err}")
            return EmailSendResult(
                success=False,
                provider="smtp",
                error=str(smtp_err),
            )
