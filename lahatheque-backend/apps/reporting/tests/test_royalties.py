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
            institution_type="partner",
            is_active=True
        )
        self.client_institution = Institution.objects.create(
            name="Université Cliente Privée",
            code="UNIV-CLI-TEST",
            contract_reference="CONV-CLI-2026-TEST",
            royalty_rate=0.00,
            institution_type="client",
            is_active=True
        )

    def test_partner_configs_returns_real_partners_and_excludes_clients(self):
        """
        Vérifie que GET /api/v1/admin/royalties/payouts/partners/ retourne les vrais contrats et universités partenaires,
        et exclut rigoureusement les universités clientes (T022).
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

        # Vérifie qu'aucun établissement client n'est présent dans la liste des reversements
        client_matches = [p for p in partners if p["partner_id"] == str(self.client_institution.id)]
        self.assertEqual(len(client_matches), 0, "Une université cliente ne doit pas figurer dans les reversements partenaires (T022)")

    def test_update_partner_rate_updates_institution_rate(self):
        """
        Vérifie que POST /api/v1/admin/royalties/payouts/partners/rate/ met à jour le taux d'une université partenaire.
        """
        payload = {
            "partner_id": str(self.institution.id),
            "new_rate": 18.5
        }
        response = self.client.post('/api/v1/admin/royalties/payouts/partners/rate/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.institution.refresh_from_db()
        self.assertEqual(float(self.institution.royalty_rate), 18.5)

    def test_update_partner_rate_blocks_client_institution(self):
        """
        Vérifie que POST /api/v1/admin/royalties/payouts/partners/rate/ rejette la modification de taux pour une université cliente.
        """
        payload = {
            "partner_id": str(self.client_institution.id),
            "new_rate": 10.0
        }
        response = self.client.post('/api/v1/admin/royalties/payouts/partners/rate/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.client_institution.refresh_from_db()
        self.assertEqual(float(self.client_institution.royalty_rate), 0.0)
