from django.core.management.base import BaseCommand
from apps.catalog.models import Ouvrage


class Command(BaseCommand):
    help = "Recalcule page_count pour les ouvrages PDF publiés dont ce champ est à 0."

    def handle(self, *args, **options):
        import fitz

        candidates = Ouvrage.objects.filter(
            page_count__in=[0, None], status='published', format_type='pdf'
        ).exclude(file='')

        fixed = 0
        failed = 0

        for ouvrage in candidates:
            try:
                if not ouvrage.file:
                    continue
                ouvrage.file.open('rb')
                file_bytes = ouvrage.file.read()
                ouvrage.file.close()

                with fitz.open(stream=file_bytes, filetype="pdf") as doc:
                    real_count = doc.page_count

                if real_count > 0:
                    ouvrage.page_count = real_count
                    ouvrage.save(update_fields=['page_count'])
                    fixed += 1
                    self.stdout.write(f"  [OK] {ouvrage.title[:60]} -> {real_count} pages")
                else:
                    failed += 1
            except Exception as e:
                failed += 1
                self.stdout.write(self.style.WARNING(f"  [ERR] {ouvrage.title[:60]} : {e}"))

        self.stdout.write(self.style.SUCCESS(
            f"\nTermine — {fixed} ouvrage(s) corrige(s), {failed} echec(s) (fichier "
            f"inaccessible ou non-PDF malgre le format declare)."
        ))
