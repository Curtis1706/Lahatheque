"""Administration Django pour les modèles de l'application Reader."""
from django.contrib import admin
from .models import PartnerApp, PartnerEndUser, ReaderSession, ResultatQuizSession, WebhookLog


@admin.register(PartnerApp)
class PartnerAppAdmin(admin.ModelAdmin):
    list_display = ('name', 'id', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'id')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(PartnerEndUser)
class PartnerEndUserAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'external_ref', 'partner', 'last_active_at')
    list_filter = ('partner',)
    search_fields = ('external_ref', 'display_name', 'email')
    readonly_fields = ('id', 'created_at', 'last_active_at')


@admin.register(ReaderSession)
class ReaderSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'partner', 'source_type', 'status', 'last_page', 'quiz_completed', 'quiz_score', 'expires_at')
    list_filter = ('status', 'source_type', 'partner', 'quiz_completed')
    search_fields = ('id', 'token_hash', 'custom_document_title', 'end_user__external_ref')
    readonly_fields = ('id', 'token_hash', 'created_at', 'updated_at')


@admin.register(ResultatQuizSession)
class ResultatQuizSessionAdmin(admin.ModelAdmin):
    list_display = ('session', 'quiz_title', 'score_percent', 'passing_score_percent', 'is_passed', 'completed_at')
    list_filter = ('is_passed',)
    search_fields = ('session__id', 'quiz_title')
    readonly_fields = ('id', 'completed_at')


@admin.register(WebhookLog)
class WebhookLogAdmin(admin.ModelAdmin):
    list_display = ('event_type', 'partner', 'delivery_id', 'status_code', 'is_success', 'attempt_count', 'delivered_at')
    list_filter = ('is_success', 'event_type', 'partner')
    search_fields = ('delivery_id', 'event_type', 'partner__name')
    readonly_fields = ('id', 'delivered_at')
