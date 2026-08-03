"""Services de protection et d'extraction de texte PDF (PyMuPDF)."""
import logging
import fitz  # PyMuPDF

logger = logging.getLogger(__name__)

def get_pdf_text_all_pages(file_stream_or_path):
    """
    Extrait le texte de toutes les pages d'un document PDF.
    Retourne un dictionnaire contenant total_pages et la liste des pages indexées.
    Chaque page contient page_number, text, et is_empty.
    """
    try:
        if isinstance(file_stream_or_path, str):
            doc = fitz.open(file_stream_or_path)
        else:
            doc = fitz.open(stream=file_stream_or_path, filetype="pdf")

        pages_data = []
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text("text").strip()
            is_empty = len(text) < 10

            pages_data.append({
                "page_number": page_num,
                "text": text,
                "is_empty": is_empty
            })

        total_pages = len(doc)
        doc.close()

        return {
            "total_pages": total_pages,
            "pages": pages_data
        }
    except Exception as e:
        logger.error(f"Erreur d'extraction de texte PyMuPDF: {str(e)}")
        raise e
