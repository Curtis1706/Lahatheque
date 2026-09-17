from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    InstitutionViewSet,
    StudentAffiliationViewSet,
    PartnerAppAdminViewSet,
    PartnerSessionSupervisionViewSet,
    PartnerLogAdminViewSet,
)
from .university_views import (
    UniversityKpisView,
    UniversityFacultiesView,
    UniversityBouquetsView,
    UniversityBouquetSubscribeView,
    UniversityAffiliationsView,
    UniversityAffiliationActionView,
    UniversityPaperOrdersView,
    UniversityRoyaltiesView,
    UniversityRoyaltyWithdrawView,
    UniversityProfileView,
    ExportBouquetWordView,
    UniversityBouquetDistributionView,
    BouquetRelevanceReportView,
    UniversityClientCatalogView,
    UniversityPostPaymentCredentialsView,
    PartnerGuidePdfDownloadView,
)
from apps.reporting.admin_views import AdminBouquetOfferingsView

app_name = 'partners'

router = DefaultRouter()
router.register(r'institutions', InstitutionViewSet, basename='institution')
router.register(r'affiliations', StudentAffiliationViewSet, basename='affiliation')
router.register(r'apps', PartnerAppAdminViewSet, basename='partner-app')
router.register(r'sessions', PartnerSessionSupervisionViewSet, basename='partner-session')
router.register(r'logs', PartnerLogAdminViewSet, basename='partner-log')

urlpatterns = [
    # Endpoints Espace Université
    path('university/kpis/', UniversityKpisView.as_view(), name='university-kpis'),
    path('university/faculties/', UniversityFacultiesView.as_view(), name='university-faculties'),
    path('university/bouquets/', UniversityBouquetsView.as_view(), name='university-bouquets'),
    path('university/bouquets/<str:pk>/distribution/', UniversityBouquetDistributionView.as_view(), name='university-bouquet-distribution'),
    path('university/bouquets/<str:pk>/subscribe/', UniversityBouquetSubscribeView.as_view(), name='university-bouquet-subscribe'),
    path('university/bouquets/<str:pk>/export-word/', ExportBouquetWordView.as_view(), name='university-bouquet-export-word'),
    path('university/bouquets/<str:bouquet_id>/relevance/', BouquetRelevanceReportView.as_view(), name='university-bouquet-relevance-report'),
    path('bouquets/<uuid:bouquet_id>/relevance/', BouquetRelevanceReportView.as_view(), name='bouquet-relevance-report'),
    path('bouquets/<str:bouquet_id>/relevance/', BouquetRelevanceReportView.as_view()),
    path('university/affiliations/', UniversityAffiliationsView.as_view(), name='university-affiliations-list'),
    path('university/affiliations/<str:pk>/', UniversityAffiliationActionView.as_view(), name='university-affiliation-action'),
    path('university/paper-orders/', UniversityPaperOrdersView.as_view(), name='university-paper-orders'),
    path('university/royalties/', UniversityRoyaltiesView.as_view(), name='university-royalties'),
    path('university/royalties/withdraw/', UniversityRoyaltyWithdrawView.as_view(), name='university-royalty-withdraw'),
    path('university/profile/', UniversityProfileView.as_view(), name='university-profile'),
    path('university/catalog/', UniversityClientCatalogView.as_view(), name='university-client-catalog'),
    path('university/subscriptions/<uuid:pk>/credentials/', UniversityPostPaymentCredentialsView.as_view(), name='university-subscription-credentials'),
    path('university/subscriptions/<str:pk>/credentials/', UniversityPostPaymentCredentialsView.as_view()),
    path('university/guides/catalog-only-pdf/', PartnerGuidePdfDownloadView.as_view(), name='partner-guide-pdf-download'),
    path('admin/bouquets/', AdminBouquetOfferingsView.as_view(), name='partner-admin-bouquets'),
] + router.urls
