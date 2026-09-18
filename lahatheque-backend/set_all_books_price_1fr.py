#!/usr/bin/env python
"""
Script autonome pour mettre tous les livres de la plateforme LAHAThèque à 1 FCFA.
Peut être exécuté directement : python set_all_books_price_1fr.py
"""
import os
import sys
from decimal import Decimal

# Initialisation de l'environnement Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

import django
django.setup()

from django.db import transaction
from apps.catalog.models import Ouvrage
from apps.reporting.models import ConfigurationPlateformeGlobale
from apps.catalog.views import invalidate_catalog_cache


def run():
    total_books = Ouvrage.objects.count()
    print(f"=== Mise à jour des tarifs du catalogue LAHAThèque ===")
    print(f"Nombre total d'ouvrages détectés : {total_books}")

    with transaction.atomic():
        # 1. Mise à jour de tous les ouvrages à 1 FCFA (toutes versions)
        updated_count = Ouvrage.objects.all().update(
            price_digital=Decimal("1.00"),
            price_paper=Decimal("1.00"),
            price_audio=Decimal("1.00"),
            price_audio_eur=Decimal("1.00"),
        )
        print(f"-> {updated_count} ouvrages mis à jour à 1 FCFA (numérique, papier, audio).")

        # 2. Mise à jour de la configuration globale de la plateforme
        config = ConfigurationPlateformeGlobale.objects.first()
        if config:
            config.prix_defaut_numerique_xof = Decimal("1.00")
            config.prix_defaut_papier_xof = Decimal("1.00")
            config.prix_defaut_audio_xof = Decimal("1.00")
            config.save(update_fields=[
                "prix_defaut_numerique_xof",
                "prix_defaut_papier_xof",
                "prix_defaut_audio_xof",
            ])
            print("-> Configuration globale tarifaire réalignée sur 1 FCFA.")

    # 3. Invalidation du cache catalogue
    try:
        invalidate_catalog_cache()
        print("-> Cache catalogue invalidé.")
    except Exception as e:
        print(f"-> Note cache : {e}")

    print(f"=== Terminé avec succès ! Tous les livres sont désormais à 1 FCFA. ===")


if __name__ == "__main__":
    run()
