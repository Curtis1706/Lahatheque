from django.urls import path
from .views import AnalyzeBookAIView

app_name = 'ai_engine'

urlpatterns = [
    path('analyze/<uuid:book_id>/', AnalyzeBookAIView.as_view(), name='ai-analyze'),
]

