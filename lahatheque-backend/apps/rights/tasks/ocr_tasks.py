"""
Module de tâches asynchrones d'OCR haute performance pour les contrats légaux.
Conçu pour exécuter la reconnaissance optique en tâche de fond sans bloquer le serveur HTTP.
"""
import logging
import threading
from django.utils import timezone
from django.core.files.storage import default_storage
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2, default_retry_delay=60)
def process_contract_ocr_task(self, contrat_id: str):
    """
    Tâche asynchrone d'extraction OCR de fond pour un contrat.
    Télécharge le fichier en mémoire, extrait le texte via Tesseract/PyMuPDF
    et met à jour l'index plein texte sans bloquer le serveur web.
    """
    from apps.rights.models import ContratLegal
    from apps.rights.services.ocr_service import extract_text_from_document

    try:
        contrat = ContratLegal.objects.get(id=contrat_id)
    except ContratLegal.DoesNotExist:
        logger.warning(f"[OCR Task] Contrat {contrat_id} introuvable.")
        return

    logger.info(f"[OCR Task] Début de l'analyse OCR pour le contrat {contrat.numero_contrat} ({contrat_id}).")
    contrat.indexing_status = "processing"
    contrat.save(update_fields=["indexing_status"])

    try:
        file_bytes = b""
        if contrat.fichier_contrat_path:
            try:
                with default_storage.open(contrat.fichier_contrat_path, "rb") as f:
                    file_bytes = f.read()
            except Exception as read_err:
                logger.error(f"[OCR Task] Impossible de lire le fichier {contrat.fichier_contrat_path}: {read_err}")

        if not file_bytes:
            contrat.indexing_status = "failed"
            contrat.ocr_engine_used = "file_not_found"
            contrat.save(update_fields=["indexing_status", "ocr_engine_used"])
            return

        result = extract_text_from_document(
            file_bytes=file_bytes,
            file_name=contrat.file_name or "contrat.pdf",
            max_pages=50,
            enable_ocr_fallback=True,
        )

        extracted_text = result.get("text", "").strip()
        if extracted_text:
            contrat.texte_integral_index = extracted_text[:50000]
            contrat.indexing_status = "indexed"
            contrat.ocr_engine_used = result.get("engine", "tesseract_ocr")
            contrat.ocr_confidence_score = result.get("confidence", 0.85)
            contrat.indexed_at = timezone.now()
            contrat.save(update_fields=[
                "texte_integral_index",
                "indexing_status",
                "ocr_engine_used",
                "ocr_confidence_score",
                "indexed_at",
            ])
            logger.info(f"[OCR Task] Contrat {contrat.numero_contrat} indexé avec succès via {result.get('engine')}.")
        else:
            contrat.indexing_status = "failed"
            contrat.ocr_engine_used = "no_text_extracted"
            contrat.save(update_fields=["indexing_status", "ocr_engine_used"])
            logger.warning(f"[OCR Task] Aucun texte extrait pour le contrat {contrat.numero_contrat}.")

    except Exception as exc:
        logger.error(f"[OCR Task] Erreur OCR sur le contrat {contrat_id}: {exc}", exc_info=True)
        contrat.indexing_status = "failed"
        contrat.ocr_engine_used = f"error: {str(exc)[:50]}"
        contrat.save(update_fields=["indexing_status", "ocr_engine_used"])
        if hasattr(self, "retry"):
            raise self.retry(exc=exc)


def trigger_contract_ocr(contrat_id: str):
    """
    Déclenche l'OCR asynchrone pour un contrat.
    Tente via Celery; en cas d'indisponibilité du broker, utilise un thread daemon non-bloquant.
    """
    cid = contrat_id
    try:
        process_contract_ocr_task.delay(cid)
        logger.info(f"[OCR Trigger] Tâche Celery planifiée pour {cid}.")
    except Exception as celery_err:
        logger.info(f"[OCR Trigger] Broker Celery non joint ({celery_err}). Lancement via Threading daemon.")
        thread = threading.Thread(
            target=process_contract_ocr_task,
            args=(cid,),
            daemon=True,
            name=f"ocr-contract-{cid[:8]}"
        )
        thread.start()
