"""Vues API REST complètes pour l'Espace Université (Portail Établissement Partenaire)."""
import uuid
from decimal import Decimal
from datetime import timedelta
from django.db.models import Sum, Count, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone
from apps.accounts.permissions import IsUniversityStaff, IsAdminOrSuperAdmin
from .models import (
    Institution,
    Faculty,
    StudentAffiliation,
    UniversityBouquetSubscription,
    UniversityPaperOrder,
    UniversityRoyaltyStatement,
)
from apps.protection.models import TraceAcces
from apps.catalog.models import Ouvrage


def get_user_institution(user):
    """Récupère l'établissement rattaché à l'utilisateur connecté."""
    if hasattr(user, 'university_profile') and user.university_profile:
        return user.university_profile
    inst = Institution.objects.filter(user=user).first()
    if inst:
        return inst
    if getattr(user, 'role', '') in ['university', 'admin', 'super_admin']:
        affiliation = getattr(user, 'university_affiliation', '').strip()
        if affiliation:
            inst = Institution.objects.filter(
                Q(code__iexact=affiliation) | Q(name__icontains=affiliation)
            ).first()
            if inst:
                if not inst.user:
                    inst.user = user
                    inst.save(update_fields=['user'])
                return inst
        inst = Institution.objects.filter(code='UAC').first() or Institution.objects.filter(is_active=True).first()
        if inst and not inst.user and getattr(user, 'role', '') == 'university':
            inst.user = user
            inst.save(update_fields=['user'])
        return inst
    return None


class UniversityKpisView(APIView):
    """GET /api/v1/partners/university/kpis/ - KPIs exclusifs de l'université connectée."""
    permission_classes = [permissions.IsAuthenticated, IsUniversityStaff]

    def get(self, request):
        import logging
        logger = logging.getLogger(__name__)
        user = request.user
        inst = get_user_institution(user)
        logger.info(f"[UNIV KPIS] {timezone.now().isoformat()} - user={user.id} inst={'none' if not inst else inst.code} type={'none' if not inst else inst.institution_type}")

        if not inst:
            return Response({
                "success": True,
                "data": {
                    "institution_name": "Université Partenaire",
                    "institution_code": "UNIV",
                    "institution_type": "partner",
                    "affiliated_students_count": 0,
                    "active_bouquets_count": 0,
                    "monthly_consultations_count": 0,
                    "total_royalties_available": 0.0,
                    "total_royalties_paid": 0.0,
                    "revenue_split": None,
                    "currency": "XOF",
                    "consultations_trend_percent": 0.0,
                    "top_disciplines": [],
                    "faculty_distribution": [],
                },
                "error": None
            })

        # ── Branche Université Cliente : KPIs campus épurés, zéro redevance ──
        if inst.institution_type == 'client':
            return self._kpis_client(inst)

        # ── Branche Université Partenaire : KPIs complets avec redevances ──
        return self._kpis_partner(inst)

    def _kpis_client(self, inst):
        """KPIs pour Université Cliente — abonnements campus, lectures, commandes papier. Zéro redevance."""
        import logging
        logger = logging.getLogger(__name__)
        from apps.reader.models import ReaderSession
        from apps.student.models import ReadingSession as StudentReadingSession
        from apps.audio.models import AudioListeningSession

        affiliations_count = StudentAffiliation.objects.filter(
            institution=inst,
            status__in=['approved', 'active', 'validated']
        ).count()
        active_bouquets = UniversityBouquetSubscription.objects.filter(
            institution=inst, status='active'
        )
        active_bouquets_count = active_bouquets.count()

        # Ouvrages accessibles via bouquets souscrits actifs
        from .models import BouquetOffering
        accessible_books_ids = set()
        for sub in active_bouquets:
            offering = BouquetOffering.objects.filter(id=sub.offering_id).first() if sub.offering_id else None
            if offering:
                accessible_books_ids.update(
                    offering.get_books_queryset(requesting_institution=inst).values_list('id', flat=True)
                )
        accessible_books_count = len(accessible_books_ids)

        # Commandes papier institutionnelles
        paper_orders_count = UniversityPaperOrder.objects.filter(institution=inst).count()

        # Lectures campus (30 derniers jours)
        monthly_reads = (
            ReaderSession.objects.filter(
                ouvrage_id__in=accessible_books_ids,
                reading_time_seconds__gte=30,
                created_at__gte=timezone.now() - timedelta(days=30)
            ).count()
            + StudentReadingSession.objects.filter(
                ouvrage_id__in=accessible_books_ids,
                duration_seconds__gte=30,
                created_at__gte=timezone.now() - timedelta(days=30)
            ).count()
            + AudioListeningSession.objects.filter(
                ouvrage_id__in=accessible_books_ids,
                created_at__gte=timezone.now() - timedelta(days=30)
            ).count()
        ) if accessible_books_ids else 0

        # Tendance consultations M vs M-1
        prev_reads = (
            ReaderSession.objects.filter(
                ouvrage_id__in=accessible_books_ids,
                reading_time_seconds__gte=30,
                created_at__gte=timezone.now() - timedelta(days=60),
                created_at__lt=timezone.now() - timedelta(days=30)
            ).count()
            + StudentReadingSession.objects.filter(
                ouvrage_id__in=accessible_books_ids,
                duration_seconds__gte=30,
                created_at__gte=timezone.now() - timedelta(days=60),
                created_at__lt=timezone.now() - timedelta(days=30)
            ).count()
        ) if accessible_books_ids else 0

        if prev_reads > 0:
            trend = round(((monthly_reads - prev_reads) / prev_reads) * 100, 1)
        else:
            trend = 0.0 if monthly_reads == 0 else 100.0

        # Timeline réelle des consultations sur 4 semaines glissantes
        consultations_timeline = []
        month_abbr = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"]
        for i in range(3, -1, -1):
            w_start = timezone.now() - timedelta(days=(i + 1) * 7)
            w_end = timezone.now() - timedelta(days=i * 7)
            w_count = (
                ReaderSession.objects.filter(
                    ouvrage_id__in=accessible_books_ids,
                    reading_time_seconds__gte=30,
                    created_at__gte=w_start,
                    created_at__lt=w_end
                ).count()
                + StudentReadingSession.objects.filter(
                    ouvrage_id__in=accessible_books_ids,
                    duration_seconds__gte=30,
                    created_at__gte=w_start,
                    created_at__lt=w_end
                ).count()
                + AudioListeningSession.objects.filter(
                    ouvrage_id__in=accessible_books_ids,
                    created_at__gte=w_start,
                    created_at__lt=w_end
                ).count()
            ) if accessible_books_ids else 0
            consultations_timeline.append({
                "date": f"{w_start.day:02d} {month_abbr[w_start.month - 1]}",
                "value": w_count
            })

        logger.info(f"[UNIV KPIS] {timezone.now().isoformat()} - CLIENT {inst.code}: bouquets={active_bouquets_count} livres={accessible_books_count} lectures={monthly_reads}")

        return Response({
            "success": True,
            "data": {
                "institution_name": inst.name,
                "institution_code": inst.code,
                "institution_type": "client",
                "affiliated_students_count": affiliations_count,
                "active_bouquets_count": active_bouquets_count,
                "accessible_books_count": accessible_books_count,
                "monthly_consultations_count": monthly_reads,
                "consultations_timeline": consultations_timeline,
                "paper_orders_count": paper_orders_count,
                "total_royalties_available": 0.0,
                "total_royalties_paid": 0.0,
                "revenue_split": None,
                "audience_share_percent": 0.0,
                "currency": "XOF",
                "consultations_trend_percent": trend,
                "top_disciplines": [],
                "faculty_distribution": [],
            },
            "error": None
        })

    def _kpis_partner(self, inst):
        """KPIs complets pour Université Partenaire — redevances, répartition CA, parts d'audience."""
        from django.db.models import Q
        affiliations_count = StudentAffiliation.objects.filter(
            institution=inst, 
            status__in=['approved', 'active', 'validated']
        ).count()
        bouquets_count = UniversityBouquetSubscription.objects.filter(
            institution=inst, 
            status='active'
        ).count()
        monthly_consultations = TraceAcces.objects.filter(
            Q(institution=inst) | Q(ouvrage__institution=inst) | Q(bouquet_subscription__institution=inst), 
            timestamp__gte=timezone.now() - timedelta(days=30)
        ).count()

        # ── Intégration dynamique des consultations et redevances du Bouquet Général ──
        from apps.reporting.admin_views import compute_bouquet_distribution_payload
        from apps.reader.models import ReaderSession
        from apps.student.models import ReadingSession as StudentReadingSession
        from apps.audio.models import AudioListeningSession

        partner_reads = ReaderSession.objects.filter(
            ouvrage__institution=inst,
            reading_time_seconds__gte=30,
            last_page__gte=3,
            created_at__gte=timezone.now() - timedelta(days=30)
        ).count()

        student_reads = StudentReadingSession.objects.filter(
            ouvrage__institution=inst,
            duration_seconds__gte=30,
            pages_read__gte=3,
            created_at__gte=timezone.now() - timedelta(days=30)
        ).count()

        audio_reads = AudioListeningSession.objects.filter(
            ouvrage__institution=inst,
            created_at__gte=timezone.now() - timedelta(days=30)
        ).count()

        total_monthly_consultations = monthly_consultations + partner_reads + student_reads + audio_reads

        # Récupération de la part temps réel du Bouquet Général pour l'établissement
        bouquet_general_data = compute_bouquet_distribution_payload("general", requesting_institution_id=str(inst.id))
        general_ca = 0.0
        general_royalty = 0.0
        inst_audience_pct = 0.0
        if bouquet_general_data and "distribution" in bouquet_general_data:
            for item in bouquet_general_data["distribution"]:
                if str(item.get("institution_id")) == str(inst.id):
                    general_ca = float(item.get("ca_share", 0.0) or 0.0)
                    general_royalty = float(item.get("royalty_amount", 0.0) or 0.0)
                    inst_audience_pct = float(item.get("usage_percentage", 0.0) or 0.0)
                    break

        statements = UniversityRoyaltyStatement.objects.filter(institution=inst)
        avail_royalty = float(statements.filter(status='available').aggregate(s=Sum('net_royalty_amount'))['s'] or 0.0) + general_royalty
        paid_royalty = float(statements.filter(status='paid').aggregate(s=Sum('net_royalty_amount'))['s'] or 0.0)

        faculties = Faculty.objects.filter(institution=inst)
        colors = ["var(--navy)", "var(--gold)", "var(--navy-hover)", "var(--gold-dark)", "var(--navy-light)"]
        faculty_distrib = []
        top_disc = []

        if faculties.exists():
            total_fac_c = 0
            for i, f in enumerate(faculties):
                c_count = TraceAcces.objects.filter(
                    Q(institution=inst) | Q(ouvrage__institution=inst), 
                    ouvrage__discipline__name__icontains=f.code
                ).count()
                total_fac_c += c_count
                faculty_distrib.append({
                    "code": f.code,
                    "name": f.name,
                    "consultations": c_count,
                    "percent": 0,
                    "color": colors[i % len(colors)]
                })
            if total_fac_c > 0:
                for item in faculty_distrib:
                    item["percent"] = round((item["consultations"] / total_fac_c) * 100, 1)
        else:
            # Répartition par Discipline académique si aucune faculté en base
            from apps.catalog.models import Discipline
            disciplines = list(Discipline.objects.filter(is_active=True)[:5])
            total_disc_c = 0
            for i, d in enumerate(disciplines):
                c_count = TraceAcces.objects.filter(
                    Q(institution=inst) | Q(ouvrage__institution=inst),
                    ouvrage__discipline=d
                ).count()
                total_disc_c += c_count
                faculty_distrib.append({
                    "code": d.name[:8].upper(),
                    "name": d.name,
                    "consultations": c_count,
                    "percent": 0,
                    "color": colors[i % len(colors)]
                })
            if total_disc_c > 0:
                for item in faculty_distrib:
                    item["percent"] = round((item["consultations"] / total_disc_c) * 100, 1)

        raw_stmt_ca = float(statements.aggregate(s=Sum('total_sales_catalog'))['s'] or Decimal('0.00'))
        raw_stmt_univ = float(statements.aggregate(s=Sum('net_royalty_amount'))['s'] or Decimal('0.00'))

        total_ca = raw_stmt_ca + general_ca
        total_university_share = raw_stmt_univ + general_royalty
        total_laha_share = max(0.0, total_ca - total_university_share)

        if total_ca > 0:
            university_share_percent = round((total_university_share / total_ca) * 100, 1)
            laha_share_percent = round(100 - university_share_percent, 1)
        else:
            university_share_percent = 0.0
            laha_share_percent = 0.0

        revenue_split = {
            "total_ca": round(total_ca, 2),
            "university_amount": round(total_university_share, 2),
            "university_percent": university_share_percent,
            "laha_amount": round(total_laha_share, 2),
            "laha_percent": laha_share_percent,
            "currency": "XOF",
        }

        # Ouvrages déposés réels de l'université partenaire
        catalog_books_count = Ouvrage.objects.filter(institution=inst, status='published').count()

        # Timeline réelle des consultations sur 4 semaines glissantes
        consultations_timeline = []
        month_abbr = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"]
        for i in range(3, -1, -1):
            w_start = timezone.now() - timedelta(days=(i + 1) * 7)
            w_end = timezone.now() - timedelta(days=i * 7)
            w_count = (
                TraceAcces.objects.filter(
                    Q(institution=inst) | Q(ouvrage__institution=inst),
                    timestamp__gte=w_start,
                    timestamp__lt=w_end
                ).count()
                + ReaderSession.objects.filter(
                    ouvrage__institution=inst,
                    reading_time_seconds__gte=30,
                    last_page__gte=3,
                    created_at__gte=w_start,
                    created_at__lt=w_end
                ).count()
                + StudentReadingSession.objects.filter(
                    ouvrage__institution=inst,
                    duration_seconds__gte=30,
                    pages_read__gte=3,
                    created_at__gte=w_start,
                    created_at__lt=w_end
                ).count()
                + AudioListeningSession.objects.filter(
                    ouvrage__institution=inst,
                    created_at__gte=w_start,
                    created_at__lt=w_end
                ).count()
            )
            consultations_timeline.append({
                "date": f"{w_start.day:02d} {month_abbr[w_start.month - 1]}",
                "value": w_count
            })

        # Calcul dynamique de la tendance (mois courant vs mois précédent)
        previous_month_consultations = TraceAcces.objects.filter(
            Q(institution=inst) | Q(ouvrage__institution=inst) | Q(bouquet_subscription__institution=inst),
            timestamp__gte=timezone.now() - timedelta(days=60),
            timestamp__lt=timezone.now() - timedelta(days=30),
        ).count()

        if previous_month_consultations > 0:
            consultations_trend = round(
                ((total_monthly_consultations - previous_month_consultations) / previous_month_consultations) * 100, 1
            )
        else:
            consultations_trend = 0.0 if total_monthly_consultations == 0 else 100.0

        return Response({
            "success": True,
            "data": {
                "institution_name": inst.name,
                "institution_code": inst.code,
                "institution_type": "partner",
                "catalog_books_count": catalog_books_count,
                "affiliated_students_count": affiliations_count,
                "active_bouquets_count": bouquets_count,
                "monthly_consultations_count": total_monthly_consultations,
                "consultations_timeline": consultations_timeline,
                "total_royalties_available": round(avail_royalty, 2),
                "total_royalties_paid": paid_royalty,
                "audience_share_percent": inst_audience_pct,
                "currency": "XOF",
                "consultations_trend_percent": consultations_trend,
                "top_disciplines": top_disc,
                "faculty_distribution": faculty_distrib,
                "revenue_split": revenue_split,
            },
            "error": None
        })


