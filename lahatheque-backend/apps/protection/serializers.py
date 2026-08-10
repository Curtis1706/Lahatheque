from rest_framework import serializers
from .models import ProtectionConfig, TraceAcces, Annotation

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
