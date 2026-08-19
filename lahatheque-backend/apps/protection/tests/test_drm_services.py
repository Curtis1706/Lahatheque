"""
Tests unitaires pour les services DRM LAHAThèque (WatermarkEngine, EncryptionService, DocumentSourceAdapter).
"""

import fitz
import pytest
from apps.protection.watermark import WatermarkEngine
from apps.protection.encryption_service import EncryptionService
from apps.protection.source_adapter import DocumentSourceAdapter, DocumentSourceError


def create_sample_pdf() -> bytes:
    """Crée un document PDF de test minimal en mémoire avec PyMuPDF."""
    doc = fitz.open()
    page = doc.new_page(width=595, height=842) # A4
    page.insert_text(fitz.Point(72, 100), "Document de Test LAHATheque DRM", fontsize=16)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


class TestEncryptionService:
    """Tests du service de chiffrement AES-256-GCM."""

    def test_encrypt_decrypt_roundtrip(self):
        sample_data = b"Contenu secret d'un livre universitaire protege."
        encrypted = EncryptionService.encrypt(sample_data)

        assert encrypted != sample_data
        assert len(encrypted) > len(sample_data)

        decrypted = EncryptionService.decrypt(encrypted)
        assert decrypted == sample_data

    def test_decrypt_corrupted_data_raises_error(self):
        sample_data = b"Donnees importantes."
        encrypted = EncryptionService.encrypt(sample_data)

        # Altération d'un octet du ciphertext
        corrupted = bytearray(encrypted)
        corrupted[-1] ^= 0xFF

        with pytest.raises(ValueError):
            EncryptionService.decrypt(bytes(corrupted))


class TestWatermarkEngine:
    """Tests du moteur de filigrane PyMuPDF."""

    def test_apply_watermark_preserves_pdf_validity(self):
        pdf_bytes = create_sample_pdf()
        user_info = {
            "nom": "Koffi Mensah",
            "email": "koffi.mensah@univ.bj",
            "ip": "197.234.12.5",
            "user_id": "u-1234",
            "device_fingerprint": "Chrome-Win64"
        }

        watermarked_bytes = WatermarkEngine.apply_watermark(
            pdf_bytes=pdf_bytes,
            user_info=user_info
        )

        assert watermarked_bytes is not None
        assert len(watermarked_bytes) > 0

        # Vérification de la validité du PDF généré
        doc = fitz.open(stream=watermarked_bytes, filetype="pdf")
        assert len(doc) == 1
        page_text = doc[0].get_text()
        assert "Koffi Mensah" in page_text
        assert "197.234.12.5" in page_text

        # Vérification des métadonnées
        assert "LAHATheque DRM" in doc.metadata.get("producer", "")
        doc.close()


class TestDocumentSourceAdapter:
    """Tests de l'adaptateur de sources agnostique."""

    def test_direct_upload_bytes(self):
        sample_bytes = b"%PDF-1.4 sample content"
        options = {"uploaded_file": sample_bytes}

        retrieved = DocumentSourceAdapter.get_document_bytes(
            source_type="direct_upload",
            source_reference="",
            options=options
        )
        assert retrieved == sample_bytes

    def test_unknown_source_type_raises_error(self):
        with pytest.raises(DocumentSourceError):
            DocumentSourceAdapter.get_document_bytes(
                source_type="ftp_unknown",
                source_reference="ftp://server/file.pdf"
            )
