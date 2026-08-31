"""Vues REST pour l'Espace Éditeur Tiers (publishers_portal)."""
import uuid
import secrets
import hashlib
from decimal import Decimal
from django.db.models import Sum, Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from django.conf import settings
from .models import (
    PublisherProfile,
    PublisherEntityType,
    PublisherBookDeposit,
    PublisherDepositStatus,
    PublisherValidationStep,
    PublisherBatchImportLog,
    PublisherApiKey,
    PublisherRoyaltyPayment,
    PublisherAuditLog,
)
from .permissions import HasValidPublisherApiKey


def get_or_create_publisher_profile(user) -> PublisherProfile:
    prof, _ = PublisherProfile.objects.get_or_create(
        user=user,
        defaults={
            "company_name": f"Éditions {user.last_name or user.first_name or 'Partenaire'}",
            "entity_type": PublisherEntityType.COMPANY,
            "contact_person": f"{user.first_name} {user.last_name}".strip() or "Responsable Éditorial",
            "contact_email": user.email or "partenaires@editions-afrique.com",
            "contact_phone": getattr(user, "phone", "+229 97 00 11 22"),
            "headquarters_address": "Avenue Jean-Paul II, Cotonou, Bénin",
            "contract_reference": "CTR-PUB-2025-08",
            "contractual_royalty_rate": Decimal("22.00"),
        }
    )
    return prof


class PublisherKpisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.protection.models import TraceAcces
        from apps.commerce.models import LigneCommande
        from apps.catalog.models import Ouvrage
        from django.db.models import F

        user = request.user
        prof = get_or_create_publisher_profile(user)
        deposits_qs = PublisherBookDeposit.objects.filter(publisher=prof)

        total_books = deposits_qs.count()
        pending_validations = deposits_qs.exclude(status=PublisherDepositStatus.PUBLISHED).count()
        published_books = deposits_qs.filter(status=PublisherDepositStatus.PUBLISHED).count()

        totals = deposits_qs.aggregate(
            total_consultations=Sum("consultations_count"),
            total_downloads=Sum("downloads_count"),
            total_revenue=Sum("revenue_generated"),
        )

        total_consultations_acc = 0
        total_revenue_acc = 0.0

        for b in deposits_qs:
            real_c = 0
            real_r = 0.0
            if b.status == PublisherDepositStatus.PUBLISHED:
                linked_ouvrage = Ouvrage.objects.filter(isbn=b.isbn_digital).first()
                if linked_ouvrage:
                    real_c = TraceAcces.objects.filter(ouvrage=linked_ouvrage).count()
                    lignes = LigneCommande.objects.filter(
                        ouvrage=linked_ouvrage, commande__statut_paiement='paid'
                    )
                    real_r = float(
                        lignes.aggregate(t=Sum(F('unit_price') * F('quantity')))['t'] or 0
                    )
                else:
                    real_c = b.consultations_count or 0
                    real_r = float(b.revenue_generated or 0.0)
                total_consultations_acc += real_c
                total_revenue_acc += real_r

        rate = float(prof.contractual_royalty_rate)
        pending_royalties = (total_revenue_acc * rate) / 100

        return Response({
            "success": True,
            "data": {
                "totalBooks": total_books,
                "pendingValidations": pending_validations,
                "publishedBooks": published_books,
                "totalConsultations": total_consultations_acc,
                "totalDownloads": totals["total_downloads"] or 0,
                "totalRevenue": total_revenue_acc,
                "pendingRoyalties": pending_royalties,
                "contractualRoyaltyRate": rate,
                "contractReference": prof.contract_reference or "CTR-PUB-2025-08",
            },
            "error": None,
        })


class PublisherCatalogListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.protection.models import TraceAcces
        from apps.commerce.models import LigneCommande
        from apps.catalog.models import Ouvrage
        from django.db.models import F

        user = request.user
        prof = get_or_create_publisher_profile(user)
        qs = PublisherBookDeposit.objects.filter(publisher=prof)

        status_filter = request.query_params.get("status", "").strip()
        discipline_filter = request.query_params.get("discipline", "").strip()
        search_query = request.query_params.get("search", "").strip()

        if status_filter and status_filter != "all":
            qs = qs.filter(status=status_filter)
        if discipline_filter and discipline_filter != "all":
            qs = qs.filter(discipline__icontains=discipline_filter)
        if search_query:
            qs = qs.filter(
                Q(title__icontains=search_query) |
                Q(isbn_digital__icontains=search_query) |
                Q(isbn_print__icontains=search_query) |
                Q(authors__icontains=search_query)
            )

        data = []
        for b in qs:
            real_consultations = 0
            real_revenue = 0.0
            if b.status == PublisherDepositStatus.PUBLISHED:
                linked_ouvrage = Ouvrage.objects.filter(isbn=b.isbn_digital).first()
                if linked_ouvrage:
                    real_consultations = TraceAcces.objects.filter(ouvrage=linked_ouvrage).count()
                    lignes = LigneCommande.objects.filter(
                        ouvrage=linked_ouvrage, commande__statut_paiement='paid'
                    )
                    real_revenue = float(
                        lignes.aggregate(t=Sum(F('unit_price') * F('quantity')))['t'] or 0
                    )

            if b.status == PublisherDepositStatus.PUBLISHED:
                consultations_final = real_consultations
                revenue_final = real_revenue
            else:
                consultations_final = 0
                revenue_final = 0.0

            data.append({
                "id": str(b.id),
                "publisher_id": str(prof.id),
                "publisher_name": prof.company_name,
                "title": b.title,
                "subtitle": b.subtitle,
                "isbn_digital": b.isbn_digital,
                "isbn_print": b.isbn_print,
                "doi": b.doi,
                "authors": b.authors if isinstance(b.authors, list) else [str(b.authors)],
                "contributors": b.contributors,
                "discipline": b.discipline,
                "language": b.language,
                "keywords": b.keywords,
                "target_audience": b.target_audience,
                "price": float(b.price),
                "currency": b.currency,
                "sales_model": b.sales_model,
                "allowed_territories": b.allowed_territories,
                "embargo_date": b.embargo_date.isoformat() if b.embargo_date else None,
                "summary": b.summary,
                "authors_bio": b.authors_bio,
                "cover_url": b.cover_url or "/placeholder-cover.jpg",
                "file_url": b.file_url,
                "file_format": b.file_format,
                "licence_type": b.licence_type,
                "contract_reference": prof.contract_reference,
                "contractual_royalty_rate": float(prof.contractual_royalty_rate),
                "status": b.status,
                "validation_step": b.validation_step,
                "editorial_comment": b.editorial_comment,
                "consultations_count": consultations_final,
                "downloads_count": b.downloads_count,
                "revenue_generated": revenue_final,
                "created_at": b.created_at.isoformat(),
                "protection_config": {
                    "watermark_enabled": b.watermark_enabled,
                    "watermark_position": b.watermark_position,
                    "watermark_opacity": b.watermark_opacity,
                    "user_watermarking": True,
                    "lcp_drm_enabled": b.lcp_drm_enabled,
                    "max_allowed_devices": 3,
                    "max_loan_days": 14,
                    "disable_copy_paste": b.disable_copy_paste,
                    "disable_print": b.disable_print,
                    "audio_encryption_auto": True,
                    "access_tracing_auto": True,
                }
            })

        return Response({"success": True, "data": data, "error": None})


class PublisherCatalogDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        user = request.user
        prof = get_or_create_publisher_profile(user)
        try:
            b = PublisherBookDeposit.objects.get(Q(id=pk) | Q(isbn_digital=pk), publisher=prof)

            from apps.protection.models import TraceAcces
            from apps.commerce.models import LigneCommande
            from apps.catalog.models import Ouvrage
            from django.db.models import F

            real_consultations = 0
            real_revenue = 0.0
            if b.status == PublisherDepositStatus.PUBLISHED:
                linked_ouvrage = Ouvrage.objects.filter(isbn=b.isbn_digital).first()
                if linked_ouvrage:
                    real_consultations = TraceAcces.objects.filter(ouvrage=linked_ouvrage).count()
                    lignes = LigneCommande.objects.filter(
                        ouvrage=linked_ouvrage, commande__statut_paiement='paid'
                    )
                    real_revenue = float(
                        lignes.aggregate(t=Sum(F('unit_price') * F('quantity')))['t'] or 0
                    )

            if b.status == PublisherDepositStatus.PUBLISHED:
                consultations_final = real_consultations
                revenue_final = real_revenue
            else:
                consultations_final = 0
                revenue_final = 0.0

            return Response({
                "success": True,
                "data": {
                    "id": str(b.id),
                    "publisher_id": str(prof.id),
                    "publisher_name": prof.company_name,
                    "title": b.title,
                    "subtitle": b.subtitle,
                    "isbn_digital": b.isbn_digital,
                    "isbn_print": b.isbn_print,
                    "doi": b.doi,
                    "authors": b.authors if isinstance(b.authors, list) else [str(b.authors)],
                    "contributors": b.contributors,
                    "discipline": b.discipline,
                    "language": b.language,
                    "keywords": b.keywords,
                    "target_audience": b.target_audience,
                    "price": float(b.price),
                    "currency": b.currency,
                    "sales_model": b.sales_model,
                    "allowed_territories": b.allowed_territories,
                    "embargo_date": b.embargo_date.isoformat() if b.embargo_date else None,
                    "summary": b.summary,
                    "authors_bio": b.authors_bio,
                    "cover_url": b.cover_url or "/placeholder-cover.jpg",
                    "file_url": b.file_url,
                    "file_format": b.file_format,
                    "licence_type": b.licence_type,
                    "contract_reference": prof.contract_reference,
                    "contractual_royalty_rate": float(prof.contractual_royalty_rate),
                    "status": b.status,
                    "validation_step": b.validation_step,
                    "editorial_comment": b.editorial_comment,
                    "consultations_count": consultations_final,
                    "downloads_count": b.downloads_count,
                    "revenue_generated": revenue_final,
                    "created_at": b.created_at.isoformat(),
                    "protection_config": {
                        "watermark_enabled": b.watermark_enabled,
                        "watermark_position": b.watermark_position,
                        "watermark_opacity": b.watermark_opacity,
                        "user_watermarking": True,
                        "lcp_drm_enabled": b.lcp_drm_enabled,
                        "max_allowed_devices": 3,
                        "max_loan_days": 14,
                        "disable_copy_paste": b.disable_copy_paste,
                        "disable_print": b.disable_print,
                        "audio_encryption_auto": True,
                        "access_tracing_auto": True,
                    }
                },
                "error": None,
            })
        except PublisherBookDeposit.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Ouvrage introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )


