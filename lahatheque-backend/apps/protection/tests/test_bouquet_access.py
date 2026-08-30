"""
Tests unitaires — Fiche W1 : accès étudiant via bouquet documentaire.
Vérifie que l'accès est réellement limité aux livres inclus dans le bouquet souscrit,
jamais étendu au catalogue entier, et respecte les dates de validité.
"""
from datetime import date, timedelta
from django.test import TestCase
from apps.accounts.models import User
from apps.catalog.models import Ouvrage, Discipline
from apps.partners.models import Institution, StudentAffiliation, BouquetOffering, UniversityBouquetSubscription
from apps.protection.access_service import AccessService


class BouquetAccessTestCase(TestCase):
    def setUp(self):
        self.institution = Institution.objects.create(
            name="Université d'Abomey-Calavi", code="UAC", country="BJ"
        )
        self.discipline = Discipline.objects.create(name="Droit OHADA", code_dewey="340")

        self.book_in_bouquet = Ouvrage.objects.create(
            title="Traité de Droit OHADA", isbn="978-0-00000-001-1",
            discipline=self.discipline, format_type="pdf",
            price_digital=5000, status="published"
        )
        self.book_outside_bouquet = Ouvrage.objects.create(
            title="Manuel de Philosophie", isbn="978-0-00000-002-2",
            format_type="pdf", price_digital=4000, status="published"
        )

        self.student = User.objects.create_user(
            username="etudiant_test", email="etudiant@uac.bj",
            password="TestPass123!", role="student"
        )
        self.affiliation = StudentAffiliation.objects.create(
            student=self.student, institution=self.institution,
            student_card_number="UAC-2026-001", is_validated=True
        )

        self.offering = BouquetOffering.objects.create(
            title="Bouquet Droit OHADA", bouquet_type="discipline",
            discipline="Droit OHADA", annual_price=1000000, is_active=True
        )

        self.active_subscription = UniversityBouquetSubscription.objects.create(
            institution=self.institution,
            offering_id=self.offering.id,
            title=self.offering.title,
            bouquet_type="discipline",
            discipline="Droit OHADA",
            status="active",
            start_date=date.today() - timedelta(days=10),
            end_date=date.today() + timedelta(days=355),
        )

    def test_book_in_bouquet_grants_access(self):
        result = AccessService.check_user_book_access(self.student, self.book_in_bouquet.id)
        self.assertTrue(result["access_granted"])
        self.assertEqual(result["reason"], "bouquet_access")
        self.assertEqual(result["bouquet_subscription_id"], str(self.active_subscription.id))

    def test_book_not_in_bouquet_denies_access(self):
        result = AccessService.check_user_book_access(self.student, self.book_outside_bouquet.id)
        self.assertFalse(result["access_granted"])
        self.assertEqual(result["reason"], "no_active_access")

    def test_expired_bouquet_denies_access(self):
        self.active_subscription.end_date = date.today() - timedelta(days=1)
        self.active_subscription.save()
        result = AccessService.check_user_book_access(self.student, self.book_in_bouquet.id)
        self.assertFalse(result["access_granted"])

    def test_unaffiliated_student_denies_access(self):
        lone_student = User.objects.create_user(
            username="etudiant_isole", email="isole@example.com",
            password="TestPass123!", role="student"
        )
        result = AccessService.check_user_book_access(lone_student, self.book_in_bouquet.id)
        self.assertFalse(result["access_granted"])

    def test_inactive_offering_denies_access(self):
        self.offering.is_active = False
        self.offering.save()
        result = AccessService.check_user_book_access(self.student, self.book_in_bouquet.id)
        self.assertFalse(result["access_granted"])

    def test_custom_bouquet_access(self):
        custom_book = Ouvrage.objects.create(
            title="Ouvrage Sélectionné à la Main", isbn="978-0-00000-003-3",
            format_type="pdf", price_digital=6000, status="published"
        )
        custom_offering = BouquetOffering.objects.create(
            title="Sélection Spéciale", bouquet_type="custom",
            annual_price=200000, is_active=True
        )
        custom_offering.custom_books.add(custom_book)

        UniversityBouquetSubscription.objects.create(
            institution=self.institution,
            offering_id=custom_offering.id,
            title=custom_offering.title,
            bouquet_type="custom",
            status="active",
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
        )

        result = AccessService.check_user_book_access(self.student, custom_book.id)
        self.assertTrue(result["access_granted"])
        self.assertEqual(result["reason"], "bouquet_access")
