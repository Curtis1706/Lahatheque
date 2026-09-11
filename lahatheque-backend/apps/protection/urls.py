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
    ForensicAnalyzeView,
    ForensicMitigateView,
    ForensicReportView,
    ForensicInvestigationViewSet,
)

app_name = 'protection'

router = DefaultRouter()
router.register(r'annotations', AnnotationViewSet, basename='annotation')
router.register(r'configs', ProtectionConfigViewSet, basename='protection-config')
router.register(r'audit-traces', TraceAccesViewSet, basename='protection-audit-trace')
router.register(r'forensic/investigations', ForensicInvestigationViewSet, basename='forensic-investigations')

urlpatterns = [
    path('read/<str:book_id>/', ReadBookView.as_view(), name='protection-read'),
    path('lcp/license/<str:book_id>/', LCPLicenseView.as_view(), name='lcp-license'),
    path('traces/', TraceAccesView.as_view(), name='protection-traces'),
    path('global-config/', GlobalDrmConfigView.as_view(), name='global-drm-config'),
    # Endpoints forensiques d'investigation de fuites
    path('forensic/analyze/', ForensicAnalyzeView.as_view(), name='forensic-analyze'),
    path('forensic/mitigate/', ForensicMitigateView.as_view(), name='forensic-mitigate'),
    path('forensic/report/<uuid:investigation_id>/', ForensicReportView.as_view(), name='forensic-report'),
    path('', include(router.urls)),
]



