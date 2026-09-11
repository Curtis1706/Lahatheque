from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet
from .admin_views import AccountingLedgerExportView

app_name = 'reporting'

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('admin/accounting-ledger/export/', AccountingLedgerExportView.as_view(), name='reporting-admin-accounting-ledger-export'),
] + router.urls


