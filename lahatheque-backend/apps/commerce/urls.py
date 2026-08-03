from django.urls import path
from .views import CheckoutView
from .webhooks import MonerooWebhookView, StripeWebhookView

urlpatterns = [
    path('checkout/', CheckoutView.as_view(), name='commerce-checkout'),
    path('webhooks/moneroo/', MonerooWebhookView.as_view(), name='webhook-moneroo'),
    path('webhooks/stripe/', StripeWebhookView.as_view(), name='webhook-stripe'),
]
