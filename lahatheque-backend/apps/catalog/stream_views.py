"""
Vues de streaming sécurisé par fragments Range HTTP 206 (RFC 7233).
Conforme aux spécifications DRM de LAHAThèque (docs/drm/01-architecture-cible.md).
"""

import logging
import re
from typing import Optional, Tuple
from django.http import HttpResponse, JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
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

        deposit = None
        sub = None

        if not ouvrage:
            from apps.publishers_portal.models import PublisherBookDeposit
            try:
                deposit = PublisherBookDeposit.objects.filter(id=book_id).first()
            except Exception:
                deposit = PublisherBookDeposit.objects.filter(isbn_digital=book_id).first()

            if not deposit:
                from apps.rights.models import AuthorManuscriptSubmission
                try:
                    sub = AuthorManuscriptSubmission.objects.filter(id=book_id).first()
                except Exception:
                    sub = None

            if not deposit and not sub:
                return JsonResponse({
                    "success": False,
                    "data": {},
                    "error": "Ouvrage ou document introuvable dans le catalogue."
                }, status=status.HTTP_404_NOT_FOUND)

        # 2. Récupération de la configuration DRM globale de l'administrateur
        from apps.protection.models import GlobalDrmConfig
        global_drm = GlobalDrmConfig.get_singleton()
        effective_config = global_drm

        # 3. Préparation des métadonnées utilisateur
        ip = request.META.get("HTTP_X_FORWARDED_FOR")
        if ip:
            ip = ip.split(",")[0].strip()
        else:
            ip = request.META.get("REMOTE_ADDR", "127.0.0.1")

        doc_title = getattr(ouvrage, "title", None) or getattr(deposit, "title", None) or getattr(sub, "title", "Document Numérique")
        doc_id = str(ouvrage.id) if ouvrage else (str(deposit.id) if deposit else (str(sub.id) if sub else "unknown"))

        user_info = {
            "nom": request.user.get_full_name() or request.user.username,
            "email": request.user.email,
            "ip": ip,
            "user_id": str(request.user.id),
            "device_fingerprint": request.headers.get("X-Device-Fingerprint", ""),
            "title": doc_title,
            "id": doc_id,
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
            bouquet_sub_id = access_result.get("bouquet_subscription_id")
            institution_obj = None
            bouquet_sub_obj = None

            if bouquet_sub_id:
                from apps.partners.models import UniversityBouquetSubscription
                bouquet_sub_obj = UniversityBouquetSubscription.objects.filter(id=bouquet_sub_id).first()
                if bouquet_sub_obj:
                    institution_obj = bouquet_sub_obj.institution

            TraceAcces.objects.create(
                user=request.user,
                ouvrage=ouvrage,
                document_title=doc_title,
                ip_address=ip,
                country=request.headers.get("CF-IPCountry", ""),
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
                device_fingerprint=user_info["device_fingerprint"][:255],
                access_type="read_chunk",
                institution=institution_obj,
                bouquet_subscription=bouquet_sub_obj,
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


class BookSampleStreamView(APIView):
    """
    GET /api/v1/catalog/books/<book_id>/sample/ - Extrait gratuit RÉEL : les N premières
    pages du vrai fichier, filigranées "EXTRAIT GRATUIT". Accessible à tout utilisateur
    authentifié, sans exiger d'achat ni d'abonnement.
    """
    permission_classes = [IsAuthenticated]
    renderer_classes = [PassthroughStreamRenderer, JSONRenderer]

    def get(self, request, book_id):
        import fitz
        from apps.protection.source_adapter import DocumentSourceAdapter, DocumentSourceError
        from apps.catalog.models import Ouvrage

        try:
            ouvrage = Ouvrage.objects.filter(id=book_id, status='published').first()
            if not ouvrage:
                ouvrage = Ouvrage.objects.filter(isbn=book_id, status='published').first()
            if not ouvrage:
                return JsonResponse({"success": False, "error": "Ouvrage introuvable."}, status=404)
        except Exception:
            return JsonResponse({"success": False, "error": "Ouvrage introuvable."}, status=404)

        try:
            full_pdf_bytes = DocumentSourceAdapter.get_document_bytes("catalog_book", str(ouvrage.id))
        except DocumentSourceError as e:
            return JsonResponse({"success": False, "error": str(e)}, status=404)

        sample_pages = ouvrage.sample_pages_count

        try:
            src_doc = fitz.open(stream=full_pdf_bytes, filetype="pdf")
            extract_doc = fitz.open()
            page_limit = min(sample_pages, src_doc.page_count)
            extract_doc.insert_pdf(src_doc, from_page=0, to_page=page_limit - 1)

            import math
            for page in extract_doc:
                rect = page.rect
                page_width = rect.width
                page_height = rect.height
                theta = math.degrees(math.atan2(page_height, page_width))
                watermark_text = "EXTRAIT GRATUIT — LAHAThèque"
                font_size = max(14.0, min(24.0, float(page_width / 25)))
                text_len = fitz.get_text_length(watermark_text, fontname="helv", fontsize=font_size)
                center_point = fitz.Point(page_width / 2, page_height / 2)
                start_point = fitz.Point(page_width / 2 - text_len / 2, page_height / 2 + font_size * 0.35)

                page.insert_text(
                    start_point,
                    watermark_text,
                    fontsize=font_size,
                    color=(0.6, 0.6, 0.6),
                    fill_opacity=0.45,
                    morph=(center_point, fitz.Matrix(theta))
                )

            sample_bytes = extract_doc.tobytes(garbage=3, deflate=True)
            total_pages = src_doc.page_count
            src_doc.close()
            extract_doc.close()
        except Exception as e:
            return JsonResponse({"success": False, "error": f"Impossible de générer l'extrait : {e}"}, status=500)

        response = HttpResponse(sample_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="extrait-{ouvrage.id}.pdf"'
        response["X-Sample-Pages"] = str(page_limit)
        response["X-Sample-Total-Pages"] = str(total_pages)
        response["Access-Control-Expose-Headers"] = "X-Sample-Pages, X-Sample-Total-Pages"
        response["Cache-Control"] = "private, no-store, must-revalidate"
        return response


class BookCoverStreamView(APIView):
    """
    GET /api/v1/catalog/books/<book_id>/cover/
    Retourne la couverture du livre sous forme d'image JPEG :
    1. Si cover_image existe sur l'ouvrage, la renvoie.
    2. Sinon, extrait et rastérise la 1ère page du PDF sous forme d'image JPEG.
    Accessible publiquement pour afficher les couvertures sur tout le catalogue.
    """
    permission_classes = [AllowAny]
    renderer_classes = [PassthroughStreamRenderer]

    def get(self, request, book_id):
        import fitz
        from apps.catalog.models import Ouvrage
        from apps.protection.source_adapter import DocumentSourceAdapter, DocumentSourceError

        ouvrage = None
        try:
            import uuid as _uuid
            valid_uuid = _uuid.UUID(str(book_id).strip())
            ouvrage = Ouvrage.objects.filter(id=valid_uuid).first()
        except (ValueError, TypeError):
            ouvrage = Ouvrage.objects.filter(isbn=book_id).first()

        if not ouvrage:
            return HttpResponse(status=404)

        # 1. Si cover_image est renseignée
        if ouvrage.cover_image and hasattr(ouvrage.cover_image, 'read'):
            try:
                ouvrage.cover_image.seek(0)
                img_data = ouvrage.cover_image.read()
                response = HttpResponse(img_data, content_type="image/jpeg")
                response["Cache-Control"] = "public, max-age=86400"
                return response
            except Exception:
                pass

        # 2. Sinon, extraction de la 1ère page du PDF
        try:
            pdf_bytes = DocumentSourceAdapter.get_document_bytes("catalog_book", str(ouvrage.id))
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            if doc.page_count > 0:
                page = doc.load_page(0)
                pix = page.get_pixmap(dpi=150)
                img_bytes = pix.tobytes("jpeg")
                doc.close()
                response = HttpResponse(img_bytes, content_type="image/jpeg")
                response["Cache-Control"] = "public, max-age=86400"
                return response
            doc.close()
        except Exception:
            pass

        # 3. Fallback SVG dynamique aux couleurs officielles LAHAThèque (Navy & Gold)
        import html
        title = (ouvrage.title or "Ouvrage Académique")[:70]
        discipline = (ouvrage.discipline.name if getattr(ouvrage, 'discipline', None) else "LAHAThèque")[:40]
        author = ouvrage.auteur or "Éditions LAHA"
        if len(author) > 50:
            author = author[:47] + "..."

        title_esc = html.escape(title)
        discipline_esc = html.escape(discipline.upper())
        author_esc = html.escape(author)

        words = title_esc.split()
        lines = []
        cur_line = []
        for w in words:
            if len(" ".join(cur_line + [w])) <= 22:
                cur_line.append(w)
            else:
                lines.append(" ".join(cur_line))
                cur_line = [w]
        if cur_line:
            lines.append(" ".join(cur_line))
        lines = lines[:4]

        title_tspan = "".join([f'<tspan x="200" dy="{30 if i > 0 else 0}">{l}</tspan>' for i, l in enumerate(lines)])

        svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1B2A4E" />
      <stop offset="100%" stop-color="#0F1A33" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#B08D42" />
    </linearGradient>
  </defs>
  <rect width="400" height="600" fill="url(#bg)" rx="8" />
  <rect x="16" y="16" width="368" height="568" fill="none" stroke="#2E3F66" stroke-width="2" rx="4" />
  <rect x="24" y="24" width="352" height="552" fill="none" stroke="url(#gold)" stroke-width="1" stroke-opacity="0.4" rx="2" />
  <rect x="40" y="50" width="320" height="28" fill="#2E3F66" rx="14" />
  <text x="200" y="69" fill="#D4AF37" font-family="system-ui, sans-serif" font-size="11" font-weight="700" text-anchor="middle" letter-spacing="1.5">{discipline_esc}</text>
  <text x="200" y="220" fill="#FFFFFF" font-family="Georgia, serif" font-size="22" font-weight="bold" text-anchor="middle">
    {title_tspan}
  </text>
  <line x1="140" y1="380" x2="260" y2="380" stroke="url(#gold)" stroke-width="2" stroke-linecap="round" />
  <text x="200" y="430" fill="#D4AF37" font-family="system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle">{author_esc}</text>
  <text x="200" y="540" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="11" font-weight="500" text-anchor="middle" letter-spacing="2">LAHAThèque • Éditions</text>
</svg>"""

        response = HttpResponse(svg_content.encode('utf-8'), content_type="image/svg+xml")
        response["Cache-Control"] = "public, max-age=86400"
        return response


