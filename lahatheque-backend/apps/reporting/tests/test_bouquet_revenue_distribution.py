"""
Tests unitaires — Fiche W4 : répartition mensuelle des revenus de bouquets partagés,
reproduisant l'exemple chiffré du CDC section 11.2 (bouquet 10 000 € / 120 000 XOF).
"""
from datetime import date, timedelta
from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from apps.accounts.models import User
from apps.catalog.models import Ouvrage, Discipline
from apps.partners.models import Institution, BouquetOffering, UniversityBouquetSubscription, UniversityRoyaltyStatement
from apps.protection.models import TraceAcces
from apps.reporting.tasks import task_distribute_bouquet_revenue


class BouquetRevenueDistributionTestCase(TestCase):
    def setUp(self):
        self.uac = Institution.objects.create(name="Université d'Abomey-Calavi", code="UAC", country="BJ", royalty_rate=Decimal("15.00"))
        self.una = Institution.objects.create(name="Université Nationale d'Agriculture", code="UNA", country="BJ", royalty_rate=Decimal("15.00"))
        self.parakou = Institution.objects.create(name="Université de Parakou", code="UP-PKU", country="BJ", royalty_rate=Decimal("15.00"))

        self.discipline = Discipline.objects.create(name="Sciences Agronomiques", code_dewey="630")
        self.book = Ouvrage.objects.create(
            title="Traité d'Agronomie Tropicale", isbn="978-0-00000-020-2",
            discipline=self.discipline, format_type="pdf",
            price_digital=5000, status="published"
        )

        self.offering = BouquetOffering.objects.create(
            title="Bouquet National Agronomie", bouquet_type="discipline",
            discipline="Sciences Agronomiques",
            annual_price=Decimal("120000.00"),
            is_active=True,
        )

        today = date.today()
        self.sub_uac = UniversityBouquetSubscription.objects.create(
            institution=self.uac, offering_id=self.offering.id, title=self.offering.title,
            bouquet_type="discipline", discipline="Sciences Agronomiques",
            annual_price=Decimal("120000.00"), status="active",
            start_date=today - timedelta(days=60), end_date=today + timedelta(days=305),
        )
        self.sub_una = UniversityBouquetSubscription.objects.create(
            institution=self.una, offering_id=self.offering.id, title=self.offering.title,
            bouquet_type="discipline", discipline="Sciences Agronomiques",
            annual_price=Decimal("0.00"), status="active",
            start_date=today - timedelta(days=60), end_date=today + timedelta(days=305),
        )
        self.sub_parakou = UniversityBouquetSubscription.objects.create(
            institution=self.parakou, offering_id=self.offering.id, title=self.offering.title,
            bouquet_type="discipline", discipline="Sciences Agronomiques",
            annual_price=Decimal("0.00"), status="active",
            start_date=today - timedelta(days=60), end_date=today + timedelta(days=305),
        )

    def _create_traces(self, subscription, count):
        student = User.objects.create_user(
            username=f"etu_{subscription.institution.code.lower()}_{count}_{timezone.now().timestamp()}",
            email=f"etu_{subscription.institution.code.lower()}_{count}_{timezone.now().timestamp()}@test.bj",
            password="TestPass123!", role="student",
        )
        now = timezone.now()
        period_start = (now.replace(day=1) - timedelta(days=1)).replace(day=1)
        trace_time = period_start + timedelta(days=5, hours=12)

        for _ in range(count):
            t = TraceAcces.objects.create(
                user=student, ouvrage=self.book, document_title=self.book.title,
                ip_address="127.0.0.1",
                access_type="read_chunk", institution=subscription.institution,
                bouquet_subscription=subscription,
            )
            TraceAcces.objects.filter(id=t.id).update(timestamp=trace_time)

    def test_distribution_matches_cdc_example(self):
        self._create_traces(self.sub_uac, 100)
        self._create_traces(self.sub_una, 1)
        self._create_traces(self.sub_parakou, 9)

        result = task_distribute_bouquet_revenue()

        self.assertEqual(result["shared_bouquets_processed"], 1)
        self.assertEqual(result["statements_created"], 3)

        pool_mensuel = float(Decimal("120000.00")) / 12

        stmt_uac = UniversityRoyaltyStatement.objects.filter(institution=self.uac).latest("created_at")
        stmt_una = UniversityRoyaltyStatement.objects.filter(institution=self.una).latest("created_at")
        stmt_parakou = UniversityRoyaltyStatement.objects.filter(institution=self.parakou).latest("created_at")

        self.assertAlmostEqual(float(stmt_uac.total_sales_catalog), pool_mensuel * (100 / 110), places=1)
        self.assertAlmostEqual(float(stmt_una.total_sales_catalog), pool_mensuel * (1 / 110), places=1)
        self.assertAlmostEqual(float(stmt_parakou.total_sales_catalog), pool_mensuel * (9 / 110), places=1)

        self.assertAlmostEqual(float(stmt_uac.net_royalty_amount), float(stmt_uac.total_sales_catalog) * 0.15, places=1)

    def test_non_shared_bouquet_is_skipped(self):
        UniversityBouquetSubscription.objects.filter(id__in=[self.sub_una.id, self.sub_parakou.id]).delete()

        self._create_traces(self.sub_uac, 50)
        result = task_distribute_bouquet_revenue()

        self.assertEqual(result["shared_bouquets_processed"], 0)
        self.assertEqual(result["statements_created"], 0)

    def test_no_usage_falls_back_to_equal_split(self):
        result = task_distribute_bouquet_revenue()

        self.assertEqual(result["shared_bouquets_processed"], 1)
        self.assertEqual(result["statements_created"], 3)

        pool_mensuel = float(Decimal("120000.00")) / 12
        part_egale_attendue = pool_mensuel / 3

        for inst in (self.uac, self.una, self.parakou):
            stmt = UniversityRoyaltyStatement.objects.filter(institution=inst).latest("created_at")
            self.assertAlmostEqual(float(stmt.total_sales_catalog), part_egale_attendue, places=1)

    def test_idempotent_on_rerun(self):
        self._create_traces(self.sub_uac, 10)

        task_distribute_bouquet_revenue()
        count_after_first_run = UniversityRoyaltyStatement.objects.count()

        task_distribute_bouquet_revenue()
        count_after_second_run = UniversityRoyaltyStatement.objects.count()

        self.assertEqual(
            count_after_first_run, count_after_second_run,
            "Relancer la tâche pour la même période a créé des doublons — get_or_create "
            "doit utiliser une clé (institution, period) stable."
        )
