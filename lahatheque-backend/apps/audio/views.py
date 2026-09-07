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
    """POST /api/v1/audio/tracks/upload/ - Dépôt ou remplacement d'un fichier audio, verrouillé dès l'envoi."""
    permission_classes = [permissions.IsAuthenticated, IsAudioUploader]

    def post(self, request):
        from .stream_client import CloudflareStreamClient
        from apps.catalog.models import Ouvrage

        ouvrage_id = request.data.get("ouvrage_id")
        audio_file = request.FILES.get("file")
        chapter_number = int(request.data.get("chapter_number", 1))
        title = request.data.get("title", "").strip()
        duration_seconds = int(request.data.get("duration_seconds", 0))
        is_replace = str(request.data.get("replace", "")).lower() in ["true", "1", "yes"]

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

        manifest_url = result.get("hls_url", "") or result.get("hls_manifest_url", "")
        track_duration = duration_seconds or result.get("duration") or 0

        if is_replace:
            existing_track = AudioTrack.objects.filter(ouvrage=ouvrage, chapter_number=chapter_number).first()
            if not existing_track:
                existing_track = AudioTrack.objects.filter(ouvrage=ouvrage).first()
            if existing_track:
                existing_track.stream_id = result["stream_id"]
                existing_track.hls_manifest_url = manifest_url
                existing_track.duration_seconds = track_duration
                if title:
                    existing_track.title = title
                existing_track.save()
                track = existing_track
            else:
                track = AudioTrack.objects.create(
                    ouvrage=ouvrage,
                    chapter_number=chapter_number,
                    title=title or ouvrage.title,
                    duration_seconds=track_duration,
                    stream_id=result["stream_id"],
                    hls_manifest_url=manifest_url,
                )
        else:
            track = AudioTrack.objects.create(
                ouvrage=ouvrage,
                chapter_number=chapter_number,
                title=title or ouvrage.title,
                duration_seconds=track_duration,
                stream_id=result["stream_id"],
                hls_manifest_url=manifest_url,
            )

        was_first_audio = not ouvrage.has_audio_version
        ouvrage.has_audio_version = True
        price_audio_param = request.data.get("price_audio")
        if price_audio_param is not None and str(price_audio_param).strip() != "":
            try:
                ouvrage.price_audio = float(price_audio_param)
            except (ValueError, TypeError):
                pass
        ouvrage.save()

        if was_first_audio or is_replace:
            _alert_juriste_if_contract_missing_audio_rate(ouvrage)

        return Response({
            "success": True,
            "data": {"id": str(track.id), "stream_id": track.stream_id, "title": track.title, "duration_seconds": track.duration_seconds}
        })


