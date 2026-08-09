from django.urls import path
from .views import StreamStatusView

app_name = 'audio'

urlpatterns = [
    path('status/<str:stream_id>/', StreamStatusView.as_view(), name='stream-status'),
]

