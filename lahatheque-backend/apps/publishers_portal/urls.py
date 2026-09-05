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
    PublisherBookProtectionView,
    PublisherExternalDepositView,
    PublisherExternalDepositStatusView,
    PublisherDepositReviewListView,
    PublisherDepositEditorialDecisionView,
    PublisherDepositRightsDecisionView,
    PublisherDepositPublishView,
    AdminDepositProtectionView,
)

app_name = 'publishers_portal'

router = DefaultRouter()
router.register(r'submissions-drafts', SubmissionViewSet, basename='submission-draft')

urlpatterns = [
    # ─── Espace Éditeur Tiers (BFF/REST) ───────────────────────────────────────
    path('kpis/', PublisherKpisView.as_view(), name='publisher-kpis'),
    path('catalog/', PublisherCatalogListView.as_view(), name='publisher-catalog-list'),
    path('catalog/<str:pk>/', PublisherCatalogDetailView.as_view(), name='publisher-catalog-detail'),
    path('catalog/<str:pk>/protection/', PublisherBookProtectionView.as_view(), name='publisher-book-protection'),
    path('ai/extract-metadata/', PublisherAiMetadataExtractView.as_view(), name='publisher-ai-metadata'),
    path('deposits/', PublisherDepositsView.as_view(), name='publisher-deposits'),
    path('deposits/batch/', PublisherBatchImportView.as_view(), name='publisher-deposits-batch'),
    path('admin/deposits/', PublisherDepositReviewListView.as_view(), name='publisher-deposit-review-list'),
    path('admin/deposits/<str:id>/editorial-decision/', PublisherDepositEditorialDecisionView.as_view(), name='publisher-deposit-editorial-decision'),
    path('admin/deposits/<str:id>/rights-decision/', PublisherDepositRightsDecisionView.as_view(), name='publisher-deposit-rights-decision'),
    path('admin/deposits/<str:id>/protection/', AdminDepositProtectionView.as_view(), name='admin-deposit-protection'),
    path('admin/deposits/<str:id>/publish/', PublisherDepositPublishView.as_view(), name='publisher-deposit-publish'),
    path('external/deposits/', PublisherExternalDepositView.as_view(), name='publisher-external-deposit'),
    path('external/deposits/<str:pk>/', PublisherExternalDepositStatusView.as_view(), name='publisher-external-deposit-status'),
    path('royalties/', PublisherRoyaltiesListView.as_view(), name='publisher-royalties-list'),
    path('royalties/withdraw/', PublisherRoyaltiesWithdrawView.as_view(), name='publisher-royalties-withdraw'),
    path('api-keys/', PublisherApiKeysView.as_view(), name='publisher-api-keys'),
    path('api-keys/<str:pk>/', PublisherApiKeyRevokeView.as_view(), name='publisher-api-key-revoke'),
    path('audit-logs/', PublisherAuditLogsView.as_view(), name='publisher-audit-logs'),
    path('profile/', PublisherProfileView.as_view(), name='publisher-profile'),
] + router.urls
