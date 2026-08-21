"""Routes URL pour l'Espace Client Lecteur / Étudiant."""
from django.urls import path
from .views import (
    StudentOverviewView,
    StudentBooksView,
    StudentBookDetailView,
    StudentToggleFavoriteView,
    StudentUpdateReadingProgressView,
    StudentHistoryStatsView,
    StudentOrdersView,
    StudentUniversityView,
    StudentCatalogView,
    StudentProfileView,
)

app_name = 'student'

urlpatterns = [
    # ─── Vue d'ensemble KPIs ─────────────────────────────────────────────────
    path('overview/', StudentOverviewView.as_view(), name='student-overview'),

    # ─── Ma Bibliothèque ──────────────────────────────────────────────────────
    path('books/', StudentBooksView.as_view(), name='student-books-list'),
    path('books/<str:book_id>/', StudentBookDetailView.as_view(), name='student-book-detail'),
    path('books/<str:book_id>/favorite/', StudentToggleFavoriteView.as_view(), name='student-book-favorite'),

    # ─── Progression de Lecture ───────────────────────────────────────────────
    path('reading/progress/', StudentUpdateReadingProgressView.as_view(), name='student-reading-progress'),

    # ─── Historique & Statistiques d'Étude ───────────────────────────────────
    path('history/stats/', StudentHistoryStatsView.as_view(), name='student-history-stats'),

    # ─── Achats & Commandes ───────────────────────────────────────────────────
    path('orders/', StudentOrdersView.as_view(), name='student-orders'),

    # ─── Mon Université & Affiliation ─────────────────────────────────────────
    path('university/', StudentUniversityView.as_view(), name='student-university'),

    # ─── Catalogue ────────────────────────────────────────────────────────────
    path('catalog/', StudentCatalogView.as_view(), name='student-catalog'),

    # ─── Mon Profil ───────────────────────────────────────────────────────────
    path('profile/', StudentProfileView.as_view(), name='student-profile'),
]
