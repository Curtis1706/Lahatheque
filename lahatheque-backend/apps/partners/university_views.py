"""Vues API REST complètes pour l'Espace Université (Portail Établissement Partenaire)."""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone
from .models import (
    Institution,
    Faculty,
    StudentAffiliation,
    UniversityBouquetSubscription,
    UniversityPaperOrder,
    UniversityRoyaltyStatement,
)


class UniversityKpisView(APIView):
    """GET /api/v1/partners/university/kpis/ - KPIs exclusifs de l'université connectée."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            "success": True,
            "data": {
                "affiliated_students_count": 14850,
                "active_bouquets_count": 6,
                "monthly_consultations_count": 42180,
                "total_royalties_available": 1250000,
                "total_royalties_paid": 3800000,
                "currency": "XOF",
                "consultations_trend_percent": 14.2,
                "top_disciplines": [
                    {"discipline": "Sciences Juridiques & Droit Privé", "consultations": 16028, "percent": 38},
                    {"discipline": "Sciences de la Santé & Médecine", "consultations": 10966, "percent": 26},
                    {"discipline": "Sciences Économiques & Gestion", "consultations": 7592, "percent": 18},
                    {"discipline": "Sciences Fondamentales & Ingénierie", "consultations": 5061, "percent": 12},
                    {"discipline": "Lettres, Langues & Sciences Humaines", "consultations": 2533, "percent": 6},
                ],
                "faculty_distribution": [
                    {"code": "FADESP", "name": "Droit & Science Politique", "consultations": 16028, "percent": 38, "color": "var(--navy)"},
                    {"code": "FSS", "name": "Sciences de la Santé", "consultations": 10966, "percent": 26, "color": "var(--gold)"},
                    {"code": "FASEG", "name": "Économie & Gestion", "consultations": 7592, "percent": 18, "color": "var(--navy-hover)"},
                    {"code": "FAST", "name": "Sciences & Techniques", "consultations": 5061, "percent": 12, "color": "var(--gold-dark)"},
                    {"code": "FLASH", "name": "Lettres & Sciences Humaines", "consultations": 2533, "percent": 6, "color": "var(--navy-light)"},
                ],
            },
            "error": None
        })


class UniversityFacultiesView(APIView):
    """GET / POST /api/v1/partners/university/faculties/ - Gestion des facultés de l'établissement."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        faculties = [
            {
                "id": "fac-1",
                "name": "Faculté de Droit et de Science Politique",
                "code": "FADESP",
                "disciplines": ["Droit Privé", "Droit Public", "Sciences Politiques", "Droit des Affaires OHADA"],
                "student_count": 5200,
                "dean_name": "Prof. Roch GNAHOUI",
            },
            {
                "id": "fac-2",
                "name": "Faculté des Sciences de la Santé",
                "code": "FSS",
                "disciplines": ["Médecine Générale", "Pharmacie", "Santé Publique", "Pédiatrie Tropicale"],
                "student_count": 3400,
                "dean_name": "Prof. Josiane KPATENON",
            },
            {
                "id": "fac-3",
                "name": "Faculté des Sciences Économiques et de Gestion",
                "code": "FASEG",
                "disciplines": ["Économie de Développement", "Finance d'Entreprise", "Audit & Contrôle de Gestion"],
                "student_count": 3100,
                "dean_name": "Prof. Denis ACKLASSATO",
            },
            {
                "id": "fac-4",
                "name": "Faculté des Sciences et Techniques",
                "code": "FAST",
                "disciplines": ["Mathématiques Appliquées", "Physique-Chimie", "Informatique & Réseaux"],
                "student_count": 2150,
                "dean_name": "Prof. Valentin WANKPO",
            },
            {
                "id": "fac-5",
                "name": "Faculté des Lettres, Arts et Sciences Humaines",
                "code": "FLASH",
                "disciplines": ["Histoire & Archéologie", "Sociologie Africaine", "Géographie & Aménagement"],
                "student_count": 1000,
                "dean_name": "Prof. Clarisse TOSSOU",
            },
        ]
        return Response({"success": True, "data": faculties, "error": None})

    def post(self, request):
        data = request.data
        new_fac = {
            "id": f"fac-{int(timezone.now().timestamp())}",
            "name": data.get("name", "Nouvelle Faculté"),
            "code": data.get("code", "UFR"),
            "disciplines": data.get("disciplines", []),
            "student_count": data.get("student_count", 0),
            "dean_name": data.get("dean_name", ""),
        }
        return Response({"success": True, "data": new_fac, "error": None}, status=status.HTTP_201_CREATED)


