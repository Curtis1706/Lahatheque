"""Vues pour l'Espace Client Lecteur / Étudiant."""
import hashlib
from typing import Any
from datetime import timedelta, date

from django.db.models import Sum, Count, Q
from django.utils import timezone
from django.core.cache import cache

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.catalog.models import Ouvrage, Discipline
from apps.commerce.models import Order, LigneCommande, PhysicalDelivery, Currency, PaymentTransaction
from apps.partners.models import StudentAffiliation, UniversityBouquetSubscription, Institution

from .models import ReadingProgress, ReadingSession
from .serializers import (
    ReadingProgressSerializer,
    UpdateReadingProgressSerializer,
    OuvrageBasicSerializer,
    OrderStudentSerializer,
    AffiliationStudentSerializer,
    CreateAffiliationSerializer,
    BouquetSerializer,
    InstitutionBasicSerializer,
)


# ─── Vue d'ensemble : KPIs ─────────────────────────────────────────────────────

class StudentOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        from apps.protection.access_service import AccessService

        # Récupérer les progressions de lecture de l'utilisateur
        all_progress = list(
            ReadingProgress.objects
            .filter(user=user)
            .select_related('ouvrage', 'ouvrage__discipline', 'ouvrage__publisher')
            .prefetch_related('ouvrage__authors')
            .order_by('-last_read_at')
        )

        user_audio_ids = set(
            str(bid) for bid in LigneCommande.objects.filter(
                commande__user=user,
                format_type='audio',
            ).filter(
                Q(commande__statut_paiement='paid') | Q(commande__is_credit_purchase=True)
            ).values_list('ouvrage_id', flat=True)
        )

        valid_progress = [
            p for p in all_progress
            if AccessService.check_user_book_access(user, str(p.ouvrage.id)).get("access_granted")
               or str(p.ouvrage.id) in user_audio_ids
        ]

        # Bibliothèque : livres avec accès légitime (numérique ou audio)
        total_books = len(valid_progress)

        # Livre en cours de lecture numérique (progression max non terminé)
        current_reading_data = None
        digital_readings = [
            p for p in valid_progress
            if AccessService.check_user_book_access(user, str(p.ouvrage.id)).get("access_granted")
        ]
        current_reading = next((p for p in digital_readings if not p.is_completed), None)
        if not current_reading and digital_readings:
            current_reading = digital_readings[0]

        if current_reading:
            progress_pct = current_reading.progress_percent
            if progress_pct == 0 and current_reading.total_pages > 0 and current_reading.current_page > 0:
                progress_pct = min(100, max(1, round((current_reading.current_page / current_reading.total_pages) * 100)))

            current_reading_data = {
                'ouvrage': OuvrageBasicSerializer(current_reading.ouvrage, context={'request': request}).data,
                'progress_percent': progress_pct,
                'last_read_chapter': current_reading.last_read_chapter,
                'last_read_at': current_reading.last_read_at,
            }

        # Affiliation & Bouquets Campus
        affiliation = StudentAffiliation.objects.filter(student=user).order_by('-created_at').first()
        unlocked_bouquets_count = 0
        has_university_affiliation = False
        institution_name = None
        if affiliation and affiliation.status == 'approved' and affiliation.institution:
            has_university_affiliation = True
            institution_name = affiliation.institution.name
            unlocked_bouquets_count = UniversityBouquetSubscription.objects.filter(
                institution=affiliation.institution, status='active'
            ).count()

        # Commandes en attente
        unpaid_orders_count = Order.objects.filter(
            user=user, statut_paiement='pending'
        ).count()

        # Heures de lecture hebdomadaires
        week_ago = timezone.now().date() - timedelta(days=7)
        weekly_seconds = ReadingSession.objects.filter(
            user=user, session_date__gte=week_ago
        ).aggregate(total=Sum('duration_seconds'))['total'] or 0
        weekly_reading_hours = round(weekly_seconds / 3600, 1)

        # Streak actuel (jours consécutifs de lecture)
        streak_days = _compute_reading_streak(user)

        return Response({
            'success': True,
            'data': {
                'totalBooksInLibrary': total_books,
                'currentReading': current_reading_data,
                'unlockedBouquetsCount': unlocked_bouquets_count,
                'unpaidOrdersCount': unpaid_orders_count,
                'hasUniversityAffiliation': has_university_affiliation,
                'institutionName': institution_name,
                'weeklyReadingHours': weekly_reading_hours,
                'readingStreakDays': streak_days,
            },
            'error': None,
        })


