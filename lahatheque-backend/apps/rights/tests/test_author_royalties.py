"""
Tests unitaires pour les vues de redevances et statistiques de l'auteur.
Vérifie que les endpoints de l'application rights lisent les données réelles en base de données.
"""
from datetime import date
from django.test import TestCase
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.catalog.models import Ouvrage, Discipline
from apps.publishers_portal.models import Publisher
from apps.rights.models import AuthorRight, RoyaltyCalculation, RoyaltyPayoutLine
from apps.commerce.models import Order, LigneCommande, Currency
from apps.protection.models import TraceAcces


class AuthorRoyaltiesTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="author_real_test",
            email="author.real@laha.bj",
            password="StrongPassword123!",
            role="author",
            first_name="Augustin",
            last_name="CHAKIROU"
        )
        self.publisher = Publisher.objects.create(
            name="Éditions Africaines LAHA",
            rccm_number="RB/COT/24-B-002",
            country="BJ",
            contact_email="editions.real@laha.bj"
        )
        self.discipline = Discipline.objects.create(name="Droit Privé", code_dewey="340")
        self.ouvrage = Ouvrage.objects.create(
            title="Droit Commercial et des Sociétés Commerciales OHADA",
            isbn="978-2-84299-888-8",
            publisher=self.publisher,
            discipline=self.discipline,
            publication_date=date(2026, 1, 15),
            format_type="pdf",
            price_digital=5000.00,
            status="published"
        )
        self.author_right = AuthorRight.objects.create(
            ouvrage=self.ouvrage,
            user=self.user,
            pool_share_percent=70.00
        )
        self.calculation = RoyaltyCalculation.objects.create(
            period_month=date(2026, 7, 1),
            ouvrage=self.ouvrage,
            total_reads_count=420,
            total_revenue=2100000.00,
            publisher_payout_amount=630000.00,
            is_settled=True
        )
        self.payout_line = RoyaltyPayoutLine.objects.create(
            calculation=self.calculation,
            author_right=self.author_right,
            payout_amount=1470000.00,
            is_settled=True
        )
        self.currency = Currency.objects.create(code="XOF", is_pegged=True)
        self.order = Order.objects.create(
            user=self.user,
            total_amount=50000.00,
            currency=self.currency,
            statut_paiement="paid"
        )
        self.ligne = LigneCommande.objects.create(
            commande=self.order,
            ouvrage=self.ouvrage,
            format_type="digital",
            unit_price=5000.00,
            quantity=10
        )
        TraceAcces.objects.create(
            user=self.user,
            ouvrage=self.ouvrage,
            access_type="download",
            ip_address="127.0.0.1"
        )

    def test_author_royalties_statements_returns_real_orm_data(self):
        """Vérifie que AuthorRoyaltiesStatementsView renvoie le montant réel (1470000.0) et non la valeur codée en dur."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/rights/author/royalties/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        statements = data["data"]
        self.assertEqual(len(statements), 1)
        st = statements[0]
        self.assertEqual(st["id"], str(self.payout_line.id))
        self.assertEqual(st["total_sales_count"], 420)
        self.assertEqual(st["gross_revenue"], 2100000.0)
        self.assertEqual(st["author_percentage_rate"], 70.0)
        self.assertEqual(st["author_earned_amount"], 1470000.0)
        self.assertEqual(st["status"], "paid")
        self.assertIsNone(st["receipt_url"])

    def test_author_books_list_returns_real_orm_sales_and_downloads(self):
        """Vérifie que AuthorBooksListView renvoie les ventes et téléchargements réels depuis LigneCommande et TraceAcces."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/rights/author/books/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        books = data["data"]
        self.assertEqual(len(books), 1)
        b = books[0]
        self.assertEqual(b["id"], str(self.ouvrage.id))
        self.assertEqual(b["title"], "Droit Commercial et des Sociétés Commerciales OHADA")
        self.assertEqual(b["sales_count"], 10)
        self.assertEqual(b["downloads_count"], 1)
        self.assertEqual(b["total_revenue_generated"], 50000)
        self.assertEqual(b["author_royalty_share_amount"], 35000)
        self.assertEqual(b["author_percentage_rate"], 70.0)
