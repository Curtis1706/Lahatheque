from rest_framework import serializers
from .models import ProtectionConfig, TraceAcces, Annotation, GlobalDrmConfig

class ProtectionConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProtectionConfig
        fields = '__all__'

class TraceAccesSerializer(serializers.ModelSerializer):
    class Meta:
        model = TraceAcces
        fields = '__all__'

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


