from django.contrib import admin
from .models import (
    Institution,
    Faculty,
    Department,
    StudentAffiliation,
    EtudiantInscrit,
    UniversityBouquetSubscription,
    UniversityPaperOrder,
    UniversityRoyaltyStatement,
)

@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "country", "city", "rector_name", "royalty_rate", "is_active")
    search_fields = ("name", "code", "city", "rector_name", "contact_email")
    list_filter = ("country", "is_active")

@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "institution", "dean_name", "student_count")
    search_fields = ("name", "code", "dean_name")
    list_filter = ("institution",)

@admin.register(StudentAffiliation)
class StudentAffiliationAdmin(admin.ModelAdmin):
    list_display = ("student_card_number", "student_name", "institution", "faculty", "level", "status", "created_at")
    search_fields = ("student_card_number", "student_name", "student_email")
    list_filter = ("status", "institution")

@admin.register(EtudiantInscrit)
class EtudiantInscritAdmin(admin.ModelAdmin):
    list_display = ("matricule", "nom", "prenom", "faculte", "institution", "is_claimed")
    search_fields = ("matricule", "nom", "prenom")
    list_filter = ("institution", "is_claimed")

@admin.register(UniversityBouquetSubscription)
class UniversityBouquetSubscriptionAdmin(admin.ModelAdmin):
    list_display = ("title", "institution", "bouquet_type", "annual_price", "currency", "status", "end_date")
    list_filter = ("status", "bouquet_type", "institution")

@admin.register(UniversityPaperOrder)
class UniversityPaperOrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "institution", "delivery_campus", "total_amount", "currency", "status", "created_at")
    list_filter = ("status", "institution")

@admin.register(UniversityRoyaltyStatement)
class UniversityRoyaltyStatementAdmin(admin.ModelAdmin):
    list_display = ("reference", "institution", "period", "total_sales_catalog", "royalty_rate", "net_royalty_amount", "currency", "status")
    list_filter = ("status", "institution")
