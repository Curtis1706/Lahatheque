"""
Service d'extraction de texte et de reconnaissance optique de caractères (OCR)
pour la base documentaire légale et les contrats de LAHAThèque.
Conçu pour la haute performance et le zéro blocage serveur.
"""
import io
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# Seuil en caractères en dessous duquel un document est considéré comme un scan
MIN_NATIVE_CHARS_THRESHOLD = 50

# Nombre maximum de caractères stockés dans l'index de recherche pour préserver la RAM
MAX_INDEXED_TEXT_LENGTH = 50000


def extract_text_from_document(
    file_bytes: bytes,
    file_name: str,
    max_pages: int = 50,
    enable_ocr_fallback: bool = True,
) -> Dict[str, Any]:
    """
    Extrait le texte intégral d'un fichier PDF ou Word.
    Exécute en premier lieu l'extraction native ultra-rapide (PyMuPDF).
    Si le document est un scan (< 50 caractères), délègue à l'OCR optique.

    Returns:
        Dict contenant text, engine, confidence, is_scanned, page_count
    """
    lower_name = (file_name or "").lower()
    
    # 1. Traitement des fichiers Word (.docx)
    if lower_name.endswith(".docx"):
        return _extract_from_docx(file_bytes)

    # 2. Traitement des fichiers PDF (.pdf)
    if lower_name.endswith(".pdf") or file_bytes.startswith(b"%PDF"):
        return _extract_from_pdf(
            file_bytes=file_bytes,
            max_pages=max_pages,
            enable_ocr_fallback=enable_ocr_fallback,
        )

    # 3. Fichier texte simple ou autre format
    try:
        decoded_text = file_bytes.decode("utf-8", errors="ignore")[:MAX_INDEXED_TEXT_LENGTH]
        return {
            "text": decoded_text.strip(),
            "engine": "utf8_plain",
            "confidence": 1.0,
            "is_scanned": False,
            "page_count": 1,
        }
    except Exception as err:
        logger.warning(f"[OCR] Format non reconnu pour {file_name}: {err}")
        return {
            "text": "",
            "engine": "unknown",
            "confidence": 0.0,
            "is_scanned": False,
            "page_count": 0,
        }


def _extract_from_docx(file_bytes: bytes) -> Dict[str, Any]:
    """Extrait le texte d'un document Word .docx en mémoire."""
    try:
        from docx import Document as DocxDocument
        doc = DocxDocument(io.BytesIO(file_bytes))
        paragraphs: List[str] = [p.text for p in doc.paragraphs if p.text]
        full_text = "\n".join(paragraphs)[:MAX_INDEXED_TEXT_LENGTH]
        return {
            "text": full_text.strip(),
            "engine": "python_docx",
            "confidence": 1.0,
            "is_scanned": False,
            "page_count": len(doc.sections) or 1,
        }
    except Exception as err:
        logger.warning(f"[OCR] Erreur lecture DOCX: {err}")
        return {
            "text": "",
            "engine": "docx_error",
            "confidence": 0.0,
            "is_scanned": False,
            "page_count": 0,
        }


def _extract_from_pdf(
    file_bytes: bytes,
    max_pages: int,
    enable_ocr_fallback: bool,
) -> Dict[str, Any]:
    """
    Extrait le texte d'un PDF via PyMuPDF.
    Si le texte est insuffisant, bascule vers Tesseract OCR page par page.
    """
    try:
        import fitz  # PyMuPDF
    except ImportError:
        logger.error("[OCR] PyMuPDF (fitz) n'est pas installé dans l'environnement.")
        return {
            "text": "",
            "engine": "fitz_missing",
            "confidence": 0.0,
            "is_scanned": False,
            "page_count": 0,
        }

    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        page_count = len(doc)
        limit_pages = min(page_count, max_pages)

        # Extraction native page par page (très rapide, < 5ms par page)
        native_pages_text: List[str] = []
        for i in range(limit_pages):
            page_text = doc[i].get_text() or ""
            if page_text.strip():
                native_pages_text.append(page_text.strip())

        full_native_text = "\n".join(native_pages_text)

        # Si le texte extrait dépasse le seuil, le PDF est natif et parfait !
        if len(full_native_text.strip()) >= MIN_NATIVE_CHARS_THRESHOLD:
            doc.close()
            return {
                "text": full_native_text[:MAX_INDEXED_TEXT_LENGTH].strip(),
                "engine": "pymupdf_native",
                "confidence": 1.0,
                "is_scanned": False,
                "page_count": page_count,
            }

        # Sinon, le document est un scan ou une pure image
        logger.info(f"[OCR] Scan détecté ({len(full_native_text.strip())} car.). Déclenchement OCR.")

        if not enable_ocr_fallback:
            doc.close()
            return {
                "text": full_native_text.strip(),
                "engine": "scanned_pending",
                "confidence": 0.1,
                "is_scanned": True,
                "page_count": page_count,
            }

        # Exécution de l'OCR page par page sur les pages scannées
        ocr_text = _run_tesseract_on_pdf_pages(doc, max_pages_to_ocr=min(limit_pages, 20))
        doc.close()

        final_text = ocr_text if len(ocr_text) > len(full_native_text) else full_native_text
        return {
            "text": final_text[:MAX_INDEXED_TEXT_LENGTH].strip(),
            "engine": "tesseract_ocr" if ocr_text else "native_low_chars",
            "confidence": 0.85 if ocr_text else 0.3,
            "is_scanned": True,
            "page_count": page_count,
        }

    except Exception as err:
        logger.error(f"[OCR] Échec extraction PDF: {err}")
        return {
            "text": "",
            "engine": "pdf_error",
            "confidence": 0.0,
            "is_scanned": False,
            "page_count": 0,
        }


def _run_tesseract_on_pdf_pages(doc: Any, max_pages_to_ocr: int = 15) -> str:
    """
    Rend chaque page scannée sous forme d'image pixmap en mémoire
    et exécute Tesseract OCR sans jamais saturer le disque.
    """
    try:
        import pytesseract
        from PIL import Image
    except ImportError:
        logger.warning("[OCR] pytesseract ou PIL non disponible pour le fallback OCR.")
        return ""

    ocr_snippets: List[str] = []
    total_pages = min(len(doc), max_pages_to_ocr)

    for i in range(total_pages):
        try:
            page = doc[i]
            # Rendu en résolution standard 150 DPI pour balance parfaite vitesse / lisibilité
            pix = page.get_pixmap(dpi=150)
            img_bytes = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_bytes))

            # Exécution de Tesseract en français avec repli multilingue
            text = pytesseract.image_to_string(img, lang="fra+eng")
            if text and text.strip():
                ocr_snippets.append(text.strip())
        except Exception as ocr_page_err:
            logger.debug(f"[OCR] Page {i+1} non OCRisable: {ocr_page_err}")
            continue

    return "\n".join(ocr_snippets)
