from django.contrib import admin
from .models import (
    PublisherProfile,
    PublisherBookDeposit,
    PublisherBatchImportLog,
    PublisherApiKey,
    PublisherRoyaltyPayment,
    PublisherAuditLog,
)

@admin.register(PublisherProfile)
class PublisherProfileAdmin(admin.ModelAdmin):
    list_display = ("company_name", "entity_type", "contact_person", "contact_email", "country", "is_verified")
    search_fields = ("company_name", "contact_person", "contact_email", "nif_number", "rccm_number")
    list_filter = ("entity_type", "country", "is_verified")

@admin.register(PublisherBookDeposit)
class PublisherBookDepositAdmin(admin.ModelAdmin):
    list_display = ("title", "publisher", "isbn_digital", "discipline", "status", "validation_step", "created_at")
    search_fields = ("title", "isbn_digital", "isbn_print", "discipline")
    list_filter = ("status", "validation_step", "discipline", "file_format")

@admin.register(PublisherBatchImportLog)
class PublisherBatchImportLogAdmin(admin.ModelAdmin):
    list_display = ("file_name", "publisher", "format", "total_records", "success_count", "error_count", "status", "created_at")
    list_filter = ("format", "status")

@admin.register(PublisherApiKey)
class PublisherApiKeyAdmin(admin.ModelAdmin):
    list_display = ("name", "publisher", "client_id", "status", "created_at", "last_used_at")
    list_filter = ("status",)

@admin.register(PublisherRoyaltyPayment)
class PublisherRoyaltyPaymentAdmin(admin.ModelAdmin):
    list_display = ("reference", "publisher", "period", "net_royalty_amount", "currency", "status", "created_at")
    list_filter = ("status", "currency")

@admin.register(PublisherAuditLog)
class PublisherAuditLogAdmin(admin.ModelAdmin):
    list_display = ("book_title", "publisher", "action_type", "user_masked", "ip_address_masked", "location", "timestamp")
    list_filter = ("action_type", "is_suspicious")
