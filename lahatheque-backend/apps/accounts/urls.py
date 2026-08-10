from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, RegisterView, MeView, LogoutView, MFASetupView, MFAVerifyView, OTPRequestView, OTPVerifyView

app_name = 'accounts'

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('mfa/setup/', MFASetupView.as_view(), name='mfa-setup'),
    path('mfa/verify/', MFAVerifyView.as_view(), name='mfa-verify'),
    path('otp/request/', OTPRequestView.as_view(), name='otp-request'),
    path('otp/verify/', OTPVerifyView.as_view(), name='otp-verify'),
]