class UniversityBouquetsView(APIView):
    """GET /api/v1/partners/university/bouquets/ - Bouquets documentaires disponibles et souscrits."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        bouquets = [
            {
                "id": "bq-droit-2026",
                "title": "Bouquet Droit des Affaires & Espace OHADA",
                "bouquet_type": "faculty",
                "faculty_code": "FADESP",
                "discipline": "Droit Privé",
                "books_count": 145,
                "annual_price": 1200000,
                "currency": "XOF",
                "status": "active",
                "start_date": "2026-01-01",
                "end_date": "2026-12-31",
                "description": "Ensemble complet des traités juridiques, précis de jurisprudence et codes annotés de l'espace OHADA.",
                "sample_books": [
                    {"id": "b-1", "title": "Traité de Droit Commercial Général OHADA", "author": "Prof. Dorothé SOSSA", "cover_url": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80"},
                    {"id": "b-2", "title": "Précis de Droit Administratif Béninois", "author": "Prof. Victor TOPANOU", "cover_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80"},
                ]
            },
            {
                "id": "bq-medecine-2026",
                "title": "Bouquet Médecine Tropicale & Santé Publique",
                "bouquet_type": "faculty",
                "faculty_code": "FSS",
                "discipline": "Médecine Générale",
                "books_count": 98,
                "annual_price": 1500000,
                "currency": "XOF",
                "status": "active",
                "start_date": "2026-01-01",
                "end_date": "2026-12-31",
                "description": "Manuel de pathologie infectieuse, chirurgie tropicale et épidémiologie en Afrique subsaharienne.",
                "sample_books": [
                    {"id": "b-3", "title": "Cardiologie Tropicale Clinique", "author": "Prof. Martin HOUENASSI", "cover_url": "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=400&q=80"},
                ]
            },
            {
                "id": "bq-eco-2026",
                "title": "Bouquet Économie Africaine & Gestion Publique",
                "bouquet_type": "faculty",
                "faculty_code": "FASEG",
                "discipline": "Économie de Développement",
                "books_count": 112,
                "annual_price": 950000,
                "currency": "XOF",
                "status": "available",
                "description": "Politiques macroéconomiques UEMOA/CEMAC, gestion budgétaire et microfinance rurale.",
                "sample_books": [
                    {"id": "b-4", "title": "Finances Publiques en Afrique Noire Francophone", "author": "Prof. Félix ADISSO", "cover_url": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80"},
                ]
            },
            {
                "id": "bq-sciences-2026",
                "title": "Bouquet Mathématiques & Informatique Décisionnelle",
                "bouquet_type": "discipline",
                "discipline": "Mathématiques Appliquées",
                "books_count": 85,
                "annual_price": 800000,
                "currency": "XOF",
                "status": "available",
                "description": "Algèbre linéaire avancée, probabilités, intelligence artificielle et structures de données.",
                "sample_books": [
                    {"id": "b-5", "title": "Optimisation et Recherche Opérationnelle", "author": "Prof. Mahouton NORBERT", "cover_url": "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=400&q=80"},
                ]
            }
        ]
        return Response({"success": True, "data": bouquets, "error": None})


class UniversityBouquetSubscribeView(APIView):
    """POST /api/v1/partners/university/bouquets/<pk>/subscribe/ - Souscription à un bouquet."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        return Response({
            "success": True,
            "data": {
                "bouquet_id": pk,
                "status": "active",
                "start_date": timezone.now().strftime("%Y-%m-%d"),
                "end_date": (timezone.now() + timezone.timedelta(days=365)).strftime("%Y-%m-%d"),
                "message": "Souscription validée avec succès pour l'ensemble des étudiants de l'établissement."
            },
            "error": None
        })


