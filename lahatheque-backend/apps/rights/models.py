"""Modèles de droits d'auteur, calcul de redevances et demandes de versement."""
import uuid
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

class AuthorRight(models.Model):
    ouvrage = models.ForeignKey('catalog.Ouvrage', on_delete=models.CASCADE, related_name='author_rights')
    author = models.ForeignKey('catalog.BookAuthor', null=True, blank=True, on_delete=models.SET_NULL)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    role = models.CharField(max_length=50, default='auteur_principal')
    pool_share_percent = models.DecimalField(max_digits=5, decimal_places=2) # ex: 70.00%

class RightTerritory(models.Model):
    ouvrage = models.ForeignKey('catalog.Ouvrage', on_delete=models.CASCADE)
    allowed_countries = models.JSONField(default=list) # Codes ISO ex: ["BJ", "CI"]
    exclusive = models.BooleanField(default=True)

class RoyaltyRate(models.Model):
    ouvrage = models.ForeignKey('catalog.Ouvrage', on_delete=models.CASCADE)
    author_share_percent = models.DecimalField(max_digits=5, decimal_places=2)
    publisher_share_percent = models.DecimalField(max_digits=5, decimal_places=2)
    platform_share_percent = models.DecimalField(max_digits=5, decimal_places=2)

class RoyaltyCalculation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    period_month = models.DateField()
    ouvrage = models.ForeignKey('catalog.Ouvrage', on_delete=models.CASCADE)
    total_reads_count = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2)
    publisher_payout_amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_settled = models.BooleanField(default=False)

    @property
    def author_payout_total(self):
        return sum(line.payout_amount for line in self.payout_lines.all())

class RoyaltyPayoutLine(models.Model):
    calculation = models.ForeignKey(RoyaltyCalculation, on_delete=models.CASCADE, related_name='payout_lines')
    author_right = models.ForeignKey(AuthorRight, on_delete=models.PROTECT)
    payout_amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_settled = models.BooleanField(default=False)

class PayoutRequest(models.Model):
    """Demande de versement / retrait des droits d'auteur."""
    PAYMENT_METHODS = [
        ('momo', 'MTN Mobile Money'),
        ('moov', 'Moov Money'),
        ('orange', 'Orange Money / Wave'),
        ('bank', 'Virement Bancaire (RIB/IBAN)'),
    ]
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
        ('processed', 'Traité / Viré'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payout_requests')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='momo')
    account_details = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)
    transaction_reference = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        related_name='processed_payouts'
    )

    class Meta:
        ordering = ['-created_at']
