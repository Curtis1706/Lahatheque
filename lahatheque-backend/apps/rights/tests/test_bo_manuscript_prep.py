import uuid
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from apps.catalog.models import Ouvrage, Discipline, BookAuthor
from apps.rights.models import AuthorManuscriptSubmission

class ManuscriptPrepTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.author_user = User.objects.create_user(
            username="author_bo",
            email="auteur.bo@example.com",
            role="author",
            first_name="Bio",
            last_name="Guerra",
            password="securePassword123"
        )

        self.chief_layout = User.objects.create_user(
            username="chief_bo",
            email="chief.bo@example.com",
            role="chief_layout",
            first_name="Dr.",
            last_name="Dossou",
            password="securePassword123"
        )

        self.admin_user = User.objects.create_user(
            username="admin_bo",
            email="admin.bo@example.com",
            role="admin",
            first_name="Admin",
            last_name="Principal",
            password="securePassword123"
        )

        self.discipline = Discipline.objects.create(
            name="Droit Public",
            code_dewey="342",
            description="Sciences juridiques et administratives"
        )

        self.sub_ready = AuthorManuscriptSubmission.objects.create(
            author=self.author_user,
            title="Traité de Droit Administratif Ouest-Africain",
            version_type="finale",
            suggested_summary="Étude doctrinale sur le contentieux administratif en zone OHADA.",
            suggested_language="Français",
            status="catalog_preparation",
            editorial_note="Accepté lors de l'étude éditoriale."
        )

        self.sub_study_pending = AuthorManuscriptSubmission.objects.create(
            author=self.author_user,
            title="Manuel d'Économie Politique",
            version_type="brouillon",
            status="study_pending"
        )

    def test_pending_catalog_prep_list_chief_layout(self):
        """Le Chef Maquettiste accède uniquement aux manuscrits au statut catalog_preparation (BO1)."""
        self.client.force_authenticate(user=self.chief_layout)
        url = reverse('rights:pending-manuscript-submissions')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json().get("data", [])
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["id"], str(self.sub_ready.id))
        self.assertEqual(data[0]["title"], "Traité de Droit Administratif Ouest-Africain")
        self.assertEqual(data[0]["author_name"], "Bio Guerra")

    def test_pending_catalog_prep_forbidden_for_author(self):
        """Un simple auteur ne peut pas accéder à l'endpoint de préparation catalogue."""
        self.client.force_authenticate(user=self.author_user)
        url = reverse('rights:pending-manuscript-submissions')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_process_manuscript_submission_creates_ouvrage(self):
        """La conversion crée un Ouvrage en pending_legal_approval et passe le manuscrit à accepted (BO2)."""
        self.client.force_authenticate(user=self.chief_layout)

        payload = {
            "title": "Traité de Droit Administratif Ouest-Africain (Édition Définitive)",
            "discipline_id": self.discipline.id,
            "price_digital": 6500.00,
            "price_paper": 9500.00,
            "is_paper_available": True,
            "summary": "Résumé enrichi pour la notice bibliographique.",
            "language": "Français",
        }

        url = reverse('rights:process-manuscript-submission', kwargs={'id': str(self.sub_ready.id)})
        response = self.client.post(url, data=payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.json()["success"])
        ouvrage_id = response.json()["data"]["ouvrage_id"]

        # Vérifier l'ouvrage créé
        ouvrage = Ouvrage.objects.get(id=ouvrage_id)
        self.assertEqual(ouvrage.title, "Traité de Droit Administratif Ouest-Africain (Édition Définitive)")
        self.assertEqual(ouvrage.status, "pending_legal_approval")
        self.assertEqual(ouvrage.discipline, self.discipline)
        self.assertEqual(float(ouvrage.price_digital), 6500.00)
        self.assertEqual(float(ouvrage.price_paper), 9500.00)
        self.assertTrue(ouvrage.is_paper_available)
        self.assertEqual(ouvrage.created_by, self.chief_layout)

        # Vérifier que l'auteur est bien associé
        self.assertEqual(ouvrage.authors.count(), 1)
        author_item = ouvrage.authors.first()
        self.assertEqual(author_item.first_name, "Bio")
        self.assertEqual(author_item.last_name, "Guerra")
        self.assertEqual(author_item.user, self.author_user)

        # Vérifier le statut du manuscrit
        sub_updated = AuthorManuscriptSubmission.objects.get(id=self.sub_ready.id)
        self.assertEqual(sub_updated.status, "accepted")
