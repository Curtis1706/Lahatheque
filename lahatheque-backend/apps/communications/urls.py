from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    submit_contact_view,
    submit_partnership_view,
    submit_public_manuscript_view,
    GuideCategoryViewSet,
    AdminGuideCategoryViewSet,
    AdminGuideArticleViewSet
)

router = DefaultRouter()
router.register(r'guides', GuideCategoryViewSet, basename='public-guides')
router.register(r'admin/guides/categories', AdminGuideCategoryViewSet, basename='admin-guide-category')
router.register(r'admin/guides/articles', AdminGuideArticleViewSet, basename='admin-guide-article')

urlpatterns = [
    path('contact/', submit_contact_view, name='submit-contact'),
    path('partnership/', submit_partnership_view, name='submit-partnership'),
    path('manuscript/', submit_public_manuscript_view, name='submit-manuscript'),
    path('', include(router.urls)),
]