def _compute_reading_streak(user) -> int:
    """Calcule le nombre de jours consécutifs de lecture jusqu'à aujourd'hui."""
    today = timezone.now().date()
    streak = 0
    current_day = today
    while True:
        has_session = ReadingSession.objects.filter(
            user=user, session_date=current_day
        ).exists()
        if not has_session:
            break
        streak += 1
        current_day -= timedelta(days=1)
    return streak


# ─── Ma Bibliothèque ───────────────────────────────────────────────────────────

class StudentBooksView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        format_filter = request.query_params.get('format')
        favorites_only = request.query_params.get('favorites') == 'true'
        from apps.protection.access_service import AccessService

        qs = (
            ReadingProgress.objects
            .filter(user=user)
            .select_related(
                'ouvrage', 'ouvrage__discipline',
                'ouvrage__publisher', 'ouvrage__institution'
            )
            .prefetch_related('ouvrage__authors')
            .order_by('-last_read_at')
        )

        if format_filter and format_filter != 'all':
            qs = qs.filter(ouvrage__format_type=format_filter)
        if favorites_only:
            qs = qs.filter(is_favorite=True)

        user_audio_ids = set()
        user_digital_ids = set()
        platform_roles = ['admin', 'super_admin', 'chief_layout', 'layout_artist', 'legal_reviewer']
        from django.conf import settings
        is_platform_admin = (
            user.is_superuser
            or user.is_staff
            or getattr(user, 'role', '') in platform_roles
            or getattr(settings, 'DEV_UNLOCK_ALL_BOOKS', False)
        )
        if is_platform_admin:
            user_audio_ids = True
            user_digital_ids = True
        else:
            user_audio_ids = set(
                str(bid) for bid in LigneCommande.objects.filter(
                    commande__user=user,
                    format_type='audio',
                ).filter(
                    Q(commande__statut_paiement='paid') | Q(commande__is_credit_purchase=True)
                ).values_list('ouvrage_id', flat=True)
            )
            user_digital_ids = set(
                str(bid) for bid in LigneCommande.objects.filter(
                    commande__user=user,
                    format_type__in=['digital', 'pdf', 'epub'],
                ).filter(
                    Q(commande__statut_paiement='paid') | Q(commande__is_credit_purchase=True)
                ).values_list('ouvrage_id', flat=True)
            )

        data = []
        for progress in qs:
            book_id_str = str(progress.ouvrage.id)
            access_info = AccessService.check_user_book_access(user, book_id_str)
            has_digital_access = bool(access_info.get("access_granted"))
            has_audio_access = (user_audio_ids is True) or (book_id_str in user_audio_ids)

            # Si l'utilisateur n'a ni accès numérique ni accès audio, ignorer
            if not has_digital_access and not has_audio_access:
                continue

            progress_pct = progress.progress_percent
            if progress_pct == 0 and progress.total_pages > 0 and progress.current_page > 0:
                progress_pct = min(100, max(1, round((progress.current_page / progress.total_pages) * 100)))

            ouvrage_data = OuvrageBasicSerializer(
                progress.ouvrage,
                context={
                    'request': request,
                    'user_audio_ids': user_audio_ids,
                    'user_digital_ids': user_digital_ids if not is_platform_admin else True,
                }
            ).data

            data.append({
                **ouvrage_data,
                'is_owned': has_digital_access,
                'has_digital_access': has_digital_access,
                'is_audio_owned': has_audio_access,
                'has_audio_access': has_audio_access,
                'progress_percent': progress_pct if has_digital_access else None,
                'current_page': progress.current_page if has_digital_access else 0,
                'last_read_chapter': progress.last_read_chapter if has_digital_access else '',
                'last_read_at': progress.last_read_at,
                'is_completed': (progress.is_completed or progress_pct >= 100) if has_digital_access else False,
                'is_favorite': progress.is_favorite,
                'access_type': access_info.get("reason", "purchased") if has_digital_access else "audio_purchase",
            })

        return Response({'success': True, 'data': data, 'error': None})


class StudentBookDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, book_id: str):
        user = request.user
        try:
            ouvrage = (
                Ouvrage.objects
                .select_related('discipline', 'publisher', 'institution')
                .prefetch_related('authors')
                .get(id=book_id)
            )
        except Ouvrage.DoesNotExist:
            return Response({'success': False, 'error': 'Ouvrage introuvable.'}, status=404)

        # Vérification de l'accès
        from apps.protection.access_service import AccessService
        access_info = AccessService.check_user_book_access(user, book_id)

        # Progression de lecture
        progress = ReadingProgress.objects.filter(user=user, ouvrage=ouvrage).first()
        progress_data = ReadingProgressSerializer(progress).data if progress else None

        return Response({
            'success': True,
            'data': {
                'ouvrage': OuvrageBasicSerializer(ouvrage, context={'request': request}).data,
                'access': access_info,
                'reading_progress': progress_data,
            },
            'error': None,
        })


class StudentToggleFavoriteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, book_id: str):
        user = request.user
        try:
            Ouvrage.objects.get(id=book_id)
        except Ouvrage.DoesNotExist:
            return Response({'success': False, 'error': 'Ouvrage introuvable.'}, status=404)

        progress, created = ReadingProgress.objects.get_or_create(
            user=user,
            ouvrage_id=book_id,
            defaults={'progress_percent': 0}
        )
        progress.is_favorite = not progress.is_favorite
        progress.save(update_fields=['is_favorite'])

        return Response({
            'success': True,
            'data': {'is_favorite': progress.is_favorite},
            'error': None,
        })


# ─── Progression & Sessions de Lecture ────────────────────────────────────────

class StudentUpdateReadingProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        serializer = UpdateReadingProgressSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'error': serializer.errors}, status=400)

        data = serializer.validated_data
        ouvrage_id = data['ouvrage_id']

        try:
            ouvrage = Ouvrage.objects.get(id=ouvrage_id)
        except Ouvrage.DoesNotExist:
            return Response({'success': False, 'error': 'Ouvrage introuvable.'}, status=404)

        current_page = data.get('current_page', 1)
        total_pages = data.get('total_pages') or ouvrage.page_count or 1
        progress_pct = data['progress_percent']

        if total_pages > 0 and current_page > 0 and (progress_pct == 0 or progress_pct < round((current_page / total_pages) * 100)):
            progress_pct = min(100, max(1, round((current_page / total_pages) * 100)))

        is_completed = bool(progress_pct >= 100 or (total_pages > 0 and current_page >= total_pages))

        progress, _ = ReadingProgress.objects.update_or_create(
            user=user,
            ouvrage=ouvrage,
            defaults={
                'progress_percent': progress_pct,
                'current_page': current_page,
                'total_pages': total_pages,
                'last_read_chapter': data.get('last_read_chapter', ''),
                'is_completed': is_completed,
                'last_read_at': timezone.now(),
            }
        )

        # Enregistre ou met à jour la session active de lecture
        duration = int(data.get('duration_seconds') or 15)
        pages_read = int(data.get('pages_read') or 1)

        # Regroupe avec la session récente si elle a eu lieu aujourd'hui il y a moins de 30 min
        recent_session = (
            ReadingSession.objects
            .filter(user=user, ouvrage=ouvrage, session_date=timezone.now().date())
            .order_by('-created_at')
            .first()
        )

        if recent_session and (timezone.now() - recent_session.created_at).total_seconds() < 1800:
            recent_session.duration_seconds += duration
            recent_session.pages_read = max(recent_session.pages_read, pages_read)
            recent_session.save(update_fields=['duration_seconds', 'pages_read'])
        else:
            ReadingSession.objects.create(
                user=user,
                ouvrage=ouvrage,
                duration_seconds=max(30, duration),
                pages_read=max(1, pages_read),
                session_date=timezone.now().date(),
            )

        return Response({
            'success': True,
            'data': ReadingProgressSerializer(progress).data,
            'error': None,
        })


