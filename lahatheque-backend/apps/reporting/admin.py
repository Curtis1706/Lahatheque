from django.contrib import admin
from .models import InstitutionAnalytics, Notification, NotificationPreference
admin.site.register(InstitutionAnalytics)
admin.site.register(Notification)
admin.site.register(NotificationPreference)
