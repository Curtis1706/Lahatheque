"""
Modèles de données pour l'API Lecteur Hébergé, la gestion des sessions
partenaires multi-tenant, les quiz dynamiques et la traçabilité des webhooks.
Conforme à specs/009-api-lecteur-heberge/ et GUIDE_API_LECTEUR.md v2.0.
"""

import uuid
from typing import Any, Dict, List
from django.db import models
from django.utils import timezone


class PartnerApp(models.Model):
    """
    Application cliente partenaire enregistrée (LMS universitaire, école, SaaS tiers).
    Liée à une application OAuth2 pour l'authentification machine-to-machine.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, help_text="Nom de l'application cliente ou de l'institution")
    oauth_application = models.OneToOneField(
        'oauth2_provider.Application',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='partner_profile',
        help_text="Application OAuth2 pour l'authentification Client Credentials"
    )
    allowed_return_origins = models.JSONField(
        default=list,
        help_text="Liste des domaines/origines autorisés pour la redirection return_url (anti-open-redirect)"
    )
    webhook_url = models.URLField(
        blank=True,
        max_length=500,
        help_text="URL de callback pour l'envoi des événements temps réel"
    )
    webhook_secret = models.CharField(
        max_length=128,
        help_text="Clé secrète privée utilisée pour la signature HMAC-SHA256 des webhooks"
    )
    client_id = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        blank=True,
        null=True,
        help_text="Identifiant public complet du client OAuth2 Machine-to-Machine"
    )
    client_secret_hash = models.CharField(
        max_length=128,
        blank=True,
        help_text="Empreinte SHA-256 du secret client. Le secret en clair n'est JAMAIS stocké."
    )
    client_secret_last4 = models.CharField(
        max_length=4,
        blank=True,
        help_text="4 derniers caractères du secret pour affichage masqué (ex: ****a4f2)"
    )
    quotas = models.JSONField(
        default=dict,
        help_text="Limites d'utilisation (max_concurrent_sessions, max_daily_requests, etc.)"
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Application Partenaire"
        verbose_name_plural = "Applications Partenaires"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.name} ({self.id})"


class PartnerEndUser(models.Model):
    """
    Utilisateur fantôme représentant l'apprenant/lecteur distant.
    Assure l'isolation des données (annotations, progression) par partenaire.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    partner = models.ForeignKey(
        PartnerApp,
        on_delete=models.CASCADE,
        related_name='end_users',
        help_text="Partenaire propriétaire de cet utilisateur"
    )
    external_ref = models.CharField(
        max_length=255,
        db_index=True,
        help_text="Identifiant unique de l'utilisateur dans le système d'origine du partenaire"
    )
    display_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="Nom complet de l'apprenant pour le filigrane nominatif"
    )
    email = models.EmailField(
        blank=True,
        help_text="Adresse email de l'apprenant pour le filigrane et traçage"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    last_active_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Utilisateur Partenaire"
        verbose_name_plural = "Utilisateurs Partenaires"
        constraints = [
            models.UniqueConstraint(
                fields=['partner', 'external_ref'],
                name='unique_partner_external_user'
            )
        ]
        indexes = [
            models.Index(fields=['partner', 'external_ref']),
        ]

    def __str__(self) -> str:
        return f"{self.display_name or self.external_ref} [{self.partner.name}]"


class ReaderSession(models.Model):
    """
    Session éphémère de lecture hébergée.
    Supporte les ouvrages internes LAHAThèque et les documents externes distants (BYOD).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    partner = models.ForeignKey(
        PartnerApp,
        on_delete=models.CASCADE,
        related_name='sessions',
        help_text="Application partenaire ayant généré cette session"
    )
    
    SOURCE_TYPE_CHOICES = [
        ('catalog_book', 'Catalogue Interne LAHAThèque'),
        ('external_url', 'Document Externe Partenaire (BYOD)'),
        ('direct_upload', 'Upload Binaire Direct'),
    ]
    source_type = models.CharField(
        max_length=32,
        choices=SOURCE_TYPE_CHOICES,
        default='catalog_book',
        db_index=True,
        help_text="Provenance du document à lire"
    )
    
    ouvrage = models.ForeignKey(
        'catalog.Ouvrage',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reader_sessions',
        help_text="Ouvrage du catalogue si source_type=catalog_book"
    )
    
    custom_document_url = models.URLField(
        max_length=1000,
        blank=True,
        help_text="URL distante HTTPS du fichier PDF/Office si source_type=external_url"
    )
    custom_document_title = models.CharField(
        max_length=255,
        blank=True,
        help_text="Titre du document externe affiché dans le lecteur"
    )
    custom_document_author = models.CharField(
        max_length=255,
        blank=True,
        help_text="Auteur ou formateur du document externe"
    )
    custom_audio_url = models.URLField(
        max_length=1000,
        blank=True,
        help_text="URL distante optionnelle pour la piste audio d'accompagnement"
    )

    end_user = models.ForeignKey(
        PartnerEndUser,
        on_delete=models.CASCADE,
        related_name='sessions',
        help_text="Utilisateur final consommant cette session"
    )
    
    token_hash = models.CharField(
        max_length=64,
        db_index=True,
        help_text="Empreinte SHA-256 du token de session JWT éphémère"
    )
    
    theme = models.JSONField(
        default=dict,
        help_text="Configuration de la charte graphique partenaire (couleurs, logo, marque)"
    )
    quiz_config = models.JSONField(
        default=dict,
        help_text="Configuration des questions et règles d'évaluation du quiz"
    )
    tts_config = models.JSONField(
        default=dict,
        help_text="Configuration de la synthèse vocale (voix, débit, langues)"
    )
    permissions = models.JSONField(
        default=dict,
        help_text="Permissions accordées à la session (allow_tts, allow_annotations, allow_quiz)"
    )
    metadata = models.JSONField(
        default=dict,
        help_text="Métadonnées arbitraires transmises par le partenaire (course_id, module_id, etc.)"
    )
    
    return_url = models.URLField(
        max_length=500,
        help_text="URL de redirection de l'utilisateur après fin de lecture"
    )
    
    last_page = models.IntegerField(default=0, help_text="Dernière page consultée")
    reading_time_seconds = models.IntegerField(default=0, help_text="Temps de lecture cumulé en secondes")
    
    quiz_completed = models.BooleanField(default=False)
    quiz_score = models.FloatField(null=True, blank=True)
    
    STATUS_CHOICES = [
        ('created', 'Créée'),
        ('opened', 'Ouverte'),
        ('in_progress', 'En cours'),
        ('finished', 'Terminée'),
        ('expired', 'Expirée'),
        ('revoked', 'Révoquée'),
    ]
    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default='created',
        db_index=True
    )
    
    expires_at = models.DateTimeField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Session de Lecture Hébergée"
        verbose_name_plural = "Sessions de Lecture Hébergées"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=['partner', 'status']),
            models.Index(fields=['token_hash', 'expires_at']),
        ]

    def __str__(self) -> str:
        doc_title = self.ouvrage.titre if self.ouvrage else self.custom_document_title
        return f"Session {self.id} - {doc_title} ({self.status})"

    @property
    def is_valid(self) -> bool:
        """Indique si la session est active et non expirée."""
        return self.status in ['created', 'opened', 'in_progress'] and (not self.expires_at or timezone.now() < self.expires_at)

    def is_expired(self) -> bool:
        """Indique si la session a dépassé sa date limite."""
        return bool(self.expires_at and timezone.now() > self.expires_at)


class ResultatQuizSession(models.Model):
    """
    Résultat de l'évaluation interactive passée au cours d'une session.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.OneToOneField(
        ReaderSession,
        on_delete=models.CASCADE,
        related_name='quiz_result',
        help_text="Session de lecture associée à ce quiz"
    )
    quiz_title = models.CharField(max_length=255, default="Validation de Lecture")
    score_percent = models.FloatField(help_text="Score obtenu en pourcentage (0-100)")
    passing_score_percent = models.FloatField(default=70.0, help_text="Seuil de réussite exigé")
    is_passed = models.BooleanField(default=False, help_text="Indique si le seuil a été atteint")
    answers_detail = models.JSONField(
        default=list,
        help_text="Détail des réponses soumises pour chaque question"
    )
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Résultat de Quiz Session"
        verbose_name_plural = "Résultats de Quiz Sessions"
        ordering = ["-completed_at"]

    def __str__(self) -> str:
        status_txt = "Reussi" if self.is_passed else "Echoue"
        return f"Quiz {self.session_id}: {self.score_percent}% ({status_txt})"


class WebhookLog(models.Model):
    """
    Journal d'audit et de traçabilité des livraisons de webhooks aux partenaires.
    Garantit l'idempotence et le suivi des retries.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    partner = models.ForeignKey(
        PartnerApp,
        on_delete=models.CASCADE,
        related_name='webhook_logs'
    )
    session = models.ForeignKey(
        ReaderSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='webhook_logs'
    )
    event_type = models.CharField(
        max_length=64,
        db_index=True,
        help_text="Type d'événement (reader.session.opened, reader.quiz.completed, etc.)"
    )
    delivery_id = models.CharField(
        max_length=64,
        unique=True,
        help_text="UUID unique de l'envoi pour l'idempotence"
    )
    payload_json = models.TextField(help_text="Contenu brut du payload JSON transmis")
    status_code = models.IntegerField(null=True, blank=True, help_text="Code HTTP renvoyé par le serveur partenaire")
    response_body = models.TextField(blank=True, help_text="Corps de réponse renvoyé par le serveur tiers")
    attempt_count = models.IntegerField(default=1, help_text="Nombre de tentatives d'émission effectuées")
    is_success = models.BooleanField(default=False, db_index=True, help_text="Vrai si le code HTTP est 2xx")
    delivered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Journal de Webhook"
        verbose_name_plural = "Journaux de Webhooks"
        ordering = ["-delivered_at"]
        indexes = [
            models.Index(fields=['partner', 'event_type', '-delivered_at']),
        ]

    def __str__(self) -> str:
        return f"Webhook {self.event_type} vers {self.partner.name} ({self.delivery_id}) - {'OK' if self.is_success else 'ERR'}"


class ApiRequestLog(models.Model):
    """
    Journal RÉEL de chaque requête HTTP reçue sur l'API Lecteur Hébergé,
    capturée par un middleware Django (pas reconstruite a posteriori).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    partner = models.ForeignKey(
        PartnerApp, null=True, blank=True, on_delete=models.SET_NULL, related_name='request_logs'
    )
    method = models.CharField(max_length=10)
    endpoint = models.CharField(max_length=255, db_index=True)
    status_code = models.IntegerField()
    response_time_ms = models.IntegerField()
    client_ip = models.GenericIPAddressField(null=True, blank=True)
    request_id = models.CharField(max_length=64, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Journal de Requête API (Réel)"
        verbose_name_plural = "Journaux de Requêtes API (Réels)"
        ordering = ["-created_at"]
