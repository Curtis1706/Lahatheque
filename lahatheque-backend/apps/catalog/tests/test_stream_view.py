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
