from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import LibraryBook
from media.pdf_service import generate_and_save_thumbnail
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=LibraryBook)
def handle_book_thumbnail(sender, instance, created, **kwargs):
    """
    Signal pour générer automatiquement une miniature lorsqu'un livre est créé 
    ou que son fichier est modifié.
    """
    # On ne génère que s'il y a un fichier et pas encore de miniature
    # (ou si on veut forcer la régénération lors d'un update de fichier)
    if instance.file and not instance.thumbnail_url:
        try:
            logger.info(f"[SIGNAL] Génération de miniature pour le livre : {instance.title}")
            thumbnail_url = generate_and_save_thumbnail(instance.file, str(instance.id))
            if thumbnail_url:
                # Utiliser update_fields pour éviter de redéclencher le signal en boucle
                instance.thumbnail_url = thumbnail_url
                instance.save(update_fields=['thumbnail_url'])
        except Exception as e:
            logger.error(f"[SIGNAL ERROR] Échec de la génération automatique : {e}")
