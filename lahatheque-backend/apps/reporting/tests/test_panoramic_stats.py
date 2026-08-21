from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from apps.commerce.models import Order, LigneCommande
from apps.catalog.models import Ouvrage

class PanoramicStatsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin_panoramic_test',
            email='admin_panoramic_test@lahatheque.com',
            password='Password123!',
            role='admin',
            first_name='Admin',
            last_name='Test'
        )
        self.client.force_authenticate(user=self.admin)

    def test_panoramic_stats_no_fake_floors(self):
        """
        Vérifie que les KPI et courbes statistiques reflètent les données réelles sans planchers factices (ex: 16200000).
        """
        response = self.client.get('/api/v1/admin/stats/panoramic/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        json_data = response.json()
        self.assertTrue(json_data['success'])
        
        kpi = json_data['data']['kpi']
        self.assertNotEqual(kpi['totalRevenue'], 16200000)
        self.assertNotEqual(kpi['totalSales'], 4320)
        self.assertNotEqual(kpi['totalConsultations'], 128450)
