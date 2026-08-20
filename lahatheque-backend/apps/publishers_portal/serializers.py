from rest_framework import serializers
from .models import (
    PublisherProfile,
    PublisherBookDeposit,
    PublisherBatchImportLog,
    PublisherApiKey,
    PublisherRoyaltyPayment,
    PublisherAuditLog,
)

class PublisherProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublisherProfile
        fields = '__all__'

class PublisherBookDepositSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublisherBookDeposit
        fields = '__all__'

class PublisherBatchImportLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublisherBatchImportLog
        fields = '__all__'

class PublisherApiKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = PublisherApiKey
        fields = '__all__'

class PublisherRoyaltyPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublisherRoyaltyPayment
        fields = '__all__'

class PublisherAuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublisherAuditLog
        fields = '__all__'
