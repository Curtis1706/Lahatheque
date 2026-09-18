"""
Vues de streaming sécurisé par fragments Range HTTP 206 (RFC 7233).
Conforme aux spécifications DRM de LAHAThèque (docs/drm/01-architecture-cible.md).
"""

import logging
import os
import re
from typing import Optional, Tuple
from django.conf import settings
from django.db.models import Q
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
        requested_lang = request.query_params.get("lang") or request.query_params.get("language")

        # Fiche X2 : Session cache pour éviter de ré-exécuter les vérifications de droits et résolutions à chaque fragment Range 206
        from django.core.cache import cache as django_cache

        session_cache_key = f"reader_session:{request.user.id}:{book_id}:{requested_lang or ''}"
        cached_session = django_cache.get(session_cache_key)

        deposit = None
        sub = None

        if cached_session:
            access_result = cached_session["access_result"]
            ouvrage = cached_session["ouvrage"]
            deposit = cached_session.get("deposit")
            sub = cached_session.get("sub")
            effective_config = cached_session["effective_config"]
        else:
            # 1. Vérification des droits d'accès utilisateur avec support multilingue
            access_result = AccessService.check_user_book_access(request.user, book_id, language=requested_lang)
            if not access_result.get("access_granted"):
                return JsonResponse({
                    "success": False,
                    "data": {},
                    "error": access_result.get("error", "Accès non autorisé à cet ouvrage.")
                }, status=status.HTTP_403_FORBIDDEN)

            try:
                ouvrage = Ouvrage.objects.filter(id=book_id).first()
            except Exception:
                # Si book_id n'est pas un UUID valide (ex: slug ou ISBN), tenter une recherche par ISBN
                ouvrage = Ouvrage.objects.filter(isbn=book_id).first()

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
            effective_config = GlobalDrmConfig.get_singleton()

            django_cache.set(session_cache_key, {
                "access_result": access_result,
                "ouvrage": ouvrage,
                "deposit": deposit,
                "sub": sub,
                "effective_config": effective_config,
            }, timeout=300)

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

        # 4. Obtention du dérivé filigrané sur SSD local (ségrégation par langue demandée)
        source_ref = f"{book_id}:{requested_lang}" if requested_lang else str(book_id)
        try:
            cache_file_path, total_size, cache_key = DerivedMaterializer.get_or_create_derived_file_path(
                source_type="catalog_book",
                source_reference=source_ref,
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

        safe_title = (doc_title or "document")[:50].replace('"', '')

        # 5. Délégation Nginx X-Accel-Redirect uniquement si explicitement configuré et supporté par le reverse proxy
        # Sous Coolify/Traefik sans module Nginx interne, le flux Range RFC 7233 par tranches de 128 Ko
        # est servi directement pour éviter tout envoi de corps vide (0 octet) causant un gel de 5 min.
        x_accel_enabled = getattr(settings, 'USE_X_ACCEL_REDIRECT', False)
        has_nginx_accel = bool(request.META.get('HTTP_X_ACCEL_SUPPORT') or request.headers.get('x-accel-support'))
        if x_accel_enabled and has_nginx_accel:
            response = HttpResponse(content_type="application/pdf")
            response["X-Accel-Redirect"] = f"/protected_derived/{cache_key}.pdf"
            response["Content-Disposition"] = f'inline; filename="{safe_title}.pdf"'
            response["Accept-Ranges"] = "bytes"
            response["Access-Control-Expose-Headers"] = "Accept-Ranges, Content-Range, Content-Length"
            response["Cache-Control"] = "private, no-store, must-revalidate"
            response["Pragma"] = "no-cache"
            response["X-Content-Type-Options"] = "nosniff"
            response["X-Frame-Options"] = "SAMEORIGIN"
            return response

        # 6. Détection de requête Range RFC 7233
        range_header = request.META.get("HTTP_RANGE")
        is_range_request = bool(range_header and range_header.startswith("bytes="))

        # Journalisation légale immuable dans TraceAcces (Fiche X3: 1 entrée par session de 5 minutes)
        trace_throttle_key = f"trace_logged:{request.user.id}:{book_id}"
        if not django_cache.get(trace_throttle_key):
            try:
                bouquet_sub_id = access_result.get("bouquet_subscription_id")
                institution_obj = None
                bouquet_sub_obj = None

                if bouquet_sub_id:
                    from apps.partners.models import UniversityBouquetSubscription
                    bouquet_sub_obj = UniversityBouquetSubscription.objects.filter(id=bouquet_sub_id).first()
                    if bouquet_sub_obj:
                        institution_obj = bouquet_sub_obj.institution

                country_code = request.headers.get("CF-IPCountry") or request.META.get("HTTP_CF_IPCOUNTRY", "BJ") or "BJ"
                device_fp = user_info.get("device_fingerprint") or request.META.get("HTTP_USER_AGENT", "")[:255] or f"Navigateur ({request.user.username})"

                TraceAcces.objects.create(
                    user=request.user,
                    ouvrage=ouvrage,
                    document_title=doc_title,
                    ip_address=ip,
                    country=country_code,
                    user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
                    device_fingerprint=device_fp[:255],
                    access_type="read_chunk" if is_range_request else "read_full",
                    institution=institution_obj,
                    bouquet_subscription=bouquet_sub_obj,
                )
                django_cache.set(trace_throttle_key, True, timeout=300)
            except Exception as log_err:
                logger.warning(f"Erreur enregistrement TraceAcces: {log_err}")

        # 7. Streaming non-bloquant depuis le SSD NVMe (Zéro allocation de 60 Mo en RAM)
        if is_range_request:
            start_byte, end_byte = self._parse_range_header(range_header, total_size)

            if start_byte is None or end_byte is None:
                response = HttpResponse(status=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE)
                response["Accept-Ranges"] = "bytes"
                response["Content-Range"] = f"bytes */{total_size}"
                response["Access-Control-Expose-Headers"] = "Accept-Ranges, Content-Range, Content-Length"
                return response

            chunk_length = end_byte - start_byte + 1
            with open(cache_file_path, "rb") as f:
                f.seek(start_byte)
                chunk_data = f.read(chunk_length)

            response = HttpResponse(chunk_data, status=status.HTTP_206_PARTIAL_CONTENT, content_type="application/pdf")
            response["Content-Range"] = f"bytes {start_byte}-{end_byte}/{total_size}"
            response["Content-Length"] = str(chunk_length)
        else:
            from django.http import FileResponse
            response = FileResponse(open(cache_file_path, "rb"), content_type="application/pdf")
            response["Content-Length"] = str(total_size)

        response["Accept-Ranges"] = "bytes"
        response["Access-Control-Expose-Headers"] = "Accept-Ranges, Content-Range, Content-Length"
        response["Cache-Control"] = "private, no-store, must-revalidate"
        response["Pragma"] = "no-cache"
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"] = "SAMEORIGIN"
        response["Content-Disposition"] = f'inline; filename="{safe_title}.pdf"'
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
    pages du vrai fichier, filigranées "EXTRAIT GRATUIT". Accessible publiquement à tout visiteur,
    sans exiger d'achat ni d'abonnement. Supporte le streaming HTTP 206 Range (RFC 7233).
    """
    permission_classes = [AllowAny]
    renderer_classes = [PassthroughStreamRenderer, JSONRenderer]

    def get(self, request, book_id):
        import fitz
        from apps.protection.source_adapter import DocumentSourceAdapter, DocumentSourceError
        from apps.catalog.models import Ouvrage, OuvrageLanguageVersion
        from apps.protection.derived_materializer import DerivedMaterializer

        requested_lang = (request.query_params.get("lang") or request.query_params.get("language") or "").strip().lower()

        import uuid
        is_uuid = False
        try:
            uuid.UUID(str(book_id))
            is_uuid = True
        except (ValueError, AttributeError):
            pass

        try:
            if is_uuid:
                ouvrage = Ouvrage.objects.filter(Q(id=book_id) | Q(slug=book_id) | Q(isbn=book_id), status='published').first()
            else:
                ouvrage = Ouvrage.objects.filter(Q(slug=book_id) | Q(isbn=book_id), status='published').first()
            if not ouvrage:
                return JsonResponse({"success": False, "error": "Ouvrage introuvable."}, status=404)
        except Exception:
            return JsonResponse({"success": False, "error": "Ouvrage introuvable."}, status=404)

        sample_pages = ouvrage.sample_pages_count
        if requested_lang:
            lang_ver = OuvrageLanguageVersion.objects.filter(
                ouvrage=ouvrage, language__iexact=requested_lang
            ).first()
            if lang_ver and lang_ver.page_count > 0:
                pc = lang_ver.page_count
                if pc <= 10:
                    sample_pages = min(5, pc)
                elif pc <= 30:
                    sample_pages = 5
                elif pc <= 50:
                    sample_pages = 7
                elif pc <= 80:
                    sample_pages = 10
                elif pc <= 150:
                    sample_pages = 12
                elif pc <= 300:
                    sample_pages = 15
                else:
                    sample_pages = 20

        cache_dir = DerivedMaterializer._get_cache_dir()
        sample_pdf_dir = os.path.join(cache_dir, "sample_pdfs")
        os.makedirs(sample_pdf_dir, exist_ok=True)
        filename_suffix = f"-{requested_lang}" if requested_lang else ""
        sample_pdf_path = os.path.join(sample_pdf_dir, f"sample_{ouvrage.id}{filename_suffix}.pdf")

        sample_bytes = None
        total_pages = ouvrage.page_count or 100
        page_limit = sample_pages
        if os.path.exists(sample_pdf_path):
            try:
                with open(sample_pdf_path, "rb") as f:
                    sample_bytes = f.read()
            except Exception:
                sample_bytes = None

        if not sample_bytes:
            source_ref = f"{ouvrage.id}:{requested_lang}" if requested_lang else str(ouvrage.id)
            try:
                full_pdf_bytes = DocumentSourceAdapter.get_document_bytes("catalog_book", source_ref)
            except DocumentSourceError as e:
                return JsonResponse({"success": False, "error": str(e)}, status=404)

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
                try:
                    with open(sample_pdf_path, "wb") as f:
                        f.write(sample_bytes)
                except Exception as w_err:
                    logger.debug(f"[BookSampleStream] Écriture cache sample: {w_err}")
            except Exception as e:
                return JsonResponse({"success": False, "error": f"Impossible de générer l'extrait : {e}"}, status=500)

        total_size = len(sample_bytes)
        range_header = request.META.get("HTTP_RANGE")
        if range_header and range_header.startswith("bytes="):
            match = re.match(r"bytes=(\d+)-(\d*)", range_header)
            if match:
                start_str, end_str = match.groups()
                start = int(start_str)
                end = min(int(end_str), total_size - 1) if end_str else total_size - 1
                if start < total_size and start <= end:
                    chunk_length = end - start + 1
                    chunk_data = sample_bytes[start:end + 1]
                    response = HttpResponse(chunk_data, status=status.HTTP_206_PARTIAL_CONTENT, content_type="application/pdf")
                    response["Content-Range"] = f"bytes {start}-{end}/{total_size}"
                    response["Content-Length"] = str(chunk_length)
                else:
                    response = HttpResponse(status=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE)
                    response["Content-Range"] = f"bytes */{total_size}"
                    return response
            else:
                response = HttpResponse(sample_bytes, content_type="application/pdf")
                response["Content-Length"] = str(total_size)
        else:
            response = HttpResponse(sample_bytes, content_type="application/pdf")
            response["Content-Length"] = str(total_size)

        response["Accept-Ranges"] = "bytes"
        response["Content-Disposition"] = f'inline; filename="extrait-{ouvrage.id}{filename_suffix}.pdf"'
        response["X-Sample-Pages"] = str(page_limit)
        response["X-Sample-Total-Pages"] = str(total_pages)
        response["Access-Control-Expose-Headers"] = "Accept-Ranges, Content-Range, Content-Length, X-Sample-Pages, X-Sample-Total-Pages"
        response["Cache-Control"] = "public, max-age=86400, must-revalidate"
        response["X-Content-Type-Options"] = "nosniff"
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
            ouvrage = Ouvrage.objects.filter(Q(id=valid_uuid) | Q(slug=book_id) | Q(isbn=book_id)).first()
        except (ValueError, TypeError):
            ouvrage = Ouvrage.objects.filter(Q(slug=book_id) | Q(isbn=book_id)).first()

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

        # 1.5. Si la couverture WebP existe sur R2 (bucket principal lahatheque)
        try:
            from apps.catalog.services.cover_generator import get_r2_s3_client
            r2_s3 = get_r2_s3_client()
            r2_bucket = getattr(settings, 'CLOUDFLARE_R2_BUCKET_NAME', 'lahatheque')
            cover_key = f"covers/{str(ouvrage.id)}/cover.webp"
            r2_obj = r2_s3.get_object(Bucket=r2_bucket, Key=cover_key)
            img_data = r2_obj['Body'].read()
            response = HttpResponse(img_data, content_type="image/webp")
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


class BookStreamInitiateView(APIView):
    """
    POST /api/v1/catalog/books/<id>/stream/initiate/
    Déclenche la préparation asynchrone du dérivé en tâche de fond si absent du cache.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, book_id):
        from rest_framework.response import Response
        from apps.protection.derived_materializer import DerivedMaterializer
        from apps.protection.models import GlobalDrmConfig
        from django.core.cache import cache as django_cache

        requested_lang = request.query_params.get("lang") or request.query_params.get("language")

        access_result = AccessService.check_user_book_access(request.user, book_id, language=requested_lang)
        if not access_result.get("access_granted"):
            return JsonResponse({
                "success": False,
                "data": {},
                "error": access_result.get("error", "Accès non autorisé à cet ouvrage.")
            }, status=status.HTTP_403_FORBIDDEN)

        source_ref = f"{book_id}:{requested_lang}" if requested_lang else str(book_id)

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
            "title": "",
            "id": book_id,
            "is_partner": False,
        }

        global_config = GlobalDrmConfig.get_singleton()
        cache_key = DerivedMaterializer.compute_user_cache_key(
            source_reference=source_ref,
            user_info=user_info,
            config=global_config
        )
        cache_dir = getattr(settings, "DRM_DERIVED_CACHE_DIR", os.path.join(settings.BASE_DIR, "var", "drm_cache"))
        cache_file_path = os.path.join(cache_dir, f"{cache_key}.pdf")

        if (os.path.exists(cache_file_path) and os.path.getsize(cache_file_path) > 0) or django_cache.get(f"drm_derived:{cache_key}") is not None:
            return Response({"success": True, "data": {"status": "ready"}})

        from apps.protection.tasks import prepare_derived_document_task
        try:
            prepare_derived_document_task.delay("catalog_book", source_ref, user_info, {})
        except Exception:
            import threading
            threading.Thread(
                target=prepare_derived_document_task,
                args=("catalog_book", source_ref, user_info, {}),
                daemon=True
            ).start()

        return Response({"success": True, "data": {"status": "preparing"}})


