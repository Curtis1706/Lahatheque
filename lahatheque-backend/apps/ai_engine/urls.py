from django.urls import path
from .views import ExtractBookMetadataAIView, CheckMetadataConsistencyAIView

app_name = 'ai_engine'

urlpatterns = [
    path('extract-metadata/', ExtractBookMetadataAIView.as_view(), name='ai-extract-metadata'),
    path('check-consistency/', CheckMetadataConsistencyAIView.as_view(), name='ai-check-consistency'),
]
