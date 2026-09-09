"""
Commande de pré-génération batch des PDFs depuis les EPUBs stockés sur Cloudflare R2.

Usage :
    python manage.py pregenerate_epub_pdfs
    python manage.py pregenerate_epub_pdfs --dry-run
    python manage.py pregenerate_epub_pdfs --book-id f7ce8aa7-d903-4689-90a6-15bb6f7a9cfb
    python manage.py pregenerate_epub_pdfs --lang fr
    python manage.py pregenerate_epub_pdfs --workers 3

Objectif :
    Pour chaque OuvrageLanguageVersion ayant un r2_key_epub non vide et un r2_key_pdf vide,
    déclenche la conversion EPUB -> PDF via DocumentSourceAdapter._convert_epub_and_persist(),
    qui applique le verrou Redis distribué, uploade le PDF sur R2 et met à jour r2_key_pdf en BDD.
    Après cette commande, toutes les lectures futures sont servies directement depuis R2 (zéro CPU).
"""

import time
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional

from django.core.management.base import BaseCommand

from apps.catalog.models import OuvrageLanguageVersion
from apps.protection.source_adapter import DocumentSourceAdapter


class Command(BaseCommand):
    help = (
        "Pré-génère en batch les PDFs manquants pour tous les OuvrageLanguageVersion "
        "ayant un r2_key_epub non vide et un r2_key_pdf vide. "
        "Utilise le pipeline EPUB -> PDF avec verrou Redis et persistance Cloudflare R2."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Simule la commande sans effectuer de conversion ni d'upload.",
        )
        parser.add_argument(
            "--book-id",
            type=str,
            default=None,
            help="Restreint la pré-génération à un seul ouvrage (UUID).",
        )
        parser.add_argument(
            "--lang",
            type=str,
            default=None,
            help="Restreint la pré-génération à une seule langue (ex: fr, en).",
        )
        parser.add_argument(
            "--workers",
            type=int,
            default=2,
            help="Nombre de threads de conversion simultanés (défaut: 2, max recommandé: 4).",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            default=False,
            help="Force la reconversion même si r2_key_pdf est déjà rempli.",
        )

    def handle(self, *args, **options):
        dry_run: bool = options["dry_run"]
        book_id: Optional[str] = options["book_id"]
        lang: Optional[str] = options["lang"]
        workers: int = min(max(options["workers"], 1), 8)
        force: bool = options["force"]

        self.stdout.write(self.style.MIGRATE_HEADING(
            "\nPre-generation batch EPUB -> PDF (Cloudflare R2)"
        ))
        self.stdout.write(f"  dry-run  : {dry_run}")
        self.stdout.write(f"  book-id  : {book_id or 'tous'}")
        self.stdout.write(f"  lang     : {lang or 'toutes'}")
        self.stdout.write(f"  workers  : {workers}")
        self.stdout.write(f"  force    : {force}\n")

        # Construction du queryset cible
        qs = OuvrageLanguageVersion.objects.exclude(r2_key_epub="").select_related("ouvrage")
        if not force:
            qs = qs.filter(r2_key_pdf="")
        if book_id:
            qs = qs.filter(ouvrage_id=book_id)
        if lang:
            qs = qs.filter(language__iexact=lang)

        versions = list(qs.order_by("ouvrage_id", "language"))
        total = len(versions)

        if total == 0:
            self.stdout.write(self.style.SUCCESS(
                "Aucun EPUB a convertir : tous les r2_key_pdf sont deja remplis."
            ))
            return

        self.stdout.write(self.style.WARNING(
            f"{total} version(s) EPUB a convertir en PDF."
        ))

        if dry_run:
            self.stdout.write("\n[DRY-RUN] Versions qui seraient converties :\n")
            for lv in versions:
                self.stdout.write(
                    f"  - Ouvrage {lv.ouvrage_id} [{lv.language.upper()}]  "
                    f"epub={lv.r2_key_epub}"
                )
            self.stdout.write(self.style.SUCCESS(
                f"\nDry-run termine. {total} version(s) listees."
            ))
            return

        # Confirmation interactive si traitement de masse sans --book-id
        if total > 10 and not book_id:
            confirm = input(
                f"\nATTENTION : {total} conversions vont etre lancees. "
                f"Chaque conversion peut prendre 30 a 90s. "
                f"Confirmer ? (oui/non) : "
            )
            if confirm.strip().lower() not in ("oui", "o", "yes", "y"):
                self.stdout.write(self.style.ERROR("Annule."))
                return

        stats = {"ok": 0, "echec": 0}
        t_start = time.time()

        def convert_one(lv: OuvrageLanguageVersion) -> dict:
            """Convertit une version EPUB en PDF et retourne un rapport de résultat."""
            label = f"Ouvrage {lv.ouvrage_id} [{lv.language.upper()}]"
            t0 = time.time()
            try:
                pdf_data = DocumentSourceAdapter._convert_epub_and_persist(
                    lv, lv.r2_key_epub
                )
                elapsed = round(time.time() - t0, 1)
                if pdf_data:
                    lv.refresh_from_db()
                    return {
                        "status": "ok",
                        "label": label,
                        "size_ko": len(pdf_data) // 1024,
                        "r2_key_pdf": lv.r2_key_pdf,
                        "elapsed": elapsed,
                    }
                return {
                    "status": "echec",
                    "label": label,
                    "error": "Conversion retournee None (EPUB ou conversion invalide).",
                    "elapsed": elapsed,
                }
            except Exception as exc:
                elapsed = round(time.time() - t0, 1)
                return {
                    "status": "echec",
                    "label": label,
                    "error": str(exc),
                    "traceback": traceback.format_exc(),
                    "elapsed": elapsed,
                }

        self.stdout.write(f"\nDemarrage avec {workers} worker(s) simultane(s)...\n")

        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = {executor.submit(convert_one, lv): lv for lv in versions}
            done = 0
            for future in as_completed(futures):
                done += 1
                result = future.result()
                if result["status"] == "ok":
                    stats["ok"] += 1
                    self.stdout.write(self.style.SUCCESS(
                        f"  [{done:3}/{total}] OK   {result['label']} "
                        f"({result['size_ko']} Ko en {result['elapsed']}s) "
                        f"-> {result['r2_key_pdf']}"
                    ))
                else:
                    stats["echec"] += 1
                    self.stdout.write(self.style.ERROR(
                        f"  [{done:3}/{total}] FAIL {result['label']} "
                        f"({result['elapsed']}s) : {result['error']}"
                    ))

        total_elapsed = round(time.time() - t_start, 1)
        self.stdout.write(self.style.MIGRATE_HEADING(
            f"\nResultats finaux : {stats['ok']} OK  /  {stats['echec']} echec(s)  "
            f"sur {total} version(s)  --  {total_elapsed}s total"
        ))

        if stats["echec"] == 0:
            self.stdout.write(self.style.SUCCESS(
                "Toutes les conversions sont terminees avec succes. "
                "Toutes les lectures futures seront servies directement depuis Cloudflare R2 "
                "sans aucun delai de conversion pour les utilisateurs."
            ))
        else:
            self.stdout.write(self.style.WARNING(
                f"{stats['echec']} conversion(s) ont echoue. "
                "Relancez la commande pour retenter uniquement les versions manquantes "
                "(les versions deja converties seront ignorees automatiquement)."
            ))
