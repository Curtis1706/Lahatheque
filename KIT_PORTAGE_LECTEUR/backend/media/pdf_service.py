"""
media/pdf_service.py — Génération de miniatures PDF via PyMuPDF (fitz).

Génère une image PNG de la première page d'un PDF et l'uploade sur R2.
Utilise PyMuPDF qui ne nécessite pas de dépendances système externes (pas de poppler).

Installation : pip install pymupdf
"""
import io
import logging
from django.core.files.base import ContentFile

logger = logging.getLogger(__name__)

# Dimensions de la miniature générée (format A4 réduit)
THUMBNAIL_WIDTH = 400
THUMBNAIL_HEIGHT = 565


def generate_thumbnail(pdf_file_obj) -> ContentFile | None:
    """
    Génère une miniature PNG de la première page d'un PDF via PyMuPDF.

    Args:
        pdf_file_obj: Objet fichier Django (lecture binaire).

    Returns:
        ContentFile Django prêt à être sauvegardé, ou None si échec.
    """
    try:
        import fitz  # PyMuPDF
        from PIL import Image

        # Lecture du contenu du PDF
        pdf_bytes = pdf_file_obj.read()
        if hasattr(pdf_file_obj, 'seek'):
            pdf_file_obj.seek(0)  # Rembobiner après lecture

        # Ouverture du document depuis les bytes
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        if doc.page_count == 0:
            logger.warning("[PDF] Le document est vide.")
            return None

        # Récupération de la première page
        page = doc[0]
        
        # Définition de la résolution (zoom) pour une bonne qualité
        # 2.0 = 144 DPI (standard)
        mat = fitz.Matrix(2.0, 2.0)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        
        # Conversion Pixmap fitz → Image PIL
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        # Redimensionnement proportionnel
        img.thumbnail((THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT), Image.LANCZOS)

        # Conversion en bytes PNG
        buffer = io.BytesIO()
        img.save(buffer, format='PNG', optimize=True)
        buffer.seek(0)
        
        doc.close()

        return ContentFile(buffer.read())

    except ImportError:
        logger.error("[PDF] PyMuPDF (fitz) non installé. Lancez : pip install pymupdf")
        return None
    except Exception as e:
        logger.error(f"[PDF] Erreur génération miniature (PyMuPDF) : {e}", exc_info=True)
        return None


def generate_and_save_thumbnail(pdf_file_obj, book_id: str) -> str | None:
    """
    Génère la miniature et la sauvegarde directement sur R2 via default_storage.

    Args:
        pdf_file_obj: Objet fichier PDF.
        book_id: Identifiant du livre.

    Returns:
        URL publique R2 de la miniature, ou None si échec.
    """
    from django.core.files.storage import default_storage

    thumbnail_content = generate_thumbnail(pdf_file_obj)
    if thumbnail_content is None:
        return None

    thumbnail_path = f"library/thumbnails/{book_id}.png"

    try:
        # On écrase si elle existe déjà
        if default_storage.exists(thumbnail_path):
            default_storage.delete(thumbnail_path)
            
        saved_path = default_storage.save(thumbnail_path, thumbnail_content)
        url = default_storage.url(saved_path)
        logger.info(f"[PDF] Miniature sauvegardée sur R2 : {url}")
        return url
    except Exception as e:
        logger.error(f"[PDF] Erreur sauvegarde miniature sur R2 : {e}", exc_info=True)
        return None