# ─── Historique & Statistiques d'Étude ────────────────────────────────────────

class StudentHistoryStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()

        # Activité des 7 derniers jours (secondes/jour)
        days_7 = [(today - timedelta(days=i)) for i in range(6, -1, -1)]
        daily_activity = []
        for d in days_7:
            total_sec = ReadingSession.objects.filter(
                user=user, session_date=d
            ).aggregate(total=Sum('duration_seconds'))['total'] or 0
            fr_days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
            daily_activity.append({
                'day': fr_days[d.weekday()],
                'hours': round(total_sec / 3600, 2),
                'date': str(d),
            })

        # Total hebdomadaire
        week_ago = today - timedelta(days=7)
        weekly_sec = ReadingSession.objects.filter(
            user=user, session_date__gte=week_ago
        ).aggregate(total=Sum('duration_seconds'))['total'] or 0
        weekly_hours = round(weekly_sec / 3600, 1)

        # Répartition par discipline
        discipline_data = list(
            ReadingSession.objects
            .filter(user=user)
            .values('ouvrage__discipline__name')
            .annotate(total_sec=Sum('duration_seconds'))
            .order_by('-total_sec')
        )
        if not discipline_data:
            discipline_data = list(
                ReadingProgress.objects
                .filter(user=user, ouvrage__discipline__isnull=False)
                .values('ouvrage__discipline__name')
                .annotate(total_sec=Count('id'))
                .order_by('-total_sec')
            )
        total_all = sum(d['total_sec'] for d in discipline_data) or 1
        DISCIPLINE_COLORS = [
            'var(--color-gold)', 'var(--color-navy)', '#4A7FA5',
            '#6B9E78', '#A5714A', '#A56B9E'
        ]
        discipline_breakdown = [
            {
                'name': d['ouvrage__discipline__name'] or 'Non classé',
                'percentage': round((d['total_sec'] / total_all) * 100),
                'color': DISCIPLINE_COLORS[i % len(DISCIPLINE_COLORS)],
            }
            for i, d in enumerate(discipline_data[:6])
        ]

        # Progression globale & livres terminés
        user_progresses = list(ReadingProgress.objects.filter(user=user))
        total_books = len(user_progresses)
        sum_progress = 0
        books_completed = 0
        for p in user_progresses:
            pct = p.progress_percent
            if pct == 0 and p.total_pages > 0 and p.current_page > 0:
                pct = min(100, max(1, round((p.current_page / p.total_pages) * 100)))
            if p.is_completed or pct >= 100:
                books_completed += 1
            sum_progress += pct

        avg_progress = round(sum_progress / total_books) if total_books > 0 else 0

        # Total pages lues
        session_pages = ReadingSession.objects.filter(user=user).aggregate(
            total=Sum('pages_read')
        )['total'] or 0
        progress_pages = sum(p.current_page for p in user_progresses)
        total_pages = max(session_pages, progress_pages)

        # Streak
        streak_days = _compute_reading_streak(user)

        # Objectifs et statuts des ouvrages réels distincts
        active_goals = []
        for p in user_progresses[:3]:
            pct = p.progress_percent
            if pct == 0 and p.total_pages > 0 and p.current_page > 0:
                pct = min(100, max(1, round((p.current_page / p.total_pages) * 100)))
            is_done = p.is_completed or pct >= 100
            active_goals.append({
                'id': str(p.ouvrage.id),
                'title': p.ouvrage.title,
                'progress_percent': pct,
                'is_completed': is_done,
            })

        # Construction de la timeline d'étude basée sur les lectures réelles de l'étudiant
        timeline = []
        for p in user_progresses:
            pct = p.progress_percent
            real_total = p.total_pages if p.total_pages > 0 else (p.ouvrage.page_count or 0)
            tot_p = real_total if real_total > 0 else None
            cur_p = max(1, p.current_page)
            if pct == 0 and tot_p and tot_p > 0 and cur_p > 0:
                pct = min(100, max(1, round((cur_p / tot_p) * 100)))
            is_done = p.is_completed or pct >= 100

            # Calcul du temps d'étude réel cumulé sur cet ouvrage
            book_seconds = ReadingSession.objects.filter(
                user=user, ouvrage=p.ouvrage
            ).aggregate(total=Sum('duration_seconds'))['total'] or 0

            # Si le temps enregistré est minime, estimation réaliste basée sur les pages lues (environ 1.5 min par page)
            if book_seconds < (cur_p * 60):
                book_seconds = max(book_seconds, cur_p * 90)

            duration_mins = max(1, round(book_seconds / 60))

            timeline.append({
                'id': str(p.id),
                'ouvrage_id': str(p.ouvrage.id),
                'ouvrage_title': p.ouvrage.title,
                'ouvrage_discipline': p.ouvrage.discipline.name if p.ouvrage.discipline else '',
                'ouvrage_cover_url': p.ouvrage.cover_url,
                'current_page': cur_p,
                'total_pages': tot_p,
                'progress_percent': pct,
                'is_completed': is_done,
                'duration_seconds': book_seconds,
                'duration_minutes': duration_mins,
                'pages_read': cur_p,
                'session_date': str(p.last_read_at.date() if p.last_read_at else today),
            })

        return Response({
            'success': True,
            'data': {
                'weekly_hours': weekly_hours,
                'daily_activity': daily_activity,
                'overall_progress': round(avg_progress),
                'discipline_breakdown': discipline_breakdown,
                'current_streak_days': streak_days,
                'total_pages_read': total_pages,
                'books_completed_count': books_completed,
                'active_goals': active_goals,
                'recent_sessions_timeline': timeline,
            },
            'error': None,
        })


