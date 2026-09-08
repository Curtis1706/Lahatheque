"""
Tests unitaires de l'ingestion multilingue et d'idempotence (Option A).
"""
import uuid
from unittest.mock import MagicMock, patch
from django.test import TestCase
from apps.catalog.models import Discipline, Ouvrage, OuvrageLanguageVersion
from apps.catalog.management.commands.import_r2_multilingual_books import Command
from apps.rights.models import RoyaltyRate


class MultilingualIngestionTestCase(TestCase):
    """
    Validation de la qualification linguistique, de l'idempotence et des droits 5%.
    """

    def setUp(self):
        self.discipline = Discipline.objects.create(name="Sciences Médicales", is_active=True)
        self.test_uuid = str(uuid.uuid4())
        self.command = Command()

    @patch("apps.catalog.management.commands.import_r2_multilingual_books.generate_and_upload_cover")
    @patch("apps.catalog.management.commands.import_r2_multilingual_books.analyze_document_with_openai")
    @patch("apps.catalog.management.commands.import_r2_multilingual_books.extract_text_sample_from_bytes")
    def test_ingestion_option_a_bilingual_and_idempotence(
        self, mock_extract, mock_analyze, mock_cover
    ):
        mock_extract.return_value = ("Echantillon de texte bilingue", 150)
        mock_analyze.return_value = {
            "title": "Immunologie Moderne",
            "subtitle": "Concepts et Pratiques",
            "authors": ["Dr Marie Curie", "Dr Louis Pasteur"],
            "summary": "Un ouvrage de reference sur les vaccins et l'immunologie.",
            "genre_category": "Sciences Médicales",
            "dewey_code": "610",
            "isbn": "978-99919-001-1-2",
            "publisher_name": "LAHA Éditions",
        }
        mock_cover.return_value = (f"covers/{self.test_uuid}/cover.webp", "https://cdn.laha.bj/cover.webp")

        mock_s3 = MagicMock()
        mock_s3.get_object.return_value = {"Body": MagicMock(read=MagicMock(return_value=b"%PDF-1.4 mock bytes"))}

        book_data = {
            "en_pdf": f"books/{self.test_uuid}/EN/original.pdf",
            "en_epub": f"books/{self.test_uuid}/EN/original.epub",
            "fr_pdf": f"books/{self.test_uuid}/FR/jobs/123/translated.pdf",
            "fr_epub": f"books/{self.test_uuid}/FR/jobs/123/translated.epub",
            "other_files": [],
        }

        # Premier passage
        self.command._process_single_book(
            book_uuid_str=self.test_uuid,
            book_data=book_data,
            s3=mock_s3,
            bucket_name="laha-books-production",
            dry_run=False,
            skip_cover=False,
        )

        # Verification base de donnees
        ouvrage = Ouvrage.objects.get(id=uuid.UUID(self.test_uuid))
        self.assertEqual(ouvrage.title, "Immunologie Moderne")
        self.assertEqual(ouvrage.language, "en")
        self.assertEqual(ouvrage.page_count, 150)
        self.assertEqual(ouvrage.status, "published")

        # Verifications des versions linguistiques
        versions = OuvrageLanguageVersion.objects.filter(ouvrage=ouvrage)
        self.assertEqual(versions.count(), 2)

        en_version = versions.get(language="en")
        self.assertTrue(en_version.is_original)
        self.assertEqual(en_version.r2_key_pdf, f"books/{self.test_uuid}/EN/original.pdf")

        fr_version = versions.get(language="fr")
        self.assertFalse(fr_version.is_original)
        self.assertEqual(fr_version.r2_key_pdf, f"books/{self.test_uuid}/FR/jobs/123/translated.pdf")

        # Verification de la redevance 5% par defaut
        royalty = RoyaltyRate.objects.get(ouvrage=ouvrage)
        self.assertEqual(float(royalty.publisher_share_percent), 5.0)
        self.assertEqual(float(royalty.platform_share_percent), 95.0)

        # Deuxieme passage (test d'idempotence : ne doit pas lever d'erreur ni dupliquer)
        self.command._process_single_book(
            book_uuid_str=self.test_uuid,
            book_data=book_data,
            s3=mock_s3,
            bucket_name="laha-books-production",
            dry_run=False,
            skip_cover=False,
        )

        self.assertEqual(Ouvrage.objects.filter(id=uuid.UUID(self.test_uuid)).count(), 1)
        self.assertEqual(OuvrageLanguageVersion.objects.filter(ouvrage=ouvrage).count(), 2)
