"""
Adaptateur de messagerie pour l'API REST de Resend.
Permet d'envoyer des emails transactionnels avec pièces jointes PDF via Resend.
"""
import base64
import logging
from typing import List, Optional, Union, Dict, Any
import requests
from django.conf import settings
from .email_provider_base import EmailProviderBase, EmailAttachment, EmailSendResult

logger = logging.getLogger(__name__)


class ResendEmailProvider(EmailProviderBase):
    """
    Implémentation concrète pour le fournisseur Resend via son endpoint HTTPS officiel.
    """

    API_URL = "https://api.resend.com/emails"

    def __init__(self, api_key: Optional[str] = None, default_from: Optional[str] = None) -> None:
        self.api_key = api_key or getattr(settings, "RESEND_API_KEY", "")
        self.default_from = default_from or getattr(settings, "DEFAULT_FROM_EMAIL", "Lahatheque <contact@mail.lahalex.com>")

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
        Envoi d'un email via l'API REST de Resend.
        """
        if not self.api_key:
            logger.error("ResendEmailProvider: Aucune clé API Resend configurée (RESEND_API_KEY).")
            return EmailSendResult(
                success=False,
                provider="resend",
                error="Clé API Resend non configurée.",
                status_code=500,
            )

        recipients = [to_email] if isinstance(to_email, str) else list(to_email)
        sender = from_email or self.default_from

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload: Dict[str, Any] = {
            "from": sender,
            "to": recipients,
            "subject": subject,
            "html": html_content,
        }

        if text_content:
            payload["text"] = text_content

        if reply_to:
            payload["reply_to"] = reply_to if isinstance(reply_to, str) else reply_to[0]

        # Encodage des pièces jointes en Base64 pour l'API Resend
        if attachments:
            encoded_attachments = []
            for att in attachments:
                b64_content = base64.b64encode(att.content).decode("utf-8")
                encoded_attachments.append({
                    "filename": att.filename,
                    "content": b64_content,
                })
            payload["attachments"] = encoded_attachments

        if tags:
            payload["tags"] = [{"name": k, "value": str(v)} for k, v in tags.items()]

        try:
            response = requests.post(
                self.API_URL,
                headers=headers,
                json=payload,
                timeout=12.0,
            )

            response_data = {}
            try:
                response_data = response.json()
            except Exception:
                response_data = {"raw_text": response.text}

            if response.status_code in [200, 201]:
                message_id = response_data.get("id", "")
                logger.info(f"Email Resend envoyé avec succès à {recipients} (ID: {message_id})")
                return EmailSendResult(
                    success=True,
                    provider="resend",
                    message_id=message_id,
                    status_code=response.status_code,
                    raw_response=response_data,
                )
            else:
                error_msg = response_data.get("message") or response_data.get("error") or response.text
                logger.error(f"Erreur API Resend ({response.status_code}): {error_msg}")
                return EmailSendResult(
                    success=False,
                    provider="resend",
                    error=f"Resend HTTP {response.status_code}: {error_msg}",
                    status_code=response.status_code,
                    raw_response=response_data,
                )

        except requests.exceptions.RequestException as req_err:
            logger.error(f"Exception réseau lors de l'appel Resend: {req_err}")
            return EmailSendResult(
                success=False,
                provider="resend",
                error=f"Erreur de connexion Resend: {str(req_err)}",
                status_code=503,
            )
