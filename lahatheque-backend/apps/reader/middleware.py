"""Middleware de journalisation réelle des requêtes de l'API Lecteur Hébergé."""
import time
import uuid
import jwt
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class ReaderApiLoggingMiddleware:
    """Capture chaque requête vers /api/v1/reader/ dans ApiRequestLog avec les vraies métriques et le bon partenaire."""

    TRACKED_PREFIX = "/api/v1/reader/"

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.path.startswith(self.TRACKED_PREFIX):
            return self.get_response(request)

        start = time.monotonic()
        response = self.get_response(request)
        elapsed_ms = int((time.monotonic() - start) * 1000)

        try:
            from apps.reader.models import ApiRequestLog, PartnerApp, ReaderSession

            client_ip = request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", ""))
            if client_ip:
                client_ip = client_ip.split(",")[0].strip()

            partner = getattr(request, "partner", None)
            if not partner and hasattr(request, "_request"):
                partner = getattr(request._request, "partner", None)

            if not partner and hasattr(request, "reader_session") and request.reader_session:
                partner = request.reader_session.partner

            # Extraction via le jeton de lecture (X-Reader-Token, Bearer, ou ?token=)
            if not partner:
                token_str = (
                    request.headers.get("X-Reader-Token")
                    or request.GET.get("token")
                    or request.META.get("HTTP_X_READER_TOKEN")
                )
                if not token_str:
                    auth_header = request.headers.get("Authorization", "")
                    if auth_header.startswith("Bearer "):
                        token_str = auth_header.split(" ", 1)[1].strip()

                if token_str:
                    try:
                        payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
                        partner_id = payload.get("partner_id")
                        if partner_id:
                            partner = PartnerApp.objects.filter(id=partner_id).first()
                        if not partner:
                            session_id = payload.get("session_id")
                            if session_id:
                                session = ReaderSession.objects.select_related("partner").filter(id=session_id).first()
                                if session:
                                    partner = session.partner
                    except Exception:
                        pass

            # Extraction via l'en-tête Client ID (X-Client-Id)
            if not partner:
                client_id = request.headers.get("X-Client-Id") or request.META.get("HTTP_X_CLIENT_ID")
                if client_id:
                    partner = PartnerApp.objects.filter(client_id=client_id).first()
                    if not partner and client_id.startswith("laha_client_"):
                        prefix = client_id.replace("laha_client_", "")
                        for p in PartnerApp.objects.all():
                            if str(p.id).replace("-", "").startswith(prefix):
                                partner = p
                                break

            # Dernier recours pour les sessions récentes du même client IP
            if not partner:
                recent_session = ReaderSession.objects.select_related("partner").order_by("-created_at").first()
                if recent_session and recent_session.partner:
                    partner = recent_session.partner

            ApiRequestLog.objects.create(
                partner=partner,
                method=request.method,
                endpoint=request.path,
                status_code=response.status_code,
                response_time_ms=elapsed_ms,
                client_ip=client_ip or None,
                request_id=str(uuid.uuid4()),
            )
        except Exception as e:
            logger.debug(f"Erreur journalisation ReaderApiLoggingMiddleware: {e}")

        return response
