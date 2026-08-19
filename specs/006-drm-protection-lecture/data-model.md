# Modele de Donnees: DRM, Protection de Lecture et Audit (Protection)

```python
"""
Modeles de donnees pour la protection DRM, la configuration de securite par ouvrage,
l'audit legal TraceAcces, le registre des derives caches et l'ingestion agnostique.
Conforme a docs/drm/01-architecture-cible.md, README.md et GUIDE_API_LECTEUR.md.
"""

import uuid
from django.db import models
from django.conf import settings


class ProtectionConfig(models.Model):
    """
    Configuration de protection associee a un ouvrage du catalogue.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ouvrage = models.OneToOneField(
        "catalog.Ouvrage",
        on_delete=models.CASCADE,
        related_name="protection_config"
    )
    
    # Profil de securite
    PROFIL_CHOICES = [
        ("standard", "Standard (Texte actif pour TTS & annotations)"),
        ("renforce", "Renforcé (Pages images sans couche texte)"),
    ]
    profil = models.CharField(max_length=16, choices=PROFIL_CHOICES, default="standard")
    
    # Restrictions d'usage
    allow_print = models.BooleanField(default=False)
    allow_copy = models.BooleanField(default=False)
    allow_download = models.BooleanField(default=False)
    
    # Filigrane visible
    watermark_visible = models.BooleanField(default=True)
    watermark_text_template = models.CharField(
        max_length=255,
        default="Licence accordée à {nom} ({email}) - IP: {ip}"
    )
    watermark_opacity = models.DecimalField(max_digits=3, decimal_places=2, default=0.20)
    watermark_position = models.CharField(
        max_length=32,
        choices=[("diagonal", "Diagonale"), ("header", "En-tête"), ("footer", "Pied de page")],
        default="diagonal"
    )
    
    # Tatouage invisible
    invisible_watermark_enabled = models.BooleanField(default=True)
    
    # Limites d'appareils et prets
    max_devices_per_user = models.IntegerField(default=3)
    loan_duration_days = models.IntegerField(default=30)
    
    # Flags et versioning
    lcp_drm_enabled = models.BooleanField(default=False)
    config_version = models.IntegerField(default=1) # Incremente pour invalider les caches
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "protection_config"

    def __str__(self) -> str:
        return f"ProtectionConfig pour {self.ouvrage_id} (v{self.config_version})"


class TraceAcces(models.Model):
    """
    Journal legal immuable de chaque consultation de document protege.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="traces_acces"
    )
    ouvrage = models.ForeignKey(
        "catalog.Ouvrage",
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
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "protection_trace_acces"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["user", "ouvrage", "-timestamp"]),
            models.Index(fields=["ip_address", "-timestamp"]),
            models.Index(fields=["country", "-timestamp"]),
        ]


class DerivedCacheRegistry(models.Model):
    """
    Registre des derives materialises pour gerer le TTL et l'invalidation propre.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cache_key = models.CharField(max_length=64, unique=True, db_index=True) # sha256
    source_identifier = models.CharField(max_length=255, db_index=True)
    user_identifier = models.CharField(max_length=128, db_index=True)
    file_path = models.CharField(max_length=512)
    file_size = models.BigIntegerField()
    config_version = models.IntegerField()
    profil = models.CharField(max_length=16)
    expires_at = models.DateTimeField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "protection_derived_cache"
```