class PublisherAiMetadataExtractView(APIView):
    """Extraction assistée par IA (Section 5.3 & 4.1.C) — réutilise le vrai service OpenAI
    déjà utilisé par le flux Maquettiste, pas une simulation dédiée."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        from apps.ai_engine.services.openai_service import (
            analyze_document_with_openai,
            extract_text_sample_from_bytes,
        )

        title = request.data.get("title", "").strip()
        filename = request.data.get("filename", "").strip() or title or "document"
        uploaded_file = request.FILES.get("file")

        text_sample = ""
        total_pages = 0

        if uploaded_file:
            file_bytes = uploaded_file.read()
            file_ext = uploaded_file.name.rsplit(".", 1)[-1].lower() if "." in uploaded_file.name else "pdf"
            try:
                text_sample, total_pages = extract_text_sample_from_bytes(file_bytes, file_ext)
            except Exception:
                text_sample, total_pages = "", 0

        result = analyze_document_with_openai(
            text_sample=text_sample,
            filename=filename,
            total_pages=total_pages,
        )

        return Response({
            "success": True,
            "data": {
                "summary": result.get("summary", ""),
                "discipline": result.get("genre_category") or result.get("discipline_suggestion") or result.get("discipline", ""),
                "language": result.get("language_code") or result.get("language", "fr"),
                "country": result.get("country", "BJ"),
                "suggested_keywords": result.get("keywords", []),
                "target_audience": result.get("target_audience", "universitaire"),
                "analysis_mode": "openai" if getattr(settings, "OPENAI_API_KEY", None) else "heuristic",
            },
            "error": None,
        })



class PublisherDepositsView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _save_uploaded_file(self, request):
        from django.core.files.storage import default_storage
        uploaded = request.FILES.get("file")
        if not uploaded:
            return ""
        try:
            saved_path = default_storage.save(f"publisher_deposits/{uploaded.name}", uploaded)
            return default_storage.url(saved_path)
        except Exception:
            return ""

    def post(self, request):
        import json as json_lib
        user = request.user
        prof = get_or_create_publisher_profile(user)
        data = request.data

        title = data.get("title", "").strip()
        isbn_digital = data.get("isbn_digital", "").strip() or f"978-2-{secrets.token_hex(4).upper()}"

        if not title:
            return Response(
                {"success": False, "data": None, "error": "Le titre de l'ouvrage est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST
            )

        authors = data.get("authors")
        if isinstance(authors, str):
            try:
                authors = json_lib.loads(authors)
            except Exception:
                authors = [a.strip() for a in authors.split(",") if a.strip()]
        if not authors or not isinstance(authors, list):
            authors = [f"{user.first_name} {user.last_name}".strip() or "Auteur Partenaire"]

        contributors = data.get("contributors", [])
        if isinstance(contributors, str):
            try:
                contributors = json_lib.loads(contributors)
            except Exception:
                contributors = []

        keywords = data.get("keywords", [])
        if isinstance(keywords, str):
            try:
                keywords = json_lib.loads(keywords)
            except Exception:
                keywords = [k.strip() for k in keywords.split(",") if k.strip()]

        allowed_territories = data.get("allowed_territories", ["Bénin", "Sénégal", "Togo", "Côte d'Ivoire"])
        if isinstance(allowed_territories, str):
            try:
                allowed_territories = json_lib.loads(allowed_territories)
            except Exception:
                allowed_territories = [t.strip() for t in allowed_territories.split(",") if t.strip()]

        protection_config = data.get("protection_config", {})
        if isinstance(protection_config, str):
            try:
                protection_config = json_lib.loads(protection_config)
            except Exception:
                protection_config = {}

        deposit = PublisherBookDeposit.objects.create(
            publisher=prof,
            title=title,
            subtitle=data.get("subtitle", ""),
            isbn_digital=isbn_digital,
            isbn_print=data.get("isbn_print", ""),
            doi=data.get("doi", ""),
            authors=authors,
            contributors=contributors,
            discipline=data.get("discipline", "Sciences Générales"),
            language=data.get("language", "fr"),
            keywords=keywords,
            target_audience=data.get("target_audience", "universitaire"),
            price=Decimal(str(data.get("price", 5000))),
            currency="XOF",
            sales_model=data.get("sales_model", "purchase"),
            allowed_territories=allowed_territories,
            summary=data.get("summary", "Ouvrage déposé pour examen par le comité éditorial."),
            authors_bio=data.get("authors_bio", ""),
            cover_url=data.get("cover_url", "/placeholder-cover.jpg"),
            file_url=self._save_uploaded_file(request) if request.FILES.get("file") else data.get("file_url", ""),
            file_format=data.get("file_format", "pdf"),
            licence_type=data.get("licence_type", "tous_droits_reserves"),
            status=PublisherDepositStatus.PENDING,
            validation_step=PublisherValidationStep.STEP_1,
            watermark_enabled=protection_config.get("watermark_enabled", True),
            watermark_position=protection_config.get("watermark_position", "bottom-right"),
            watermark_opacity=protection_config.get("watermark_opacity", 30),
            lcp_drm_enabled=protection_config.get("lcp_drm_enabled", True),
            disable_copy_paste=protection_config.get("disable_copy_paste", True),
            disable_print=protection_config.get("disable_print", False),
        )


        return Response(
            {
                "success": True,
                "data": {
                    "id": str(deposit.id),
                    "title": deposit.title,
                    "status": deposit.status,
                    "validation_step": deposit.validation_step,
                },
                "error": None,
            },
            status=status.HTTP_201_CREATED
        )


class PublisherBatchImportView(APIView):
    """POST /api/v1/publishers/deposits/batch/ - Import réel CSV/JSON/ONIX 3.0.
    GET  /api/v1/publishers/deposits/batch/ - Historique des imports de l'éditeur connecté.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        """Renvoie l'historique des imports batch de l'éditeur connecté."""
        prof = get_or_create_publisher_profile(request.user)
        logs = PublisherBatchImportLog.objects.filter(publisher=prof).order_by('-created_at')[:50]
        data = [
            {
                "batch_id": str(log.id),
                "file_name": log.file_name,
                "format": log.format,
                "total_records": log.total_records,
                "success_count": log.success_count,
                "error_count": log.error_count,
                "errors": log.errors,
                "status": log.status,
                "created_at": log.created_at.isoformat(),
            }
            for log in logs
        ]
        return Response({"success": True, "data": data})

    def post(self, request):
        import csv
        import io
        import json as json_lib
        import xml.etree.ElementTree as ET

        user = request.user
        prof = get_or_create_publisher_profile(user)

        uploaded_file = request.FILES.get("file")
        format_type = request.data.get("format", "csv").lower()

        if not uploaded_file:
            return Response({
                "success": False, "error": "Aucun fichier fourni pour l'import."
            }, status=status.HTTP_400_BAD_REQUEST)

        filename = uploaded_file.name
        raw_bytes = uploaded_file.read()

        records = []
        parse_errors = []

        try:
            if format_type == "csv":
                text = raw_bytes.decode("utf-8-sig")
                reader = csv.DictReader(io.StringIO(text))
                for idx, row in enumerate(reader, start=2):
                    records.append((idx, {
                        "title": row.get("title", "").strip(),
                        "isbn_digital": row.get("isbn_digital", "").strip(),
                        "discipline": row.get("discipline", "Sciences Générales").strip(),
                        "price": row.get("price", "5000").strip(),
                        "language": row.get("language", "fr").strip(),
                        "summary": row.get("summary", "").strip(),
                        "authors": [a.strip() for a in row.get("authors", "").split(";") if a.strip()],
                    }))

            elif format_type == "json":
                data = json_lib.loads(raw_bytes.decode("utf-8"))
                items = data if isinstance(data, list) else data.get("books", [])
                for idx, item in enumerate(items, start=1):
                    records.append((idx, {
                        "title": item.get("title", "").strip(),
                        "isbn_digital": item.get("isbn_digital", ""),
                        "discipline": item.get("discipline", "Sciences Générales"),
                        "price": str(item.get("price", 5000)),
                        "language": item.get("language", "fr"),
                        "summary": item.get("summary", ""),
                        "authors": item.get("authors", []),
                    }))

            elif format_type in ("onix_3", "onix", "xml"):
                root = ET.fromstring(raw_bytes)
                ns = {"o": "http://ns.editeur.org/onix/3.0/reference"}
                products = root.findall(".//Product") or root.findall(".//o:Product", ns)
                for idx, product in enumerate(products, start=1):
                    def _find_text(tag):
                        el = product.find(f".//{tag}")
                        return el.text.strip() if el is not None and el.text else ""

                    isbn = _find_text("ProductIdentifier/IDValue") or _find_text("IDValue")
                    title = _find_text("TitleText") or _find_text("Title")
                    if not isbn or not title:
                        parse_errors.append({
                            "line_number": idx,
                            "isbn_or_title": title or "Titre manquant",
                            "error_message": "Balise <ProductIdentifier> ou <TitleText> manquante/non conforme ONIX 3.0."
                        })
                        continue

                    records.append((idx, {
                        "title": title, "isbn_digital": isbn,
                        "discipline": _find_text("Subject/SubjectHeadingText") or "Sciences Générales",
                        "price": _find_text("Price/PriceAmount") or "5000",
                        "language": _find_text("Language/LanguageCode") or "fr",
                        "summary": _find_text("TextContent/Text") or "",
                        "authors": [_find_text("Contributor/PersonName")] if _find_text("Contributor/PersonName") else [],
                    }))
            else:
                return Response({
                    "success": False, "error": f"Format non supporté : {format_type}. Utilisez csv, json ou onix_3."
                }, status=400)

        except Exception as parse_err:
            return Response({
                "success": False,
                "error": f"Impossible de lire le fichier ({format_type.upper()}) : {parse_err}"
            }, status=400)

        success_count = 0
        for line_number, rec in records:
            if not rec.get("title"):
                parse_errors.append({
                    "line_number": line_number, "isbn_or_title": rec.get("isbn_digital", "—"),
                    "error_message": "Titre manquant — ligne ignorée."
                })
                continue
            try:
                PublisherBookDeposit.objects.create(
                    publisher=prof,
                    title=rec["title"],
                    isbn_digital=rec.get("isbn_digital") or f"978-2-{secrets.token_hex(4).upper()}",
                    discipline=rec.get("discipline") or "Sciences Générales",
                    language=rec.get("language") or "fr",
                    authors=rec.get("authors") or [],
                    price=Decimal(str(rec.get("price") or "5000")),
                    summary=rec.get("summary") or "Ouvrage importé par lot — en attente de complément.",
                    status=PublisherDepositStatus.PENDING,
                    validation_step=PublisherValidationStep.STEP_1,
                )
                success_count += 1
            except Exception as create_err:
                parse_errors.append({
                    "line_number": line_number, "isbn_or_title": rec.get("title", "—"),
                    "error_message": str(create_err)
                })

        log = PublisherBatchImportLog.objects.create(
            publisher=prof,
            file_name=filename,
            format=format_type,
            total_records=success_count + len(parse_errors),
            success_count=success_count,
            error_count=len(parse_errors),
            errors=parse_errors[:50],
            status="completed_with_errors" if parse_errors else "completed"
        )

        return Response({
            "success": True,
            "data": {
                "batch_id": str(log.id),
                "file_name": log.file_name,
                "format": log.format,
                "total_records": log.total_records,
                "success_count": log.success_count,
                "error_count": log.error_count,
                "errors": log.errors,
                "status": log.status,
                "created_at": log.created_at.isoformat(),
            },
            "error": None,
        })



class PublisherRoyaltiesListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        prof = get_or_create_publisher_profile(user)
        payments = PublisherRoyaltyPayment.objects.filter(publisher=prof)
        data = [
            {
                "id": str(p.id),
                "reference": p.reference,
                "period": p.period,
                "total_sales_amount": float(p.total_sales_amount),
                "royalty_rate": float(p.royalty_rate),
                "net_royalty_amount": float(p.net_royalty_amount),
                "currency": p.currency,
                "status": p.status,
                "pdf_statement_url": p.pdf_statement_url or None,
                "paid_at": p.paid_at.isoformat() if p.paid_at else None,
            }
            for p in payments
        ]
        return Response({"success": True, "data": data, "error": None})


class PublisherRoyaltiesWithdrawView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        prof = get_or_create_publisher_profile(user)

        try:
            amount = Decimal(str(request.data.get("amount", 0)))
        except (ValueError, TypeError):
            return Response({"success": False, "error": "Montant invalide."}, status=400)

        if amount <= 0:
            return Response({"success": False, "error": "Le montant doit être positif."}, status=400)

        from apps.catalog.models import Ouvrage
        from apps.commerce.models import LigneCommande
        from django.db.models import F

        deposits_qs = PublisherBookDeposit.objects.filter(publisher=prof)
        total_revenue_acc = 0.0
        for b in deposits_qs:
            real_r = 0.0
            if b.status == PublisherDepositStatus.PUBLISHED:
                linked_ouvrage = Ouvrage.objects.filter(isbn=b.isbn_digital).first()
                if linked_ouvrage:
                    lignes = LigneCommande.objects.filter(
                        ouvrage=linked_ouvrage, commande__statut_paiement='paid'
                    )
                    real_r = float(
                        lignes.aggregate(t=Sum(F('unit_price') * F('quantity')))['t'] or 0
                    )
                else:
                    real_r = float(b.revenue_generated or 0.0)
                total_revenue_acc += real_r

        rate = float(prof.contractual_royalty_rate)
        already_withdrawn = float(
            PublisherRoyaltyPayment.objects.filter(
                publisher=prof, status__in=["pending", "paid"]
            ).aggregate(t=Sum("net_royalty_amount"))["t"] or 0
        )
        available_balance = max(0.0, (total_revenue_acc * rate / 100) - already_withdrawn)

        if float(amount) > available_balance:
            return Response({
                "success": False,
                "error": f"Montant demandé ({amount} XOF) supérieur au solde disponible ({available_balance:.2f} XOF)."
            }, status=400)

        ref = f"VIR-EDT-{timezone.now().strftime('%Y%m')}-{secrets.token_hex(3).upper()}"
        payment = PublisherRoyaltyPayment.objects.create(
            publisher=prof,
            reference=ref,
            period=f"Demande de virement {timezone.now().strftime('%B %Y')}",
            total_sales_amount=Decimal(str(amount)),
            royalty_rate=prof.contractual_royalty_rate,
            net_royalty_amount=Decimal(str(amount)),
            currency="XOF",
            status="pending",
            pdf_statement_url=None
        )

        return Response({
            "success": True,
            "data": {
                "reference": payment.reference,
                "amount": float(payment.net_royalty_amount),
                "status": payment.status,
            },
            "error": None,
        })


