from django.urls import path
from .views import CreateOrderView, OrderListView, OrderDetailView, SubscriptionPlanListView
from .webhooks import MonerooWebhookView, StripeWebhookView

app_name = 'commerce'

urlpatterns = [
    path('orders/', CreateOrderView.as_view(), name='commerce-orders-create'),
    path('orders/my/', OrderListView.as_view(), name='commerce-orders-list'),
    path('orders/<uuid:order_id>/', OrderDetailView.as_view(), name='commerce-orders-detail'),
    path('subscriptions/plans/', SubscriptionPlanListView.as_view(), name='commerce-subscriptions-plans'),
    path('webhooks/moneroo/', MonerooWebhookView.as_view(), name='webhook-moneroo'),
    path('webhooks/stripe/', StripeWebhookView.as_view(), name='webhook-stripe'),
]

