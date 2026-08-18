from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from .models import LibraryBook, ReadingProgress, LibraryAnnotation, PhysicalBookResource, PhysicalBookQRToken, BookAccess
from .serializers import (
    LibraryBookSerializer, 
    LibraryBookAdminSerializer, 
    ReadingProgressSerializer,
    LibraryAnnotationSerializer,
    PhysicalBookPublicSerializer,
    PhysicalBookDetailSerializer,
    PhysicalBookAdminSerializer,
    PhysicalBookChapterAdminSerializer,
    PhysicalBookResourceAdminSerializer,
    QRBatchSerializer,
)
from media.pdf_service import generate_and_save_thumbnail

from django.db.models import Q
from notifications.services import notify_user
from notifications.models import Notification
from core.models import User
from roles.selectors import is_super_client
from rest_framework.pagination import PageNumberPagination

class LibraryTenResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class AdminLibraryBookViewSet(viewsets.ModelViewSet):
    """
    CRUD complet pour l'administration.
    """
    queryset = LibraryBook.objects.all()
    serializer_class = LibraryBookAdminSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = LibraryTenResultsSetPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search)
            )

        subject_id = self.request.query_params.get('subject')
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        
        grade_level_id = self.request.query_params.get('grade_level')
        if grade_level_id:
            queryset = queryset.filter(grade_levels__id=grade_level_id)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        is_active_filter = self.request.query_params.get('is_active')
        if is_active_filter is not None:
            queryset = queryset.filter(is_active=is_active_filter.lower() == 'true')
            
        return queryset.distinct()

    def perform_create(self, serializer):
        book = serializer.save()
        if book.file:
            thumbnail_url = generate_and_save_thumbnail(book.file, str(book.id))
            if thumbnail_url:
                book.thumbnail_url = thumbnail_url
                book.save(update_fields=['thumbnail_url'])

    def perform_update(self, serializer):
        book = serializer.save()
        # Si le fichier a changé, on régénère la miniature
        if 'file' in serializer.validated_data:
            thumbnail_url = generate_and_save_thumbnail(book.file, str(book.id))
            if thumbnail_url:
                book.thumbnail_url = thumbnail_url
                book.save(update_fields=['thumbnail_url'])

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        book = self.get_object()
        book.status = 'PUBLISHED'
        book.is_active = True
        book.rejection_reason = None
        book.save()
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        reason = request.data.get('reason', '')
        book = self.get_object()
        book.status = 'REJECTED'
        book.is_active = False
        book.rejection_reason = reason
        book.save()
        return Response({'status': 'rejected', 'reason': reason})

    @action(detail=False, methods=['post'], url_path='upload-summary',
            permission_classes=[permissions.IsAdminUser])
    def upload_summary(self, request):
        """
        Upload rapide d'une fiche de synthèse PDF.
        Crée un LibraryBook de catégorie 'summary' prêt à être lié à une leçon.
        """
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'Aucun fichier fourni.'}, status=status.HTTP_400_BAD_REQUEST)
        if not file.name.lower().endswith(('.pdf', '.doc', '.docx')):
            return Response({'detail': 'Seuls les fichiers PDF et Word sont acceptés.'}, status=status.HTTP_400_BAD_REQUEST)

        import os
        filename_without_ext = os.path.splitext(file.name)[0]
        title = request.data.get('title', filename_without_ext.replace('_', ' '))

        book = LibraryBook.objects.create(
            title=title,
            description='Fiche de synthèse — parcours guidé',
            file=file,
            category=LibraryBook.Category.SUMMARY,
            status='PUBLISHED',
            is_active=True,
        )

        # Générer une miniature si possible
        try:
            thumbnail_url = generate_and_save_thumbnail(book.file, str(book.id))
            if thumbnail_url:
                book.thumbnail_url = thumbnail_url
                book.save(update_fields=['thumbnail_url'])
        except Exception:
            pass

        return Response({
            'id': str(book.id),
            'title': book.title,
            'thumbnail_url': book.thumbnail_url,
        }, status=status.HTTP_201_CREATED)


