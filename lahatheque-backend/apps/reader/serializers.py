"""
Sérialiseurs DRF pour l'API Lecteur Hébergé.
Validation stricte des payloads de session, thèmes, quiz et synchronisation de progression.
"""

from typing import Any, Dict, List, Optional
from urllib.parse import urlparse
from django.conf import settings
from django.utils import timezone
from rest_framework import serializers
from apps.catalog.models import Ouvrage
from .models import PartnerApp, PartnerEndUser, ReaderSession, ResultatQuizSession


class ThemeConfigSerializer(serializers.Serializer):
    """Configuration de la thématisation de marque partenaire."""
    brand_name = serializers.CharField(max_length=255, default="LAHAThèque", required=False)
    brand_logo_url = serializers.URLField(max_length=500, required=False, allow_blank=True)
    primary_color = serializers.RegexField(
        regex=r"^#[0-9A-Fa-f]{6}$",
        default="#1B2A4E",
        required=False,
        help_text="Couleur primaire de l'en-tête (ex: #1B2A4E)"
    )
    accent_color = serializers.RegexField(
        regex=r"^#[0-9A-Fa-f]{6}$",
        default="#D4A017",
        required=False,
        help_text="Couleur d'accentuation dorée (ex: #D4A017)"
    )
    background_color = serializers.RegexField(
        regex=r"^#[0-9A-Fa-f]{6}$",
        default="#0F1A33",
        required=False,
        help_text="Arrière-plan sombre du canvas de lecture"
    )
    text_color = serializers.RegexField(
        regex=r"^#[0-9A-Fa-f]{6}$",
        default="#FFFFFF",
        required=False
    )
    border_color = serializers.RegexField(
        regex=r"^#[0-9A-Fa-f]{6}$",
        default="#2E3F66",
        required=False
    )
    font_family = serializers.CharField(max_length=100, default="Inter, sans-serif", required=False)


class QuizQuestionSerializer(serializers.Serializer):
    """Structure d'une question de quiz dynamique."""
    id = serializers.CharField(max_length=64)
    question = serializers.CharField(max_length=1000)
    options = serializers.ListField(child=serializers.CharField(max_length=500), min_length=2)
    correct_answer_index = serializers.IntegerField(required=False, min_value=0)
    correct_answer_indices = serializers.ListField(child=serializers.IntegerField(min_value=0), required=False)
    explanation = serializers.CharField(max_length=1000, required=False, allow_blank=True)


class QuizConfigSerializer(serializers.Serializer):
    """Configuration globale du quiz d'évaluation de lecture."""
    enabled = serializers.BooleanField(default=True)
    title = serializers.CharField(max_length=255, default="Validation de Lecture", required=False)
    passing_score_percent = serializers.FloatField(default=70.0, min_value=0.0, max_value=100.0, required=False)
    show_on_last_page = serializers.BooleanField(default=True, required=False)
    questions = serializers.ListField(child=QuizQuestionSerializer(), required=False, default=list)


class TTSConfigSerializer(serializers.Serializer):
    """Configuration de la synthèse vocale."""
    enabled = serializers.BooleanField(default=True)
    voice = serializers.ChoiceField(
        choices=["alloy", "echo", "fable", "onyx", "nova", "shimmer"],
        default="alloy",
        required=False
    )
    default_rate = serializers.FloatField(default=1.0, min_value=0.5, max_value=2.0, required=False)
    allowed_languages = serializers.ListField(child=serializers.CharField(max_length=10), default=["fr", "en"], required=False)


class PermissionsConfigSerializer(serializers.Serializer):
    """Permissions accordées à la session."""
    allow_tts = serializers.BooleanField(default=True, required=False)
    allow_annotations = serializers.BooleanField(default=True, required=False)
    allow_quiz = serializers.BooleanField(default=True, required=False)


