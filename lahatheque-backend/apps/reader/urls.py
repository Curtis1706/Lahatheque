"""
Routage des URLs de l'application Reader pour LAHAThèque API v1.
Endpoints REST pour les sessions de lecture, validation de token, quiz et synchronisation.
"""

from django.urls import path
from .views import (
    ReaderProgressView,
    ReaderQuizSubmitView,
    ReaderSessionViewSet,
    ReaderValidateTokenView,
)

app_name = "reader"

urlpatterns = [
    # Création de session partenaire
    path('sessions/', ReaderSessionViewSet.as_view({'post': 'create'}), name='session-create'),
    
    # Consultation et révocation de session
    path('sessions/<uuid:pk>/', ReaderSessionViewSet.as_view({
        'get': 'retrieve',
        'delete': 'destroy'
    }), name='session-detail'),
    
    # Endpoint public de validation de token pour le front-end /read/[token]
    path('sessions/validate-token/', ReaderValidateTokenView.as_view(), name='session-validate-token'),
    
    # Synchronisation de progression de lecture
    path('sessions/progress/', ReaderProgressView.as_view(), name='session-progress'),
    
    # Soumission et notation de quiz interactif
    path('sessions/quiz-submit/', ReaderQuizSubmitView.as_view(), name='session-quiz-submit'),
]
