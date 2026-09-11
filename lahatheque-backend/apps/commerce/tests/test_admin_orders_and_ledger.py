from datetime import timedelta
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from apps.commerce.models import Order, LigneCommande, Currency
from apps.catalog.models import Ouvrage, Discipline
from apps.publishers_portal.models import Publisher

User = get_user_model()

class AdminOrdersAndLedgerTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin.finance@lahatheque.bj",
            email="admin.finance@lahatheque.bj",
            password="Password123!",
            role="admin",
            first_name="Admin",
            last_name="Finance"
        )
        self.client.force_authenticate(user=self.admin)

        self.buyer = User.objects.create_user(
            username="buyer.test@lahatheque.bj",
            email="buyer.test@lahatheque.bj",
            password="Password123!",
            role="client",
            first_name="Acheteur",
            last_name="Test"
        )

        self.currency, _ = Currency.objects.get_or_create(code="XOF", defaults={"is_pegged": True})

        self.pub_user = User.objects.create_user(
            username="pub.test@lahatheque.bj",
            email="pub.test@lahatheque.bj",
            password="Password123!",
            role="editeur"
        )
        self.publisher = Publisher.objects.create(
            user=self.pub_user,
            name="Editions Laha"
        )
        self.discipline = Discipline.objects.create(name="Sciences")
        self.book = Ouvrage.objects.create(
            title="Manuel de Physique",
            isbn="978-2-84299-999-9",
            format_type="numerique",
            publisher=self.publisher,
            discipline=self.discipline
        )

        # Commande payée
        self.order_paid = Order.objects.create(
            user=self.buyer,
            total_amount=Decimal("10000.00"),
            currency=self.currency,
            statut_paiement="paid",
            mode_paiement="mobile_money"
        )
        LigneCommande.objects.create(
            commande=self.order_paid,
            ouvrage=self.book,
            format_type="digital",
            quantity=1,
            unit_price=Decimal("10000.00")
        )

        # Commande abandonnée
        self.order_abandoned = Order.objects.create(
            user=self.buyer,
            total_amount=Decimal("20000.00"),
            currency=self.currency,
            statut_paiement="abandoned",
            abandoned_at=timezone.now() - timedelta(hours=25)
        )

        # Commande à crédit
        self.order_credit = Order.objects.create(
            user=self.buyer,
            total_amount=Decimal("15000.00"),
            currency=self.currency,
            statut_paiement="credit",
            is_credit_purchase=True
        )

    def test_admin_orders_list_kpis_and_filter(self):
        """Vérifie la liste et les KPIs consolidés."""
        response = self.client.get('/api/v1/commerce/admin/orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data.get("success"))
        
        kpis = data["data"]["kpis"]
        self.assertGreaterEqual(Decimal(str(kpis["paid_volume"])), Decimal("10000.00"))
        self.assertGreaterEqual(Decimal(str(kpis["credit_volume"])), Decimal("15000.00"))
        self.assertGreaterEqual(Decimal(str(kpis["abandoned_loss"])), Decimal("20000.00"))
        self.assertGreaterEqual(kpis["abandoned_count"], 1)

        # Filtre statut abandoned
        res_filter = self.client.get('/api/v1/commerce/admin/orders/?payment_status=abandoned')
        self.assertEqual(res_filter.status_code, status.HTTP_200_OK)
        items = res_filter.json()["data"]["items"]
        self.assertTrue(any(item["id"] == str(self.order_abandoned.id) for item in items))

    def test_admin_order_confirm_manual_payment(self):
        """Vérifie la validation manuelle d'un paiement (ex: momo_direct)."""
        payload = {
            "payment_method": "momo_direct",
            "reference": "MOMO-TRANS-888999",
            "notes": "Paiement direct reçu sur le compte MTN Mobile Money"
        }
        url = f'/api/v1/commerce/admin/orders/{self.order_credit.id}/confirm-payment/'
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.order_credit.refresh_from_db()
        self.assertEqual(self.order_credit.statut_paiement, "paid")
        self.assertEqual(self.order_credit.mode_paiement, "momo_direct")
        self.assertEqual(self.order_credit.manual_payment_confirmed_by, self.admin)
        self.assertEqual(self.order_credit.manual_payment_reference, "MOMO-TRANS-888999")

    def test_admin_order_remind(self):
        """Vérifie l'action de relance sur un panier abandonné."""
        url = f'/api/v1/commerce/admin/orders/{self.order_abandoned.id}/remind/'
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.order_abandoned.refresh_from_db()
        self.assertIsNotNone(self.order_abandoned.last_reminder_sent_at)

    def test_accounting_ledger_exports_csv_and_xlsx(self):
        """Vérifie les exports du Grand Livre Comptable en CSV et XLSX."""
        # Test CSV
        res_csv = self.client.get('/api/v1/admin/accounting-ledger/export/?format=csv')
        self.assertEqual(res_csv.status_code, status.HTTP_200_OK)
        self.assertEqual(res_csv['Content-Type'], 'text/csv; charset=utf-8-sig')
        content_csv = res_csv.content.decode('utf-8-sig')
        self.assertIn("Date,Reference,Type Flux", content_csv)

        # Test XLSX
        res_xlsx = self.client.get('/api/v1/admin/accounting-ledger/export/?format=xlsx')
        self.assertEqual(res_xlsx.status_code, status.HTTP_200_OK)
        self.assertIn('spreadsheetml', res_xlsx['Content-Type'])
        self.assertTrue(len(res_xlsx.content) > 100)
