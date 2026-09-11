"""
Tests unitaires et d'intégration pour l'Atelier Forensique & Détection de Fuites.
Valide l'extraction de filigranes invisibles sur PDF, le décodage d'images,
la corrélation en base, les actions directes de mitigation et les restrictions d'accès admin.
"""

import json
import hashlib
from io import BytesIO
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

import fitz
from PIL import Image

from apps.accounts.models import User
from apps.protection.models import ForensicInvestigation, TraceAcces, GlobalDrmConfig
from apps.protection.watermark import WatermarkEngine
from apps.protection.forensic_service import ForensicService


class ForensicLeakDetectionTestCase(TestCase):
    """
    Suite de tests validant l'ensemble du pipeline forensique.
    """

    def setUp(self):
        # 1. Création des utilisateurs de test
        self.admin_user = User.objects.create_superuser(
            username="admin_forensic",
            email="admin_forensic@lahatheque.bj",
            password="AdminSecurePassword123!",
            role="admin"
        )
        self.student_user = User.objects.create_user(
            username="koffi_mensah",
            email="mensah.koffi@univ-abomey.bj",
            password="StudentPassword123!",
            role="student",
            first_name="Koffi",
            last_name="Mensah",
            session_version=1
        )
        self.other_student = User.objects.create_user(
            username="autre_lecteur",
            email="autre@univ.bj",
            password="Password123!",
            role="student"
        )

        # 2. Création d'une trace d'accès
        self.trace = TraceAcces.objects.create(
            user=self.student_user,
            ip_address="197.234.221.14",
            country="BJ",
            device_fingerprint="Mozilla/5.0 Chrome/124.0.0.0",
            access_type="read_chunk",
            page_number=42
        )

        self.client = APIClient()

    def _create_synthetic_marked_pdf(self) -> bytes:
        """Génère un PDF valide en mémoire contenant le tatouage stéganographique LAHAThèque."""
        doc = fitz.open()
        page = doc.new_page(width=595, height=842)
        page.insert_text(fitz.Point(50, 100), "Texte authentique d'un manuel academique LAHATheque.")
        raw_pdf = doc.tobytes()
        doc.close()

        # Application du filigrane LAHAThèque via WatermarkEngine
        marked_pdf = WatermarkEngine.apply_watermark(
            raw_pdf,
            user_info={
                "id": str(self.student_user.id),
                "user_id": str(self.student_user.id),
                "email": self.student_user.email,
                "ip": "197.234.221.14",
                "nom": "Koffi Mensah",
                "device_fingerprint": "Mozilla/5.0 Chrome/124.0.0.0",
                "title": "Droit des Affaires OHADA"
            }
        )
        return marked_pdf

    def test_inspect_pdf_watermark_successful(self):
        """
        Vérifie que inspect_pdf_watermark extrait correctement l'e-mail, l'IP,
        l'identifiant et valide la signature cryptographique SHA-256.
        """
        pdf_bytes = self._create_synthetic_marked_pdf()
        result = ForensicService.inspect_pdf_watermark(pdf_bytes)

        self.assertTrue(result.get("detected"))
        self.assertEqual(result.get("email"), self.student_user.email)
        self.assertEqual(result.get("ip_address"), "197.234.221.14")
        self.assertEqual(result.get("user_id"), str(self.student_user.id))
        self.assertTrue(result.get("signature_valid"))

    def test_analyze_evidence_pdf_correlation(self):
        """
        Vérifie l'analyse de bout en bout d'un PDF avec corrélation en base de données.
        """
        pdf_bytes = self._create_synthetic_marked_pdf()
        result = ForensicService.analyze_evidence(
            file_bytes=pdf_bytes,
            file_name="fuite_telegram_ohada.pdf",
            admin_user=self.admin_user,
            notes="Fuite signalée sur groupe public"
        )

        self.assertEqual(result["status"], "identified")
        self.assertEqual(result["certainty_score"], 100)
        self.assertIsNotNone(result["suspect_profile"])
        self.assertEqual(result["suspect_profile"]["email"], self.student_user.email)
        self.assertTrue(result["available_actions"]["can_suspend"])

        # Vérifie la persistance dans ForensicInvestigation
        investigation = ForensicInvestigation.objects.get(id=result["investigation_id"])
        self.assertEqual(investigation.suspect_user, self.student_user)
        self.assertEqual(investigation.status, "identified")

    def test_mitigate_infraction_suspend_and_revoke(self):
        """
        Vérifie que l'action de sanction suspend le lecteur et incrémente sa version de session.
        """
        pdf_bytes = self._create_synthetic_marked_pdf()
        analysis = ForensicService.analyze_evidence(
            file_bytes=pdf_bytes,
            file_name="leak.pdf",
            admin_user=self.admin_user
        )
        inv_id = analysis["investigation_id"]

        initial_session_version = self.student_user.session_version

        mitigation = ForensicService.mitigate_infraction(
            investigation_id=inv_id,
            action="suspend_user",
            reason="Violation constatée des droits d'auteur",
            admin_user=self.admin_user
        )

        self.assertEqual(mitigation["action_executed"], "suspend_user")
        self.student_user.refresh_from_db()
        self.assertTrue(self.student_user.is_suspended)
        self.assertIn("Violation constatée", self.student_user.suspension_reason)
        self.assertGreater(self.student_user.session_version, initial_session_version)

    def test_generate_certified_report_pdf(self):
        """
        Vérifie que la génération du procès-verbal PDF produit un document binaire valide.
        """
        pdf_bytes = self._create_synthetic_marked_pdf()
        analysis = ForensicService.analyze_evidence(
            file_bytes=pdf_bytes,
            file_name="fuite_test.pdf",
            admin_user=self.admin_user
        )
        inv_id = analysis["investigation_id"]

        report_pdf = ForensicService.generate_certified_report(inv_id)
        self.assertTrue(report_pdf.startswith(b"%PDF"))
        self.assertGreater(len(report_pdf), 1000)

    def test_forensic_analyze_endpoint_security_admin_only(self):
        """
        Vérifie que l'endpoint /api/v1/protection/forensic/analyze/ rejette tout utilisateur non-admin (403 Forbidden).
        """
        pdf_bytes = self._create_synthetic_marked_pdf()
        upload_data = BytesIO(pdf_bytes)
        upload_data.name = "test_leak.pdf"

        # 1. Requête anonyme -> 401 Unauthorized
        response_anon = self.client.post("/api/v1/protection/forensic/analyze/", {"file": upload_data}, format="multipart")
        self.assertEqual(response_anon.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Requête lecteur étudiant -> 403 Forbidden
        self.client.force_authenticate(user=self.student_user)
        upload_data.seek(0)
        response_student = self.client.post("/api/v1/protection/forensic/analyze/", {"file": upload_data}, format="multipart")
        self.assertEqual(response_student.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Requête administrateur -> 200 OK
        self.client.force_authenticate(user=self.admin_user)
        upload_data.seek(0)
        response_admin = self.client.post("/api/v1/protection/forensic/analyze/", {"file": upload_data}, format="multipart")
        self.assertEqual(response_admin.status_code, status.HTTP_200_OK)
        data = response_admin.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["data"]["status"], "identified")
