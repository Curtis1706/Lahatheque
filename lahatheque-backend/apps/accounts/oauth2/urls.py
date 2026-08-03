from django.urls import path
from .views import OAuthTokenView, OAuthRevokeView

urlpatterns = [
    path('token/', OAuthTokenView.as_view(), name='oauth-token'),
    path('token/revoke/', OAuthRevokeView.as_view(), name='oauth-revoke'),
]
