from django.urls import path
from .views import ReadBookView, LCPLicenseView, TraceAccesView

app_name = 'protection'

urlpatterns = [
    path('read/<uuid:book_id>/', ReadBookView.as_view(), name='protection-read'),
    path('lcp/license/<uuid:book_id>/', LCPLicenseView.as_view(), name='lcp-license'),
    path('traces/', TraceAccesView.as_view(), name='protection-traces'),
]