class PublisherApiKeysView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        prof = get_or_create_publisher_profile(user)
        keys = PublisherApiKey.objects.filter(publisher=prof)
        data = [
            {
                "id": str(k.id),
                "name": k.name,
                "client_id": k.client_id,
                "client_secret_masked": k.client_secret_masked,
                "permissions": k.permissions,
                "created_at": k.created_at.isoformat(),
                "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
                "status": k.status,
            }
            for k in keys
        ]
        return Response({"success": True, "data": data, "error": None})

    def post(self, request):
        user = request.user
        prof = get_or_create_publisher_profile(user)
        name = request.data.get("name", "Connecteur ERP").strip()
        permissions = request.data.get("permissions", ["catalog:read", "catalog:write"])

        raw_secret = f"laha_sec_{secrets.token_urlsafe(32)}"
        client_id = f"pub_cli_{secrets.token_hex(8)}"
        secret_hash = hashlib.sha256(raw_secret.encode()).hexdigest()
        masked = f"{raw_secret[:10]}...{raw_secret[-4:]}"

        key = PublisherApiKey.objects.create(
            publisher=prof,
            name=name,
            client_id=client_id,
            client_secret_hash=secret_hash,
            client_secret_masked=masked,
            permissions=permissions,
            status="active"
        )

        return Response({
            "success": True,
            "data": {
                "id": str(key.id),
                "name": key.name,
                "client_id": key.client_id,
                "client_secret": raw_secret,  # Renvoyé une seule fois à la création
                "client_secret_masked": key.client_secret_masked,
                "permissions": key.permissions,
                "created_at": key.created_at.isoformat(),
                "status": key.status,
            },
            "error": None,
        })


