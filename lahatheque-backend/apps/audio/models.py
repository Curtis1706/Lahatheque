"""Modèle des pistes audio pour le streaming HLS (AudioTrack) et sessions d'écoute (AudioListeningSession)."""
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

class AudioTrack(models.Model):
    ouvrage = models.ForeignKey('catalog.Ouvrage', on_delete=models.CASCADE, related_name='audio_tracks')
    chapter_number = models.IntegerField()
    title = models.CharField(max_length=255)
    duration_seconds = models.IntegerField()
    stream_id = models.CharField(max_length=255) # UID Cloudflare Stream
    hls_manifest_url = models.URLField()
    captions_vtt_url = models.URLField(null=True, blank=True)

    def __str__(self):
        return f"{self.ouvrage.title} - Ch.{self.chapter_number}: {self.title}"


class AudioListeningSession(models.Model):
    """Session d'écoute individuelle — équivalent audio de ReadingSession."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='listening_sessions'
    )
    ouvrage = models.ForeignKey(
        'catalog.Ouvrage', on_delete=models.CASCADE, related_name='listening_sessions'
    )
    audio_track = models.ForeignKey(
        AudioTrack, on_delete=models.CASCADE, related_name='listening_sessions', null=True, blank=True
    )
    duration_listened_seconds = models.IntegerField(default=0)
    completion_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    session_date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'audio_track', '-created_at']),
            models.Index(fields=['ouvrage', 'session_date']),
        ]

    def __str__(self):
        return f"Écoute {self.user} - {self.ouvrage.title} ({self.duration_listened_seconds}s)"
