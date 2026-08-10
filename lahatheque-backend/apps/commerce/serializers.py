from rest_framework import serializers
from .models import Currency, SubscriptionPlan, Subscription, PaymentTransaction, Order, LigneCommande, PhysicalDelivery

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = '__all__'

class LigneCommandeSerializer(serializers.ModelSerializer):
    ouvrage_title = serializers.CharField(source='ouvrage.title', read_only=True)
    
    class Meta:
        model = LigneCommande
        fields = ['id', 'ouvrage', 'ouvrage_title', 'format_type', 'unit_price', 'quantity']

class PhysicalDeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = PhysicalDelivery
        fields = ['id', 'shipping_address', 'city', 'country', 'tracking_number', 'carrier_name', 'statut', 'updated_at']

class OrderSerializer(serializers.ModelSerializer):
    lignes = LigneCommandeSerializer(many=True, read_only=True)
    livraison = PhysicalDeliverySerializer(read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'total_amount', 'currency', 'statut_paiement', 'statut_commande', 'lignes', 'livraison', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

class CreateOrderItemSerializer(serializers.Serializer):
    ouvrage_id = serializers.UUIDField()
    format_type = serializers.ChoiceField(choices=['digital', 'paper'], default='digital')
    quantity = serializers.IntegerField(default=1, min_value=1)

class CreateOrderSerializer(serializers.Serializer):
    items = CreateOrderItemSerializer(many=True)
    payment_provider = serializers.ChoiceField(choices=['mock', 'moneroo', 'stripe'], default='mock')
    shipping_address = serializers.CharField(required=False, allow_blank=True, default='')
    city = serializers.CharField(required=False, allow_blank=True, default='')
    country = serializers.CharField(required=False, allow_blank=True, default='BJ')