class PublisherApiKeyRevokeView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        user = request.user
        prof = get_or_create_publisher_profile(user)
        try:
            key = PublisherApiKey.objects.get(id=pk, publisher=prof)
            key.status = "revoked"
            key.save(update_fields=["status"])
            return Response({"success": True, "data": {"id": str(key.id), "status": "revoked"}, "error": None})
        except PublisherApiKey.DoesNotExist:
            return Response({"success": False, "data": None, "error": "Clé introuvable."}, status=status.HTTP_404_NOT_FOUND)


class PublisherAuditLogsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        prof = get_or_create_publisher_profile(user)
        logs = PublisherAuditLog.objects.filter(publisher=prof)[:50]
        data = [
            {
                "id": str(l.id),
                "book_id": l.book_id,
                "book_title": l.book_title,
                "action_type": l.action_type,
                "user_masked": l.user_masked,
                "device_type": l.device_type,
                "ip_address_masked": l.ip_address_masked,
                "location": l.location,
                "timestamp": l.timestamp.isoformat(),
                "is_suspicious": l.is_suspicious,
            }
            for l in logs
        ]
        return Response({"success": True, "data": data, "error": None})


class PublisherProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        prof = get_or_create_publisher_profile(user)
        return Response({
            "success": True,
            "data": {
                "id": str(prof.id),
                "entity_type": prof.entity_type,
                "company_name": prof.company_name,
                "trade_name": prof.trade_name,
                "nif_number": prof.nif_number,
                "rccm_number": prof.rccm_number,
                "identity_card_number": prof.identity_card_number,
                "country": prof.country,
                "city": prof.city,
                "headquarters_address": prof.headquarters_address,
                "contact_person": prof.contact_person,
                "contact_email": prof.contact_email,
                "contact_phone": prof.contact_phone,
                "bank_name": prof.bank_name,
                "bank_iban": prof.bank_iban,
                "bank_swift": prof.bank_swift,
                "momo_number": prof.momo_number,
                "contract_reference": prof.contract_reference,
                "contractual_royalty_rate": float(prof.contractual_royalty_rate),
                "is_verified": prof.is_verified,
            },
            "error": None,
        })

    def patch(self, request):
        user = request.user
        prof = get_or_create_publisher_profile(user)
        data = request.data

        fields = [
            "entity_type", "company_name", "trade_name", "nif_number",
            "rccm_number", "identity_card_number", "country", "city",
            "headquarters_address", "contact_person", "contact_email",
            "contact_phone", "bank_name", "bank_iban", "bank_swift",
            "momo_number"
        ]
        for f in fields:
            if f in data:
                setattr(prof, f, data[f])

        prof.save()
        return self.get(request)


