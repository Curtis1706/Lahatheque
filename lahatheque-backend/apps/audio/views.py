"""
media/views.py — Vues de gestion des médias Cloudflare R2 + Stream.

Endpoints :
- StreamUploadView   : POST /api/media/stream/upload/
- StreamWebhookView  : POST /api/media/stream/webhook/  ← enregistré sur CF
- StreamStatusView   : GET  /api/media/stream/{stream_id}/status/
- R2UploadView       : POST /api/media/r2/upload/  (remplace CloudinaryUploadView)
"""
import hashlib
import hmac
import json
import logging
import os
import uuid

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from . import stream_client
from .models import StreamVideo
from .serializers import StreamVideoSerializer

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# StreamUploadView
# ─────────────────────────────────────────────────────────────

class StreamUploadView(APIView):
    """
    POST /api/media/stream/upload/

    Reçoit un fichier vidéo depuis le frontend (admin) et l'uploade
    vers Cloudflare Stream. Crée un StreamVideo en statut 'queued'.

    Body (multipart/form-data) :
        file      : Fichier vidéo (mp4, mov, webm...)
        lesson_id : UUID de la leçon à lier (optionnel, peut être lié après)

    Body (application/json) :
        url       : URL publique d'une vidéo à copier
        lesson_id : UUID de la leçon à lier (optionnel)

    Response 201 :
        { stream_id, status: 'queued', lesson_id }
    """
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, *args, **kwargs):
        lesson_id = request.data.get('lesson_id')

        try:
            # ── Upload depuis fichier ──────────────────────────────────
            if 'file' in request.FILES:
                file_obj = request.FILES['file']
                filename = file_obj.name or 'video.mp4'
                result = stream_client.upload_from_file(file_obj, filename=filename)

            # ── Upload depuis URL ─────────────────────────────────────
            elif 'url' in request.data:
                video_url = request.data['url']
                result = stream_client.upload_from_url(video_url)

            else:
                return Response(
                    {'error': 'Fournissez un fichier (file) ou une URL (url).'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except Exception as e:
            logger.error(f"[Stream] Erreur upload : {e}", exc_info=True)
            return Response(
                {'error': f'Erreur upload Cloudflare Stream : {str(e)}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # ── Création du StreamVideo en base ───────────────────────────
        stream_video_data = {
            'stream_id':     result['stream_id'],
            'status':        result['status'],
            'hls_url':       result.get('hls_url', ''),
            'iframe_url':    result.get('iframe_url', ''),
            'thumbnail_url': result.get('thumbnail_url', ''),
            'duration':      result.get('duration'),
            'size_bytes':    result.get('size'),
        }

        if lesson_id:
            from content.models import Lesson
            try:
                lesson = Lesson.objects.get(id=lesson_id)
                # Supprimer l'ancien StreamVideo si existant
                StreamVideo.objects.filter(lesson=lesson).delete()
                stream_video_data['lesson'] = lesson
                sv = StreamVideo.objects.create(**stream_video_data)
            except Lesson.DoesNotExist:
                logger.warning(f"[Stream] Leçon {lesson_id} introuvable — StreamVideo créé sans lien.")
                sv = StreamVideo(**stream_video_data)
                sv.save()
        else:
            sv = StreamVideo(**stream_video_data)
            sv.save()

        logger.info(f"[Stream] Vidéo uploadée → stream_id={result['stream_id']} statut={result['status']}")

        return Response(
            {
                'stream_id': result['stream_id'],
                'status':    result['status'],
                'lesson_id': str(lesson_id) if lesson_id else None,
            },
            status=status.HTTP_201_CREATED,
        )


# ─────────────────────────────────────────────────────────────
# StreamWebhookView
# ─────────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name='dispatch')
class StreamWebhookView(APIView):
    """
    POST /api/media/stream/webhook/

    Reçoit les callbacks de Cloudflare Stream (encodage terminé, erreur...).
    Déjà enregistré sur Cloudflare :
        URL    : https://lahaacademia.onrender.com/api/media/stream/webhook/
        Secret : 5d9db68aa5b8ce6eea8e7b4cc19272d59c2ab6a6

    Flux :
        1. Vérification signature HMAC-SHA256
        2. Si status == 'ready' → met à jour StreamVideo + déclenche captions FR
        3. Si status == 'error' → log l'erreur
    """
    permission_classes = []  # Pas de JWT — authentification par HMAC

    def post(self, request, *args, **kwargs):
        # ── 1. Vérification signature HMAC ────────────────────────────
        signature_header = request.META.get('HTTP_WEBHOOK_SIGNATURE', '')
        if not self._verify_signature(request.body, signature_header):
            logger.warning("[Webhook] Signature HMAC invalide — requête rejetée.")
            return Response({'error': 'Signature invalide.'}, status=status.HTTP_401_UNAUTHORIZED)

        # ── 2. Parsing du payload ─────────────────────────────────────
        try:
            payload = json.loads(request.body)
        except json.JSONDecodeError:
            return Response({'error': 'Payload invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        stream_id = payload.get('uid') or payload.get('stream_id')
        event_status = payload.get('status', {})
        state = event_status.get('state', '') if isinstance(event_status, dict) else str(event_status)
        ready_to_stream = payload.get('readyToStream', False)

        if not stream_id:
            logger.warning(f"[Webhook] Payload sans stream_id : {payload}")
            return Response({'received': True})

        logger.info(f"[Webhook] Reçu — stream_id={stream_id} state={state} ready={ready_to_stream}")

        # ── 3. Récupération des objets liés en base ────────────────────
        try:
            sv = StreamVideo.objects.get(stream_id=stream_id)
        except StreamVideo.DoesNotExist:
            sv = None
            logger.warning(f"[Webhook] StreamVideo introuvable pour stream_id={stream_id}")

        from content.models import Lesson
        from django.db.models import Q
        lesson = Lesson.objects.filter(Q(stream_id=stream_id) | Q(video_public_id=stream_id)).first()

        if not sv and not lesson:
            logger.warning(f"[Webhook] Aucun StreamVideo ni Leçon pour stream_id={stream_id}")
            return Response({'received': True})

        # ── 4. Traitement selon le statut ──────────────────────────────
        if ready_to_stream or state == 'ready':
            self._handle_ready(sv, lesson, payload, stream_id)
        elif state == 'error':
            self._handle_error(sv, lesson, payload, stream_id)
        elif state == 'inprogress':
            if sv:
                sv.status = StreamVideo.Status.INPROGRESS
                sv.save(update_fields=['status', 'updated_at'])

        return Response({'received': True}, status=status.HTTP_200_OK)

    def _handle_ready(self, sv: StreamVideo, lesson, payload: dict, stream_id: str):
        """Mise à jour du StreamVideo/Lesson et déclenchement des sous-titres FR."""
        subdomain = settings.CLOUDFLARE_STREAM_SUBDOMAIN
        hls_url = f"https://{subdomain}/{stream_id}/manifest/video.m3u8"
        iframe_url = f"https://{subdomain}/{stream_id}/iframe"
        thumbnail_url = f"https://{subdomain}/{stream_id}/thumbnails/thumbnail.jpg"
        duration = payload.get('duration') or 0
        size_bytes = payload.get('size')

        if sv:
            sv.status        = StreamVideo.Status.READY
            sv.hls_url       = hls_url
            sv.iframe_url    = iframe_url
            sv.thumbnail_url = thumbnail_url
            sv.duration      = duration
            sv.size_bytes    = size_bytes
            sv.save(update_fields=[
                'status', 'hls_url', 'iframe_url', 'thumbnail_url',
                'duration', 'size_bytes', 'updated_at'
            ])

        if lesson:
            lesson.hls_url = hls_url
            # On met à jour la durée (Cloudflare renvoie des float, on convertit en int)
            lesson.video_duration = max(0, int(duration))
            # On force la sauvegarde du stream_id au cas où (si seulement video_public_id l'avait)
            lesson.stream_id = stream_id
            lesson.save(update_fields=['hls_url', 'video_duration', 'stream_id', 'updated_at'])
            logger.info(f"[Webhook] Leçon {lesson.id} mise à jour → HLS: {hls_url}")

        logger.info(f"[Webhook] Vidéo prête : {stream_id} → HLS: {hls_url}")

        # Génération sous-titres FR (Cloudflare Stream IA native, gratuit)
        try:
            result = stream_client.generate_fr_captions(stream_id)
            if result.get('success'):
                if sv:
                    sv.fr_captions_status = 'inprogress'
                    sv.save(update_fields=['fr_captions_status', 'updated_at'])
                logger.info(f"[Webhook] Sous-titres FR déclenchés pour {stream_id}")
        except Exception as e:
            logger.error(f"[Webhook] Erreur déclenchement sous-titres FR : {e}")

    def _handle_error(self, sv: StreamVideo, lesson, payload: dict, stream_id: str):
        """Enregistrement de l'erreur d'encodage."""
        error_info = payload.get('status', {})
        error_msg = (
            error_info.get('errorReasonText', 'Erreur inconnue')
            if isinstance(error_info, dict)
            else str(error_info)
        )
        if sv:
            sv.status = StreamVideo.Status.ERROR
            sv.error_message = error_msg
            sv.save(update_fields=['status', 'error_message', 'updated_at'])
        logger.error(f"[Webhook] Erreur encodage stream_id={stream_id} : {error_msg}")

    @staticmethod
    def _verify_signature(body: bytes, signature_header: str) -> bool:
        """
        Vérifie la signature HMAC-SHA256 envoyée par Cloudflare Stream.
        Format du header : 'time=<ts>,sig1=<hex>'
        """
        secret = settings.CLOUDFLARE_STREAM_WEBHOOK_SECRET
        if not secret or not signature_header:
            # En développement sans secret configuré, on laisse passer
            if settings.DEBUG:
                logger.warning("[Webhook] Vérification HMAC désactivée en mode DEBUG.")
                return True
            return False

        try:
            parts = dict(item.split('=', 1) for item in signature_header.split(','))
            timestamp = parts.get('time', '')
            received_sig = parts.get('sig1', '')

            # Calcul de la signature attendue
            message = f"{timestamp}.{body.decode('utf-8')}"
            expected_sig = hmac.new(
                secret.encode('utf-8'),
                message.encode('utf-8'),
                hashlib.sha256,
            ).hexdigest()

            return hmac.compare_digest(expected_sig, received_sig)
        except Exception as e:
            logger.error(f"[Webhook] Erreur vérification signature : {e}")
            return False


# ─────────────────────────────────────────────────────────────
# StreamStatusView
# ─────────────────────────────────────────────────────────────

class StreamStatusView(APIView):
    """
    GET /api/media/stream/{stream_id}/status/

    Retourne le statut d'encodage en temps réel.
    Utilisé par le frontend pour le polling pendant l'upload admin.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, stream_id, *args, **kwargs):
        try:
            sv = StreamVideo.objects.get(stream_id=stream_id)
        except StreamVideo.DoesNotExist:
            return Response({'error': 'Vidéo introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(StreamVideoSerializer(sv).data)


# ─────────────────────────────────────────────────────────────
# R2UploadView  (remplace CloudinaryUploadView de common/)
# ─────────────────────────────────────────────────────────────

class R2UploadView(APIView):
    """
    POST /api/media/r2/upload/

    Reçoit un fichier et l'uploade sur Cloudflare R2 via default_storage.
    Remplace l'ancien CloudinaryUploadView de common/views.py.
    Interface de réponse identique pour ne pas casser le frontend.

    Body (multipart/form-data) :
        file : Le fichier à uploader
        type : 'content' | 'thumbnail' | 'video' | 'document' (optionnel)

    Response 201 :
        { success, file_url, file_name, file_size, file_type, saved_path }
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    # Tailles maximales par type (en bytes)
    MAX_SIZES = {
        'content':   500  * 1024 * 1024,   # 500 MB
        'thumbnail':  50  * 1024 * 1024,   #  5 MB
        'video':    500  * 1024 * 1024,   # 500 MB
        'document':  500  * 1024 * 1024,   # 500 MB
    }

    # Dossiers R2 par type
    UPLOAD_FOLDERS = {
        'content':   'educational_content/',
        'thumbnail': 'content_thumbnails/',
        'video':     'educational_content/videos/',
        'document':  'documents/',
    }

    def post(self, request, *args, **kwargs):
        if 'file' not in request.FILES:
            return Response(
                {'error': 'Aucun fichier fourni.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        file = request.FILES['file']
        file_type = request.data.get('type', 'content')

        # Validation taille
        max_size = self.MAX_SIZES.get(file_type, self.MAX_SIZES['content'])
        if file.size > max_size:
            return Response(
                {'error': f'Fichier trop volumineux. Max : {max_size // (1024 * 1024)} MB'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Nom de fichier unique
        ext = os.path.splitext(file.name)[1]
        unique_filename = f"{uuid.uuid4()}{ext}"
        folder = self.UPLOAD_FOLDERS.get(file_type, 'educational_content/')
        file_path = os.path.join(folder, unique_filename)

        try:
            saved_path = default_storage.save(file_path, ContentFile(file.read()))
            file_url = default_storage.url(saved_path)
        except Exception as e:
            logger.error(f"[R2Upload] Erreur upload R2 : {e}", exc_info=True)
            return Response(
                {'error': f'Erreur upload : {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        logger.info(f"[R2Upload] Fichier uploadé : {saved_path} → {file_url}")

        return Response(
            {
                'success':    True,
                'file_url':   file_url,
                'file_name':  file.name,
                'file_size':  file.size,
                'file_type':  file.content_type,
                'saved_path': saved_path,
                'message':    'Fichier uploadé avec succès sur R2.',
            },
            status=status.HTTP_201_CREATED,
        )
