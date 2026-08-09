from rest_framework.routers import DefaultRouter
from .views import InstitutionViewSet, StudentAffiliationViewSet

app_name = 'partners'

router = DefaultRouter()
router.register(r'institutions', InstitutionViewSet, basename='institution')
router.register(r'affiliations', StudentAffiliationViewSet, basename='affiliation')

urlpatterns = router.urls

