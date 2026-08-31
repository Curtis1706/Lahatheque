"""
Tests unitaires — Fiches W2/W3 : traçabilité des lectures via bouquet sur TraceAcces.
"""
from datetime import date, timedelta
from unittest.mock import patch
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.catalog.models import Ouvrage, Discipline
from apps.partners.models import Institution, StudentAffiliation, BouquetOffering, UniversityBouquetSubscription
from apps.commerce.models import Order, LigneCommande, Currency
from apps.protection.models import TraceAcces
from apps.protection.derived_materializer import DerivedMaterializer


@override_settings(ENABLE_UNIVERSITY_AFFILIATION_GATING=True)
class BouquetTraceTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.institution = Institution.objects.create(name="Université de Parakou", code="UP", country="BJ")
        self.discipline = Discipline.objects.create(name="Économie", code_dewey="330")

        self.book = Ouvrage.objects.create(
            title="Précis d'Économie du Développement", isbn="978-0-00000-010-0",
            discipline=self.discipline, format_type="pdf",
            price_digital=4500, status="published"
        )

        self.student = User.objects.create_user(
            username="etudiant_trace", email="trace@up.bj",
            password="TestPass123!", role="student"
        )
        StudentAffiliation.objects.create(
            student=self.student, institution=self.institution,
            student_card_number="UP-2026-055", is_validated=True
        )

        self.offering = BouquetOffering.objects.create(
            title="Bouquet Économie", bouquet_type="discipline",
            discipline="Économie", annual_price=800000, is_active=True
        )
        self.subscription = UniversityBouquetSubscription.objects.create(
            institution=self.institution, offering_id=self.offering.id,
            title=self.offering.title, bouquet_type="discipline", discipline="Économie",
            status="active", start_date=date.today(), end_date=date.today() + timedelta(days=365),
        )

        self.client.force_authenticate(user=self.student)

    @patch.object(DerivedMaterializer, "get_or_create_derived", return_value=(b"%PDF-1.4 mock content bytes", 27))
    def test_trace_records_bouquet_subscription(self, mock_materializer):
        res = self.client.get(f"/api/v1/catalog/books/{self.book.id}/stream/", HTTP_RANGE="bytes=0-10")
        self.assertEqual(res.status_code, 206)

        trace = TraceAcces.objects.filter(user=self.student, ouvrage=self.book).order_by("-id").first()
        self.assertIsNotNone(trace, "Aucune trace créée — vérifier que la requête atteint bien BookStreamView")
        self.assertEqual(trace.institution_id, self.institution.id)
        self.assertEqual(trace.bouquet_subscription_id, self.subscription.id)

    @patch.object(DerivedMaterializer, "get_or_create_derived", return_value=(b"%PDF-1.4 mock content bytes", 27))
    def test_trace_stays_null_for_purchase_access(self, mock_materializer):
        currency, _ = Currency.objects.get_or_create(code="XOF")
        commande = Order.objects.create(
            user=self.student, total_amount=4500, currency=currency,
            statut_paiement="paid", statut_commande="completed",
        )
        LigneCommande.objects.create(
            commande=commande, ouvrage=self.book, format_type="digital",
            quantity=1, unit_price=4500,
        )

        res = self.client.get(f"/api/v1/catalog/books/{self.book.id}/stream/", HTTP_RANGE="bytes=0-10")
        self.assertEqual(res.status_code, 206)

        trace = TraceAcces.objects.filter(user=self.student, ouvrage=self.book).order_by("-id").first()
        self.assertIsNotNone(trace)
        self.assertIsNone(trace.bouquet_subscription_id)
