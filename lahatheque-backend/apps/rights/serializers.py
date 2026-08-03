from rest_framework import serializers
from .models import AuthorRight, RoyaltyCalculation, RoyaltyPayoutLine

class AuthorRightSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuthorRight
        fields = '__all__'

    def validate(self, data):
        # TODO: Valider que la somme des pool_share_percent = 100.00%
        return data

class RoyaltyCalculationSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoyaltyCalculation
        fields = '__all__'
