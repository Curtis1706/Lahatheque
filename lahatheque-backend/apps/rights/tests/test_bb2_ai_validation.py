"""
Tests unitaires pour la Fiche BB2 :
Validation réelle d'une suggestion IA avec création des AuthorRight et RepartitionDroits.
"""
from datetime import date
from django.test import TestCase
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.catalog.models import Ouvrage, Discipline, BookAuthor
from apps.publishers_portal.models import Publisher
from apps.rights.models import AuthorRight, RepartitionDroits, ContratLegal, AIRoyaltySuggestion


class LegalAiSuggestionDecisionValidationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Juriste connecté
        self.legal_user = User.objects.create_user(
            username="juriste_test_bb2",
            email="juriste.bb2@laha.bj",
            role="legal_reviewer",
            first_name="Maître",
            last_name="Legal",
            password="StrongPassword123!"
        )
        self.client.force_authenticate(user=self.legal_user)

        # Utilisateurs Auteurs réels
        self.author_user1 = User.objects.create_user(
            username="koffi_mensah_bb2",
            email="koffi.mensah@laha.bj",
            role="author",
            first_name="Koffi",
            last_name="Mensah",
            password="StrongPassword123!"
        )
        self.author_user2 = User.objects.create_user(
            username="amina_diallo_bb2",
            email="amina.diallo@laha.bj",
            role="author",
            first_name="Amina",
            last_name="Diallo",
            password="StrongPassword123!"
        )

        # Modèles catalogue
        self.discipline = Discipline.objects.create(name="Droit des Affaires", code_dewey="346")
        self.publisher = Publisher.objects.create(
            name="Éditions Africaines LAHA",
            rccm_number="RB/COT/24-B-003",
            country="BJ",
            contact_email="editions.bb2@laha.bj"
        )
        self.ouvrage = Ouvrage.objects.create(
            title="Manuel OHADA de Droit des Sociétés",
            isbn="978-2-84299-999-9",
            publisher=self.publisher,
            discipline=self.discipline,
            publication_date=date(2026, 2, 1),
            format_type="pdf",
            price_digital=6000.00,
            status="published"
        )

        # BookAuthors attachés à l'ouvrage
        self.ba1 = BookAuthor.objects.create(
            first_name="Koffi",
            last_name="Mensah",
            email="koffi.mensah@laha.bj",
            user=self.author_user1
        )
        self.ba2 = BookAuthor.objects.create(
            first_name="Amina",
            last_name="Diallo",
            email="amina.diallo@laha.bj",
            user=self.author_user2
        )
        self.ouvrage.authors.add(self.ba1, self.ba2)

        # Contrat et Suggestion IA
        self.contrat = ContratLegal.objects.create(
            numero_contrat="CTR-BB2-2026",
            titre="Contrat d'édition co-auteurs",
            contracting_party="Koffi Mensah & Amina Diallo",
            ouvrage=self.ouvrage,
            status="active"
        )
        self.suggestion = AIRoyaltySuggestion.objects.create(
            contrat=self.contrat,
            ouvrage=self.ouvrage,
            beneficiaire_nom="Koffi Mensah",
            pourcentage_suggere=60.00,
            clause_extraite="Article 5 : Répartition des droits entre co-auteurs.",
            confiance_score=0.95,
            is_validated=False
        )

    def test_validation_rejects_sum_different_from_100(self):
        """Vérifie le rejet si la somme ne fait pas exactement 100%."""
        response = self.client.post(
            f"/api/v1/rights/legal/ai-suggestions/{self.suggestion.id}/decide/",
            data={
                "decision": "approve",
                "splits": [
                    {"author_name": "Koffi Mensah", "percentage": 60.0}
                ]
            },
            format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("La répartition doit sommer à exactement 100%", response.json()["error"])
        # Aucun AuthorRight ne doit être créé
        self.assertFalse(AuthorRight.objects.filter(ouvrage=self.ouvrage).exists())

    def test_validation_rejects_unmatched_author_and_rolls_back(self):
        """Vérifie le rejet si un nom ne correspond à aucun auteur de l'ouvrage, sans créer de droits partiels."""
        response = self.client.post(
            f"/api/v1/rights/legal/ai-suggestions/{self.suggestion.id}/decide/",
            data={
                "decision": "approve",
                "splits": [
                    {"author_name": "Koffi Mensah", "percentage": 50.0},
                    {"author_name": "Auteur Inconnu", "percentage": 50.0}
                ]
            },
            format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Auteur Inconnu", response.json()["error"])
        # Koffi Mensah ne doit PAS avoir été créé de manière partielle
        self.assertFalse(AuthorRight.objects.filter(ouvrage=self.ouvrage).exists())
        self.assertFalse(RepartitionDroits.objects.filter(ouvrage=self.ouvrage).exists())

    def test_validation_rejects_suggestion_without_ouvrage(self):
        """Vérifie le rejet si la suggestion n'a pas d'ouvrage associé."""
        sug_no_book = AIRoyaltySuggestion.objects.create(
            contrat=self.contrat,
            ouvrage=None,
            beneficiaire_nom="Koffi Mensah",
            pourcentage_suggere=100.00,
            clause_extraite="Clause sans livre",
            is_validated=False
        )
        response = self.client.post(
            f"/api/v1/rights/legal/ai-suggestions/{sug_no_book.id}/decide/",
            data={
                "decision": "approve",
                "splits": [{"author_name": "Koffi Mensah", "percentage": 100.0}]
            },
            format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("impossible de créer les droits", response.json()["error"])

    def test_validation_succeeds_and_creates_author_rights(self):
        """Vérifie la création effective des AuthorRight et de RepartitionDroits à 100%."""
        response = self.client.post(
            f"/api/v1/rights/legal/ai-suggestions/{self.suggestion.id}/decide/",
            data={
                "decision": "approve",
                "splits": [
                    {"author_name": "Koffi Mensah", "percentage": 60.0},
                    {"author_name": "Amina Diallo", "percentage": 40.0}
                ]
            },
            format="json"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(len(data["data"]["author_rights_created"]), 2)

        # Vérification en base de données pour AuthorRight
        ar1 = AuthorRight.objects.filter(ouvrage=self.ouvrage, user=self.author_user1).first()
        self.assertIsNotNone(ar1)
        self.assertEqual(float(ar1.pool_share_percent), 60.0)

        ar2 = AuthorRight.objects.filter(ouvrage=self.ouvrage, user=self.author_user2).first()
        self.assertIsNotNone(ar2)
        self.assertEqual(float(ar2.pool_share_percent), 40.0)

        # Vérification pour RepartitionDroits
        rd1 = RepartitionDroits.objects.filter(ouvrage=self.ouvrage, beneficiaire=self.author_user1).first()
        self.assertIsNotNone(rd1)
        self.assertEqual(float(rd1.pourcentage), 60.0)

        rd2 = RepartitionDroits.objects.filter(ouvrage=self.ouvrage, beneficiaire=self.author_user2).first()
        self.assertIsNotNone(rd2)
        self.assertEqual(float(rd2.pourcentage), 40.0)

        # Vérification du statut de la suggestion
        self.suggestion.refresh_from_db()
        self.assertTrue(self.suggestion.is_validated)
        self.assertEqual(self.suggestion.validated_by, self.legal_user)
