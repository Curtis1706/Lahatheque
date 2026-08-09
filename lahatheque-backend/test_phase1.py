import os
import sys
import json
import traceback
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.conf import settings
if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('testserver')

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.catalog.models import Ouvrage, Discipline, BookAuthor
from apps.partners.models import Institution
from apps.publishers_portal.models import Publisher

User = get_user_model()
client = APIClient()

print("=== 1. TEST POST /api/v1/auth/register/ (student) ===")
try:
    res_student = client.post('/api/v1/auth/register/', {
        'email': 'student_test@lahatheque.com',
        'password': 'Password123!',
        'first_name': 'Amadou',
        'last_name': 'Kouyaté',
        'phone': '+22997000001',
        'country': 'BJ',
        'role': 'student'
    }, format='json')
    print(f"HTTP Status: {res_student.status_code}")
    print(res_student.content.decode('utf-8'))
except Exception as e:
    traceback.print_exc()

print("\n=== 2. TEST POST /api/v1/auth/register/ (author) ===")
try:
    res_author = client.post('/api/v1/auth/register/', {
        'email': 'author_test@lahatheque.com',
        'password': 'Password123!',
        'first_name': 'Mariam',
        'last_name': 'Bâ',
        'phone': '+22177000002',
        'country': 'SN',
        'role': 'author'
    }, format='json')
    print(f"HTTP Status: {res_author.status_code}")
    print(res_author.content.decode('utf-8'))
except Exception as e:
    traceback.print_exc()

print("\n=== 3. TEST GET /api/v1/catalog/books/?institution=...&discipline=... ===")
try:
    inst, _ = Institution.objects.get_or_create(code='UAC', defaults={'name': "Université d'Abomey-Calavi", 'country': 'BJ'})
    disc, _ = Discipline.objects.get_or_create(name='Droit & Sciences Politiques', defaults={'code_dewey': '340'})
    pub, _ = Publisher.objects.get_or_create(name='LAHA Éditions', defaults={'contact_email': 'contact@lahaeditions.com'})

    author_obj, _ = BookAuthor.objects.get_or_create(first_name='Jean-Marc', last_name='Agossou')

    book, _ = Ouvrage.objects.get_or_create(
        isbn='978-2-84299-123-4',
        defaults={
            'title': "Droit Constitutionnel des États d'Afrique Francophone",
            'subtitle': "Principes généraux et évolutions démocratiques",
            'publisher': pub,
            'discipline': disc,
            'institution': inst,
            'country': 'BJ',
            'format_type': 'pdf',
            'publication_date': '2024-10-15',
            'language': 'fr',
            'summary': "Ouvrage de référence analysant les évolutions constitutionnelles récentes.",
            'status': 'published'
        }
    )
    book.authors.add(author_obj)

    res_catalog = client.get(f'/api/v1/catalog/books/?institution={inst.id}&discipline={disc.id}')
    print(f"HTTP Status: {res_catalog.status_code}")
    print(res_catalog.content.decode('utf-8'))
except Exception as e:
    traceback.print_exc()
