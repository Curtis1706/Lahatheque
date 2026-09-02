from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import submit_contact_view, GuideViewSet

router = DefaultRouter()
router.register(r'guides', GuideViewSet, basename='guides')

urlpatterns = [
    path('contact/', submit_contact_view, name='submit-contact'),
    path('', include(router.urls)),
]
