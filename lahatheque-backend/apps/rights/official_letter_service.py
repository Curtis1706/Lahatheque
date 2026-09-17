"""
Service de génération et fusion de courriers officiels sur papier à en-tête LAHAThèque.
Utilise PyMuPDF (fitz) pour cloner le gabarit officiel et injecter le corps de lettre rédigé.
Conforme à la spécification specs/008-courrier-redevances-relances/spec.md
"""
import os
import io
import fitz  # PyMuPDF
from typing import Optional
from django.conf import settings
from django.core.files.base import ContentFile
from django.utils import timezone


class OfficialLetterPdfService:
    """
    Service dédié à l'injection dynamique et au scellement de courriers administratifs
    et financiers sur le papier à en-tête officiel LAHAThèque.
    """

    _cached_template_path: Optional[str] = None

    @classmethod
    def get_template_pdf_path(cls) -> str:
        """Résout le chemin absolu vers Lahatheque-PapierEntete-SansNumero.pdf."""
        if cls._cached_template_path and os.path.exists(cls._cached_template_path):
            return cls._cached_template_path

        base_dir = getattr(settings, 'BASE_DIR', None)
        static_root = getattr(settings, 'STATIC_ROOT', None)

        candidates = [
            os.path.join(base_dir, "static", "Lahatheque-PapierEntete-SansNumero.pdf") if base_dir else None,
            os.path.join(static_root, "Lahatheque-PapierEntete-SansNumero.pdf") if static_root else None,
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "static", "Lahatheque-PapierEntete-SansNumero.pdf")),
            "e:/Lahatheque/lahatheque-backend/static/Lahatheque-PapierEntete-SansNumero.pdf",
            "/app/static/Lahatheque-PapierEntete-SansNumero.pdf",
            "/app/staticfiles/Lahatheque-PapierEntete-SansNumero.pdf",
        ]

        for p in candidates:
            if p and os.path.exists(p):
                cls._cached_template_path = p
                return p

        raise FileNotFoundError(
            "Le gabarit officiel 'Lahatheque-PapierEntete-SansNumero.pdf' est introuvable dans les dossiers statiques."
        )

    @classmethod
    def generate_pdf_bytes(cls, courrier) -> bytes:
        """
        Génère en mémoire le document PDF complet du courrier fusionné sur le gabarit officiel.
        """
        template_path = cls.get_template_pdf_path()
        template_doc = fitz.open(template_path)

        # Création du document final
        out_doc = fitz.open()

        # Palette de couleurs LAHAThèque
        navy = (27/255, 42/255, 78/255)
        gold = (176/255, 141/255, 66/255)
        dark_gray = (50/255, 50/255, 50/255)
        border_gray = (220/255, 225/255, 235/255)

        # Insérer la première page depuis le gabarit
        out_doc.insert_pdf(template_doc, from_page=0, to_page=0)
        page = out_doc[0]

        # 1. Date et Référence (Zone supérieure sous l'en-tête, y: 110 à 155)
        now_dt = courrier.validated_at or courrier.created_at or timezone.now()
        date_str = f"Cotonou, le {now_dt.strftime('%d/%m/%Y')}"
        ref_str = f"Réf. : {courrier.reference}"

        page.insert_text(fitz.Point(65, 125), ref_str, fontsize=9, fontname="helv", color=navy)
        
        d_len = fitz.get_text_length(date_str, fontname="helv", fontsize=9.5)
        page.insert_text(fitz.Point(530 - d_len, 125), date_str, fontsize=9.5, fontname="helv", color=dark_gray)

        # 2. Encadré Destinataire (À droite, y: 140 à 185)
        dest_rect = fitz.Rect(310, 138, 530, 185)
        page.draw_rect(dest_rect, color=border_gray, fill=(248/255, 249/255, 252/255))
        page.insert_text(fitz.Point(322, 155), "Destinataire :", fontsize=8.5, fontname="helv", color=gold)
        page.insert_text(fitz.Point(322, 169), str(courrier.recipient_name)[:38], fontsize=9.5, fontname="helv", color=navy)
        if courrier.recipient_email:
            page.insert_text(fitz.Point(322, 180), str(courrier.recipient_email)[:40], fontsize=8, fontname="helv", color=dark_gray)

        # 3. Objet Officiel (y: 205 à 225)
        obj_text = f"Objet : {courrier.subject}"
        page.draw_rect(fitz.Rect(65, 198, 530, 222), color=navy, fill=(244/255, 246/255, 250/255))
        page.insert_text(fitz.Point(75, 214), obj_text[:95], fontsize=9.5, fontname="helv", color=navy)

        # 4. Corps du message (Zone utile : Rect(65, 235, 530, 765))
        body_text = courrier.body_text or ""
        body_rect = fitz.Rect(65, 235, 530, 765)

        # Insertion avec gestion du débordement (multi-pages)
        # insert_textbox renvoie la hauteur restante non insérée (< 0 s'il reste du texte)
        rc = page.insert_textbox(
            body_rect,
            body_text,
            fontsize=9.5,
            fontname="helv",
            color=dark_gray,
            lineheight=1.35,
            align=fitz.TEXT_ALIGN_LEFT
        )

        # Si le texte est très long et déborde, on crée une seconde page avec le gabarit
        if rc < 0:
            remaining_text = body_text[int(len(body_text) * 0.7):] # Approximation résiduelle
            out_doc.insert_pdf(template_doc, from_page=0, to_page=0)
            page2 = out_doc[1]
            page2_rect = fitz.Rect(65, 125, 530, 765)
            page2.insert_textbox(
                page2_rect,
                remaining_text,
                fontsize=9.5,
                fontname="helv",
                color=dark_gray,
                lineheight=1.35,
                align=fitz.TEXT_ALIGN_LEFT
            )

        # Sécurisation & Scellement (si Validé ou Envoyé)
        if courrier.status in ['validated', 'sent']:
            watermark_text = f"CERTIFIÉ CONFORME — LAHA ÉDITIONS S.A. [{courrier.reference}]"
            # Mention de certification discrète au-dessus du pied de page
            page.insert_text(
                fitz.Point(65, 775),
                watermark_text,
                fontsize=7.5,
                fontname="helv",
                color=gold
            )

        buffer = io.BytesIO()
        out_doc.save(buffer, deflate=True, garbage=3)
        out_doc.close()
        template_doc.close()
        return buffer.getvalue()

    @classmethod
    def seal_and_save_pdf(cls, courrier) -> str:
        """
        Génère le document PDF scellé définitif, l'enregistre dans le champ pdf_file du modèle,
        et sauvegarde le modèle en base.
        """
        pdf_bytes = cls.generate_pdf_bytes(courrier)
        filename = f"{courrier.reference.lower().replace('-', '_')}.pdf"
        courrier.pdf_file.save(filename, ContentFile(pdf_bytes), save=False)
        courrier.save(update_fields=['pdf_file', 'updated_at'])
        return courrier.pdf_file.url if courrier.pdf_file else ""