# ─── Mes Achats & Commandes ────────────────────────────────────────────────────

class StudentOrdersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.commerce.services import reconcile_moneroo_payment
        user = request.user

        # 1. Réconciliation prioritaire si paymentId ou order_id est fourni en paramètre URL
        payment_id = request.query_params.get('paymentId') or request.query_params.get('payment_id')
        req_order_id = request.query_params.get('order_id')
        if payment_id or req_order_id:
            try:
                reconcile_moneroo_payment(moneroo_id=payment_id, order_id=req_order_id, user=user)
            except Exception:
                pass

        # 2. Auto-réconciliation proactive des commandes récentes en attente avec transaction Moneroo
        recent_pending_orders = (
            Order.objects
            .filter(
                user=user,
                statut_paiement='pending',
                payment_transaction__moneroo_id__isnull=False,
                created_at__gte=timezone.now() - timedelta(hours=48)
            )
            .select_related('payment_transaction')[:3]
        )
        for po in recent_pending_orders:
            try:
                reconcile_moneroo_payment(moneroo_id=po.payment_transaction.moneroo_id, order_id=str(po.id), user=user)
            except Exception:
                pass

        orders = (
            Order.objects
            .filter(user=user)
            .prefetch_related('lignes', 'lignes__ouvrage')
            .select_related('livraison', 'currency', 'payment_transaction')
            .order_by('-created_at')
        )
        serializer = OrderStudentSerializer(orders, many=True)
        return Response({'success': True, 'data': serializer.data, 'error': None})

    def post(self, request):
        """Création d'une commande de livre papier pour l'étudiant."""
        user = request.user
        ouvrage_id = request.data.get('ouvrage_id')
        quantity = int(request.data.get('quantity', 1))
        shipping_address = request.data.get('shipping_address', '').strip()
        city = request.data.get('city', 'Cotonou').strip()
        country = request.data.get('country', 'BJ').strip()

        if not ouvrage_id:
            return Response({'success': False, 'error': 'ouvrage_id est requis.'}, status=400)
        if not shipping_address:
            return Response({'success': False, 'error': 'L\'adresse de livraison est requise.'}, status=400)

        try:
            ouvrage = Ouvrage.objects.get(id=ouvrage_id)
        except Ouvrage.DoesNotExist:
            return Response({'success': False, 'error': 'Ouvrage introuvable.'}, status=404)

        from django.db import transaction
        currency, _ = Currency.objects.get_or_create(code='XOF', defaults={'peg_rate_to_eur': 655.957})
        unit_price = ouvrage.price_paper
        shipping_fee = 2500
        total_amount = (unit_price * quantity) + shipping_fee

        with transaction.atomic():
            tx = PaymentTransaction.objects.create(
                user=user,
                amount=total_amount,
                currency=currency,
                status='success',
            )
            commande = Order.objects.create(
                user=user,
                payment_transaction=tx,
                total_amount=total_amount,
                currency=currency,
                statut_paiement='paid',  # Paiement validé pour la démo
                statut_commande='processing',
            )
            LigneCommande.objects.create(
                commande=commande,
                ouvrage=ouvrage,
                format_type='paper',
                unit_price=unit_price,
                quantity=quantity,
            )
            PhysicalDelivery.objects.create(
                commande=commande,
                shipping_address=shipping_address,
                city=city,
                country=country,
                carrier_name='DHL Express',
                statut='en_preparation',
            )

        serializer = OrderStudentSerializer(commande)
        return Response({'success': True, 'data': serializer.data, 'error': None}, status=201)


