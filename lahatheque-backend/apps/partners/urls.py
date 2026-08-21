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
)

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
    path('university/bouquets/<str:pk>/subscribe/', UniversityBouquetSubscribeView.as_view(), name='university-bouquet-subscribe'),
    path('university/affiliations/', UniversityAffiliationsView.as_view(), name='university-affiliations-list'),
    path('university/affiliations/<str:pk>/', UniversityAffiliationActionView.as_view(), name='university-affiliation-action'),
    path('university/paper-orders/', UniversityPaperOrdersView.as_view(), name='university-paper-orders'),
    path('university/royalties/', UniversityRoyaltiesView.as_view(), name='university-royalties'),
    path('university/royalties/withdraw/', UniversityRoyaltyWithdrawView.as_view(), name='university-royalty-withdraw'),
    path('university/profile/', UniversityProfileView.as_view(), name='university-profile'),
] + router.urls
