"""Vues pour l'Espace Client Lecteur / Étudiant."""
from typing import Any
from datetime import timedelta, date

from django.db.models import Sum, Count, Q
from django.utils import timezone

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

        # Bibliothèque : livres avec progression
        total_books = ReadingProgress.objects.filter(user=user).count()

        # Livre en cours de lecture (progression max non terminé)
        current_reading = (
            ReadingProgress.objects
            .filter(user=user, is_completed=False)
            .select_related('ouvrage', 'ouvrage__discipline', 'ouvrage__publisher')
            .prefetch_related('ouvrage__authors')
            .order_by('-last_read_at')
            .first()
        )
        current_reading_data = None
        if current_reading:
            current_reading_data = {
                'ouvrage': OuvrageBasicSerializer(current_reading.ouvrage).data,
                'progress_percent': current_reading.progress_percent,
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

        data = []
        for progress in qs:
            ouvrage_data = OuvrageBasicSerializer(progress.ouvrage).data
            data.append({
                **ouvrage_data,
                'progress_percent': progress.progress_percent,
                'current_page': progress.current_page,
                'last_read_chapter': progress.last_read_chapter,
                'last_read_at': progress.last_read_at,
                'is_completed': progress.is_completed,
                'is_favorite': progress.is_favorite,
                'access_type': 'purchased',
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

        progress, _ = ReadingProgress.objects.update_or_create(
            user=user,
            ouvrage=ouvrage,
            defaults={
                'progress_percent': data['progress_percent'],
                'current_page': data.get('current_page', 1),
                'total_pages': data.get('total_pages', ouvrage.page_count),
                'last_read_chapter': data.get('last_read_chapter', ''),
                'is_completed': data['progress_percent'] >= 100,
            }
        )

        # Enregistre la session de lecture si des secondes ont été passées
        duration = data.get('duration_seconds', 0)
        if duration > 0:
            ReadingSession.objects.create(
                user=user,
                ouvrage=ouvrage,
                duration_seconds=duration,
                pages_read=data.get('pages_read', 0),
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
        discipline_data = (
            ReadingSession.objects
            .filter(user=user)
            .values('ouvrage__discipline__name')
            .annotate(total_sec=Sum('duration_seconds'))
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

        # Progression globale
        total_books = ReadingProgress.objects.filter(user=user).count()
        avg_progress = (
            ReadingProgress.objects
            .filter(user=user)
            .aggregate(avg=Sum('progress_percent'))['avg'] or 0
        ) / total_books if total_books > 0 else 0

        # Livres terminés
        books_completed = ReadingProgress.objects.filter(user=user, is_completed=True).count()

        # Total pages lues
        total_pages = ReadingSession.objects.filter(user=user).aggregate(
            total=Sum('pages_read')
        )['total'] or 0

        # Streak
        streak_days = _compute_reading_streak(user)

        # Timeline des 10 dernières sessions
        recent_sessions = (
            ReadingSession.objects
            .filter(user=user)
            .select_related('ouvrage', 'ouvrage__discipline')
            .order_by('-session_date', '-created_at')[:10]
        )
        timeline = [
            {
                'id': str(s.id),
                'ouvrage_title': s.ouvrage.title,
                'ouvrage_discipline': s.ouvrage.discipline.name if s.ouvrage.discipline else '',
                'duration_minutes': round(s.duration_seconds / 60),
                'pages_read': s.pages_read,
                'session_date': str(s.session_date),
            }
            for s in recent_sessions
        ]

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
                'recent_sessions_timeline': timeline,
            },
            'error': None,
        })


# ─── Mes Achats & Commandes ────────────────────────────────────────────────────

class StudentOrdersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = (
            Order.objects
            .filter(user=request.user)
            .prefetch_related('lignes', 'lignes__ouvrage')
            .select_related('livraison', 'currency')
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
        qs = (
            Ouvrage.objects
            .filter(status='published')
            .select_related('discipline', 'publisher', 'institution')
            .prefetch_related('authors')
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
        if discipline_id:
            qs = qs.filter(discipline_id=discipline_id)

        format_type = request.query_params.get('format')
        if format_type and format_type != 'all':
            qs = qs.filter(format_type=format_type)

        # Disciplines disponibles pour les filtres
        disciplines = Discipline.objects.filter(
            ouvrages__status='published'
        ).distinct().values('id', 'name')

        serializer = OuvrageBasicSerializer(qs[:60], many=True, context={'request': request})
        return Response({
            'success': True,
            'data': {
                'books': serializer.data,
                'disciplines': list(disciplines),
                'total': qs.count(),
            },
            'error': None,
        })


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
