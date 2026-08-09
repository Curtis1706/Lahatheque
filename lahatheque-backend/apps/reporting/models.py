"""Modèles d'analytics et notifications (InstitutionAnalytics, Notification, NotificationPreference)."""
from django.db import models
from django.conf import settings

class InstitutionAnalytics(models.Model):
    institution = models.ForeignKey('partners.Institution', on_delete=models.CASCADE)
    month = models.DateField()
    active_students_count = models.IntegerField(default=0)
    total_pages_read = models.IntegerField(default=0)
    most_read_disciplines = models.JSONField(default=list)

class Notification(models.Model):
    class NotificationType(models.TextChoices):
        SYSTEM = 'system', 'Système'
        MESSAGE = 'message', 'Message'
        BOOKING_CONFIRMED = 'booking_confirmed', 'Réservation Confirmée'
        BOOKING_REMINDER = 'booking_reminder', 'Rappel Réservation'
        COMMUNITY_REPLY = 'community_reply', 'Réponse Communauté'
        EXPERT_QUESTION = 'expert_question', 'Question Expert'
        EXPERT_REPLY = 'expert_reply', 'Réponse Expert'
        ASSIGNMENT_CREATED = 'assignment_created', 'Devoir Créé'
        ASSIGNMENT_GRADED = 'assignment_graded', 'Devoir Noté'
        ASSIGNMENT_SUBMITTED = 'assignment_submitted', 'Devoir Soumis'
        ASSIGNMENT_OVERDUE = 'assignment_overdue', 'Devoir En Retard'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=NotificationType.choices, default=NotificationType.SYSTEM)
    action_url = models.CharField(max_length=255, blank=True, default='')
    resource_id = models.CharField(max_length=255, blank=True, default='')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class NotificationPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_preferences')
    email_enabled = models.BooleanField(default=True)
    in_app_enabled = models.BooleanField(default=True)
    whatsapp_enabled = models.BooleanField(default=False)
    notify_on_messages = models.BooleanField(default=True)
    notify_on_bookings = models.BooleanField(default=True)
    notify_on_community = models.BooleanField(default=True)
    notify_on_marketing = models.BooleanField(default=False)
