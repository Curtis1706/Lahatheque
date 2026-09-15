"""
Script de mise à jour du compte Administrateur LAHAThèque.
Remplace l'adresse e-mail 'admin@lahatheque.com' par 'lahaeditions1@gmail.com'.
"""
import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")
try:
    django.setup()
except Exception as e:
    # Si la config dev échoue, tenter la config base / production
    os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.base"
    django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()


def main():
    print("[MIGRATION ADMIN] Recherche du compte administrateur...")

    # Recherche par email ou username
    admin_user = (
        User.objects.filter(email__iexact="admin@lahatheque.com").first()
        or User.objects.filter(username="admin_lahatheque").first()
        or User.objects.filter(role__in=["admin", "super_admin"], is_superuser=True).first()
    )

    if not admin_user:
        print("[ERREUR] Aucun compte administrateur éligible trouvé.")
        sys.exit(1)

    old_email = admin_user.email
    new_email = "lahaeditions1@gmail.com"

    print(f"[INFO] Compte trouvé : username='{admin_user.username}', email='{old_email}', rôle='{admin_user.role}'")

    if old_email == new_email:
        print(f"[INFO] Le compte administrateur possède déjà l'adresse {new_email}. Aucune modification requise.")
        return

    admin_user.email = new_email
    admin_user.save(update_fields=["email"])

    print(f"[SUCCÈS] Adresse email de l'administrateur mise à jour : '{old_email}' -> '{new_email}'")


if __name__ == "__main__":
    main()
