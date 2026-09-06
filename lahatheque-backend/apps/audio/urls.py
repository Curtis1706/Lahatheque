from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AudioTrackViewSet,
    StreamStatusView,
    AudioTrackUploadView,
    AudioStreamSessionView,
    AudioListeningProgressView,
    AudioLockVerificationView,
)

app_name = 'audio'

router = DefaultRouter()
router.register(r'tracks-crud', AudioTrackViewSet, basename='audio-tracks-crud')

urlpatterns = [
    path('tracks/upload/', AudioTrackUploadView.as_view(), name='audio-track-upload'),
    path('ouvrages/<str:ouvrage_id>/session/', AudioStreamSessionView.as_view(), name='audio-stream-session'),
    path('tracks/<str:track_id>/progress/', AudioListeningProgressView.as_view(), name='audio-listening-progress'),
    path('verify-lock/', AudioLockVerificationView.as_view(), name='audio-verify-lock'),
    path('ouvrages/<str:ouvrage_id>/verify-lock/', AudioLockVerificationView.as_view(), name='audio-verify-lock-ouvrage'),
    path('deposits/<str:deposit_id>/verify-lock/', AudioLockVerificationView.as_view(), name='audio-verify-lock-deposit'),
    path('status/<str:stream_id>/', StreamStatusView.as_view(), name='stream-status'),
    path('', include(router.urls)),
]
