# Modele de Donnees: Module 6 - Lecteur Securise et DRM (Reader)

```python
"""
Modeles de donnees pour la protection DRM, le suivi des sessions de lecture,
l'audit legal TraceAcces et les quiz partenaires.
Conforme a la section 6, docs/drm/ et GUIDE_API_LECTEUR.md.
"""

import uuid
from django.db import models


class ProtectionConfig(models.Model):
    """
    Configuration des regles de protection appliquees a un ouvrage.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ouvrage = models.OneToOneField(
        "catalog.Ouvrage",
        on_delete=models.CASCADE,
        related_name="protection_config"
    )
    # Profils : standard (texte actif pour TTS) ou renforce (pages images)
    PROFIL_CHOICES = [("standard", "Standard"), ("renforce", "Renforcé (Anti-exfiltration)")]
    profil = models.CharField(max_length=16, choices=PROFIL_CHOICES, default="standard")
    
    # Filigrane visible
    watermark_visible_actif = models.BooleanField(default=True)
    watermark_texte_custom = models.CharField(max_length=255, blank=True)
    watermark_opacite = models.DecimalField(max_digits=3, decimal_places=2, default=0.20)
    
    # Tatouage invisible et restrictions
    tatouage_invisible_actif = models.BooleanField(default=True)
    restriction_telechargement = models.BooleanField(default=True)
    restriction_impression = models.BooleanField(default=True)
    restriction_copier_coller = models.BooleanField(default=True)
    
    # Versioning de configuration pour invalidation du cache de derive
    config_version = models.IntegerField(default=1)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "protection_config"


class SessionLectureSecurisee(models.Model):
    """
    Session de lecture ephemere creee pour un utilisateur direct ou un partenaire API.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_token = models.CharField(max_length=512, unique=True, db_index=True)
    user = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    ouvrage = models.ForeignKey("catalog.Ouvrage", on_delete=models.PROTECT)
    partner_id = models.CharField(max_length=64, blank=True, db_index=True)
    
    # Personnalisation partenaire
    custom_theme = models.JSONField(default=dict, blank=True)  # primary_color, brand_name, brand_logo_url
    custom_quiz = models.JSONField(default=dict, blank=True)   # configuration des questions et seuil
    
    # Progression
    derniere_page = models.IntegerField(default=1)
    pourcentage_progression = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    secondes_lecture_total = models.IntegerField(default=0)
    
    expires_at = models.DateTimeField(db_index=True)
    is_revoked = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reader_session_lecture"
        ordering = ["-created_at"]


class TraceAcces(models.Model):
    """
    Journal legal immuable de chaque consultation de document.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(SessionLectureSecurisee, on_delete=models.CASCADE, related_name="traces", null=True, blank=True)
    user = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    ouvrage = models.ForeignKey("catalog.Ouvrage", on_delete=models.PROTECT)
    action = models.CharField(max_length=64, db_index=True)  # "open_document", "read_page_N", "audio_play"
    page_numero = models.IntegerField(null=True, blank=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    device_fingerprint = models.CharField(max_length=128, blank=True)
    pays_origine = models.CharField(max_length=64, blank=True, db_index=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "protection_trace_acces"
        ordering = ["-timestamp"]


class ResultatQuizSession(models.Model):
    """
    Score et reponses d'un apprenant sur le quiz d'une session.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.OneToOneField(SessionLectureSecurisee, on_delete=models.CASCADE, related_name="resultat_quiz")
    score_obtenu = models.DecimalField(max_digits=5, decimal_places=2)  # ex: 85.00 %
    seuil_reussite = models.DecimalField(max_digits=5, decimal_places=2, default=70.00)
    is_passed = models.BooleanField(default=False)
    reponses_detail = models.JSONField(default=list)
    webhook_status = models.CharField(max_length=16, choices=[("pending", "En attente"), ("sent", "Envoyé"), ("failed", "Échec")], default="pending")
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reader_resultat_quiz"
```
