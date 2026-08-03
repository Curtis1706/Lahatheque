"""Modèles portail éditeur et workflows (Publisher, SubmissionDraft, ValidationWorkflowStep)."""
import uuid
from django.db import models
from django.conf import settings

class Publisher(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    rccm_number = models.CharField(max_length=100)
    country = models.CharField(max_length=2)
    contact_email = models.EmailField()
    bank_iban = models.CharField(max_length=100) # Encrypted at rest

class SubmissionDraft(models.Model):
    publisher = models.ForeignKey(Publisher, on_delete=models.CASCADE)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    raw_file = models.FileField(upload_to='submissions/')
    status = models.CharField(max_length=50, default='uploaded')

class ValidationWorkflowStep(models.Model):
    submission = models.ForeignKey(SubmissionDraft, on_delete=models.CASCADE, related_name='steps')
    step_name = models.CharField(max_length=50) # legal_review / layout_review
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=30, default='pending')
    comments = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
