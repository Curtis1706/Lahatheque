import logging
from django.http import StreamingHttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from openai import OpenAI
from decouple import config

logger = logging.getLogger(__name__)

# Voix OpenAI disponibles
OPENAI_VOICES = {'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'}

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_tts(request):
    """
    Génère un flux audio MP3 à partir de texte via OpenAI TTS.
    Body JSON : { text: str, voice: str (optionnel), speed: float (optionnel) }
    Retourne un flux audio streamé (audio/mpeg).
    """
    text = request.data.get('text', '').strip()
    voice = request.data.get('voice', 'nova')
    speed = float(request.data.get('speed', 1.0))

    if not text:
        return Response({'error': 'Le texte est requis.'}, status=status.HTTP_400_BAD_REQUEST)

    if len(text) > 4096:
        return Response({'error': 'Le texte est trop long (max 4096 caractères).'}, status=status.HTTP_400_BAD_REQUEST)

    if voice not in OPENAI_VOICES:
        voice = 'nova'

    speed = max(0.25, min(4.0, speed))

    api_key = config('OPENAI_API_KEY', default='')
    if not api_key:
        return Response({'error': 'Clé API OpenAI non configurée.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        client = OpenAI(api_key=api_key)

        # Streaming : on reçoit le MP3 en morceaux et on les transmet directement
        openai_response = client.audio.speech.create(
            model='tts-1',          # tts-1 = rapide | tts-1-hd = plus naturel mais 2x plus lent
            voice=voice,
            input=text,
            speed=speed,
            response_format='mp3',
        )

        def audio_stream():
            for chunk in openai_response.iter_bytes(chunk_size=4096):
                yield chunk

        response = StreamingHttpResponse(
            audio_stream(),
            content_type='audio/mpeg',
            status=200,
        )
        response['Cache-Control'] = 'no-store'
        response['X-Accel-Buffering'] = 'no'  # Désactive le buffering Nginx pour le streaming
        return response

    except Exception as e:
        logger.error(f'[TTS] OpenAI TTS error: {e}')
        return Response({'error': 'Erreur lors de la génération audio.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
