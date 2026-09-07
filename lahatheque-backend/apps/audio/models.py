"""Modèle des pistes audio pour le streaming HLS (AudioTrack) et sessions d'écoute (AudioListeningSession)."""
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

class AudioTrack(models.Model):
    VOICE_GENDER_CHOICES = [
        ('male', 'Voix Homme'),
        ('female', 'Voix Femme'),
    ]
    TRACK_TYPE_CHOICES = [
        ('full', 'Livre complet'),
        ('chapter', 'Chapitre'),
    ]

    ouvrage = models.ForeignKey('catalog.Ouvrage', on_delete=models.CASCADE, related_name='audio_tracks')
    voice_gender = models.CharField(max_length=10, choices=VOICE_GENDER_CHOICES, default='male')
    track_type = models.CharField(max_length=10, choices=TRACK_TYPE_CHOICES, default='chapter')
    chapter_number = models.IntegerField(default=1)
    order_index = models.IntegerField(default=0)
    title = models.CharField(max_length=255)
    duration_seconds = models.IntegerField(default=0)
    file_size_bytes = models.BigIntegerField(default=0)
    bitrate_kbps = models.IntegerField(default=128)
    audio_file = models.FileField(upload_to='audio_tracks/', max_length=512, null=True, blank=True)
    stream_id = models.CharField(max_length=255, blank=True, default='') # UID Cloudflare Stream ou R2
    hls_manifest_url = models.URLField(max_length=1024, blank=True, default='')
    captions_vtt_url = models.URLField(max_length=1024, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        ordering = ['voice_gender', 'track_type', 'order_index', 'chapter_number']

    def __str__(self):
        return f"{self.ouvrage.title} [{self.get_voice_gender_display()}] - {self.title}"


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