class AuthorLibraryBookViewSet(viewsets.ModelViewSet):
    """
    Espace "Studio" pour les auteurs et enseignants.
    Permet d'uploader et de gérer ses propres livres.
    """
    serializer_class = LibraryBookAdminSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = LibraryTenResultsSetPagination

    def get_queryset(self):
        # Un auteur ou enseignant voit ses propres livres
        # ET les livres d'autres auteurs ciblés pour les enseignants
        from authors.models import AuthorProfile
        from django.db.models import Q
        author_profile, _ = AuthorProfile.objects.get_or_create(user=self.request.user)
        
        return LibraryBook.objects.filter(
            Q(author_profile=author_profile) | 
            Q(status='PUBLISHED', is_active=True, target_audiences__contains='teachers')
        ).select_related(
            'author_profile__user', 'subject'
        ).prefetch_related('grade_levels').distinct()

    def perform_create(self, serializer):
        from authors.models import AuthorProfile
        author_profile, _ = AuthorProfile.objects.get_or_create(user=self.request.user)
        
        # Déterminer le statut initial selon le rôle
        # Auteur = Publication directe (PUBLISHED)
        # Enseignant = Validation requise (REVIEW)
        user_role = getattr(self.request.user, 'role', 'student')
        
        if self.request.user.is_staff or user_role == 'author':
            status = 'PUBLISHED'
        else:
            status = 'REVIEW'
            
        book = serializer.save(author_profile=author_profile, status=status)
        if book.file:
            thumbnail_url = generate_and_save_thumbnail(book.file, str(book.id))
            if thumbnail_url:
                book.thumbnail_url = thumbnail_url
                book.save(update_fields=['thumbnail_url'])

        # Notifier les admins
        from core.services.notification import NotificationService
        notification_service = NotificationService()
        admin_email = "lahaeditions1@gmail.com"

        admins = User.objects.filter(role__in=['admin', 'super_admin'])
        for admin in admins:
            if status == 'PUBLISHED':
                notify_user(
                    user=admin,
                    notification_type=Notification.NotificationType.SYSTEM,
                    title="Nouveau livre publié",
                    message=f"L'auteur/enseignant {self.request.user.get_full_name() or self.request.user.username} a publié le livre « {book.title} ».",
                    action_url=f"/dashboard/admin/library",
                    resource_id=str(book.id)
                )
            else:
                notify_user(
                    user=admin,
                    notification_type=Notification.NotificationType.SYSTEM,
                    title="Nouveau livre à valider",
                    message=f"L'enseignant {self.request.user.get_full_name() or self.request.user.username} a soumis le livre « {book.title} » pour validation.",
                    action_url=f"/dashboard/admin/library",
                    resource_id=str(book.id)
                )
                
        # Envoi d'email uniquement si en attente de validation
        if status != 'PUBLISHED':
            email_subject = "LAHA - Nouveau livre à valider"
            email_body = f"""
            <div style="font-family: sans-serif; padding: 20px;">
                <h3>Nouveau livre soumis</h3>
                <p>L'enseignant <strong>{self.request.user.get_full_name() or self.request.user.username}</strong> a soumis le livre « <strong>{book.title}</strong> » pour validation.</p>
                <p>Veuillez vous connecter à l'espace administrateur pour l'examiner et le valider.</p>
            </div>
            """
            notification_service.send_email(admin_email, email_subject, email_body)

    def perform_update(self, serializer):
        book = serializer.save()
        if 'file' in serializer.validated_data:
            thumbnail_url = generate_and_save_thumbnail(book.file, str(book.id))
            if thumbnail_url:
                book.thumbnail_url = thumbnail_url
                book.save(update_fields=['thumbnail_url'])

class LibraryBookViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Liste les livres actifs. Supporte le filtrage par matière et la recherche.
    Accessible aux étudiants, enseignants et auteurs authentifiés.
    
    Bypass de session : si ?session_id=<id> est fourni et que l'utilisateur
    est inscrit à cette session, l'accès au livre est autorisé sans restriction
    de pays ou de niveau (pour les ressources pédagogiques liées à la séance).
    """
    queryset = LibraryBook.objects.filter(status='PUBLISHED', is_active=True).order_by('-created_at')
    serializer_class = LibraryBookSerializer
    pagination_class = LibraryTenResultsSetPagination

    def get_permissions(self):
        if self.action == 'list' and self.request.query_params.get('public_catalog') == 'true':
            from rest_framework import permissions
            return [permissions.AllowAny()]
        from rest_framework import permissions
        return [permissions.IsAuthenticated()]

    def _has_session_bypass(self, request, book_id=None) -> bool:
        """
        Vérifie si l'utilisateur a un accès bypass via une session inscrite.
        Retourne True si le livre est une ressource d'une session à laquelle
        l'utilisateur est inscrit (booking confirmé).
        """
        session_id = request.query_params.get('session_id')
        if not session_id:
            return False
        try:
            from bookings.models import Session, Booking, SessionResource
            session = Session.objects.get(id=session_id)
            # Vérifier que l'élève est inscrit
            is_enrolled = (
                session.teacher.user == request.user or
                Booking.objects.filter(
                    session=session,
                    student__user=request.user,
                    status=Booking.Status.CONFIRMED
                ).exists()
            )
            if not is_enrolled:
                return False
            # Vérifier que le livre est bien une ressource de cette session
            if book_id:
                return SessionResource.objects.filter(
                    session=session,
                    book_id=str(book_id)
                ).exists()
            return True
        except Exception:
            return False

    def retrieve(self, request, *args, **kwargs):
        """
        Accès à un livre spécifique. Bypass si l'élève est dans une session
        qui inclut ce livre comme ressource (via ?session_id=<uuid>).
        """
        book_id = kwargs.get('pk')
        if self._has_session_bypass(request, book_id):
            # Bypass complet : accès sans restriction
            book = get_object_or_404(LibraryBook, pk=book_id, status='PUBLISHED', is_active=True)
            serializer = self.get_serializer(book)
            return Response(serializer.data)
        return super().retrieve(request, *args, **kwargs)

    def get_queryset(self):
        params = self.request.query_params

        # Accès public (vitrine marketing /nos-ouvrages)
        if params.get('public_catalog') == 'true':
            # On pourra ajouter show_on_nos_ouvrages=True ici par la suite
            return LibraryBook.objects.filter(status='PUBLISHED', is_active=True).order_by('-created_at')

        user = self.request.user

        if user.is_staff:
            return LibraryBook.objects.all()

        # Bypass via session_id : on ignore les filtres pays/niveau
        if self._has_session_bypass(self.request):
            return LibraryBook.objects.filter(status='PUBLISHED', is_active=True)

        def apply_subject_filter(qs, sub_param):
            if not sub_param or sub_param == 'all':
                return qs
            try:
                # Si c'est un UUID ou un ID valide
                return qs.filter(
                    Q(subject_id=sub_param) |
                    Q(subject__label__iexact=sub_param) |
                    Q(subject__name__iexact=sub_param)
                )
            except Exception:
                return qs.filter(
                    Q(subject__label__icontains=sub_param) |
                    Q(subject__name__icontains=sub_param)
                )

        # Bypass Super Client : Accès universel sans filtrage pays ni niveau
        if is_super_client(user):
            queryset = LibraryBook.objects.filter(status='PUBLISHED', is_active=True)
            search = params.get('search')
            if search:
                queryset = queryset.filter(
                    Q(title__icontains=search) | Q(description__icontains=search)
                )
            subject_id = params.get('subject')
            if subject_id:
                queryset = apply_subject_filter(queryset, subject_id)
            grade_level_id = params.get('grade_level') or params.get('level')
            if grade_level_id and grade_level_id != 'all':
                queryset = queryset.filter(grade_levels__id=grade_level_id)
            country = params.get('country')
            if country and country != 'all':
                queryset = queryset.filter(
                    Q(is_international=True) | Q(target_countries__contains=[country])
                )
            return queryset.select_related(
                'author_profile__user', 'subject'
            ).prefetch_related('grade_levels').distinct()
        user_role = getattr(user, 'role', 'student')
        if user_role in ('teacher', 'author'):
            queryset = LibraryBook.objects.filter(status='PUBLISHED', is_active=True, target_audiences__contains='teachers')
            search = params.get('search')
            if search:
                queryset = queryset.filter(
                    Q(title__icontains=search) | Q(description__icontains=search)
                )
            subject_id = params.get('subject')
            if subject_id:
                queryset = apply_subject_filter(queryset, subject_id)
            return queryset.distinct()

        # Si c'est une consultation directe par ID (retrieve), on est moins restrictif
        # pour éviter les 404 sur les ressources liées aux cours
        if self.action == 'retrieve':
            return LibraryBook.objects.filter(status='PUBLISHED', is_active=True)

        # Filtrage par auteur (prioritaire pour le Social Learning)
        author_id = params.get('author')
        if author_id:
            queryset = LibraryBook.objects.filter(author_profile_id=author_id, status='PUBLISHED', is_active=True, target_audiences__contains='students')
        else:
            queryset = LibraryBook.objects.filter(status='PUBLISHED', is_active=True, target_audiences__contains='students')

        # Filtrage par pays (Visibilité ciblée — élèves uniquement)
        user_country = getattr(user, 'country', None)
        if user_country:
            queryset = queryset.filter(
                Q(is_international=True) | Q(target_countries__contains=[user_country])
            )
        else:
            queryset = queryset.filter(is_international=True)

        # Filtre par matière (subject)
        subject_id = params.get('subject')
        if subject_id:
            queryset = apply_subject_filter(queryset, subject_id)

        # Recherche textuelle
        search = params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search)
            )

        # Filtrage par niveau — élèves uniquement
        if hasattr(user, 'student_profile'):
            profile = user.student_profile
            if profile and profile.grade_level:
                queryset = queryset.filter(
                    Q(grade_levels=profile.grade_level) | Q(grade_levels__isnull=True)
                ).distinct()

        from django.db.models import Prefetch
        from .models import ReadingProgress, BookQuizAttempt
        
        queryset = queryset.select_related(
            'author_profile__user', 'subject'
        ).prefetch_related(
            'grade_levels',
            Prefetch(
                'progress_records',
                queryset=ReadingProgress.objects.filter(user=user),
                to_attr='user_reading_progress'
            ),
            Prefetch(
                'quiz__attempts',
                queryset=BookQuizAttempt.objects.filter(user=user),
                to_attr='user_quiz_attempts'
            ),
        )

        return queryset.distinct()

    @action(detail=False, methods=['get'], url_path='my-books')
    def my_books(self, request):
        """
        GET /api/v1/library/books/my-books/
        Retourne uniquement les livres de l'auteur connecté.
        Accessible aux utilisateurs avec un AuthorProfile.
        """
        from authors.models import AuthorProfile
        try:
            author_profile = AuthorProfile.objects.get(user=request.user)
        except AuthorProfile.DoesNotExist:
            return Response({'error': 'Profil auteur introuvable.'}, status=status.HTTP_403_FORBIDDEN)

        queryset = LibraryBook.objects.filter(author_profile=author_profile).order_by('-created_at')

        subject_id = request.query_params.get('subject')
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )

        serializer = self.get_serializer(queryset, many=True)
        return Response({'results': serializer.data, 'count': queryset.count()})

class ReadingProgressViewSet(viewsets.GenericViewSet):
    """
    Gestion de la progression de lecture (interne).
    """
    queryset = ReadingProgress.objects.all()
    serializer_class = ReadingProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='sync-page')
    def sync_page(self, request, pk=None):
        book = get_object_or_404(LibraryBook, pk=pk)
        last_page = request.data.get('last_page')
        total_pages = request.data.get('total_pages')

        if last_page is None:
            return Response({"error": "last_page est requis"}, status=status.HTTP_400_BAD_REQUEST)

        progress, created = ReadingProgress.objects.update_or_create(
            user=request.user,
            book=book,
            defaults={
                'last_page': last_page,
                'total_pages': total_pages or 0
            }
        )

        return Response(ReadingProgressSerializer(progress).data)

class LibraryAnnotationViewSet(viewsets.ModelViewSet):
    """
    Gestion des annotations (surlignage et notes).
    L'utilisateur ne peut voir et gérer que ses propres annotations.
    """
    serializer_class = LibraryAnnotationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LibraryAnnotation.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

from rest_framework.decorators import api_view, permission_classes, authentication_classes
from django.utils import timezone
from datetime import timedelta
import uuid
from core.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from .models import PhysicalBookQRToken, BookAccess
from content.models import Course 
import logging
logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@authentication_classes([]) # DESACTIVE TOTALEMENT L'AUTHENTIFICATION POUR EVITER TOUT 401
def activate_book_token(request):
    """
    Endpoint Premium pour scanner un QR Code d'un livre physique.
    Mode Ultra-Permissif : Aucun compte requis manuellement, authentification automatique en Guest (JWT).
    """
    token_string = request.data.get('token')
    device_fp = request.data.get('device_fingerprint')
    
    logger.info(f"[QR Activation] Début du scan. Token brut: '{token_string}', Device Fingerprint: '{device_fp}'")
    
    if not token_string:
        logger.warning("[QR Activation] Échec: Token manquant dans la requête.")
        return Response({'error': 'Token manquant.'}, status=status.HTTP_400_BAD_REQUEST)
    
    token_clean = token_string.strip()
    try:
        # Recherche insensible à la casse (tokens stockés en minuscules ou MAJUSCULES selon le générateur)
        try:
            qr_token = PhysicalBookQRToken.objects.get(token__iexact=token_clean)
            logger.info(f"[QR Activation] Code exact trouvé pour le token: '{token_clean}'")
        except PhysicalBookQRToken.DoesNotExist:
            logger.info(f"[QR Activation] Code exact introuvable pour '{token_clean}', recherche par préfixe insensible à la casse...")
            tokens = PhysicalBookQRToken.objects.filter(token__istartswith=token_clean)
            if tokens.count() == 1:
                qr_token = tokens.first()
                logger.info(f"[QR Activation] Code résolu par préfixe. Token complet: '{qr_token.token}'")
            else:
                logger.warning(f"[QR Activation] Échec: Code invalide ou ambigu pour '{token_clean}'. Trouvé: {tokens.count()} correspondances.")
                return Response({'error': 'Code invalide.'}, status=status.HTTP_404_NOT_FOUND)

        # On incrémente le compteur de scans publics
        qr_token.access_count += 1
        qr_token.is_activated = True

        # 1. Résolution de l'identifiant unique Guest (UUID déterministe ou aléatoire)
        import hashlib
        if device_fp:
            hasher = hashlib.md5(device_fp.encode('utf-8'))
            guest_uuid = uuid.UUID(hasher.hexdigest())
            logger.info(f"[QR Activation] UUID invité généré déterministement à partir du fingerprint: '{guest_uuid}'")
        else:
            guest_uuid = uuid.uuid4()
            logger.info(f"[QR Activation] Aucun fingerprint fourni. UUID invité aléatoire généré: '{guest_uuid}'")

        # 2. Création/Récupération de l'utilisateur Guest temporaire
        username = f"guest_{guest_uuid.hex[:15]}"
        email = f"guest_{guest_uuid.hex}@lahacademia.guest"

        user, created = User.objects.get_or_create(
            guest_id=guest_uuid,
            defaults={
                'username': username,
                'email': email,
                'is_guest': True,
                'role': 'student',
            }
        )
        if created:
            logger.info(f"[QR Activation] Nouvel utilisateur invité créé. Username: '{username}', Email: '{email}'")
        else:
            logger.info(f"[QR Activation] Utilisateur invité existant récupéré. ID: {user.id}, Username: '{username}'")

        # 3. Création automatique de l'accès au livre pour ce guest (valide 365 jours)
        book_access, access_created = BookAccess.objects.update_or_create(
            user=user,
            book=qr_token.book,
            defaults={
                'expires_at': timezone.now() + timedelta(days=365)
            }
        )
        logger.info(f"[QR Activation] Accès au livre '{qr_token.book.title}' (ID: {qr_token.book.id}) mis à jour/créé pour l'utilisateur {user.username}. Expire le: {book_access.expires_at}")

        # Associer le token QR à l'invité
        qr_token.activated_by = user
        qr_token.activated_at = timezone.now()
        qr_token.save()
        logger.info(f"[QR Activation] Jeton QR '{qr_token.token}' marqué comme activé par {user.username}")

        # 4. Sérialisation du livre avec ses chapitres
        book_serializer = PhysicalBookDetailSerializer(qr_token.book)

        # 5. Génération du JWT
        refresh = RefreshToken.for_user(user)
        logger.info(f"[QR Activation] Jeton JWT (Guest) généré avec succès pour {user.username}. Activation réussie !")

        return Response({
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'expires_at': (timezone.now() + refresh.access_token.lifetime).isoformat(),
            'book': book_serializer.data,
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'is_guest': True,
            }
        })
    except Exception as e:
        logger.error(f"[QR Activation] Erreur inattendue lors de l'activation du livre. Token: '{token_string}'", exc_info=True)
        return Response({'error': "Une erreur interne est survenue lors de l'activation."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_book_by_token(request, token):
    """
    Récupère les détails d'un livre (chapitres + ressources) via son token
    une fois l'utilisateur authentifié (guest ou normal).
    """
    token_clean = token.strip()
    try:
        # Recherche insensible à la casse (les tokens sont stockés en MAJUSCULES: LAHA-XXXX-XXXX)
        qr_token = PhysicalBookQRToken.objects.select_related('book').get(token__iexact=token_clean)
    except PhysicalBookQRToken.DoesNotExist:
        tokens = PhysicalBookQRToken.objects.select_related('book').filter(token__istartswith=token_clean)
        if tokens.count() == 1:
            qr_token = tokens.first()
        else:
            return Response({'error': 'Livre introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    
    # Audit & Accès Super Client (Consignation et création automatique de l'accès d'audit)
    if is_super_client(request.user):
        import logging
        from datetime import timedelta
        logger = logging.getLogger(__name__)
        logger.info("Super Client Audit: Utilisateur %s consulte le livre %s", request.user.email, qr_token.book.title)
        BookAccess.objects.get_or_create(
            user=request.user,
            book=qr_token.book,
            defaults={'expires_at': timezone.now() + timedelta(days=365)}
        )

    # Vérifier que l'utilisateur a bien accès à ce livre
    if not BookAccess.objects.filter(user=request.user, book=qr_token.book, expires_at__gt=timezone.now()).exists():
        return Response({'error': 'Accès expiré ou non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        
    serializer = PhysicalBookDetailSerializer(qr_token.book)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def download_resource_pdf(request, resource_id):
    """Génère et télécharge le fichier PDF estampillé LahaAcademia pour une ressource de type corrigé (Accès sécurisé)."""
    resource = get_object_or_404(PhysicalBookResource.objects.select_related('chapter__book'), pk=resource_id)
    book = resource.chapter.book if resource.chapter else None

    is_authorized = False

    # 1. Vérification par jeton QR si transmis en paramètre
    qr_token_str = request.query_params.get('token')
    if qr_token_str and book:
        is_authorized = PhysicalBookQRToken.objects.filter(
            book=book, token__iexact=qr_token_str.strip()
        ).exists()

    # 2. Vérification par utilisateur connecté (Staff/Admin ou Élève avec accès débloqué)
    if not is_authorized and request.user and request.user.is_authenticated:
        if request.user.is_staff or getattr(request.user, 'role', '') in ['admin', 'super_admin']:
            is_authorized = True
        elif book:
            is_authorized = BookAccess.objects.filter(
                user=request.user, book=book, expires_at__gt=timezone.now()
            ).exists()

    if not is_authorized:
        return Response(
            {'error': 'Accès non autorisé. Vous devez débloquer ce manuel via son QR code.'}, 
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        from .pdf_generator import generate_correction_pdf
        pdf_bytes = generate_correction_pdf(resource)
        
        filename = f"Corrige_{resource.title}".replace(' ', '_').replace('/', '_') + ".pdf"
        download_mode = request.query_params.get('download', '1')
        disposition = 'inline' if download_mode == 'inline' else 'attachment'
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'{disposition}; filename="{filename}"'
        return response
    except Exception as e:
        logger.error(f"[PDF Download Error] Exception lors de la génération du PDF pour la ressource {resource_id}: {str(e)}", exc_info=True)
        return Response({'error': f'Erreur lors de la génération du PDF: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- Quiz Views ---

from .models import BookQuiz, BookQuestion, BookChoice, BookQuizAttempt
from .serializers import (
    BookQuizSerializer, BookQuizAdminSerializer, 
    BookQuestionAdminSerializer, BookChoiceAdminSerializer,
    BookQuizAttemptSerializer
)

class BookQuizViewSet(viewsets.ModelViewSet):
    """
    Gestion des quiz par les admins et les auteurs.
    L'élève peut uniquement lire (retrieve) et soumettre (submit).
    """
    queryset = BookQuiz.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    filterset_fields = ['book']

    def get_queryset(self):
        queryset = BookQuiz.objects.all()
        
        # Filtrage par livre si spécifié
        book_id = self.request.query_params.get('book')
        if book_id:
            queryset = queryset.filter(book_id=book_id)

        # Les élèves ne voient que les quiz des livres publiés
        if not self.request.user.is_staff:
            user_role = getattr(self.request.user, 'role', 'student')
            if user_role != 'author':
                queryset = queryset.filter(book__status='PUBLISHED')
        
        return queryset

    serializer_class = BookQuizSerializer

    def get_serializer_class(self):
        if self.request.user.is_staff:
            return BookQuizAdminSerializer
        
        # Pour la création, on vérifie si l'utilisateur est l'auteur du livre
        if self.action == 'create':
            book_id = self.request.data.get('book')
            if book_id:
                from .models import LibraryBook
                book = LibraryBook.objects.filter(id=book_id).first()
                if book and book.author_profile and book.author_profile.user == self.request.user:
                    return BookQuizAdminSerializer

        # Pour les mises à jour, on vérifie si l'utilisateur est l'auteur du livre lié
        if self.action in ['update', 'partial_update', 'destroy']:
            quiz = self.get_object()
            if quiz.book.author_profile and quiz.book.author_profile.user == self.request.user:
                return BookQuizAdminSerializer
        
        return BookQuizSerializer


    @action(detail=True, methods=['post'], url_path='submit')
    def submit(self, request, pk=None):
        """
        Soumission d'un quiz par un élève.
        Calcul du score et enregistrement de la tentative.
        """
        quiz = self.get_object()
        user_answers = request.data.get('answers', {}) # Format: {question_id: choice_id}
        
        questions = quiz.questions.all()
        total_points = sum(q.points for q in questions)
        obtained_points = 0
        
        detailed_results = []
        
        for question in questions:
            selected_choice_id = user_answers.get(str(question.id))
            correct_choice = question.choices.filter(is_correct=True).first()
            
            is_correct = False
            if selected_choice_id and correct_choice and str(correct_choice.id) == str(selected_choice_id):
                obtained_points += question.points
                is_correct = True
            
            detailed_results.append({
                'question_id': str(question.id),
                'question_text': question.text,
                'selected_choice_id': selected_choice_id,
                'correct_choice_id': str(correct_choice.id) if correct_choice else None,
                'is_correct': is_correct
            })

        # Calcul du score sur 20
        final_score = (obtained_points / total_points * 20) if total_points > 0 else 0
        is_validated = final_score >= quiz.passing_score

        attempt = BookQuizAttempt.objects.create(
            user=request.user,
            quiz=quiz,
            score=round(final_score, 2),
            is_validated=is_validated,
            answers_data={'results': detailed_results}
        )

        return Response({
            'attempt_id': attempt.id,
            'score': attempt.score,
            'is_validated': attempt.is_validated,
            'passing_score': quiz.passing_score,
            'results': detailed_results
        })

class BookQuizAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Consultation des tentatives de quiz (pour le dashboard).
    """
    queryset = BookQuizAttempt.objects.all()
    serializer_class = BookQuizAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['quiz', 'user']

    def get_queryset(self):
        queryset = BookQuizAttempt.objects.all()
        
        # Les utilisateurs ne voient que leurs propres tentatives
        # Sauf les admins
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
            
        return queryset