class UniversityAffiliationsView(APIView):
    """GET /api/v1/partners/university/affiliations/ - Liste des étudiants et demandes de rattachement."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        affiliations = [
            {
                "id": "aff-101",
                "student_name": "Koffi MENSAH",
                "student_email": "koffimensah98@gmail.com",
                "student_phone": "+229 97 12 34 56",
                "matricule": "2024-UAC-10492",
                "faculty_code": "FADESP",
                "faculty_name": "Faculté de Droit et de Science Politique",
                "level": "Licence 3 Droit Privé",
                "student_card_url": "/justificatifs/carte-mensah.jpg",
                "status": "pending",
                "created_at": "2026-08-19T10:15:00Z"
            },
            {
                "id": "aff-102",
                "student_name": "Amina DIOP",
                "student_email": "aminadiop.senegal@yahoo.fr",
                "student_phone": "+221 77 654 32 10",
                "matricule": "2023-UAC-08114",
                "faculty_code": "FSS",
                "faculty_name": "Faculté des Sciences de la Santé",
                "level": "Master 1 Pharmacie",
                "student_card_url": "/justificatifs/carte-diop.jpg",
                "status": "active",
                "verified_at": "2026-08-10T14:30:00Z",
                "created_at": "2026-08-09T09:00:00Z"
            },
            {
                "id": "aff-103",
                "student_name": "Boris TCHIBINDA",
                "student_email": "boris.tchibinda@gmail.com",
                "student_phone": "+229 95 88 77 66",
                "matricule": "2024-UAC-12903",
                "faculty_code": "FASEG",
                "faculty_name": "Faculté des Sciences Économiques",
                "level": "Licence 2 Gestion",
                "student_card_url": "/justificatifs/carte-tchibinda.jpg",
                "status": "active",
                "verified_at": "2026-08-15T11:20:00Z",
                "created_at": "2026-08-14T16:45:00Z"
            },
            {
                "id": "aff-104",
                "student_name": "Chantal AGBOHOUN",
                "student_email": "chantalagbohoun@gmail.com",
                "student_phone": "+229 96 00 11 22",
                "matricule": "2025-UAC-14002",
                "faculty_code": "FAST",
                "faculty_name": "Faculté des Sciences et Techniques",
                "level": "Licence 1 Mathématiques",
                "student_card_url": "/justificatifs/carte-agbohoun.jpg",
                "status": "pending",
                "created_at": "2026-08-20T08:00:00Z"
            }
        ]
        return Response({"success": True, "data": affiliations, "error": None})


class UniversityAffiliationActionView(APIView):
    """PATCH /api/v1/partners/university/affiliations/<pk>/ - Action d'approbation ou suspension."""
    permission_classes = [permissions.AllowAny]

    def patch(self, request, pk):
        action = request.data.get("action", "approve")
        new_status = "active" if action == "approve" else "suspended"
        return Response({
            "success": True,
            "data": {
                "id": pk,
                "status": new_status,
                "verified_at": timezone.now().isoformat(),
                "message": f"Statut étudiant mis à jour ({new_status})."
            },
            "error": None
        })


