from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.rights.models import ContratLegal
from apps.partners.models import Institution

User = get_user_model()

class RoyaltiesViewSetTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin.royalties@lahatheque.bj",
            email="admin.royalties@lahatheque.bj",
            password="Password123!",
            role="admin"
        )
        self.client.force_authenticate(user=self.admin)

        self.contract = ContratLegal.objects.create(
            numero_contrat="CTR-PUB-2026-TEST",
            type_contrat="editeur_tiers",
            titre="Convention Éditeur Test",
            contracting_party="Éditions Test Bénin",
            status="active"
        )
        self.institution = Institution.objects.create(
            name="Université Test Cotonou",
            code="UNIV-CTN-TEST",
            contract_reference="CONV-INST-2026-TEST",
            royalty_rate=15.00,
            is_active=True
        )

    def test_partner_configs_returns_real_partners(self):
        """
        Vérifie que GET /api/v1/admin/royalties/payouts/partners/ retourne les vrais contrats et universités.
        """
        response = self.client.get('/api/v1/admin/royalties/payouts/partners/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertTrue(data.get("success"))
        partners = data.get("data", [])
        self.assertGreaterEqual(len(partners), 2)

        c = next(p for p in partners if p["contract_reference"] == "CTR-PUB-2026-TEST")
        self.assertEqual(c["partner_name"], "Éditions Test Bénin")
        self.assertEqual(c["partner_type"], "publisher")

        inst = next(p for p in partners if p["contract_reference"] == "CONV-INST-2026-TEST")
        self.assertEqual(inst["partner_name"], "Université Test Cotonou")
        self.assertEqual(inst["custom_royalty_rate"], 15.0)

    def test_update_partner_rate_updates_institution_rate(self):
        """
        Vérifie que POST /api/v1/admin/royalties/payouts/partners/rate/ met à jour le taux d'une université.
        """
        payload = {
            "partner_id": str(self.institution.id),
            "new_rate": 18.5
        }
        response = self.client.post('/api/v1/admin/royalties/payouts/partners/rate/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.institution.refresh_from_db()
        self.assertEqual(float(self.institution.royalty_rate), 18.5)
