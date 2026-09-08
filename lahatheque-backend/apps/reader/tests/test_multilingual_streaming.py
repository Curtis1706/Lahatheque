"""
Tests d'intégration du streaming bilingue sécurisé avec paramètre ?lang=fr/en.
"""
from unittest.mock import patch
from rest_framework.test import APITestCase
from rest_framework import status
from apps.accounts.models import User
from apps.catalog.models import Ouvrage, OuvrageLanguageVersion
from apps.commerce.models import Currency, Order, LigneCommande


class MultilingualStreamingTestCase(APITestCase):
    """
    Vérifie la prise en charge du paramètre de langue dans l'endpoint de streaming.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="student_reader_tester",
            email="reader_tester@laha.bj",
            password="testpassword123",
            role="student",
        )
        self.client.force_authenticate(user=self.user)
        self.currency = Currency.objects.create(code="XOF", is_pegged=True)

        self.ouvrage = Ouvrage.objects.create(
            title="Manuel de Physique Quantique",
            language="en",
            status="published",
            price_digital=5000.00,
        )

        self.version_en = OuvrageLanguageVersion.objects.create(
            ouvrage=self.ouvrage,
            language="en",
            is_original=True,
            title="Quantum Physics Handbook",
            r2_key_pdf=f"books/{self.ouvrage.id}/EN/original.pdf",
            translation_status="ready",
        )

        self.version_fr = OuvrageLanguageVersion.objects.create(
            ouvrage=self.ouvrage,
            language="fr",
            is_original=False,
            title="Manuel de Physique Quantique (FR)",
            r2_key_pdf=f"books/{self.ouvrage.id}/FR/translated.pdf",
            translation_status="ready",
        )

        # Accès utilisateur accordé via commande payée
        order = Order.objects.create(
            user=self.user,
            total_amount=5000.00,
            currency=self.currency,
            statut_paiement="paid",
            statut_commande="completed",
        )
        LigneCommande.objects.create(
            commande=order,
            ouvrage=self.ouvrage,
            format_type="digital",
            unit_price=5000.00,
            quantity=1,
        )

    @patch("apps.protection.derived_materializer.DerivedMaterializer.get_or_create_derived")
    def test_streaming_with_language_parameter(self, mock_materialize):
        mock_materialize.return_value = (b"%PDF-1.4 mock stream bytes", 28)

        # Requête streaming en version anglaise
        resp_en = self.client.get(f"/api/v1/catalog/books/{self.ouvrage.id}/stream/?lang=en")
        self.assertEqual(resp_en.status_code, status.HTTP_200_OK)
        self.assertEqual(resp_en["Content-Type"], "application/pdf")
        self.assertIn("bytes", resp_en["Accept-Ranges"])

        # Vérifier que le materializer a reçu la référence avec ségrégation de langue
        mock_materialize.assert_called()
        call_args = mock_materialize.call_args
        self.assertIn(f"{self.ouvrage.id}:en", call_args.kwargs.get("source_reference", ""))

        # Requête streaming en version française
        resp_fr = self.client.get(f"/api/v1/catalog/books/{self.ouvrage.id}/stream/?lang=fr")
        self.assertEqual(resp_fr.status_code, status.HTTP_200_OK)
        call_args_fr = mock_materialize.call_args
        self.assertIn(f"{self.ouvrage.id}:fr", call_args_fr.kwargs.get("source_reference", ""))
