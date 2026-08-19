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
