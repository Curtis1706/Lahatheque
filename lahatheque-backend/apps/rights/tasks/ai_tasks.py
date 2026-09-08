import logging
import threading

logger = logging.getLogger(__name__)


def process_ai_suggestion_task(contrat_id: str):
    """Génère la suggestion IA pour un contrat, en tâche de fond."""
    from apps.rights.models import ContratLegal, AIRoyaltySuggestion
    from apps.ai_engine.services.openai_service import analyze_document_with_openai
    import re

    try:
        contrat = ContratLegal.objects.select_related('ouvrage').get(id=contrat_id)
    except ContratLegal.DoesNotExist:
        logger.warning(f"[AI Suggestion] Contrat {contrat_id} introuvable.")
        return

    try:
        analysis = analyze_document_with_openai(
            text_sample=contrat.texte_integral_index[:8000] if contrat.texte_integral_index else "",
            filename=contrat.titre,
            total_pages=0,
        )

        pct_match = re.search(r'(\d{1,3})\s*%', contrat.texte_integral_index or "")
        suggested_pct = float(pct_match.group(1)) if pct_match else 50.0
        suggested_pct = min(100.0, max(0.0, suggested_pct))

        AIRoyaltySuggestion.objects.create(
            contrat=contrat,
            ouvrage=contrat.ouvrage,
            beneficiaire_nom=contrat.contracting_party or "Auteur Principal",
            pourcentage_suggere=suggested_pct,
            clause_extraite=(analysis.get("summary", "") or "")[:500],
            confiance_score=0.75 if pct_match else 0.5,
        )
        logger.info(f"[AI Suggestion] Générée pour le contrat {contrat_id}.")
    except Exception as e:
        logger.warning(f"[AI Suggestion] Échec pour le contrat {contrat_id}: {e}")


def trigger_ai_suggestion(contrat_id: str):
    """Déclenche l'analyse IA en arrière-plan. Tente Celery ; repli sur thread daemon."""
    try:
        process_ai_suggestion_task_celery.delay(contrat_id)
        logger.info(f"[AI Suggestion Trigger] Tâche Celery planifiée pour '{contrat_id}'.")
    except Exception as celery_err:
        logger.info(f"[AI Suggestion Trigger] Broker indisponible ({celery_err}). Repli sur thread.")
        thread = threading.Thread(
            target=process_ai_suggestion_task,
            args=(contrat_id,),
            daemon=True,
            name=f"ai-suggestion-{str(contrat_id)[:8]}"
        )
        thread.start()


from celery import shared_task

@shared_task
def process_ai_suggestion_task_celery(contrat_id: str):
    process_ai_suggestion_task(contrat_id)
