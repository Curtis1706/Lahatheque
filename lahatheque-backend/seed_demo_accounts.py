import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
try:
    django.setup()
except Exception as e:
    print(f"Django setup exception: {e}")

from django.contrib.auth import get_user_model
User = get_user_model()

DEMO_ACCOUNTS = [
    {
        "email": "grossiste@lahatheque.com",
        "role": "wholesaler",
        "first_name": "Gratien",
        "last_name": "SOSSOU (Grossiste)",
        "phone": "+2290195567890",
        "country": "BJ"
    },
    {
        "email": "client@lahatheque.com",
        "role": "student",
        "first_name": "Amadou",
        "last_name": "KOUYATÉ (Lecteur)",
        "phone": "+2290196123456",
        "country": "BJ"
    },
    {
        "email": "auteur@lahatheque.com",
        "role": "author",
        "first_name": "Augustin",
        "last_name": "CHAKIROU (Auteur)",
        "phone": "+2290197001122",
        "country": "BJ"
    },
    {
        "email": "editeur@lahatheque.com",
        "role": "publisher",
        "first_name": "Koffi",
        "last_name": "MENSAH (Éditeur Tiers)",
        "phone": "+2290198334455",
        "country": "BJ"
    },
    {
        "email": "universite@lahatheque.com",
        "role": "librarian",
        "first_name": "Prof. Honoré",
        "last_name": "ADAM (Université UAC)",
        "phone": "+2290199556677",
        "country": "BJ"
    },
    {
        "email": "maquettiste@lahatheque.com",
        "role": "layout_artist",
        "first_name": "Basile",
        "last_name": "HOUNNOU (Maquettiste)",
        "phone": "+2290191223344",
        "country": "BJ"
    },
    {
        "email": "chefmaquettiste@lahatheque.com",
        "role": "chief_layout",
        "first_name": "Rodrigue",
        "last_name": "DOSSOU (Chef Maquettiste)",
        "phone": "+2290192334455",
        "country": "BJ"
    },
    {
        "email": "gestionnaire@lahatheque.com",
        "role": "manager",
        "first_name": "Armand",
        "last_name": "KPANOU (Gestionnaire Stock)",
        "phone": "+2290193445566",
        "country": "BJ"
    },
    {
        "email": "juriste@lahatheque.com",
        "role": "legal_reviewer",
        "first_name": "Me Clarisse",
        "last_name": "AGOSSOU (Juriste)",
        "phone": "+2290194556677",
        "country": "BJ"
    },
]

print("=== CRÉATION DES COMPTES DEMO DANS DJANGO BACKEND ===")
for acc in DEMO_ACCOUNTS:
    email = acc["email"]
    password = "123456"
    try:
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email,
                "first_name": acc["first_name"],
                "last_name": acc["last_name"],
                "phone": acc["phone"],
                "country": acc["country"],
                "role": acc["role"],
                "active_roles": [acc["role"]],
                "is_verified": True,
            }
        )
        user.set_password(password)
        user.first_name = acc["first_name"]
        user.last_name = acc["last_name"]
        user.phone = acc["phone"]
        user.role = acc["role"]
        user.active_roles = [acc["role"]]
        user.is_verified = True
        user.save()
        print(f"[OK] Compte {acc['role']}: {email} | MDP: {password} | Tél: {acc['phone']}")
    except Exception as e:
        print(f"[ERREUR] {email}: {e}")

print("=== OPÉRATION TERMINÉE ===")
