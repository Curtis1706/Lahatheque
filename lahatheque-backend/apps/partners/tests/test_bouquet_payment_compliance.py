"""
Tests de conformité CDC v3.2 — Fiche Corrective Bouquets Documentaires.
Couvre :
1. Souscription Université avec statut pending et transaction de paiement
2. Souscription Client avec statut pending et transaction de paiement
3. Activation automatique via webhook / handle_bouquet_payment_success
4. Souscription via l'API Partenaire (PartnerBouquetSubscribeView)
5. Calcul dynamique du KPI tendance de consultations
"""
from decimal import Decimal
from datetime import timedelta
from unittest.mock import patch
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.partners.models import Institution, BouquetOffering, UniversityBouquetSubscription
from apps.commerce.models import ClientBouquetSubscription, PaymentTransaction, Currency
from apps.commerce.services import handle_bouquet_payment_success
from apps.reader.models import PartnerApp
from apps.protection.models import TraceAcces


class BouquetPaymentComplianceTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Utilisateur Université
        self.univ_user = User.objects.create_user(
            email="rector@uac.bj", username="rector_uac", password="Password123!", role="university"
        )
        self.institution = Institution.objects.create(
            name="Université d'Abomey-Calavi", code="UAC", user=self.univ_user,
            royalty_rate=Decimal("15.00")
        )

        # Utilisateur Client régulier
        self.client_user = User.objects.create_user(
            email="client@test.bj", username="client_test", password="Password123!", role="student"
        )

        # Offre Bouquet
        self.offering = BouquetOffering.objects.create(
            title="Bouquet Droit Fondamental",
            bouquet_type="discipline",
            discipline="Droit",
            annual_price=Decimal("500000.00"),
            currency="XOF",
            is_active=True
        )

        # Devise
        self.currency, _ = Currency.objects.get_or_create(code="XOF", defaults={"peg_rate_to_eur": Decimal("655.957")})

    @patch("apps.commerce.payment_providers.MonerooPaymentProvider.initiate_payment")
    def test_university_subscription_creates_pending_with_payment(self, mock_payment):
        """Vérifie que la souscription université démarre en pending et lie une PaymentTransaction."""
        mock_payment.return_value = {
            "status": "pending",
            "checkout_url": "https://checkout.moneroo.io/test-univ-pay",
            "moneroo_id": "moneroo_univ_tx_123"
        }
        self.client.force_authenticate(user=self.univ_user)
        res = self.client.post(f"/api/v1/partners/university/bouquets/{self.offering.id}/subscribe/", data={
            "mode_paiement": "mobile_money",
            "return_url": "https://lahatheque.com/university/bouquets"
        })

        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data["success"])
        self.assertEqual(res.data["data"]["checkout_url"], "https://checkout.moneroo.io/test-univ-pay")
        sub_id = res.data["data"]["bouquet_id"]

        sub = UniversityBouquetSubscription.objects.get(id=sub_id)
        self.assertEqual(sub.institution, self.institution)
        self.assertEqual(sub.status, "pending")
        self.assertIsNotNone(sub.payment_transaction)
        self.assertEqual(sub.payment_transaction.amount, self.offering.annual_price)
        self.assertEqual(sub.payment_transaction.moneroo_id, "moneroo_univ_tx_123")

    def test_university_subscription_manual_payment(self):
        """Vérifie le paiement hors-ligne (virement/espèces) pour une université."""
        self.client.force_authenticate(user=self.univ_user)
        res = self.client.post(f"/api/v1/partners/university/bouquets/{self.offering.id}/subscribe/", data={
            "mode_paiement": "virement",
        })

        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data["success"])
        self.assertEqual(res.data["data"]["status"], "pending")
        self.assertIn("virement", res.data["data"]["message"])

    @patch("apps.commerce.payment_providers.MonerooPaymentProvider.initiate_payment")
    def test_client_subscription_creates_pending_with_payment(self, mock_payment):
        """Vérifie que la souscription client démarre en pending et lie une PaymentTransaction."""
        mock_payment.return_value = {
            "status": "pending",
            "checkout_url": "https://checkout.moneroo.io/test-client-pay",
            "moneroo_id": "moneroo_client_tx_456"
        }
        self.client.force_authenticate(user=self.client_user)
        res = self.client.post(f"/api/v1/commerce/bouquets/{self.offering.id}/subscribe/", data={
            "mode_paiement": "mobile_money"
        })

        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data["success"])
        self.assertEqual(res.data["data"]["checkout_url"], "https://checkout.moneroo.io/test-client-pay")
        sub_id = res.data["data"]["id"]

        sub = ClientBouquetSubscription.objects.get(id=sub_id)
        self.assertEqual(sub.user, self.client_user)
        self.assertEqual(sub.status, "pending")
        self.assertIsNotNone(sub.payment_transaction)
        self.assertEqual(sub.price_paid, self.offering.annual_price)
        self.assertEqual(sub.payment_transaction.moneroo_id, "moneroo_client_tx_456")

    def test_handle_bouquet_payment_success_activates_pending_subscriptions(self):
        """Vérifie que le callback de paiement passe les souscriptions de pending à active."""
        tx = PaymentTransaction.objects.create(
            user=self.univ_user,
            amount=self.offering.annual_price,
            currency=self.currency,
            status="pending"
        )

        start = timezone.now().date()
        univ_sub = UniversityBouquetSubscription.objects.create(
            institution=self.institution,
            offering_id=self.offering.id,
            title=self.offering.title,
            annual_price=self.offering.annual_price,
            status="pending",
            start_date=start,
            end_date=start + timedelta(days=365),
            payment_transaction=tx
        )

        client_sub = ClientBouquetSubscription.objects.create(
            user=self.client_user,
            offering_id=self.offering.id,
            title=self.offering.title,
            price_paid=self.offering.annual_price,
            status="pending",
            start_date=start,
            end_date=start + timedelta(days=365),
            payment_transaction=tx
        )

        self.assertEqual(univ_sub.status, "pending")
        self.assertEqual(client_sub.status, "pending")

        tx.status = "success"
        tx.save(update_fields=["status"])
        handle_bouquet_payment_success(tx)

        univ_sub.refresh_from_db()
        client_sub.refresh_from_db()
        self.assertEqual(univ_sub.status, "active")
        self.assertEqual(client_sub.status, "active")

    def test_partner_api_bouquet_subscribe(self):
        """Vérifie que l'API partenaire (M2M) permet de souscrire à un bouquet."""
        import hashlib
        partner = PartnerApp.objects.create(
            name="LMS Partenaire UAC",
            linked_institution=self.institution,
            client_id="partner_client_test_id",
            client_secret_hash=hashlib.sha256(b"secret_key_123").hexdigest(),
            is_active=True
        )

        # Authentification via header X-Client-ID / X-Client-Secret
        self.client.credentials(
            HTTP_X_CLIENT_ID="partner_client_test_id",
            HTTP_X_CLIENT_SECRET="secret_key_123"
        )

        res = self.client.post(f"/api/v1/partner/bouquets/{self.offering.id}/subscribe/")
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data["success"])
        self.assertEqual(res.data["data"]["status"], "pending")
        self.assertIn("payment_instructions", res.data["data"])

        # Vérification en base
        sub_id = res.data["data"]["subscription_id"]
        sub = UniversityBouquetSubscription.objects.get(id=sub_id)
        self.assertEqual(sub.institution, self.institution)
        self.assertEqual(sub.status, "pending")

    def test_university_kpis_dynamic_trend(self):
        """Vérifie que le KPI consultations_trend_percent est calculé dynamiquement."""
        self.client.force_authenticate(user=self.univ_user)

        # Créer des consultations pour le mois courant (10) et le mois précédent (5)
        now = timezone.now()
        for _ in range(10):
            t = TraceAcces.objects.create(
                user=self.univ_user, ip_address="127.0.0.1", institution=self.institution,
                access_type="read_chunk"
            )
            TraceAcces.objects.filter(id=t.id).update(timestamp=now - timedelta(days=5))

        for _ in range(5):
            t = TraceAcces.objects.create(
                user=self.univ_user, ip_address="127.0.0.1", institution=self.institution,
                access_type="read_chunk"
            )
            TraceAcces.objects.filter(id=t.id).update(timestamp=now - timedelta(days=40))

        res = self.client.get("/api/v1/partners/university/kpis/")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data["success"])
        # (10 - 5) / 5 * 100 = 100.0%
        trend = res.data["data"]["consultations_trend_percent"]
        self.assertEqual(trend, 100.0)

    def test_university_bouquet_distribution_confidentiality(self):
        """Vérifie la confidentialité des données financières des autres universités."""
        from apps.catalog.models import Ouvrage

        self.client.force_authenticate(user=self.univ_user)

        # 2ème institution
        user_una = User.objects.create_user(
            email="rector@una.bj", username="rector_una", password="Password123!", role="university"
        )
        inst_una = Institution.objects.create(
            name="Université Nationale d'Agriculture", code="UNA", user=user_una, royalty_rate=Decimal("15.00")
        )

        book_uac = Ouvrage.objects.create(
            title="Droit Constitutionnel Béninois", price_digital=Decimal("15000.00"), status="published",
            institution=self.institution
        )
        book_una = Ouvrage.objects.create(
            title="Agronomie Tropicale", price_digital=Decimal("12000.00"), status="published",
            institution=inst_una
        )

        offering = BouquetOffering.objects.create(
            title="Bouquet National Universités",
            annual_price=Decimal("5000000.00"),
            currency="XOF",
            bouquet_type="university",
            is_active=True,
        )
        offering.custom_books.set([book_uac, book_una])

        res = self.client.get(f"/api/v1/partners/university/bouquets/{offering.id}/distribution/")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data["success"])

        dist = res.data["data"]["distribution"]
        self.assertEqual(len(dist), 2)

        # Retrouver UAC et UNA
        uac_entry = next(e for e in dist if str(e["institution_id"]) == str(self.institution.id))
        una_entry = next(e for e in dist if str(e["institution_id"]) == str(inst_una.id))

        # UAC (l'université connectée) voit tous ses chiffres
        self.assertTrue(uac_entry["is_current_institution"])
        self.assertIsNotNone(uac_entry["ca_share"])
        self.assertIsNotNone(uac_entry["royalty_amount"])
        self.assertIsNotNone(uac_entry["royalty_rate"])

        # UNA (autre université) a ses montants financiers masqués
        self.assertFalse(una_entry["is_current_institution"])
        self.assertIsNone(una_entry["ca_share"])
        self.assertIsNone(una_entry["royalty_amount"])
        self.assertIsNone(una_entry["royalty_rate"])
        self.assertIsNone(una_entry["reads_count"])
        # Mais conserve son nom, son code, ses livres et son pourcentage
        self.assertEqual(una_entry["institution_code"], "UNA")
        self.assertEqual(una_entry["books_owned_count"], 1)
        self.assertIsNotNone(una_entry["usage_percentage"])

        # Les totaux ne doivent pas faire fuiter la part plateforme ni le total des redevances
        totals = res.data["data"].get("totals", {})
        self.assertNotIn("platform_revenue", totals)
        self.assertNotIn("total_royalties", totals)

