"""
Service d'extraction de texte et de reconnaissance optique de caractères (OCR)
pour la base documentaire légale et les contrats de LAHAThèque.
Conçu pour la haute performance, la traçabilité complète et le zéro blocage serveur.
"""
import io
import time
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
        Dict contenant text, engine, confidence, is_scanned, page_count, duration_seconds
    """
    start_time = time.perf_counter()
    file_size_kb = len(file_bytes) / 1024.0
    lower_name = (file_name or "").lower()

    logger.info(
        f"[OCR Service] Debut extraction pour '{file_name}' ({file_size_kb:.1f} Ko, max_pages={max_pages}, ocr_fallback={enable_ocr_fallback})"
    )

    # 1. Traitement des fichiers Word (.docx)
    if lower_name.endswith(".docx"):
        res = _extract_from_docx(file_bytes)
        elapsed = time.perf_counter() - start_time
        res["duration_seconds"] = round(elapsed, 3)
        logger.info(f"[OCR Service] DOCX traite en {elapsed:.2f}s : {len(res['text'])} car. extraits.")
        return res

    # 2. Traitement des fichiers PDF (.pdf)
    if lower_name.endswith(".pdf") or file_bytes.startswith(b"%PDF"):
        res = _extract_from_pdf(
            file_bytes=file_bytes,
            max_pages=max_pages,
            enable_ocr_fallback=enable_ocr_fallback,
        )
        elapsed = time.perf_counter() - start_time
        res["duration_seconds"] = round(elapsed, 3)
        logger.info(
            f"[OCR Service] PDF traite en {elapsed:.2f}s : {len(res['text'])} car. extraits, moteur={res['engine']}, is_scanned={res['is_scanned']}."
        )
        return res

    # 3. Fichier texte simple ou autre format
    try:
        decoded_text = file_bytes.decode("utf-8", errors="ignore")[:MAX_INDEXED_TEXT_LENGTH]
        elapsed = time.perf_counter() - start_time
        logger.info(f"[OCR Service] Fichier texte brut decode en {elapsed:.2f}s : {len(decoded_text)} car.")
        return {
            "text": decoded_text.strip(),
            "engine": "utf8_plain",
            "confidence": 1.0,
            "is_scanned": False,
            "page_count": 1,
            "duration_seconds": round(elapsed, 3),
        }
    except Exception as err:
        logger.warning(f"[OCR Service ERREUR] Format non reconnu pour '{file_name}': {err}")
        return {
            "text": "",
            "engine": "unknown",
            "confidence": 0.0,
            "is_scanned": False,
            "page_count": 0,
            "duration_seconds": 0.0,
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
        logger.warning(f"[OCR Service ERREUR] Lecture DOCX impossible: {err}")
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
    Si le texte est insuffisant (< 50 car.), bascule vers Tesseract OCR page par page.
    """
    try:
        import fitz  # PyMuPDF
    except ImportError:
        logger.error("[OCR Service ERREUR CRITIQUE] PyMuPDF (fitz) absent du runtime. Verifier requirements.")
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

        logger.info(f"[OCR Service] PDF ouvert avec succes : {page_count} pages detectees (limite traitee: {limit_pages}).")

        # 1. Extraction native page par page (PyMuPDF)
        native_pages_text: List[str] = []
        for i in range(limit_pages):
            page_text = doc[i].get_text() or ""
            if page_text.strip():
                native_pages_text.append(page_text.strip())

        full_native_text = "\n".join(native_pages_text)
        native_chars_count = len(full_native_text.strip())

        logger.info(f"[OCR Service] Extraction native PyMuPDF terminee : {native_chars_count} caracteres trouves sur {limit_pages} pages.")

        # Si le texte extrait dépasse le seuil, le PDF est natif et prêt !
        if native_chars_count >= MIN_NATIVE_CHARS_THRESHOLD:
            doc.close()
            logger.info(f"[OCR Service] PDF identifie comme natif informatique ({native_chars_count} car. >= {MIN_NATIVE_CHARS_THRESHOLD}). Indexation directe.")
            return {
                "text": full_native_text[:MAX_INDEXED_TEXT_LENGTH].strip(),
                "engine": "pymupdf_native",
                "confidence": 1.0,
                "is_scanned": False,
                "page_count": page_count,
            }

        # 2. Le document a moins de 50 caractères : c'est un scan ou une image
        logger.warning(
            f"[OCR Service] Scan ou image detecte ({native_chars_count} car. natifs < seuil {MIN_NATIVE_CHARS_THRESHOLD})."
        )

        if not enable_ocr_fallback:
            doc.close()
            logger.info("[OCR Service] OCR fallback desactive pour cet appel (analyse asynchrone requise).")
            return {
                "text": full_native_text.strip(),
                "engine": "scanned_pending",
                "confidence": 0.1,
                "is_scanned": True,
                "page_count": page_count,
            }

        # 3. Exécution de l'OCR page par page
        logger.info(f"[OCR Service] Demarrage Tesseract OCR page par page sur les {min(limit_pages, 20)} premieres pages...")
        ocr_text = _run_tesseract_on_pdf_pages(doc, max_pages_to_ocr=min(limit_pages, 20))
        doc.close()

        final_text = ocr_text if len(ocr_text) > len(full_native_text) else full_native_text
        ocr_len = len(final_text.strip())

        logger.info(f"[OCR Service] OCR Tesseract acheve : {ocr_len} caracteres reconnus.")

        return {
            "text": final_text[:MAX_INDEXED_TEXT_LENGTH].strip(),
            "engine": "tesseract_ocr" if ocr_text else "native_low_chars",
            "confidence": 0.85 if ocr_text else 0.3,
            "is_scanned": True,
            "page_count": page_count,
        }

    except Exception as err:
        logger.error(f"[OCR Service ERREUR] Echec lors de la lecture du PDF : {err}", exc_info=True)
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
    except ImportError as imp_err:
        logger.error(f"[OCR Service ERREUR] pytesseract ou Pillow absent du container : {imp_err}")
        return ""

    ocr_snippets: List[str] = []
    total_pages = min(len(doc), max_pages_to_ocr)

    for i in range(total_pages):
        page_t0 = time.perf_counter()
        try:
            page = doc[i]
            # Rendu en résolution standard 150 DPI pour balance parfaite vitesse / lisibilité
            pix = page.get_pixmap(dpi=150)
            img_bytes = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_bytes))

            # Exécution de Tesseract en français avec repli multilingue
            text = pytesseract.image_to_string(img, lang="fra+eng")
            page_dur = time.perf_counter() - page_t0

            if text and text.strip():
                clean_txt = text.strip()
                ocr_snippets.append(clean_txt)
                logger.info(f"[OCR Service] Page {i+1}/{total_pages} traitee en {page_dur:.2f}s ({len(clean_txt)} car. reconnus).")
            else:
                logger.info(f"[OCR Service] Page {i+1}/{total_pages} traitee en {page_dur:.2f}s (aucun texte detecte).")
        except Exception as ocr_page_err:
            logger.warning(f"[OCR Service ATTENTION] Page {i+1} OCR impossible : {ocr_page_err}")
            continue

    total_extracted = "\n".join(ocr_snippets)
    logger.info(f"[OCR Service] Synthese Tesseract : {len(ocr_snippets)}/{total_pages} pages ont produit {len(total_extracted)} car.")
    return total_extracted

