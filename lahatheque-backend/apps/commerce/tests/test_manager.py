from datetime import date
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.commerce.models import StockOuvrage, Entrepot, MouvementStock
from apps.catalog.models import Ouvrage, Discipline
from apps.publishers_portal.models import Publisher

User = get_user_model()

class ManagerViewsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.manager = User.objects.create_user(
            username="manager.test@lahatheque.bj",
            email="manager.test@lahatheque.bj",
            password="Password123!",
            role="manager"
        )
        self.client.force_authenticate(user=self.manager)

        self.pub_user = User.objects.create_user(
            username="publisher.test@lahatheque.bj",
            email="publisher.test@lahatheque.bj",
            password="Password123!",
            role="editeur"
        )
        self.publisher = Publisher.objects.create(
            user=self.pub_user,
            name="Éditions du Livre Test"
        )
        self.discipline = Discipline.objects.create(name="Droit")
        self.book = Ouvrage.objects.create(
            title="Droit Constitutionnel Béninois",
            isbn="978-2-84299-001-1",
            format_type="papier",
            publication_date=date(2026, 1, 1),
            publisher=self.publisher,
            discipline=self.discipline
        )
        self.warehouse = Entrepot.objects.create(
            nom="Hub Central Cotonou",
            code="HUB-CTN-01",
            pays="Bénin",
            ville="Cotonou",
            is_active=True
        )
        self.stock = StockOuvrage.objects.create(
            ouvrage=self.book,
            entrepot=self.warehouse,
            quantite_reelle=50,
            seuil_alerte=10
        )

    def test_manager_export_csv_stock_quantities(self):
        """
        Vérifie que GET /api/v1/commerce/manager/reports/export/?type=stock-quantities génère un CSV valide.
        """
        response = self.client.get('/api/v1/commerce/manager/reports/export/?type=stock-quantities&format=csv')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv; charset=utf-8')
        content = response.content.decode('utf-8')
        self.assertIn("ISBN,Titre,Entrepôt,Pays", content)
        self.assertIn("978-2-84299-001-1", content)

    def test_stock_escalate_uses_valid_movement_type(self):
        """
        Vérifie que POST /api/v1/commerce/manager/stock/escalate/ utilise 'adjustment' (valide dans MouvementStock.TYPE_CHOICES).
        """
        payload = {
            "stock_id": str(self.stock.id),
            "impact_description": "Besoin de réassort urgent pour réouverture académique"
        }
        response = self.client.post('/api/v1/commerce/manager/stock/escalate/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        mvt = MouvementStock.objects.filter(stock=self.stock).last()
        self.assertIsNotNone(mvt)
        self.assertEqual(mvt.type_mouvement, "adjustment")
        self.assertIn("[ESCALADE ADMIN]", mvt.motif)
