import os
import io
import re
import logging
from html import unescape
from django.conf import settings
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, HRFlowable, Table, TableStyle
)
from reportlab.pdfgen import canvas

logger = logging.getLogger(__name__)


class NumberedCanvas(canvas.Canvas):
    """Canvas personnalisé pour ajouter un en-tête et un pied de page dynamique avec numérotation 'Page X / Y'."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        width, height = A4
        bottom_margin = 1.0 * cm

        # Pied de page
        self.setFont("Helvetica-Oblique", 8)
        self.setFillColor(colors.HexColor("#6B7280"))
        
        footer_text = "LahaAcademia — Document de corrigé officiel. Tous droits réservés."
        self.drawString(2.0 * cm, bottom_margin, footer_text)
        
        page_str = f"Page {self._pageNumber} / {page_count}"
        self.drawRightString(width - 2.0 * cm, bottom_margin, page_str)
        
        # Ligne sous le pied de page
        self.setStrokeColor(colors.HexColor("#E5E7EB"))
        self.setLineWidth(0.5)
        self.line(2.0 * cm, bottom_margin + 12, width - 2.0 * cm, bottom_margin + 12)
        
        self.restoreState()


def clean_html_for_reportlab(html_text: str) -> str:
    """Nettoie le HTML/Texte copié (ex: depuis Word) pour le rendre compatible avec ReportLab Paragraph."""
    if not html_text:
        return ""
    
    text = unescape(html_text)
    
    # Remplacer les balises de fin de paragraphes/divs par des sauts de ligne
    text = re.sub(r'</p\s*>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'</div\s*>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'</h[1-6]\s*>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'</li\s*>', '\n', text, flags=re.IGNORECASE)
    
    # Supprimer les balises HTML non supportées par ReportLab Paragraph (garder b, i, u, font, sub, sup)
    text = re.sub(r'<(?!/?(b|i|u|font|sub|sup)\b)[^>]+>', '', text)
    
    return text.strip()


def extract_text_from_docx(file_field) -> str:
    """Extrait le texte brut d'un fichier .docx sans dépendances externes (via zipfile & xml)."""
    try:
        import zipfile
        import xml.etree.ElementTree as ET
        file_field.open('rb')
        file_bytes = io.BytesIO(file_field.read())
        file_field.close()
        
        with zipfile.ZipFile(file_bytes) as z:
            xml_content = z.read('word/document.xml')
        
        tree = ET.fromstring(xml_content)
        paragraphs = []
        for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            texts = [t.text for t in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if t.text]
            if texts:
                paragraphs.append("".join(texts))
        return "\n".join(paragraphs)
    except Exception as e:
        logger.warning(f"Erreur d'extraction docx: {e}")
        return ""


def _get_logo_path() -> str:
    """Retourne le chemin absolu vers le logo LahaAcademia (cherche dans static backend puis public frontend)."""
    candidate_paths = [
        os.path.abspath(os.path.join(settings.BASE_DIR, 'static', 'images', 'logo.png')),
        os.path.abspath(os.path.join(settings.BASE_DIR, 'static', 'img', 'logo.png')),
        os.path.abspath(os.path.join(settings.BASE_DIR, '..', 'frontend', 'public', 'logo.png')),
        os.path.abspath(os.path.join(settings.BASE_DIR, 'finances', 'static', 'finances', 'img', 'logo.png')),
    ]
    for path in candidate_paths:
        if os.path.exists(path):
            return path
    return ""


def generate_correction_pdf(resource, output_stream=None) -> bytes:
    """
    Génère un fichier PDF élégant pour le corrigé d'exercice passé en paramètre.
    Contient le logo LahaAcademia et le contenu formaté du corrigé.
    """
    if output_stream is None:
        buffer = io.BytesIO()
    else:
        buffer = output_stream

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2.0 * cm,
        rightMargin=2.0 * cm,
        topMargin=2.0 * cm,
        bottomMargin=2.2 * cm
    )

    styles = getSampleStyleSheet()
    
    color_gold = colors.HexColor("#D4AF37")
    color_dark = colors.HexColor("#111827")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=color_dark,
        spaceAfter=6
    )

    brand_style = ParagraphStyle(
        'BrandTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=color_dark
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=color_dark,
        spaceBefore=14,
        spaceAfter=8
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=10,
        leading=15,
        textColor=color_dark,
        spaceAfter=8
    )

    story = []

    # 1. EN-TÊTE : Logo + Nom de la marque LAHAACADEMIA
    logo_path = _get_logo_path()
    logo_img = None
    if os.path.exists(logo_path):
        try:
            logo_img = Image(logo_path, width=1.6 * cm, height=1.6 * cm)
        except Exception:
            logo_img = None

    brand_text = Paragraph("<b>LAHACADEMIA</b>", brand_style)

    if logo_img:
        header_table = Table([[logo_img, brand_text]], colWidths=[2.0 * cm, 15.0 * cm])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(header_table)
    else:
        story.append(brand_text)

    # Ligne de séparation dorée LahaAcademia
    story.append(HRFlowable(width="100%", thickness=1.5, color=color_gold, spaceBefore=8, spaceAfter=15))

    # 2. TITRE DE LA RESSOURCE (CORRIGÉ)
    story.append(Paragraph(f"CORRIGÉ : {resource.title.upper()}", title_style))
    story.append(Spacer(1, 10))

    # 3. CONTENU DU CORRIGÉ
    raw_content = resource.content or ""
    if isinstance(raw_content, str) and not raw_content.strip():
        raw_content = ""
    if not raw_content and resource.file and str(resource.file.name).lower().endswith('.docx'):
        raw_content = extract_text_from_docx(resource.file)

    if not raw_content:
        raw_content = "Aucun contenu textuel n'a été fourni pour ce corrigé."
    
    # Découpage du texte en paragraphes
    paragraphs = raw_content.split('\n')
    for p_text in paragraphs:
        cleaned = clean_html_for_reportlab(p_text)
        if not cleaned:
            story.append(Spacer(1, 4))
            continue
        
        # Si la ligne ressemble à un titre (ex: "Exercice 1:", "Solution:")
        if re.match(r'^(exercice|question|solution|corrigé|partie|module)\b', cleaned, re.IGNORECASE) or (len(cleaned) < 40 and cleaned.endswith(':')):
            story.append(Paragraph(cleaned, h2_style))
        else:
            story.append(Paragraph(cleaned, body_style))

    # 4. Génération du document PDF
    doc.build(story, canvasmaker=NumberedCanvas)

    if output_stream is None:
        pdf_data = buffer.getvalue()
        buffer.close()
        return pdf_data
    return None
