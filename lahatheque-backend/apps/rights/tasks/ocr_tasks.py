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
    import time
    task_t0 = time.perf_counter()

    from apps.rights.models import ContratLegal
    from apps.rights.services.ocr_service import extract_text_from_document

    try:
        contrat = ContratLegal.objects.get(id=contrat_id)
    except ContratLegal.DoesNotExist:
        logger.error(f"[OCR Task ERREUR] Contrat introuvable en base pour id='{contrat_id}'.")
        return

    ref = contrat.numero_contrat or contrat_id[:8]
    logger.info(f"[OCR Task ETAPE 1/4] Debut de l'analyse pour le contrat '{ref}' (titre: '{contrat.titre}').")

    contrat.indexing_status = "processing"
    contrat.save(update_fields=["indexing_status"])

    try:
        file_bytes = b""
        if contrat.fichier_contrat_path:
            try:
                logger.info(f"[OCR Task ETAPE 2/4] Telechargement du fichier depuis le storage: '{contrat.fichier_contrat_path}'...")
                with default_storage.open(contrat.fichier_contrat_path, "rb") as f:
                    file_bytes = f.read()
                logger.info(f"[OCR Task] Fichier lu avec succes: {len(file_bytes) / 1024:.1f} Ko.")
            except Exception as read_err:
                logger.error(f"[OCR Task ERREUR] Impossible de lire le fichier '{contrat.fichier_contrat_path}': {read_err}")

        if not file_bytes:
            contrat.indexing_status = "failed"
            contrat.ocr_engine_used = "file_not_found"
            contrat.save(update_fields=["indexing_status", "ocr_engine_used"])
            logger.error(f"[OCR Task ECHEC] Fichier vide ou introuvable pour '{ref}'. Statut passe a 'failed'.")
            return

        logger.info(f"[OCR Task ETAPE 3/4] Lancement de l'extraction de texte et fallback OCR sur '{contrat.file_name}'...")
        result = extract_text_from_document(
            file_bytes=file_bytes,
            file_name=contrat.file_name or "contrat.pdf",
            max_pages=50,
            enable_ocr_fallback=True,
        )

        extracted_text = result.get("text", "").strip()
        elapsed = time.perf_counter() - task_t0

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
            logger.info(
                f"[OCR Task ETAPE 4/4 SUCCES] Contrat '{ref}' indexe avec succes en {elapsed:.2f}s ! "
                f"Moteur: {result.get('engine')}, Caracteres: {len(extracted_text)}, Confiance: {result.get('confidence', 0.85)}."
            )
        else:
            contrat.indexing_status = "failed"
            contrat.ocr_engine_used = "no_text_extracted"
            contrat.save(update_fields=["indexing_status", "ocr_engine_used"])
            logger.warning(f"[OCR Task ATTENTION] Aucun texte extrait pour le contrat '{ref}' apres {elapsed:.2f}s. Statut passe a 'failed'.")

    except Exception as exc:
        elapsed = time.perf_counter() - task_t0
        logger.error(f"[OCR Task ERREUR CRITIQUE] Exception OCR sur le contrat '{ref}' apres {elapsed:.2f}s: {exc}", exc_info=True)
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
        logger.info(f"[OCR Trigger] Tache Celery planifiee avec succes pour le contrat '{cid}'.")
    except Exception as celery_err:
        logger.info(f"[OCR Trigger] Broker Celery indisponible ({celery_err}). Repli immediat sur un thread daemon d'arriere-plan.")
        thread = threading.Thread(
            target=process_contract_ocr_task,
            args=(cid,),
            daemon=True,
            name=f"ocr-contract-{cid[:8]}"
        )
        thread.start()
        logger.info(f"[OCR Trigger] Thread daemon '{thread.name}' demarre avec succes en arriere-plan.")

