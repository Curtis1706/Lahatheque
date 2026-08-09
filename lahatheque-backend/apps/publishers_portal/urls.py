from rest_framework.routers import DefaultRouter
from .views import SubmissionViewSet

app_name = 'publishers_portal'

router = DefaultRouter()
router.register(r'submissions', SubmissionViewSet, basename='submission')

urlpatterns = router.urls

