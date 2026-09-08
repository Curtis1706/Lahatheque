"""
Tests unitaires de la commande d'exemplaires papier avec sélection de langue et décompte de stock dédié.
"""
from rest_framework.test import APITestCase
from rest_framework import status
from apps.accounts.models import User
from apps.catalog.models import Ouvrage, OuvrageLanguageVersion
from apps.commerce.models import Currency, LigneCommande


class PaperLanguageOrderTestCase(APITestCase):
    """
    Validation du choix obligatoire de la langue papier, du contrôle des stocks par langue,
    et de l'enregistrement de selected_language sur la ligne de commande.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="buyer_paper",
            email="buyer@laha.bj",
            password="testpassword123",
            role="student",
        )
        self.client.force_authenticate(user=self.user)
        self.currency = Currency.objects.create(code="XOF", is_pegged=True)

        self.ouvrage = Ouvrage.objects.create(
            title="Droit des Affaires OHADA",
            language="fr",
            status="published",
            price_paper=7500.00,
            is_paper_available=True,
        )

        self.version_fr = OuvrageLanguageVersion.objects.create(
            ouvrage=self.ouvrage,
            language="fr",
            is_original=True,
            title="Droit des Affaires OHADA (FR)",
            is_paper_available=True,
            paper_stock=10,
            translation_status="ready",
        )

        self.version_en = OuvrageLanguageVersion.objects.create(
            ouvrage=self.ouvrage,
            language="en",
            is_original=False,
            title="OHADA Business Law (EN)",
            is_paper_available=False,
            paper_stock=0,
            translation_status="ready",
        )

    def test_paper_order_fails_when_selected_language_unavailable(self):
        payload = {
            "items": [
                {
                    "ouvrage_id": str(self.ouvrage.id),
                    "format_type": "paper",
                    "selected_language": "en",
                    "quantity": 1,
                }
            ],
            "shipping_address": "Cotonou, Quartier Haie Vive, Rue 300",
            "city": "Cotonou",
            "country": "BJ",
        }
        response = self.client.post("/api/v1/commerce/orders/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("n'est pas disponible en version papier", response.data.get("error", ""))

    def test_paper_order_succeeds_and_decrements_language_stock(self):
        payload = {
            "items": [
                {
                    "ouvrage_id": str(self.ouvrage.id),
                    "format_type": "paper",
                    "selected_language": "fr",
                    "quantity": 2,
                }
            ],
            "shipping_address": "Cotonou, Quartier Haie Vive, Rue 300",
            "city": "Cotonou",
            "country": "BJ",
        }
        response = self.client.post("/api/v1/commerce/orders/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verification de la ligne de commande
        ligne = LigneCommande.objects.filter(ouvrage=self.ouvrage, format_type="paper").first()
        self.assertIsNotNone(ligne)
        self.assertEqual(ligne.selected_language, "fr")
        self.assertEqual(ligne.quantity, 2)

        # Verification de la decrementation du stock specifique
        self.version_fr.refresh_from_db()
        self.assertEqual(self.version_fr.paper_stock, 8)
