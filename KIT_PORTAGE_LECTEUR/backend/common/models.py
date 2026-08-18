"""
common — Modèles abstraits de base partagés par toutes les apps.
Aucun modèle concret ici. Aucune migration générée.
"""
import uuid
from django.db import models


class UUIDModel(models.Model):
    """Base model with UUID primary key."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class TimestampedModel(models.Model):
    """Base model with automatic created_at / updated_at timestamps"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class UUIDTimestampedModel(UUIDModel, TimestampedModel):
    """Convenience base: UUID pk + timestamps."""

    class Meta:
        abstract = True
