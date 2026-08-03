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
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class NotificationPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_preferences')
    email_enabled = models.BooleanField(default=True)
    in_app_enabled = models.BooleanField(default=True)
