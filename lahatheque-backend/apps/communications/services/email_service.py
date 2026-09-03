"""
Service centralisé d'envoi d'e-mails transactionnels et notifications LAHAThèque (Façade).
Orchestre le rendu des templates HTML, la génération des pièces jointes PDF, le choix du fournisseur,
le mécanisme de failover automatique et la journalisation immuable dans EmailNotificationLog.
"""
import logging
from typing import Dict, Any, List, Optional, Union
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
from apps.communications.models import EmailNotificationLog
from .email_provider_base import EmailProviderBase, EmailAttachment, EmailSendResult
from .resend_provider import ResendEmailProvider
from .smtp_provider import SmtpEmailProvider
from .pdf_attachment_service import PdfAttachmentService

logger = logging.getLogger(__name__)


class EmailService:
    """
    Façade unique pour tous les envois d'emails de la plateforme LAHAThèque.
    """

    @classmethod
    def get_provider(cls, provider_name: Optional[str] = None) -> EmailProviderBase:
        """
        Instancie le fournisseur demandé ou celui configuré par défaut dans settings.
        """
        name = (provider_name or getattr(settings, "EMAIL_PROVIDER", "resend")).lower()
        if name == "resend":
            return ResendEmailProvider()
        return SmtpEmailProvider()

    @classmethod
    def get_fallback_provider(cls, primary_provider_name: str) -> Optional[EmailProviderBase]:
        """
        Instancie le fournisseur de secours alternatif si le failover est activé.
        """
        if not getattr(settings, "EMAIL_ENABLE_FALLBACK", True):
            return None
        
        primary = primary_provider_name.lower()
        if primary == "resend":
            return SmtpEmailProvider()
        elif primary == "smtp":
            return ResendEmailProvider()
        return None

    @classmethod
    def _get_logo_base64(cls) -> str:
        import base64
        import os
        possible_paths = [
            "e:/Lahatheque/lahatheque-backend/static/logo.png",
            "e:/Lahatheque/lahatheque-frontend/public/logo.png",
        ]
        for p in possible_paths:
            if os.path.exists(p):
                try:
                    with open(p, "rb") as f:
                        return base64.b64encode(f.read()).decode("utf-8")
                except Exception:
                    pass
        return ""

    @classmethod
    def send(
        cls,
        email_type: str,
        to_email: Union[str, List[str]],
        subject: str,
        template_name: str,
        context: Optional[Dict[str, Any]] = None,
        recipient_name: str = "",
        from_email: Optional[str] = None,
        reply_to: Optional[Union[str, List[str]]] = None,
        attachments: Optional[List[EmailAttachment]] = None,
        pdf_invoice_data: Optional[Dict[str, Any]] = None,
        pdf_royalty_data: Optional[Dict[str, Any]] = None,
        tags: Optional[Dict[str, str]] = None,
    ) -> EmailSendResult:
        """
        Point d'entrée principal synchrone/direct pour expédier un e-mail transactionnel.
        """
        ctx = context or {}
        # Enrichissement du contexte global (logo, url du site, mentions légales, année courante)
        ctx.setdefault("site_name", "LAHAThèque")
        ctx.setdefault("site_url", getattr(settings, "FRONTEND_URL", "https://lahatheque.com"))
        ctx.setdefault("support_email", "contact@mail.lahalex.com")
        ctx.setdefault("support_phone", "+229 01 53 00 00 00")
        ctx.setdefault("current_year", timezone.now().year)
        ctx.setdefault("recipient_name", recipient_name)
        ctx.setdefault("logo_base64", cls._get_logo_base64())

        # 1. Rendu du Template HTML
        try:
            html_content = render_to_string(template_name, ctx)
        except Exception as template_err:
            logger.error(f"Erreur lors du rendu du template {template_name}: {template_err}")
            # Fallback en HTML basique si le template n'est pas trouvé
            html_content = f"""
            <div style="font-family: sans-serif; padding: 20px; color: #1B2A4E;">
                <h2>LAHAThèque</h2>
                <p>{ctx.get('message_content', 'Notification de la plateforme LAHAThèque.')}</p>
            </div>
            """

        text_content = strip_tags(html_content)

        # 2. Gestion des pièces jointes
        final_attachments: List[EmailAttachment] = []
        if attachments:
            for att in attachments:
                if isinstance(att, EmailAttachment):
                    final_attachments.append(att)
                elif isinstance(att, dict):
                    final_attachments.append(EmailAttachment(
                        filename=att.get("filename", "document.pdf"),
                        content=att.get("content", b""),
                        content_type=att.get("content_type", "application/octet-stream"),
                    ))

        if pdf_invoice_data:
            try:
                invoice_bytes = PdfAttachmentService.generate_invoice_pdf(pdf_invoice_data)
                order_ref = pdf_invoice_data.get("order_number", "Facture")
                final_attachments.append(EmailAttachment(
                    filename=f"Facture_{order_ref}.pdf",
                    content=invoice_bytes,
                    content_type="application/pdf",
                ))
            except Exception as pdf_err:
                logger.error(f"Erreur génération PDF facture pour {to_email}: {pdf_err}")

        if pdf_royalty_data:
            try:
                royalty_bytes = PdfAttachmentService.generate_royalty_statement_pdf(pdf_royalty_data)
                statement_ref = pdf_royalty_data.get("reference", "Bordereau")
                final_attachments.append(EmailAttachment(
                    filename=f"Bordereau_{statement_ref}.pdf",
                    content=royalty_bytes,
                    content_type="application/pdf",
                ))
            except Exception as pdf_err:
                logger.error(f"Erreur génération PDF bordereau pour {to_email}: {pdf_err}")

        attachment_filenames = [a.filename for a in final_attachments]
        primary_provider_name = getattr(settings, "EMAIL_PROVIDER", "resend").lower()
        provider = cls.get_provider(primary_provider_name)

        # 3. Création du log en statut 'pending'
        target_email = to_email if isinstance(to_email, str) else ", ".join(to_email)
        log_entry = None
        try:
            log_entry = EmailNotificationLog.objects.create(
                recipient_email=target_email[:254],
                recipient_name=recipient_name[:255],
                email_type=email_type,
                subject=subject[:255],
                provider_used=primary_provider_name,
                status=EmailNotificationLog.Status.PENDING,
                has_attachment=bool(final_attachments),
                attachment_names=attachment_filenames,
            )
        except Exception as log_err:
            logger.warning(f"Impossible de créer le log initial d'email: {log_err}")

        print(f"[EMAIL-SERVICE] Début traitement e-mail '{email_type}' vers {to_email} (Provider principal: {primary_provider_name})")

        # 4. Envoi via le fournisseur principal
        result = provider.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
            from_email=from_email,
            reply_to=reply_to,
            attachments=final_attachments,
            tags=tags,
        )

        # 5. Failover automatique si échec
        if not result.success:
            print(f"[EMAIL-SERVICE-WARN] Échec fournisseur principal {primary_provider_name}: {result.error}")
            fallback_provider = cls.get_fallback_provider(primary_provider_name)
            if fallback_provider:
                print("[EMAIL-SERVICE] Basculement immédiat vers le fournisseur de secours...")
                logger.warning(f"Échec {primary_provider_name} ({result.error}). Tentative de secours via fallback...")
                result = fallback_provider.send_email(
                    to_email=to_email,
                    subject=subject,
                    html_content=html_content,
                    text_content=text_content,
                    from_email=from_email,
                    reply_to=reply_to,
                    attachments=final_attachments,
                    tags=tags,
                )

        print(f"[EMAIL-SERVICE-RESULT] Statut final: {'SUCCÈS' if result.success else 'ÉCHEC'} | Provider: {result.provider} | ID/Error: {result.message_id or result.error}")

        # 6. Mise à jour du log
        if log_entry:
            try:
                log_entry.provider_used = result.provider
                log_entry.provider_message_id = result.message_id
                if result.success:
                    log_entry.status = EmailNotificationLog.Status.SENT
                    log_entry.sent_at = timezone.now()
                else:
                    log_entry.status = EmailNotificationLog.Status.FAILED
                    log_entry.error_message = result.error or "Erreur inconnue"
                log_entry.save()
            except Exception as update_err:
                logger.warning(f"Impossible de mettre à jour le log d'email: {update_err}")

        return result


