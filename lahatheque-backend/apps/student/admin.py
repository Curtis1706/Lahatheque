from django.contrib import admin
from .models import ReadingProgress, ReadingSession


@admin.register(ReadingProgress)
class ReadingProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'ouvrage', 'progress_percent', 'is_completed', 'is_favorite', 'last_read_at']
    list_filter = ['is_completed', 'is_favorite']
    search_fields = ['user__email', 'ouvrage__title']
    readonly_fields = ['last_read_at']


@admin.register(ReadingSession)
class ReadingSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'ouvrage', 'duration_seconds', 'pages_read', 'session_date']
    list_filter = ['session_date']
    search_fields = ['user__email', 'ouvrage__title']