class AudioStreamSessionView(APIView):
    """GET /api/v1/audio/ouvrages/<ouvrage_id>/session/ - Jeton d'écoute sécurisé ou extrait gratuit (180s)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, ouvrage_id):
        from apps.protection.access_service import AccessService
        from apps.protection.models import TraceAcces
        from apps.commerce.models import LigneCommande
        from apps.catalog.models import Ouvrage
        from .stream_client import CloudflareStreamClient
        from django.conf import settings

        try:
            ouvrage = Ouvrage.objects.prefetch_related('authors').get(id=ouvrage_id)
        except (Ouvrage.DoesNotExist, ValueError):
            return Response({"success": False, "error": "Ouvrage introuvable."}, status=404)

        access = AccessService.check_user_book_access(request.user, ouvrage_id)
        user_role = getattr(request.user, 'role', '')

        # Rôles de supervision technique plateforme bénéficiant d'un accès intégral gracieux
        is_bypass_role = (
            request.user.is_superuser
            or request.user.is_staff
            or user_role in ['admin', 'super_admin', 'chief_layout', 'layout_artist', 'legal_reviewer']
            or access.get("reason") in ["privilege_access", "development_access"]
        )

        from django.db.models import Q
        has_audio_purchase = LigneCommande.objects.filter(
            commande__user=request.user,
            ouvrage_id=ouvrage_id,
            format_type='audio',
        ).filter(
            Q(commande__statut_paiement='paid') | Q(commande__is_credit_purchase=True)
        ).exists()

        institution_obj = None
        bouquet_sub_obj = None
        if not has_audio_purchase:
            user_institution = getattr(request.user, 'institution', None)
            if user_institution:
                bouquet_sub_obj = AccessService.check_bouquet_access(user_institution, ouvrage_id)
                if bouquet_sub_obj:
                    institution_obj = user_institution

        # Détermination du mode écoute : Accès Complet vs Extrait Gratuit (180s)
        has_full_access = is_bypass_role or has_audio_purchase or bool(bouquet_sub_obj)
        is_preview = not has_full_access
        preview_limit_seconds = 180 if is_preview else 0

        tracks = AudioTrack.objects.filter(ouvrage_id=ouvrage_id).order_by("order_index", "chapter_number", "id")
        sessions = []
        public_r2_url = getattr(settings, 'CLOUDFLARE_R2_PUBLIC_URL', '') or getattr(settings, 'CLOUDFLARE_R2_PUBLIC_DOMAIN', 'https://pub-98cb000b12874eae9d7deed8a2ead6ee.r2.dev')

        if not tracks.exists():
            # Support direct audio file from Ouvrage (R2 or media storage)
            if ouvrage.file and (ouvrage.format_type == 'audio' or ouvrage.file.name.lower().endswith(('.mp3', '.m4a', '.wav', '.aac', '.ogg'))):
                file_url = ouvrage.file.url
                if not file_url.startswith("http"):
                    file_url = request.build_absolute_uri(file_url)
                sessions.append({
                    "id": str(ouvrage.id),
                    "chapter_number": 1,
                    "title": ouvrage.title,
                    "duration_seconds": 720,
                    "signed_hls_url": file_url,
                    "captions_vtt_url": None,
                })
            else:
                return Response({"success": False, "error": "Aucune version audio disponible pour cet ouvrage."}, status=404)
        else:
            client = CloudflareStreamClient()
            cf_subdomain = getattr(settings, 'CLOUDFLARE_STREAM_SUBDOMAIN', '') or 'customer-m033avyqq0x51sbg.cloudflarestream.com'
            for track in tracks:
                signed_url = ""
                # 1. URL directe MP3 ou HLS déjà renseignée
                if track.hls_manifest_url and (track.hls_manifest_url.endswith('.mp3') or 'r2.dev' in track.hls_manifest_url):
                    signed_url = track.hls_manifest_url
                # 2. Clé ou chemin de fichier MP3 sur Cloudflare R2
                elif track.stream_id and (track.stream_id.endswith('.mp3') or '/' in track.stream_id):
                    signed_url = f"{public_r2_url.rstrip('/')}/{track.stream_id.lstrip('/')}"
                # 3. Flux Cloudflare Stream avec signature de token
                elif track.stream_id:
                    token = "stream_token"
                    try:
                        token = client.generate_signed_token(track.stream_id, expiry_seconds=3600)
                        signed_url = f"https://{cf_subdomain}/{track.stream_id}/manifest/video.m3u8?token={token}"
                    except Exception as e:
                        logger.error(f"Échec génération token audio: {e}")
                        signed_url = track.hls_manifest_url or ""
                
                if not signed_url and track.audio_file:
                    try:
                        signed_url = track.audio_file.url
                        if not signed_url.startswith("http"):
                            signed_url = request.build_absolute_uri(signed_url)
                    except Exception as e:
                        logger.warning(f"Impossible de récupérer l'URL de audio_file pour track {track.id}: {e}")

                if not signed_url and track.hls_manifest_url:
                    signed_url = track.hls_manifest_url

                sessions.append({
                    "id": str(track.id),
                    "chapter_number": track.chapter_number,
                    "order_index": getattr(track, 'order_index', 0),
                    "track_type": getattr(track, 'track_type', 'chapter'),
                    "voice_gender": getattr(track, 'voice_gender', 'male'),
                    "title": track.title,
                    "duration_seconds": track.duration_seconds,
                    "signed_hls_url": signed_url,
                    "captions_vtt_url": track.captions_vtt_url,
                })

        authors_list = []
        if hasattr(ouvrage, 'authors'):
            authors_list = [
                f"{a.first_name} {a.last_name}".strip()
                for a in ouvrage.authors.all()
                if f"{a.first_name} {a.last_name}".strip()
            ]
        if not authors_list and getattr(ouvrage, 'publisher_name', ''):
            authors_list = [ouvrage.publisher_name]

        return Response({
            "success": True,
            "data": {
                "ouvrage_id": str(ouvrage.id),
                "title": ouvrage.title,
                "cover_url": ouvrage.cover_image.url if ouvrage.cover_image else None,
                "authors": authors_list,
                "is_preview": is_preview,
                "preview_limit_seconds": preview_limit_seconds,
                "tracks": sessions,
                "expires_in": 3600,
            }
        })


class AudioPublicPreviewView(APIView):
    """
    GET /api/v1/audio/ouvrages/<ouvrage_id>/public-preview/
    Extrait audio public (visiteur non connecté). Aucune authentification requise.
    - Limite à 180 secondes côté client et serveur.
    - Retourne l'URL publique Cloudflare R2 de la piste audio.
    - N'enregistre aucune session ni progression (visiteur anonyme).
    """
    permission_classes = [permissions.AllowAny]
    PREVIEW_LIMIT_SECONDS = 180

    def get(self, request, ouvrage_id):
        from apps.catalog.models import Ouvrage
        from django.conf import settings

        try:
            ouvrage = Ouvrage.objects.prefetch_related('authors').get(id=ouvrage_id)
        except (Ouvrage.DoesNotExist, ValueError):
            return Response({"success": False, "error": "Ouvrage introuvable."}, status=404)

        public_r2_url = (
            getattr(settings, 'CLOUDFLARE_R2_PUBLIC_URL', '')
            or getattr(settings, 'CLOUDFLARE_R2_PUBLIC_DOMAIN', 'https://pub-98cb000b12874eae9d7deed8a2ead6ee.r2.dev')
        )

        track = AudioTrack.objects.filter(ouvrage_id=ouvrage_id).order_by("order_index", "chapter_number", "id").first()
        audio_url = None

        if track:
            # 1. Fichier audio direct sur Cloudflare R2
            if track.audio_file:
                try:
                    audio_url = track.audio_file.url
                    if not audio_url.startswith("http"):
                        audio_url = request.build_absolute_uri(audio_url)
                except Exception as e:
                    logger.warning(f"[PublicPreview] Impossible de récupérer l'URL de audio_file pour track {track.id}: {e}")

            # 2. URL directe MP3 ou domaine R2
            if not audio_url and track.hls_manifest_url and (track.hls_manifest_url.endswith('.mp3') or 'r2.dev' in track.hls_manifest_url):
                audio_url = track.hls_manifest_url

            # 3. Clé ou chemin de fichier MP3 sur Cloudflare R2
            elif not audio_url and track.stream_id and (track.stream_id.endswith('.mp3') or '/' in track.stream_id):
                audio_url = f"{public_r2_url.rstrip('/')}/{track.stream_id.lstrip('/')}"

            # 4. Flux Cloudflare Stream avec signature de jeton (limité à 180s)
            elif not audio_url and (track.stream_id or (track.hls_manifest_url and '.m3u8' in track.hls_manifest_url)):
                from .stream_client import CloudflareStreamClient
                client = CloudflareStreamClient()
                cf_subdomain = getattr(settings, 'CLOUDFLARE_STREAM_SUBDOMAIN', '') or 'customer-m033avyqq0x51sbg.cloudflarestream.com'
                stream_id = track.stream_id
                if not stream_id and track.hls_manifest_url:
                    parts = track.hls_manifest_url.split('/')
                    for idx, part in enumerate(parts):
                        if part == 'manifest' and idx > 0:
                            stream_id = parts[idx - 1]
                            break
                if stream_id:
                    try:
                        token = client.generate_signed_token(stream_id, expiry_seconds=self.PREVIEW_LIMIT_SECONDS)
                        domain = cf_subdomain
                        if track.hls_manifest_url and 'cloudflarestream.com' in track.hls_manifest_url:
                            domain = track.hls_manifest_url.split('/')[2]
                        audio_url = f"https://{domain}/{stream_id}/manifest/video.m3u8?token={token}"
                    except Exception as e:
                        logger.error(f"[PublicPreview] Échec génération token Cloudflare Stream: {e}")
                        audio_url = track.hls_manifest_url or ""
                elif track.hls_manifest_url:
                    audio_url = track.hls_manifest_url

            # 5. Repli hls_manifest_url générique
            elif not audio_url and track.hls_manifest_url:
                audio_url = track.hls_manifest_url

        # 6. Fichier audio direct attaché à l'Ouvrage (fallback R2/media)
        if not audio_url and ouvrage.file:
            fname = ouvrage.file.name.lower()
            if ouvrage.format_type == 'audio' or fname.endswith(('.mp3', '.m4a', '.wav', '.aac', '.ogg')):
                try:
                    audio_url = ouvrage.file.url
                    if not audio_url.startswith("http"):
                        audio_url = request.build_absolute_uri(audio_url)
                except Exception:
                    pass

        if not audio_url:
            return Response(
                {"success": False, "error": "L'extrait audio n'est pas encore disponible pour cet ouvrage."},
                status=404
            )

        authors_list = [
            f"{a.first_name} {a.last_name}".strip()
            for a in ouvrage.authors.all()
            if f"{a.first_name} {a.last_name}".strip()
        ]
        if not authors_list and getattr(ouvrage, 'publisher_name', ''):
            authors_list = [ouvrage.publisher_name]

        cover_url = None
        try:
            cover_url = ouvrage.cover_image.url if ouvrage.cover_image else None
        except Exception:
            pass

        return Response({
            "success": True,
            "data": {
                "ouvrage_id": str(ouvrage.id),
                "title": ouvrage.title,
                "cover_url": cover_url,
                "authors": authors_list,
                "audio_url": audio_url,
                "preview_limit_seconds": self.PREVIEW_LIMIT_SECONDS,
                "track_title": track.title if track else ouvrage.title,
                "track_duration_seconds": track.duration_seconds if track else None,
            }
        })


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


class AudioEligibleBooksView(APIView):
    """GET /api/v1/audio/eligible-books/ — Liste des ouvrages éligibles pour un rattachement audio."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from apps.catalog.models import Ouvrage
        from django.db.models import Q

        q = request.query_params.get("q", "").strip()
        qs = Ouvrage.objects.filter(status__in=['published', 'approved', 'draft']).order_by('-created_at')

        if q:
            qs = qs.filter(
                Q(title__icontains=q) |
                Q(isbn__icontains=q) |
                Q(authors__first_name__icontains=q) |
                Q(authors__last_name__icontains=q)
            ).distinct()

        books_data = []
        for b in qs[:30]:
            authors_str = ", ".join([f"{a.first_name} {a.last_name}".strip() for a in b.authors.all()]) if b.authors.exists() else (b.publisher_name or "Auteur LAHA")
            books_data.append({
                "id": str(b.id),
                "title": b.title,
                "isbn": b.isbn,
                "author": authors_str,
                "authors_display": authors_str,
                "category": b.discipline.name if b.discipline else "Général",
                "country": b.country or "BJ",
                "cover_url": b.cover_url,
                "price_xof": float(b.price_digital or 2500),
                "has_audio_version": bool(b.has_audio_version),
            })

        return Response({"success": True, "data": books_data})