def send_transactional_email(
    email_type: str,
    to_email: Union[str, List[str]],
    subject: str,
    template_name: str,
    context: Optional[Dict[str, Any]] = None,
    recipient_name: str = "",
    from_email: Optional[str] = None,
    reply_to: Optional[Union[str, List[str]]] = None,
    attachments: Optional[List[Any]] = None,
    pdf_invoice_data: Optional[Dict[str, Any]] = None,
    pdf_royalty_data: Optional[Dict[str, Any]] = None,
    tags: Optional[Dict[str, str]] = None,
    async_send: bool = True,
) -> EmailSendResult:
    """
    Fonction utilitaire globale pour déclencher l'envoi d'un e-mail transactionnel.
    Si Celery est disponible et async_send=True, délègue à la tâche asynchrone.
    """
    if async_send:
        import threading

        def _async_dispatcher():
            try:
                EmailService.send(
                    email_type=email_type,
                    to_email=to_email,
                    subject=subject,
                    template_name=template_name,
                    context=context,
                    recipient_name=recipient_name,
                    from_email=from_email,
                    reply_to=reply_to,
                    attachments=attachments,
                    pdf_invoice_data=pdf_invoice_data,
                    pdf_royalty_data=pdf_royalty_data,
                    tags=tags,
                )
            except Exception as send_err:
                print(f"[EMAIL-THREAD-ERROR] Échec de l'envoi d'e-mail en tâche de fond: {send_err}")
                logger.error(f"[EMAIL THREAD ERROR] Échec de l'envoi d'e-mail: {send_err}")

        # Lancement instantané du thread pour libérer immédiatement le worker HTTP Gunicorn / Traefik
        t = threading.Thread(target=_async_dispatcher, daemon=True)
        t.start()
        return EmailSendResult(
            success=True,
            provider="thread_async",
            message_id="thread_dispatched",
        )

    return EmailService.send(
        email_type=email_type,
        to_email=to_email,
        subject=subject,
        template_name=template_name,
        context=context,
        recipient_name=recipient_name,
        from_email=from_email,
        reply_to=reply_to,
        attachments=attachments,
        pdf_invoice_data=pdf_invoice_data,
        pdf_royalty_data=pdf_royalty_data,
        tags=tags,
    )
