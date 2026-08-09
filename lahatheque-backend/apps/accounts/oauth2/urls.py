from django.urls import path
from .views import OAuthTokenView, OAuthRevokeView

app_name = 'oauth2'

urlpatterns = [
    path('token/', OAuthTokenView.as_view(), name='oauth-token'),
    path('token/revoke/', OAuthRevokeView.as_view(), name='oauth-revoke'),
]

