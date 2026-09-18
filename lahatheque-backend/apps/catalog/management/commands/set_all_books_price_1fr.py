"""
Commande de gestion Django : met tous les livres de la plateforme à 1 FCFA.
Met à jour tous les ouvrages existants (numérique, papier, audio) et la configuration globale.
Usage : python manage.py set_all_books_price_1fr
"""
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.catalog.models import Ouvrage
from apps.reporting.models import ConfigurationPlateformeGlobale
from apps.catalog.views import invalidate_catalog_cache


class Command(BaseCommand):
    help = "Met tous les ouvrages existants du catalogue au tarif de 1 FCFA (numérique, papier et audio)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simule l'exécution sans modifier la base de données.",
        )

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)

        total_books = Ouvrage.objects.count()
        self.stdout.write(f"Nombre total d'ouvrages détectés en base : {total_books}")

        if dry_run:
            self.stdout.write(self.style.WARNING("[SIMULATION] Aucun changement appliqué."))
            return

        with transaction.atomic():
            # 1. Mise à jour de tous les ouvrages
            updated_count = Ouvrage.objects.all().update(
                price_digital=Decimal("1.00"),
                price_paper=Decimal("1.00"),
                price_audio=Decimal("1.00"),
                price_audio_eur=Decimal("1.00"),
            )

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
                self.stdout.write(self.style.SUCCESS("Configuration globale tarifaire réalignée sur 1 FCFA."))

        # 3. Invalidation du cache catalogue
        try:
            invalidate_catalog_cache()
            self.stdout.write(self.style.SUCCESS("Cache Redis/Django du catalogue invalidé avec succès."))
        except Exception as cache_err:
            self.stdout.write(self.style.WARNING(f"Avertissement invalidation cache : {cache_err}"))

        self.stdout.write(
            self.style.SUCCESS(
                f"Succès : {updated_count} ouvrages ont été mis à jour au tarif de 1 FCFA (numérique: 1 F, papier: 1 F, audio: 1 F)."
            )
        )
