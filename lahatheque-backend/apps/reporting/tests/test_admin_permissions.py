from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

class AdminPermissionsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_unauthenticated_admin_endpoints_rejected(self):
        """
        Vérifie qu'aucun endpoint d'administration n'est accessible en AllowAny (doit retourner 401 ou 403).
        """
        endpoints = [
            ('/api/v1/admin/stats/panoramic/', 'get'),
            ('/api/v1/admin/settings/global/', 'get'),
            ('/api/v1/admin/catalog/pricing/', 'get'),
            ('/api/v1/admin/royalties/payouts/', 'get'),
            ('/api/v1/admin/royalties/payouts/test-id/process/', 'post'),
            ('/api/v1/admin/reminders/', 'get'),
            ('/api/v1/admin/reminders/trigger-now/', 'post'),
            ('/api/v1/admin/logs/', 'get'),
            ('/api/v1/admin/validation/', 'get'),
            ('/api/v1/admin/contracts/', 'get'),
            ('/api/v1/admin/stock/', 'get'),
        ]

        for url, method in endpoints:
            if method == 'get':
                response = self.client.get(url)
            else:
                response = self.client.post(url, {})

            self.assertIn(
                response.status_code,
                [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
                f"L'endpoint {url} ({method.upper()}) ne doit pas retourner {response.status_code} sans authentification."
            )
