"""
apps/reporting/admin_urls.py
Routeur des endpoints REST d'administration générale LAHAThèque v3.2.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.reporting.admin_views import (
    AdminPanoramicStatsAPIView,
    AdminGlobalSettingsAPIView,
    AdminReportExportAPIView,
    AdminSalesListAPIView,
    AdminSalesByCountryAPIView,
    AdminSubscriptionsListAPIView,
    AdminCatalogPricingViewSet,
    AdminRoyaltiesPayoutViewSet,
    AdminRemindersViewSet,
    AdminAuditLogViewSet,
    AdminValidationViewSet,
    AdminContractViewSet,
    AdminStockViewSet,
)
from apps.accounts.admin_views import AdminUserManagementViewSet

router = DefaultRouter()
router.register(r'users', AdminUserManagementViewSet, basename='admin-users')
router.register(r'catalog/pricing', AdminCatalogPricingViewSet, basename='admin-catalog-pricing')
router.register(r'royalties/payouts', AdminRoyaltiesPayoutViewSet, basename='admin-royalties-payouts')
router.register(r'reminders', AdminRemindersViewSet, basename='admin-reminders')
router.register(r'logs', AdminAuditLogViewSet, basename='admin-logs')
router.register(r'validation', AdminValidationViewSet, basename='admin-validation')
router.register(r'contracts', AdminContractViewSet, basename='admin-contracts')
router.register(r'stock', AdminStockViewSet, basename='admin-stock')

urlpatterns = [
    path('stats/panoramic/', AdminPanoramicStatsAPIView.as_view(), name='admin-panoramic-stats'),
    path('settings/global/', AdminGlobalSettingsAPIView.as_view(), name='admin-global-settings'),
    path('reports/export/', AdminReportExportAPIView.as_view(), name='admin-report-export'),
    path('sales/', AdminSalesListAPIView.as_view(), name='admin-sales-list'),
    path('sales/by-country/', AdminSalesByCountryAPIView.as_view(), name='admin-sales-by-country'),
    path('subscriptions/', AdminSubscriptionsListAPIView.as_view(), name='admin-subscriptions-list'),
    path('', include(router.urls)),
]
