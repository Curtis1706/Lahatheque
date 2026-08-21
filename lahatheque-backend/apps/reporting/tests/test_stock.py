from datetime import date
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.catalog.models import Ouvrage, Discipline
from apps.publishers_portal.models import Publisher
from apps.commerce.models import Entrepot, StockOuvrage

User = get_user_model()

class StockViewSetTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin.stock@lahatheque.bj",
            email="admin.stock@lahatheque.bj",
            password="Password123!",
            role="admin"
        )
        self.client.force_authenticate(user=self.admin)

        self.publisher = Publisher.objects.create(
            company_name="Éditions Stock Test",
            name="Éditions Stock Test"
        )
        self.ouvrage = Ouvrage.objects.create(
            isbn="978-2-84129-888-8",
            title="Droit Commercial Général",
            publisher=self.publisher,
            publication_date=date(2026, 1, 1),
            price_paper=Decimal("6000.00")
        )
        self.entrepot = Entrepot.objects.create(
            nom="Entrepôt Test Cotonou",
            code="WAR-CTN-TEST",
            pays="Bénin",
            ville="Cotonou",
            is_active=True
        )
        self.stock = StockOuvrage.objects.create(
            ouvrage=self.ouvrage,
            entrepot=self.entrepot,
            quantite_reelle=150,
            quantite_reservee=10,
            seuil_alerte=20
        )

    def test_stock_list_aggregates_real_quantities(self):
        """
        Vérifie que GET /api/v1/admin/stock/ calcule les vraies métriques de stock.
        """
        response = self.client.get('/api/v1/admin/stock/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertTrue(data.get("success"))
        stock_data = data.get("data", {})
        self.assertEqual(stock_data.get("totalPhysicalStock"), 150)
        self.assertEqual(stock_data.get("totalStockValueXof"), 900000.0) # 150 * 6000.0
        warehouses = stock_data.get("warehouses", [])
        self.assertGreaterEqual(len(warehouses), 1)

        wh = next(w for w in warehouses if w["id"] == str(self.entrepot.id))
        self.assertEqual(wh["name"], "Entrepôt Test Cotonou")
        self.assertEqual(wh["total_items"], 150)
