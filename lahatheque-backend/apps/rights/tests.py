"""Tests unitaires pour les Fiches Juriste AE1, AE2 et AE3."""
import uuid
from datetime import timedelta
from unittest.mock import patch
from smtplib import SMTPException

from django.test import TestCase
from django.core import mail
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.reporting.models import RelanceAutomatiqueLog, ConfigurationPlateformeGlobale
from apps.reporting.tasks import (
    task_scan_and_send_unpaid_reminders,
    task_scan_and_send_deposit_reminders,
    task_scan_and_send_subscription_expiry_reminders,
)
from apps.rights.models import (
    DebtReminderConfig,
    ContratLegal,
    AIRoyaltySuggestion,
)
from apps.commerce.models import Order, Subscription, SubscriptionPlan
from apps.publishers_portal.models import Publisher, PublisherBookDeposit, PublisherDepositStatus

User = get_user_model()


class FicheAE1RemindersRealEmailTests(TestCase):
    """Vérifie l'envoi réel par email et les statuts ENVOYE/ECHEC honnêtes (Fiche AE1)."""

    def setUp(self):
        self.config = ConfigurationPlateformeGlobale.objects.create(
            delai_relance_impayes_jours=3,
            delai_relance_depots_jours=2,
            delai_relance_abonnements_jours=7,
        )
        self.user = User.objects.create_user(
            email="client.debiteur@example.com",
            first_name="Jean",
            last_name="Valjean",
            password="securePassword123"
        )
        self.publisher_user = User.objects.create_user(
            email="editeur.contact@example.com",
            first_name="Editeur",
            last_name="Pro",
            password="securePassword123"
        )
        self.publisher = Publisher.objects.create(
            user=self.publisher_user,
            name="Éditions du Soleil",
            contact_email="editeur.contact@example.com"
        )

    def test_unpaid_reminder_success(self):
        """Si l'email part sans encombre, le log est ENVOYE et le mail est dans outbox."""
        old_date = timezone.now() - timedelta(days=5)
        order = Order.objects.create(
            user=self.user,
            total_amount=12500,
            payment_status='pending',
        )
        Order.objects.filter(id=order.id).update(created_at=old_date)

        results = task_scan_and_send_unpaid_reminders()
        self.assertEqual(results["sent"], 1)
        self.assertEqual(results["errors"], 0)

        # Vérifie que l'email est bien parti via le backend django outbox
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("12500", mail.outbox[0].body)

        # Vérifie le log en base
        log_entry = RelanceAutomatiqueLog.objects.filter(reference_id=str(order.id)).first()
        self.assertIsNotNone(log_entry)
        self.assertEqual(log_entry.statut, RelanceAutomatiqueLog.StatutRelance.ENVOYE)

    def test_unpaid_reminder_failure(self):
        """En cas d'échec SMTP, le statut est ECHEC et l'erreur est consignée."""
        old_date = timezone.now() - timedelta(days=5)
        order = Order.objects.create(
            user=self.user,
            total_amount=15000,
            payment_status='pending',
        )
        Order.objects.filter(id=order.id).update(created_at=old_date)

        with patch("django.core.mail.send_mail", side_effect=SMTPException("Serveur SMTP injoignable")):
            results = task_scan_and_send_unpaid_reminders()

        self.assertEqual(results["sent"], 0)
        self.assertEqual(results["errors"], 1)

        log_entry = RelanceAutomatiqueLog.objects.filter(reference_id=str(order.id)).first()
        self.assertIsNotNone(log_entry)
        self.assertEqual(log_entry.statut, RelanceAutomatiqueLog.StatutRelance.ECHEC)
        self.assertIn("[ÉCHEC:", log_entry.message)
        self.assertIn("Serveur SMTP injoignable", log_entry.message)

    def test_deposit_reminder_success_and_failure(self):
        """Test envoi réel et gestion d'échec pour les relances de dépôts."""
        deposit = PublisherBookDeposit.objects.create(
            publisher=self.publisher,
            title="Manuel de Droit Privé",
            isbn_digital="978-0-12345-678-9",
            status=PublisherDepositStatus.PENDING,
        )
        PublisherBookDeposit.objects.filter(id=deposit.id).update(created_at=timezone.now() - timedelta(days=4))

        # 1. Échec
        with patch("django.core.mail.send_mail", side_effect=Exception("Connexion refusée")):
            res_fail = task_scan_and_send_deposit_reminders()
        self.assertEqual(res_fail["errors"], 1)
        log_fail = RelanceAutomatiqueLog.objects.filter(reference_id=str(deposit.id)).first()
        self.assertEqual(log_fail.statut, RelanceAutomatiqueLog.StatutRelance.ECHEC)
        log_fail.delete()

        # 2. Succès
        res_succ = task_scan_and_send_deposit_reminders()
        self.assertEqual(res_succ["sent"], 1)
        log_succ = RelanceAutomatiqueLog.objects.filter(reference_id=str(deposit.id)).first()
        self.assertEqual(log_succ.statut, RelanceAutomatiqueLog.StatutRelance.ENVOYE)

    def test_subscription_expiry_reminder(self):
        """Test envoi réel des relances d'expiration d'abonnement."""
        plan = SubscriptionPlan.objects.create(
            name="Pass Étudiant Annuel",
            slug="pass-etudiant-annuel",
            price=25000,
            duration_days=365
        )
        sub = Subscription.objects.create(
            user=self.user,
            plan=plan,
            is_active=True,
            expires_at=timezone.now() + timedelta(days=3)
        )

        res = task_scan_and_send_subscription_expiry_reminders()
        self.assertEqual(res["sent"], 1)
        log = RelanceAutomatiqueLog.objects.filter(reference_id=str(sub.id)).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.statut, RelanceAutomatiqueLog.StatutRelance.ENVOYE)


