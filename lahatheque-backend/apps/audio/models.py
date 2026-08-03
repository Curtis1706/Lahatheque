"""Modèle des pistes audio pour le streaming HLS (AudioTrack)."""
from django.db import models

class AudioTrack(models.Model):
    ouvrage = models.ForeignKey('catalog.Ouvrage', on_delete=models.CASCADE, related_name='audio_tracks')
    chapter_number = models.IntegerField()
    title = models.CharField(max_length=255)
    duration_seconds = models.IntegerField()
    stream_id = models.CharField(max_length=255) # UID Cloudflare Stream
    hls_manifest_url = models.URLField()
    captions_vtt_url = models.URLField(null=True, blank=True)
