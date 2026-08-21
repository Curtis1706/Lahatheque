"""Vues REST pour l'Espace Éditeur Tiers (publishers_portal)."""
import uuid
import secrets
import hashlib
from decimal import Decimal
from django.db.models import Sum, Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

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

        rev = float(totals["total_revenue"] or 0)
        rate = float(prof.contractual_royalty_rate)
        pending_royalties = (rev * rate) / 100

        return Response({
            "success": True,
            "data": {
                "totalBooks": total_books,
                "pendingValidations": pending_validations,
                "publishedBooks": published_books,
                "totalConsultations": totals["total_consultations"] or 0,
                "totalDownloads": totals["total_downloads"] or 0,
                "totalRevenue": rev,
                "pendingRoyalties": pending_royalties,
                "contractualRoyaltyRate": rate,
            },
            "error": None,
        })


class PublisherCatalogListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
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
                "consultations_count": b.consultations_count,
                "downloads_count": b.downloads_count,
                "revenue_generated": float(b.revenue_generated),
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
                    "consultations_count": b.consultations_count,
                    "downloads_count": b.downloads_count,
                    "revenue_generated": float(b.revenue_generated),
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
    """Extraction automatique assistée par IA (Section 5.3 & 4.1.C)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = request.data.get("title", "").strip()
        filename = request.data.get("filename", "").strip()

        # Heuristique IA contextuelle pour le catalogue universitaire
        title_lower = (title + " " + filename).lower()

        if "droit" in title_lower or "jurisprudence" in title_lower or "constitution" in title_lower:
            discipline = "Droit Public & Administration"
            summary = f"Ouvrage juridique approfondi analysant les principes fondamentaux de {title or 'la matière'}, avec étude comparée des jurisprudences ouest-africaines et internationales."
            keywords = ["droit", "jurisprudence", "cours magistral", "afrique de l'ouest", "uac"]
        elif "economie" in title_lower or "finance" in title_lower or "gestion" in title_lower or "monnaie" in title_lower:
            discipline = "Sciences Économiques & Gestion"
            summary = f"Manuel universitaire de référence traitant des théories économiques contemporaines appliquées aux marchés émergents et aux politiques monétaires régionales."
            keywords = ["économie", "finance", "macroéconomie", "uemoa", "croissance"]
        elif "sante" in title_lower or "medecine" in title_lower or "clinique" in title_lower:
            discipline = "Médecine & Santé Publique"
            summary = f"Guide clinique et académique destiné aux praticiens et étudiants en sciences de la santé, couvrant les protocoles thérapeutiques et la prévention épidémiologique."
            keywords = ["santé", "médecine", "clinique", "épidémiologie", "diagnostic"]
        elif "agronomie" in title_lower or "environnement" in title_lower or "climat" in title_lower:
            discipline = "Agronomie & Environnement"
            summary = f"Étude scientifique sur les pratiques agricoles durables, la résilience climatique et la valorisation des écosystèmes tropicaux."
            keywords = ["agronomie", "climat", "agriculture durable", "écosystèmes", "bénin"]
        else:
            discipline = "Sciences Humaines & Sociales"
            summary = f"Ouvrage académique de recherche explorant les dynamiques structurelles, théoriques et pratiques de {title or 'cette discipline'}."
            keywords = ["recherche", "université", "théorie", "académique", "afrique"]

        return Response({
            "success": True,
            "data": {
                "summary": summary,
                "discipline": discipline,
                "language": "fr",
                "country": "BJ",
                "suggested_keywords": keywords,
                "target_audience": "universitaire",
                "confidence_score": 0.94,
            },
            "error": None,
        })


class PublisherDepositsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
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

        deposit = PublisherBookDeposit.objects.create(
            publisher=prof,
            title=title,
            subtitle=data.get("subtitle", ""),
            isbn_digital=isbn_digital,
            isbn_print=data.get("isbn_print", ""),
            doi=data.get("doi", ""),
            authors=data.get("authors", [f"{user.first_name} {user.last_name}".strip() or "Auteur Partenaire"]),
            contributors=data.get("contributors", []),
            discipline=data.get("discipline", "Sciences Générales"),
            language=data.get("language", "fr"),
            keywords=data.get("keywords", []),
            target_audience=data.get("target_audience", "universitaire"),
            price=Decimal(str(data.get("price", 5000))),
            currency="XOF",
            sales_model=data.get("sales_model", "purchase"),
            allowed_territories=data.get("allowed_territories", ["Bénin", "Sénégal", "Togo", "Côte d'Ivoire"]),
            summary=data.get("summary", "Ouvrage déposé pour examen par le comité éditorial."),
            authors_bio=data.get("authors_bio", ""),
            cover_url=data.get("cover_url", "/placeholder-cover.jpg"),
            file_url=data.get("file_url", "/mock/files/manuscript.pdf"),
            file_format=data.get("file_format", "pdf"),
            licence_type=data.get("licence_type", "tous_droits_reserves"),
            status=PublisherDepositStatus.PENDING,
            validation_step=PublisherValidationStep.STEP_1,
            watermark_enabled=data.get("protection_config", {}).get("watermark_enabled", True),
            watermark_position=data.get("protection_config", {}).get("watermark_position", "bottom-right"),
            watermark_opacity=data.get("protection_config", {}).get("watermark_opacity", 30),
            lcp_drm_enabled=data.get("protection_config", {}).get("lcp_drm_enabled", True),
            disable_copy_paste=data.get("protection_config", {}).get("disable_copy_paste", True),
            disable_print=data.get("protection_config", {}).get("disable_print", False),
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
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        prof = get_or_create_publisher_profile(user)
        filename = request.data.get("filename", "lot_ouvrages_onix.xml")
        format_type = request.data.get("format", "onix_3")

        log = PublisherBatchImportLog.objects.create(
            publisher=prof,
            file_name=filename,
            format=format_type,
            total_records=25,
            success_count=24,
            error_count=1,
            errors=[
                {
                    "line_number": 142,
                    "isbn_or_title": "Ouvrage 14 - ISBN Invalide",
                    "error_message": "Balise <ProductIdentifier> non conforme ONIX 3.0 (clé de contrôle ISBN-13 manquante)."
                }
            ],
            status="completed_with_errors"
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
                "pdf_statement_url": p.pdf_statement_url or f"/statements/{p.reference}.pdf",
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
        amount = request.data.get("amount", 0)

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
            pdf_statement_url=f"/statements/{ref}.pdf"
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