class PublisherBookProtectionView(APIView):
    """PATCH /api/v1/publishers/catalog/{pk}/protection/ - Configurer le DRM d'un dépôt éditeur."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        profile = get_or_create_publisher_profile(request.user)
        try:
            deposit = PublisherBookDeposit.objects.get(id=pk, publisher=profile)
        except PublisherBookDeposit.DoesNotExist:
            return Response({"success": False, "error": "Dépôt introuvable."}, status=404)

        config = request.data.get("protection_config", {})

        if "watermark_enabled" in config:
            deposit.watermark_enabled = config["watermark_enabled"]
        if "watermark_position" in config:
            deposit.watermark_position = config["watermark_position"]
        if "watermark_opacity" in config:
            deposit.watermark_opacity = int(config["watermark_opacity"])
        if "lcp_drm_enabled" in config:
            deposit.lcp_drm_enabled = config["lcp_drm_enabled"]
        if "disable_copy_paste" in config:
            deposit.disable_copy_paste = config["disable_copy_paste"]
        if "disable_print" in config:
            deposit.disable_print = config["disable_print"]

        deposit.save()

        return Response({
            "success": True,
            "message": "Configuration DRM mise à jour.",
            "data": {
                "watermark_enabled": deposit.watermark_enabled,
                "watermark_position": deposit.watermark_position,
                "watermark_opacity": deposit.watermark_opacity,
                "lcp_drm_enabled": deposit.lcp_drm_enabled,
                "disable_copy_paste": deposit.disable_copy_paste,
                "disable_print": deposit.disable_print,
            }
        })


class PublisherExternalDepositView(APIView):
    """POST /api/v1/publishers/external/deposits/ - Dépôt programmatique authentifié par clé API."""
    permission_classes = [HasValidPublisherApiKey]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        prof = request.publisher_profile
        data = request.data

        title = data.get("title", "").strip()
        if not title:
            return Response({"success": False, "error": "Le titre est obligatoire."}, status=400)

        deposit = PublisherBookDeposit.objects.create(
            publisher=prof,
            title=title,
            isbn_digital=data.get("isbn_digital", "") or f"978-2-{secrets.token_hex(4).upper()}",
            discipline=data.get("discipline", "Sciences Générales"),
            language=data.get("language", "fr"),
            authors=data.get("authors", []),
            price=Decimal(str(data.get("price", 5000))),
            summary=data.get("summary", "Ouvrage déposé via API externe."),
            status=PublisherDepositStatus.PENDING,
            validation_step=PublisherValidationStep.STEP_1,
        )

        return Response({
            "success": True,
            "data": {"id": str(deposit.id), "title": deposit.title, "status": deposit.status},
        }, status=status.HTTP_201_CREATED)


class PublisherExternalDepositStatusView(APIView):
    """GET /api/v1/publishers/external/deposits/<id>/ - Statut d'un dépôt, via clé API."""
    permission_classes = [HasValidPublisherApiKey]

    def get(self, request, pk):
        prof = request.publisher_profile
        try:
            deposit = PublisherBookDeposit.objects.get(id=pk, publisher=prof)
        except PublisherBookDeposit.DoesNotExist:
            return Response({"success": False, "error": "Dépôt introuvable."}, status=404)

        return Response({
            "success": True,
            "data": {
                "id": str(deposit.id), "title": deposit.title, "status": deposit.status,
                "validation_step": deposit.validation_step,
                "consultations_count": deposit.consultations_count,
                "downloads_count": deposit.downloads_count,
            }
        })


