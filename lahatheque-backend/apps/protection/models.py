"""
Modèles de données pour la protection DRM, le suivi des traces d'accès,
les annotations et la gestion du cache de dérivés protégés.
Conforme à docs/drm/ et GUIDE_API_LECTEUR.md.
"""

import uuid
from django.db import models
from django.conf import settings


class ProtectionConfig(models.Model):
    """
    Configuration des règles de protection DRM appliquées à un ouvrage.
    """
    ouvrage = models.OneToOneField(
        'catalog.Ouvrage',
        on_delete=models.CASCADE,
        related_name='protection_config'
    )
    
    PROFIL_CHOICES = [
        ("standard", "Standard (Texte actif pour TTS & annotations)"),
        ("renforce", "Renforcé (Pages images sans couche texte)"),
    ]
    profil = models.CharField(max_length=16, choices=PROFIL_CHOICES, default="standard")
    
    allow_print = models.BooleanField(default=False)
    allow_copy = models.BooleanField(default=False)
    allow_download = models.BooleanField(default=False)
    
    watermark_visible = models.BooleanField(default=True)
    watermark_text_template = models.CharField(
        max_length=255,
        default="Licence accordée à {nom} ({email}) - IP: {ip}"
    )
    watermark_opacity = models.DecimalField(max_digits=3, decimal_places=2, default=0.20)
    
    POSITION_CHOICES = [
        ("diagonal", "Diagonale"),
        ("header", "En-tête"),
        ("footer", "Pied de page"),
    ]
    watermark_position = models.CharField(max_length=32, choices=POSITION_CHOICES, default="diagonal")
    invisible_watermark_enabled = models.BooleanField(default=True)
    
    max_devices_per_user = models.IntegerField(default=3)
    loan_duration_days = models.IntegerField(default=30)
    
    lcp_drm_enabled = models.BooleanField(default=False)
    config_version = models.IntegerField(default=1)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"ProtectionConfig pour {self.ouvrage_id} (v{self.config_version})"


class TraceAcces(models.Model):
    """
    Journal légal immuable de chaque consultation de document protégé.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="traces_acces"
    )
    ouvrage = models.ForeignKey(
        'catalog.Ouvrage',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="traces_acces"
    )
    partner_id = models.CharField(max_length=64, blank=True, db_index=True)
    document_title = models.CharField(max_length=255, blank=True)
    ip_address = models.GenericIPAddressField()
    country = models.CharField(max_length=8, blank=True, db_index=True)
    user_agent = models.TextField(blank=True)
    device_fingerprint = models.CharField(max_length=255, blank=True)
    
    ACCESS_TYPE_CHOICES = [
        ("read_online", "Lecture en ligne"),
        ("read_chunk", "Lecture fragment Range 206"),
        ("text_request", "Requête texte TTS"),
        ("audio_stream", "Streaming audio"),
    ]
    access_type = models.CharField(max_length=32, choices=ACCESS_TYPE_CHOICES, default="read_chunk", db_index=True)
    page_number = models.IntegerField(null=True, blank=True)
    derived_hash = models.CharField(max_length=64, blank=True, db_index=True)
    institution = models.ForeignKey(
        'partners.Institution', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='traces_acces'
    )
    bouquet_subscription = models.ForeignKey(
        'partners.UniversityBouquetSubscription', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='traces_acces'
    )
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["user", "ouvrage", "-timestamp"]),
            models.Index(fields=["ip_address", "-timestamp"]),
            models.Index(fields=["country", "-timestamp"]),
        ]

    def __str__(self) -> str:
        return f"Trace {self.access_type} - {self.ip_address} ({self.timestamp})"


class DerivedCacheRegistry(models.Model):
    """
    Registre des dérivés matérialisés pour gérer le TTL et l'invalidation propre.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cache_key = models.CharField(max_length=64, unique=True, db_index=True)
    source_identifier = models.CharField(max_length=255, db_index=True)
    user_identifier = models.CharField(max_length=128, db_index=True)
    file_path = models.CharField(max_length=512)
    file_size = models.BigIntegerField()
    config_version = models.IntegerField(default=1)
    profil = models.CharField(max_length=16, default="standard")
    expires_at = models.DateTimeField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"DerivedCache {str(self.cache_key)[:8]} ({self.profil})"


class Annotation(models.Model):
    """
    Annotations et surlignages d'un lecteur sur un ouvrage.
    """
    TYPE_CHOICES = [("highlight", "Surlignage"), ("note", "Note")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='annotations')
    ouvrage = models.ForeignKey('catalog.Ouvrage', on_delete=models.CASCADE, related_name='annotations')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='highlight')
    position_data = models.JSONField(default=dict)
    selected_text = models.TextField(blank=True, default='')
    note_content = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=20, blank=True, default='gold')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=['user', 'ouvrage'])]
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"Annotation {self.type} par {self.user_id} sur {self.ouvrage_id}"


class GlobalDrmConfig(models.Model):
    """
    Configuration DRM globale du catalogue LAHAThèque (singleton).
    Distinct de ProtectionConfig qui est par ouvrage.
    L'unicité est garantie par le champ `id` fixé à 1 via get_or_create.
    """
    PROFIL_CHOICES = [
        ("standard", "Standard (Texte actif pour TTS & annotations)"),
        ("renforce", "Renforcé (Pages images sans couche texte)"),
    ]
    profil_default = models.CharField(max_length=16, choices=PROFIL_CHOICES, default="standard")

    watermark_template = models.CharField(
        max_length=500,
        default="Licence accordée à {nom} ({email}) - IP: {ip}",
        help_text="Variables disponibles : {nom}, {email}, {ip}"
    )
    watermark_laha_template = models.CharField(
        max_length=500,
        default="LAHAThèque • Document Certifié & Protégé",
        help_text="Texte principal du filigrane institutionnel LAHAThèque. Variables : {titre}, {id}"
    )
    watermark_laha_subtext = models.CharField(
        max_length=500,
        default="Licence accordée au Lecteur Authentifié • Reproduction interdite",
        help_text="Sous-texte légal du filigrane institutionnel LAHAThèque"
    )

    POSITION_CHOICES = [
        ("diagonal", "Diagonale"),
        ("header", "En-tête"),
        ("footer", "Pied de page"),
    ]
    watermark_position = models.CharField(max_length=32, choices=POSITION_CHOICES, default="diagonal")
    watermark_opacity = models.DecimalField(max_digits=3, decimal_places=2, default=0.20)
    invisible_watermark_enabled = models.BooleanField(default=True)

    allow_print = models.BooleanField(default=False)
    allow_copy = models.BooleanField(default=False)
    max_devices = models.IntegerField(default=3)
    session_duration_minutes = models.IntegerField(default=15)
    config_version = models.IntegerField(default=1)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuration DRM Globale"
        verbose_name_plural = "Configuration DRM Globale"

    def __str__(self) -> str:
        return f"GlobalDrmConfig v{self.config_version} — {self.profil_default}"

    @classmethod
    def get_singleton(cls) -> "GlobalDrmConfig":
        """Retourne ou crée l'unique instance de configuration globale."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
