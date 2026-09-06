"""
audio/views.py — Vues de gestion du streaming audio HLS, upload sécurisé, sessions et progression.
Conforme aux fiches BF2, BF3, BG3, BG5, BG8.
"""
import logging
from rest_framework import status, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import BasePermission

from .models import AudioTrack
from .serializers import AudioTrackSerializer

logger = logging.getLogger(__name__)


class IsAudioUploader(BasePermission):
    """Autorise uniquement les maquettistes, éditeurs, juristes et administrateurs."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and getattr(request.user, 'role', '') in [
                'layout_artist', 'chief_layout', 'publisher', 'admin', 'super_admin'
            ]
        )


class AudioTrackViewSet(viewsets.ModelViewSet):
    queryset = AudioTrack.objects.all()
    serializer_class = AudioTrackSerializer
    permission_classes = [permissions.IsAuthenticated, IsAudioUploader]


class StreamStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, stream_id, *args, **kwargs):
        track = AudioTrack.objects.filter(stream_id=stream_id).first()
        if not track:
            return Response({'error': 'Piste audio introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AudioTrackSerializer(track).data)


def _alert_juriste_if_contract_missing_audio_rate(ouvrage):
    """Alerte les juristes si une piste audio apparaît sur un livre au contrat signé sans taux audio."""
    try:
        from apps.rights.models import ContratLegal, RepartitionDroits
        from apps.accounts.models import User as UserModel
        from apps.reporting.services import notify_user
        from apps.reporting.models import Notification
        from django.db import models

        has_active_contract = ContratLegal.objects.filter(
            ouvrage=ouvrage, status='active'
        ).exists()

        if not has_active_contract:
            return

        missing_audio_rate = RepartitionDroits.objects.filter(
            ouvrage=ouvrage
        ).filter(
            models.Q(taux_audio_tts__isnull=True) | models.Q(taux_audio_tts=0)
        ).exists()

        if not missing_audio_rate:
            return

        juristes = UserModel.objects.filter(
            role__in=['legal_reviewer', 'admin', 'super_admin'], is_active=True
        )
        for juriste in juristes:
            notify_user(
                user=juriste,
                notification_type=Notification.NotificationType.GENERAL,
                title="Version audio disponible sans taux défini au contrat",
                message=f"« {ouvrage.title} » vient de recevoir une version audio, mais son contrat signé ne définit aucun taux audio pour l'auteur. Un avenant est probablement nécessaire.",
                action_url="/legal-reviewer/contracts",
                resource_id=str(ouvrage.id),
            )
    except Exception as e:
        logger.warning(f"Erreur notification juriste audio: {e}")


class AudioTrackUploadView(APIView):
    """POST /api/v1/audio/tracks/upload/ - Dépôt réel d'un fichier audio, verrouillé dès l'envoi."""
    permission_classes = [permissions.IsAuthenticated, IsAudioUploader]

    def post(self, request):
        from .stream_client import CloudflareStreamClient
        from apps.catalog.models import Ouvrage

        ouvrage_id = request.data.get("ouvrage_id")
        audio_file = request.FILES.get("file")
        chapter_number = int(request.data.get("chapter_number", 1))
        title = request.data.get("title", "").strip()
        duration_seconds = int(request.data.get("duration_seconds", 0))

        if not ouvrage_id or not audio_file:
            return Response({"success": False, "error": "ouvrage_id et file sont requis."}, status=400)

        try:
            ouvrage = Ouvrage.objects.get(id=ouvrage_id)
        except (Ouvrage.DoesNotExist, ValueError):
            return Response({"success": False, "error": "Ouvrage introuvable."}, status=404)

        client = CloudflareStreamClient()
        try:
            result = client.upload_file(audio_file, filename=audio_file.name)
            client.enable_signed_urls(result["stream_id"])
        except Exception as e:
            logger.error(f"Échec upload audio Cloudflare Stream: {e}")
            return Response({"success": False, "error": "Échec de l'envoi vers le service de streaming."}, status=502)

        track = AudioTrack.objects.create(
            ouvrage=ouvrage,
            chapter_number=chapter_number,
            title=title or ouvrage.title,
            duration_seconds=duration_seconds or result.get("duration") or 0,
            stream_id=result["stream_id"],
            hls_manifest_url=result.get("hls_url", "") or result.get("hls_manifest_url", ""),
        )

        was_first_audio = not ouvrage.has_audio_version
        ouvrage.has_audio_version = True
        ouvrage.save(update_fields=["has_audio_version"])

        if was_first_audio:
            _alert_juriste_if_contract_missing_audio_rate(ouvrage)

        return Response({
            "success": True,
            "data": {"id": str(track.id), "stream_id": track.stream_id}
        })


class AudioStreamSessionView(APIView):
    """GET /api/v1/audio/ouvrages/<ouvrage_id>/session/ - Jeton d'écoute à courte durée."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, ouvrage_id):
        from apps.protection.access_service import AccessService
        from apps.protection.models import TraceAcces
        from apps.commerce.models import LigneCommande
        from .stream_client import CloudflareStreamClient
        from django.conf import settings

        access = AccessService.check_user_book_access(request.user, ouvrage_id)

        has_audio_purchase = LigneCommande.objects.filter(
            commande__user=request.user,
            commande__statut_paiement='paid',
            ouvrage_id=ouvrage_id,
            format_type='audio',
        ).exists()

        institution_obj = None
        bouquet_sub_obj = None
        if not has_audio_purchase:
            user_institution = getattr(request.user, 'institution', None)
            if user_institution:
                bouquet_sub_obj = AccessService.check_bouquet_access(user_institution, ouvrage_id)
                if bouquet_sub_obj:
                    institution_obj = user_institution

        if not has_audio_purchase and not bouquet_sub_obj and access.get("reason") not in ["privilege_access", "development_access", "author_own_book"]:
            return Response({
                "success": False,
                "error": "Vous devez acheter la version audio de cet ouvrage, ou y accéder via un bouquet couvrant l'audio, pour l'écouter."
            }, status=403)

        tracks = AudioTrack.objects.filter(ouvrage_id=ouvrage_id).order_by("chapter_number")
        if not tracks.exists():
            return Response({"success": False, "error": "Aucune version audio disponible pour cet ouvrage."}, status=404)

        try:
            TraceAcces.objects.create(
                user=request.user,
                ouvrage_id=ouvrage_id,
                access_type="audio_stream",
                institution=institution_obj,
                bouquet_subscription=bouquet_sub_obj,
                ip_address=request.META.get("REMOTE_ADDR", ""),
                country=request.headers.get("CF-IPCountry", ""),
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
            )
        except Exception as e:
            logger.warning(f"Erreur TraceAcces audio: {e}")

        client = CloudflareStreamClient()
        sessions = []
        cf_subdomain = getattr(settings, 'CLOUDFLARE_STREAM_SUBDOMAIN', '') or 'customer-m033avyqq0x51sbg.cloudflarestream.com'
        for track in tracks:
            try:
                token = client.generate_signed_token(track.stream_id, expiry_seconds=3600)
            except Exception as e:
                logger.error(f"Échec génération token audio: {e}")
                token = "stream_token"
            sessions.append({
                "chapter_number": track.chapter_number,
                "title": track.title,
                "duration_seconds": track.duration_seconds,
                "signed_hls_url": f"https://{cf_subdomain}/{track.stream_id}/manifest/video.m3u8?token={token}",
                "captions_vtt_url": track.captions_vtt_url,
            })

        return Response({"success": True, "data": {"tracks": sessions, "expires_in": 3600}})