# ─── Mon Université & Bouquets Institutionnels ─────────────────────────────────

class StudentUniversityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Affiliation actuelle
        affiliation = (
            StudentAffiliation.objects
            .filter(student=user)
            .select_related('institution', 'faculty')
            .order_by('-created_at')
            .first()
        )

        # Institutions disponibles
        institutions = Institution.objects.filter(is_active=True).order_by('name')

        return Response({
            'success': True,
            'data': {
                'affiliation': AffiliationStudentSerializer(affiliation).data if affiliation else None,
                'institutions': InstitutionBasicSerializer(institutions, many=True).data,
            },
            'error': None,
        })

    def post(self, request):
        """Demande d'affiliation universitaire."""
        from django.conf import settings as django_settings
        if not getattr(django_settings, "ENABLE_UNIVERSITY_AFFILIATION_GATING", False):
            return Response({
                "success": False,
                "error": "Cette fonctionnalité n'est pas activée sur la plateforme actuellement."
            }, status=403)

        user = request.user

        # Une seule affiliation active à la fois
        existing = StudentAffiliation.objects.filter(
            student=user, status__in=['pending', 'approved']
        ).first()
        if existing:
            return Response({
                'success': False,
                'error': 'Vous avez déjà une demande d\'affiliation en cours ou active.',
            }, status=400)

        serializer = CreateAffiliationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'error': serializer.errors}, status=400)

        data = serializer.validated_data
        try:
            institution = Institution.objects.get(id=data['institution_id'])
        except Institution.DoesNotExist:
            return Response({'success': False, 'error': 'Établissement introuvable.'}, status=404)

        affiliation = StudentAffiliation.objects.create(
            student=user,
            institution=institution,
            student_card_number=data['student_card_number'],
            level=data.get('level', 'Licence 1'),
            carte_etudiant_image=data.get('carte_etudiant_image', ''),
            student_name=f"{user.first_name} {user.last_name}".strip(),
            student_email=user.email,
            status='pending',
        )

        return Response({
            'success': True,
            'data': AffiliationStudentSerializer(affiliation).data,
            'error': None,
        }, status=201)


