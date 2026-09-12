from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AudioTrackViewSet,
    StreamStatusView,
    AudioTrackUploadView,
    AudioStreamSessionView,
    AudioPublicPreviewView,
    AudioListeningProgressView,
    AudioLockVerificationView,
    AudioEligibleBooksView,
    AudioStudioSubmitView,
    AudioManagementListView,
    AudioWorkflowTransitionView,
    AudioBookDetailManagementView,
    RecentAudioListeningsView,
)

app_name = 'audio'

router = DefaultRouter()
router.register(r'tracks-crud', AudioTrackViewSet, basename='audio-tracks-crud')

urlpatterns = [
    path('eligible-books/', AudioEligibleBooksView.as_view(), name='audio-eligible-books'),
    path('studio/submit/', AudioStudioSubmitView.as_view(), name='audio-studio-submit'),
    path('management/books/<str:book_id>/', AudioBookDetailManagementView.as_view(), name='audio-management-book-detail'),
    path('management/<str:role>/', AudioManagementListView.as_view(), name='audio-management-list'),
    path('management/<str:book_id>/transition/', AudioWorkflowTransitionView.as_view(), name='audio-workflow-transition'),
    path('recent-listenings/', RecentAudioListeningsView.as_view(), name='audio-recent-listenings'),
    path('tracks/upload/', AudioTrackUploadView.as_view(), name='audio-track-upload'),
    path('ouvrages/<str:ouvrage_id>/public-preview/', AudioPublicPreviewView.as_view(), name='audio-public-preview'),
    path('ouvrages/<str:ouvrage_id>/session/', AudioStreamSessionView.as_view(), name='audio-stream-session'),
    path('tracks/<str:track_id>/progress/', AudioListeningProgressView.as_view(), name='audio-listening-progress'),
    path('verify-lock/', AudioLockVerificationView.as_view(), name='audio-verify-lock'),
    path('ouvrages/<str:ouvrage_id>/verify-lock/', AudioLockVerificationView.as_view(), name='audio-verify-lock-ouvrage'),
    path('deposits/<str:deposit_id>/verify-lock/', AudioLockVerificationView.as_view(), name='audio-verify-lock-deposit'),
    path('status/<str:stream_id>/', StreamStatusView.as_view(), name='stream-status'),
    path('', include(router.urls)),
]