class FicheAE2AISuggestionsTests(TestCase):
    """Vérifie la génération réelle et le format sans taux fabriqués (Fiche AE2)."""

    def setUp(self):
        self.client = APIClient()
        self.legal_user = User.objects.create_user(
            email="juriste@lahatheque.com",
            role="legal_reviewer",
            first_name="Maître",
            last_name="Diallo",
            password="legalPassword123"
        )
        self.client.force_authenticate(user=self.legal_user)

    def test_ai_suggestions_list_clean_rates(self):
        """Vérifie que LegalAiSuggestionsListView ne retourne que suggested_rate sans les taux fantômes."""
        contrat = ContratLegal.objects.create(
            numero_contrat="CTR-TEST-001",
            titre="Traité de Sociologie Rurale",
            contracting_party="Pr. Kossi",
        )
        suggestion = AIRoyaltySuggestion.objects.create(
            contrat=contrat,
            beneficiaire_nom="Pr. Kossi",
            pourcentage_suggere=65.0,
            clause_extraite="Le droit d'auteur accordé au signataire est fixé à 65% des redevances.",
            confiance_score=0.85,
        )

        response = self.client.get("/api/v1/rights/legal/ai-suggestions/")
        self.assertEqual(response.status_code, 200)
        data = response.json().get("data", [])
        self.assertEqual(len(data), 1)

        item = data[0]
        self.assertEqual(item["suggested_rate"], 65.0)
        self.assertNotIn("suggested_paper_rate", item)
        self.assertNotIn("suggested_digital_rate", item)
        self.assertNotIn("suggested_audio_tts_rate", item)
        self.assertEqual(item["confidence_score"], 0.85)

    def test_contract_upload_generates_ai_suggestion(self):
        """Vérifie que l'enregistrement d'un contrat génère une suggestion IA réelle."""
        payload = {
            "title": "Manuel de Botanique Tropicale",
            "contracting_party": "Dr. Dossou",
            "type": "edition_auteur",
            "extracted_text": "Article 4: L'auteur perçoit une quote-part de 60% sur l'ensemble des ventes.",
        }
        response = self.client.post("/api/v1/rights/legal/contracts/", data=payload, format="json")
        self.assertEqual(response.status_code, 201)

        # Vérifie qu'une AIRoyaltySuggestion a été créée pour ce contrat
        contrat_id = response.json()["data"]["id"]
        sug = AIRoyaltySuggestion.objects.filter(contrat_id=contrat_id).first()
        self.assertIsNotNone(sug)
        self.assertEqual(float(sug.pourcentage_suggere), 60.0)
        self.assertEqual(float(sug.confiance_score), 0.75)


class FicheAE3DebtReminderConfigTests(TestCase):
    """Vérifie que reminder_frequency_days est configurable (Fiche AE3)."""

    def setUp(self):
        self.client = APIClient()
        self.legal_user = User.objects.create_user(
            email="juriste2@lahatheque.com",
            role="legal_reviewer",
            first_name="Me",
            last_name="Law",
            password="legalPassword123"
        )
        self.client.force_authenticate(user=self.legal_user)

    def test_debt_reminder_config_get_and_post(self):
        """Vérifie la lecture et la mise à jour de frequency_days."""
        # 1. GET - doit retourner la valeur initiale par défaut (5)
        res_get = self.client.get("/api/v1/rights/legal/relances/config/")
        self.assertEqual(res_get.status_code, 200)
        self.assertEqual(res_get.json()["data"]["frequency_days"], 5)

        # 2. POST - mise à jour avec frequency_days = 10
        payload = {
            "auto_remind_enabled": True,
            "first_reminder_days": 7,
            "min_amount_threshold": 6000,
            "max_reminders_count": 4,
            "frequency_days": 10,
        }
        res_post = self.client.post("/api/v1/rights/legal/relances/config/", data=payload, format="json")
        self.assertEqual(res_post.status_code, 200)
        self.assertEqual(res_post.json()["data"]["frequency_days"], 10)

        # 3. Vérifie en base de données
        config = DebtReminderConfig.get_or_create_singleton()
        self.assertEqual(config.reminder_frequency_days, 10)
