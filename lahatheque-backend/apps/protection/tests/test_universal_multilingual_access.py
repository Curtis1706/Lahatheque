"""
Tests unitaires de l'accès universel multilingue sans surcoût (AccessService).
"""
import uuid
from django.test import TestCase
from apps.accounts.models import User
from apps.catalog.models import Ouvrage, OuvrageLanguageVersion
from apps.commerce.models import Currency, LigneCommande, Order
from apps.protection.access_service import AccessService


class UniversalMultilingualAccessTestCase(TestCase):
    """
    Vérifie qu'un achat numérique unique confère un accès complet à l'ensemble
    des versions linguistiques (original et traductions) rattachées à l'ouvrage.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username="student_multilingual",
            email="student_multi@laha.bj",
            password="testpassword123",
            role="student",
        )
        self.other_user = User.objects.create_user(
            username="student_stranger",
            email="stranger@laha.bj",
            password="testpassword123",
            role="student",
        )
        self.currency = Currency.objects.create(code="XOF", is_pegged=True)

        self.ouvrage = Ouvrage.objects.create(
            title="Biotechnologie Fondamentale",
            language="en",
            status="published",
            price_digital=5000.00,
        )

        self.version_en = OuvrageLanguageVersion.objects.create(
            ouvrage=self.ouvrage,
            language="en",
            is_original=True,
            title="Fundamental Biotechnology",
            r2_key_pdf=f"books/{self.ouvrage.id}/EN/original.pdf",
            translation_status="ready",
        )

        self.version_fr = OuvrageLanguageVersion.objects.create(
            ouvrage=self.ouvrage,
            language="fr",
            is_original=False,
            title="Biotechnologie Fondamentale (FR)",
            r2_key_pdf=f"books/{self.ouvrage.id}/FR/translated.pdf",
            translation_status="ready",
        )

    def test_universal_multilingual_access_after_single_digital_purchase(self):
        # 1. Avant achat : aucun accès
        access_before = AccessService.check_user_book_access(self.user, str(self.ouvrage.id))
        self.assertFalse(access_before["access_granted"])

        # 2. Achat de la licence numérique pour l'ouvrage maître
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

        # 3. Accès à l'ouvrage maître
        master_access = AccessService.check_user_book_access(self.user, str(self.ouvrage.id))
        self.assertTrue(master_access["access_granted"])
        self.assertEqual(master_access["reason"], "individual_purchase")

        # 4. Accès automatique à la version originale anglaise via son propre ID
        en_access = AccessService.check_user_book_access(self.user, str(self.version_en.id))
        self.assertTrue(en_access["access_granted"])
        self.assertEqual(en_access["resolved_book_id"], str(self.ouvrage.id))
        self.assertEqual(en_access["language"], "en")
        self.assertIn("lang=en", en_access["stream_url"])

        # 5. Accès automatique à la traduction française sans surcoût
        fr_access = AccessService.check_user_book_access(self.user, str(self.version_fr.id))
        self.assertTrue(fr_access["access_granted"])
        self.assertEqual(fr_access["resolved_book_id"], str(self.ouvrage.id))
        self.assertEqual(fr_access["language"], "fr")
        self.assertIn("lang=fr", fr_access["stream_url"])

        # 6. Un autre utilisateur n'a pas accès
        stranger_access = AccessService.check_user_book_access(self.other_user, str(self.version_fr.id))
        self.assertFalse(stranger_access["access_granted"])
