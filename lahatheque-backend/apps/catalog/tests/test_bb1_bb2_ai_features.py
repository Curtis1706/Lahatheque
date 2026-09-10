"""
Tests unitaires — Fiches BB1 & BB2 :
- BB1: Recommandations personnalisées (PersonalizedRecommendationsView)
- BB2: Rapport de pertinence des bouquets (BouquetRelevanceReportView)
"""
from django.test import TestCase
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.catalog.models import Ouvrage, Discipline
from apps.partners.models import Institution, Faculty, BouquetOffering
from apps.protection.models import TraceAcces


class BB1PersonalizedRecommendationsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.disc_eco = Discipline.objects.create(name="Économie", code_dewey="330")
        self.disc_info = Discipline.objects.create(name="Informatique", code_dewey="004")

        self.book_eco_1 = Ouvrage.objects.create(
            title="Livre Éco 1", isbn="978-0-00000-001-1",
            discipline=self.disc_eco, format_type="pdf",
            price_digital=3000, status="published"
        )
        self.book_eco_2 = Ouvrage.objects.create(
            title="Livre Éco 2", isbn="978-0-00000-002-2",
            discipline=self.disc_eco, format_type="pdf",
            price_digital=4000, status="published"
        )
        self.book_info_1 = Ouvrage.objects.create(
            title="Livre Info 1", isbn="978-0-00000-003-3",
            discipline=self.disc_info, format_type="pdf",
            price_digital=5000, status="published"
        )

        self.user = User.objects.create_user(
            username="student_reco", email="student@reco.com",
            password="TestPassword123!", role="student"
        )
        self.client.force_authenticate(user=self.user)

    def test_fallback_when_no_history(self):
        res = self.client.get("/api/v1/catalog/recommendations/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["meta"]["reason"], "no_history_fallback")
        self.assertGreaterEqual(len(data["data"]), 1)

    def test_recommendation_based_on_reading_and_purchase_history(self):
        # L'utilisateur consulte le livre Éco 1
        TraceAcces.objects.create(
            user=self.user,
            ouvrage=self.book_eco_1,
            access_type="read_chunk",
            ip_address="127.0.0.1"
        )

        res = self.client.get("/api/v1/catalog/recommendations/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["meta"]["reason"], "based_on_history")

        returned_ids = [item["id"] for item in data["data"]]
        # Le livre déjà consulté ne doit PAS être recommandé
        self.assertNotIn(str(self.book_eco_1.id), returned_ids)
        # Le livre de la même discipline doit être recommandé en priorité
        self.assertIn(str(self.book_eco_2.id), returned_ids)


class BB2BouquetRelevanceReportTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.staff_user = User.objects.create_user(
            username="univ_staff_test", email="staff@un.bj",
            password="TestPassword123!", role="university"
        )

        self.institution = Institution.objects.create(
            name="Université Nationale", code="UN", country="BJ",
            user=self.staff_user
        )

        # Facultés avec disciplines enseignées
        Faculty.objects.create(
            institution=self.institution,
            name="Faculté d'Économie",
            disciplines=["Économie", "Gestion"]
        )

        self.disc_eco = Discipline.objects.create(name="Économie", code_dewey="330")
        self.disc_med = Discipline.objects.create(name="Médecine", code_dewey="610")

        self.book_eco = Ouvrage.objects.create(
            title="Manuel Économie", isbn="978-0-00000-020-0",
            discipline=self.disc_eco, format_type="pdf",
            price_digital=4500, status="published"
        )
        self.book_med = Ouvrage.objects.create(
            title="Manuel Médecine", isbn="978-0-00000-021-0",
            discipline=self.disc_med, format_type="pdf",
            price_digital=6500, status="published"
        )

        self.offering = BouquetOffering.objects.create(
            title="Bouquet Pluridisciplinaire",
            bouquet_type="custom",
            annual_price=1200000,
            is_active=True
        )
        self.offering.custom_books.set([self.book_eco, self.book_med])

    def test_relevance_report_calculation(self):
        self.client.force_authenticate(user=self.staff_user)
        res = self.client.get(f"/api/v1/partners/bouquets/{self.offering.id}/relevance/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        report = data["data"]
        self.assertEqual(report["total_books"], 2)
        self.assertEqual(report["matching_books"], 1)
        self.assertEqual(report["relevance_percent"], 50.0)
        self.assertIn("Économie", report["matched_disciplines"])
