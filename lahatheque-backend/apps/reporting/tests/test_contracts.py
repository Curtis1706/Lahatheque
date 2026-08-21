from datetime import date
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.rights.models import ContratLegal

User = get_user_model()

class ContractViewSetTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin.contract@lahatheque.bj",
            email="admin.contract@lahatheque.bj",
            password="Password123!",
            role="admin"
        )
        self.client.force_authenticate(user=self.admin)

        self.contract = ContratLegal.objects.create(
            numero_contrat="CTR-2026-TEST-99",
            type_contrat="edition_auteur",
            titre="Contrat d'Édition Droit Privé",
            contracting_party="Prof. Mathieu KOUKPO",
            date_signature=date(2026, 1, 10),
            status="active"
        )

    def test_contract_list_returns_real_contrat_legal(self):
        """
        Vérifie que GET /api/v1/admin/contracts/ retourne le contrat réel ContratLegal
        et pas CTR-2026-088 inventé.
        """
        response = self.client.get('/api/v1/admin/contracts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertTrue(data.get("success"))
        contracts = data.get("data", [])
        self.assertGreaterEqual(len(contracts), 1)

        c = next(item for item in contracts if item["id"] == str(self.contract.id))
        self.assertEqual(c["contract_number"], "CTR-2026-TEST-99")
        self.assertEqual(c["partner_name"], "Prof. Mathieu KOUKPO")
        self.assertEqual(c["title"], "Contrat d'Édition Droit Privé")