class UniversityFacultiesView(APIView):
    """GET / POST /api/v1/partners/university/faculties/ - Gestion des facultés de l'établissement."""
    permission_classes = [permissions.IsAuthenticated, IsUniversityStaff]

    def get(self, request):
        inst = get_user_institution(request.user)
        if not inst:
            return Response({"success": True, "data": [], "error": None})

        faculties_qs = Faculty.objects.filter(institution=inst)
        data = []
        for f in faculties_qs:
            data.append({
                "id": str(f.id),
                "name": f.name,
                "code": f.code,
                "disciplines": f.disciplines if isinstance(f.disciplines, list) else [],
                "student_count": f.student_count,
                "dean_name": f.dean_name,
            })
        return Response({"success": True, "data": data, "error": None})

    def post(self, request):
        inst = get_user_institution(request.user)
        if not inst:
            return Response({"success": False, "error": "Université non associée à l'utilisateur connecté"}, status=400)

        d = request.data
        fac = Faculty.objects.create(
            institution=inst,
            name=d.get("name", "Nouvelle Faculté"),
            code=d.get("code", "UFR"),
            disciplines=d.get("disciplines", []),
            student_count=d.get("student_count", 0),
            dean_name=d.get("dean_name", "")
        )
        res = {
            "id": str(fac.id),
            "name": fac.name,
            "code": fac.code,
            "disciplines": fac.disciplines,
            "student_count": fac.student_count,
            "dean_name": fac.dean_name,
        }
        return Response({"success": True, "data": res, "error": None}, status=status.HTTP_201_CREATED)