class ReaderSessionCreateSerializer(serializers.Serializer):
    """
    Sérialiseur de création de session de lecture hébergée.
    Valide les sources (catalogue ou document externe), la redirection et les options.
    """
    source_type = serializers.ChoiceField(
        choices=['catalog_book', 'external_url', 'direct_upload'],
        default='catalog_book',
        required=False
    )
    book_id = serializers.CharField(max_length=64, required=False, allow_blank=True)
    document_url = serializers.URLField(max_length=1000, required=False, allow_blank=True)
    document_title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    document_author = serializers.CharField(max_length=255, required=False, allow_blank=True)
    audio_url = serializers.URLField(max_length=1000, required=False, allow_blank=True)

    external_user_ref = serializers.CharField(max_length=255, required=True)
    external_user_name = serializers.CharField(max_length=255, required=False, default="")
    external_user_email = serializers.EmailField(required=False, allow_blank=True)

    return_url = serializers.URLField(max_length=500, required=True)
    ttl_seconds = serializers.IntegerField(default=3600, min_value=300, max_value=86400, required=False)

    theme = ThemeConfigSerializer(required=False, default=dict)
    quiz = QuizConfigSerializer(required=False, default=dict)
    tts_config = TTSConfigSerializer(required=False, default=dict)
    permissions = PermissionsConfigSerializer(required=False, default=dict)
    metadata = serializers.DictField(required=False, default=dict)

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        source_type = attrs.get('source_type', 'catalog_book')

        # 1. Validation de la source du document
        if source_type == 'catalog_book':
            book_id = attrs.get('book_id')
            if not book_id:
                raise serializers.ValidationError({
                    "book_id": "Le champ 'book_id' est obligatoire lorsque 'source_type' est 'catalog_book'."
                })
            try:
                ouvrage = Ouvrage.objects.get(id=book_id)
                attrs['validated_ouvrage'] = ouvrage
            except Ouvrage.DoesNotExist:
                raise serializers.ValidationError({
                    "book_id": f"Ouvrage introuvable dans le catalogue LAHAThèque: '{book_id}'."
                })
        elif source_type == 'external_url':
            document_url = attrs.get('document_url')
            document_title = attrs.get('document_title')
            if not document_url:
                raise serializers.ValidationError({
                    "document_url": "Le champ 'document_url' est obligatoire pour un document distant externe."
                })
            if not document_title:
                attrs['document_title'] = "Document Externe Partenaire"

        # 2. Validation Anti-Open-Redirect sur return_url
        partner = self.context.get('partner')
        if partner and partner.allowed_return_origins:
            return_url = attrs.get('return_url', '')
            parsed_return = urlparse(return_url)
            return_origin = f"{parsed_return.scheme}://{parsed_return.netloc}"

            # Tolérance spéciale en mode DEBUG pour les tests sur serveur local (localhost / 127.0.0.1)
            is_local_dev = getattr(settings, 'DEBUG', False) and parsed_return.hostname in ['localhost', '127.0.0.1', '0.0.0.0']

            # Vérifie si l'origine est explicitement listée dans les origines autorisées du partenaire
            allowed = is_local_dev
            if not allowed:
                for allowed_orig in partner.allowed_return_origins:
                    if allowed_orig == "*" or return_origin == allowed_orig.rstrip('/') or return_url.startswith(allowed_orig):
                        allowed = True
                        break
            
            if not allowed:
                raise serializers.ValidationError({
                    "return_url": f"L'URL de retour '{return_url}' n'appartient pas aux origines autorisées par votre compte partenaire ({partner.allowed_return_origins})."
                })

        return attrs


class ReaderSessionDetailSerializer(serializers.ModelSerializer):
    """Sérialiseur de consultation d'état d'une session de lecture."""
    book = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    quiz_result = serializers.SerializerMethodField()

    class Meta:
        model = ReaderSession
        fields = [
            'id',
            'status',
            'source_type',
            'book',
            'external_user_ref',
            'progress',
            'quiz_result',
            'return_url',
            'theme',
            'permissions',
            'created_at',
            'expires_at',
        ]

    def get_book(self, obj: ReaderSession) -> Dict[str, Any]:
        if obj.ouvrage:
            return {
                "id": str(obj.ouvrage.id),
                "title": obj.ouvrage.titre,
                "author": obj.ouvrage.auteur,
                "total_pages": getattr(obj.ouvrage, 'nombre_pages', 0) or 64,
                "has_audio": bool(obj.custom_audio_url or getattr(obj.ouvrage, 'fichier_audio', None)),
            }
        return {
            "id": str(obj.id),
            "title": obj.custom_document_title or "Document Partenaire",
            "author": obj.custom_document_author or "Auteur Partenaire",
            "total_pages": 64,
            "has_audio": bool(obj.custom_audio_url),
        }

    def get_progress(self, obj: ReaderSession) -> Dict[str, Any]:
        return {
            "current_page": obj.last_page,
            "reading_time_seconds": obj.reading_time_seconds,
        }

    def get_quiz_result(self, obj: ReaderSession) -> Optional[Dict[str, Any]]:
        if hasattr(obj, 'quiz_result') and obj.quiz_result:
            qr = obj.quiz_result
            return {
                "completed": True,
                "score_percent": qr.score_percent,
                "is_passed": qr.is_passed,
                "completed_at": qr.completed_at,
            }
        return None


class QuizSubmitSerializer(serializers.Serializer):
    """Sérialiseur de soumission des réponses d'un quiz."""
    token = serializers.CharField(required=False)
    answers = serializers.ListField(
        child=serializers.DictField(),
        help_text="Liste des réponses: [{'question_id': 'q1', 'selected_option_index': 0}]"
    )


class ProgressSyncSerializer(serializers.Serializer):
    """Sérialiseur de synchronisation de la progression de lecture."""
    token = serializers.CharField(required=False)
    current_page = serializers.IntegerField(min_value=1)
    reading_time_seconds = serializers.IntegerField(min_value=0, required=False, default=0)
