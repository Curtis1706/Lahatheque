from rest_framework import serializers
from .models import ProtectionConfig, TraceAcces, Annotation, GlobalDrmConfig

class ProtectionConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProtectionConfig
        fields = '__all__'

class TraceAccesSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    book_title = serializers.SerializerMethodField()

    class Meta:
        model = TraceAcces
        fields = '__all__'

    def get_user_email(self, obj):
        if obj.user:
            return obj.user.email
        return "lecteur@institution.bj"

    def get_user_name(self, obj):
        if obj.user:
            name = f"{obj.user.first_name} {obj.user.last_name}".strip()
            return name or obj.user.email
        return obj.document_title or "Lecteur Institutionnel"

    def get_book_title(self, obj):
        if obj.ouvrage:
            return obj.ouvrage.title
        return obj.document_title or "Ouvrage Académique"

class AnnotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Annotation
        fields = ['id', 'user', 'ouvrage', 'type', 'position_data', 'selected_text', 'note_content', 'color', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

class GlobalDrmConfigSerializer(serializers.ModelSerializer):
    watermark_opacity = serializers.FloatField(required=False)

    class Meta:
        model = GlobalDrmConfig
        fields = [
            'profil_default', 'watermark_template', 'watermark_laha_template',
            'watermark_laha_subtext', 'watermark_position',
            'watermark_opacity', 'invisible_watermark_enabled',
            'allow_print', 'allow_copy', 'max_devices',
            'session_duration_minutes', 'config_version', 'updated_at',
        ]
        read_only_fields = ['updated_at']


