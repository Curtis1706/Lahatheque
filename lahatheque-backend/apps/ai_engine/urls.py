from django.urls import path
from .views import AnalyzeBookAIView

urlpatterns = [
    path('analyze/<uuid:book_id>/', AnalyzeBookAIView.as_view(), name='ai-analyze'),
]
