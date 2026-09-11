"""
Vues de gestion de la protection DRM, traçabilité légale et annotations.
Conforme au format d'API unifié LAHAThèque: { success, data, error }.
"""

import uuid
import logging
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import action
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

logger = logging.getLogger(__name__)

from .models import Annotation, ProtectionConfig, TraceAcces, GlobalDrmConfig, ForensicInvestigation
from .serializers import (
    AnnotationSerializer,
    ProtectionConfigSerializer,
    TraceAccesSerializer,
    GlobalDrmConfigSerializer,
    ForensicInvestigationSerializer,
)
from .permissions import IsAnnotationOwner, IsAdminOrStaff, IsAdminOnly
from .lcp_client import LCPClient
from .access_service import AccessService
from .forensic_service import ForensicService



class ReadBookView(APIView):
    """Vérifie les droits d'accès avant d'autoriser l'ouverture du lecteur."""
    permission_classes = [IsAuthenticated]

    def get(self, request, book_id):
        result = AccessService.check_user_book_access(request.user, book_id)
        if result.get("access_granted"):
            return Response({
                "success": True,
                "data": result,
                "error": None
            }, status=status.HTTP_200_OK)

        return Response({
            "success": False,
            "data": {},
            "error": result.get("error", "Accès non autorisé à cet ouvrage.")
        }, status=status.HTTP_403_FORBIDDEN)


class LCPLicenseView(APIView):
    """Génère la structure de licence LCP pour un utilisateur et un ouvrage."""
    permission_classes = [IsAuthenticated]

    def get(self, request, book_id):
        client = LCPClient()
        license_data = client.generate_license(request.user.id, book_id)
        return Response({
            "success": True,
            "data": license_data,
            "error": None
        })