# =====================================================================
# ADMIN — Gestion complète des Livres Physiques (Freemium)
# =====================================================================
from .models import PhysicalBook, PhysicalBookChapter, PhysicalBookResource, PhysicalBookQRToken, QRBatch
import uuid as uuid_lib


class PhysicalBookAdminViewSet(viewsets.ModelViewSet):
    """
    Interface admin complète pour la gestion des livres physiques.
    Inclut la gestion des chapitres, ressources et lots QR.
    """
    queryset = PhysicalBook.objects.prefetch_related(
        'chapters', 'chapters__resources', 'tokens', 'qr_batches'
    ).select_related('subject', 'grade_level').all()
    serializer_class = PhysicalBookAdminSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            import re, unicodedata
            from django.db.models import Q

            search_str = search.strip()
            normalized_search = ''.join(
                c for c in unicodedata.normalize('NFD', search_str)
                if unicodedata.category(c) != 'Mn'
            ).lower()

            accents = {
                'a': '[a\u00e0\u00e2A\u00c0\u00c2]',
                'e': '[e\u00e9\u00e8\u00ea\u00ebE\u00c9\u00c8\u00ca\u00cb]',
                'i': '[i\u00ee\u00efI\u00ce\u00cf]',
                'o': '[o\u00f4O\u00d4]',
                'u': '[u\u00f9\u00fbU\u00d9\u00db]',
                'c': '[c\u00e7C\u00c7]',
            }
            pattern = ''.join(accents.get(c, re.escape(c)) for c in normalized_search)

            queryset = queryset.filter(
                Q(title__iregex=pattern) |
                Q(subject__label__iregex=pattern) |
                Q(grade_level__label__iregex=pattern) |
                Q(publisher__iregex=pattern) |
                Q(isbn__icontains=search_str)
            )

        subject_id = self.request.query_params.get('subject')
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        grade_id = self.request.query_params.get('grade_level')
        if grade_id:
            queryset = queryset.filter(grade_level_id=grade_id)
        return queryset

    # --- Chapitres ---

    @action(detail=True, methods=['get'], url_path='chapters')
    def list_chapters(self, request, pk=None):
        """GET /api/v1/library/admin/physical-books/{id}/chapters/"""
        book = self.get_object()
        chapters = book.chapters.prefetch_related('resources').order_by('order')
        serializer = PhysicalBookChapterAdminSerializer(chapters, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='chapters/add')
    def add_chapter(self, request, pk=None):
        """POST /api/v1/library/admin/physical-books/{id}/chapters/add/"""
        book = self.get_object()
        serializer = PhysicalBookChapterAdminSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(book=book)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch', 'delete'], url_path='chapters/(?P<chapter_id>[^/.]+)')
    def manage_chapter(self, request, pk=None, chapter_id=None):
        """PATCH/DELETE /api/v1/library/admin/physical-books/{id}/chapters/{chapter_id}/"""
        book = self.get_object()
        chapter = get_object_or_404(PhysicalBookChapter, pk=chapter_id, book=book)

        if request.method == 'DELETE':
            chapter.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        serializer = PhysicalBookChapterAdminSerializer(
            chapter, data=request.data, partial=True, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # --- Ressources ---

    @action(detail=True, methods=['post'], url_path='chapters/(?P<chapter_id>[^/.]+)/resources/add')
    def add_resource(self, request, pk=None, chapter_id=None):
        """POST ajouter une ressource à un chapitre."""
        book = self.get_object()
        chapter = get_object_or_404(PhysicalBookChapter, pk=chapter_id, book=book)
        serializer = PhysicalBookResourceAdminSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(chapter=chapter)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(
        detail=True, methods=['patch', 'delete'],
        url_path='chapters/(?P<chapter_id>[^/.]+)/resources/(?P<resource_id>[^/.]+)'
    )
    def manage_resource(self, request, pk=None, chapter_id=None, resource_id=None):
        """PATCH/DELETE une ressource."""
        book = self.get_object()
        chapter = get_object_or_404(PhysicalBookChapter, pk=chapter_id, book=book)
        resource = get_object_or_404(PhysicalBookResource, pk=resource_id, chapter=chapter)

        if request.method == 'DELETE':
            resource.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        serializer = PhysicalBookResourceAdminSerializer(
            resource, data=request.data, partial=True, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # --- Lots QR ---

    @action(detail=True, methods=['get'], url_path='qr-batches')
    def list_qr_batches(self, request, pk=None):
        """GET la liste des lots QR d'un livre."""
        book = self.get_object()
        batches = book.qr_batches.prefetch_related('tokens').order_by('-created_at')
        serializer = QRBatchSerializer(batches, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='qr-batches/generate')
    def generate_qr_batch(self, request, pk=None):
        """
        POST Générer un nouveau lot de tokens QR pour un livre.
        Body: { quantity: int, notes: str }
        """
        book = self.get_object()
        quantity = request.data.get('quantity', 0)
        notes = request.data.get('notes', '')

        try:
            quantity = int(quantity)
            if quantity < 1 or quantity > 10000:
                raise ValueError()
        except (ValueError, TypeError):
            return Response(
                {'error': 'La quantité doit être un entier entre 1 et 10 000.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        batch = QRBatch.objects.create(book=book, quantity=quantity, notes=notes)

        tokens_to_create = [
            PhysicalBookQRToken(
                token=uuid_lib.uuid4().hex,
                book=book,
                batch=batch,
            )
            for _ in range(quantity)
        ]
        PhysicalBookQRToken.objects.bulk_create(tokens_to_create)

        serializer = QRBatchSerializer(batch)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='export-batch/(?P<batch_id>[^/.]+)')
    def export_batch(self, request, pk=None, batch_id=None):
        """Exporter un lot de tokens QR au format CSV (Sécurisé OOM)."""
        import csv
        from django.http import StreamingHttpResponse
        
        batch = get_object_or_404(QRBatch, id=batch_id, book_id=pk)
        
        class Echo:
            def write(self, value):
                return value

        def stream():
            writer = csv.writer(Echo())
            yield writer.writerow(['Token', 'URL d\'activation', 'Livre', 'Date de création'])
            
            base_url = request.build_absolute_uri('/')[:-1] 
            # Utilisation de .iterator() pour la gestion efficace de gros volumes
            tokens_qs = batch.tokens.select_related('batch__book').iterator(chunk_size=2000)
            
            for t in tokens_qs:
                activation_url = f"{base_url}/livre/{t.token}/"
                yield writer.writerow([t.token, activation_url, batch.book.title, batch.created_at.strftime('%Y-%m-%d %H:%M:%S')])
                
        response = StreamingHttpResponse(stream(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="batch_{batch_id}.csv"'
        response['X-Accel-Buffering'] = 'no'
        return response

    @action(detail=True, methods=['get'], url_path='qr-stats')
    def qr_stats(self, request, pk=None):
        """GET Les statistiques d'activation des tokens QR d'un livre."""
        book = self.get_object()
        total = book.tokens.count()
        activated = book.tokens.filter(is_activated=True).count()
        recent_activations = book.tokens.filter(
            is_activated=True
        ).select_related('activated_by').order_by('-activated_at')[:10].values(
            'token', 'activated_at', 'device_fingerprint', 'access_count'
        )
        return Response({
            'total_tokens': total,
            'activated': activated,
            'not_activated': total - activated,
            'activation_rate': round((activated / total * 100), 1) if total > 0 else 0,
            'recent_activations': list(recent_activations),
        })

    # --- Recherche de Leçons et QCM (pour le ResourcePicker) ---

    @action(detail=False, methods=['get'], url_path='search-lessons', permission_classes=[permissions.IsAuthenticated])
    def search_lessons(self, request):
        """
        GET /api/v1/library/admin/physical-books/search-lessons/?q=algèbre
        Recherche de leçons existantes pour les lier aux ressources.
        """
        from content.models import Lesson
        search = request.query_params.get('q', '')
        
        queryset = Lesson.objects.filter(status='published') if hasattr(Lesson, 'status') else Lesson.objects.all()
        if search:
            queryset = queryset.filter(title__icontains=search)
            
        lessons = queryset.order_by('title')[:30]
        return Response([{
            'id': str(l.id),
            'title': l.title,
            'subject': str(l.subject_id) if hasattr(l, 'subject_id') else None,
        } for l in lessons])

    @action(detail=False, methods=['get'], url_path='search-qcm', permission_classes=[permissions.IsAuthenticated])
    def search_qcm(self, request):
        """
        GET /api/v1/library/admin/physical-books/search-qcm/?q=chapitre
        Recherche de QCM existants pour les lier aux ressources.
        """
        from assessments.models import QCM
        search = request.query_params.get('q', '')
        subject_id = request.query_params.get('subject', '')
        queryset = QCM.objects.all()
        if search:
            queryset = queryset.filter(title__icontains=search)
            
        qcms = queryset.order_by('title')[:30]
        return Response([{
            'id': str(q.id),
            'title': q.title,
            'subject': str(q.subject_id) if hasattr(q, 'subject_id') else None,
        } for q in qcms])

    @action(detail=False, methods=['get'], url_path='search-exercises', permission_classes=[permissions.IsAuthenticated])
    def search_exercises(self, request):
        """
        GET /api/v1/library/admin/physical-books/search-exercises/?q=chapitre
        Recherche d'exercices interactifs existants pour les lier aux ressources.
        """
        from assessments.models import Exercise
        search = request.query_params.get('q', '')
        subject_id = request.query_params.get('subject', '')
        # Only published exercises
        queryset = Exercise.objects.filter(is_published=True)
        
        if search:
            queryset = queryset.filter(title__icontains=search)
            
        exercises = queryset.order_by('-created_at')[:30]
        return Response([{
            'id': str(ex.id),
            'title': ex.title,
            'subject': str(ex.subject_id) if hasattr(ex, 'subject_id') else None,
        } for ex in exercises])

from .models import ShowcaseBook
from .serializers import ShowcaseBookSerializer
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import permissions

class ShowcaseBookViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des livres vitrines."""
    queryset = ShowcaseBook.objects.all()
    serializer_class = ShowcaseBookSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    pagination_class = None

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        queryset = super().get_queryset()
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        return queryset
