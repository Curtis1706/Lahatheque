from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import OuvrageViewSet, DisciplineViewSet, ONIXImportView

app_name = 'catalog'

router = DefaultRouter()
router.register(r'books', OuvrageViewSet, basename='ouvrage')
router.register(r'disciplines', DisciplineViewSet, basename='discipline')

urlpatterns = [
    path('onix/import/', ONIXImportView.as_view(), name='onix-import'),
] + router.urls


