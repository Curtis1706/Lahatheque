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
        fields = [
            'id', 'shipping_address', 'city', 'country',
            'tracking_number', 'carrier_name', 'delivery_service', 'delivery_fee',
            'statut', 'updated_at',
            'date_livraison_souhaitee', 'plage_horaire_debut', 'plage_horaire_fin',
        ]

class OrderSerializer(serializers.ModelSerializer):
    lignes = LigneCommandeSerializer(many=True, read_only=True)
    livraison = PhysicalDeliverySerializer(read_only=True)
    delivery_status = serializers.SerializerMethodField()
    delivery_status_display = serializers.SerializerMethodField()

    def get_delivery_status(self, obj):
        livraison = getattr(obj, 'livraison', None)
        if livraison:
            return livraison.statut
        has_paper_line = obj.lignes.filter(format_type='paper').exists() if hasattr(obj, 'lignes') else False
        return 'sans_livraison' if has_paper_line else None

    def get_delivery_status_display(self, obj):
        livraison = getattr(obj, 'livraison', None)
        if livraison:
            return livraison.get_statut_display()
        has_paper_line = obj.lignes.filter(format_type='paper').exists() if hasattr(obj, 'lignes') else False
        return "Livraison non enregistrée — contactez le support" if has_paper_line else "Numérique (pas de livraison)"

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'total_amount', 'currency', 'statut_paiement', 'statut_commande',
            'delivery_status', 'delivery_status_display',
            'is_credit_purchase', 'credit_due_date', 'returned_at', 'return_reason',
            'lignes', 'livraison', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']

class CreateOrderItemSerializer(serializers.Serializer):
    ouvrage_id = serializers.UUIDField()
    format_type = serializers.ChoiceField(choices=['digital', 'paper'], default='digital')
    quantity = serializers.IntegerField(default=1, min_value=1)

class CreateOrderSerializer(serializers.Serializer):
    items = CreateOrderItemSerializer(many=True)
    payment_provider = serializers.ChoiceField(choices=['moneroo', 'manual'], default='moneroo')
    type_commande = serializers.ChoiceField(
        choices=['rentree_scolaire', 'personnel', 'institutionnel'], default='personnel'
    )
    mode_paiement = serializers.ChoiceField(
        choices=['mobile_money', 'virement', 'especes', 'carte'], default='mobile_money'
    )
    shipping_address = serializers.CharField(required=False, allow_blank=True, default='')
    city = serializers.CharField(required=False, allow_blank=True, default='')
    country = serializers.CharField(required=False, allow_blank=True, default='BJ')
    date_livraison_souhaitee = serializers.DateField(required=False, allow_null=True, default=None)
    plage_horaire_debut = serializers.TimeField(required=False, allow_null=True, default=None)
    plage_horaire_fin = serializers.TimeField(required=False, allow_null=True, default=None)
    is_credit_purchase = serializers.BooleanField(required=False, default=False)
    credit_due_date = serializers.DateField(required=False, allow_null=True, default=None)

