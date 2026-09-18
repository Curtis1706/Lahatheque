"""
Tests de performance et de robustesse du cache DRM et du streaming HTTP 206.
Vérifie le verrou anti-thundering herd sur cache froid, l'invalidation de version,
l'optimisation de linéarisation PyMuPDF, et l'exposition des en-têtes CORS Range.
"""

import os
import shutil
import tempfile
import threading
import time
from unittest.mock import patch, MagicMock

import fitz
import pytest
from django.conf import settings
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.protection.source_adapter import DocumentSourceAdapter
from apps.protection.watermark import WatermarkEngine
from apps.protection.derived_materializer import DerivedMaterializer
from apps.protection.models import TraceAcces
from apps.reader.models import PartnerApp, PartnerEndUser, ReaderSession
from apps.reader.views import ReaderProtectedStreamView


@override_settings(
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "test-drm-performance-cache",
        }
    }
)
class TestDrmPerformanceAndCaching(TestCase):
    """Suite de tests pour la haute performance de lecture LAHAThèque."""

    def setUp(self):
        super().setUp()
        cache.clear()
        self.temp_source_dir = tempfile.mkdtemp(prefix="test_source_cache_")
        self.temp_drm_dir = tempfile.mkdtemp(prefix="test_drm_cache_")

    def tearDown(self):
        cache.clear()
        shutil.rmtree(self.temp_source_dir, ignore_errors=True)
        shutil.rmtree(self.temp_drm_dir, ignore_errors=True)
        super().tearDown()

    def test_cold_cache_thundering_herd(self):
        """
        Vérifie qu'en cas de cache froid, des requêtes concurrentes massives
        n'exécutent qu'un SEUL téléchargement R2 grâce au verrou distribué Redis.
        """
        r2_key = "books/test_heavy_book/content.pdf"
        mock_pdf_bytes = b"%PDF-1.4 mock heavy book bytes " * 50
        download_count = 0
        counter_lock = threading.Lock()

        def mock_s3_get_object(*args, **kwargs):
            nonlocal download_count
            with counter_lock:
                download_count += 1
            time.sleep(0.05)
            body_mock = MagicMock()
            body_mock.read.return_value = mock_pdf_bytes
            return {"Body": body_mock}

        mock_s3_client = MagicMock()
        mock_s3_client.get_object.side_effect = mock_s3_get_object

        shared_lock = threading.Lock()
        class MockRedisLock:
            def __enter__(self):
                shared_lock.acquire()
                return self
            def __exit__(self, exc_type, exc_val, exc_tb):
                shared_lock.release()
            def acquire(self, blocking=True):
                return shared_lock.acquire(blocking=blocking)
            def release(self):
                shared_lock.release()

        class MockRedisClient:
            def lock(self, name, timeout=60, blocking_timeout=65):
                return MockRedisLock()

        with override_settings(DRM_SOURCE_CACHE_DIR=self.temp_source_dir):
            with patch("apps.catalog.services.cover_generator.get_r2_books_client", return_value=mock_s3_client):
                with patch.object(DocumentSourceAdapter, "_get_redis_client", return_value=MockRedisClient()):
                    threads = []
                    results = []

                    def worker():
                        data = DocumentSourceAdapter._fetch_r2_object(r2_key)
                        results.append(data)

                    for _ in range(8):
                        t = threading.Thread(target=worker)
                        threads.append(t)
                        t.start()

                    for t in threads:
                        t.join()

                    assert len(results) == 8
                    for res in results:
                        assert res == mock_pdf_bytes

                    assert download_count == 1

                    cached_files = os.listdir(self.temp_source_dir)
                    assert len(cached_files) == 1

    def test_source_cache_version_invalidation(self):
        """
        Vérifie qu'un version_token différent invalide le cache et déclenche un nouveau téléchargement.
        """
        r2_key = "books/versioned_book/content.pdf"
        data_v1 = b"%PDF-1.4 Version 1 content"
        data_v2 = b"%PDF-1.4 Version 2 content"
        download_calls = []

        def mock_s3_get_object(*args, **kwargs):
            if "v2" in download_calls:
                body = MagicMock()
                body.read.return_value = data_v2
                return {"Body": body}
            body = MagicMock()
            body.read.return_value = data_v1
            return {"Body": body}

        mock_s3 = MagicMock()
        mock_s3.get_object.side_effect = mock_s3_get_object

        with override_settings(DRM_SOURCE_CACHE_DIR=self.temp_source_dir):
            with patch("apps.catalog.services.cover_generator.get_r2_books_client", return_value=mock_s3):
                # 1. Premier appel avec token v1
                res1 = DocumentSourceAdapter._fetch_r2_object(r2_key, version_token="v1")
                assert res1 == data_v1
                assert mock_s3.get_object.call_count == 1

                # 2. Deuxième appel avec token v1 (doit frapper le cache SSD local)
                res2 = DocumentSourceAdapter._fetch_r2_object(r2_key, version_token="v1")
                assert res2 == data_v1
                assert mock_s3.get_object.call_count == 1

                # 3. Troisième appel avec token v2 (invalidation de version)
                download_calls.append("v2")
                res3 = DocumentSourceAdapter._fetch_r2_object(r2_key, version_token="v2")
                assert res3 == data_v2
                assert mock_s3.get_object.call_count == 2

    def test_watermark_linearization_performance(self):
        """
        Vérifie que le filigranage avec linear=False et deflate=True est ultra-rapide (< 3.0s)
        et génère un PDF valide avec les marqueurs standards.
        """
        doc = fitz.open()
        for i in range(50):
            page = doc.new_page(width=595, height=842)
            page.insert_text(fitz.Point(50, 100), f"Page {i + 1} de test de performance")
        base_pdf_bytes = doc.tobytes()
        doc.close()

        user_info = {
            "nom": "Kossi Mensah",
            "email": "kossi@univ.bj",
            "ip": "197.234.221.10",
            "user_id": "usr_9921",
            "title": "Manuel Avancé",
            "id": "book_123",
            "is_partner": True,
        }

        start_time = time.perf_counter()
        watermarked_bytes = WatermarkEngine.apply_watermark(base_pdf_bytes, user_info)
        elapsed = time.perf_counter() - start_time

        assert elapsed < 3.0, f"Le filigranage a pris {elapsed:.3f}s, ce qui dépasse le seuil critique de 3.0s"
        assert watermarked_bytes.startswith(b"%PDF-")
        assert b"%%EOF" in watermarked_bytes

        check_doc = fitz.open(stream=watermarked_bytes, filetype="pdf")
        assert check_doc.page_count == 50
        check_doc.close()

    def test_reader_stream_range_and_cors_headers(self):
        """
        Vérifie que ReaderProtectedStreamView expose bien Access-Control-Expose-Headers
        avec Accept-Ranges, Content-Range et Content-Length pour permettre à PDF.js de streamer.
        """
        partner = PartnerApp.objects.create(
            name="Univ Test",
            client_id="cid_1",
            client_secret_hash="hash_1",
            is_active=True,
        )
        end_user = PartnerEndUser.objects.create(
            partner=partner,
            external_ref="STU-001",
            display_name="Etudiant Test",
            email="etudiant@univ.bj",
        )
        from django.utils import timezone
        from datetime import timedelta
        session = ReaderSession.objects.create(
            partner=partner,
            source_type="external_url",
            custom_document_url="https://storage.univ.bj/books/maths.pdf",
            end_user=end_user,
            token_hash="dummy_token_hash",
            return_url="https://lms.univ.bj",
            status="opened",
            expires_at=timezone.now() + timedelta(hours=2),
        )

        dummy_pdf_content = b"%PDF-1.4 range test content bytes " * 10
        total_len = len(dummy_pdf_content)

        temp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        temp_pdf.write(dummy_pdf_content)
        temp_pdf.flush()
        temp_pdf.close()

        try:
            with patch("apps.protection.derived_materializer.DerivedMaterializer.get_or_create_derived_file_path", return_value=(temp_pdf.name, total_len, "cache_key_1")):
                with patch.object(ReaderProtectedStreamView, "check_permissions"):
                    view = ReaderProtectedStreamView()

                    req_range = MagicMock()
                    req_range.reader_session = session
                    req_range.query_params = {}
                    req_range.META = {
                        "REMOTE_ADDR": "127.0.0.1",
                        "HTTP_RANGE": "bytes=0-99",
                    }
                    req_range.headers = {}

                    resp_range = view.get(req_range)
                    assert resp_range.status_code == status.HTTP_206_PARTIAL_CONTENT
                    assert resp_range["Content-Range"] == f"bytes 0-99/{total_len}"
                    assert resp_range["Content-Length"] == "100"
                    assert resp_range["Accept-Ranges"] == "bytes"
                    assert "Access-Control-Expose-Headers" in resp_range
                    expose_headers = resp_range["Access-Control-Expose-Headers"]
                    assert "Accept-Ranges" in expose_headers
                    assert "Content-Range" in expose_headers
                    assert "Content-Length" in expose_headers
        finally:
            if os.path.exists(temp_pdf.name):
                os.remove(temp_pdf.name)

    @override_settings(CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache", "LOCATION": "test_throttling_cache"}})
    def test_trace_acces_redis_throttling(self):
        """
        Vérifie que de multiples requêtes Range sur une session de lecture
        ne créent qu'une seule entrée dans TraceAcces par tranche de 300 secondes.
        """
        from django.core.cache import caches
        locmem_cache = caches["default"]
        locmem_cache.clear()
        partner = PartnerApp.objects.create(
            name="Univ Test 2",
            client_id="cid_2",
            client_secret_hash="hash_2",
            is_active=True,
        )
        end_user = PartnerEndUser.objects.create(
            partner=partner,
            external_ref="STU-002",
            display_name="Etudiant 2",
            email="etudiant2@univ.bj",
        )
        from django.utils import timezone
        from datetime import timedelta
        session = ReaderSession.objects.create(
            partner=partner,
            source_type="external_url",
            custom_document_url="https://storage.univ.bj/books/histoire.pdf",
            end_user=end_user,
            token_hash="dummy_token_hash_2",
            return_url="https://lms.univ.bj",
            status="opened",
            expires_at=timezone.now() + timedelta(hours=2),
        )

        dummy_pdf_content = b"%PDF-1.4 range throttle test"
        temp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        temp_pdf.write(dummy_pdf_content)
        temp_pdf.flush()
        temp_pdf.close()

        try:
            with patch("apps.protection.derived_materializer.DerivedMaterializer.get_or_create_derived_file_path", return_value=(temp_pdf.name, len(dummy_pdf_content), "cache_key_2")):
                with patch.object(ReaderProtectedStreamView, "check_permissions"):
                    with patch("apps.reader.views.cache", locmem_cache):
                        view = ReaderProtectedStreamView()

                    # Simule 5 fragments Range successifs
                    for i in range(5):
                        req = MagicMock()
                        req.reader_session = session
                        req.query_params = {}
                        req.META = {
                            "REMOTE_ADDR": "127.0.0.1",
                            "HTTP_RANGE": f"bytes={i * 2}-{i * 2 + 1}",
                        }
                        req.headers = {}
                        resp = view.get(req)
                        assert resp.status_code == status.HTTP_206_PARTIAL_CONTENT

                    # Vérifie que TraceAcces ne contient qu'une seule trace
                    traces_count = TraceAcces.objects.filter(partner_id=str(session.partner_id)).count()
                    assert traces_count == 1
        finally:
            if os.path.exists(temp_pdf.name):
                os.remove(temp_pdf.name)
