from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LibraryBookViewSet, 
    ReadingProgressViewSet,
    LibraryAnnotationViewSet,
    AuthorLibraryBookViewSet,
    BookQuizViewSet,
    BookQuizAttemptViewSet,
    PhysicalBookAdminViewSet,
    activate_book_token,
    get_book_by_token,
    download_resource_pdf,
    ShowcaseBookViewSet
)

router = DefaultRouter()
router.register(r'books', LibraryBookViewSet, basename='library-books')
router.register(r'author-books', AuthorLibraryBookViewSet, basename='author-library-books')
router.register(r'progress', ReadingProgressViewSet, basename='reading-progress')
router.register(r'annotations', LibraryAnnotationViewSet, basename='library-annotations')
router.register(r'quizzes', BookQuizViewSet, basename='library-quizzes')
router.register(r'attempts', BookQuizAttemptViewSet, basename='library-quiz-attempts')
router.register(r'admin/physical-books', PhysicalBookAdminViewSet, basename='admin-physical-books')
router.register(r'showcase-books', ShowcaseBookViewSet, basename='showcase-books')


urlpatterns = [
    path('', include(router.urls)),
    path('livre/activate/', activate_book_token, name='book-activate'),
    path('livre/<str:token>/', get_book_by_token, name='book-detail-by-token'),
    path('resources/<uuid:resource_id>/pdf/', download_resource_pdf, name='resource-pdf-download'),
]
