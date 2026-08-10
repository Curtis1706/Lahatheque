"""Modèles commerciaux (Currency, SubscriptionPlan, Subscription, PaymentTransaction)."""
import uuid
from django.db import models
from django.conf import settings

class Currency(models.Model):
    code = models.CharField(max_length=3, unique=True) # ISO 4217: XOF, XAF, CDF, EUR, USD
    is_pegged = models.BooleanField(default=False) # True pour XOF et XAF
    peg_rate_to_eur = models.DecimalField(max_digits=12, decimal_places=6, null=True, blank=True)
    last_updated_at = models.DateTimeField(auto_now=True)

class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=255)
    plan_type = models.CharField(max_length=50) # individual / institution_bouquet
    price_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    duration_days = models.IntegerField(default=365)
    max_concurrent_users = models.IntegerField(default=1)

class Subscription(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    institution = models.ForeignKey('partners.Institution', null=True, blank=True, on_delete=models.SET_NULL)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    starts_at = models.DateTimeField()
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)

class PaymentTransaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    moneroo_id = models.CharField(max_length=255, null=True, blank=True, unique=True)
    stripe_payment_intent = models.CharField(max_length=255, null=True, blank=True, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    amount_converted_xof = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=30, default='pending')
    raw_webhook_payload = models.JSONField(default=dict, blank=True)

class WebhookEvent(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'En attente'
        PROCESSED = 'processed', 'Traité'
        FAILED = 'failed', 'Échoué'

    event_id = models.CharField(max_length=255, unique=True)
    event_type = models.CharField(max_length=100)
    payload = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

class Order(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('paid', 'Payé'),
        ('failed', 'Échoué'),
        ('refunded', 'Remboursé'),
    ]
    ORDER_STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('processing', 'En traitement'),
        ('completed', 'Terminée'),
        ('cancelled', 'Annulée'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='commandes')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    statut_paiement = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    statut_commande = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='pending')
    payment_transaction = models.ForeignKey(PaymentTransaction, null=True, blank=True, on_delete=models.SET_NULL, related_name='commandes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

class LigneCommande(models.Model):
    FORMAT_CHOICES = [
        ('digital', 'Numérique (EPUB/PDF)'),
        ('paper', 'Livre Papier'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commande = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='lignes')
    ouvrage = models.ForeignKey('catalog.Ouvrage', on_delete=models.CASCADE, related_name='lignes_commandes')
    format_type = models.CharField(max_length=20, choices=FORMAT_CHOICES, default='digital')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField(default=1)

class PhysicalDelivery(models.Model):
    STATUS_CHOICES = [
        ('en_preparation', 'En préparation'),
        ('expedie', 'Expédié'),
        ('livre', 'Livré'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commande = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='livraison')
    shipping_address = models.TextField()
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=2, default='BJ')
    tracking_number = models.CharField(max_length=100, blank=True, default='')
    carrier_name = models.CharField(max_length=100, blank=True, default='')
    statut = models.CharField(max_length=30, choices=STATUS_CHOICES, default='en_preparation')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

