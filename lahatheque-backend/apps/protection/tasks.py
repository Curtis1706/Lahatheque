from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task
def prepare_derived_document_task(source_type, source_reference, user_info, config_dict=None):
    """Génère et met en cache Redis le dérivé filigrané, en tâche de fond."""
    from apps.protection.derived_materializer import DerivedMaterializer
    from apps.protection.models import GlobalDrmConfig

    try:
        config = GlobalDrmConfig.get_singleton()
        DerivedMaterializer.get_or_create_derived(
            source_type=source_type,
            source_reference=source_reference,
            user_info=user_info,
            config=config,
        )
        logger.info(f"[Préparation liseuse] Dérivé prêt pour {source_reference}.")
    except Exception as e:
        logger.error(f"[Préparation liseuse] Échec pour {source_reference}: {e}")
