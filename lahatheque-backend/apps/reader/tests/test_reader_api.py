"""
Tests unitaires et d'intégration pour l'application Reader (API Lecteur Hébergé).
Valide la création de sessions multi-sources, la sécurité des tokens, les quiz,
l'anti-open-redirect et la protection S-04 (code d'accès court opaque dans l'URL).
"""

from datetime import timedelta
import json
from unittest.mock import patch
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from apps.catalog.models import Ouvrage
from apps.publishers_portal.models import Publisher
from apps.reader.models import PartnerApp, PartnerEndUser, ReaderSession, ResultatQuizSession, WebhookLog
from apps.reader.tokens import ReaderTokenService, ReaderTokenError


class ReaderAPITestCase(TestCase):
    """Suite de tests pour les endpoints et services de l'application Reader."""

    def setUp(self) -> None:
        self.client = APIClient()
        webhook_patcher = patch("apps.reader.views.dispatch_partner_webhook_sync")
        self.mock_webhook = webhook_patcher.start()
        self.addCleanup(webhook_patcher.stop)

        celery_patcher = patch("apps.protection.tasks.prepare_derived_document_task.delay")
        self.mock_celery = celery_patcher.start()
        self.addCleanup(celery_patcher.stop)

        # 1. Création d'un éditeur et d'un ouvrage pour le test de catalogue
        self.editeur = Publisher.objects.create(
            name="Éditions du Savoir",
            contact_email="contact@editions.bj"
        )
        self.ouvrage = Ouvrage.objects.create(
            isbn="978-2-84299-999-9",
            title="Manuel d'Intelligence Artificielle",
            publisher=self.editeur,
            page_count=48,
            publication_date="2026-01-01",
            status="published"
        )

        # 2. Création d'un partenaire avec identifiants client sécurisés et origines autorisées
        from apps.reader.auth_utils import generate_client_id, generate_client_secret, hash_secret
        self.client_id = generate_client_id()
        self.client_secret = generate_client_secret()
        self.partner = PartnerApp.objects.create(
            name="Université d'Abomey-Calavi",
            client_id=self.client_id,
            client_secret_hash=hash_secret(self.client_secret),
            client_secret_last4=self.client_secret[-4:],
            webhook_url="https://uac.bj/api/webhooks/reader",
            webhook_secret="uac_secret_key_998877",
            allowed_return_origins=["https://uac.bj", "https://cours.uac.bj"]
        )

    def test_create_session_catalog_book(self) -> None:
        """Test de création d'une session pour un livre du catalogue interne avec code court opaque (S-04)."""
        url = "/api/v1/reader/sessions/"
        payload = {
            "source_type": "catalog_book",
            "book_id": str(self.ouvrage.id),
            "external_user_ref": "etudiant-401",
            "external_user_name": "Amina Traoré",
            "external_user_email": "amina@uac.bj",
            "return_url": "https://uac.bj/cours/chapitre-1",
            "theme": {
                "brand_name": "Portail UAC",
                "primary_color": "#1B2A4E",
                "accent_color": "#D4A017"
            }
        }

        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_X_CLIENT_ID=self.client_id,
            HTTP_X_CLIENT_SECRET=self.client_secret
        )

        self.assertEqual(response.status_code, 201)
        res_data = response.json()
        self.assertTrue(res_data["success"])
        self.assertIn("session_id", res_data["data"])
        self.assertIn("reader_url", res_data["data"])
        self.assertIn("access_code", res_data["data"])

        # S-04 : L'URL de lecture doit contenir le code court et JAMAIS un JWT avec 2 points
        reader_url = res_data["data"]["reader_url"]
        self.assertIn("/read/rtk_", reader_url)
        url_token = reader_url.split("/read/")[-1].split("?")[0]
        self.assertNotEqual(url_token.count("."), 2, "L'URL ne doit pas exposer de token JWT avec signature.")

        self.assertEqual(res_data["data"]["book"]["title"], "Manuel d'Intelligence Artificielle")

    def test_s04_short_code_exchange_and_validation(self) -> None:
        """S-04 : Test d'échange du code court opaque contre la session et le token JWT."""
        # 1. Création de session
        create_resp = self.client.post(
            "/api/v1/reader/sessions/",
            data=json.dumps({
                "source_type": "catalog_book",
                "book_id": str(self.ouvrage.id),
                "external_user_ref": "etudiant-s04",
                "external_user_name": "Bakary Diop",
                "return_url": "https://uac.bj/cours"
            }),
            content_type="application/json",
            HTTP_X_CLIENT_ID=self.client_id,
            HTTP_X_CLIENT_SECRET=self.client_secret
        )
        self.assertEqual(create_resp.status_code, 201)
        access_code = create_resp.json()["data"]["access_code"]
        self.assertTrue(access_code.startswith("rtk_"))

        # 2. Validation de la session via le code court
        val_resp = self.client.post(
            "/api/v1/reader/sessions/validate-token/",
            data=json.dumps({"token": access_code}),
            content_type="application/json"
        )
        self.assertEqual(val_resp.status_code, 200)
        val_data = val_resp.json()["data"]
        self.assertEqual(val_data["book"]["title"], "Manuel d'Intelligence Artificielle")
        self.assertEqual(val_data["user"]["name"], "Bakary Diop")
        # Le session_token JWT doit être retourné pour les appels internes du lecteur
        self.assertIn("session_token", val_data)
        self.assertEqual(val_data["session_token"].count("."), 2)

    def test_anti_sharing_lock_with_short_code(self) -> None:
        """S-04 : Test du verrouillage de session au premier navigateur et rejet d'un second navigateur."""
        create_resp = self.client.post(
            "/api/v1/reader/sessions/",
            data=json.dumps({
                "source_type": "catalog_book",
                "book_id": str(self.ouvrage.id),
                "external_user_ref": "etudiant-sharing",
                "return_url": "https://uac.bj/cours"
            }),
            content_type="application/json",
            HTTP_X_CLIENT_ID=self.client_id,
            HTTP_X_CLIENT_SECRET=self.client_secret
        )
        access_code = create_resp.json()["data"]["access_code"]

        # Navigateur 1 : Première activation réussie
        client_browser_1 = APIClient()
        val_1 = client_browser_1.post(
            "/api/v1/reader/sessions/validate-token/",
            data=json.dumps({"token": access_code}),
            content_type="application/json",
            HTTP_USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0"
        )
        self.assertEqual(val_1.status_code, 200)
        device_token_1 = val_1.json()["data"]["device_binding_token"]
        self.assertTrue(device_token_1)

        # Navigateur 2 : Tentative d'accès avec le même code court sans le device token -> Refus 403
        client_browser_2 = APIClient()
        val_2 = client_browser_2.post(
            "/api/v1/reader/sessions/validate-token/",
            data=json.dumps({"token": access_code}),
            content_type="application/json",
            HTTP_USER_AGENT="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15"
        )
        self.assertEqual(val_2.status_code, 403)
        self.assertIn("verrouillée sur un autre navigateur", val_2.json()["error"])

        # Navigateur 1 : Rechargement (F5) avec son device token -> Autorisé 200
        val_1_reload = client_browser_1.post(
            "/api/v1/reader/sessions/validate-token/",
            data=json.dumps({"token": access_code, "device_binding_token": device_token_1}),
            content_type="application/json",
            HTTP_X_READER_DEVICE_TOKEN=device_token_1,
            HTTP_USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0"
        )
        self.assertEqual(val_1_reload.status_code, 200)

    def test_create_session_external_url_byod(self) -> None:
        """Test de création d'une session pour un document externe SaaS (BYOD)."""
        url = "/api/v1/reader/sessions/"
        payload = {
            "source_type": "external_url",
            "document_url": "https://uac.bj/uploads/cours-droit.pdf",
            "document_title": "Support de Cours — Droit International",
            "document_author": "Professeur Bio",
            "external_user_ref": "etudiant-502",
            "external_user_name": "Jean Dupont",
            "return_url": "https://cours.uac.bj/retour",
            "quiz": {
                "enabled": True,
                "title": "Quiz Droit International",
                "passing_score_percent": 75,
                "questions": [
                    {
                        "id": "q1",
                        "question": "Quelle est la source principale des traités ?",
                        "options": ["La coutume", "La convention de Vienne", "La jurisprudence"],
                        "correct_answer_index": 1,
                        "explanation": "La convention de Vienne de 1969 codifie le droit des traités."
                    }
                ]
            }
        }

        response = self.client.post(
            url,
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_X_CLIENT_ID=self.client_id,
            HTTP_X_CLIENT_SECRET=self.client_secret
        )

        self.assertEqual(response.status_code, 201)
        res_data = response.json()
        self.assertTrue(res_data["success"])
        self.assertEqual(res_data["data"]["book"]["title"], "Support de Cours — Droit International")

    def test_anti_open_redirect_rejection(self) -> None:
        """Test de validation des return_url : acceptation des origines autorisées et rejet des autres (S-03)."""
        url = "/api/v1/reader/sessions/"
        
        # 1. URL externe autorisée dans la liste blanche (https://uac.bj) acceptée
        payload_valid = {
            "source_type": "catalog_book",
            "book_id": str(self.ouvrage.id),
            "external_user_ref": "etudiant-wh",
            "return_url": "https://uac.bj/app/dashboard"
        }
        resp_valid = self.client.post(
            url,
            data=json.dumps(payload_valid),
            content_type="application/json",
            HTTP_X_CLIENT_ID=self.client_id,
            HTTP_X_CLIENT_SECRET=self.client_secret
        )
        self.assertEqual(resp_valid.status_code, 201)
        self.assertTrue(resp_valid.json()["success"])

        # 2. Domaine non autorisé rejeté (S-03)
        payload_unauthorized = {
            "source_type": "catalog_book",
            "book_id": str(self.ouvrage.id),
            "external_user_ref": "etudiant-attack",
            "return_url": "https://site-malveillant.com/phishing"
        }
        resp_unauth = self.client.post(
            url,
            data=json.dumps(payload_unauthorized),
            content_type="application/json",
            HTTP_X_CLIENT_ID=self.client_id,
            HTTP_X_CLIENT_SECRET=self.client_secret
        )
        self.assertEqual(resp_unauth.status_code, 400)
        self.assertFalse(resp_unauth.json()["success"])
        self.assertIn("return_url", str(resp_unauth.json()["error"]))

        # 3. Protocole non supporté (ex: javascript:) rejeté
        payload_invalid = {
            "source_type": "catalog_book",
            "book_id": str(self.ouvrage.id),
            "external_user_ref": "hacker-01",
            "return_url": "javascript:alert('xss')"
        }
        resp_invalid = self.client.post(
            url,
            data=json.dumps(payload_invalid),
            content_type="application/json",
            HTTP_X_CLIENT_ID=self.client_id,
            HTTP_X_CLIENT_SECRET=self.client_secret
        )
        self.assertEqual(resp_invalid.status_code, 400)
        self.assertFalse(resp_invalid.json()["success"])
        self.assertIn("return_url", str(resp_invalid.json()["error"]))

    def test_token_validation_and_quiz_flow(self) -> None:
        """Test du cycle complet : génération de token, validation par /read/[token], et soumission de quiz."""
        # 1. Création de session
        end_user = PartnerEndUser.objects.create(
            partner=self.partner,
            external_ref="etudiant-999",
            display_name="Koffi Mensah"
        )
        session = ReaderSession.objects.create(
            partner=self.partner,
            source_type="catalog_book",
            ouvrage=self.ouvrage,
            end_user=end_user,
            token_hash="dummy",
            return_url="https://uac.bj/dashboard",
            expires_at=timezone.now() + timedelta(hours=2),
            quiz_config={
                "enabled": True,
                "title": "Quiz IA",
                "passing_score_percent": 70,
                "questions": [
                    {
                        "id": "q1",
                        "question": "Question 1",
                        "options": ["A", "B"],
                        "correct_answer_index": 0,
                        "explanation": "Explication A"
                    }
                ]
            }
        )

        token_str, token_hash = ReaderTokenService.generate_token_for_session(session)
        session.token_hash = token_hash
        session.save()

        # 2. Validation du token
        val_resp = self.client.post(
            "/api/v1/reader/sessions/validate-token/",
            data=json.dumps({"token": token_str}),
            content_type="application/json"
        )
        self.assertEqual(val_resp.status_code, 200)
        val_data = val_resp.json()["data"]
        self.assertEqual(val_data["book"]["title"], "Manuel d'Intelligence Artificielle")
        self.assertEqual(val_data["user"]["name"], "Koffi Mensah")

        # 3. Soumission du Quiz
        quiz_resp = self.client.post(
            "/api/v1/reader/sessions/quiz-submit/",
            data=json.dumps({
                "token": token_str,
                "answers": [{"question_id": "q1", "selected_option_index": 0}]
            }),
            content_type="application/json"
        )
        self.assertEqual(quiz_resp.status_code, 200)
        quiz_data = quiz_resp.json()["data"]
        self.assertEqual(quiz_data["score_percent"], 100.0)
        self.assertTrue(quiz_data["is_passed"])

    def test_oauth2_token_flow_security(self) -> None:
        """Test de sécurité OAuth2 : validation stricte du secret et rejet des identifiants invalides."""
        # 1. Requête valide avec bons client_id et client_secret
        resp_valid = self.client.post(
            "/api/v1/oauth2/token/",
            data=json.dumps({
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret
            }),
            content_type="application/json"
        )
        self.assertEqual(resp_valid.status_code, 200)
        data_valid = resp_valid.json()
        self.assertIn("access_token", data_valid)
        self.assertEqual(data_valid["token_type"], "Bearer")

        # 2. Requête avec secret erroné -> Rejet 401
        resp_bad_secret = self.client.post(
            "/api/v1/oauth2/token/",
            data=json.dumps({
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": "wrong_secret_attack"
            }),
            content_type="application/json"
        )
        self.assertEqual(resp_bad_secret.status_code, 401)
        self.assertEqual(resp_bad_secret.json()["error"], "invalid_client")

        # 3. Requête avec client_id inexistant -> Rejet 401
        resp_bad_client = self.client.post(
            "/api/v1/oauth2/token/",
            data=json.dumps({
                "grant_type": "client_credentials",
                "client_id": "laha_client_unknown_inconnu",
                "client_secret": "any_secret"
            }),
            content_type="application/json"
        )
        self.assertEqual(resp_bad_client.status_code, 401)
        self.assertEqual(resp_bad_client.json()["error"], "invalid_client")

    def test_fiche_ad1_and_ad2_revocation_and_signing_key(self) -> None:
        """AD1 & AD2: Émission avec jti, clé dédiée et révocation effective."""
        import jwt
        from django.conf import settings
        from apps.accounts.oauth2.models import RevokedPartnerToken

        # 1. Émission du jeton
        resp = self.client.post(
            "/api/v1/oauth2/token/",
            data=json.dumps({
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
            }),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        token = resp.json()["access_token"]

        # 2. Décodage avec la clé dédiée OAUTH2_PARTNER_JWT_SIGNING_KEY
        signing_key = getattr(settings, "OAUTH2_PARTNER_JWT_SIGNING_KEY", settings.SECRET_KEY)
        payload = jwt.decode(token, signing_key, algorithms=["HS256"])
        self.assertIn("jti", payload)
        self.assertEqual(payload["partner_id"], str(self.partner.id))

        # 3. Requête valide avant révocation
        cat_resp = self.client.get(
            "/api/v1/partner/catalog/",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertEqual(cat_resp.status_code, 200)

        # 4. Révocation du token
        rev_resp = self.client.post(
            "/api/v1/oauth2/token/revoke/",
            data=json.dumps({"token": token}),
            content_type="application/json",
        )
        self.assertEqual(rev_resp.status_code, 200)
        self.assertEqual(rev_resp.json(), {"status": "revoked"})
        self.assertTrue(RevokedPartnerToken.objects.filter(jti=payload["jti"]).exists())

        # 5. Échec d'authentification après révocation
        cat_resp_after = self.client.get(
            "/api/v1/partner/catalog/",
            HTTP_AUTHORIZATION=f"Bearer {token}"
        )
        self.assertIn(cat_resp_after.status_code, (401, 403))

    def test_fiche_ad3_partner_catalog_endpoints(self) -> None:
        """AD3: Consultation et recherche catalogue via /api/v1/partner/catalog/."""
        resp = self.client.get(
            "/api/v1/partner/catalog/",
            HTTP_X_CLIENT_ID=self.client_id,
            HTTP_X_CLIENT_SECRET=self.client_secret,
        )
        self.assertEqual(resp.status_code, 200)
        res_data = resp.json()
        self.assertTrue(res_data["success"])
        self.assertGreaterEqual(len(res_data["data"]), 1)

        # Détail
        detail_resp = self.client.get(
            f"/api/v1/partner/catalog/{self.ouvrage.id}/",
            HTTP_X_CLIENT_ID=self.client_id,
            HTTP_X_CLIENT_SECRET=self.client_secret,
        )
        self.assertEqual(detail_resp.status_code, 200)
        self.assertEqual(detail_resp.json()["data"]["title"], "Manuel d'Intelligence Artificielle")

    def test_fiche_ad4_partner_bouquets_endpoints(self) -> None:
        """AD4: Consultation des bouquets et vérification de licence."""
        from apps.partners.models import Institution, BouquetOffering, UniversityBouquetSubscription

        institution = Institution.objects.create(
            name="Université d'Abomey-Calavi",
            code="UAC-TEST",
            country="BJ",
            city="Abomey-Calavi",
        )
        self.partner.linked_institution = institution
        self.partner.save()

        offering = BouquetOffering.objects.create(
            title="Bouquet Juridique & Sciences",
            bouquet_type="custom",
            annual_price=250000,
            currency="XOF",
            is_active=True,
        )
        offering.custom_books.add(self.ouvrage)

        # Liste des bouquets
        resp = self.client.get(
            "/api/v1/partner/bouquets/",
            HTTP_X_CLIENT_ID=self.client_id,
            HTTP_X_CLIENT_SECRET=self.client_secret,
        )
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()["success"])

        # Check access avant souscription
        check_resp = self.client.get(
            f"/api/v1/partner/bouquets/{offering.id}/check-access/?book_id={self.ouvrage.id}",
            HTTP_X_CLIENT_ID=self.client_id,
            HTTP_X_CLIENT_SECRET=self.client_secret,
        )
        self.assertEqual(check_resp.status_code, 200)
        self.assertFalse(check_resp.json()["data"]["has_access"])

        # Souscription active
        today = timezone.now().date()
        UniversityBouquetSubscription.objects.create(
            institution=institution,
            offering_id=offering.id,
            status="active",
            start_date=today,
            end_date=today + timedelta(days=365),
        )

        # Check access avec souscription
        check_resp_sub = self.client.get(
            f"/api/v1/partner/bouquets/{offering.id}/check-access/?book_id={self.ouvrage.id}",
            HTTP_X_CLIENT_ID=self.client_id,
            HTTP_X_CLIENT_SECRET=self.client_secret,
        )
        self.assertEqual(check_resp_sub.status_code, 200)
        self.assertTrue(check_resp_sub.json()["data"]["has_access"])

    def test_fiche_ad5_partner_usage_stats(self) -> None:
        """AD5: Consultation des statistiques d'usage."""
        from apps.protection.models import TraceAcces

        TraceAcces.objects.create(
            ouvrage=self.ouvrage,
            partner_id=str(self.partner.id),
            document_title=self.ouvrage.title,
            ip_address="127.0.0.1",
            access_type="read_full",
        )

        resp = self.client.get(
            "/api/v1/partner/stats/usage/",
            HTTP_X_CLIENT_ID=self.client_id,
            HTTP_X_CLIENT_SECRET=self.client_secret,
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()["data"]
        self.assertGreaterEqual(data["total_consultations"], 1)
        self.assertGreaterEqual(len(data["top_books"]), 1)