class BookStreamStatusView(APIView):
    """
    GET /api/v1/catalog/books/<id>/stream/status/
    Interroge le cache pour vérifier si le dérivé est prêt.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, book_id):
        from rest_framework.response import Response
        from apps.protection.derived_materializer import DerivedMaterializer
        from apps.protection.models import GlobalDrmConfig
        from django.core.cache import cache as django_cache

        requested_lang = request.query_params.get("lang") or request.query_params.get("language")
        source_ref = f"{book_id}:{requested_lang}" if requested_lang else str(book_id)

        user_info = {
            "user_id": str(request.user.id),
            "is_partner": False,
        }

        global_config = GlobalDrmConfig.get_singleton()
        cache_key = DerivedMaterializer.compute_user_cache_key(
            source_reference=source_ref,
            user_info=user_info,
            config=global_config
        )
        cache_dir = getattr(settings, "DRM_DERIVED_CACHE_DIR", os.path.join(settings.BASE_DIR, "var", "drm_cache"))
        cache_file_path = os.path.join(cache_dir, f"{cache_key}.pdf")

        is_ready = (os.path.exists(cache_file_path) and os.path.getsize(cache_file_path) > 0) or (django_cache.get(f"drm_derived:{cache_key}") is not None)
        return Response({"success": True, "data": {"status": "ready" if is_ready else "preparing"}})


class BookPageImageView(APIView):
    """
    GET /api/v1/catalog/books/<book_id>/page/
    Sert une page spécifique du document sécurisé sous forme d'image JPEG optimisée.
    Modèle Scribd / Internet Archive : ouverture instantanée de la liseuse 3D sans
    téléchargement du PDF complet côté client.

    Supporte :
    - Le mode complet pour les utilisateurs authentifiés disposant des droits (avec filigrane nominatif).
    - Le mode extrait gratuit (sample) accessible à tout visiteur public pour les pages 1 à N filigranées "EXTRAIT GRATUIT".

    Query params:
      - page   : numéro de page 1-indexé (défaut: 1)
      - lang   : code langue ISO 639-1 (défaut: fr)
      - mode   : 'sample' pour forcer l'extrait gratuit
      - sample : 'true'|'1' pour forcer l'extrait gratuit

    Temps de réponse typique sur NVMe : <30ms (ou <1ms si déjà en cache page disque).
    Taille par page : ~30–60 Ko JPEG.
    """
    permission_classes = [AllowAny]
    renderer_classes = [PassthroughStreamRenderer, JSONRenderer]

    def get(self, request, book_id):
        import fitz
        from django.core.cache import cache as django_cache
        from apps.protection.source_adapter import DocumentSourceAdapter, DocumentSourceError
        from apps.protection.derived_materializer import DerivedMaterializer

        requested_lang = (request.query_params.get("lang") or request.query_params.get("language") or "fr").strip().lower()

        # Numéro de page demandé (1-indexé)
        try:
            page_num = int(request.query_params.get("page", 1))
            if page_num < 1:
                page_num = 1
        except (ValueError, TypeError):
            page_num = 1

        # Résolution de l'ouvrage
        ouvrage = None
        import uuid
        try:
            if uuid.UUID(str(book_id)):
                ouvrage = Ouvrage.objects.filter(id=book_id).first()
        except (ValueError, AttributeError):
            pass
        if not ouvrage:
            ouvrage = Ouvrage.objects.filter(Q(slug=book_id) | Q(isbn=book_id)).first()

        if not ouvrage:
            return JsonResponse({
                "success": False,
                "data": {},
                "error": "Ouvrage introuvable dans le catalogue."
            }, status=status.HTTP_404_NOT_FOUND)

        # Calcul du plafond de pages pour l'extrait gratuit
        sample_pages_limit = ouvrage.sample_pages_count
        if requested_lang:
            from apps.catalog.models import OuvrageLanguageVersion
            lang_ver = OuvrageLanguageVersion.objects.filter(
                ouvrage=ouvrage, language__iexact=requested_lang
            ).first()
            if lang_ver and lang_ver.page_count > 0:
                pc = lang_ver.page_count
                if pc <= 10:
                    sample_pages_limit = min(5, pc)
                elif pc <= 30:
                    sample_pages_limit = 5
                elif pc <= 50:
                    sample_pages_limit = 7
                elif pc <= 80:
                    sample_pages_limit = 10
                elif pc <= 150:
                    sample_pages_limit = 12
                elif pc <= 300:
                    sample_pages_limit = 15
                else:
                    sample_pages_limit = 20

        # Détection du mode extrait gratuit
        is_sample_requested = (
            request.query_params.get("sample") in ("true", "1")
            or request.query_params.get("mode") == "sample"
            or not request.user.is_authenticated
        )

        is_sample = False
        effective_config = None
        if is_sample_requested:
            is_sample = True
        else:
            # Utilisateur authentifié : vérification des droits sur le livre complet
            session_cache_key = f"reader_session:{request.user.id}:{ouvrage.id}:{requested_lang}"
            cached_session = django_cache.get(session_cache_key)
            if cached_session:
                access_result = cached_session["access_result"]
                effective_config = cached_session["effective_config"]
            else:
                access_result = AccessService.check_user_book_access(request.user, ouvrage.id, language=requested_lang)
                from apps.protection.models import GlobalDrmConfig
                effective_config = GlobalDrmConfig.get_singleton()
                if access_result.get("access_granted"):
                    django_cache.set(session_cache_key, {
                        "access_result": access_result,
                        "effective_config": effective_config,
                    }, timeout=300)

            if not access_result.get("access_granted"):
                # Si l'utilisateur n'a pas accès au livre entier, bascule automatique sur l'extrait gratuit
                if page_num <= sample_pages_limit:
                    is_sample = True
                else:
                    return JsonResponse({
                        "success": False,
                        "data": {},
                        "error": access_result.get("error", "Fin de l'extrait gratuit. Achetez l'ouvrage pour poursuivre la lecture.")
                    }, status=status.HTTP_403_FORBIDDEN)

        # ── BRANCHE A : MODE EXTRAIT GRATUIT (SAMPLE) ──
        if is_sample:
            if page_num > sample_pages_limit:
                return JsonResponse({
                    "success": False,
                    "data": {},
                    "error": "Fin de l'extrait gratuit. Achetez l'ouvrage pour poursuivre la lecture."
                }, status=status.HTTP_403_FORBIDDEN)

            cache_dir = DerivedMaterializer._get_cache_dir()
            sample_pages_dir = os.path.join(cache_dir, "sample_pages", str(ouvrage.id), requested_lang)
            os.makedirs(sample_pages_dir, exist_ok=True)
            sample_page_image_path = os.path.join(sample_pages_dir, f"p{page_num}.jpg")

            image_bytes = None
            if os.path.exists(sample_page_image_path):
                try:
                    with open(sample_page_image_path, "rb") as f:
                        image_bytes = f.read()
                except Exception:
                    image_bytes = None

            if not image_bytes:
                source_ref = f"{ouvrage.id}:{requested_lang}" if requested_lang else str(ouvrage.id)
                try:
                    full_pdf_bytes = DocumentSourceAdapter.get_document_bytes("catalog_book", source_ref)
                except DocumentSourceError as e:
                    return JsonResponse({"success": False, "data": {}, "error": str(e)}, status=404)

                try:
                    doc = fitz.open(stream=full_pdf_bytes, filetype="pdf")
                    if page_num > len(doc):
                        doc.close()
                        return JsonResponse({
                            "success": False,
                            "data": {},
                            "error": "Page hors limites."
                        }, status=status.HTTP_404_NOT_FOUND)

                    page = doc[page_num - 1]

                    # Filigrane officiel Extrait Gratuit
                    import math
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

                    pix = page.get_pixmap(dpi=140)
                    image_bytes = pix.tobytes("jpg", jpg_quality=85)
                    doc.close()

                    try:
                        with open(sample_page_image_path, "wb") as f:
                            f.write(image_bytes)
                    except Exception as w_err:
                        logger.debug(f"[BookPageImage] Non bloquant - écriture cache sample: {w_err}")
                except Exception as render_err:
                    logger.error(f"[BookPageImage] Erreur rendu page extrait {page_num}: {render_err}")
                    return JsonResponse({
                        "success": False,
                        "data": {},
                        "error": "Erreur lors du rendu de la page d'extrait."
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            resp = HttpResponse(image_bytes, content_type="image/jpeg")
            resp["Cache-Control"] = "public, max-age=86400, must-revalidate"
            resp["Content-Length"] = str(len(image_bytes))
            resp["Access-Control-Expose-Headers"] = "Content-Length, Content-Type, X-Sample-Pages"
            resp["X-Sample-Pages"] = str(sample_pages_limit)
            resp["X-Content-Type-Options"] = "nosniff"
            return resp

        # ── BRANCHE B : MODE COMPLET SÉCURISÉ (AUTHENTIFIÉ AVEC DROITS) ──
        ip = request.META.get("HTTP_X_FORWARDED_FOR")
        if ip:
            ip = ip.split(",")[0].strip()
        else:
            ip = request.META.get("REMOTE_ADDR", "127.0.0.1")

        doc_title = getattr(ouvrage, "title", None) or "Document"
        user_info = {
            "nom": request.user.get_full_name() or request.user.username,
            "email": request.user.email,
            "ip": ip,
            "user_id": str(request.user.id),
            "device_fingerprint": request.headers.get("X-Device-Fingerprint", ""),
            "title": doc_title,
            "id": str(ouvrage.id),
            "is_partner": False,
        }

        # Matérialisation du dérivé PDF filigrané sur disque NVMe
        source_ref = f"{ouvrage.id}:{requested_lang}" if requested_lang else str(ouvrage.id)
        if not effective_config:
            from apps.protection.models import GlobalDrmConfig
            effective_config = GlobalDrmConfig.get_singleton()
        try:
            cache_file_path, total_size, cache_key = DerivedMaterializer.get_or_create_derived_file_path(
                source_type="catalog_book",
                source_reference=source_ref,
                user_info=user_info,
                config=effective_config,
            )
        except Exception as e:
            logger.error(f"[BookPageImage] Erreur matérialisation ({book_id}): {e}")
            return JsonResponse({
                "success": False,
                "data": {},
                "error": "Impossible de charger le document sécurisé."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Cache disque NVMe pour les images de pages individuelles
        cache_dir = DerivedMaterializer._get_cache_dir()
        pages_dir = os.path.join(cache_dir, "pages", cache_key)
        os.makedirs(pages_dir, exist_ok=True)
        page_image_path = os.path.join(pages_dir, f"p{page_num}.jpg")

        image_bytes = None
        if os.path.exists(page_image_path):
            try:
                with open(page_image_path, "rb") as f:
                    image_bytes = f.read()
            except Exception:
                image_bytes = None

        if not image_bytes:
            try:
                doc = fitz.open(cache_file_path)
                if page_num > len(doc):
                    doc.close()
                    return JsonResponse({
                        "success": False,
                        "data": {},
                        "error": "Page hors limites."
                    }, status=status.HTTP_404_NOT_FOUND)
                page = doc[page_num - 1]
                pix = page.get_pixmap(dpi=140)
                image_bytes = pix.tobytes("jpg", jpg_quality=85)
                doc.close()
                try:
                    with open(page_image_path, "wb") as f:
                        f.write(image_bytes)
                except Exception as w_err:
                    logger.debug(f"[BookPageImage] Non bloquant - écriture cache page: {w_err}")
            except Exception as render_err:
                logger.error(f"[BookPageImage] Erreur rendu page {page_num}: {render_err}")
                return JsonResponse({
                    "success": False,
                    "data": {},
                    "error": "Erreur lors du rendu de la page."
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        resp = HttpResponse(image_bytes, content_type="image/jpeg")
        resp["Cache-Control"] = "private, max-age=86400, must-revalidate"
        resp["Content-Length"] = str(len(image_bytes))
        resp["Access-Control-Expose-Headers"] = "Content-Length, Content-Type"
        resp["X-Content-Type-Options"] = "nosniff"
        return resp



