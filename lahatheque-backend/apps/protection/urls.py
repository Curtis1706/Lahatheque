from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReadBookView, LCPLicenseView, TraceAccesView, AnnotationViewSet

app_name = 'protection'

router = DefaultRouter()
router.register(r'annotations', AnnotationViewSet, basename='annotation')

urlpatterns = [
    path('read/<uuid:book_id>/', ReadBookView.as_view(), name='protection-read'),
    path('lcp/license/<uuid:book_id>/', LCPLicenseView.as_view(), name='lcp-license'),
    path('traces/', TraceAccesView.as_view(), name='protection-traces'),
    path('', include(router.urls)),
]

