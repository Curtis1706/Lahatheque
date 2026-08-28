"""
Tests unitaires et d'intégration pour l'application Reader (API Lecteur Hébergé).
Valide la création de sessions multi-sources, la sécurité des tokens, les quiz et l'anti-open-redirect.
"""

from datetime import timedelta
import json
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from apps.catalog.models import Ouvrage
from apps.publishers_portal.models import Publisher
from .models import PartnerApp, PartnerEndUser, ReaderSession, ResultatQuizSession, WebhookLog
from .tokens import ReaderTokenService, ReaderTokenError


class ReaderAPITestCase(TestCase):
    """Suite de tests pour les endpoints et services de l'application Reader."""

    def setUp(self) -> None:
        self.client = APIClient()

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
        from .auth_utils import generate_client_id, generate_client_secret, hash_secret
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
        """Test de création d'une session pour un livre du catalogue interne."""
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
        self.assertEqual(res_data["data"]["book"]["title"], "Manuel d'Intelligence Artificielle")

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
        """Test de validation des return_url : acceptation de toutes les origines HTTP/HTTPS et rejet des protocoles invalides."""
        url = "/api/v1/reader/sessions/"
        
        # 1. URL externe valide acceptée (whitelist universelle)
        payload_valid = {
            "source_type": "catalog_book",
            "book_id": str(self.ouvrage.id),
            "external_user_ref": "etudiant-wh",
            "return_url": "https://any-external-domain.com/app/dashboard"
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

        # 2. Protocole non supporté (ex: javascript:) rejeté
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
