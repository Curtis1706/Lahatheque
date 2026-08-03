"""Modèles de droits d'auteur et calcul de redevances."""
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
