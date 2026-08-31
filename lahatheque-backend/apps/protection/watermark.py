"""
Moteur de filigrane visible et tatouage invisible pour documents PDF via PyMuPDF (fitz).
Conforme aux spécifications DRM de LAHAThèque (docs/drm/01-architecture-cible.md).
"""

import hashlib
import json
import logging
import math
from typing import Any, Dict, Optional
import fitz # PyMuPDF

logger = logging.getLogger(__name__)


class WatermarkEngine:
    """
    Service responsable de l'application des filigranes visibles et invisibles
    sur les flux de documents PDF en mémoire serveur.
    """

    @staticmethod
    def apply_watermark(
        pdf_bytes: bytes,
        user_info: Dict[str, Any],
        config: Optional[Any] = None
    ) -> bytes:
        """
        Applique le filigrane visible et invisible sur chaque page du PDF en mémoire.

        Args:
            pdf_bytes: Flux binaire du PDF d'origine.
            user_info: Dictionnaire contenant nom, email, ip, user_id, device_fingerprint, is_partner, title, id.
            config: Instance de ProtectionConfig, GlobalDrmConfig ou dictionnaire de configuration.

        Returns:
            bytes: Flux binaire du PDF filigrané et protégé.
        """
        if not pdf_bytes:
            return pdf_bytes

        # Si aucune config explicite fournie, charger la configuration globale singleton
        from apps.protection.models import GlobalDrmConfig
        global_config = GlobalDrmConfig.get_singleton()

        is_partner_session = bool(user_info.get("is_partner", False))

        # Récupération stricte depuis GlobalDrmConfig (ou config passée en paramètre)
        if is_partner_session:
            template = (
                getattr(config, "watermark_template", None)
                if config and hasattr(config, "watermark_template")
                else getattr(global_config, "watermark_template", "")
            ) or ""
            subtext_template = ""
        else:
            template = (
                getattr(config, "watermark_laha_template", None)
                if config and hasattr(config, "watermark_laha_template")
                else getattr(global_config, "watermark_laha_template", "")
            ) or ""
            
            # Le sous-texte est 100% optionnel : s'il est vide, aucun texte secondaire n'est injecté
            raw_subtext = (
                getattr(config, "watermark_laha_subtext", None)
                if config and hasattr(config, "watermark_laha_subtext")
                else getattr(global_config, "watermark_laha_subtext", "")
            )
            subtext_template = str(raw_subtext or "").strip()

        # Opacité et Position configurées par l'administrateur
        opacity_val = getattr(global_config, "watermark_opacity", None)
        if opacity_val is None and config:
            opacity_val = getattr(config, "watermark_opacity", None)
        try:
            opacity = float(opacity_val) if opacity_val is not None else 0.50
        except (ValueError, TypeError):
            opacity = 0.50

        position = (
            getattr(global_config, "watermark_position", None)
            or getattr(config, "watermark_position", None)
            or "footer"
        )
        invisible_enabled = getattr(
            global_config, "invisible_watermark_enabled",
            getattr(config, "invisible_watermark_enabled", True)
        )

        # Construction du texte du filigrane
        nom = user_info.get("nom") or user_info.get("user_name") or "Lecteur Authentifié"
        email = user_info.get("email") or user_info.get("user_email") or ""
        ip = user_info.get("ip") or user_info.get("ip_address") or "127.0.0.1"
        user_id = str(user_info.get("user_id") or "0000-0000")
        titre = user_info.get("title") or user_info.get("titre") or "Document"
        doc_id = user_info.get("id") or user_info.get("book_id") or ""

        try:
            watermark_text = template.format(nom=nom, email=email, ip=ip, titre=titre, title=titre, id=doc_id)
        except Exception:
            watermark_text = template

        subtext = ""
        if subtext_template:
            try:
                subtext = subtext_template.format(nom=nom, email=email, ip=ip, titre=titre, title=titre, id=doc_id)
            except Exception:
                subtext = subtext_template

        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        except Exception as e:
            logger.error(f"Erreur lors de l'ouverture du PDF avec PyMuPDF: {e}")
            return pdf_bytes

        # Mode Haute Sécurité (Anti-Extraction) : Conversion en images HD sans couche texte brute
        profil = getattr(global_config, "profil_default", getattr(config, "profil", "standard")) if global_config else "standard"
        if profil == "renforce":
            try:
                raster_doc = fitz.open()
                for p in doc:
                    pix = p.get_pixmap(dpi=150)
                    new_page = raster_doc.new_page(width=p.rect.width, height=p.rect.height)
                    new_page.insert_image(p.rect, pixmap=pix)
                doc.close()
                doc = raster_doc
            except Exception as r_err:
                logger.warning(f"Erreur rastérisation anti-extraction (fallback document standard): {r_err}")

        # Empreinte cryptographique pour le tatouage invisible
        invisible_payload = json.dumps({
            "uid": user_id,
            "em": email,
            "ip": ip,
            "dev": user_info.get("device_fingerprint", ""),
            "sig": hashlib.sha256(f"{user_id}:{email}:{ip}".encode()).hexdigest()[:16]
        })

        for page in doc:
            rect = page.rect
            page_width = rect.width
            page_height = rect.height

            # 1. Filigrane Visible (Position & Opacité conformes aux réglages admin)
            if position == "header":
                font_size = 9.0
                text_len = fitz.get_text_length(watermark_text, fontname="helv", fontsize=font_size)
                start_x = max(24.0, (page_width - text_len) / 2)
                y_main = 22 if not subtext else 18
                page.insert_text(
                    fitz.Point(start_x, y_main),
                    watermark_text,
                    fontsize=font_size,
                    color=(0.25, 0.25, 0.30),
                    fill_opacity=opacity
                )
                if subtext:
                    sub_size = 7.5
                    sub_len = fitz.get_text_length(subtext, fontname="helv", fontsize=sub_size)
                    sub_x = max(24.0, (page_width - sub_len) / 2)
                    page.insert_text(
                        fitz.Point(sub_x, 28),
                        subtext,
                        fontsize=sub_size,
                        color=(0.35, 0.35, 0.40),
                        fill_opacity=opacity * 0.85
                    )

            elif position == "footer":
                font_size = 9.0
                text_len = fitz.get_text_length(watermark_text, fontname="helv", fontsize=font_size)
                start_x = max(24.0, (page_width - text_len) / 2)
                y_main = page_height - 24 if subtext else page_height - 18
                page.insert_text(
                    fitz.Point(start_x, y_main),
                    watermark_text,
                    fontsize=font_size,
                    color=(0.25, 0.25, 0.30),
                    fill_opacity=opacity
                )
                if subtext:
                    sub_size = 7.5
                    sub_len = fitz.get_text_length(subtext, fontname="helv", fontsize=sub_size)
                    sub_x = max(24.0, (page_width - sub_len) / 2)
                    page.insert_text(
                        fitz.Point(sub_x, page_height - 14),
                        subtext,
                        fontsize=sub_size,
                        color=(0.35, 0.35, 0.40),
                        fill_opacity=opacity * 0.85
                    )

            else:  # "diagonal"
                theta = math.degrees(math.atan2(page_height, page_width))
                diag_len = math.sqrt(page_width**2 + page_height**2)
                font_size = max(10.0, min(14.0, float(page_width / 42)))
                text_len = fitz.get_text_length(watermark_text, fontname="helv", fontsize=font_size)

                # Ajustement dynamique de la taille pour que le texte ne dépasse JAMAIS 70% de la diagonale
                max_allowed_len = diag_len * 0.70
                if text_len > max_allowed_len and text_len > 0:
                    font_size = max(8.5, font_size * (max_allowed_len / text_len))
                    text_len = fitz.get_text_length(watermark_text, fontname="helv", fontsize=font_size)

                center_point = fitz.Point(page_width / 2, page_height / 2)
                start_point = fitz.Point(page_width / 2 - text_len / 2, page_height / 2 + font_size * 0.35)

                # Insertion parfaitement centrée le long de la diagonale ascendante
                page.insert_text(
                    start_point,
                    watermark_text,
                    fontsize=font_size,
                    color=(0.35, 0.35, 0.40),
                    fill_opacity=opacity,
                    morph=(center_point, fitz.Matrix(theta))
                )
                if subtext:
                    sub_size = max(7.0, font_size * 0.75)
                    sub_len = fitz.get_text_length(subtext, fontname="helv", fontsize=sub_size)
                    sub_start = fitz.Point(page_width / 2 - sub_len / 2, page_height / 2 + font_size * 0.35 + sub_size * 1.5)
                    page.insert_text(
                        sub_start,
                        subtext,
                        fontsize=sub_size,
                        color=(0.40, 0.40, 0.45),
                        fill_opacity=opacity * 0.85,
                        morph=(center_point, fitz.Matrix(theta))
                    )

            # 2. Tatouage Invisible (stéganographie dans une zone neutre)
            if invisible_enabled:
                page.insert_text(
                    fitz.Point(1, page_height - 1),
                    f"LTQ:{invisible_payload}",
                    fontsize=1,
                    color=(1.0, 1.0, 1.0),
                    fill_opacity=0.001
                )

        # Mise à jour des métadonnées internes du PDF
        if invisible_enabled:
            metadata = doc.metadata or {}
            metadata["producer"] = "LAHATheque DRM Engine v3.2"
            metadata["keywords"] = f"{metadata.get('keywords', '')} LTQ_SIG:{hashlib.sha256(invisible_payload.encode()).hexdigest()}"
            doc.set_metadata(metadata)

        # Sérialisation en mémoire
        output_bytes = doc.tobytes(garbage=3, deflate=True)
        doc.close()
        return output_bytes
