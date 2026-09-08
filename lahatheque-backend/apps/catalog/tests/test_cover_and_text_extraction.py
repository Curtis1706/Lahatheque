"""
Tests unitaires d'extraction de couverture WebP et d'echantillonnage PyMuPDF (15 premieres et 15 dernieres pages).
"""
import io
from unittest import TestCase
import fitz
from PIL import Image

from apps.ai_engine.services.openai_service import extract_text_sample_from_bytes
from apps.catalog.services.cover_generator import extract_cover_image_bytes


class CoverAndTextExtractionTestCase(TestCase):
    """
    Validation de la regle stricte d'echantillonnage 15p + 15p et conversion WebP de page 1.
    """

    def _create_sample_pdf(self, page_count: int = 40) -> bytes:
        """Genere un PDF valide de test en memoire avec du texte sur chaque page."""
        doc = fitz.open()
        for i in range(page_count):
            page = doc.new_page()
            text = f"Page {i + 1} : Contenu textuel de test pour la validation du module IA LAHA."
            page.insert_text((50, 100), text, fontsize=12)
        pdf_bytes = doc.write()
        doc.close()
        return pdf_bytes

    def test_extract_text_sample_15_first_15_last(self):
        """Verifie que seules les 15 premieres et 15 dernieres pages sont extraites."""
        pdf_bytes = self._create_sample_pdf(page_count=50)
        sample, total = extract_text_sample_from_bytes(pdf_bytes, file_ext="pdf")

        self.assertEqual(total, 50)
        # Verifier presence des pages 1 et 15
        self.assertIn("--- PAGE 1 / 50 ---", sample)
        self.assertIn("--- PAGE 15 / 50 ---", sample)

        # Verifier absence de la page 25 (milieu exclu)
        self.assertNotIn("--- PAGE 25 / 50 ---", sample)

        # Verifier presence des 15 dernieres pages (36 a 50)
        self.assertIn("--- PAGE 36 / 50 ---", sample)
        self.assertIn("--- PAGE 50 / 50 ---", sample)

    def test_extract_cover_image_produces_valid_webp(self):
        """Verifie que l'extraction de page 1 produit une image WebP lisible."""
        pdf_bytes = self._create_sample_pdf(page_count=5)
        webp_bytes = extract_cover_image_bytes(pdf_bytes, max_width=600, quality=80)

        self.assertIsInstance(webp_bytes, bytes)
        self.assertGreater(len(webp_bytes), 100)

        # Verification format PIL
        image_stream = io.BytesIO(webp_bytes)
        img = Image.open(image_stream)
        self.assertEqual(img.format, "WEBP")
        self.assertLessEqual(img.width, 600)
