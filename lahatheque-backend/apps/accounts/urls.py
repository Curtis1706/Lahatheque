from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView, RegisterView, MeView, ProfileView, LogoutView, 
    MFASetupView, MFAVerifyView, OTPRequestView, OTPVerifyView
)
from .admin_views import AdminUserManagementViewSet

app_name = 'accounts'

router = DefaultRouter()
router.register(r'admin/users', AdminUserManagementViewSet, basename='admin-users')

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('profile/', ProfileView.as_view(), name='auth-profile'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('mfa/setup/', MFASetupView.as_view(), name='mfa-setup'),
    path('mfa/verify/', MFAVerifyView.as_view(), name='mfa-verify'),
    path('otp/request/', OTPRequestView.as_view(), name='otp-request'),
    path('otp/verify/', OTPVerifyView.as_view(), name='otp-verify'),
    path('', include(router.urls)),
]
