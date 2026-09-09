from django.core.management.base import BaseCommand
from apps.catalog.models import Ouvrage, OuvrageLanguageVersion


class Command(BaseCommand):
    help = "Passe tous les ouvrages et leurs versions linguistiques en version numérique uniquement (is_paper_available=False)."

    def handle(self, *args, **options):
        # 1. Mise à jour de tous les ouvrages
        total_ouvrages = Ouvrage.objects.count()
        ouvrages_updated = Ouvrage.objects.filter(is_paper_available=True).update(is_paper_available=False)

        # 2. Mise à jour de toutes les versions linguistiques
        total_versions = OuvrageLanguageVersion.objects.count()
        versions_updated = OuvrageLanguageVersion.objects.filter(is_paper_available=True).update(
            is_paper_available=False,
            paper_stock=0
        )

        self.stdout.write(
            f"[OK] {ouvrages_updated}/{total_ouvrages} ouvrage(s) bascule(s) en numerique uniquement."
        )
        self.stdout.write(
            f"[OK] {versions_updated}/{total_versions} version(s) linguistique(s) basculee(s) en numerique uniquement."
        )
        self.stdout.write(
            self.style.SUCCESS(
                "Mise a jour terminee avec succes : aucun ouvrage ne dispose desormais de version papier."
            )
        )
