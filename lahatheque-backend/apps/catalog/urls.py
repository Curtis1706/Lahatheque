from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    OuvrageViewSet,
    DisciplineViewSet,
    DomainViewSet,
    CountryViewSet,
    MaquettisteDepositViewSet,
    ChiefLayoutValidationViewSet,
    ONIXImportView,
    PreEditionSearchView,
    AuthorSearchView,
    CreatorOptionsView,
    PublicInstitutionsListView,
    PersonalizedRecommendationsView,
)
from .stream_views import (
    BookStreamView,
    BookStreamInitiateView,
    BookStreamStatusView,
    BookSampleStreamView,
    BookCoverStreamView,
)

app_name = 'catalog'

router = DefaultRouter()
router.register(r'books', OuvrageViewSet, basename='ouvrage')
router.register(r'disciplines', DisciplineViewSet, basename='discipline')
router.register(r'domains', DomainViewSet, basename='domain')
router.register(r'countries', CountryViewSet, basename='country')

# Espace Maquettiste : CRUD sur ses propres dépôts
router.register(r'my-deposits', MaquettisteDepositViewSet, basename='my-deposits')

# Espace Chef Maquettiste : validation des dépôts soumis
router.register(r'deposits', ChiefLayoutValidationViewSet, basename='deposits')

urlpatterns = [
    path('institutions/', PublicInstitutionsListView.as_view(), name='public-institutions'),
    path('creators/options/', CreatorOptionsView.as_view(), name='creator-options'),
    path('pre-editions/search/', PreEditionSearchView.as_view(), name='pre-edition-search'),
    path('authors/search/', AuthorSearchView.as_view(), name='author-search'),
    path('onix/import/', ONIXImportView.as_view(), name='onix-import'),
    path('books/<str:book_id>/stream/', BookStreamView.as_view(), name='book-stream'),
    path('books/<str:book_id>/stream/initiate/', BookStreamInitiateView.as_view(), name='book-stream-initiate'),
    path('books/<str:book_id>/stream/status/', BookStreamStatusView.as_view(), name='book-stream-status'),
    path('books/<str:book_id>/sample/', BookSampleStreamView.as_view(), name='book-sample-stream'),
    path('books/<str:book_id>/cover/', BookCoverStreamView.as_view(), name='book-cover-stream'),
    path('recommendations/', PersonalizedRecommendationsView.as_view(), name='catalog-recommendations'),
    path('catalog/recommendations/', PersonalizedRecommendationsView.as_view()),
] + router.urls