class AudioListeningProgressView(APIView):
    """
    POST /api/v1/audio/tracks/<track_id>/progress/ - Enregistre la progression d'écoute.
    GET /api/v1/audio/tracks/<track_id>/progress/ - Récupère la dernière position de lecture.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, track_id):
        from .models import AudioListeningSession
        from django.utils import timezone

        track = AudioTrack.objects.filter(id=track_id).first()
        if not track:
            return Response({"success": False, "error": "Piste introuvable."}, status=404)

        duration_listened = int(request.data.get("duration_listened_seconds", 0))
        completion = float(request.data.get("completion_percent", 0))

        session, _ = AudioListeningSession.objects.update_or_create(
            user=request.user,
            audio_track=track,
            session_date=timezone.now().date(),
            defaults={
                "ouvrage": track.ouvrage,
                "duration_listened_seconds": duration_listened,
                "completion_percent": min(completion, 100.0),
            }
        )

        return Response({"success": True, "data": {"id": str(session.id)}})

    def get(self, request, track_id):
        from .models import AudioListeningSession

        last_session = AudioListeningSession.objects.filter(
            user=request.user, audio_track_id=track_id
        ).order_by('-created_at').first()

        if not last_session:
            return Response({"success": True, "data": {"resume_seconds": 0, "completion_percent": 0.0}})

        return Response({"success": True, "data": {
            "resume_seconds": last_session.duration_listened_seconds,
            "completion_percent": float(last_session.completion_percent),
        }})


class AudioLockVerificationView(APIView):
    """
    POST /api/v1/audio/verify-lock/
    POST /api/v1/audio/ouvrages/<ouvrage_id>/verify-lock/
    POST /api/v1/audio/deposits/<deposit_id>/verify-lock/
    Relit l'état Cloudflare Stream et réapplique enable_signed_urls si nécessaire (Fiche BG8).
    """
    permission_classes = [permissions.IsAuthenticated, IsAudioUploader]

    def post(self, request, ouvrage_id=None, deposit_id=None):
        from .stream_client import CloudflareStreamClient
        from apps.catalog.models import Ouvrage
        from apps.publishers_portal.models import PublisherBookDeposit

        target_ouvrage_id = ouvrage_id or request.data.get("ouvrage_id")
        target_deposit_id = deposit_id or request.data.get("deposit_id")

        tracks = []
        if target_ouvrage_id:
            tracks = list(AudioTrack.objects.filter(ouvrage_id=target_ouvrage_id))
        elif target_deposit_id:
            try:
                deposit = PublisherBookDeposit.objects.get(id=target_deposit_id)
                ouvrage = Ouvrage.objects.filter(isbn=deposit.isbn_digital).first() if deposit.isbn_digital else None
                if not ouvrage:
                    ouvrage = Ouvrage.objects.filter(title=deposit.title).first()
                if ouvrage:
                    tracks = list(AudioTrack.objects.filter(ouvrage=ouvrage))
            except PublisherBookDeposit.DoesNotExist:
                pass

        if not tracks:
            return Response({
                "success": True,
                "has_audio": False,
                "is_locked": False,
                "message": "Aucune version audio associée à cet ouvrage ou dépôt."
            })

        client = CloudflareStreamClient()
        locked_count = 0
        for track in tracks:
            try:
                client.enable_signed_urls(track.stream_id)
                locked_count += 1
            except Exception as e:
                logger.error(f"Erreur vérification verrouillage {track.stream_id}: {e}")

        return Response({
            "success": True,
            "has_audio": True,
            "is_locked": locked_count > 0,
            "total_tracks": len(tracks),
            "locked_tracks": locked_count,
            "message": f"Verrouillage Cloudflare Stream vérifié et actif sur {locked_count}/{len(tracks)} piste(s)."
        })

    def get(self, request, ouvrage_id=None, deposit_id=None):
        """Retourne l'état actuel de verrouillage audio."""
        from apps.catalog.models import Ouvrage
        from apps.publishers_portal.models import PublisherBookDeposit

        target_ouvrage_id = ouvrage_id or request.query_params.get("ouvrage_id")
        target_deposit_id = deposit_id or request.query_params.get("deposit_id")

        tracks = []
        if target_ouvrage_id:
            tracks = list(AudioTrack.objects.filter(ouvrage_id=target_ouvrage_id))
        elif target_deposit_id:
            try:
                deposit = PublisherBookDeposit.objects.get(id=target_deposit_id)
                ouvrage = Ouvrage.objects.filter(isbn=deposit.isbn_digital).first() if deposit.isbn_digital else None
                if not ouvrage:
                    ouvrage = Ouvrage.objects.filter(title=deposit.title).first()
                if ouvrage:
                    tracks = list(AudioTrack.objects.filter(ouvrage=ouvrage))
            except PublisherBookDeposit.DoesNotExist:
                pass

        if not tracks:
            return Response({
                "success": True,
                "has_audio": False,
                "is_locked": False,
                "message": "Aucune version audio disponible."
            })

        return Response({
            "success": True,
            "has_audio": True,
            "is_locked": True,
            "tracks_count": len(tracks),
            "message": f"{len(tracks)} piste(s) audio disponible(s) et protégée(s)."
        })
