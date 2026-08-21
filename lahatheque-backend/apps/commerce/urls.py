from django.urls import path
from .views import CreateOrderView, OrderListView, OrderDetailView, SubscriptionPlanListView
from .webhooks import MonerooWebhookView, StripeWebhookView
from .manager_views import (
    ManagerKpisView,
    StockListView,
    StockDetailView,
    StockRestockView,
    StockManualExitView,
    StockMovementsView,
    StockAlertsView,
    DeliveriesListView,
    DeliveryDetailView,
    EntrepotsListView,
    StockEscalateView,
    ManagerReportExportView,
)
from .wholesaler_views import (
    WholesalerKpisView,
    WholesalerCatalogListView,
    WholesalerCatalogDetailView,
    WholesalerOrdersListView,
    WholesalerOrderDetailView,
    WholesalerOrderCancelView,
    WholesalerProfileView,
    WholesalerNotificationsListView,
)

app_name = 'commerce'

urlpatterns = [
    path('orders/', CreateOrderView.as_view(), name='commerce-orders-create'),
    path('orders/my/', OrderListView.as_view(), name='commerce-orders-list'),
    path('orders/<uuid:order_id>/', OrderDetailView.as_view(), name='commerce-orders-detail'),
    path('subscriptions/plans/', SubscriptionPlanListView.as_view(), name='commerce-subscriptions-plans'),
    path('webhooks/moneroo/', MonerooWebhookView.as_view(), name='webhook-moneroo'),
    path('webhooks/stripe/', StripeWebhookView.as_view(), name='webhook-stripe'),

    # ─── Manager : Stock & Livraison ───────────────────────────────────────────
    path('manager/kpis/', ManagerKpisView.as_view(), name='manager-kpis'),
    path('manager/reports/export/', ManagerReportExportView.as_view(), name='manager-reports-export'),
    path('manager/entrepots/', EntrepotsListView.as_view(), name='manager-entrepots'),
    path('manager/stock/', StockListView.as_view(), name='manager-stock-list'),
    path('manager/stock/restock/', StockRestockView.as_view(), name='manager-stock-restock'),
    path('manager/stock/exit/', StockManualExitView.as_view(), name='manager-stock-exit'),
    path('manager/stock/movements/', StockMovementsView.as_view(), name='manager-stock-movements'),
    path('manager/stock/alerts/', StockAlertsView.as_view(), name='manager-stock-alerts'),
    path('manager/stock/escalate/', StockEscalateView.as_view(), name='manager-stock-escalate'),
    path('manager/stock/<uuid:pk>/', StockDetailView.as_view(), name='manager-stock-detail'),
    path('manager/deliveries/', DeliveriesListView.as_view(), name='manager-deliveries-list'),
    path('manager/deliveries/<uuid:pk>/', DeliveryDetailView.as_view(), name='manager-delivery-detail'),

    # ─── Grossiste (B2B) ────────────────────────────────────────────────────────
    path('wholesaler/kpis/', WholesalerKpisView.as_view(), name='wholesaler-kpis'),
    path('wholesaler/catalog/', WholesalerCatalogListView.as_view(), name='wholesaler-catalog-list'),
    path('wholesaler/catalog/<uuid:pk>/', WholesalerCatalogDetailView.as_view(), name='wholesaler-catalog-detail'),
    path('wholesaler/orders/', WholesalerOrdersListView.as_view(), name='wholesaler-orders-list'),
    path('wholesaler/orders/<str:pk>/', WholesalerOrderDetailView.as_view(), name='wholesaler-order-detail'),
    path('wholesaler/orders/<str:pk>/cancel/', WholesalerOrderCancelView.as_view(), name='wholesaler-order-cancel'),
    path('wholesaler/profile/', WholesalerProfileView.as_view(), name='wholesaler-profile'),
    path('wholesaler/notifications/', WholesalerNotificationsListView.as_view(), name='wholesaler-notifications'),
]


