from datetime import date
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.catalog.models import Ouvrage, Discipline
from apps.publishers_portal.models import Publisher

User = get_user_model()

class CatalogPricingTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin.test@lahatheque.bj",
            email="admin.test@lahatheque.bj",
            password="Password123!",
            role="admin"
        )
        self.client.force_authenticate(user=self.admin)

        self.discipline = Discipline.objects.create(
            name="Droit Constitutionnel",
            code_dewey="342"
        )
        self.publisher = Publisher.objects.create(
            company_name="Éditions LAHA Partner",
            name="Éditions LAHA Partner"
        )
        self.ouvrage = Ouvrage.objects.create(
            isbn="978-2-84129-999-9",
            title="Manuel de Droit Constitutionnel",
            publisher=self.publisher,
            discipline=self.discipline,
            publication_date=date(2026, 1, 15),
            price_digital=Decimal("4500.00"),
            price_paper=Decimal("8000.00"),
            status="published"
        )

    def test_catalog_pricing_serialization_and_discipline(self):
        """
        Vérifie que GET /api/v1/admin/catalog/pricing/ retourne HTTP 200 (pas 500)
        et que discipline et publisher_name sont sérialisés sous forme de chaînes.
        """
        response = self.client.get('/api/v1/admin/catalog/pricing/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertTrue(data.get("success"))
        books = data.get("data", [])
        self.assertGreaterEqual(len(books), 1)

        book = next(b for b in books if b["id"] == str(self.ouvrage.id))
        self.assertIsInstance(book["discipline"], str)
        self.assertEqual(book["discipline"], "Droit Constitutionnel")
        self.assertIsInstance(book["publisher_name"], str)
        self.assertEqual(book["publisher_name"], "Éditions LAHA Partner")
        self.assertEqual(book["price_digital"], 4500.0)
        self.assertEqual(book["price_paper"], 8000.0)
