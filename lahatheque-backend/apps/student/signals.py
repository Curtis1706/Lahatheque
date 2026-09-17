"""Signaux Django pour l'invalidation automatique du cache Redis de l'espace Student."""
import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .models import ReadingProgress
from .views import invalidate_student_books_cache

logger = logging.getLogger(__name__)


@receiver([post_save, post_delete], sender=ReadingProgress)
def on_progress_changed(sender, instance, **kwargs):
    try:
        if getattr(instance, 'user_id', None):
            invalidate_student_books_cache(instance.user_id)
    except Exception as e:
        logger.warning(f"[CACHE] Erreur invalidation cache student sur ReadingProgress: {e}")


def register_cross_model_signals():
    """Enregistre les écouteurs sur les modèles d'autres apps (commerce, partners)."""
    try:
        from apps.commerce.models import ClientBouquetSubscription, Order
        from apps.partners.models import StudentAffiliation

        @receiver([post_save, post_delete], sender=ClientBouquetSubscription)
        def on_bouquet_subscription_changed(sender, instance, **kwargs):
            try:
                if getattr(instance, 'user_id', None):
                    invalidate_student_books_cache(instance.user_id)
            except Exception as e:
                logger.warning(f"[CACHE] Erreur invalidation cache student sur ClientBouquetSubscription: {e}")

        @receiver(post_save, sender=Order)
        def on_order_saved(sender, instance, **kwargs):
            try:
                if getattr(instance, 'user_id', None) and instance.statut_paiement == 'paid':
                    invalidate_student_books_cache(instance.user_id)
            except Exception as e:
                logger.warning(f"[CACHE] Erreur invalidation cache student sur Order: {e}")

        @receiver([post_save, post_delete], sender=StudentAffiliation)
        def on_student_affiliation_changed(sender, instance, **kwargs):
            try:
                if getattr(instance, 'student_id', None):
                    invalidate_student_books_cache(instance.student_id)
            except Exception as e:
                logger.warning(f"[CACHE] Erreur invalidation cache student sur StudentAffiliation: {e}")

    except Exception as e:
        logger.warning(f"[CACHE] Erreur enregistrement signaux croisés student: {e}")
