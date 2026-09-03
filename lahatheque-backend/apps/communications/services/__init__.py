"""Services d'emails transactionnels, notifications et pièces jointes PDF LAHAThèque."""
from .email_provider_base import EmailProviderBase, EmailAttachment, EmailSendResult
from .resend_provider import ResendEmailProvider
from .smtp_provider import SmtpEmailProvider
from .email_service import EmailService, send_transactional_email

__all__ = [
    "EmailProviderBase",
    "EmailAttachment",
    "EmailSendResult",
    "ResendEmailProvider",
    "SmtpEmailProvider",
    "EmailService",
    "send_transactional_email",
]