class UniversityPaperOrdersView(APIView):
    """GET / POST /api/v1/partners/university/paper-orders/ - Commandes de livres papier institutionnelles."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        orders = [
            {
                "id": "ord-univ-01",
                "order_number": "CMD-UNIV-2026-089",
                "delivery_campus": "Bibliothèque Centrale — Campus Universitaire d'Abomey-Calavi",
                "contact_person": "M. SOSSOU Théophile (Conservateur en Chef)",
                "contact_phone": "+229 97 33 44 55",
                "items": [
                    {"book_id": "b-1", "title": "Traité de Droit Commercial Général OHADA", "quantity": 40, "unit_price": 12000},
                    {"book_id": "b-2", "title": "Précis de Droit Administratif Béninois", "quantity": 30, "unit_price": 9500},
                ],
                "total_amount": 765000,
                "currency": "XOF",
                "status": "in_transit",
                "tracking_number": "TRK-BEN-2026-0042",
                "pdf_order_url": "/documents/bon-commande-089.pdf",
                "created_at": "2026-08-16T09:00:00Z"
            },
            {
                "id": "ord-univ-02",
                "order_number": "CMD-UNIV-2026-074",
                "delivery_campus": "Faculté des Sciences de la Santé (FSS) — Campus Cotonou Champ de Foire",
                "contact_person": "Dr. EHOUN Constant",
                "contact_phone": "+229 95 11 22 33",
                "items": [
                    {"book_id": "b-3", "title": "Cardiologie Tropicale Clinique", "quantity": 25, "unit_price": 15000},
                ],
                "total_amount": 375000,
                "currency": "XOF",
                "status": "delivered",
                "tracking_number": "TRK-BEN-2026-0019",
                "pdf_order_url": "/documents/bon-commande-074.pdf",
                "created_at": "2026-08-01T14:30:00Z"
            }
        ]
        return Response({"success": True, "data": orders, "error": None})

    def post(self, request):
        data = request.data
        order_number = f"CMD-UNIV-2026-{int(timezone.now().timestamp()) % 1000:03d}"
        new_order = {
            "id": f"ord-univ-{int(timezone.now().timestamp())}",
            "order_number": order_number,
            "delivery_campus": data.get("delivery_campus", "Campus Universitaire"),
            "contact_person": data.get("contact_person", "Responsable Réception"),
            "contact_phone": data.get("contact_phone", ""),
            "items": data.get("items", []),
            "total_amount": data.get("total_amount", 0),
            "currency": data.get("currency", "XOF"),
            "status": "processing",
            "tracking_number": f"TRK-BEN-2026-{int(timezone.now().timestamp()) % 10000:04d}",
            "pdf_order_url": f"/documents/bon-{order_number}.pdf",
            "created_at": timezone.now().isoformat(),
        }
        return Response({"success": True, "data": new_order, "error": None}, status=status.HTTP_201_CREATED)


class UniversityRoyaltiesView(APIView):
    """GET /api/v1/partners/university/royalties/ - Suivi des redevances 15% et versements."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        statements = [
            {
                "id": "roy-01",
                "reference": "REL-ROY-UNIV-2026-T2",
                "period": "2e Trimestre 2026 (Avril - Juin)",
                "total_sales_catalog": 8333333,
                "royalty_rate": 15.00,
                "net_royalty_amount": 1250000,
                "currency": "XOF",
                "status": "available",
                "pdf_statement_url": "/documents/bordereau-redevance-t2.pdf",
                "created_at": "2026-07-05T10:00:00Z"
            },
            {
                "id": "roy-02",
                "reference": "REL-ROY-UNIV-2026-T1",
                "period": "1er Trimestre 2026 (Janvier - Mars)",
                "total_sales_catalog": 12000000,
                "royalty_rate": 15.00,
                "net_royalty_amount": 1800000,
                "currency": "XOF",
                "status": "paid",
                "pdf_statement_url": "/documents/bordereau-redevance-t1.pdf",
                "created_at": "2026-04-05T10:00:00Z"
            },
            {
                "id": "roy-03",
                "reference": "REL-ROY-UNIV-2025-T4",
                "period": "4e Trimestre 2025 (Octobre - Décembre)",
                "total_sales_catalog": 13333333,
                "royalty_rate": 15.00,
                "net_royalty_amount": 2000000,
                "currency": "XOF",
                "status": "paid",
                "pdf_statement_url": "/documents/bordereau-redevance-t4.pdf",
                "created_at": "2026-01-05T10:00:00Z"
            }
        ]
        return Response({
            "success": True,
            "data": {
                "available_balance": 1250000,
                "total_paid": 3800000,
                "contractual_rate": 15.00,
                "currency": "XOF",
                "min_withdrawal_threshold": 100000,
                "statements": statements
            },
            "error": None
        })


class UniversityRoyaltyWithdrawView(APIView):
    """POST /api/v1/partners/university/royalties/withdraw/ - Demande de versement des redevances."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        amount = request.data.get("amount", 1250000)
        return Response({
            "success": True,
            "data": {
                "request_reference": f"REQ-ROY-UNIV-2026-{int(timezone.now().timestamp()) % 1000:03d}",
                "amount": amount,
                "currency": "XOF",
                "status": "processing",
                "message": "Demande de versement transmise à la Trésorerie & Direction Financière LAHA."
            },
            "error": None
        })


class UniversityProfileView(APIView):
    """GET / PATCH /api/v1/partners/university/profile/ - Profil et identité de l'établissement."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        profile = {
            "id": "univ-uac",
            "name": "Université d'Abomey-Calavi",
            "short_name": "UAC",
            "country": "BJ",
            "city": "Abomey-Calavi / Cotonou",
            "address": "Campus Universitaire d'Abomey-Calavi, BP 526, Bénin",
            "rector_name": "Prof. Félicien AVLESSI",
            "academic_director_name": "Prof. Patrick HOUESSOU",
            "contact_email": "rectorat@uac.bj",
            "contact_phone": "+229 21 36 00 74",
            "bank_name": "Trésor Public du Bénin / Ecobank Bénin",
            "bank_iban": "BJ0610100100198765432100",
            "bank_swift": "ECOBBJBJ",
            "momo_number": "+229 97 00 00 01",
            "contract_reference": "CONV-UAC-LAHA-2025-01",
            "royalty_rate": 15.00,
            "is_active": True,
        }
        return Response({"success": True, "data": profile, "error": None})

    def patch(self, request):
        return Response({
            "success": True,
            "data": {**request.data, "updated_at": timezone.now().isoformat()},
            "error": None
        })
