from django.core.management.base import BaseCommand
from apps.catalog.models import Ouvrage


class Command(BaseCommand):
    help = "Active le format audio sur un échantillon d'ouvrages publiés pour les tests et la vitrine."

    def handle(self, *args, **options):
        # 1. Ouvrages publiés existants
        published_books = list(Ouvrage.objects.filter(status='published').order_by('-created_at')[:10])

        if not published_books:
            self.stdout.write(self.style.WARNING("Aucun ouvrage avec status='published' trouvé."))
            return

        updated_count = 0
        for b in published_books[:5]:
            b.has_audio_version = True
            if not b.price_audio or b.price_audio <= 0:
                b.price_audio = 2500.00
            b.audio_status = 'published'
            b.save(update_fields=['has_audio_version', 'price_audio', 'audio_status'])
            self.stdout.write(f"  [AUDIO ACTIVÉ] {b.title[:50]} (ID: {b.id}) - Prix: {b.price_audio} XOF")
            updated_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"\nSuccès : {updated_count} ouvrage(s) configuré(s) avec version audio active !"
        ))
