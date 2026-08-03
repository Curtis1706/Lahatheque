"""Modèle pour l'indexation et la classification IA des ouvrages."""
from django.db import models

class AiClassificationTask(models.Model):
    ouvrage = models.ForeignKey('catalog.Ouvrage', on_delete=models.CASCADE)
    status = models.CharField(max_length=30, default='pending') # pending / processing / completed / failed
    extracted_keywords = models.JSONField(default=list)
    suggested_category = models.CharField(max_length=255, blank=True)
    summary_ai = models.TextField(blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
