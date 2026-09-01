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
)
from .stream_views import BookStreamView

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
    path('creators/options/', CreatorOptionsView.as_view(), name='creator-options'),
    path('pre-editions/search/', PreEditionSearchView.as_view(), name='pre-edition-search'),
    path('authors/search/', AuthorSearchView.as_view(), name='author-search'),
    path('onix/import/', ONIXImportView.as_view(), name='onix-import'),
    path('books/<str:book_id>/stream/', BookStreamView.as_view(), name='book-stream'),
] + router.urls

