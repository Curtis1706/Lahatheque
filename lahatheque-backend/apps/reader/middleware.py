"""Middleware de journalisation réelle des requêtes de l'API Lecteur Hébergé."""
import time
import uuid


class ReaderApiLoggingMiddleware:
    """Capture chaque requête vers /api/v1/reader/ dans ApiRequestLog avec les vraies métriques."""

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
            from apps.reader.models import ApiRequestLog

            client_ip = request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", ""))
            if client_ip:
                client_ip = client_ip.split(",")[0].strip()

            partner = getattr(request, "partner", None)

            ApiRequestLog.objects.create(
                partner=partner,
                method=request.method,
                endpoint=request.path,
                status_code=response.status_code,
                response_time_ms=elapsed_ms,
                client_ip=client_ip or None,
                request_id=str(uuid.uuid4()),
            )
        except Exception:
            pass  # La journalisation ne doit jamais faire échouer la requête réelle

        return response
