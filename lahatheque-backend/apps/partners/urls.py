from rest_framework.routers import DefaultRouter
from .views import InstitutionViewSet, StudentAffiliationViewSet

router = DefaultRouter()
router.register(r'institutions', InstitutionViewSet)
router.register(r'affiliations', StudentAffiliationViewSet)

urlpatterns = router.urls
