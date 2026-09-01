"""
Tests pour la règle de calcul sample_pages_count et l'endpoint BookSampleStreamView.
"""
from unittest import TestCase
from datetime import date
from unittest.mock import patch
import fitz
import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.catalog.models import Ouvrage, Discipline
from apps.publishers_portal.models import Publisher


class SamplePagesCountFormulaTestCase(TestCase):
    """
    Validation unitaire de la formule révisée de sample_pages_count :
    - 0 page / inconnu -> 10
    - 1 page -> 1
    - 4 pages -> 3
    - 5 pages -> 4
    - 6 pages -> 5
    - 10 pages -> 8
    - 20 pages -> 8
    - 105 pages -> 13
    - 300 pages -> 30
    """

    def test_sample_pages_count_rules(self):
        cases = [
            (0, 10),
            (-1, 10),
            (1, 1),
            (2, 1),
            (4, 3),
            (5, 4),
            (6, 5),
            (8, 7),
            (10, 8),
            (20, 8),
            (105, 13),
            (300, 30),
            (500, 30),
        ]
        for page_count, expected in cases:
            ouv = Ouvrage(title="Livre Test", page_count=page_count)
            self.assertEqual(
                ouv.sample_pages_count, expected,
                f"Échec pour page_count={page_count} : attendu={expected}, obtenu={ouv.sample_pages_count}"
            )


@pytest.mark.django_db
class BookSampleStreamViewTestCase:
    """Tests d'intégration pour BookSampleStreamView."""

    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="student_sample_test",
            email="student.sample@univ.bj",
            password="StrongPassword123!",
            role="student"
        )
        self.publisher = Publisher.objects.create(
            name="Éditions Africaines LAHA",
            rccm_number="RB/COT/24-B-002",
            country="BJ",
            contact_email="editions.sample@laha.bj"
        )
        self.discipline = Discipline.objects.create(name="Sciences", code_dewey="500")
        self.ouvrage = Ouvrage.objects.create(
            title="Manuel de Physique",
            isbn="978-2-0000-0002-6",
            publisher=self.publisher,
            discipline=self.discipline,
            publication_date=date(2025, 1, 1),
            format_type="pdf",
            price_digital=4000.00,
            status="published",
            page_count=6
        )

    def _generate_dummy_pdf(self, num_pages: int = 6) -> bytes:
        doc = fitz.open()
        for i in range(num_pages):
            page = doc.new_page(width=595, height=842)
            page.insert_text(fitz.Point(50, 100), f"Page de test {i+1}", fontsize=14)
        pdf_bytes = doc.tobytes()
        doc.close()
        return pdf_bytes

    def test_sample_generation_success(self):
        self.client.force_authenticate(user=self.user)
        pdf_bytes = self._generate_dummy_pdf(6)

        with patch("apps.protection.source_adapter.DocumentSourceAdapter.get_document_bytes", return_value=pdf_bytes):
            response = self.client.get(f"/api/v1/catalog/books/{self.ouvrage.id}/sample/")
            assert response.status_code == 200
            assert response["Content-Type"] == "application/pdf"
            assert response["X-Sample-Pages"] == "5"  # pour 6 pages, 5 pages d'extrait
            assert response["X-Sample-Total-Pages"] == "6"

            # Vérifier que le PDF généré est valide
            result_doc = fitz.open(stream=response.content, filetype="pdf")
            assert result_doc.page_count == 5
            result_doc.close()

    def test_sample_unauthenticated_rejected(self):
        response = self.client.get(f"/api/v1/catalog/books/{self.ouvrage.id}/sample/")
        assert response.status_code == 401
