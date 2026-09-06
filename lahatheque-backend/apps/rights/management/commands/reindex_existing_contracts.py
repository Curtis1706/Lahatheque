"""
Commande de gestion Django pour réindexer les contrats existants en base de données.
Permet d'appliquer l'extraction plein texte PyMuPDF et Tesseract OCR à tous les anciens contrats.
Usage:
    python manage.py reindex_existing_contracts [--all] [--sync]
"""
import logging
from django.core.management.base import BaseCommand
from django.core.files.storage import default_storage
from django.utils import timezone
from apps.rights.models import ContratLegal
from apps.rights.services.ocr_service import extract_text_from_document, MIN_NATIVE_CHARS_THRESHOLD
from apps.rights.tasks.ocr_tasks import trigger_contract_ocr

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Réindexe le texte intégral et exécute l'OCR sur les contrats existants en base."

    def add_arguments(self, parser):
        parser.add_argument(
            "--all",
            action="store_true",
            help="Réindexer TOUS les contrats, y compris ceux ayant déjà un index texte.",
        )
        parser.add_argument(
            "--sync",
            action="store_true",
            help="Exécuter l'OCR de manière synchrone (dans le processus courant) au lieu d'en tâche de fond.",
        )

    def handle(self, *args, **options):
        reindex_all = options["all"]
        run_sync = options["sync"]

        qs = ContratLegal.objects.exclude(fichier_contrat_path="").exclude(fichier_contrat_path__isnull=True)

        if not reindex_all:
            # Cibler les contrats sans texte ou avec moins de 50 caractères
            total_before = qs.count()
            target_ids = []
            for c in qs.only("id", "texte_integral_index", "fichier_contrat_path"):
                txt = (c.texte_integral_index or "").strip()
                if len(txt) < MIN_NATIVE_CHARS_THRESHOLD:
                    target_ids.append(c.id)
            qs = ContratLegal.objects.filter(id__in=target_ids)
            self.stdout.write(
                f"[Reindex] {len(target_ids)} contrats sans index valide identifies sur un total de {total_before}."
            )
        else:
            self.stdout.write(f"[Reindex] Mode complet: {qs.count()} contrats a reindexer.")

        contracts_to_process = list(qs)
        if not contracts_to_process:
            self.stdout.write(self.style.SUCCESS("[Reindex] Aucun contrat ne necessite de reindexation."))
            return

        success_count = 0
        queued_count = 0
        error_count = 0

        for idx, contrat in enumerate(contracts_to_process, start=1):
            ref = contrat.numero_contrat or str(contrat.id)[:8]
            self.stdout.write(f"[{idx}/{len(contracts_to_process)}] Traitement du contrat {ref}...")

            if not run_sync:
                # Mode tâche de fond non-bloquante
                contrat.indexing_status = "processing"
                contrat.save(update_fields=["indexing_status"])
                trigger_contract_ocr(contrat.id)
                queued_count += 1
            else:
                # Mode synchrone direct
                try:
                    with default_storage.open(contrat.fichier_contrat_path, "rb") as f:
                        file_bytes = f.read()

                    if not file_bytes:
                        contrat.indexing_status = "failed"
                        contrat.ocr_engine_used = "file_empty"
                        contrat.save(update_fields=["indexing_status", "ocr_engine_used"])
                        error_count += 1
                        continue

                    res = extract_text_from_document(
                        file_bytes=file_bytes,
                        file_name=contrat.file_name or "contrat.pdf",
                        max_pages=50,
                        enable_ocr_fallback=True,
                    )

                    text = res.get("text", "").strip()
                    if text:
                        contrat.texte_integral_index = text[:50000]
                        contrat.indexing_status = "indexed"
                        contrat.ocr_engine_used = res.get("engine", "tesseract_ocr")
                        contrat.ocr_confidence_score = res.get("confidence", 0.85)
                        contrat.indexed_at = timezone.now()
                        contrat.save(update_fields=[
                            "texte_integral_index",
                            "indexing_status",
                            "ocr_engine_used",
                            "ocr_confidence_score",
                            "indexed_at",
                        ])
                        success_count += 1
                        self.stdout.write(self.style.SUCCESS(f"  OK via {res.get('engine')} ({len(text)} car.)"))
                    else:
                        contrat.indexing_status = "failed"
                        contrat.ocr_engine_used = "no_text"
                        contrat.save(update_fields=["indexing_status", "ocr_engine_used"])
                        error_count += 1
                except Exception as err:
                    self.stdout.write(self.style.ERROR(f"  Erreur: {err}"))
                    contrat.indexing_status = "failed"
                    contrat.ocr_engine_used = f"error: {str(err)[:50]}"
                    contrat.save(update_fields=["indexing_status", "ocr_engine_used"])
                    error_count += 1

        if run_sync:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n[Termine] Succes: {success_count}, Echecs: {error_count} sur {len(contracts_to_process)} contrats."
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n[Termine] {queued_count} contrats envoyes a la file d'analyse OCR en tache de fond."
                )
            )