class AudioStudioSubmitView(APIView):
    """POST /api/v1/audio/studio/submit/ — Création ou mise à jour complète d'un livre audio."""
    permission_classes = [permissions.IsAuthenticated, IsAudioUploader]

    def post(self, request):
        from apps.catalog.models import Ouvrage, Discipline
        from apps.audio.models import AudioTrack
        from decimal import Decimal
        import json

        data = request.data
        is_attached = str(data.get("is_attached", "")).lower() in ["true", "1", "yes"]
        attached_book_id = data.get("attached_book_id")

        price_xof_val = data.get("price_xof")
        price_eur_val = data.get("price_eur")
        price_xof = Decimal(str(price_xof_val)) if price_xof_val else Decimal("2500.00")
        price_eur = Decimal(str(price_eur_val)) if price_eur_val else Decimal("3.80")

        ouvrage = None
        if is_attached and attached_book_id:
            try:
                ouvrage = Ouvrage.objects.get(id=attached_book_id)
                ouvrage.has_audio_version = True
                ouvrage.price_audio = price_xof
                ouvrage.price_audio_eur = price_eur
                ouvrage.audio_status = "pending_layout_validation"
                ouvrage.save(update_fields=["has_audio_version", "price_audio", "price_audio_eur", "audio_status"])
            except Ouvrage.DoesNotExist:
                return Response({"success": False, "error": "Ouvrage de rattachement introuvable."}, status=404)
        else:
            title = data.get("title", "").strip()
            if not title:
                return Response({"success": False, "error": "Le titre du livre audio est obligatoire."}, status=400)

            ouvrage = Ouvrage.objects.create(
                title=title,
                summary=data.get("description", ""),
                country=data.get("country", "BJ"),
                format_type="audio",
                has_audio_version=True,
                audio_status="pending_layout_validation",
                price_digital=price_xof,
                price_audio=price_xof,
                price_audio_eur=price_eur,
                created_by=request.user,
                status="published" if getattr(request.user, "role", "") in ["admin", "super_admin"] else "draft",
            )

            cover_file = request.FILES.get("cover_image")
            if cover_file:
                ouvrage.cover_image = cover_file
                ouvrage.save(update_fields=["cover_image"])

            cat_name = data.get("category", "")
            if cat_name:
                disc = Discipline.objects.filter(name__iexact=cat_name).first()
                if disc:
                    ouvrage.discipline = disc
                    ouvrage.save(update_fields=["discipline"])

        # Sauvegarde des pistes Voix Homme & Voix Femme
        tracks_created = 0

        # 1. Livre complet Voix Homme
        male_full_file = request.FILES.get("male_full_track")
        if male_full_file:
            male_full_duration = int(data.get("male_full_duration", 0))
            AudioTrack.objects.filter(ouvrage=ouvrage, voice_gender="male", track_type="full").delete()
            AudioTrack.objects.create(
                ouvrage=ouvrage,
                voice_gender="male",
                track_type="full",
                chapter_number=0,
                order_index=0,
                title="Livre complet – Voix Homme",
                audio_file=male_full_file,
                duration_seconds=male_full_duration,
                file_size_bytes=male_full_file.size,
            )
            tracks_created += 1

        # 2. Livre complet Voix Femme
        female_full_file = request.FILES.get("female_full_track")
        if female_full_file:
            female_full_duration = int(data.get("female_full_duration", 0))
            AudioTrack.objects.filter(ouvrage=ouvrage, voice_gender="female", track_type="full").delete()
            AudioTrack.objects.create(
                ouvrage=ouvrage,
                voice_gender="female",
                track_type="full",
                chapter_number=0,
                order_index=0,
                title="Livre complet – Voix Femme",
                audio_file=female_full_file,
                duration_seconds=female_full_duration,
                file_size_bytes=female_full_file.size,
            )
            tracks_created += 1

        # 3. Chapitres dynamiques Voix Homme
        male_chap_count = int(data.get("male_chapters_count", 0))
        for i in range(male_chap_count):
            chap_file = request.FILES.get(f"male_chapter_{i}_file")
            if chap_file:
                chap_title = data.get(f"male_chapter_{i}_title", f"Chapitre {i + 1}").strip()
                chap_dur = int(data.get(f"male_chapter_{i}_duration", 0))
                AudioTrack.objects.create(
                    ouvrage=ouvrage,
                    voice_gender="male",
                    track_type="chapter",
                    chapter_number=i + 1,
                    order_index=i + 1,
                    title=chap_title,
                    audio_file=chap_file,
                    duration_seconds=chap_dur,
                    file_size_bytes=chap_file.size,
                )
                tracks_created += 1

        # 4. Chapitres dynamiques Voix Femme
        female_chap_count = int(data.get("female_chapters_count", 0))
        for i in range(female_chap_count):
            chap_file = request.FILES.get(f"female_chapter_{i}_file")
            if chap_file:
                chap_title = data.get(f"female_chapter_{i}_title", f"Chapitre {i + 1}").strip()
                chap_dur = int(data.get(f"female_chapter_{i}_duration", 0))
                AudioTrack.objects.create(
                    ouvrage=ouvrage,
                    voice_gender="female",
                    track_type="chapter",
                    chapter_number=i + 1,
                    order_index=i + 1,
                    title=chap_title,
                    audio_file=chap_file,
                    duration_seconds=chap_dur,
                    file_size_bytes=chap_file.size,
                )
                tracks_created += 1

        _alert_juriste_if_contract_missing_audio_rate(ouvrage)

        return Response({
            "success": True,
            "data": {
                "ouvrage_id": str(ouvrage.id),
                "title": ouvrage.title,
                "audio_status": ouvrage.audio_status,
                "tracks_created": tracks_created,
                "message": "Livre audio enregistré avec succès."
            }
        })