class PublisherDepositEditorialReviewPermission(permissions.BasePermission):
    """Conformité éditoriale — rôle explicitement attribué au Chef Maquettiste par le CDC
    ("Chef Maquettiste (validateur) — Validation des livres mis en ligne"), avec supervision
    de l'Admin ("Vision globale & statistiques — Accès à tous les tableaux de bord")."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ('chief_layout', 'admin', 'super_admin')


class PublisherDepositRightsReviewPermission(permissions.BasePermission):
    """Vérification des droits — rôle explicitement attribué au Juriste par le CDC
    ("Droits d'auteur & pourcentages — Définition et enregistrement des pourcentages de
    droits d'auteur pour chaque livre"), avec supervision de l'Admin."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ('legal_reviewer', 'admin', 'super_admin')


class PublisherDepositReviewListView(APIView):
    """GET /api/v1/publishers/admin/deposits/ - File d'examen des dépôts éditeurs tiers.
    Accessible en lecture au Chef Maquettiste, au Juriste, et à l'Admin — chacun y voit
    l'état des deux volets, mais ne peut agir que sur le sien (vues suivantes)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role not in ('chief_layout', 'legal_reviewer', 'admin', 'super_admin'):
            return Response({"success": False, "error": "Accès réservé au Chef Maquettiste, au Juriste ou à l'Admin."}, status=403)

        status_filter = request.query_params.get('status', '')
        qs = PublisherBookDeposit.objects.select_related('publisher').order_by('-created_at')
        if status_filter and status_filter != 'all':
            qs = qs.filter(status=status_filter)

        data = [{
            "id": str(d.id),
            "title": d.title,
            "publisher_name": d.publisher.company_name,
            "isbn_digital": d.isbn_digital,
            "discipline": d.discipline,
            "price": float(d.price),
            "status": d.status,
            "editorial_status": d.editorial_status,
            "editorial_comment": d.editorial_comment,
            "rights_status": d.rights_status,
            "rights_comment": d.rights_comment,
            "file_url": d.file_url,
            "created_at": d.created_at.isoformat(),
        } for d in qs]
        return Response({"success": True, "data": data})


class PublisherDepositEditorialDecisionView(APIView):
    """POST /api/v1/publishers/admin/deposits/<id>/editorial-decision/
    Décision de conformité éditoriale — Chef Maquettiste (+ Admin en supervision)."""
    permission_classes = [permissions.IsAuthenticated, PublisherDepositEditorialReviewPermission]

    def post(self, request, id):
        decision = request.data.get("decision")
        comment = request.data.get("comment", "").strip()

        try:
            deposit = PublisherBookDeposit.objects.get(id=id)
        except PublisherBookDeposit.DoesNotExist:
            return Response({"success": False, "error": "Dépôt introuvable."}, status=404)

        if decision not in ("approved", "revision_requested"):
            return Response({"success": False, "error": "decision doit être 'approved' ou 'revision_requested'."}, status=400)

        deposit.editorial_status = decision
        deposit.editorial_comment = comment
        deposit.save(update_fields=["editorial_status", "editorial_comment"])

        _notify_publisher_of_review(deposit, "conformité éditoriale", decision, comment)

        return Response({
            "success": True,
            "message": f"Conformité éditoriale : {deposit.get_editorial_status_display()}.",
            "data": {"id": str(deposit.id), "editorial_status": deposit.editorial_status}
        })


class PublisherDepositRightsDecisionView(APIView):
    """POST /api/v1/publishers/admin/deposits/<id>/rights-decision/
    Décision de vérification des droits — Juriste (+ Admin en supervision)."""
    permission_classes = [permissions.IsAuthenticated, PublisherDepositRightsReviewPermission]

    def post(self, request, id):
        decision = request.data.get("decision")
        comment = request.data.get("comment", "").strip()

        try:
            deposit = PublisherBookDeposit.objects.get(id=id)
        except PublisherBookDeposit.DoesNotExist:
            return Response({"success": False, "error": "Dépôt introuvable."}, status=404)

        if decision not in ("approved", "revision_requested"):
            return Response({"success": False, "error": "decision doit être 'approved' ou 'revision_requested'."}, status=400)

        deposit.rights_status = decision
        deposit.rights_comment = comment
        deposit.save(update_fields=["rights_status", "rights_comment"])

        _notify_publisher_of_review(deposit, "vérification des droits", decision, comment)

        return Response({
            "success": True,
            "message": f"Vérification des droits : {deposit.get_rights_status_display()}.",
            "data": {"id": str(deposit.id), "rights_status": deposit.rights_status}
        })


class PublisherDepositPublishView(APIView):
    """
    POST /api/v1/publishers/admin/deposits/<id>/publish/ - Publication finale.
    N'est possible QUE si editorial_status ET rights_status sont tous deux 'approved'
    (CDC 5.5 : "conformité éditoriale ET vérification des droits").
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        if request.user.role not in ('chief_layout', 'legal_reviewer', 'admin', 'super_admin'):
            return Response({"success": False, "error": "Accès refusé."}, status=403)

        from apps.catalog.models import Ouvrage, Discipline, BookAuthor

        try:
            deposit = PublisherBookDeposit.objects.select_related('publisher').get(id=id)
        except PublisherBookDeposit.DoesNotExist:
            return Response({"success": False, "error": "Dépôt introuvable."}, status=404)

        if deposit.editorial_status != "approved" or deposit.rights_status != "approved":
            return Response({
                "success": False,
                "error": (
                    "Publication impossible : conformité éditoriale et vérification des droits "
                    "doivent toutes deux être validées. État actuel — Éditorial : "
                    f"{deposit.get_editorial_status_display()}, Droits : {deposit.get_rights_status_display()}."
                )
            }, status=400)

        discipline_obj, _ = Discipline.objects.get_or_create(name=deposit.discipline)

        ouvrage = Ouvrage.objects.create(
            title=deposit.title,
            subtitle=deposit.subtitle,
            isbn=deposit.isbn_digital,
            publisher=deposit.publisher,
            discipline=discipline_obj,
            language=deposit.language,
            summary=deposit.summary,
            format_type=deposit.file_format,
            file=deposit.file_url,
            price_digital=deposit.price,
            status="published",
        )

        if isinstance(deposit.authors, list):
            for author_name in deposit.authors:
                if author_name and isinstance(author_name, str):
                    parts = author_name.strip().split(maxsplit=1)
                    first_name = parts[0] if parts else "Auteur"
                    last_name = parts[1] if len(parts) > 1 else ""
                    author_obj, _ = BookAuthor.objects.get_or_create(
                        first_name=first_name,
                        last_name=last_name,
                        defaults={"biography": ""}
                    )
                    ouvrage.authors.add(author_obj)

        deposit.status = PublisherDepositStatus.PUBLISHED
        deposit.save(update_fields=["status"])

        _notify_publisher_of_review(deposit, "publication", "approved", "Votre ouvrage est désormais publié sur la vitrine LAHAThèque.")

        return Response({
            "success": True,
            "message": f"« {deposit.title} » publié avec succès.",
            "data": {"id": str(deposit.id), "status": deposit.status}
        })


def _notify_publisher_of_review(deposit, volet, decision, comment):
    try:
        from apps.reporting.services import notify_user
        from apps.reporting.models import Notification
        if deposit.publisher.user:
            label = "Validé" if decision == "approved" else "Corrections demandées"
            notify_user(
                user=deposit.publisher.user,
                notification_type=Notification.NotificationType.SYSTEM,
                title=f"« {deposit.title} » — {volet} : {label}",
                message=comment or f"Le statut de votre dépôt a évolué : {volet} — {label}.",
                action_url="/publisher/catalog",
                resource_id=str(deposit.id),
            )
    except Exception:
        pass



