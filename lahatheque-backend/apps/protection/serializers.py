from rest_framework import serializers
from .models import ProtectionConfig, TraceAcces

class ProtectionConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProtectionConfig
        fields = '__all__'

class TraceAccesSerializer(serializers.ModelSerializer):
    class Meta:
        model = TraceAcces
        fields = '__all__'