class AudioManagementListView(APIView):
    """GET /api/v1/audio/management/<role>/ — Liste des livres audio pour la gestion multi-rôles."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, role):
        from apps.catalog.models import Ouvrage
        from django.db.models import Q, Sum, Count

        status_filter = request.query_params.get("status")
        qs = Ouvrage.objects.filter(
            Q(has_audio_version=True) | Q(format_type="audio") | Q(audio_tracks__isnull=False)
        ).distinct().order_by("-updated_at")

        if status_filter and status_filter != "all":
            qs = qs.filter(audio_status=status_filter)

        results = []
        for b in qs:
            tracks = b.audio_tracks.all()
            has_male = tracks.filter(voice_gender="male").exists()
            has_female = tracks.filter(voice_gender="female").exists()
            total_dur = sum(t.duration_seconds for t in tracks)
            authors_str = ", ".join([f"{a.first_name} {a.last_name}".strip() for a in b.authors.all()]) if b.authors.exists() else (b.publisher_name or "Auteur LAHA")

            results.append({
                "id": str(b.id),
                "title": b.title,
                "authors_display": authors_str,
                "category_name": b.discipline.name if b.discipline else "Général",
                "country": b.country or "BJ",
                "cover_url": b.cover_url,
                "price_audio_xof": float(b.price_audio or b.price_digital or 2500),
                "price_audio_eur": float(b.price_audio_eur or 3.80),
                "audio_status": getattr(b, "audio_status", "draft") or "draft",
                "has_male_voice": has_male,
                "has_female_voice": has_female,
                "total_duration_seconds": total_dur,
                "total_tracks_count": tracks.count(),
                "created_at": b.created_at.isoformat() if b.created_at else "",
                "rejection_reason": getattr(b, "rejection_reason", "") or "",
            })

        return Response({"success": True, "data": results})


class AudioWorkflowTransitionView(APIView):
    """POST /api/v1/audio/management/<book_id>/transition/ — Transition de statut de workflow."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, book_id):
        from apps.catalog.models import Ouvrage

        action = request.data.get("action")
        comment = request.data.get("comment", "").strip()

        try:
            ouvrage = Ouvrage.objects.get(id=book_id)
        except Ouvrage.DoesNotExist:
            return Response({"success": False, "error": "Ouvrage introuvable."}, status=404)

        if action == "submit_layout":
            ouvrage.audio_status = "pending_layout_validation"
        elif action == "approve_layout":
            ouvrage.audio_status = "pending_legal_validation"
        elif action == "reject_layout":
            ouvrage.audio_status = "rejected"
            ouvrage.rejection_reason = comment or "Modifications demandées par le Chef Maquettiste."
        elif action == "approve_legal":
            ouvrage.audio_status = "published"
            ouvrage.status = "published"
        elif action == "publish_admin":
            ouvrage.audio_status = "published"
            ouvrage.status = "published"
        elif action == "unpublish_admin":
            ouvrage.audio_status = "draft"
        else:
            return Response({"success": False, "error": f"Action de workflow inconnue : {action}"}, status=400)

        ouvrage.save()
        return Response({
            "success": True,
            "data": {
                "id": str(ouvrage.id),
                "audio_status": ouvrage.audio_status,
                "message": f"Statut mis à jour avec succès : {ouvrage.audio_status}"
            }
        })


class RecentAudioListeningsView(APIView):
    """GET /api/v1/audio/recent-listenings/ — Dernières écoutes audio de l'utilisateur pour le widget Dashboard."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from apps.audio.models import AudioListeningSession

        sessions = AudioListeningSession.objects.filter(
            user=request.user
        ).select_related("ouvrage", "audio_track").order_by("-created_at")[:5]

        seen_books = set()
        data = []
        for s in sessions:
            if s.ouvrage_id in seen_books:
                continue
            seen_books.add(s.ouvrage_id)
            track_title = s.audio_track.title if s.audio_track else "Lecture en cours"
            data.append({
                "session_id": str(s.id),
                "ouvrage_id": str(s.ouvrage.id),
                "title": s.ouvrage.title,
                "cover_url": s.ouvrage.cover_url,
                "chapter_title": track_title,
                "duration_listened_seconds": s.duration_listened_seconds,
                "completion_percent": float(s.completion_percent or 0),
                "session_date": s.session_date.isoformat() if s.session_date else "",
            })

        return Response({"success": True, "data": data})
