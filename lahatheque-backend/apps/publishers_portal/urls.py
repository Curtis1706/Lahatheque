from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import SubmissionViewSet
from .publisher_views import (
    PublisherKpisView,
    PublisherCatalogListView,
    PublisherCatalogDetailView,
    PublisherAiMetadataExtractView,
    PublisherDepositsView,
    PublisherBatchImportView,
    PublisherRoyaltiesListView,
    PublisherRoyaltiesWithdrawView,
    PublisherApiKeysView,
    PublisherApiKeyRevokeView,
    PublisherAuditLogsView,
    PublisherProfileView,
)

app_name = 'publishers_portal'

router = DefaultRouter()
router.register(r'submissions-drafts', SubmissionViewSet, basename='submission-draft')

urlpatterns = [
    # ─── Espace Éditeur Tiers (BFF/REST) ───────────────────────────────────────
    path('kpis/', PublisherKpisView.as_view(), name='publisher-kpis'),
    path('catalog/', PublisherCatalogListView.as_view(), name='publisher-catalog-list'),
    path('catalog/<str:pk>/', PublisherCatalogDetailView.as_view(), name='publisher-catalog-detail'),
    path('ai/extract-metadata/', PublisherAiMetadataExtractView.as_view(), name='publisher-ai-metadata'),
    path('deposits/', PublisherDepositsView.as_view(), name='publisher-deposits'),
    path('deposits/batch/', PublisherBatchImportView.as_view(), name='publisher-deposits-batch'),
    path('royalties/', PublisherRoyaltiesListView.as_view(), name='publisher-royalties-list'),
    path('royalties/withdraw/', PublisherRoyaltiesWithdrawView.as_view(), name='publisher-royalties-withdraw'),
    path('api-keys/', PublisherApiKeysView.as_view(), name='publisher-api-keys'),
    path('api-keys/<str:pk>/', PublisherApiKeyRevokeView.as_view(), name='publisher-api-key-revoke'),
    path('audit-logs/', PublisherAuditLogsView.as_view(), name='publisher-audit-logs'),
    path('profile/', PublisherProfileView.as_view(), name='publisher-profile'),
] + router.urls
