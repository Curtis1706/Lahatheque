from django.urls import path
from .views import StreamStatusView

urlpatterns = [
    path('status/<str:stream_id>/', StreamStatusView.as_view(), name='stream-status'),
]
