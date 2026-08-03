from django.urls import path
from .views import SAMLLoginView, SAMLACSView

urlpatterns = [
    path('saml2/login/', SAMLLoginView.as_view(), name='saml-login'),
    path('saml2/acs/', SAMLACSView.as_view(), name='saml-acs'),
]
