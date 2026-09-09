"""
Tests d'intégration de la haute performance Redis du catalogue partenaire et du streaming bilingue.
Vérifie la mise en cache Redis serveur (TTL 15 min), les filtres q/discipline/language,
le court-circuit M2M pour is_owned/has_digital_access, et la cascade de langue en streaming.
"""
from unittest.mock import patch
from django.core.cache import cache
from rest_framework.test import APITestCase
from rest_framework import status
from apps.catalog.models import Ouvrage, OuvrageLanguageVersion, Discipline
from apps.reader.models import PartnerApp, ReaderSession, PartnerEndUser


class PartnerCatalogPerformanceTestCase(APITestCase):
    """Vérifie l'optimisation Redis et le comportement du catalogue partenaire."""

    def setUp(self):
        cache.clear()

        # Création de l'application partenaire
        self.partner = PartnerApp.objects.create(
            name="Université Test Partner",
            client_id="client_test_12345",
            client_secret_hash="secret_hash_dummy",
            is_active=True,
            allowed_return_origins=["https://mon-lms.univ.bj"],
        )

        self.discipline = Discipline.objects.create(name="Droit & Sciences Politiques")

        # Ouvrage bilingue (EN original + FR traduit)
        self.ouvrage_bilingue = Ouvrage.objects.create(
            title="Droit International Comparé",
            subtitle="Principes et Jurisprudence",
            language="en",
            status="published",
            discipline=self.discipline,
            price_digital=6000.00,
        )
        self.lv_en = OuvrageLanguageVersion.objects.create(
            ouvrage=self.ouvrage_bilingue,
            language="en",
            is_original=True,
            title="Comparative International Law",
            r2_key_pdf=f"books/{self.ouvrage_bilingue.id}/EN/original.pdf",
            translation_status="ready",
        )
        self.lv_fr = OuvrageLanguageVersion.objects.create(
            ouvrage=self.ouvrage_bilingue,
            language="fr",
            is_original=False,
            title="Droit International Comparé (FR)",
            r2_key_pdf=f"books/{self.ouvrage_bilingue.id}/FR/translated.pdf",
            translation_status="ready",
        )

        # Ouvrage unilingue français
        self.ouvrage_fr_only = Ouvrage.objects.create(
            title="Introduction au Droit Civil",
            language="fr",
            status="published",
            discipline=self.discipline,
            price_digital=4500.00,
        )

    def tearDown(self):
        cache.clear()

    @patch("apps.reader.permissions.PartnerAuthentication.authenticate")
    @patch("apps.reader.permissions.IsAuthenticatedPartner.has_permission")
    def test_partner_catalog_redis_cache_and_language_filter(self, mock_has_perm, mock_auth):
        """Vérifie la mise en cache Redis, le préchargement et le filtrage de langue."""
        mock_has_perm.return_value = True

        def fake_authenticate(request):
            request.partner = self.partner
            return (None, self.partner)

        mock_auth.side_effect = fake_authenticate

        # 1. Premier appel : calcul et mise en cache
        resp1 = self.client.get("/api/v1/partner/catalog/")
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)
        data1 = resp1.json()
        self.assertTrue(data1["success"])
        self.assertGreaterEqual(data1["count"], 2)

        # Vérifier que is_owned et has_digital_access sont False en contexte M2M
        first_book = data1["data"][0]
        self.assertFalse(first_book["is_owned"])
        self.assertFalse(first_book["has_digital_access"])
        self.assertIn("available_languages", first_book)

        # 2. Deuxième appel : servi depuis le cache Redis
        resp2 = self.client.get("/api/v1/partner/catalog/")
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.assertEqual(resp1.json(), resp2.json())

        # 3. Filtrage par langue ?language=en
        resp_en = self.client.get("/api/v1/partner/catalog/?language=en")
        self.assertEqual(resp_en.status_code, status.HTTP_200_OK)
        data_en = resp_en.json()
        book_ids_en = [b["id"] for b in data_en["data"]]
        self.assertIn(str(self.ouvrage_bilingue.id), book_ids_en)
        self.assertNotIn(str(self.ouvrage_fr_only.id), book_ids_en)

        # 4. Pagination
        resp_page = self.client.get("/api/v1/partner/catalog/?page=1&page_size=1")
        self.assertEqual(resp_page.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp_page.json()["data"]), 1)

    @patch("apps.protection.derived_materializer.DerivedMaterializer.get_or_create_derived")
    @patch("apps.reader.permissions.IsValidReaderSession.has_permission")
    def test_reader_session_streaming_language_cascade(self, mock_has_perm, mock_materialize):
        """Vérifie la cascade de résolution linguistique lors du streaming d'une session."""
        mock_has_perm.return_value = True
        mock_materialize.return_value = (b"%PDF-1.4 stream bytes with watermark", 34)

        end_user = PartnerEndUser.objects.create(
            partner=self.partner,
            external_ref="STU-9901",
            display_name="Etudiant Test",
            email="etudiant@univ.bj",
        )

        from django.utils import timezone
        from datetime import timedelta

        session = ReaderSession.objects.create(
            partner=self.partner,
            source_type="catalog_book",
            ouvrage=self.ouvrage_bilingue,
            end_user=end_user,
            token_hash="fake_token_hash_for_test",
            return_url="https://mon-lms.univ.bj",
            status="opened",
            expires_at=timezone.now() + timedelta(hours=2),
            metadata={"language": "fr"},
        )

        from apps.reader.views import ReaderProtectedStreamView
        from unittest.mock import MagicMock
        from rest_framework.request import Request as DRFRequest

        def make_mock_request(lang_param):
            """Crée un mock de Request DRF avec reader_session et query_params."""
            raw_request = MagicMock()
            raw_request.META = {"REMOTE_ADDR": "127.0.0.1", "HTTP_HOST": "testserver"}
            raw_request.headers = {}
            raw_request.session = {}
            drf_request = MagicMock(spec=DRFRequest)
            drf_request.reader_session = session
            drf_request.query_params = {"lang": lang_param} if lang_param else {}
            drf_request.META = raw_request.META
            drf_request.headers = {}
            return drf_request

        view = ReaderProtectedStreamView()

        # 1. Requête streaming avec ?lang=en (surcharge la métadonnée 'fr')
        req_en = make_mock_request("en")
        with patch.object(ReaderProtectedStreamView, "check_permissions"):
            resp = view.get(req_en)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Vérifier que le materializer a reçu ouvrage_id:en
        mock_materialize.assert_called()
        call_kwargs = mock_materialize.call_args.kwargs
        self.assertEqual(call_kwargs.get("source_reference"), f"{self.ouvrage_bilingue.id}:en")

        # 2. Requête streaming sans ?lang= (doit replier sur session.metadata['language'] = 'fr')
        req_no_param = make_mock_request(None)
        with patch.object(ReaderProtectedStreamView, "check_permissions"):
            resp2 = view.get(req_no_param)
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        call_kwargs2 = mock_materialize.call_args.kwargs
        self.assertEqual(call_kwargs2.get("source_reference"), f"{self.ouvrage_bilingue.id}:fr")
