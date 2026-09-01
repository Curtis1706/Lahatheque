"""
Routage des URLs de l'API Partenaire Externe (CDC Section 9.1).
Préfixe racine : /api/v1/partner/
"""
from django.urls import path
from .views import (
    PartnerCatalogListView,
    PartnerCatalogDetailView,
    PartnerBouquetsListView,
    PartnerBouquetLicenseCheckView,
    PartnerUsageStatsView,
)

app_name = "partner_api"

urlpatterns = [
    # ─── Consultation du Catalogue (CDC 9.1) ─────────────────────────────────
    path('catalog/', PartnerCatalogListView.as_view(), name='partner-catalog-list'),
    path('catalog/<str:id>/', PartnerCatalogDetailView.as_view(), name='partner-catalog-detail'),

    # ─── Bouquets & Licences (CDC 9.1) ────────────────────────────────────────
    path('bouquets/', PartnerBouquetsListView.as_view(), name='partner-bouquets-list'),
    path('bouquets/<str:offering_id>/check-access/', PartnerBouquetLicenseCheckView.as_view(), name='partner-bouquet-check-access'),

    # ─── Statistiques d'Usage (CDC 9.1) ──────────────────────────────────────
    path('stats/usage/', PartnerUsageStatsView.as_view(), name='partner-usage-stats'),
]
