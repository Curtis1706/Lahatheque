from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import OuvrageViewSet, ONIXImportView

router = DefaultRouter()
router.register(r'books', OuvrageViewSet)

urlpatterns = [
    path('onix/import/', ONIXImportView.as_view(), name='onix-import'),
] + router.urls
