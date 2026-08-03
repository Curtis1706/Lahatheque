"""Modèles de protection et traçabilité (ProtectionConfig, TraceAcces)."""
from django.db import models
from django.conf import settings

class ProtectionConfig(models.Model):
    ouvrage = models.OneToOneField('catalog.Ouvrage', on_delete=models.CASCADE, related_name='protection_config')
    allow_print = models.BooleanField(default=False)
    allow_copy = models.BooleanField(default=False)
    allow_download = models.BooleanField(default=False)
    watermark_visible = models.BooleanField(default=True)
    watermark_text_template = models.CharField(max_length=255, default="Licence accordée à {email}")
    invisible_watermark_enabled = models.BooleanField(default=False)

class TraceAcces(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    ouvrage = models.ForeignKey('catalog.Ouvrage', on_delete=models.CASCADE)
    ip_address = models.GenericIPAddressField()
    country = models.CharField(max_length=2)
    user_agent = models.TextField()
    device_fingerprint = models.CharField(max_length=255)
    access_type = models.CharField(max_length=50) # read_online / download_lcp / audio_stream
    page_number = models.IntegerField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
