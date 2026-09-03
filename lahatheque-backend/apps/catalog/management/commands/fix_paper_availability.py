from django.core.management.base import BaseCommand
from django.db.models import Sum
from apps.catalog.models import Ouvrage


class Command(BaseCommand):
    help = "Active is_paper_available pour tout ouvrage ayant du stock physique reel positif."

    def handle(self, *args, **options):
        candidates = Ouvrage.objects.filter(
            is_paper_available=False, status='published'
        ).annotate(
            total_stock=Sum('stocks_entrepots__quantite_reelle')
        ).filter(total_stock__gt=0)

        count = candidates.count()

        for ouvrage in candidates:
            self.stdout.write(f"  [OK] {ouvrage.title[:60]} -- {ouvrage.total_stock} unite(s) en stock")

        candidates.update(is_paper_available=True)

        self.stdout.write(self.style.SUCCESS(
            f"\n{count} ouvrage(s) corrige(s) -- is_paper_available active pour tous les "
            f"livres ayant reellement du stock en entrepot."
        ))
