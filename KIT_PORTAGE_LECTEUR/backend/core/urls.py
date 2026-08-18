from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, StudentViewSet, TeacherViewSet, AuthorViewSet, ParentViewSet, 
    CourseViewSet, CourseAvailabilityViewSet, BookingViewSet,
    IncidentReportViewSet, PaymentConfigurationViewSet, TeacherPayoutViewSet,
    SecurityAlertViewSet, TeacherRatingViewSet, AdultStudentViewSet, EnhancedTeacherViewSet,
    ContentViewSet, QuestionViewSet, NotificationViewSet, FavoriteViewSet, CountryViewSet
)
from .content_views import EducationalContentViewSet, QCMViewSet, QCMQuestionViewSet, ContentRatingViewSet, ContentTagViewSet
from .auth_views import (
    login_view, logout_view, me_view, send_otp_view, verify_otp_view,
    password_reset_request_view, password_reset_confirm_view, change_password_view
)
from .upload_views import upload_file
from .video_views import serve_video
from .public_video_views import serve_public_video
from .public_content_views import public_videos_list
from .document_views import preview_document, get_pdf_info, get_pdf_page, proxy_document, get_pdf_text_all_pages
from .tts_views import generate_tts
from .views_guide import GuideCategoryViewSet, AdminGuideCategoryViewSet, AdminGuideArticleViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'students', StudentViewSet)
router.register(r'teachers', TeacherViewSet)
router.register(r'authors', AuthorViewSet)
router.register(r'parent', ParentViewSet, basename='parent')
router.register(r'courses', CourseViewSet)
router.register(r'course-availabilities', CourseAvailabilityViewSet)
router.register(r'incident-reports', IncidentReportViewSet)
router.register(r'payment-configurations', PaymentConfigurationViewSet)
router.register(r'teacher-payouts', TeacherPayoutViewSet)
router.register(r'security-alerts', SecurityAlertViewSet)
router.register(r'teacher-ratings', TeacherRatingViewSet)
router.register(r'adult-students', AdultStudentViewSet, basename='adult-student')
router.register(r'enhanced-teachers', EnhancedTeacherViewSet, basename='enhanced-teacher')
router.register(r'bookings', BookingViewSet)
router.register(r'author/contents', ContentViewSet, basename='author-contents')
router.register(r'author/questions', QuestionViewSet, basename='author-questions')
router.register(r'notifications', NotificationViewSet)
router.register(r'favorites', FavoriteViewSet, basename='favorite')
router.register(r'countries', CountryViewSet, basename='countries')
router.register(r'guides', GuideCategoryViewSet, basename='guide')
router.register(r'admin/guides/categories', AdminGuideCategoryViewSet, basename='admin-guide-category')
router.register(r'admin/guides/articles', AdminGuideArticleViewSet, basename='admin-guide-article')

# URLs pour la gestion des contenus pédagogiques
router.register(r'educational-content', EducationalContentViewSet)
router.register(r'qcm', QCMViewSet)
router.register(r'qcm-questions', QCMQuestionViewSet)
router.register(r'content-ratings', ContentRatingViewSet)
router.register(r'content-tags', ContentTagViewSet)

urlpatterns = [
    path('auth/login/', login_view, name='login'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/me/', me_view, name='me'),
    path('me/', me_view, name='me-alias'),
    path('auth/otp/send/', send_otp_view, name='send-otp'),
    path('auth/otp/verify/', verify_otp_view, name='verify-otp'),
    path('auth/password/reset/', password_reset_request_view, name='password-reset-request'),
    path('auth/password/reset/confirm/', password_reset_confirm_view, name='password-reset-confirm'),
    path('auth/password/change/', change_password_view, name='password-change'),
    path('', include(router.urls)),
    path('upload/', upload_file, name='upload'),
    path('video/<path:video_path>', serve_video, name='serve_video'),
    path('documents/preview/', preview_document, name='preview-document'),
    path('documents/proxy/', proxy_document, name='proxy-document'),
    path('documents/info/', get_pdf_info, name='pdf-info'),
    path('documents/page/', get_pdf_page, name='pdf-page'),
    path('documents/text/', get_pdf_text_all_pages, name='document-text-all'),
    path('public/video/<path:video_path>', serve_public_video, name='serve_public_video'),
    path('public/videos/', public_videos_list, name='public_videos_list'),
    path('tts/generate/', generate_tts, name='tts-generate'),
]
