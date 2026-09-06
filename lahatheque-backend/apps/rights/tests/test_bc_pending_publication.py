from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from apps.catalog.models import Ouvrage, Discipline
from apps.rights.models import ContratLegal

class PendingPublicationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.chief_editor = User.objects.create_user(
            username='chief_layout',
            email='chief@test.com',
            password='password123',
            role='chief_layout',
            is_active=True
        )
        self.maquettiste = User.objects.create_user(
            username='maquettiste',
            email='maquettiste@test.com',
            password='password123',
            role='layout_artist',
            is_active=True
        )
        self.juriste = User.objects.create_user(
            username='juriste',
            email='juriste@test.com',
            password='password123',
            role='legal_reviewer',
            is_active=True
        )
        self.discipline = Discipline.objects.create(name='Sciences')
        self.ouvrage = Ouvrage.objects.create(
            title='Ouvrage Test BC',
            discipline=self.discipline,
            status='in_review',
            created_by=self.maquettiste
        )

    def test_validate_deposit_transitions_to_pending_legal_approval(self):
        self.client.force_authenticate(user=self.chief_editor)
        url = reverse('catalog:deposits-validate-deposit', kwargs={'pk': self.ouvrage.id})
        response = self.client.post(url, {'comments': 'Bon à tirer'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.ouvrage.refresh_from_db()
        self.assertEqual(self.ouvrage.status, 'pending_legal_approval')

    def test_legal_pending_publication_list_and_publish_flow(self):
        # 1. Set to pending_legal_approval
        self.ouvrage.status = 'pending_legal_approval'
        self.ouvrage.save()

        # 2. As Juriste, check list
        self.client.force_authenticate(user=self.juriste)
        list_url = reverse('rights:legal-pending-publication-list')
        response = self.client.get(list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()['data']
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], str(self.ouvrage.id))
        self.assertFalse(data[0]['has_active_contract'])

        # 3. Try to publish without contract -> 400
        publish_url = reverse('rights:legal-publish-ouvrage', kwargs={'id': str(self.ouvrage.id)})
        pub_response = self.client.post(publish_url)
        self.assertEqual(pub_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(pub_response.json()['success'])

        # 4. Attach active contract
        ContratLegal.objects.create(
            titre='Contrat BC',
            numero_contrat='CTR-BC-001',
            ouvrage=self.ouvrage,
            status='active'
        )

        # Re-check list
        response2 = self.client.get(list_url)
        data2 = response2.json()['data']
        self.assertTrue(data2[0]['has_active_contract'])

        # 5. Publish with active contract -> 200
        pub_response2 = self.client.post(publish_url)
        self.assertEqual(pub_response2.status_code, status.HTTP_200_OK)
        self.assertTrue(pub_response2.json()['success'])

        self.ouvrage.refresh_from_db()
        self.assertEqual(self.ouvrage.status, 'published')