# ─── Catalogue Public ──────────────────────────────────────────────────────────

class StudentCatalogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Cache par utilisateur + paramètres de requête (2 min — reflète les achats rapidement)
        params_copy = dict(request.query_params)
        raw_key = f"student_catalog:{user.pk}:{sorted(params_copy.items())}"
        cache_key = "student:" + hashlib.md5(raw_key.encode()).hexdigest()
        try:
            cached = cache.get(cache_key)
            if cached is not None:
                return Response(cached)
        except Exception:
            pass

        qs = (
            Ouvrage.objects
            .filter(status='published')
            .select_related('discipline', 'publisher', 'institution')
            .prefetch_related('authors', 'language_versions', 'audio_tracks')
        )

        q = request.query_params.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(title__icontains=q) |
                Q(subtitle__icontains=q) |
                Q(summary__icontains=q) |
                Q(authors__first_name__icontains=q) |
                Q(authors__last_name__icontains=q)
            ).distinct()

        discipline_id = request.query_params.get('discipline')
        if discipline_id and discipline_id != 'all':
            if str(discipline_id).isdigit():
                qs = qs.filter(discipline_id=discipline_id)
            else:
                qs = qs.filter(Q(discipline__name__iexact=discipline_id) | Q(discipline__name__icontains=discipline_id))

        format_type = request.query_params.get('format')
        if format_type and format_type != 'all':
            f = format_type.lower().strip()
            if f in ('audio', 'audio_all', 'livres_audio'):
                qs = qs.filter(Q(format_type='audio') | Q(has_audio_version=True) | Q(audio_tracks__isnull=False)).distinct()
            elif f in ('digital', 'numerique'):
                qs = qs.filter(format_type__in=['pdf', 'epub'])
            elif f in ('paper', 'papier'):
                qs = qs.filter(is_paper_available=True)
            else:
                qs = qs.filter(format_type=f)

        language = request.query_params.get('language')
        if language and language != 'all':
            lang_low = language.lower().strip()
            if lang_low in ('fr', 'french', 'francais', 'français'):
                qs = qs.filter(
                    Q(language__iexact='fr') |
                    Q(language__iexact='Français') |
                    Q(language_versions__language__iexact='fr', language_versions__translation_status='ready')
                ).distinct()
            elif lang_low in ('en', 'english', 'anglais'):
                qs = qs.filter(
                    Q(language__iexact='en') |
                    Q(language_versions__language__iexact='en')
                ).distinct()
            elif lang_low in ('bilingual', 'bilingue', 'multi'):
                qs = qs.filter(
                    language_versions__language__iexact='fr',
                    language_versions__translation_status='ready'
                ).filter(
                    language_versions__language__iexact='en'
                ).distinct()
            else:
                qs = qs.filter(
                    Q(language__iexact=language) |
                    Q(language_versions__language__iexact=language)
                ).distinct()

        qs = qs.order_by('-created_at', '-id')

        # Calcul vectorisé / batch de l'accès utilisateur pour éviter 500+ requêtes SQL N+1
        user_owned_ids = set()
        user_audio_ids = set()

        if user and user.is_authenticated:
            platform_roles = ['admin', 'super_admin', 'chief_layout', 'layout_artist', 'legal_reviewer']
            from django.conf import settings
            is_platform_admin = (
                user.is_superuser
                or user.is_staff
                or getattr(user, 'role', '') in platform_roles
                or getattr(settings, 'DEV_UNLOCK_ALL_BOOKS', False)
            )
            if is_platform_admin:
                user_owned_ids = True
                user_audio_ids = True
            else:
                from apps.commerce.models import Subscription, LigneCommande, ClientBouquetSubscription
                from apps.partners.models import StudentAffiliation, BouquetOffering
                from django.utils import timezone as tz

                has_sub = Subscription.objects.filter(user=user, is_active=True).exists()
                if not has_sub:
                    student_aff = StudentAffiliation.objects.filter(student=user, is_validated=True).select_related('institution').first()
                    if student_aff and student_aff.institution:
                        has_sub = Subscription.objects.filter(institution=student_aff.institution, is_active=True).exists()

                if has_sub:
                    user_owned_ids = True
                else:
                    owned_digital = set(
                        str(bid) for bid in LigneCommande.objects.filter(
                            commande__user=user,
                            format_type='digital',
                        ).filter(
                            Q(commande__statut_paiement='paid') | Q(commande__is_credit_purchase=True)
                        ).values_list('ouvrage_id', flat=True)
                    )
                    today = tz.now().date()
                    client_subs = ClientBouquetSubscription.objects.filter(
                        user=user, status="active", start_date__lte=today, end_date__gte=today
                    )
                    for csub in client_subs:
                        try:
                            offering = BouquetOffering.objects.get(id=csub.offering_id, is_active=True)
                            owned_digital.update(str(bid) for bid in offering.get_books_queryset().values_list('id', flat=True))
                        except Exception:
                            pass
                    user_owned_ids = owned_digital

                user_audio_ids = set(
                    str(bid) for bid in LigneCommande.objects.filter(
                        commande__user=user,
                        format_type='audio',
                    ).filter(
                        Q(commande__statut_paiement='paid') | Q(commande__is_credit_purchase=True)
                    ).values_list('ouvrage_id', flat=True)
                )

        total_count = qs.count()

        # Support de la pagination serveur native
        page_param = request.query_params.get('page')
        page_size_param = request.query_params.get('page_size')

        if page_param is not None or page_size_param is not None:
            try:
                page = max(1, int(page_param or 1))
            except (ValueError, TypeError):
                page = 1
            try:
                page_size = max(1, min(100, int(page_size_param or 12)))
            except (ValueError, TypeError):
                page_size = 12

            total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 1
            start = (page - 1) * page_size
            end = start + page_size
            books_slice = qs[start:end]
        else:
            page = 1
            page_size = total_count
            total_pages = 1
            books_slice = qs

        serializer = OuvrageBasicSerializer(
            books_slice,
            many=True,
            context={
                'request': request,
                'user_owned_ids': user_owned_ids,
                'user_audio_ids': user_audio_ids,
            }
        )
        payload = {
            'success': True,
            'data': {
                'books': serializer.data,
                'total': total_count,
                'total_pages': total_pages,
                'current_page': page,
                'page_size': page_size,
            },
            'error': None,
        }
        # Mise en cache : invalide rapidement (2 min) pour refléter les achats
        try:
            cache.set(cache_key, payload, 120)
        except Exception:
            pass
        return Response(payload)


# ─── Profil Student ────────────────────────────────────────────────────────────


class StudentProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        affiliation = (
            StudentAffiliation.objects
            .filter(student=user)
            .select_related('institution')
            .order_by('-created_at')
            .first()
        )
        return Response({
            'success': True,
            'data': {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone or '',
                'country': user.country,
                'university_affiliation': user.university_affiliation,
                'avatar': user.avatar.url if (user.avatar and bool(getattr(user.avatar, 'name', None))) else None,
                'affiliation': AffiliationStudentSerializer(affiliation).data if affiliation else None,
            },
            'error': None,
        })

    def put(self, request):
        user = request.user
        user.first_name = request.data.get('first_name', user.first_name)
        user.last_name = request.data.get('last_name', user.last_name)
        user.phone = request.data.get('phone', user.phone)
        user.country = request.data.get('country', user.country)
        user.save(update_fields=['first_name', 'last_name', 'phone', 'country'])

        return Response({
            'success': True,
            'data': {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone or '',
                'country': user.country,
            },
            'error': None,
        })