class UniversityBouquetsView(APIView):
    """GET /api/v1/partners/university/bouquets/ - Bouquets disponibles ET déjà souscrits."""
    permission_classes = [permissions.IsAuthenticated, IsUniversityStaff]

    def get(self, request):
        from .models import BouquetOffering
        from apps.catalog.models import Ouvrage

        def serialize_bouquet_books(qs):
            books_data = []
            for bk in qs.select_related('discipline', 'institution').prefetch_related('authors')[:60]:
                cover_url = None
                if bk.cover_image:
                    try:
                        cover_url = bk.cover_image.url
                    except Exception:
                        cover_url = None
                authors_list = [a.name for a in bk.authors.all()]
                author_display = ", ".join(authors_list) if authors_list else "Auteur académique"
                books_data.append({
                    "id": str(bk.id),
                    "title": bk.title,
                    "subtitle": bk.subtitle or "",
                    "authors": authors_list,
                    "author": author_display,
                    "discipline": bk.discipline.name if bk.discipline else "",
                    "cover_url": cover_url,
                    "page_count": bk.page_count,
                    "format_type": "digital",
                    "isbn": bk.isbn or "",
                    "summary": bk.summary or "",
                    "has_sample": True,
                })
            return books_data

        inst = get_user_institution(request.user)
        subscribed_offering_ids = set()
        subscribed_data = []

        if inst:
            subs = UniversityBouquetSubscription.objects.filter(institution=inst)
            for b in subs:
                offering = BouquetOffering.objects.filter(id=b.offering_id).first() if b.offering_id else None
                b_qs = offering.get_books_queryset(requesting_institution=inst) if offering else Ouvrage.objects.filter(status='published')
                my_cnt = b_qs.filter(institution=inst).count() if inst else 0
                subscribed_data.append({
                    "id": str(b.id),
                    "offering_id": str(b.offering_id) if b.offering_id else None,
                    "title": b.title,
                    "bouquet_type": b.bouquet_type,
                    "faculty_code": b.faculty_code,
                    "discipline": b.discipline,
                    "books_count": b.books_count,
                    "my_books_count": my_cnt,
                    "subscription_period": getattr(b, 'subscription_period', 'annual'),
                    "price_paid": float(b.price_paid or 0),
                    "monthly_price": float(offering.get_real_monthly_price()) if (offering and hasattr(offering, 'get_real_monthly_price')) else 50000.0,
                    "annual_price": float(b.annual_price),
                    "currency": b.currency,
                    "status": b.status,
                    "start_date": str(b.start_date),
                    "end_date": str(b.end_date),
                    "is_subscribed": True,
                    "books": serialize_bouquet_books(b_qs),
                })
                if b.offering_id:
                    subscribed_offering_ids.add(str(b.offering_id))

        available_data = []
        for o in BouquetOffering.objects.filter(is_active=True).exclude(id__in=subscribed_offering_ids).exclude(bouquet_type="general"):
            b_qs = o.get_books_queryset(requesting_institution=inst)
            available_data.append({
                "id": str(o.id),
                "offering_id": str(o.id),
                "title": o.title,
                "bouquet_type": o.bouquet_type,
                "faculty_code": o.faculty_code,
                "discipline": o.discipline,
                "country": o.country,
                "books_count": b_qs.count(),
                "my_books_count": b_qs.filter(institution=inst).count() if inst else 0,
                "monthly_price": float(o.get_real_monthly_price() if hasattr(o, 'get_real_monthly_price') else (o.monthly_price or 50000.0)),
                "annual_price": float(o.get_real_annual_price() if hasattr(o, 'get_real_annual_price') else o.annual_price),
                "currency": o.currency,
                "description": o.description,
                "status": "available",
                "is_subscribed": False,
                "books": serialize_bouquet_books(b_qs),
            })

        return Response({"success": True, "data": available_data + subscribed_data, "error": None})


class UniversityBouquetDistributionView(APIView):
    """GET /api/v1/partners/university/bouquets/<pk>/distribution/ - Camembert et stats de répartition multi-universités."""
    permission_classes = [permissions.IsAuthenticated, IsUniversityStaff]

    def get(self, request, pk):
        from .models import BouquetOffering
        inst = get_user_institution(request.user)

        offering = BouquetOffering.objects.filter(id=pk).first()
        sub = None
        if not offering:
            sub = UniversityBouquetSubscription.objects.filter(id=pk).first()
            if sub and sub.offering_id:
                offering = BouquetOffering.objects.filter(id=sub.offering_id).first()

        if not offering and not sub:
            return Response({"success": False, "error": "Bouquet introuvable.", "data": None}, status=404)

        target = offering if offering else sub
        from apps.reporting.admin_views import compute_bouquet_distribution_payload
        data = compute_bouquet_distribution_payload(target, requesting_institution_id=str(inst.id) if inst else None)

        # ── Confidentialité CDC : anonymiser les données financières des autres universités ──
        # L'université connectée voit ses propres chiffres exacts.
        # Les autres universités n'apparaissent qu'avec leur nom, leur pourcentage
        # d'utilisation et leur nombre de livres — jamais leurs montants financiers.
        requesting_id = str(inst.id) if inst else None
        if requesting_id and "distribution" in data:
            anonymized = []
            for entry in data["distribution"]:
                if str(entry.get("institution_id")) == requesting_id:
                    # L'université connectée voit tout
                    anonymized.append(entry)
                else:
                    # Les autres : pourcentage et livres uniquement, pas de montants
                    anonymized.append({
                        "institution_id": entry.get("institution_id"),
                        "institution_name": entry.get("institution_name"),
                        "institution_code": entry.get("institution_code"),
                        "books_owned_count": entry.get("books_owned_count", 0),
                        "usage_percentage": entry.get("usage_percentage", 0),
                        "reads_count": None,
                        "ca_share": None,
                        "royalty_rate": None,
                        "royalty_amount": None,
                        "color": entry.get("color"),
                        "is_current_institution": False,
                    })
            data["distribution"] = anonymized

            # Masquer aussi la part plateforme et le total des redevances globales
            if "totals" in data:
                data["totals"].pop("platform_revenue", None)
                data["totals"].pop("total_royalties", None)

        return Response({"success": True, "data": data, "error": None})


