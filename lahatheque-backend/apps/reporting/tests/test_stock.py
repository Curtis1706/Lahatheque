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

    def test_create_warehouse_success(self):
        """
        Vérifie la création d'un nouvel entrepôt via POST /api/v1/admin/stock/warehouses/.
        """
        payload = {
            "name": "Entrepôt Libreville Hub Sud",
            "code": "WAR-LBV-01",
            "country": "Gabon",
            "city": "Libreville",
            "manager_name": "Patrick Mba"
        }
        response = self.client.post('/api/v1/admin/stock/warehouses/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertTrue(data.get("success"))
        wh = data.get("data", {})
        self.assertEqual(wh["name"], "Entrepôt Libreville Hub Sud")
        self.assertEqual(wh["code"], "WAR-LBV-01")
        self.assertTrue(Entrepot.objects.filter(code="WAR-LBV-01").exists())

    def test_stock_movements_returns_real_mouvement_stock(self):
        """
        Vérifie que GET /api/v1/admin/stock/movements/ retourne les vrais mouvements MouvementStock
        et plus les 2 mouvements statiques fictifs.
        """
        from apps.commerce.models import MouvementStock
        mouvement = MouvementStock.objects.create(
            stock=self.stock,
            type_mouvement="manual_exit",
            quantite=-15,
            motif="Exemplaires abîmés transport",
            auteur=self.admin
        )

        response = self.client.get('/api/v1/admin/stock/movements/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertTrue(data.get("success"))
        movements = data.get("data", [])
        self.assertGreaterEqual(len(movements), 1)

        m = next(item for item in movements if item["id"] == str(mouvement.id))
        self.assertEqual(m["book_title"], "Droit Commercial Général")
        self.assertEqual(m["warehouse_name"], "Entrepôt Test Cotonou")
        self.assertEqual(m["quantity"], -15)
        self.assertEqual(m["reason"], "Exemplaires abîmés transport")

