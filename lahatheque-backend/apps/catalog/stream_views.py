"""
Vues de streaming sécurisé par fragments Range HTTP 206 (RFC 7233).
Conforme aux spécifications DRM de LAHAThèque (docs/drm/01-architecture-cible.md).
"""

import logging
import re
from typing import Optional, Tuple
from django.http import HttpResponse, JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.catalog.models import Ouvrage
from apps.protection.access_service import AccessService
from apps.protection.derived_materializer import DerivedMaterializer
from apps.protection.models import ProtectionConfig, TraceAcces

logger = logging.getLogger(__name__)


from rest_framework.renderers import BaseRenderer, JSONRenderer

class PassthroughStreamRenderer(BaseRenderer):
    """Renderer universel autorisant le streaming binaire PDF, audio et vidéo."""
    media_type = "*/*"
    format = "binary"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data


class BookStreamView(APIView):
    """
    Sert un ouvrage du catalogue en flux fragmenté Range HTTP 206.
    Le fichier source clair ne quitte jamais le serveur.
    Le client reçoit exclusivement des fragments chiffrés/filigranés au nom de l'utilisateur.
    """
    permission_classes = [IsAuthenticated]
    renderer_classes = [PassthroughStreamRenderer, JSONRenderer]

    # Taille standard d'un bloc de streaming: 256 Kio
    DEFAULT_CHUNK_SIZE = 256 * 1024

    def get(self, request, book_id):
        # 1. Vérification des droits d'accès utilisateur
        access_result = AccessService.check_user_book_access(request.user, book_id)
        if not access_result.get("access_granted"):
            return JsonResponse({
                "success": False,
                "data": {},
                "error": access_result.get("error", "Accès non autorisé à cet ouvrage.")
            }, status=status.HTTP_403_FORBIDDEN)

        ouvrage = None
        try:
            ouvrage = Ouvrage.objects.filter(id=book_id).first()
        except Exception:
            # Si book_id n'est pas un UUID valide (ex: slug ou ISBN), tenter une recherche par ISBN
            ouvrage = Ouvrage.objects.filter(isbn=book_id).first()

        if not ouvrage:
            return JsonResponse({
                "success": False,
                "data": {},
                "error": "Ouvrage introuvable dans le catalogue."
            }, status=status.HTTP_404_NOT_FOUND)


        # 2. Récupération ou création de la configuration de protection
        from apps.protection.models import GlobalDrmConfig
        global_drm = GlobalDrmConfig.get_singleton()
        protection_config = getattr(ouvrage, "protection_config", None)
        if not protection_config:
            protection_config = ProtectionConfig.objects.filter(ouvrage=ouvrage).first()
        effective_config = protection_config or global_drm

        # 3. Préparation des métadonnées utilisateur
        ip = request.META.get("HTTP_X_FORWARDED_FOR")
        if ip:
            ip = ip.split(",")[0].strip()
        else:
            ip = request.META.get("REMOTE_ADDR", "127.0.0.1")

        user_info = {
            "nom": request.user.get_full_name() or request.user.username,
            "email": request.user.email,
            "ip": ip,
            "user_id": str(request.user.id),
            "device_fingerprint": request.headers.get("X-Device-Fingerprint", ""),
            "title": getattr(ouvrage, "titre", getattr(ouvrage, "title", "Ouvrage")),
            "id": str(ouvrage.id),
            "is_partner": False,
        }

        # 4. Obtention du dérivé filigrané en cache
        try:
            pdf_bytes, total_size = DerivedMaterializer.get_or_create_derived(
                source_type="catalog_book",
                source_reference=str(book_id),
                user_info=user_info,
                config=effective_config
            )
        except Exception as e:
            logger.error(f"Erreur matérialisation dérivé ({book_id}): {e}")
            return JsonResponse({
                "success": False,
                "data": {},
                "error": "Impossible de charger le document sécurisé."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 5. Traitement de l'en-tête HTTP Range (RFC 7233)
        range_header = request.META.get("HTTP_RANGE")
        if not range_header:
            # Requête standard sans Range: servir le document complet
            response = HttpResponse(pdf_bytes, status=status.HTTP_200_OK, content_type="application/pdf")
            response["Accept-Ranges"] = "bytes"
            response["Content-Length"] = str(total_size)
            response["Cache-Control"] = "private, no-store, must-revalidate"
            response["X-Content-Type-Options"] = "nosniff"
            return response

        start_byte, end_byte = self._parse_range_header(range_header, total_size)

        if start_byte is None or end_byte is None:
            # Range Not Satisfiable
            response = HttpResponse(status=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE)
            response["Content-Range"] = f"bytes */{total_size}"
            return response

        # Découpage du fragment
        chunk_data = pdf_bytes[start_byte : end_byte + 1]
        chunk_length = len(chunk_data)

        # 6. Journalisation légale immuable dans TraceAcces
        try:
            TraceAcces.objects.create(
                user=request.user,
                ouvrage=ouvrage,
                document_title=ouvrage.title,
                ip_address=ip,
                country=request.headers.get("CF-IPCountry", ""),
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
                device_fingerprint=user_info["device_fingerprint"][:255],
                access_type="read_chunk",
            )
        except Exception as log_err:
            logger.warning(f"Erreur enregistrement TraceAcces: {log_err}")

        # 7. Réponse HTTP 206 Partial Content avec en-têtes de sécurité
        response = HttpResponse(chunk_data, status=status.HTTP_206_PARTIAL_CONTENT, content_type="application/pdf")
        response["Accept-Ranges"] = "bytes"
        response["Content-Range"] = f"bytes {start_byte}-{end_byte}/{total_size}"
        response["Content-Length"] = str(chunk_length)
        response["Cache-Control"] = "private, no-store, must-revalidate"
        response["X-Content-Type-Options"] = "nosniff"
        return response

    def _parse_range_header(self, range_header: str, total_size: int) -> Tuple[Optional[int], Optional[int]]:
        """
        Parse l'en-tête Range (ex: 'bytes=0-262143' ou 'bytes=50000-').
        """
        match = re.match(r"bytes=(\d+)-(\d*)", range_header)
        if not match:
            return None, None

        start_str, end_str = match.groups()
        start = int(start_str)

        if start >= total_size:
            return None, None

        if end_str:
            end = min(int(end_str), total_size - 1)
        else:
            end = total_size - 1

        if start > end:
            return None, None

        return start, end
