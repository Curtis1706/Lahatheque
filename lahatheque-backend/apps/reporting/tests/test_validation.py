from datetime import date
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch

from apps.catalog.models import Ouvrage, Discipline
from apps.publishers_portal.models import Publisher

User = get_user_model()

class ValidationViewSetTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin.validation@lahatheque.bj",
            email="admin.validation@lahatheque.bj",
            password="Password123!",
            role="admin"
        )
        self.client.force_authenticate(user=self.admin)

        self.discipline = Discipline.objects.create(
            name="Droit des Affaires",
            code_dewey="346"
        )
        self.publisher = Publisher.objects.create(
            company_name="Éditions Juridiques Bénin",
            name="Éditions Juridiques Bénin"
        )
        self.ouvrage = Ouvrage.objects.create(
            isbn="978-2-84129-111-1",
            title="Droit des Sociétés Commerciales",
            publisher=self.publisher,
            discipline=self.discipline,
            publication_date=date(2026, 2, 1),
            page_count=312,
            status="pending_admin_approval"
        )

    def test_validation_list_returns_real_fields(self):
        """
        Vérifie que GET /api/v1/admin/validation/ retourne 200 et les vrais champs de l'ouvrage.
        """
        response = self.client.get('/api/v1/admin/validation/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertTrue(data.get("success"))
        items = data.get("data", [])
        self.assertGreaterEqual(len(items), 1)

        item = next(i for i in items if i["id"] == str(self.ouvrage.id))
        self.assertEqual(item["publisher_name"], "Éditions Juridiques Bénin")
        self.assertEqual(item["discipline"], "Droit des Affaires")
        self.assertEqual(item["page_count"], 312)

    @patch("apps.catalog.models.Ouvrage.objects.select_related")
    def test_validation_list_exception_returns_500_and_success_false(self, mock_select_related):
        """
        Vérifie qu'une exception en base retourne HTTP 500 et success=False (pas 200 avec data=[]).
        """
        mock_select_related.side_effect = Exception("Erreur DB simulée")
        response = self.client.get('/api/v1/admin/validation/')
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        data = response.json()
        self.assertFalse(data.get("success"))
        self.assertIn("Erreur", data.get("error", ""))
