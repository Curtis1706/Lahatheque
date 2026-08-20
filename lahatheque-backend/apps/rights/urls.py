from django.urls import path
from .views import (
    AuthorDashboardKPIsView,
    AuthorBooksListView,
    AuthorBookDetailView,
    AuthorRoyaltiesStatementsView,
    AuthorPayoutRequestView,
    AdminPayoutDecisionView,
    AuthorSubmissionsView,
    LegalKpisView,
    LegalContractsListView,
    LegalContractDetailView,
    LegalRoyaltiesListView,
    LegalRoyaltiesBatchView,
    LegalAiSuggestionsListView,
    LegalAiSuggestionDecisionView,
    LegalPreEditionsListView,
    LegalRelancesListView,
)

app_name = 'rights'

urlpatterns = [
    # Auteur & Redevances
    path('author/kpis/', AuthorDashboardKPIsView.as_view(), name='author-kpis'),
    path('author/books/', AuthorBooksListView.as_view(), name='author-books'),
    path('author/books/<uuid:id>/', AuthorBookDetailView.as_view(), name='author-book-detail'),
    path('author/royalties/', AuthorRoyaltiesStatementsView.as_view(), name='author-royalties'),
    path('author/payout-request/', AuthorPayoutRequestView.as_view(), name='author-payout-request'),
    path('admin/payouts/<uuid:id>/decision/', AdminPayoutDecisionView.as_view(), name='admin-payout-decision'),
    path('author/submissions/', AuthorSubmissionsView.as_view(), name='author-submissions'),

    # Juriste / Legal Reviewer
    path('legal/kpis/', LegalKpisView.as_view(), name='legal-kpis'),
    path('legal/contracts/', LegalContractsListView.as_view(), name='legal-contracts-list'),
    path('legal/contracts/<uuid:id>/', LegalContractDetailView.as_view(), name='legal-contract-detail'),
    path('legal/royalties/', LegalRoyaltiesListView.as_view(), name='legal-royalties-list'),
    path('legal/royalties/batch/', LegalRoyaltiesBatchView.as_view(), name='legal-royalties-batch'),
    path('legal/ai-suggestions/', LegalAiSuggestionsListView.as_view(), name='legal-ai-suggestions-list'),
    path('legal/ai-suggestions/<str:id>/decide/', LegalAiSuggestionDecisionView.as_view(), name='legal-ai-suggestion-decide'),
    path('legal/pre-editions/', LegalPreEditionsListView.as_view(), name='legal-pre-editions-list'),
    path('legal/relances/', LegalRelancesListView.as_view(), name='legal-relances-list'),
]

