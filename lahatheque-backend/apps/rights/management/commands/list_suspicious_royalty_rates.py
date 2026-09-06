from django.core.management.base import BaseCommand
from apps.rights.models import RoyaltyRate


class Command(BaseCommand):
    help = "Liste les livres dont author_share_percent=100 et platform_share_percent=0."

    def handle(self, *args, **options):
        suspects = RoyaltyRate.objects.filter(
            author_share_percent=100,
            platform_share_percent=0
        ).select_related('ouvrage')

        self.stdout.write(f"{suspects.count()} livre(s) à vérifier manuellement :")
        for rate in suspects:
            self.stdout.write(f"  - {rate.ouvrage.title} (ID: {rate.ouvrage.id})")

        self.stdout.write(self.style.WARNING(
            "Ces valeurs ne doivent PAS être corrigées automatiquement — le vrai taux négocié "
            "doit être confirmé avec le Juriste via l'outil 'Ajuster le taux'."
        ))