class UniversityBouquetSubscribeView(APIView):
    """POST /api/v1/partners/university/bouquets/<offering_id>/subscribe/"""
    permission_classes = [permissions.IsAuthenticated, IsUniversityStaff]

    def post(self, request, pk):
        import logging
        logger = logging.getLogger(__name__)
        from .models import BouquetOffering
        from apps.commerce.models import Currency, PaymentTransaction
        from apps.commerce.payment_providers import get_payment_provider
        from apps.commerce.views import get_frontend_base_url

        inst = get_user_institution(request.user)
        if not inst:
            return Response({"success": False, "error": "Université introuvable"}, status=400)

        # ── Garde d'accès T013 : les universités partenaires ne souscrivent pas à des bouquets ──
        if inst.institution_type == 'partner':
            logger.warning(f"[UNIV ACCESS GUARD] {timezone.now().isoformat()} - 403 BLOCKED partner {inst.code} on /bouquets/subscribe")
            return Response(
                {"success": False, "error": "Les universités partenaires n'ont pas accès à la souscription de bouquets documentaires. Consultez votre portail de redevances.", "data": None},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            offering = BouquetOffering.objects.get(id=pk, is_active=True)
            if offering.bouquet_type == "general":
                return Response({"success": False, "error": "Le Bouquet Général est un bouquet système global et n'est pas ouvert à la souscription directe."}, status=400)
        except BouquetOffering.DoesNotExist:
            return Response({"success": False, "error": "Bouquet introuvable ou indisponible."}, status=404)

        period = request.data.get("period", "annual")
        if period not in ["monthly", "annual"]:
            period = "annual"

        amount = offering.get_real_monthly_price() if period == "monthly" else offering.get_real_annual_price()

        existing_sub = UniversityBouquetSubscription.objects.filter(
            institution=inst, offering_id=offering.id, status='active'
        ).order_by('-end_date').first()
        existing_end_date = existing_sub.end_date if existing_sub else None
        start = timezone.now().date()
        end = UniversityBouquetSubscription.compute_end_date(existing_end_date, period)

        # Créer la souscription en statut 'pending' (PAS 'active')
        sub = UniversityBouquetSubscription.objects.create(
            institution=inst,
            offering_id=offering.id,
            title=offering.title,
            bouquet_type=offering.bouquet_type,
            faculty_code=offering.faculty_code,
            discipline=offering.discipline,
            books_count=offering.get_books_queryset(requesting_institution=inst).count(),
            subscription_period=period,
            price_paid=amount,
            annual_price=offering.annual_price,
            currency=offering.currency,
            status="pending",  # <-- PAS 'active' tant que le paiement n'est pas confirmé
            start_date=start,
            end_date=end,
        )

        # Initialiser le paiement via Moneroo
        mode_paiement = request.data.get("mode_paiement", "mobile_money")

        if mode_paiement != "mobile_money":
            # Paiement manuel (virement, espèces) — souscription en attente de confirmation admin
            return Response({
                "success": True,
                "data": {
                    "bouquet_id": str(sub.id),
                    "status": "pending",
                    "period": period,
                    "price_paid": float(amount),
                    "start_date": str(sub.start_date),
                    "end_date": str(sub.end_date),
                    "message": (
                        f"Souscription ({'Mensuelle' if period == 'monthly' else 'Annuelle'}) au bouquet « {offering.title} » enregistrée. "
                        f"Réglez par {mode_paiement} pour finaliser — un agent LAHA Éditions vous contactera."
                    ),
                },
                "error": None
            })

        currency, _ = Currency.objects.get_or_create(
            code=offering.currency or "XOF",
            defaults={"peg_rate_to_eur": 655.957}
        )

        provider = get_payment_provider("moneroo")
        frontend_base = get_frontend_base_url(request)
        return_url = request.data.get("return_url") or f"{frontend_base}/university/bouquets/success?subscription_id={sub.id}"

        try:
            payment_res = provider.initiate_payment(
                amount=amount,
                currency=currency.code,
                description=f"Bouquet « {offering.title} » ({'Mensuel 30j' if period == 'monthly' else 'Annuel 365j'}) — {inst.name}",
                customer_email=request.user.email,
                customer_name=request.user.get_full_name() or request.user.email,
                return_url=return_url,
                metadata={
                    "bouquet_subscription_id": str(sub.id),
                    "institution_id": str(inst.id),
                    "subscription_period": period,
                    "type": "bouquet_university",
                },
            ) or {}
        except Exception as payment_err:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Échec initialisation paiement bouquet {sub.id}: {payment_err}")
            # Ne pas supprimer la souscription — elle reste 'pending' et peut être relancée
            return Response({
                "success": False,
                "error": "Impossible d'initialiser le paiement pour le moment. Veuillez réessayer."
            }, status=502)

        # Créer la transaction de paiement
        tx = PaymentTransaction.objects.create(
            user=request.user,
            amount=amount,
            currency=currency,
            status=payment_res.get("status", "pending"),
            moneroo_id=payment_res.get("moneroo_id") or payment_res.get("payment_id"),
        )

        # Lier la transaction à la souscription
        sub.payment_transaction = tx
        sub.save(update_fields=["payment_transaction"])

        # Si le provider est mock et succès immédiat (dev uniquement)
        if payment_res.get("status") == "success":
            tx.status = "success"
            tx.save(update_fields=["status"])
            sub.status = "active"
            sub.save(update_fields=["status"])

        return Response({
            "success": True,
            "data": {
                "bouquet_id": str(sub.id),
                "status": sub.status,
                "period": period,
                "price_paid": float(amount),
                "checkout_url": payment_res.get("checkout_url"),
                "start_date": str(sub.start_date),
                "end_date": str(sub.end_date),
                "message": f"Souscription au bouquet « {offering.title} » ({'Mensuelle' if period == 'monthly' else 'Annuelle'}) initiée. Redirection vers le paiement sécurisé.",
            },
            "error": None
        })


class UniversityAffiliationsView(APIView):
    """GET /api/v1/partners/university/affiliations/ - Liste des étudiants et demandes de rattachement."""
    permission_classes = [permissions.IsAuthenticated, IsUniversityStaff]

    def get(self, request):
        from django.conf import settings as django_settings
        if not getattr(django_settings, "ENABLE_UNIVERSITY_AFFILIATION_GATING", False):
            return Response({
                "success": False,
                "error": "Cette fonctionnalité n'est pas activée sur la plateforme actuellement."
            }, status=403)

        inst = get_user_institution(request.user)
        if not inst:
            return Response({"success": True, "data": [], "error": None})

        qs = StudentAffiliation.objects.filter(institution=inst).select_related('faculty', 'student')
        data = []
        for aff in qs:
            data.append({
                "id": str(aff.id),
                "student_name": aff.student_name or (f"{aff.student.first_name} {aff.student.last_name}".strip() if aff.student else "Étudiant"),
                "student_email": aff.student_email or (aff.student.email if aff.student else ""),
                "student_phone": aff.student_phone,
                "matricule": aff.student_card_number,
                "faculty_code": aff.faculty.code if aff.faculty else "",
                "faculty_name": aff.faculty.name if aff.faculty else "",
                "level": aff.level,
                "student_card_url": aff.carte_etudiant_image or "",
                "status": aff.status,
                "created_at": aff.created_at.isoformat() if aff.created_at else str(timezone.now())
            })
        return Response({"success": True, "data": data, "error": None})


class UniversityAffiliationActionView(APIView):
    """PATCH /api/v1/partners/university/affiliations/<pk>/ - Action d'approbation ou suspension."""
    permission_classes = [permissions.IsAuthenticated, IsUniversityStaff]

    def patch(self, request, pk):
        from django.conf import settings as django_settings
        if not getattr(django_settings, "ENABLE_UNIVERSITY_AFFILIATION_GATING", False):
            return Response({
                "success": False,
                "error": "Cette fonctionnalité n'est pas activée sur la plateforme actuellement."
            }, status=403)

        inst = get_user_institution(request.user)
        if not inst:
            return Response({"success": False, "error": "Université introuvable."}, status=400)

        action = request.data.get("action", "approve")
        new_status = "approved" if action == "approve" else "suspended"

        try:
            aff = StudentAffiliation.objects.get(id=pk, institution=inst)
        except (StudentAffiliation.DoesNotExist, ValueError):
            return Response({
                "success": False,
                "error": "Affiliation introuvable pour votre établissement."
            }, status=404)

        aff.status = new_status
        aff.is_validated = (action == "approve")
        aff.reviewed_by = request.user
        aff.reviewed_at = timezone.now()
        aff.save()

        return Response({
            "success": True,
            "data": {
                "id": str(aff.id),
                "status": new_status,
                "verified_at": aff.reviewed_at.isoformat(),
                "message": f"Statut étudiant mis à jour ({new_status})."
            },
            "error": None
        })


class UniversityPaperOrdersView(APIView):
    """GET / POST /api/v1/partners/university/paper-orders/ - Commandes de livres papier institutionnelles."""
    permission_classes = [permissions.IsAuthenticated, IsUniversityStaff]

    def get(self, request):
        inst = get_user_institution(request.user)
        if not inst:
            return Response({"success": True, "data": [], "error": None})

        qs = UniversityPaperOrder.objects.filter(institution=inst)
        orders = []
        for o in qs:
            orders.append({
                "id": str(o.id),
                "order_number": o.order_number,
                "delivery_campus": o.delivery_campus,
                "contact_person": o.contact_person,
                "contact_phone": o.contact_phone,
                "items": o.items if isinstance(o.items, list) else [],
                "total_amount": float(o.total_amount),
                "currency": o.currency,
                "status": o.status,
                "tracking_number": o.tracking_number,
                "pdf_order_url": None,
                "created_at": o.created_at.isoformat() if o.created_at else str(timezone.now())
            })
        return Response({"success": True, "data": orders, "error": None})

    def post(self, request):
        from decimal import Decimal
        from django.db import transaction
        from django.db.models import Sum, F
        from apps.catalog.models import Ouvrage
        from apps.commerce.models import StockOuvrage, MouvementStock

        inst = get_user_institution(request.user)
        if not inst:
            return Response({"success": False, "error": "Université introuvable"}, status=400)

        data = request.data
        raw_items = data.get("items", [])
        if not raw_items:
            return Response({"success": False, "error": "La commande est vide."}, status=400)

        # Recalcul serveur du prix et vérification du stock — JAMAIS de confiance envers le client
        validated_items = []
        total_amount = Decimal("0.00")

        for it in raw_items:
            book_id = it.get("book_id")
            quantity = int(it.get("quantity", 0))
            if quantity <= 0:
                continue

            try:
                book = Ouvrage.objects.get(id=book_id)
            except Ouvrage.DoesNotExist:
                return Response({"success": False, "error": f"Ouvrage introuvable : {book_id}"}, status=400)

            if not book.is_paper_available:
                return Response({
                    "success": False,
                    "error": f"« {book.title} » n'est pas disponible en version papier."
                }, status=400)

            total_disponible = book.stocks_entrepots.aggregate(
                total=Sum(F('quantite_reelle') - F('quantite_reservee'))
            )['total'] or 0

            if total_disponible < quantity:
                return Response({
                    "success": False,
                    "error": f"Stock insuffisant pour « {book.title} » (disponible : {total_disponible}, demandé : {quantity})."
                }, status=400)

            from apps.reporting.pricing_service import compute_role_price
            pricing = compute_role_price(book, "university")
            unit_price = Decimal(str(pricing["paper_price"]))
            line_total = unit_price * quantity
            total_amount += line_total

            validated_items.append({
                "book_id": str(book.id),
                "title": book.title,
                "quantity": quantity,
                "unit_price": float(unit_price),
                "line_total": float(line_total),
            })

        if not validated_items:
            return Response({"success": False, "error": "Aucun article valide dans la commande."}, status=400)

        with transaction.atomic():
            order_number = f"CMD-UNIV-{timezone.now().year}-{uuid.uuid4().hex[:6].upper()}"
            order = UniversityPaperOrder.objects.create(
                institution=inst,
                order_number=order_number,
                delivery_campus=data.get("delivery_campus", "Campus Universitaire"),
                contact_person=data.get("contact_person", "Responsable Réception"),
                contact_phone=data.get("contact_phone", ""),
                items=validated_items,
                total_amount=total_amount,  # Calculé serveur, jamais fourni par le client
                currency="XOF",
                status="pending",
                tracking_number="",  # Généré uniquement à l'expédition réelle, pas à la commande
            )

            # Réservation du stock
            for it in validated_items:
                book = Ouvrage.objects.get(id=it["book_id"])
                stock = book.stocks_entrepots.filter(
                    quantite_reelle__gte=it["quantity"]
                ).order_by('-quantite_reelle').first()
                if stock:
                    stock.quantite_reservee = F('quantite_reservee') + it["quantity"]
                    stock.save(update_fields=['quantite_reservee'])
                    MouvementStock.objects.create(
                        stock=stock,
                        type_mouvement='adjustment',
                        quantite=it["quantity"],
                        reference_document=order_number,
                        motif=f"Réservation commande université {inst.name}",
                        auteur=request.user,
                    )

        res = {
            "id": str(order.id),
            "order_number": order.order_number,
            "delivery_campus": order.delivery_campus,
            "contact_person": order.contact_person,
            "contact_phone": order.contact_phone,
            "items": order.items,
            "total_amount": float(order.total_amount),
            "currency": order.currency,
            "status": order.status,
            "tracking_number": order.tracking_number,
            "pdf_order_url": None,  # Bon de commande PDF non encore disponible
            "created_at": order.created_at.isoformat()
        }
        return Response({"success": True, "data": res, "error": None}, status=status.HTTP_201_CREATED)


class UniversityRoyaltiesView(APIView):
    """GET /api/v1/partners/university/royalties/ - Suivi des redevances et versements (Partenaires uniquement)."""
    permission_classes = [permissions.IsAuthenticated, IsUniversityStaff]

    def get(self, request):
        import logging
        logger = logging.getLogger(__name__)
        inst = get_user_institution(request.user)
        logger.info(f"[UNIV ACCESS GUARD] {timezone.now().isoformat()} - royalties GET user={request.user.id} inst={'none' if not inst else inst.code} type={'none' if not inst else inst.institution_type}")

        # ── Garde d'accès : les universités clientes ne peuvent pas consulter les redevances ──
        if inst and inst.institution_type == 'client':
            logger.warning(f"[UNIV ACCESS GUARD] {timezone.now().isoformat()} - 403 BLOCKED client {inst.code} on /royalties")
            return Response(
                {"success": False, "error": "Accès non autorisé. Les universités clientes n'ont pas accès au portail des redevances.", "data": None},
                status=status.HTTP_403_FORBIDDEN
            )

        from apps.reporting.pricing_service import get_institution_royalty_rate
        rate = get_institution_royalty_rate(inst)

        if not inst:
            return Response({
                "success": True,
                "data": {
                    "available_balance": 0.0,
                    "total_paid": 0.0,
                    "contractual_rate": rate,
                    "institution": {
                        "id": "",
                        "name": "Université Partenaire",
                        "royalty_rate": rate
                    },
                    "currency": "XOF",
                    "min_withdrawal_threshold": 100000,
                    "statements": []
                },
                "error": None
            })

        qs = UniversityRoyaltyStatement.objects.filter(institution=inst)
        statements = []
        for r in qs:
            st_rate = float(r.royalty_rate)
            statements.append({
                "id": str(r.id),
                "reference": r.reference,
                "period": r.period,
                "total_sales_catalog": float(r.total_sales_catalog),
                "royalty_rate": st_rate,
                "applied_rate": st_rate,
                "net_royalty_amount": float(r.net_royalty_amount),
                "currency": r.currency,
                "status": r.status,
                "pdf_statement_url": r.pdf_statement_url or None,
                "created_at": r.created_at.isoformat() if r.created_at else str(timezone.now())
            })

        # ── Intégration en temps réel des redevances du Bouquet Général ──
        from apps.reporting.admin_views import compute_bouquet_distribution_payload
        bouquet_general_data = compute_bouquet_distribution_payload("general", requesting_institution_id=str(inst.id))
        general_ca = 0.0
        general_royalty = 0.0
        if bouquet_general_data and "distribution" in bouquet_general_data:
            for item in bouquet_general_data["distribution"]:
                if str(item.get("institution_id")) == str(inst.id):
                    general_ca = float(item.get("ca_share", 0.0) or 0.0)
                    general_royalty = float(item.get("royalty_amount", 0.0) or 0.0)
                    break

        avail_bal = float(qs.filter(status='available').aggregate(s=Sum('net_royalty_amount'))['s'] or 0.0) + general_royalty
        total_paid = float(qs.filter(status='paid').aggregate(s=Sum('net_royalty_amount'))['s'] or 0.0)

        if general_royalty > 0:
            statements.insert(0, {
                "id": "bouquet-general-realtime",
                "reference": "REP-BOUQ-GENERAL",
                "period": "En cours (Bouquet Général)",
                "total_sales_catalog": general_ca,
                "royalty_rate": rate,
                "applied_rate": rate,
                "net_royalty_amount": general_royalty,
                "currency": "XOF",
                "status": "available",
                "pdf_statement_url": None,
                "created_at": timezone.now().isoformat()
            })

        # Extraction des ventes unitaires réelles des ouvrages de l'institution
        from apps.commerce.models import LigneCommande
        from apps.rights.models import RoyaltyRate

        lignes = LigneCommande.objects.filter(
            ouvrage__institution=inst,
            commande__statut_paiement='paid'
        ).select_related('ouvrage', 'commande').prefetch_related('ouvrage__authors').order_by('-commande__created_at')[:50]

        unit_sales = []
        for l in lignes:
            book_rate = RoyaltyRate.objects.filter(ouvrage=l.ouvrage).first()
            if book_rate and book_rate.university_share_percent is not None:
                applied_rate = float(book_rate.university_share_percent)
            else:
                applied_rate = rate

            unit_p = float(l.unit_price)
            gross = unit_p * l.quantity
            r_amount = gross * (applied_rate / 100.0)
            authors = [
                a.user.get_full_name() if (a.user and a.user.get_full_name()) else f"{a.first_name} {a.last_name}".strip()
                for a in l.ouvrage.authors.all()
            ] if hasattr(l.ouvrage, 'authors') else []
            if not authors:
                authors = ["Auteur Universitaire"]

            cover_url = ""
            if l.ouvrage and l.ouvrage.cover_image:
                try:
                    cover_url = l.ouvrage.cover_image.url
                except Exception:
                    cover_url = str(l.ouvrage.cover_image)

            user_role = getattr(l.commande.user, 'role', '') if (l.commande and l.commande.user) else ''
            if user_role in ('wholesaler', 'grossiste'):
                buyer_type = "grossiste"
            elif user_role in ('institution', 'university'):
                buyer_type = "institution"
            else:
                buyer_type = "client"

            format_val = "paper" if l.format_type in ("paper", "papier") else ("audio" if l.format_type == "audio" else "digital")

            unit_sales.append({
                "id": str(l.id),
                "transaction_ref": f"TX-UNIV-{str(l.commande_id)[:8].upper()}",
                "book_id": str(l.ouvrage_id),
                "book_title": l.ouvrage.title,
                "cover_url": cover_url,
                "authors": authors,
                "discipline": l.ouvrage.discipline.name if l.ouvrage.discipline else "Général",
                "format": format_val,
                "quantity": l.quantity,
                "unit_price": unit_p,
                "gross_amount": gross,
                "royalty_rate": rate,
                "applied_rate": applied_rate,
                "royalty_amount": r_amount,
                "currency": "XOF",
                "buyer_type": buyer_type,
                "date": l.commande.created_at.strftime("%Y-%m-%d") if l.commande.created_at else str(timezone.now().date()),
            })

        # Calcul des totaux réels des ventes unitaires (papier, numérique et audio)
        paper_sales_count = sum(s["quantity"] for s in unit_sales if s["format"] == "paper")
        paper_gross_total = sum(s["gross_amount"] for s in unit_sales if s["format"] == "paper")
        paper_royalties_total = sum(s["royalty_amount"] for s in unit_sales if s["format"] == "paper")

        digital_sales_count = sum(s["quantity"] for s in unit_sales if s["format"] == "digital")
        digital_gross_total = sum(s["gross_amount"] for s in unit_sales if s["format"] == "digital")
        digital_royalties_total = sum(s["royalty_amount"] for s in unit_sales if s["format"] == "digital")

        audio_sales_count = sum(s["quantity"] for s in unit_sales if s["format"] == "audio")
        audio_gross_total = sum(s["gross_amount"] for s in unit_sales if s["format"] == "audio")
        audio_royalties_total = sum(s["royalty_amount"] for s in unit_sales if s["format"] == "audio")

        # Extraction des bouquets réels associés à l'institution (Section 11 CDC - Zéro mock, zéro faculté)
        from .models import BouquetOffering, UniversityBouquetSubscription
        from apps.reader.models import ReaderSession
        from apps.protection.models import TraceAcces

        bouquet_royalties = []
        bouquet_consultations_count = 0
        bouquet_gross_allocated = 0.0
        bouquet_royalties_total = 0.0

        subscriptions = UniversityBouquetSubscription.objects.filter(
            institution=inst,
            status='active'
        ).select_related('institution')

        for sub in subscriptions:
            offering = BouquetOffering.objects.filter(id=sub.offering_id).first() if sub.offering_id else None
            books_qs = offering.get_books_queryset(requesting_institution=inst) if offering else inst.ouvrages.filter(status='published')
            total_books_in_bouquet = books_qs.count()
            inst_books_in_bouquet = books_qs.filter(institution=inst)
            books_inc_cnt = inst_books_in_bouquet.count()

            # Consultations réelles consolidées (ReaderSession + TraceAcces)
            total_sessions = ReaderSession.objects.filter(
                source_type='catalog_book',
                ouvrage__in=books_qs
            ).count() + TraceAcces.objects.filter(ouvrage__in=books_qs).count()

            univ_sessions = ReaderSession.objects.filter(
                source_type='catalog_book',
                ouvrage__in=inst_books_in_bouquet
            ).count() + TraceAcces.objects.filter(ouvrage__in=inst_books_in_bouquet).count()

            if total_sessions > 0:
                share_pct = (univ_sessions / total_sessions * 100.0)
            elif total_books_in_bouquet > 0:
                share_pct = (books_inc_cnt / total_books_in_bouquet * 100.0)
            else:
                share_pct = 0.0

            annual_price = float(sub.annual_price or 0)
            allocated_revenue = annual_price * (share_pct / 100.0)
            b_royalty = allocated_revenue * (rate / 100.0)

            bouquet_consultations_count += univ_sessions
            bouquet_gross_allocated += allocated_revenue
            bouquet_royalties_total += b_royalty

            start_str = sub.start_date.strftime('%d/%m/%Y') if sub.start_date else ""
            end_str = sub.end_date.strftime('%d/%m/%Y') if sub.end_date else ""
            period_str = f"{start_str} - {end_str}".strip(" -") or "Annuel"

            bouquet_royalties.append({
                "id": str(sub.id),
                "bouquet_id": str(sub.offering_id) if sub.offering_id else str(sub.id),
                "bouquet_title": sub.title,
                "period": period_str,
                "books_included_count": books_inc_cnt,
                "total_bouquet_consultations": total_sessions,
                "university_consultations": univ_sessions,
                "consultation_share_percent": round(share_pct, 2),
                "bouquet_revenue_allocated": round(allocated_revenue, 2),
                "royalty_rate": rate,
                "applied_rate": rate,
                "net_royalty_amount": round(b_royalty, 2),
                "currency": sub.currency or "XOF",
            })

        total_earned = paper_royalties_total + digital_royalties_total + audio_royalties_total + bouquet_royalties_total
        available_balance = max(0.0, total_earned - total_paid) if total_earned > 0 else avail_bal

        resp_data = {
            "available_balance": available_balance,
            "total_paid": total_paid,
            "contractual_rate": rate,
            "institution": {
                "id": str(inst.id),
                "name": inst.name,
                "royalty_rate": rate,
            },
            "currency": "XOF",
            "min_withdrawal_threshold": 100000,
            "totals_summary": {
                "paper_sales_count": paper_sales_count,
                "paper_royalties_total": paper_royalties_total,
                "paper_gross_total": paper_gross_total,
                "digital_sales_count": digital_sales_count,
                "digital_royalties_total": digital_royalties_total,
                "digital_gross_total": digital_gross_total,
                "audio_sales_count": audio_sales_count,
                "audio_royalties_total": audio_royalties_total,
                "audio_gross_total": audio_gross_total,
                "bouquet_consultations_count": bouquet_consultations_count,
                "bouquet_royalties_total": bouquet_royalties_total,
                "bouquet_gross_allocated": bouquet_gross_allocated,
            },
            "unit_sales": unit_sales,
            "bouquet_royalties": bouquet_royalties,
            "statements": statements
        }

        return Response({
            "success": True,
            "data": resp_data,
            "error": None
        })


class UniversityRoyaltyWithdrawView(APIView):
    """POST /api/v1/partners/university/royalties/withdraw/ - Demande de versement (Partenaires uniquement)."""
    permission_classes = [permissions.IsAuthenticated, IsUniversityStaff]

    def post(self, request):
        import logging
        logger = logging.getLogger(__name__)
        inst = get_user_institution(request.user)
        logger.info(f"[UNIV ACCESS GUARD] {timezone.now().isoformat()} - royalties WITHDRAW user={request.user.id} inst={'none' if not inst else inst.code} type={'none' if not inst else inst.institution_type}")

        # ── Garde d'accès : les universités clientes ne peuvent pas demander de versement ──
        if inst and inst.institution_type == 'client':
            logger.warning(f"[UNIV ACCESS GUARD] {timezone.now().isoformat()} - 403 BLOCKED client {inst.code} on /royalties/withdraw")
            return Response(
                {"success": False, "error": "Accès non autorisé. Les universités clientes ne perçoivent pas de redevances.", "data": None},
                status=status.HTTP_403_FORBIDDEN
            )

        if not inst:
            return Response({"success": False, "error": "Université introuvable"}, status=400)

        try:
            amount = Decimal(str(request.data.get("amount", 0)))
        except (ValueError, TypeError):
            return Response({"success": False, "error": "Montant invalide."}, status=400)

        if amount <= 0:
            return Response({"success": False, "error": "Le montant doit être positif."}, status=400)

        available_balance = UniversityRoyaltyStatement.objects.filter(
            institution=inst, status='available'
        ).aggregate(s=Sum('net_royalty_amount'))['s'] or Decimal("0.00")

        if amount > available_balance:
            return Response({
                "success": False,
                "error": f"Montant demandé ({amount} XOF) supérieur au solde disponible ({available_balance} XOF)."
            }, status=400)

        ref = f"REQ-ROY-UNIV-2026-{int(timezone.now().timestamp()) % 1000:03d}"

        UniversityRoyaltyStatement.objects.create(
            institution=inst,
            reference=ref,
            period=f"Demande de retrait - {timezone.now().strftime('%B %Y')}",
            net_royalty_amount=amount,
            status="pending"
        )

        return Response({
            "success": True,
            "data": {
                "request_reference": ref,
                "amount": float(amount),
                "currency": "XOF",
                "status": "processing",
                "message": "Demande de versement transmise à la Trésorerie & Direction Financière LAHA."
            },
            "error": None
        })


class UniversityProfileView(APIView):
    """GET / PATCH /api/v1/partners/university/profile/ - Profil et identité de l'établissement."""
    permission_classes = [permissions.IsAuthenticated, IsUniversityStaff]

    def get(self, request):
        inst = get_user_institution(request.user)
        if not inst:
            return Response({"success": False, "error": "Profil d'établissement non trouvé"}, status=404)

        profile = {
            "id": str(inst.id),
            "name": inst.name,
            "short_name": inst.short_name or inst.code,
            "country": inst.country,
            "city": inst.city,
            "address": inst.address,
            "rector_name": inst.rector_name,
            "academic_director_name": inst.academic_director_name,
            "contact_email": inst.contact_email,
            "contact_phone": inst.contact_phone,
            "bank_name": inst.bank_name,
            "bank_iban": inst.bank_iban,
            "bank_swift": inst.bank_swift,
            "momo_number": inst.momo_number,
            "contract_reference": inst.contract_reference,
            "royalty_rate": float(inst.royalty_rate) if inst.royalty_rate else 15.00,
            "is_active": inst.is_active,
        }
        return Response({"success": True, "data": profile, "error": None})

    def patch(self, request):
        inst = get_user_institution(request.user)
        if not inst:
            return Response({"success": False, "error": "Profil d'établissement non trouvé"}, status=404)

        d = request.data
        for field in [
            "name", "short_name", "country", "city", "address",
            "rector_name", "academic_director_name", "contact_email", "contact_phone",
            "bank_name", "bank_iban", "bank_swift", "momo_number", "contract_reference"
        ]:
            if field in d:
                setattr(inst, field, d[field])
        if "royalty_rate" in d:
            inst.royalty_rate = d["royalty_rate"]
        inst.save()

        profile = {
            "id": str(inst.id),
            "name": inst.name,
            "short_name": inst.short_name or inst.code,
            "country": inst.country,
            "city": inst.city,
            "address": inst.address,
            "rector_name": inst.rector_name,
            "academic_director_name": inst.academic_director_name,
            "contact_email": inst.contact_email,
            "contact_phone": inst.contact_phone,
            "bank_name": inst.bank_name,
            "bank_iban": inst.bank_iban,
            "bank_swift": inst.bank_swift,
            "momo_number": inst.momo_number,
            "contract_reference": inst.contract_reference,
            "royalty_rate": float(inst.royalty_rate) if inst.royalty_rate else 15.00,
            "is_active": inst.is_active,
            "updated_at": inst.updated_at.isoformat() if hasattr(inst, 'updated_at') else timezone.now().isoformat()
        }
        return Response({"success": True, "data": profile, "error": None})


from django.http import HttpResponse

class ExportBouquetWordView(APIView):
    """GET /api/v1/partners/university/bouquets/<id>/export-word/ — Génère un .docx du bouquet."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        from docx import Document
        from docx.shared import Inches, Pt, Cm, RGBColor
        from docx.enum.text import WD_ALIGN_PARAGRAPH
        from docx.enum.table import WD_TABLE_ALIGNMENT
        from apps.catalog.models import Ouvrage

        inst = get_user_institution(request.user)
        try:
            bouquet = UniversityBouquetSubscription.objects.get(id=pk)
        except UniversityBouquetSubscription.DoesNotExist:
            return Response({"success": False, "error": "Bouquet introuvable."}, status=404)

        from apps.partners.models import BouquetOffering

        if bouquet.offering_id:
            try:
                offering = BouquetOffering.objects.get(id=bouquet.offering_id)
                ouvrages_qs = offering.get_books_queryset(requesting_institution=inst).select_related(
                    'discipline', 'institution'
                ).prefetch_related('authors')
            except BouquetOffering.DoesNotExist:
                ouvrages_qs = Ouvrage.objects.none()
        else:
            ouvrages_qs = Ouvrage.objects.filter(status='published').select_related(
                'discipline', 'institution'
            ).prefetch_related('authors')
            if bouquet.bouquet_type == 'discipline' and bouquet.discipline:
                ouvrages_qs = ouvrages_qs.filter(discipline__name__icontains=bouquet.discipline)
            elif bouquet.bouquet_type == 'faculty' and bouquet.faculty_code:
                ouvrages_qs = ouvrages_qs.filter(faculty__icontains=bouquet.faculty_code)
            if inst:
                ouvrages_qs = ouvrages_qs.filter(institution=inst)

        ouvrages = list(ouvrages_qs.order_by('discipline__name', 'title'))

        # Générer le document Word
        doc = Document()

        # Style de base
        style = doc.styles['Normal']
        font = style.font
        font.name = 'Calibri'
        font.size = Pt(10)

        # En-tête
        header_para = doc.add_paragraph()
        header_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = header_para.add_run('LAHAThèque')
        run.bold = True
        run.font.size = Pt(22)
        run.font.color.rgb = RGBColor(0x1B, 0x2A, 0x4E)  # Navy

        subtitle_para = doc.add_paragraph()
        subtitle_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = subtitle_para.add_run('Bibliothèque Numérique Universitaire')
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

        doc.add_paragraph()  # Espace

        # Titre du bouquet
        title_para = doc.add_paragraph()
        title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = title_para.add_run(f'Catalogue du Bouquet : {bouquet.title}')
        run.bold = True
        run.font.size = Pt(16)
        run.font.color.rgb = RGBColor(0x1B, 0x2A, 0x4E)

        # Informations du bouquet
        info_para = doc.add_paragraph()
        info_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        inst_name = inst.name if inst else 'Toutes universités'
        start_str = bouquet.start_date.strftime("%d/%m/%Y") if hasattr(bouquet.start_date, 'strftime') else str(bouquet.start_date)
        end_str = bouquet.end_date.strftime("%d/%m/%Y") if hasattr(bouquet.end_date, 'strftime') else str(bouquet.end_date)
        run = info_para.add_run(
            f'Université : {inst_name}  |  '
            f'Type : {bouquet.get_bouquet_type_display()}  |  '
            f'Période : {start_str} — {end_str}  |  '
            f'{len(ouvrages)} ouvrage(s)'
        )
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(0x99, 0x99, 0x99)

        doc.add_paragraph()  # Espace

        # Tableau des ouvrages
        if ouvrages:
            table = doc.add_table(rows=1, cols=6)
            table.style = 'Light Grid Accent 1'
            table.alignment = WD_TABLE_ALIGNMENT.CENTER

            # En-têtes
            headers = ['N.', 'Titre', 'Auteur(s)', 'ISBN', 'Discipline / Faculté', 'Résumé']
            for i, h in enumerate(headers):
                cell = table.rows[0].cells[i]
                cell.text = h
                for p in cell.paragraphs:
                    for r in p.runs:
                        r.bold = True
                        r.font.size = Pt(9)

            # Lignes
            for idx, ouvrage in enumerate(ouvrages, 1):
                row = table.add_row()
                row.cells[0].text = str(idx)
                row.cells[1].text = ouvrage.title
                row.cells[2].text = ouvrage.auteur or ''
                row.cells[3].text = ouvrage.isbn or 'N/A'
                disc = ouvrage.discipline.name if ouvrage.discipline else ''
                fac = ouvrage.faculty or ''
                row.cells[4].text = f'{disc}\n{fac}'.strip()
                row.cells[5].text = (ouvrage.summary or '')[:150] + ('...' if len(ouvrage.summary or '') > 150 else '')

                for cell in row.cells:
                    for p in cell.paragraphs:
                        for r in p.runs:
                            r.font.size = Pt(8)
        else:
            doc.add_paragraph('Aucun ouvrage trouvé pour ce bouquet.').alignment = WD_ALIGN_PARAGRAPH.CENTER

        # Pied de page
        doc.add_paragraph()
        from datetime import datetime
        footer = doc.add_paragraph()
        footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = footer.add_run(f'Document généré par LAHAThèque le {datetime.now().strftime("%d/%m/%Y à %H:%M")}')
        run.font.size = Pt(8)
        run.font.color.rgb = RGBColor(0xAA, 0xAA, 0xAA)
        run.italic = True

        # Réponse HTTP
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        safe_title = bouquet.title.replace(' ', '_').replace('/', '-')[:50]
        response['Content-Disposition'] = f'attachment; filename="Bouquet_{safe_title}.docx"'
        doc.save(response)
        return response


class AdminBouquetsDistributionListView(APIView):
    """GET /api/v1/admin/bouquets/distribution/ - Répartition réelle des bouquets par université."""
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSuperAdmin]

    def get(self, request):
        from apps.partners.models import BouquetOffering

        bouquets = BouquetOffering.objects.filter(is_active=True)
        data = []

        for b in bouquets:
            books_qs = b.get_books_queryset()
            books_data = [
                {
                    "id": str(book.id),
                    "institution_id": str(book.institution_id) if book.institution_id else None,
                    "institution_name": book.institution.name if book.institution else "Sans université",
                }
                for book in books_qs.select_related('institution')
            ]

            data.append({
                "id": str(b.id),
                "title": b.title,
                "bouquet_type": b.bouquet_type,
                "annual_price": float(b.annual_price),
                "currency": b.currency,
                "books_count": len(books_data),
                "books": books_data,
            })

        return Response({"success": True, "data": data})


class BouquetRelevanceReportView(APIView):
    """GET /api/v1/partners/university/bouquets/<id>/relevance/ - Rapport de pertinence du bouquet par rapport aux facultés."""
    permission_classes = [permissions.IsAuthenticated, IsUniversityStaff]

    def get(self, request, bouquet_id):
        from apps.partners.models import BouquetOffering, Faculty

        institution = get_user_institution(request.user)
        if not institution:
            return Response({"success": False, "error": "Aucun établissement rattaché à ce compte."}, status=403)

        bouquet = BouquetOffering.objects.filter(id=bouquet_id).first()
        if not bouquet:
            sub = UniversityBouquetSubscription.objects.filter(id=bouquet_id).first()
            if sub and sub.offering_id:
                bouquet = BouquetOffering.objects.filter(id=sub.offering_id).first()

        if not bouquet:
            return Response({"success": False, "error": "Bouquet introuvable."}, status=404)

        university_disciplines = set()
        for faculty in Faculty.objects.filter(institution=institution):
            for d in (faculty.disciplines or []):
                if isinstance(d, str):
                    university_disciplines.add(d.strip().lower())

        books = list(bouquet.get_books_queryset(requesting_institution=institution).select_related('discipline'))
        total_books = len(books)

        if total_books == 0:
            return Response({
                "success": True,
                "data": {
                    "bouquet_id": str(bouquet.id),
                    "bouquet_title": bouquet.title,
                    "total_books": 0,
                    "matching_books": 0,
                    "relevance_percent": 0.0,
                    "matched_disciplines": []
                }
            })

        matching_books = 0
        matched_disciplines = set()
        for book in books:
            book_discipline = (book.discipline.name.strip().lower() if book.discipline else None)
            if book_discipline and book_discipline in university_disciplines:
                matching_books += 1
                matched_disciplines.add(book.discipline.name)

        relevance_percent = round((matching_books / total_books) * 100, 1)

        return Response({
            "success": True,
            "data": {
                "bouquet_id": str(bouquet.id),
                "bouquet_title": bouquet.title,
                "total_books": total_books,
                "matching_books": matching_books,
                "relevance_percent": relevance_percent,
                "matched_disciplines": sorted(matched_disciplines),
            }
        })


class UniversityClientCatalogView(APIView):
    """GET /api/v1/partners/university/catalog/ - Ouvrages numériques accessibles via les bouquets actifs (Universités Clientes)."""
    permission_classes = [permissions.IsAuthenticated, IsUniversityStaff]

    def get(self, request):
        import logging
        logger = logging.getLogger(__name__)
        from .models import BouquetOffering
        from apps.catalog.models import Ouvrage

        inst = get_user_institution(request.user)
        logger.info(f"[UNIV CATALOG] {timezone.now().isoformat()} - catalog GET user={request.user.id} inst={'none' if not inst else inst.code} type={'none' if not inst else inst.institution_type}")

        if not inst:
            return Response({"success": True, "data": [], "error": None})

        # Les partenaires n'ont pas de catalogue d'abonnement — leur catalogue = leurs ouvrages propres
        if inst.institution_type == 'partner':
            return Response(
                {"success": False, "error": "Les universités partenaires accèdent à leurs ouvrages depuis leur portail de redevances.", "data": None},
                status=status.HTTP_403_FORBIDDEN
            )

        # Collecter les ouvrages accessibles via les bouquets actifs souscrits
        active_subs = UniversityBouquetSubscription.objects.filter(institution=inst, status='active')
        accessible_ids: set = set()
        bouquet_map: dict = {}  # book_id -> bouquet title(s)

        for sub in active_subs:
            offering = BouquetOffering.objects.filter(id=sub.offering_id).first() if sub.offering_id else None
            if offering:
                book_ids = list(offering.get_books_queryset(requesting_institution=inst).values_list('id', flat=True))
                for bid in book_ids:
                    accessible_ids.add(bid)
                    bouquet_map.setdefault(str(bid), []).append(sub.title)

        if not accessible_ids:
            return Response({"success": True, "data": [], "error": None})

        # Filtres optionnels
        search = request.query_params.get("search", "").strip()
        discipline = request.query_params.get("discipline", "").strip()
        bouquet_id = request.query_params.get("bouquet_id", "").strip()

        qs = Ouvrage.objects.filter(
            id__in=accessible_ids,
            status='published'
        ).select_related('discipline', 'institution').prefetch_related('authors')

        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(auteur__icontains=search) | Q(isbn__icontains=search))
        if discipline:
            qs = qs.filter(discipline__name__icontains=discipline)
        if bouquet_id:
            # Filtrer aux seuls ouvrages du bouquet demandé
            try:
                offering = BouquetOffering.objects.get(id=bouquet_id)
                bouquet_book_ids = set(offering.get_books_queryset(requesting_institution=inst).values_list('id', flat=True))
                qs = qs.filter(id__in=bouquet_book_ids)
            except BouquetOffering.DoesNotExist:
                pass

        books = []
        for book in qs.order_by('title')[:200]:
            cover_url = ""
            if book.cover_image:
                try:
                    cover_url = book.cover_image.url
                except Exception:
                    cover_url = str(book.cover_image)

            authors = [
                a.user.get_full_name() if (a.user and a.user.get_full_name()) else f"{a.first_name} {a.last_name}".strip()
                for a in book.authors.all()
            ] if hasattr(book, 'authors') else []
            if not authors and book.auteur:
                authors = [book.auteur]

            books.append({
                "id": str(book.id),
                "title": book.title,
                "authors": authors,
                "isbn": book.isbn or "",
                "cover_url": cover_url,
                "discipline": book.discipline.name if book.discipline else "",
                "institution_name": book.institution.name if book.institution else "",
                "summary": (book.summary or "")[:300],
                "publication_year": book.publication_year if hasattr(book, 'publication_year') else None,
                "is_audio_available": getattr(book, 'is_audio_available', False),
                "bouquets": bouquet_map.get(str(book.id), []),
            })

        logger.info(f"[UNIV CATALOG] {timezone.now().isoformat()} - CLIENT {inst.code}: {len(books)} ouvrages accessibles retournés")

        return Response({"success": True, "data": books, "error": None})


class UniversityPostPaymentCredentialsView(APIView):
    """
    GET /api/v1/partners/university/subscriptions/<uuid:pk>/credentials/
    Restitue les identifiants d'API post-paiement, avec le secret en clair s'il vient d'être créé
    (disponible dans le cache sécurisé pendant 15 minutes), et le contenu formaté du fichier .env.
    """
    permission_classes = [permissions.IsAuthenticated, IsUniversityStaff]

    def get(self, request, pk):
        import logging
        from django.core.cache import cache
        from apps.reader.models import PartnerApp

        logger = logging.getLogger(__name__)
        user = request.user
        inst = get_user_institution(user)

        if not inst and getattr(user, 'role', '') not in ['admin', 'super_admin']:
            return Response({"success": False, "error": "Université introuvable."}, status=status.HTTP_400_BAD_REQUEST)

        # Récupération de la souscription
        sub_qs = UniversityBouquetSubscription.objects.filter(id=pk)
        if inst and getattr(user, 'role', '') not in ['admin', 'super_admin']:
            sub_qs = sub_qs.filter(institution=inst)
        sub = sub_qs.first()

        if not sub:
            return Response({"success": False, "error": "Souscription bouquet introuvable."}, status=status.HTTP_404_NOT_FOUND)

        institution = sub.institution or inst

        # Lecture dans le cache sécurisé (TTL 15 minutes)
        cache_key = f"post_payment_credentials_{sub.id}"
        cached = cache.get(cache_key)

        partner = PartnerApp.objects.filter(linked_institution=institution).first()

        if cached:
            client_id = cached.get("client_id")
            client_secret = cached.get("client_secret")
            client_secret_last4 = cached.get("client_secret_last4") or (partner.client_secret_last4 if partner else "")
            is_new = cached.get("created", False)
            env_content = cached.get("env_content")
        elif partner:
            client_id = partner.client_id
            client_secret = None
            client_secret_last4 = partner.client_secret_last4
            is_new = False
            env_content = (
                f"# LAHAThèque API Credentials - {institution.name}\n"
                f"LAHATHEQUE_CLIENT_ID={partner.client_id}\n"
                f"LAHATHEQUE_CLIENT_SECRET=••••••••••••••••••••••••••••••••\n"
                f"LAHATHEQUE_API_URL=https://api.lahatheque.com/api/v1\n"
            )
        else:
            client_id = None
            client_secret = None
            client_secret_last4 = None
            is_new = False
            env_content = ""

        inst_code_safe = institution.code.lower() if (institution and institution.code) else "partner"
        filename = f"lahatheque-api-credentials-{inst_code_safe}.txt"

        logger.info(f"[POST PAYMENT CREDENTIALS] Consulté pour souscription {sub.id} (nouveau={is_new})")

        return Response({
            "success": True,
            "data": {
                "subscription_id": str(sub.id),
                "institution_name": institution.name if institution else "",
                "institution_code": institution.code if institution else "",
                "offering_title": sub.title,
                "subscription_period": sub.subscription_period,
                "price_paid": float(sub.price_paid or sub.annual_price or 0.0),
                "currency": sub.currency,
                "start_date": str(sub.start_date) if sub.start_date else None,
                "end_date": str(sub.end_date) if sub.end_date else None,
                "status": sub.status,
                "client_id": client_id,
                "client_secret": client_secret,
                "client_secret_last4": client_secret_last4,
                "is_new": is_new,
                "env_content": env_content,
                "suggested_filename": filename,
                "guide_pdf_url": "/api/v1/partners/university/guides/catalog-only-pdf/",
            },
            "error": None
        })


class PartnerGuidePdfDownloadView(APIView):
    """
    GET /api/v1/partners/university/guides/catalog-only-pdf/
    Génère et télécharge le Guide d'Implémentation Partenaire officiel en PDF vectoriel haute définition.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.http import HttpResponse
        from apps.reporting.pdf_service import PartnerIntegrationGuidePdfService
        try:
            pdf_bytes = PartnerIntegrationGuidePdfService.generate_guide_pdf()
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="Guide_Integration_Catalogue_LAHATheque.pdf"'
            response['Content-Length'] = len(pdf_bytes)
            return response
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur lors de la génération du guide PDF partenaire: {e}", exc_info=True)
            return Response({
                "success": False,
                "error": f"Impossible de générer le guide PDF: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




