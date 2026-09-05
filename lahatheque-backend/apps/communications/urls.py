from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    submit_contact_view,
    submit_partnership_view,
    submit_public_manuscript_view,
    GuideCategoryViewSet,
    AdminGuideCategoryViewSet,
    AdminGuideArticleViewSet,
    ProfessionalContactsListView,
    ProfessionalContactDetailView,
    ProfessionalContactBatchDeleteView,
    ProfessionalContactImportView,
    ProfessionalContactExportView,
    ProfessionalContactSendEmailView,
)

router = DefaultRouter()
router.register(r'guides', GuideCategoryViewSet, basename='public-guides')
router.register(r'admin/guides/categories', AdminGuideCategoryViewSet, basename='admin-guide-category')
router.register(r'admin/guides/articles', AdminGuideArticleViewSet, basename='admin-guide-article')

urlpatterns = [
    # Demandes publiques & formulaires
    path('contact/', submit_contact_view, name='submit-contact'),
    path('partnership/', submit_partnership_view, name='submit-partnership'),
    path('manuscript/', submit_public_manuscript_view, name='submit-manuscript'),

    # Carnet de contacts professionnels (Admin & Juriste)
    path('contacts/', ProfessionalContactsListView.as_view(), name='professional-contacts-list'),
    path('contacts/batch-delete/', ProfessionalContactBatchDeleteView.as_view(), name='professional-contacts-batch-delete'),
    path('contacts/import/', ProfessionalContactImportView.as_view(), name='professional-contacts-import'),
    path('contacts/export/', ProfessionalContactExportView.as_view(), name='professional-contacts-export'),
    path('contacts/send-email/', ProfessionalContactSendEmailView.as_view(), name='professional-contacts-send-email'),
    path('contacts/<uuid:contact_id>/', ProfessionalContactDetailView.as_view(), name='professional-contact-detail'),

    # Guides & documentation
    path('', include(router.urls)),
]

