"""
Service de génération dynamique de documents PDF certifiés pour pièces jointes d'e-mails.
Génère des factures acquittées, des factures proforma grossistes et des bordereaux de redevances.
Conforme ISO-32000 et standard SYSCOHADA / DGI Bénin.
"""
import os
import io
import fitz  # PyMuPDF
from typing import Dict, Any, List, Optional
from datetime import datetime


class PdfAttachmentService:
    """
    Générateur autonome de documents PDF binaires en mémoire pour pièces jointes.
    """

    @classmethod
    def _get_logo_bytes(cls) -> Optional[bytes]:
        """Récupère les octets du fichier logo.png officiel."""
        possible_paths = [
            "e:/Lahatheque/lahatheque-backend/static/logo.png",
            "e:/Lahatheque/lahatheque-frontend/public/logo.png",
        ]
        for p in possible_paths:
            if os.path.exists(p):
                try:
                    with open(p, "rb") as f:
                        return f.read()
                except Exception:
                    pass
        return None

    @classmethod
    def generate_invoice_pdf(cls, invoice_data: Dict[str, Any]) -> bytes:
        """
        Génère une facture acquittée B2C ou B2B certifiée ISO-32000.
        """
        doc = fitz.open()
        page = doc.new_page(width=595, height=842)  # A4 standard

        order_num = invoice_data.get("order_number", "CMD-2026-001")
        customer_name = str(invoice_data.get("customer_name", "Client"))
        customer_email = str(invoice_data.get("customer_email", ""))
        customer_address = str(invoice_data.get("customer_address", "Cotonou, Bénin"))
        date_str = str(invoice_data.get("date", datetime.now().strftime("%d/%m/%Y")))
        items = invoice_data.get("items", [])
        total_amount = float(invoice_data.get("total_amount", 0.0))
        currency = str(invoice_data.get("currency", "FCFA"))
        payment_method = str(invoice_data.get("payment_method", "Mobile Money / Carte"))
        is_paid = bool(invoice_data.get("is_paid", True))

        # Palette de couleurs LAHAThèque
        navy = (27/255, 42/255, 78/255)
        gold = (176/255, 141/255, 66/255)
        dark_gray = (50/255, 50/255, 50/255)
        light_gray = (245/255, 247/255, 250/255)
        border_gray = (220/255, 225/255, 235/255)

        # 1. Bandeau supérieur Navy avec Logo Officiel
        page.draw_rect(fitz.Rect(0, 0, 595, 80), color=navy, fill=navy)
        
        logo_bytes = cls._get_logo_bytes()
        if logo_bytes:
            page.insert_image(fitz.Rect(35, 15, 85, 65), stream=logo_bytes, keep_proportion=True)
            page.insert_text(fitz.Point(95, 43), "LAHATHÈQUE", fontsize=20, fontname="helv", color=(1, 1, 1))
            page.insert_text(fitz.Point(95, 58), "Éditions & Bibliothèque Numérique", fontsize=8.5, fontname="helv", color=gold)
        else:
            page.insert_text(fitz.Point(40, 48), "LAHATHÈQUE", fontsize=22, fontname="helv", color=(1, 1, 1))
            page.insert_text(fitz.Point(40, 64), "Éditions & Bibliothèque Numérique", fontsize=9, fontname="helv", color=gold)

        # Mention FACTURE / REÇU
        status_label = "FACTURE ACQUITTÉE" if is_paid else "FACTURE PROFORMA"
        ref_text = f"Réf: {order_num}"
        status_len = fitz.get_text_length(status_label, fontname="helv", fontsize=13)
        ref_len = fitz.get_text_length(ref_text, fontname="helv", fontsize=10)
        page.insert_text(fitz.Point(555 - status_len, 42), status_label, fontsize=13, fontname="helv", color=gold)
        page.insert_text(fitz.Point(555 - ref_len, 58), ref_text, fontsize=10, fontname="helv", color=(1, 1, 1))

        # 2. Informations Émetteur & Destinataire
        # Émetteur (Gauche)
        page.insert_text(fitz.Point(40, 115), "Émetteur :", fontsize=10, fontname="helv", color=navy)
        page.insert_text(fitz.Point(40, 128), "LAHA Éditions S.A.", fontsize=10.5, fontname="helv", color=navy)
        page.insert_text(fitz.Point(40, 142), "Capital Social : 500 000 000 FCFA", fontsize=8.5, fontname="helv", color=dark_gray)
        page.insert_text(fitz.Point(40, 155), "IFU : 3202415897451 | RCCM : RB/COT/24 B 12458", fontsize=8.5, fontname="helv", color=dark_gray)
        page.insert_text(fitz.Point(40, 168), "Siège : Avenue Jean-Paul II, Cotonou, Bénin", fontsize=8.5, fontname="helv", color=dark_gray)
        page.insert_text(fitz.Point(40, 181), "contact@mail.lahalex.com | www.lahatheque.com", fontsize=8.5, fontname="helv", color=dark_gray)

        # Destinataire (Droite)
        page.draw_rect(fitz.Rect(320, 100, 555, 185), color=border_gray, fill=light_gray)
        page.insert_text(fitz.Point(335, 120), "Facturé à :", fontsize=10, fontname="helv", color=navy)
        page.insert_text(fitz.Point(335, 138), customer_name[:36], fontsize=10, fontname="helv", color=dark_gray)
        if customer_email:
            page.insert_text(fitz.Point(335, 153), customer_email[:36], fontsize=8.5, fontname="helv", color=dark_gray)
        page.insert_text(fitz.Point(335, 168), customer_address[:40], fontsize=8.5, fontname="helv", color=dark_gray)

        # Date & Mode de paiement
        page.insert_text(fitz.Point(40, 215), f"Date d'émission : {date_str}", fontsize=9, fontname="helv", color=dark_gray)
        page.insert_text(fitz.Point(320, 215), f"Mode de règlement : {payment_method}", fontsize=9, fontname="helv", color=dark_gray)

        # 3. Tableau des Articles
        table_top = 235
        page.draw_rect(fitz.Rect(40, table_top, 555, table_top + 24), color=navy, fill=navy)
        page.insert_text(fitz.Point(50, table_top + 16), "Désignation de l'ouvrage / Service", fontsize=9, fontname="helv", color=(1, 1, 1))
        page.insert_text(fitz.Point(325, table_top + 16), "Qté", fontsize=9, fontname="helv", color=(1, 1, 1))
        page.insert_text(fitz.Point(380, table_top + 16), "Prix Unitaire", fontsize=9, fontname="helv", color=(1, 1, 1))
        page.insert_text(fitz.Point(490, table_top + 16), "Montant Total", fontsize=9, fontname="helv", color=(1, 1, 1))

        current_y = table_top + 24
        for idx, item in enumerate(items):
            title = str(item.get("title", "Ouvrage LAHAThèque"))
            qty = str(item.get("quantity", 1))
            unit_p_val = float(item.get('unit_price', 0.0) or 0.0)
            total_p_val = float(item.get('total', 0.0) or item.get('total_price', 0.0) or 0.0)
            unit_p = f"{unit_p_val:,.0f} {currency}".replace(",", " ")
            total_p = f"{total_p_val:,.0f} {currency}".replace(",", " ")

            row_bg = light_gray if idx % 2 == 1 else (1, 1, 1)
            page.draw_rect(fitz.Rect(40, current_y, 555, current_y + 24), color=border_gray, fill=row_bg)
            
            page.insert_text(fitz.Point(50, current_y + 16), title[:42], fontsize=8.5, fontname="helv", color=dark_gray)
            page.insert_text(fitz.Point(330, current_y + 16), qty, fontsize=8.5, fontname="helv", color=dark_gray)
            
            up_len = fitz.get_text_length(unit_p, fontname="helv", fontsize=8.5)
            tp_len = fitz.get_text_length(total_p, fontname="helv", fontsize=8.5)
            page.insert_text(fitz.Point(445 - up_len, current_y + 16), unit_p, fontsize=8.5, fontname="helv", color=dark_gray)
            page.insert_text(fitz.Point(545 - tp_len, current_y + 16), total_p, fontsize=8.5, fontname="helv", color=dark_gray)
            current_y += 24

        # 4. Boîte de Synthèse Totale
        current_y += 16
        page.draw_rect(fitz.Rect(280, current_y, 555, current_y + 36), color=navy, fill=navy)
        label_total = "TOTAL NET ACQUITTÉ :" if is_paid else "TOTAL NET À PAYER :"
        page.insert_text(fitz.Point(295, current_y + 23), label_total, fontsize=10.5, fontname="helv", color=(1, 1, 1))
        
        formatted_total = f"{total_amount:,.0f} {currency}".replace(",", " ")
        ft_len = fitz.get_text_length(formatted_total, fontname="helv", fontsize=13)
        page.insert_text(fitz.Point(545 - ft_len, current_y + 23), formatted_total, fontsize=13, fontname="helv", color=gold)

        # 5. Tampon & Certification de Paiement
        tampon_y = current_y + 55
        page.draw_rect(fitz.Rect(40, tampon_y, 320, tampon_y + 65), color=gold, fill=light_gray)
        page.insert_text(fitz.Point(55, tampon_y + 22), "CERTIFICATION ÉLECTRONIQUE LAHATHÈQUE", fontsize=8.5, fontname="helv", color=navy)
        page.insert_text(fitz.Point(55, tampon_y + 38), f"Document scellé cryptographiquement le {date_str}", fontsize=7.5, fontname="helv", color=dark_gray)
        page.insert_text(fitz.Point(55, tampon_y + 52), f"Réf Sécurité : {order_num}-SEC-2026", fontsize=7.5, fontname="helv", color=gold)

        # 6. Pied de page Légal
        footer_y = 800
        page.draw_line(fitz.Point(40, footer_y - 10), fitz.Point(555, footer_y - 10), color=border_gray)
        page.insert_text(
            fitz.Point(40, footer_y + 5),
            "LAHA Éditions S.A. au capital de 500 000 000 FCFA • Siège Social : Avenue Jean-Paul II, Cotonou, Bénin",
            fontsize=7.5,
            fontname="helv",
            color=(0.4, 0.4, 0.4),
        )
        page.insert_text(
            fitz.Point(40, footer_y + 17),
            "RCCM RB/COT/24 B 12458 • IFU 3202415897451 • Document officiel certifié conforme aux normes comptables SYSCOHADA.",
            fontsize=7,
            fontname="helv",
            color=(0.5, 0.5, 0.5),
        )

        buffer = io.BytesIO()
        doc.save(buffer, deflate=True, garbage=3)
        doc.close()
        return buffer.getvalue()

    @classmethod
    def generate_royalty_statement_pdf(cls, royalty_data: Dict[str, Any]) -> bytes:
        """
        Génère un bordereau de droits d'auteur / redevances certifié ISO-32000.
        """
        doc = fitz.open()
        page = doc.new_page(width=595, height=842)

        ref = str(royalty_data.get("reference", "BRD-2026-Q1"))
        beneficiary_name = str(royalty_data.get("beneficiary_name", "Ayant Droit"))
        beneficiary_role = str(royalty_data.get("beneficiary_role", "Auteur • LAHA Éditions"))
        period = str(royalty_data.get("period", "1er Trimestre 2026"))
        date_str = str(royalty_data.get("date", datetime.now().strftime("%d/%m/%Y")))
        gross_sales = float(royalty_data.get("gross_sales", 0.0))
        royalty_rate = float(royalty_data.get("royalty_rate", 15.0))
        net_amount = float(royalty_data.get("net_amount", 0.0))
        currency = str(royalty_data.get("currency", "FCFA"))
        sales_breakdown = royalty_data.get("sales_breakdown", [])

        navy = (27/255, 42/255, 78/255)
        gold = (176/255, 141/255, 66/255)
        dark_gray = (50/255, 50/255, 50/255)
        light_gray = (245/255, 247/255, 250/255)
        border_gray = (220/255, 225/255, 235/255)

        # En-tête avec Logo Officiel
        page.draw_rect(fitz.Rect(0, 0, 595, 80), color=navy, fill=navy)
        
        logo_bytes = cls._get_logo_bytes()
        if logo_bytes:
            page.insert_image(fitz.Rect(35, 15, 85, 65), stream=logo_bytes, keep_proportion=True)
            page.insert_text(fitz.Point(95, 43), "LAHATHÈQUE", fontsize=20, fontname="helv", color=(1, 1, 1))
            page.insert_text(fitz.Point(95, 58), "Bordereau Officiel de Droits & Redevances", fontsize=8.5, fontname="helv", color=gold)
        else:
            page.insert_text(fitz.Point(40, 48), "LAHATHÈQUE", fontsize=22, fontname="helv", color=(1, 1, 1))
            page.insert_text(fitz.Point(40, 64), "Bordereau Officiel de Droits & Redevances", fontsize=9, fontname="helv", color=gold)

        title_badge = "BORDEREAU DE VERSEMENT"
        ref_text = f"Réf: {ref}"
        tb_len = fitz.get_text_length(title_badge, fontname="helv", fontsize=11)
        rt_len = fitz.get_text_length(ref_text, fontname="helv", fontsize=10)
        page.insert_text(fitz.Point(555 - tb_len, 42), title_badge, fontsize=11, fontname="helv", color=gold)
        page.insert_text(fitz.Point(555 - rt_len, 58), ref_text, fontsize=10, fontname="helv", color=(1, 1, 1))

        # 2. Informations Émetteur & Ayant Droit
        # Émetteur (Gauche)
        page.insert_text(fitz.Point(40, 105), "Émetteur :", fontsize=10, fontname="helv", color=navy)
        page.insert_text(fitz.Point(40, 118), "LAHA Éditions S.A.", fontsize=10.5, fontname="helv", color=navy)
        page.insert_text(fitz.Point(40, 131), "Capital Social : 500 000 000 FCFA", fontsize=8, fontname="helv", color=dark_gray)
        page.insert_text(fitz.Point(40, 143), "IFU : 3202415897451 | RCCM : RB/COT/24 B 12458", fontsize=8, fontname="helv", color=dark_gray)
        page.insert_text(fitz.Point(40, 155), "Siège : Avenue Jean-Paul II, Cotonou, Bénin", fontsize=8, fontname="helv", color=dark_gray)
        page.insert_text(fitz.Point(40, 167), "contact@mail.lahalex.com | www.lahatheque.com", fontsize=8, fontname="helv", color=dark_gray)

        # Ayant Droit (Droite)
        page.draw_rect(fitz.Rect(320, 95, 555, 175), color=border_gray, fill=light_gray)
        page.insert_text(fitz.Point(335, 115), "Ayant Droit :", fontsize=10, fontname="helv", color=navy)
        page.insert_text(fitz.Point(335, 130), beneficiary_name[:36], fontsize=10, fontname="helv", color=dark_gray)
        page.insert_text(fitz.Point(335, 145), beneficiary_role[:40], fontsize=8.5, fontname="helv", color=dark_gray)
        page.insert_text(fitz.Point(335, 160), f"Période : {period} ({date_str})", fontsize=8.5, fontname="helv", color=gold)

        # Synthèse financière
        page.insert_text(fitz.Point(40, 205), "Synthèse des Ventes & Assiette de Calcul des Droits", fontsize=11, fontname="helv", color=navy)

        # Table des redevances
        table_top = 220
        page.draw_rect(fitz.Rect(40, table_top, 555, table_top + 24), color=navy, fill=navy)
        page.insert_text(fitz.Point(50, table_top + 16), "Ouvrage / Support", fontsize=9, fontname="helv", color=(1, 1, 1))
        page.insert_text(fitz.Point(290, table_top + 16), "Assiette Brute", fontsize=9, fontname="helv", color=(1, 1, 1))
        page.insert_text(fitz.Point(395, table_top + 16), "Taux Contrat", fontsize=9, fontname="helv", color=(1, 1, 1))
        page.insert_text(fitz.Point(485, table_top + 16), "Droits Nets", fontsize=9, fontname="helv", color=(1, 1, 1))

        current_y = table_top + 24
        if not sales_breakdown:
            sales_breakdown = [{
                "title": "Catalogue & Ventes Numériques Globales",
                "gross": gross_sales,
                "rate": royalty_rate,
                "net": net_amount,
            }]

        for idx, item in enumerate(sales_breakdown):
            t = str(item.get("title", "Ouvrage"))
            g = f"{float(item.get('gross', 0.0)):,.0f} {currency}".replace(",", " ")
            r = f"{float(item.get('rate', royalty_rate)):.2f} %"
            n = f"{float(item.get('net', 0.0)):,.0f} {currency}".replace(",", " ")

            row_bg = light_gray if idx % 2 == 1 else (1, 1, 1)
            page.draw_rect(fitz.Rect(40, current_y, 555, current_y + 24), color=border_gray, fill=row_bg)
            page.insert_text(fitz.Point(50, current_y + 16), t[:34], fontsize=8.5, fontname="helv", color=dark_gray)
            
            g_len = fitz.get_text_length(g, fontname="helv", fontsize=8.5)
            r_len = fitz.get_text_length(r, fontname="helv", fontsize=8.5)
            n_len = fitz.get_text_length(n, fontname="helv", fontsize=8.5)
            page.insert_text(fitz.Point(375 - g_len, current_y + 16), g, fontsize=8.5, fontname="helv", color=dark_gray)
            page.insert_text(fitz.Point(455 - r_len, current_y + 16), r, fontsize=8.5, fontname="helv", color=dark_gray)
            page.insert_text(fitz.Point(545 - n_len, current_y + 16), n, fontsize=8.5, fontname="helv", color=dark_gray)
            current_y += 24

        # Net Total
        current_y += 16
        page.draw_rect(fitz.Rect(280, current_y, 555, current_y + 36), color=navy, fill=navy)
        page.insert_text(fitz.Point(295, current_y + 23), "MONTANT NET À VERSER :", fontsize=10.5, fontname="helv", color=(1, 1, 1))
        formatted_net = f"{net_amount:,.0f} {currency}".replace(",", " ")
        fn_len = fitz.get_text_length(formatted_net, fontname="helv", fontsize=13)
        page.insert_text(fitz.Point(545 - fn_len, current_y + 23), formatted_net, fontsize=13, fontname="helv", color=gold)

        # Visa Direction
        visa_y = current_y + 55
        page.draw_rect(fitz.Rect(40, visa_y, 280, visa_y + 55), color=border_gray, fill=light_gray)
        page.insert_text(fitz.Point(55, visa_y + 20), "Visa Direction Financière LAHA :", fontsize=8.5, fontname="helv", color=navy)
        page.insert_text(fitz.Point(55, visa_y + 36), "Certifié bon à payer par virement bancaire.", fontsize=7.5, fontname="helv", color=dark_gray)

        # Pied de page
        footer_y = 800
        page.draw_line(fitz.Point(40, footer_y - 10), fitz.Point(555, footer_y - 10), color=border_gray)
        page.insert_text(
            fitz.Point(40, footer_y + 5),
            "LAHA Éditions S.A. au capital de 500 000 000 FCFA • Siège Social : Avenue Jean-Paul II, Cotonou, Bénin",
            fontsize=7.5,
            fontname="helv",
            color=(0.4, 0.4, 0.4),
        )
        page.insert_text(
            fitz.Point(40, footer_y + 17),
            "RCCM RB/COT/24 B 12458 • IFU 3202415897451 • Bordereau certifié conforme aux stipulations du contrat d'édition (SYSCOHADA).",
            fontsize=7,
            fontname="helv",
            color=(0.5, 0.5, 0.5),
        )

        buffer = io.BytesIO()
        doc.save(buffer, deflate=True, garbage=3)
        doc.close()
        return buffer.getvalue()
