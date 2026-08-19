from rest_framework.routers import DefaultRouter
from .views import (
    InstitutionViewSet,
    StudentAffiliationViewSet,
    PartnerAppAdminViewSet,
    PartnerSessionSupervisionViewSet,
    PartnerLogAdminViewSet,
)

app_name = 'partners'

router = DefaultRouter()
router.register(r'institutions', InstitutionViewSet, basename='institution')
router.register(r'affiliations', StudentAffiliationViewSet, basename='affiliation')
router.register(r'apps', PartnerAppAdminViewSet, basename='partner-app')
router.register(r'sessions', PartnerSessionSupervisionViewSet, basename='partner-session')
router.register(r'logs', PartnerLogAdminViewSet, basename='partner-log')

urlpatterns = router.urls
