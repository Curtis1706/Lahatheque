from django.urls import path
from .views import (
    AuthorDashboardKPIsView,
    AuthorBooksListView,
    AuthorBookDetailView,
    AuthorRoyaltiesStatementsView,
    AuthorPayoutRequestView,
    AdminPayoutDecisionView,
    AuthorSubmissionsView,
)

app_name = 'rights'

urlpatterns = [
    path('author/kpis/', AuthorDashboardKPIsView.as_view(), name='author-kpis'),
    path('author/books/', AuthorBooksListView.as_view(), name='author-books'),
    path('author/books/<uuid:id>/', AuthorBookDetailView.as_view(), name='author-book-detail'),
    path('author/royalties/', AuthorRoyaltiesStatementsView.as_view(), name='author-royalties'),
    path('author/payout-request/', AuthorPayoutRequestView.as_view(), name='author-payout-request'),
    path('admin/payouts/<uuid:id>/decision/', AdminPayoutDecisionView.as_view(), name='admin-payout-decision'),
    path('author/submissions/', AuthorSubmissionsView.as_view(), name='author-submissions'),
]
