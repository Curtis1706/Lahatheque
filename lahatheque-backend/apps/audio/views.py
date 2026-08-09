"""
audio/views.py — Vues de gestion du streaming audio HLS (AudioTrack).
"""
import logging
from rest_framework import status, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import AudioTrack
from .serializers import AudioTrackSerializer

logger = logging.getLogger(__name__)

class AudioTrackViewSet(viewsets.ModelViewSet):
    queryset = AudioTrack.objects.all()
    serializer_class = AudioTrackSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class StreamStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, stream_id, *args, **kwargs):
        track = AudioTrack.objects.filter(stream_id=stream_id).first()
        if not track:
            return Response({'error': 'Piste audio introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AudioTrackSerializer(track).data)
