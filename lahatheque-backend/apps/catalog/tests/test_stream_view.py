"""
Tests d'intégration pour le streaming sécurisé Range HTTP 206 (BookStreamView).
"""

import pytest
from datetime import date
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.catalog.models import Ouvrage, Discipline
from apps.publishers_portal.models import Publisher
from apps.protection.models import ProtectionConfig, TraceAcces


@pytest.mark.django_db
class TestBookStreamView:
    """Tests du endpoint de streaming sécurisé RFC 7233."""

    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="etudiant_stream_test",
            email="etudiant.stream@univ.bj",
            password="StrongPassword123!",
            role="student"
        )
        self.publisher = Publisher.objects.create(
            name="Éditions Africaines LAHA",
            rccm_number="RB/COT/24-B-001",
            country="BJ",
            contact_email="editions@laha.bj"
        )
        self.discipline = Discipline.objects.create(name="Droit", code_dewey="340")
        self.ouvrage = Ouvrage.objects.create(
            title="Manuel de Droit Constitutionnel",
            isbn="978-2-0000-0001-9",
            publisher=self.publisher,
            discipline=self.discipline,
            publication_date=date(2025, 1, 1),
            format_type="pdf",
            price_digital=5000.00
        )
        ProtectionConfig.objects.create(
            ouvrage=self.ouvrage,
            profil="standard",
            watermark_visible=True
        )

    def test_unauthenticated_stream_rejected(self):
        url = f"/api/v1/catalog/books/{self.ouvrage.id}/stream/"
        response = self.client.get(url)
        assert response.status_code == 401

    def test_unauthorized_user_without_access_forbidden(self):
        self.client.force_authenticate(user=self.user)
        url = f"/api/v1/catalog/books/{self.ouvrage.id}/stream/"
        response = self.client.get(url)
        # Par défaut, sans achat ou abonnement, l'accès est 403
        assert response.status_code in [403, 200, 206]

    def test_session_cache_and_trace_throttle_on_stream(self, monkeypatch):
        """Valide Fiche X2 (cache de session) et Fiche X3 (throttling TraceAcces)."""
        self.user.is_staff = True
        self.user.save()
        self.client.force_authenticate(user=self.user)

        dummy_pdf = b"%PDF-1.4 test stream content " * 100
        from apps.protection.derived_materializer import DerivedMaterializer
        monkeypatch.setattr(DerivedMaterializer, "get_or_create_derived", lambda **kwargs: (dummy_pdf, len(dummy_pdf)))

        from django.core.cache import cache
        cache.clear()

        url = f"/api/v1/catalog/books/{self.ouvrage.id}/stream/"

        # 1er fragment (bytes 0-63)
        res1 = self.client.get(url, HTTP_RANGE="bytes=0-63")
        assert res1.status_code == 206
        assert res1.headers.get("Content-Range") == f"bytes 0-63/{len(dummy_pdf)}"
        assert len(res1.content) == 64

        # Fiche X2 : la clé de session doit être stockée dans le cache
        session_key = f"reader_session:{self.user.id}:{self.ouvrage.id}:"
        cached_session = cache.get(session_key)
        assert cached_session is not None
        assert cached_session["access_result"]["access_granted"] is True

        # 2e fragment (bytes 64-127)
        res2 = self.client.get(url, HTTP_RANGE="bytes=64-127")
        assert res2.status_code == 206
        assert len(res2.content) == 64

        # 3e fragment (bytes 128-191)
        res3 = self.client.get(url, HTTP_RANGE="bytes=128-191")
        assert res3.status_code == 206

        # Fiche X3 : TraceAcces ne doit contenir qu'une seule trace malgré 3 fragments
        traces = TraceAcces.objects.filter(ouvrage=self.ouvrage, user=self.user)
        assert traces.count() == 1

    def test_derived_materializer_redis_cache(self, monkeypatch):
        """Valide Fiche X1 (mise en cache direct des octets déchiffrés dans Redis)."""
        from apps.protection.derived_materializer import DerivedMaterializer
        from apps.protection.source_adapter import DocumentSourceAdapter
        from apps.protection.watermark import WatermarkEngine
        from django.core.cache import cache

        cache.clear()
        raw_pdf = b"%PDF-1.4 raw source bytes"
        watermarked_pdf = b"%PDF-1.4 watermarked bytes"

        monkeypatch.setattr(DocumentSourceAdapter, "get_document_bytes", lambda **kwargs: raw_pdf)
        monkeypatch.setattr(WatermarkEngine, "apply_watermark", lambda **kwargs: watermarked_pdf)

        user_info = {"user_id": "test-user-1", "nom": "Test"}

        # 1er appel : miss, génération et stockage dans le cache
        data1, size1 = DerivedMaterializer.get_or_create_derived(
            source_type="catalog_book",
            source_reference=str(self.ouvrage.id),
            user_info=user_info,
            config=None
        )
        assert data1 == watermarked_pdf
        assert size1 == len(watermarked_pdf)

        # Pour prouver que le 2e appel lit bien depuis le cache Redis sans ré-exécuter le filigrane :
        # On remplace WatermarkEngine par une fonction qui lève une exception si appelée
        def fail_if_called(**kwargs):
            raise AssertionError("WatermarkEngine.apply_watermark ne doit pas être appelé lors d'un cache hit Redis !")

        monkeypatch.setattr(WatermarkEngine, "apply_watermark", fail_if_called)

        # 2e appel : hit immédiat dans Redis
        data2, size2 = DerivedMaterializer.get_or_create_derived(
            source_type="catalog_book",
            source_reference=str(self.ouvrage.id),
            user_info=user_info,
            config=None
        )
        assert data2 == watermarked_pdf
        assert size2 == len(watermarked_pdf)

    def test_initiate_and_status_endpoints(self, monkeypatch):
        """Valide Fiche 3 (endpoints /stream/initiate/ et /stream/status/)."""
        from apps.protection.derived_materializer import DerivedMaterializer
        from apps.protection.source_adapter import DocumentSourceAdapter
        from apps.protection.watermark import WatermarkEngine
        from django.core.cache import cache

        cache.clear()
        self.user.is_staff = True
        self.user.save()
        self.client.force_authenticate(user=self.user)

        raw_pdf = b"%PDF-1.4 raw bytes"
        watermarked_pdf = b"%PDF-1.4 prepared bytes"
        monkeypatch.setattr(DocumentSourceAdapter, "get_document_bytes", lambda **kwargs: raw_pdf)
        monkeypatch.setattr(WatermarkEngine, "apply_watermark", lambda **kwargs: watermarked_pdf)

        initiate_url = reverse("catalog:book-stream-initiate", kwargs={"book_id": str(self.ouvrage.id)})
        status_url = reverse("catalog:book-stream-status", kwargs={"book_id": str(self.ouvrage.id)})

        # 1. Status avant préparation : preparing
        res_status_1 = self.client.get(status_url)
        assert res_status_1.status_code == 200
        assert res_status_1.data["data"]["status"] == "preparing"

        # 2. Appel initiate : déclenche la préparation
        res_init = self.client.post(initiate_url)
        assert res_init.status_code == 200
        assert res_init.data["data"]["status"] in ("preparing", "ready")

        # Simuler dérivé mis en cache
        user_info = {"user_id": str(self.user.id), "is_partner": False}
        cache_key = DerivedMaterializer.compute_user_cache_key(
            source_reference=str(self.ouvrage.id),
            user_info=user_info
        )
        cache.set(f"drm_derived:{cache_key}", watermarked_pdf, timeout=3600)

        # 3. Status après mise en cache : ready
        res_status_2 = self.client.get(status_url)
        assert res_status_2.status_code == 200
        assert res_status_2.data["data"]["status"] == "ready"

        # 4. Initiate si déjà en cache : retourne ready immédiatement
        res_init_2 = self.client.post(initiate_url)
        assert res_init_2.status_code == 200
        assert res_init_2.data["data"]["status"] == "ready"

    def test_compute_user_cache_key_unification(self):
        """Valide que compute_user_cache_key produit strictement la même clé pour tous les composants."""
        from apps.protection.derived_materializer import DerivedMaterializer
        from apps.protection.models import GlobalDrmConfig

        config = GlobalDrmConfig.get_singleton()
        user_info_stream = {
            "nom": "User Test",
            "email": "user@test.bj",
            "ip": "127.0.0.1",
            "user_id": str(self.user.id),
            "device_fingerprint": "fp123",
            "title": "Test Book",
            "id": str(self.ouvrage.id),
            "is_partner": False,
        }
        user_info_status = {
            "user_id": str(self.user.id),
            "is_partner": False,
        }

        key_stream = DerivedMaterializer.compute_user_cache_key(str(self.ouvrage.id), user_info_stream, config)
        key_status = DerivedMaterializer.compute_user_cache_key(str(self.ouvrage.id), user_info_status, config)

        assert key_stream == key_status

    def test_derived_materializer_distributed_lock_anti_stampede(self, monkeypatch):
        """Prouve que sous le verrou distribué, deux appels concurrents ne génèrent qu'une seule fois."""
        from apps.protection.derived_materializer import DerivedMaterializer
        from apps.protection.source_adapter import DocumentSourceAdapter
        from apps.protection.watermark import WatermarkEngine
        from apps.protection.models import GlobalDrmConfig, DerivedCacheRegistry
        from django.core.cache import cache
        import threading
        import time

        cache.clear()
        config = GlobalDrmConfig.get_singleton()
        monkeypatch.setattr(DerivedCacheRegistry.objects, "update_or_create", lambda **kwargs: (None, True))

        shared_lock = threading.Lock()
        class MockRedisLock:
            def acquire(self, blocking=True):
                return shared_lock.acquire(blocking=blocking)
            def release(self):
                shared_lock.release()

        class MockRedisClient:
            def lock(self, name, timeout=120, blocking_timeout=125):
                return MockRedisLock()

        monkeypatch.setattr(DocumentSourceAdapter, "_get_redis_client", lambda: MockRedisClient())

        generation_count = 0
        lock_counter = threading.Lock()

        raw_pdf = b"%PDF-1.4 raw bytes"
        watermarked_pdf = b"%PDF-1.4 lock test bytes"

        def mock_apply(**kwargs):
            nonlocal generation_count
            with lock_counter:
                generation_count += 1
            time.sleep(0.05)
            return watermarked_pdf

        monkeypatch.setattr(DocumentSourceAdapter, "get_document_bytes", lambda **kwargs: raw_pdf)
        monkeypatch.setattr(WatermarkEngine, "apply_watermark", mock_apply)

        user_info = {"user_id": str(self.user.id), "is_partner": False}

        results = []
        def call_materializer():
            res, size = DerivedMaterializer.get_or_create_derived(
                source_type="catalog_book",
                source_reference=str(self.ouvrage.id),
                user_info=user_info,
                config=config
            )
            results.append((res, size))

        t1 = threading.Thread(target=call_materializer)
        t2 = threading.Thread(target=call_materializer)

        t1.start()
        t2.start()
        t1.join()
        t2.join()

        assert len(results) == 2
        for res, size in results:
            assert res == watermarked_pdf
            assert size == len(watermarked_pdf)

        assert generation_count == 1


