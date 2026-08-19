from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ReadBookView,
    LCPLicenseView,
    TraceAccesView,
    TraceAccesViewSet,
    ProtectionConfigViewSet,
    AnnotationViewSet,
    GlobalDrmConfigView,
)

app_name = 'protection'

router = DefaultRouter()
router.register(r'annotations', AnnotationViewSet, basename='annotation')
router.register(r'configs', ProtectionConfigViewSet, basename='protection-config')
router.register(r'audit-traces', TraceAccesViewSet, basename='protection-audit-trace')

urlpatterns = [
    path('read/<str:book_id>/', ReadBookView.as_view(), name='protection-read'),
    path('lcp/license/<str:book_id>/', LCPLicenseView.as_view(), name='lcp-license'),
    path('traces/', TraceAccesView.as_view(), name='protection-traces'),
    path('global-config/', GlobalDrmConfigView.as_view(), name='global-drm-config'),
    path('', include(router.urls)),
]



