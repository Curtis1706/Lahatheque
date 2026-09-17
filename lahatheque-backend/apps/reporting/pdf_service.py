"""
Service de génération dynamique de documents PDF officiels pour la plateforme LAHAThèque.
Conforme à l'architecture PyMuPDF (fitz) et respectant la charte graphique officielle :
Couleurs Navy (#1B2A4E), Navy Dark (#0F1A33) et Or (#B08D42), avec zéro émojis et typographie soignée.
"""
import io
import os
import fitz
from typing import Optional


class PartnerIntegrationGuidePdfService:
    """
    Générateur du Guide d'Implémentation Officiel Partenaire (Mode Catalogue Seul).
    Génère un document PDF vectoriel de haute qualité, sécurisé et paginé.
    """

    NAVY = (27 / 255, 42 / 255, 78 / 255)
    NAVY_DARK = (15 / 255, 26 / 255, 51 / 255)
    NAVY_HOVER = (46 / 255, 63 / 255, 102 / 255)
    GOLD = (176 / 255, 141 / 255, 66 / 255)
    TEXT_DARK = (30 / 255, 41 / 255, 59 / 255)
    TEXT_MUTED = (100 / 255, 116 / 255, 139 / 255)
    BG_LIGHT = (248 / 255, 250 / 255, 252 / 255)
    BORDER_LIGHT = (226 / 255, 232 / 255, 240 / 255)
    WHITE = (1.0, 1.0, 1.0)

    @classmethod
    def _draw_header_footer(cls, page: fitz.Page, page_num: int, total_pages: int):
        """Dessine le bandeau d'en-tête et le pied de page institutionnels."""
        # Bandeau haut Navy
        page.draw_rect(fitz.Rect(0, 0, 595, 60), color=cls.NAVY, fill=cls.NAVY)
        # Liseré Or
        page.draw_rect(fitz.Rect(0, 58, 595, 60), color=cls.GOLD, fill=cls.GOLD)

        # En-tête texte
        page.insert_text(fitz.Point(40, 36), "LAHATHÈQUE", fontsize=16, fontname="helv", color=cls.WHITE)
        page.insert_text(fitz.Point(155, 36), "•  Guide d'Intégration Partenaire (Catalogue Seul)", fontsize=10, fontname="helv", color=cls.GOLD)

        # Pied de page
        page.draw_line(fitz.Point(40, 800), fitz.Point(555, 800), color=cls.BORDER_LIGHT, width=0.8)
        page.insert_text(
            fitz.Point(40, 816),
            "Document Confidentiel Partenaire • LAHA Éditions & LAHAThèque • Tous droits réservés",
            fontsize=8,
            fontname="helv",
            color=cls.TEXT_MUTED
        )
        page.insert_text(
            fitz.Point(510, 816),
            f"Page {page_num} / {total_pages}",
            fontsize=8,
            fontname="helv",
            color=cls.TEXT_MUTED
        )

    @classmethod
    def generate_guide_pdf(cls) -> bytes:
        """
        Construit l'intégralité du guide d'intégration au format binaire PDF.
        """
        doc = fitz.open()
        total_pages = 4

        # =====================================================================
        # PAGE 1 : Couverture & Introduction
        # =====================================================================
        p1 = doc.new_page(width=595, height=842)
        cls._draw_header_footer(p1, 1, total_pages)

        # Grand Encart Titre
        p1.draw_rect(fitz.Rect(40, 85, 555, 210), color=cls.BORDER_LIGHT, fill=cls.BG_LIGHT)
        p1.draw_rect(fitz.Rect(40, 85, 46, 210), color=cls.GOLD, fill=cls.GOLD)

        p1.insert_text(fitz.Point(60, 115), "SPÉCIFICATION D'INTÉGRATION TECHNIQUE", fontsize=9, fontname="helv", color=cls.GOLD)
        p1.insert_text(fitz.Point(60, 145), "Mode « Catalogue LAHAThèque Seul »", fontsize=18, fontname="helv", color=cls.NAVY)
        p1.insert_text(fitz.Point(60, 172), "API REST & Liseuse Académique Sécurisée Multi-Tenant", fontsize=11, fontname="helv", color=cls.TEXT_DARK)
        p1.insert_text(fitz.Point(60, 195), "Version 2.0 • Conforme OAuth 2.0 Client Credentials & Standard ISO-32000", fontsize=8.5, fontname="helv", color=cls.TEXT_MUTED)

        # Section 1 : Principes & Périmètre
        p1.insert_text(fitz.Point(40, 240), "1. Principes & Fonctionnement", fontsize=13, fontname="helv", color=cls.NAVY)
        p1.draw_line(fitz.Point(40, 246), fitz.Point(555, 246), color=cls.BORDER_LIGHT, width=1)

        intro_p1 = (
            "Le mode d'accès « Catalogue Seul » permet à votre Système d'Information, portail universitaire "
            "ou application étudiante de se connecter de façon sécurisée à la plateforme LAHAThèque afin d'offrir "
            "une consultation intégrée et fluide des ressources pédagogiques homologuées."
        )
        p1.insert_textbox(fitz.Rect(40, 255, 555, 305), intro_p1, fontsize=9.5, fontname="helv", color=cls.TEXT_DARK)

        bullets_p1 = [
            "Synchronisation et exploration du catalogue académique (titres, auteurs, résumés, ISBN, couvertures).",
            "Contrôle dynamique des abonnements et des bouquets souscrits par l'établissement.",
            "Lancement en un clic de la liseuse sécurisée sans création de compte utilisateur tiers.",
            "Personnalisation graphique de la liseuse (logo, nom d'établissement, palette chromatique).",
            "Suivi statistique unifié des lectures et temps de consultation campus."
        ]
        y_cursor = 310
        for b in bullets_p1:
            p1.draw_circle(fitz.Point(48, y_cursor - 3), 2.5, color=cls.GOLD, fill=cls.GOLD)
            p1.insert_textbox(fitz.Rect(58, y_cursor - 10, 555, y_cursor + 15), b, fontsize=9, fontname="helv", color=cls.TEXT_DARK)
            y_cursor += 24

        # Section 2 : Flux d'intégration
        p1.insert_text(fitz.Point(40, 445), "2. Flux d'Intégration en 4 Étapes", fontsize=13, fontname="helv", color=cls.NAVY)
        p1.draw_line(fitz.Point(40, 451), fitz.Point(555, 451), color=cls.BORDER_LIGHT, width=1)

        steps = [
            ("Étape 1", "Authentification Machine-to-Machine", "Échange des identifiants (Client ID + Secret) sur POST /api/v1/oauth2/token/ pour obtenir un Bearer Token valide 10h."),
            ("Étape 2", "Interrogation du Catalogue", "Récupération des métadonnées des ouvrages autorisés via GET /api/v1/partner/catalog/ (filtres par discipline, mots-clés, pagination)."),
            ("Étape 3", "Création de la Session de Lecture", "Génération sécurisée d'une session via POST /api/v1/reader/sessions/ avec le book_id et l'identité de l'étudiant pour filigrane."),
            ("Étape 4", "Redirection vers la Liseuse", "Ouverture de l'URL éphémère sécurisée (reader_url) dans le navigateur de l'étudiant ou dans une iframe sécurisée.")
        ]
        box_y = 465
        for st_num, st_title, st_desc in steps:
            p1.draw_rect(fitz.Rect(40, box_y, 555, box_y + 44), color=cls.BORDER_LIGHT, fill=cls.BG_LIGHT)
            p1.draw_rect(fitz.Rect(40, box_y, 95, box_y + 44), color=cls.NAVY, fill=cls.NAVY)
            p1.insert_text(fitz.Point(46, box_y + 26), st_num, fontsize=9, fontname="helv", color=cls.WHITE)
            p1.insert_text(fitz.Point(105, box_y + 17), st_title, fontsize=9.5, fontname="helv", color=cls.NAVY)
            p1.insert_textbox(fitz.Rect(105, box_y + 21, 545, box_y + 42), st_desc, fontsize=8, fontname="helv", color=cls.TEXT_MUTED)
            box_y += 50

        # Encart Note
        p1.draw_rect(fitz.Rect(40, 680, 555, 760), color=cls.BORDER_LIGHT, fill=cls.WHITE)
        p1.draw_rect(fitz.Rect(40, 680, 44, 760), color=cls.NAVY, fill=cls.NAVY)
        p1.insert_text(fitz.Point(54, 700), "REMARQUE IMPORTANTE SUR LA SOUVERAINETÉ DE LA LISEUSE", fontsize=8.5, fontname="helv", color=cls.GOLD)
        note_txt = (
            "La liseuse LAHAThèque intègre un moteur anti-capture, une obfuscation vectorielle dynamique "
            "des pages et un filigrane nominatif répété. Vos étudiants accèdent directement au contenu dans "
            "un environnement hautement sécurisé sans fuite de fichiers PDF bruts."
        )
        p1.insert_textbox(fitz.Rect(54, 708, 545, 755), note_txt, fontsize=8.5, fontname="helv", color=cls.TEXT_DARK)

        # =====================================================================
        # PAGE 2 : Authentification & Configuration .env
        # =====================================================================
        p2 = doc.new_page(width=595, height=842)
        cls._draw_header_footer(p2, 2, total_pages)

        p2.insert_text(fitz.Point(40, 95), "3. Authentification & Variables d'Environnement", fontsize=13, fontname="helv", color=cls.NAVY)
        p2.draw_line(fitz.Point(40, 101), fitz.Point(555, 101), color=cls.BORDER_LIGHT, width=1)

        p2.insert_textbox(
            fitz.Rect(40, 110, 555, 145),
            "Chaque établissement partenaire dispose d'une paire unique d'identifiants API Client Credentials. "
            "Le secret client n'est transmis qu'une seule fois à l'émission et doit être placé dans vos variables d'environnement serveur :",
            fontsize=9.5, fontname="helv", color=cls.TEXT_DARK
        )

        # Bloc .env
        p2.draw_rect(fitz.Rect(40, 150, 555, 235), color=cls.NAVY_HOVER, fill=cls.NAVY_DARK)
        p2.insert_text(fitz.Point(55, 175), "# Configuration LAHAThèque API — Fichier .env", fontsize=8.5, fontname="helv", color=cls.TEXT_MUTED)
        p2.insert_text(fitz.Point(55, 195), "LAHATHEQUE_CLIENT_ID=laha_client_votre_identifiant_unique", fontsize=9, fontname="helv", color=cls.WHITE)
        p2.insert_text(fitz.Point(55, 212), "LAHATHEQUE_CLIENT_SECRET=sec_live_votre_secret_prive_chiffre", fontsize=9, fontname="helv", color=cls.GOLD)
        p2.insert_text(fitz.Point(55, 229), "LAHATHEQUE_API_URL=https://api.lahatheque.com/api/v1", fontsize=9, fontname="helv", color=cls.WHITE)

        # Section 4 : Personnalisation visuelle
        p2.insert_text(fitz.Point(40, 260), "4. Personnalisation Visuelle de la Liseuse (Objet theme)", fontsize=13, fontname="helv", color=cls.NAVY)
        p2.draw_line(fitz.Point(40, 266), fitz.Point(555, 266), color=cls.BORDER_LIGHT, width=1)

        p2.insert_textbox(
            fitz.Rect(40, 275, 555, 310),
            "L'API vous permet de draper la liseuse sécurisée aux couleurs officielles de votre établissement "
            "en passant un objet optionnel 'theme' lors de la création de chaque session de lecture.",
            fontsize=9.5, fontname="helv", color=cls.TEXT_DARK
        )

        # Tableau des propriétés de thème
        theme_props = [
            ("brand_name", "String (2-50 car.)", "Nom textuel de votre université affiché dans la barre supérieure."),
            ("brand_logo_url", "URL HTTPS (PNG/SVG)", "Logo institutionnel remplaçant le nom textuel (recommandé 160x40px)."),
            ("primary_color", "Code HEX (ex: #1B2A4E)", "Couleur de fond principale de la barre d'outils supérieure."),
            ("accent_color", "Code HEX (ex: #B08D42)", "Couleur dorée/accent des boutons actifs, pagination et sommaire."),
            ("background_color", "Code HEX (ex: #0F1A33)", "Couleur de fond enveloppant les pages de l'ouvrage."),
            ("text_color", "Code HEX (ex: #FFFFFF)", "Couleur de texte et de contraste des boutons et menus.")
        ]
        t_y = 315
        p2.draw_rect(fitz.Rect(40, t_y, 555, t_y + 20), color=cls.NAVY, fill=cls.NAVY)
        p2.insert_text(fitz.Point(48, t_y + 14), "Propriété", fontsize=8.5, fontname="helv", color=cls.WHITE)
        p2.insert_text(fitz.Point(155, t_y + 14), "Type & Format", fontsize=8.5, fontname="helv", color=cls.WHITE)
        p2.insert_text(fitz.Point(280, t_y + 14), "Rôle & Emplacement", fontsize=8.5, fontname="helv", color=cls.WHITE)
        t_y += 20

        for prop, typ, desc in theme_props:
            p2.draw_rect(fitz.Rect(40, t_y, 555, t_y + 26), color=cls.BORDER_LIGHT, fill=cls.BG_LIGHT if (t_y // 26) % 2 == 0 else cls.WHITE)
            p2.insert_text(fitz.Point(48, t_y + 17), prop, fontsize=8.5, fontname="helv", color=cls.NAVY)
            p2.insert_text(fitz.Point(155, t_y + 17), typ, fontsize=8, fontname="helv", color=cls.TEXT_MUTED)
            p2.insert_text(fitz.Point(280, t_y + 17), desc, fontsize=8, fontname="helv", color=cls.TEXT_DARK)
            t_y += 26

        # Exemple JSON Theme
        p2.insert_text(fitz.Point(40, 500), "Exemple d'objet JSON de personnalisation :", fontsize=10, fontname="helv", color=cls.NAVY)
        p2.draw_rect(fitz.Rect(40, 510, 555, 620), color=cls.NAVY_HOVER, fill=cls.NAVY_DARK)
        json_sample = [
            '{\n',
            '  "theme": {\n',
            '    "brand_name": "Université d\'Abomey-Calavi",\n',
            '    "brand_logo_url": "https://uac.bj/static/logo.png",\n',
            '    "primary_color": "#1B2A4E",\n',
            '    "accent_color": "#B08D42",\n',
            '    "background_color": "#0F1A33",\n',
            '    "text_color": "#FFFFFF"\n',
            '  }\n',
            '}'
        ]
        p2.insert_textbox(fitz.Rect(55, 515, 545, 615), "".join(json_sample), fontsize=8.5, fontname="helv", color=cls.GOLD)

        # =====================================================================
        # PAGE 3 : Spécification des Endpoints (OAuth2 & Catalogue)
        # =====================================================================
        p3 = doc.new_page(width=595, height=842)
        cls._draw_header_footer(p3, 3, total_pages)

        p3.insert_text(fitz.Point(40, 95), "5. Spécification Détaillée des Endpoints API", fontsize=13, fontname="helv", color=cls.NAVY)
        p3.draw_line(fitz.Point(40, 101), fitz.Point(555, 101), color=cls.BORDER_LIGHT, width=1)

        # 5.1 OAuth2 Token
        p3.insert_text(fitz.Point(40, 125), "5.1 Obtention du jeton Bearer (OAuth 2.0)", fontsize=11, fontname="helv", color=cls.NAVY)
        p3.draw_rect(fitz.Rect(40, 135, 555, 235), color=cls.BORDER_LIGHT, fill=cls.BG_LIGHT)
        p3.insert_text(fitz.Point(50, 153), "POST /api/v1/oauth2/token/", fontsize=9.5, fontname="helv", color=cls.NAVY)
        p3.insert_text(fitz.Point(50, 168), "Content-Type: application/x-www-form-urlencoded", fontsize=8.5, fontname="helv", color=cls.TEXT_MUTED)
        
        req_token = "grant_type=client_credentials&client_id=VOTRE_CLIENT_ID&client_secret=VOTRE_CLIENT_SECRET"
        p3.draw_rect(fitz.Rect(50, 175, 545, 198), color=cls.BORDER_LIGHT, fill=cls.WHITE)
        p3.insert_text(fitz.Point(58, 190), req_token, fontsize=8, fontname="helv", color=cls.TEXT_DARK)

        p3.insert_text(fitz.Point(50, 212), "Réponse 200 OK : { 'access_token': 'eyJhbGci...', 'token_type': 'Bearer', 'expires_in': 36000 }", fontsize=8, fontname="helv", color=cls.GOLD)

        # 5.2 Catalogue
        p3.insert_text(fitz.Point(40, 260), "5.2 Consultation du Catalogue Partenaire", fontsize=11, fontname="helv", color=cls.NAVY)
        p3.draw_rect(fitz.Rect(40, 270, 555, 410), color=cls.BORDER_LIGHT, fill=cls.BG_LIGHT)
        p3.insert_text(fitz.Point(50, 288), "GET /api/v1/partner/catalog/", fontsize=9.5, fontname="helv", color=cls.NAVY)
        p3.insert_text(fitz.Point(50, 303), "Authorization: Bearer <access_token>", fontsize=8.5, fontname="helv", color=cls.TEXT_MUTED)

        cat_desc = (
            "Paramètres de requête acceptés : \n"
            "• discipline (ex: 'Droit', 'Sciences Économiques') — Filtre par discipline académique.\n"
            "• search (ex: 'civile') — Recherche plein texte sur le titre, l'auteur ou le résumé.\n"
            "• bouquet_id (UUID) — Restreint la recherche aux ouvrages d'un bouquet précis.\n"
            "• page / page_size — Pagination standard (défaut : 20 ouvrages par page, max : 100)."
        )
        p3.insert_textbox(fitz.Rect(50, 312, 545, 400), cat_desc, fontsize=8.5, fontname="helv", color=cls.TEXT_DARK)

        # 5.3 Reader Session
        p3.insert_text(fitz.Point(40, 435), "5.3 Création d'une Session de Lecture Sécurisée", fontsize=11, fontname="helv", color=cls.NAVY)
        p3.draw_rect(fitz.Rect(40, 445, 555, 680), color=cls.NAVY_HOVER, fill=cls.NAVY_DARK)
        p3.insert_text(fitz.Point(55, 465), "POST /api/v1/reader/sessions/", fontsize=9.5, fontname="helv", color=cls.GOLD)
        p3.insert_text(fitz.Point(55, 480), "Headers : Authorization: Bearer <access_token> | Content-Type: application/json", fontsize=8, fontname="helv", color=cls.TEXT_MUTED)

        session_body = [
            '{\n',
            '  "book_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",\n',
            '  "external_user_id": "ETU-2026-00442",\n',
            '  "user_display_name": "Kouamé Koffi",\n',
            '  "user_email": "kouame.koffi@etudiant.uac.bj",\n',
            '  "return_url": "https://portail.uac.bj/mes-cours",\n',
            '  "theme": {\n',
            '    "brand_name": "Université d\'Abomey-Calavi",\n',
            '    "primary_color": "#1B2A4E",\n',
            '    "accent_color": "#B08D42"\n',
            '  }\n',
            '}'
        ]
        p3.insert_textbox(fitz.Rect(55, 490, 545, 630), "".join(session_body), fontsize=8, fontname="helv", color=cls.WHITE)

        p3.insert_text(fitz.Point(55, 645), "Réponse 201 Created :", fontsize=8.5, fontname="helv", color=cls.GOLD)
        p3.insert_text(fitz.Point(55, 660), "{ 'session_id': '...', 'reader_url': 'https://lahatheque.com/read/sec_tk_...' }", fontsize=8, fontname="helv", color=cls.WHITE)

        # =====================================================================
        # PAGE 4 : Sécurité, Bonnes Pratiques & Support
        # =====================================================================
        p4 = doc.new_page(width=595, height=842)
        cls._draw_header_footer(p4, 4, total_pages)

        p4.insert_text(fitz.Point(40, 95), "6. Bonnes Pratiques de Sécurité & Conformité", fontsize=13, fontname="helv", color=cls.NAVY)
        p4.draw_line(fitz.Point(40, 101), fitz.Point(555, 101), color=cls.BORDER_LIGHT, width=1)

        sec_points = [
            ("Stockage Sécurisé du Secret :", "Ne divulguez JAMAIS le client_secret dans le code JavaScript exécuté dans le navigateur, ni dans des applications mobiles décompilables. Tous les appels d'obtention de token doivent transiter par votre backend propriétaire."),
            ("Validité des Sessions Éphémères :", "L'URL de lecture transmise (reader_url) est signée avec un jeton cryptographique à durée de validité limitée. Elle est strictement personnelle et ne doit pas être indexée ou partagée publiquement."),
            ("Watermarking & Traçabilité :", "Chaque page affichée dans la liseuse comporte un filigrane numérique invisible et visible mentionnant l'identifiant et l'email de l'étudiant pour décourager les tentatives de capture d'écran frauduleuses."),
            ("Mise en Cache des Jetons Bearer :", "Les jetons OAuth 2.0 ont une durée de vie de 10 heures (36 000 secondes). Réutilisez le même jeton pour vos requêtes successives plutôt que d'en demander un nouveau à chaque consultation.")
        ]
        s_y = 120
        for title, desc in sec_points:
            p4.draw_rect(fitz.Rect(40, s_y, 555, s_y + 55), color=cls.BORDER_LIGHT, fill=cls.BG_LIGHT)
            p4.draw_rect(fitz.Rect(40, s_y, 44, s_y + 55), color=cls.GOLD, fill=cls.GOLD)
            p4.insert_text(fitz.Point(55, s_y + 18), title, fontsize=9.5, fontname="helv", color=cls.NAVY)
            p4.insert_textbox(fitz.Rect(55, s_y + 22, 545, s_y + 52), desc, fontsize=8.5, fontname="helv", color=cls.TEXT_MUTED)
            s_y += 65

        # Section 7 : Contacts & Support
        p4.insert_text(fitz.Point(40, 400), "7. Support Technique Partenaires & Assistance", fontsize=13, fontname="helv", color=cls.NAVY)
        p4.draw_line(fitz.Point(40, 406), fitz.Point(555, 406), color=cls.BORDER_LIGHT, width=1)

        p4.draw_rect(fitz.Rect(40, 420, 555, 550), color=cls.NAVY, fill=cls.NAVY_DARK)
        p4.insert_text(fitz.Point(60, 445), "ÉQUIPE TECHNIQUE & CELLULE INTÉGRATION ACADÉMIQUE", fontsize=10, fontname="helv", color=cls.GOLD)
        p4.insert_text(fitz.Point(60, 470), "Éditions LAHA • Département Systèmes d'Information & Bibliothèque Numérique", fontsize=9, fontname="helv", color=cls.WHITE)
        p4.insert_text(fitz.Point(60, 492), "Email officiel du Support Partenaires : api-support@lahatheque.com", fontsize=9, fontname="helv", color=cls.WHITE)
        p4.insert_text(fitz.Point(60, 512), "Direction & Relations Universités : lahaeditions1@gmail.com", fontsize=9, fontname="helv", color=cls.WHITE)
        p4.insert_text(fitz.Point(60, 532), "Portail Documentation Développeur : https://docs.lahatheque.com", fontsize=9, fontname="helv", color=cls.GOLD)

        # Certification
        p4.draw_rect(fitz.Rect(40, 580, 555, 680), color=cls.BORDER_LIGHT, fill=cls.BG_LIGHT)
        p4.insert_text(fitz.Point(60, 605), "CERTIFICAT DE CONFORMITÉ TECHNIQUE", fontsize=10, fontname="helv", color=cls.NAVY)
        cert_text = (
            "Ce guide technique fait autorité pour toutes les intégrations en mode Catalogue Seul "
            "validées par LAHA Éditions. Tout établissement partenaire utilisant cette interface s'engage "
            "à respecter les quotas d'appels, les conditions d'usage des licences et la non-redistribution "
            "des flux documentaires propriétaires."
        )
        p4.insert_textbox(fitz.Rect(60, 615, 545, 670), cert_text, fontsize=8.5, fontname="helv", color=cls.TEXT_MUTED)

        pdf_bytes = doc.write()
        doc.close()
        return pdf_bytes


class BouquetInvoicePdfService:
    """
    Générateur de facture acquittée officielle pour souscription bouquet documentaire.
    Certifié ISO-32000 et standard SYSCOHADA / DGI Bénin.
    """

    NAVY = (27 / 255, 42 / 255, 78 / 255)
    GOLD = (176 / 255, 141 / 255, 66 / 255)
    EMERALD = (5 / 255, 150 / 255, 105 / 255)
    TEXT_DARK = (30 / 255, 41 / 255, 59 / 255)
    TEXT_MUTED = (100 / 255, 116 / 255, 139 / 255)
    BG_LIGHT = (248 / 255, 250 / 255, 252 / 255)
    BORDER_LIGHT = (226 / 255, 232 / 255, 240 / 255)
    WHITE = (1.0, 1.0, 1.0)

    @classmethod
    def generate_invoice_pdf(cls, data: dict) -> bytes:
        doc = fitz.open()
        p = doc.new_page(width=595, height=842)  # A4 standard

        inv_num = str(data.get("invoice_number", "FAC-BOUQ-2026-001"))
        customer_name = str(data.get("customer_name", "Établissement Partenaire"))
        customer_email = str(data.get("customer_email", ""))
        inst_code = str(data.get("institution_code", ""))
        date_str = str(data.get("date", ""))
        bouquet_title = str(data.get("bouquet_title", "Bouquet Académique"))
        period_label = str(data.get("period_label", "Formule Annuelle (365 jours)"))
        amount = float(data.get("amount", 0.0))
        currency = str(data.get("currency", "FCFA"))
        if currency == "XOF":
            currency = "FCFA"
        pay_method = str(data.get("payment_method", "Moneroo Mobile Money"))
        tx_ref = str(data.get("transaction_ref", "MNR-TX-001"))
        start_date = str(data.get("start_date", ""))
        end_date = str(data.get("end_date", ""))
        is_univ = bool(data.get("is_university", True))

        # 1. Bandeau supérieur Navy & Or
        p.draw_rect(fitz.Rect(0, 0, 595, 75), color=cls.NAVY, fill=cls.NAVY)
        p.draw_rect(fitz.Rect(0, 73, 595, 75), color=cls.GOLD, fill=cls.GOLD)

        p.insert_text(fitz.Point(40, 42), "LAHATHÈQUE", fontsize=20, fontname="helv", color=cls.WHITE)
        p.insert_text(fitz.Point(40, 58), "Éditions LAHA • Plateforme Académique Officielle", fontsize=8.5, fontname="helv", color=cls.GOLD)

        p.insert_text(fitz.Point(410, 36), f"FACTURE N° {inv_num}", fontsize=11, fontname="helv", color=cls.WHITE)
        p.insert_text(fitz.Point(410, 52), f"Émise le {date_str}", fontsize=8.5, fontname="helv", color=cls.WHITE)

        # 2. Tampon Acquitté Vert
        p.draw_rect(fitz.Rect(410, 95, 555, 122), color=cls.EMERALD, fill=cls.WHITE, width=1.5)
        p.insert_text(fitz.Point(422, 112), "ACQUITTÉE • PAIEMENT VALIDÉ", fontsize=8, fontname="helv", color=cls.EMERALD)

        # 3. Émetteur & Souscripteur
        p.insert_text(fitz.Point(40, 115), "ÉMETTEUR :", fontsize=8.5, fontname="helv", color=cls.TEXT_MUTED)
        p.insert_text(fitz.Point(40, 130), "LAHA Éditions SARL", fontsize=11, fontname="helv", color=cls.NAVY)
        p.insert_text(fitz.Point(40, 144), "Cotonou, République du Bénin", fontsize=8.5, fontname="helv", color=cls.TEXT_DARK)
        p.insert_text(fitz.Point(40, 158), "IFU : 3201501234567 | RCCM : RB/COT/15 B 14120", fontsize=8, fontname="helv", color=cls.TEXT_MUTED)

        p.insert_text(fitz.Point(260, 115), "SOUSCRIPTEUR / BÉNÉFICIAIRE :", fontsize=8.5, fontname="helv", color=cls.TEXT_MUTED)
        p.insert_text(fitz.Point(260, 130), customer_name[:40], fontsize=11, fontname="helv", color=cls.NAVY)
        if inst_code:
            p.insert_text(fitz.Point(260, 144), f"Code Institution : {inst_code}", fontsize=8.5, fontname="helv", color=cls.TEXT_DARK)
        if customer_email:
            p.insert_text(fitz.Point(260, 158), f"Contact : {customer_email}", fontsize=8.5, fontname="helv", color=cls.TEXT_DARK)

        # 4. Détails de règlement
        p.draw_rect(fitz.Rect(40, 185, 555, 225), color=cls.BORDER_LIGHT, fill=cls.BG_LIGHT)
        p.insert_text(fitz.Point(55, 202), f"Mode d'encaissement : {pay_method}", fontsize=8.5, fontname="helv", color=cls.TEXT_DARK)
        p.insert_text(fitz.Point(55, 216), f"Réf. transaction : {tx_ref}", fontsize=8.5, fontname="helv", color=cls.TEXT_MUTED)
        p.insert_text(fitz.Point(340, 202), f"Devise de facturation : {currency}", fontsize=8.5, fontname="helv", color=cls.TEXT_DARK)
        p.insert_text(fitz.Point(340, 216), "Statut : Règlement certifié conforme", fontsize=8.5, fontname="helv", color=cls.EMERALD)

        # 5. Table des prestations
        t_y = 250
        p.draw_rect(fitz.Rect(40, t_y, 555, t_y + 24), color=cls.NAVY, fill=cls.NAVY)
        p.insert_text(fitz.Point(55, t_y + 16), "Désignation de la Licence Documentaire", fontsize=9, fontname="helv", color=cls.WHITE)
        p.insert_text(fitz.Point(340, t_y + 16), "Formule", fontsize=9, fontname="helv", color=cls.WHITE)
        p.insert_text(fitz.Point(470, t_y + 16), "Montant Net", fontsize=9, fontname="helv", color=cls.WHITE)
        t_y += 24

        p.draw_rect(fitz.Rect(40, t_y, 555, t_y + 50), color=cls.BORDER_LIGHT, fill=cls.WHITE)
        p.insert_text(fitz.Point(55, t_y + 20), f"Bouquet Académique « {bouquet_title} »", fontsize=10, fontname="helv", color=cls.NAVY)
        p.insert_text(fitz.Point(55, t_y + 35), "Accès illimité et sécurisé aux ouvrages de la discipline", fontsize=8, fontname="helv", color=cls.TEXT_MUTED)
        p.insert_text(fitz.Point(340, t_y + 24), period_label, fontsize=8.5, fontname="helv", color=cls.TEXT_DARK)
        amt_str = f"{amount:,.0f} {currency}".replace(",", " ")
        p.insert_text(fitz.Point(470, t_y + 24), amt_str, fontsize=9.5, fontname="helv", color=cls.NAVY)
        t_y += 50

        # 6. Totaux
        tot_y = t_y + 20
        p.draw_rect(fitz.Rect(320, tot_y, 555, tot_y + 75), color=cls.BORDER_LIGHT, fill=cls.BG_LIGHT)
        p.insert_text(fitz.Point(335, tot_y + 22), "Total Brut HT :", fontsize=9, fontname="helv", color=cls.TEXT_DARK)
        p.insert_text(fitz.Point(460, tot_y + 22), amt_str, fontsize=9, fontname="helv", color=cls.TEXT_DARK)
        p.insert_text(fitz.Point(335, tot_y + 40), "TVA (0% Régime Éducation) :", fontsize=8.5, fontname="helv", color=cls.TEXT_MUTED)
        p.insert_text(fitz.Point(460, tot_y + 40), f"0 {currency}", fontsize=8.5, fontname="helv", color=cls.TEXT_MUTED)

        p.draw_line(fitz.Point(335, tot_y + 48), fitz.Point(540, tot_y + 48), color=cls.GOLD, width=1)
        p.insert_text(fitz.Point(335, tot_y + 64), "Total Acquitté TTC :", fontsize=10, fontname="helv", color=cls.NAVY)
        p.insert_text(fitz.Point(460, tot_y + 64), amt_str, fontsize=10, fontname="helv", color=cls.GOLD)

        # 7. Bloc de Validité
        val_y = tot_y + 105
        p.draw_rect(fitz.Rect(40, val_y, 555, val_y + 65), color=cls.BORDER_LIGHT, fill=cls.BG_LIGHT)
        p.draw_rect(fitz.Rect(40, val_y, 45, val_y + 65), color=cls.GOLD, fill=cls.GOLD)
        p.insert_text(fitz.Point(55, val_y + 20), "PÉRIODE DE VALIDITÉ DE LA LICENCE ACADÉMIQUE :", fontsize=9, fontname="helv", color=cls.GOLD)
        val_msg = f"Droits d'accès certifiés valables du {start_date} au {end_date} inclus."
        if is_univ:
            val_msg += " La clé API associée et les accès étudiants restent actifs pendant toute cette période."
        p.insert_textbox(fitz.Rect(55, val_y + 26, 545, val_y + 58), val_msg, fontsize=8.5, fontname="helv", color=cls.TEXT_DARK)

        # 8. Footer
        p.draw_line(fitz.Point(40, 780), fitz.Point(555, 780), color=cls.BORDER_LIGHT, width=0.8)
        p.insert_text(
            fitz.Point(40, 796),
            "Facture électronique acquittée conforme OHADA & DGI Bénin • Document généré par LAHAThèque",
            fontsize=8,
            fontname="helv",
            color=cls.TEXT_MUTED
        )
        p.insert_text(
            fitz.Point(40, 810),
            "LAHA Éditions SARL • contact@lahatheque.com • Plateforme officielle d'édition académique",
            fontsize=7.5,
            fontname="helv",
            color=cls.TEXT_MUTED
        )

        pdf_bytes = doc.write()
        doc.close()
        return pdf_bytes