class TraceAccesView(APIView):
    """Enregistre un événement de lecture côté client dans TraceAcces."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ip = request.META.get("HTTP_X_FORWARDED_FOR")
        if ip:
            ip = ip.split(",")[0].strip()
        else:
            ip = request.META.get("REMOTE_ADDR", "127.0.0.1")

        ouvrage_id = request.data.get("ouvrage") or request.data.get("book_id")
        page_number = request.data.get("page_number") or request.data.get("page")
        access_type = request.data.get("access_type", "read_online")

        trace = TraceAcces.objects.create(
            user=request.user,
            ouvrage_id=ouvrage_id,
            ip_address=ip,
            country=request.headers.get("CF-IPCountry", request.data.get("country", "")),
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
            device_fingerprint=request.data.get("device_fingerprint", "")[:255],
            access_type=access_type,
            page_number=page_number,
        )

        return Response({
            "success": True,
            "data": {"trace_id": str(trace.id), "recorded": True},
            "error": None
        }, status=status.HTTP_201_CREATED)


class TraceAccesViewSet(ReadOnlyModelViewSet):
    """Consultation et filtrage des traces d'accès et sessions DRM pour l'Administrateur."""
    serializer_class = TraceAccesSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        qs = TraceAcces.objects.select_related("user", "ouvrage").all()
        user_id = self.request.query_params.get("user")
        ouvrage_id = self.request.query_params.get("ouvrage")
        country = self.request.query_params.get("country")
        access_type = self.request.query_params.get("access_type")

        if user_id:
            qs = qs.filter(user_id=user_id)
        if ouvrage_id:
            qs = qs.filter(ouvrage_id=ouvrage_id)
        if country:
            qs = qs.filter(country__iexact=country)
        if access_type:
            qs = qs.filter(access_type=access_type)

        return qs

    def list(self, request, *args, **kwargs):
        results = []

        # 1. Agrégation prioritaire des sessions de lecture réelles ReaderSession (31+ sessions actives)
        try:
            from apps.reader.models import ReaderSession
            sessions = ReaderSession.objects.select_related("partner", "end_user", "ouvrage").order_by("-created_at")[:300]
            for s in sessions:
                title = s.ouvrage.titre if (s.ouvrage and hasattr(s.ouvrage, "titre") and s.ouvrage.titre) else (
                    s.ouvrage.title if (s.ouvrage and hasattr(s.ouvrage, "title") and s.ouvrage.title) else (
                        s.custom_document_title or "Document Sécurisé"
                    )
                )
                partner_name = s.partner.name if s.partner else "LAHAThèque"
                u_name = s.end_user.display_name if (s.end_user and s.end_user.display_name) else (
                    partner_name if s.partner else "Lecteur Authentifié"
                )
                u_email = s.end_user.email if (s.end_user and s.end_user.email) else (
                    f"contact@{partner_name.lower().replace(' ', '')}.com"
                )

                student_ip = "127.0.0.1"
                country = "BJ"
                if isinstance(s.metadata, dict):
                    student_ip = str(s.metadata.get("user_ip") or s.metadata.get("ip") or "127.0.0.1")
                    country = str(s.metadata.get("country") or "BJ")

                total_pages = 1
                if s.ouvrage and hasattr(s.ouvrage, "nombre_pages") and s.ouvrage.nombre_pages:
                    total_pages = s.ouvrage.nombre_pages
                elif isinstance(s.metadata, dict) and s.metadata.get("total_pages"):
                    try:
                        total_pages = int(s.metadata["total_pages"])
                    except (ValueError, TypeError):
                        total_pages = 1

                current_page = s.last_page or 1
                if total_pages <= 1 and current_page > 1:
                    total_pages = current_page

                progress_percent = int((current_page / max(total_pages, 1)) * 100)
                if progress_percent > 100:
                    progress_percent = 100

                duration_minutes = int(s.reading_time_seconds / 60) if s.reading_time_seconds else 0

                cover_url = ""
                if s.ouvrage and hasattr(s.ouvrage, "cover_image") and s.ouvrage.cover_image:
                    try:
                        cover_url = s.ouvrage.cover_image.url
                    except Exception:
                        cover_url = ""

                results.append({
                    "id": str(s.id),
                    "user_email": u_email,
                    "user_name": u_name,
                    "partner_name": partner_name,
                    "book_title": title,
                    "book_id": str(s.ouvrage_id or "byod-doc"),
                    "cover_url": cover_url,
                    "access_type": "read_chunk",
                    "ip_address": student_ip,
                    "country": country,
                    "device_fingerprint": (s.metadata.get("user_agent") if isinstance(s.metadata, dict) else None) or f"Web ({partner_name})",
                    "current_page": current_page,
                    "total_pages": total_pages,
                    "progress_percent": progress_percent,
                    "reading_time_minutes": duration_minutes,
                    "timestamp": s.created_at.isoformat() if s.created_at else timezone.now().isoformat(),
                })
        except Exception as sess_err:
            logger.warning(f"Erreur agrégation ReaderSession dans TraceAcces: {sess_err}")

        # 2. Ajout des traces d'accès TraceAcces réelles (Lectures directes sur LAHAThèque)
        traces_qs = self.get_queryset().select_related("user", "ouvrage").order_by("-timestamp")[:150]

        # Pré-chargement optimisé des progressions et sessions de lecture réelles
        user_ids = [t.user_id for t in traces_qs if t.user_id]
        ouvrage_ids = [t.ouvrage_id for t in traces_qs if t.ouvrage_id]

        progress_map = {}
        session_time_map = {}
        try:
            from apps.student.models import ReadingProgress, ReadingSession
            from django.db.models import Sum

            if user_ids and ouvrage_ids:
                rp_qs = ReadingProgress.objects.filter(user_id__in=user_ids, ouvrage_id__in=ouvrage_ids)
                for rp in rp_qs:
                    progress_map[(rp.user_id, rp.ouvrage_id)] = rp

                rs_agg = ReadingSession.objects.filter(
                    user_id__in=user_ids, ouvrage_id__in=ouvrage_ids
                ).values("user_id", "ouvrage_id").annotate(total_sec=Sum("duration_seconds"))
                for row in rs_agg:
                    session_time_map[(row["user_id"], row["ouvrage_id"])] = row["total_sec"] or 0
        except Exception as prog_err:
            logger.warning(f"Erreur pré-chargement ReadingProgress: {prog_err}")

        for t in traces_qs:
            t_id = str(t.id)
            if any(r["id"] == t_id for r in results):
                continue

            u_email = t.user.email if t.user else "lecteur@lahatheque.com"
            u_name = f"{t.user.first_name} {t.user.last_name}".strip() if t.user else "Lecteur Client"
            b_title = t.ouvrage.title if (t.ouvrage and hasattr(t.ouvrage, "title")) else (t.document_title or "Ouvrage Académique")

            # Couverture réelle de l'ouvrage
            cover_url = ""
            if t.ouvrage and hasattr(t.ouvrage, "cover_image") and t.ouvrage.cover_image:
                try:
                    cover_url = t.ouvrage.cover_image.url
                except Exception:
                    cover_url = ""

            # Nombre total de pages réel
            total_pages = 1
            if t.ouvrage and hasattr(t.ouvrage, "nombre_pages") and t.ouvrage.nombre_pages:
                total_pages = t.ouvrage.nombre_pages
            elif t.ouvrage and hasattr(t.ouvrage, "pages") and t.ouvrage.pages:
                total_pages = t.ouvrage.pages

            # Progression réelle de lecture
            rp = progress_map.get((t.user_id, t.ouvrage_id)) if (t.user_id and t.ouvrage_id) else None
            current_page = t.page_number or 1

            if rp:
                current_page = rp.current_page or current_page
                if rp.total_pages and rp.total_pages > 0:
                    total_pages = rp.total_pages
                prog_pct = rp.progress_percent if rp.progress_percent is not None else int((current_page / max(total_pages, 1)) * 100)
            else:
                prog_pct = int((current_page / max(total_pages, 1)) * 100) if total_pages > 1 else (100 if current_page >= 1 else 0)

            prog_pct = max(0, min(100, prog_pct))

            # Temps de lecture réel cumulé
            total_sec = session_time_map.get((t.user_id, t.ouvrage_id), 0)
            reading_time_mins = max(1, int(total_sec // 60)) if total_sec > 0 else 1

            results.append({
                "id": t_id,
                "user_email": u_email,
                "user_name": u_name or u_email,
                "partner_name": "Accès Direct",
                "book_title": b_title,
                "book_id": str(t.ouvrage_id or ""),
                "cover_url": cover_url,
                "access_type": t.access_type or "read_chunk",
                "ip_address": t.ip_address or "127.0.0.1",
                "country": t.country or "BJ",
                "device_fingerprint": t.user_agent or t.device_fingerprint or "Lecteur Web DRM",
                "current_page": current_page,
                "total_pages": total_pages,
                "progress_percent": prog_pct,
                "reading_time_minutes": reading_time_mins,
                "timestamp": t.timestamp.isoformat() if t.timestamp else timezone.now().isoformat(),
            })

        # Tri chronologique décroissant
        results.sort(key=lambda x: x["timestamp"], reverse=True)

        return Response({
            "success": True,
            "data": results,
            "error": None
        })


class ProtectionConfigViewSet(ModelViewSet):
    """Configuration DRM par ouvrage pour l'Éditeur et l'Administrateur."""
    serializer_class = ProtectionConfigSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = ProtectionConfig.objects.select_related("ouvrage").all()
        ouvrage_id = self.request.query_params.get("ouvrage") or self.request.query_params.get("book_id")
        if ouvrage_id:
            qs = qs.filter(ouvrage_id=ouvrage_id)
        return qs

    def perform_update(self, serializer):
        # Incrémenter la version de configuration pour invalider automatiquement les caches dérivés
        instance = serializer.save()
        instance.config_version += 1
        instance.save(update_fields=["config_version"])

    @action(detail=False, methods=['get', 'patch'], url_path='by-book/(?P<book_id>[^/.]+)')
    def by_book(self, request, book_id=None):
        from apps.catalog.models import Ouvrage
        ouvrage = Ouvrage.objects.filter(id=book_id).first()
        if not ouvrage:
            return Response({"success": False, "error": "Ouvrage introuvable."}, status=status.HTTP_404_NOT_FOUND)

        config, _ = ProtectionConfig.objects.get_or_create(ouvrage=ouvrage)

        if request.method.lower() == 'patch':
            data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            # Accepter à la fois la nomenclature frontend (ProtectionConfigCard) et modèle Django
            if "watermark_enabled" in data:
                config.watermark_visible = bool(data["watermark_enabled"])
            if "watermark_visible" in data:
                config.watermark_visible = bool(data["watermark_visible"])
            if "watermark_position" in data:
                config.watermark_position = str(data["watermark_position"])
            if "watermark_opacity" in data:
                try:
                    val = float(data["watermark_opacity"])
                    config.watermark_opacity = (val / 100.0) if val > 1.0 else val
                except (ValueError, TypeError):
                    pass
            if "lcp_drm_enabled" in data:
                config.lcp_drm_enabled = bool(data["lcp_drm_enabled"])
            if "disable_copy_paste" in data:
                config.allow_copy = not bool(data["disable_copy_paste"])
            if "allow_copy" in data:
                config.allow_copy = bool(data["allow_copy"])
            if "disable_print" in data:
                config.allow_print = not bool(data["disable_print"])
            if "allow_print" in data:
                config.allow_print = bool(data["allow_print"])
            if "max_allowed_devices" in data:
                try:
                    config.max_devices_per_user = int(data["max_allowed_devices"])
                except (ValueError, TypeError):
                    pass
            if "max_loan_days" in data:
                try:
                    config.loan_duration_days = int(data["max_loan_days"])
                except (ValueError, TypeError):
                    pass

            config.config_version += 1
            config.save()

        # Retourner avec format unifié + champs pratiques frontend
        raw_opacity = float(config.watermark_opacity or 0.20)
        opacity_pct = int(raw_opacity * 100) if raw_opacity <= 1.0 else int(raw_opacity)

        resp_data = {
            "id": config.id,
            "ouvrage": str(ouvrage.id),
            "book_title": ouvrage.title,
            "profil": config.profil,
            "allow_print": config.allow_print,
            "allow_copy": config.allow_copy,
            "allow_download": config.allow_download,
            "watermark_visible": config.watermark_visible,
            "watermark_position": config.watermark_position,
            "watermark_opacity": opacity_pct,
            "invisible_watermark_enabled": config.invisible_watermark_enabled,
            "max_devices_per_user": config.max_devices_per_user,
            "loan_duration_days": config.loan_duration_days,
            "lcp_drm_enabled": config.lcp_drm_enabled,
            "config_version": config.config_version,
            # Format standard pour ProtectionConfigCard :
            "watermark_enabled": config.watermark_visible,
            "disable_copy_paste": not config.allow_copy,
            "disable_print": not config.allow_print,
            "max_allowed_devices": config.max_devices_per_user,
            "max_loan_days": config.loan_duration_days,
            "user_watermarking": config.invisible_watermark_enabled,
            "audio_encryption_auto": True,
            "access_tracing_auto": True,
        }

        return Response({
            "success": True,
            "data": resp_data,
            "message": "Configuration DRM de l'ouvrage enregistrée avec succès."
        })


class AnnotationViewSet(ModelViewSet):
    """Annotations et surlignages personnels de l'utilisateur."""
    serializer_class = AnnotationSerializer
    permission_classes = [IsAuthenticated, IsAnnotationOwner]

    def get_queryset(self):
        qs = Annotation.objects.filter(user=self.request.user)
        ouvrage_id = self.request.query_params.get('ouvrage') or self.request.query_params.get('book')
        if ouvrage_id:
            try:
                uuid.UUID(str(ouvrage_id))
                qs = qs.filter(ouvrage_id=ouvrage_id)
            except (ValueError, TypeError):
                # Si ouvrage_id n'est pas un UUID valide (ex: 'lesson_pdf' pour un contrat), retourner queryset vide
                return qs.none()
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class GlobalDrmConfigView(APIView):
    """
    Vue singleton pour la configuration DRM globale du catalogue.
    GET  → retourne la configuration globale (tout utilisateur authentifié — nécessaire pour le lecteur).
    PATCH → met à jour partiellement et incrémente config_version pour invalider les dérivés (Admin/Staff).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cfg = GlobalDrmConfig.get_singleton()
        serializer = GlobalDrmConfigSerializer(cfg)
        return Response({
            "success": True,
            "data": serializer.data,
            "error": None,
        })

    def patch(self, request):
        # Le PATCH reste réservé aux admins/staff
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {"success": False, "data": {}, "error": "Accès réservé aux administrateurs."},
                status=status.HTTP_403_FORBIDDEN,
            )
        cfg = GlobalDrmConfig.get_singleton()
        serializer = GlobalDrmConfigSerializer(cfg, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({
                "success": False,
                "data": {},
                "error": serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        instance = serializer.save()
        # Invalider les dérivés mis en cache en incrémentant la version
        instance.config_version = (instance.config_version or 0) + 1
        instance.save(update_fields=["config_version"])

        return Response({
            "success": True,
            "data": GlobalDrmConfigSerializer(instance).data,
            "error": None,
        })


class ForensicAnalyzeView(APIView):
    """
    Analyse un document suspect (PDF, capture d'écran, photographie) pour extraire
    le tatouage stéganographique ou le filigrane semi-transparent et identifier le compte source.
    Accessible STRICTEMENT aux administrateurs et super-administrateurs.
    """
    permission_classes = [IsAuthenticated, IsAdminOnly]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response(
                {"success": False, "data": {}, "error": "Aucun fichier suspect n'a été fourni."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Limite de taille à 50 Mo
        max_size_bytes = 50 * 1024 * 1024
        if uploaded_file.size > max_size_bytes:
            return Response(
                {"success": False, "data": {}, "error": "Le fichier dépasse la taille maximale autorisée (50 Mo)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        notes = request.data.get("notes", "")
        file_bytes = uploaded_file.read()
        file_name = uploaded_file.name or "document_suspect"

        try:
            result = ForensicService.analyze_evidence(
                file_bytes=file_bytes,
                file_name=file_name,
                admin_user=request.user,
                notes=notes
            )
            return Response({"success": True, "data": result, "error": None}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"[FORENSIC ERROR] Erreur analyse preuve: {e}", exc_info=True)
            return Response(
                {"success": False, "data": {}, "error": f"Erreur lors de l'analyse forensique : {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ForensicMitigateView(APIView):
    """
    Applique une sanction immédiate sur le compte d'un lecteur convaincu de fuite :
    suspension de compte et/ou révocation instantanée de toutes ses sessions de lecture.
    Accessible STRICTEMENT aux administrateurs.
    """
    permission_classes = [IsAuthenticated, IsAdminOnly]
    parser_classes = [JSONParser]

    def post(self, request):
        investigation_id = request.data.get("investigation_id")
        action_type = request.data.get("action")
        reason = request.data.get("reason", "")

        if not investigation_id or not action_type:
            return Response(
                {"success": False, "data": {}, "error": "Les paramètres 'investigation_id' et 'action' sont obligatoires."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            result = ForensicService.mitigate_infraction(
                investigation_id=investigation_id,
                action=action_type,
                reason=reason,
                admin_user=request.user
            )
            return Response({"success": True, "data": result, "error": None}, status=status.HTTP_200_OK)
        except ValueError as ve:
            return Response({"success": False, "data": {}, "error": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"[FORENSIC ERROR] Erreur action d'atténuation: {e}", exc_info=True)
            return Response(
                {"success": False, "data": {}, "error": f"Erreur lors de l'application de la sanction : {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ForensicReportView(APIView):
    """
    Génère et télécharge le procès-verbal d'investigation forensique certifié en PDF.
    Accessible STRICTEMENT aux administrateurs.
    """
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get(self, request, investigation_id):
        try:
            pdf_bytes = ForensicService.generate_certified_report(str(investigation_id))
            filename = f"rapport_forensique_LAHA_{str(investigation_id)[:8]}.pdf"
            response = HttpResponse(pdf_bytes, content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="{filename}"'
            return response
        except ValueError as ve:
            return Response({"success": False, "data": {}, "error": str(ve)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"[FORENSIC ERROR] Erreur génération rapport PDF: {e}", exc_info=True)
            return Response(
                {"success": False, "data": {}, "error": f"Erreur génération du rapport PDF : {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ForensicInvestigationViewSet(ReadOnlyModelViewSet):
    """
    Consultation de l'historique et du journal d'audit des investigations forensiques.
    Accessible STRICTEMENT aux administrateurs.
    """
    serializer_class = ForensicInvestigationSerializer
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get_queryset(self):
        return ForensicInvestigation.objects.select_related("admin_user", "suspect_user", "ouvrage").all()

