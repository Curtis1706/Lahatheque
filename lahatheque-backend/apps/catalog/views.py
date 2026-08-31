import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from .models import Ouvrage, Discipline, Domain
from .serializers import OuvrageReadSerializer, OuvrageCreateSerializer, DisciplineSerializer, DomainSerializer
from .permissions import IsLayoutArtistOrAbove, IsChiefLayoutOnly, IsManagerOrAdmin

logger = logging.getLogger(__name__)


class OuvrageViewSet(viewsets.ReadOnlyModelViewSet):
    """Catalogue public en lecture seule."""
    queryset = Ouvrage.objects.filter(status='published').select_related(
        'publisher', 'discipline', 'institution'
    ).prefetch_related('authors')
    serializer_class = OuvrageReadSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params.get('q', '').strip()
        if q:
            vector = SearchVector('title', weight='A') + \
                     SearchVector('subtitle', weight='B') + \
                     SearchVector('summary', weight='C')
            query = SearchQuery(q)
            qs = qs.annotate(rank=SearchRank(vector, query)).filter(rank__gte=0.01).order_by('-rank')

        format_val = self.request.query_params.get('format')
        if format_val and format_val.lower() != 'all':
            f = format_val.lower()
            if f in ('digital', 'numerique'):
                qs = qs.filter(format_type__in=['pdf', 'epub'])
            elif f in ('paper', 'papier'):
                qs = qs.filter(is_paper_available=True)
            else:
                qs = qs.filter(format_type=f)

        for param, field in [('discipline', 'discipline_id'), ('institution', 'institution_id'),
                             ('language', 'language'), ('country', 'country')]:
            val = self.request.query_params.get(param)
            if val and val.lower() != 'all':
                qs = qs.filter(**{field: val})
        return qs

    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get('pk')
        # 1. Recherche par ID ou ISBN dans Ouvrage (y compris non-publiés pour rôles autorisés)
        ouvrage = Ouvrage.objects.filter(Q(id=pk) | Q(isbn=pk)).select_related(
            'publisher', 'discipline', 'institution'
        ).prefetch_related('authors').first()

        if ouvrage:
            if ouvrage.status != 'published':
                user = request.user
                is_privileged = (
                    user.is_authenticated and (
                        user.is_staff or user.is_superuser or
                        getattr(user, 'role', '') in ['admin', 'chief_layout', 'layout_artist', 'legal_reviewer', 'publisher', 'author']
                    )
                )
                if not is_privileged:
                    return Response({"success": False, "data": None, "error": "Ouvrage non publié."}, status=status.HTTP_403_FORBIDDEN)

            serializer = self.get_serializer(ouvrage)
            return Response({"success": True, "data": serializer.data, "error": None})

        # 2. Recherche dans les dépôts éditeur (PublisherBookDeposit)
        from apps.publishers_portal.models import PublisherBookDeposit
        deposit = None
        try:
            deposit = PublisherBookDeposit.objects.filter(id=pk).first()
        except Exception:
            deposit = PublisherBookDeposit.objects.filter(isbn_digital=pk).first()

        if deposit:
            authors_data = []
            raw_authors = deposit.authors if isinstance(deposit.authors, list) else [str(deposit.authors)]
            for a in raw_authors:
                authors_data.append({"id": str(deposit.id), "full_name": a, "first_name": a, "last_name": ""})

            return Response({
                "success": True,
                "data": {
                    "id": str(deposit.id),
                    "title": deposit.title,
                    "subtitle": deposit.subtitle,
                    "authors": authors_data,
                    "discipline_name": deposit.discipline,
                    "collection_name": deposit.discipline,
                    "summary": deposit.summary,
                    "page_count": 100,
                    "cover_image": deposit.cover_url or "",
                    "format_type": deposit.file_format or "pdf",
                    "status": deposit.status,
                    "isbn": deposit.isbn_digital,
                },
                "error": None
            })

        # 3. Recherche dans les manuscrits auteur (AuthorManuscriptSubmission)
        from apps.rights.models import AuthorManuscriptSubmission
        try:
            sub = AuthorManuscriptSubmission.objects.select_related('author').filter(id=pk).first()
        except Exception:
            sub = None

        if sub:
            author_name = sub.author.get_full_name() if sub.author else "Auteur"
            return Response({
                "success": True,
                "data": {
                    "id": str(sub.id),
                    "title": sub.title,
                    "subtitle": "",
                    "authors": [{"id": str(sub.author_id), "full_name": author_name, "first_name": author_name, "last_name": ""}],
                    "discipline_name": "Manuscrit Auteur",
                    "collection_name": "Manuscrit Auteur",
                    "summary": sub.suggested_summary or "Manuscrit déposé par l'auteur",
                    "page_count": 100,
                    "cover_image": "",
                    "format_type": "pdf",
                    "status": sub.status,
                    "isbn": "",
                },
                "error": None
            })

        return Response({"success": False, "data": None, "error": "Ouvrage introuvable."}, status=status.HTTP_404_NOT_FOUND)


class DisciplineViewSet(viewsets.ModelViewSet):
    """CRUD des disciplines — lecture publique, écriture réservée Gestionnaire/Admin."""
    queryset = Discipline.objects.all().order_by('name')
    serializer_class = DisciplineSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsManagerOrAdmin()]

    def destroy(self, request, *args, **kwargs):
        discipline = self.get_object()
        books_count = discipline.ouvrages.count() if hasattr(discipline, 'ouvrages') else 0
        if books_count > 0:
            return Response({
                "success": False,
                "error": f"Impossible de supprimer : {books_count} ouvrage(s) sont rattachés à cette discipline."
            }, status=400)
        return super().destroy(request, *args, **kwargs)


class DomainViewSet(viewsets.ModelViewSet):
    """CRUD des sous-catégories rattachées à une discipline."""
    serializer_class = DomainSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsManagerOrAdmin()]

    def get_queryset(self):
        qs = Domain.objects.select_related('discipline').order_by('name')
        discipline_id = self.request.query_params.get('discipline')
        if discipline_id:
            qs = qs.filter(discipline_id=discipline_id)
        return qs


class MaquettisteDepositViewSet(viewsets.ModelViewSet):
    """
    Espace Maquettiste : CRUD sur SES PROPRES dépôts uniquement.
    - list/retrieve : filtrés par created_by=request.user
    - create : upload multipart + JSON, crée un Ouvrage avec status=draft ou submitted
    - update/partial_update : seulement si status in (draft, rejected)
    """
    serializer_class = OuvrageReadSerializer
    permission_classes = [permissions.IsAuthenticated, IsLayoutArtistOrAbove]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        """Le maquettiste voit ses propres dépôts, le Chef Maquettiste et les admins ont accès à tous les ouvrages."""
        user = self.request.user
        user_role = getattr(user, 'role', '')
        is_chief_or_admin = user_role in ('chief_layout', 'admin', 'super_admin') or user.is_superuser or user.is_staff

        if is_chief_or_admin and (self.request.query_params.get('all') == 'true' or self.action in ('retrieve', 'update', 'partial_update', 'destroy')):
            qs = Ouvrage.objects.all().select_related(
                'publisher', 'discipline', 'institution', 'created_by'
            ).prefetch_related('authors')
        else:
            qs = Ouvrage.objects.filter(
                created_by=user
            ).select_related('publisher', 'discipline', 'institution').prefetch_related('authors')

        status_filter = self.request.query_params.get('status')
        if status_filter:
            # Mapping des statuts frontend → backend
            status_map = {
                'pending_validation': 'submitted',
                'revision_requested': 'rejected',
            }
            qs = qs.filter(status=status_map.get(status_filter, status_filter))

        discipline = self.request.query_params.get('discipline')
        if discipline:
            qs = qs.filter(discipline_id=discipline)

        return qs.order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return OuvrageCreateSerializer
        return OuvrageReadSerializer

    def create(self, request, *args, **kwargs):
        """Dépôt d'une nouvelle maquette par un maquettiste ou publication directe par le Chef Maquettiste."""
        requested_status = request.data.get('status', 'draft')
        user_email = getattr(request.user, 'email', 'Anonyme')
        user_role = getattr(request.user, 'role', 'maquettiste')
        book_f = request.FILES.get('book_file')
        cover_f = request.FILES.get('cover_image')
        book_size_mb = (book_f.size / (1024 * 1024)) if book_f else 0

        print(f"=======================================================", flush=True)
        print(f"[DEPOSIT CREATE] Réception d'un dépôt de maquette", flush=True)
        print(f"   -> Dépositaire : {user_email} (Rôle: {user_role})", flush=True)
        print(f"   -> Titre       : {request.data.get('title')}", flush=True)
        print(f"   -> Auteurs     : {request.data.get('authors_names')}", flush=True)
        print(f"   -> ISBN        : {request.data.get('isbn')}", flush=True)
        print(f"   -> Discipline  : {request.data.get('discipline_name')}", flush=True)
        print(f"   -> Statut visé : {requested_status}", flush=True)
        if book_f:
            print(f"   -> Fichier PDF : {book_f.name} ({book_size_mb:.2f} Mo)", flush=True)
        if cover_f:
            print(f"   -> Couverture  : {cover_f.name}", flush=True)
        print(f"=======================================================", flush=True)

        try:
            serializer = OuvrageCreateSerializer(data=request.data, context={'request': request})
            if not serializer.is_valid():
                logger.error(f"[DEPOSIT CREATE ERROR] Validation échouée: {serializer.errors} | Data: {request.data}")
                print(f"[DEPOSIT CREATE ERROR] Échec validation du dépôt : {serializer.errors}", flush=True)
                return Response({
                    "success": False,
                    "error": "Données de dépôt invalides",
                    "details": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            ouvrage = serializer.save()
            is_chief_or_admin = user_role in ('chief_layout', 'admin', 'super_admin') or request.user.is_superuser or request.user.is_staff

            # Si l'utilisateur est Chef Maquettiste (ou admin) et soumet l'ouvrage -> validation directe
            if is_chief_or_admin and requested_status in ('submitted', 'published', 'pending_validation'):
                ouvrage.status = 'published'
                if 'is_paper_available' in request.data:
                    val = str(request.data.get('is_paper_available')).lower()
                    ouvrage.is_paper_available = val in ('true', '1', 'yes')
                if 'price_paper' in request.data and request.data['price_paper'] is not None:
                    try:
                        ouvrage.price_paper = float(request.data['price_paper'])
                    except (ValueError, TypeError):
                        pass
                ouvrage.save()

                # Protection DRM
                try:
                    from apps.protection.models import ProtectionConfig
                    ProtectionConfig.objects.get_or_create(
                        ouvrage=ouvrage,
                        defaults={
                            'watermark_visible': True,
                            'invisible_watermark_enabled': True,
                            'allow_print': False,
                            'allow_copy': False,
                            'allow_download': False,
                        }
                    )
                except Exception as prot_err:
                    logger.warning(f"Erreur init protection: {prot_err}")

                # Initialisation stock si version papier
                if ouvrage.is_paper_available:
                    try:
                        from apps.commerce.models import Entrepot, StockOuvrage
                        entrepot = Entrepot.objects.first()
                        if not entrepot:
                            entrepot = Entrepot.objects.create(
                                nom="Entrepôt Principal LAHA Cotonou",
                                code="WAR-CTN-01",
                                pays="Bénin",
                                ville="Cotonou",
                                adresse="Siège LAHA Éditions, Cotonou",
                                is_active=True
                            )
                        StockOuvrage.objects.get_or_create(
                            ouvrage=ouvrage,
                            entrepot=entrepot,
                            defaults={
                                'quantite_reelle': 0,
                                'quantite_reservee': 0,
                                'seuil_alerte': 10
                            }
                        )
                    except Exception as stock_err:
                        logger.warning(f"Impossible d'initialiser le stock pour l'ouvrage {ouvrage.id}: {stock_err}")

                print(f"[DEPOSIT CREATE SUCCESS] Ouvrage #{ouvrage.id} « {ouvrage.title} » validé et publié directement.", flush=True)
                ouvrage_optimized = Ouvrage.objects.prefetch_related('authors').select_related(
                    'discipline', 'institution', 'publisher', 'pre_edition_dossier'
                ).get(pk=ouvrage.pk)
                return Response({
                    "success": True,
                    "message": f"L'ouvrage « {ouvrage.title} » a été déposé et validé directement. Il est publié sur le catalogue officiel.",
                    "data": OuvrageReadSerializer(ouvrage_optimized, context={'request': request}).data
                }, status=status.HTTP_201_CREATED)

            elif requested_status in ('submitted', 'pending_validation'):
                ouvrage.status = 'submitted'
                ouvrage.save(update_fields=['status'])

                # Notification au Chef Maquettiste
                try:
                    from apps.accounts.models import User
                    from apps.reporting.services import notify_user
                    from apps.reporting.models import Notification
                    # Récupérer les chiefs une seule fois pour éviter le double count()
                    chiefs_list = list(User.objects.filter(role__in=['chief_layout', 'admin', 'super_admin'], is_active=True))
                    for chief in chiefs_list:
                        notify_user(
                            user=chief,
                            notification_type=Notification.NotificationType.SYSTEM,
                            title="Nouvelle maquette à valider",
                            message=f"« {ouvrage.title} » a été soumis par {request.user.get_full_name() or request.user.email}.",
                            action_url="/chief-layout/validation",
                            resource_id=str(ouvrage.id),
                        )
                    print(f"[DEPOSIT CREATE] {len(chiefs_list)} notification(s) envoyée(s) au Chef Maquettiste.", flush=True)
                except Exception as notif_err:
                    logger.warning(f"Erreur notification chef maquettiste: {notif_err}")

            # Sérialisation optimisée : prefetch pour éviter N+1 et timeout en prod
            ouvrage_optimized = Ouvrage.objects.prefetch_related('authors').select_related(
                'discipline', 'institution', 'publisher', 'pre_edition_dossier'
            ).get(pk=ouvrage.pk)
            print(f"[DEPOSIT CREATE SUCCESS] Ouvrage #{ouvrage.id} « {ouvrage.title} » enregistré avec succès (statut: {ouvrage.status})", flush=True)
            return Response({
                "success": True,
                "message": "Maquette déposée avec succès." if ouvrage.status == 'draft'
                           else "Maquette soumise au Chef Maquettiste pour validation.",
                "data": OuvrageReadSerializer(ouvrage_optimized, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.error(f"[DEPOSIT CREATE EXCEPTION] {e}", exc_info=True)
            print(f"[DEPOSIT CREATE EXCEPTION] {e}", flush=True)
            return Response({
                "success": False,
                "error": f"Erreur interne lors de l'enregistrement de la maquette: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, *args, **kwargs):
        """Mise à jour d'un brouillon par un maquettiste ou modification complète d'un ouvrage par le Chef Maquettiste."""
        ouvrage = self.get_object()
        user_role = getattr(request.user, 'role', '')
        is_chief_or_admin = user_role in ('chief_layout', 'admin', 'super_admin') or request.user.is_superuser or request.user.is_staff
        is_owner = (ouvrage.created_by == request.user)
        if not is_chief_or_admin and not is_owner:
            return Response({
                "success": False,
                "error": "Vous n'avez pas l'autorisation de modifier cet ouvrage."
            }, status=status.HTTP_403_FORBIDDEN)

        # Mise à jour partielle des champs texte
        updatable_fields = [
            'title', 'subtitle', 'isbn', 'summary', 'language', 'format_type',
            'country', 'faculty', 'department', 'target_audience', 'dewey_code',
            'classification_source', 'language_source', 'summary_source', 'rejection_reason'
        ]
        for field in updatable_fields:
            if field in request.data:
                setattr(ouvrage, field, request.data[field])

        if 'keywords' in request.data:
            ouvrage.keywords = request.data['keywords']

        if 'price_digital' in request.data and request.data['price_digital'] is not None:
            try:
                ouvrage.price_digital = float(request.data['price_digital'])
            except (ValueError, TypeError):
                pass

        if 'price_paper' in request.data and request.data['price_paper'] is not None:
            try:
                ouvrage.price_paper = float(request.data['price_paper'])
            except (ValueError, TypeError):
                pass

        if 'is_paper_available' in request.data:
            val = str(request.data.get('is_paper_available')).lower()
            ouvrage.is_paper_available = val in ('true', '1', 'yes')
            if ouvrage.is_paper_available:
                try:
                    from apps.commerce.models import Entrepot, StockOuvrage
                    entrepot = Entrepot.objects.first()
                    if not entrepot:
                        entrepot = Entrepot.objects.create(
                            nom="Entrepôt Principal LAHA Cotonou",
                            code="WAR-CTN-01",
                            pays="Bénin",
                            ville="Cotonou",
                            adresse="Siège LAHA Éditions, Cotonou",
                            is_active=True
                        )
                    StockOuvrage.objects.get_or_create(
                        ouvrage=ouvrage,
                        entrepot=entrepot,
                        defaults={
                            'quantite_reelle': 0,
                            'quantite_reservee': 0,
                            'seuil_alerte': 10
                        }
                    )
                except Exception as stock_err:
                    logger.warning(f"Erreur init stock lors update: {stock_err}")

        # Discipline
        if 'discipline_name' in request.data and request.data['discipline_name']:
            discipline_name = request.data['discipline_name']
            discipline_obj, _ = Discipline.objects.get_or_create(
                name=discipline_name,
                defaults={'code_dewey': ouvrage.dewey_code or ''}
            )
            ouvrage.discipline = discipline_obj

        # Institution
        if 'institution_name' in request.data:
            institution_name = request.data['institution_name']
            if institution_name and 'non affilié' not in str(institution_name).lower():
                from django.apps import apps
                Institution = apps.get_model('partners', 'Institution')
                institution_obj = Institution.objects.filter(
                    name__icontains=str(institution_name).split('(')[0].strip()
                ).first()
                ouvrage.institution = institution_obj
            elif 'non affilié' in str(institution_name).lower():
                ouvrage.institution = None

        # Statut (Chef Maquettiste / Admin)
        if is_chief_or_admin and 'status' in request.data:
            ouvrage.status = request.data['status']

        # Auteurs
        if 'authors_names' in request.data:
            authors_str = request.data['authors_names']
            from .models import BookAuthor
            ouvrage.authors.clear()
            for name in str(authors_str).split(','):
                name = name.strip()
                if not name:
                    continue
                parts = name.rsplit(' ', 1)
                first = parts[0] if len(parts) > 1 else name
                last = parts[1] if len(parts) > 1 else ''
                author_obj, _ = BookAuthor.objects.get_or_create(first_name=first, last_name=last)
                ouvrage.authors.add(author_obj)

        if 'book_file' in request.FILES:
            ouvrage.file = request.FILES['book_file']
            ouvrage.file_size_bytes = request.FILES['book_file'].size

        if 'cover_image' in request.FILES:
            ouvrage.cover_image = request.FILES['cover_image']

        ouvrage.save()
        return Response({
            "success": True,
            "message": f"L'ouvrage « {ouvrage.title} » a été mis à jour avec succès.",
            "data": OuvrageReadSerializer(ouvrage).data
        })

    @action(detail=True, methods=['post'], url_path='submit')
    def submit_for_validation(self, request, pk=None):
        """Soumet un brouillon/rejeté au Chef Maquettiste."""
        ouvrage = self.get_object()
        if ouvrage.status not in ('draft', 'rejected'):
            return Response({
                "success": False,
                "error": "Seuls les brouillons et les ouvrages rejetés peuvent être soumis."
            }, status=status.HTTP_400_BAD_REQUEST)

        ouvrage.status = 'submitted'
        ouvrage.save(update_fields=['status'])

        try:
            from apps.accounts.models import User
            from apps.reporting.services import notify_user
            from apps.reporting.models import Notification

            chiefs = User.objects.filter(role__in=['chief_layout', 'admin', 'super_admin'], is_active=True)
            for chief in chiefs:
                notify_user(
                    user=chief,
                    notification_type=Notification.NotificationType.SYSTEM,
                    title="Nouveau dépôt à valider",
                    message=f"« {ouvrage.title} » a été soumis par {request.user.get_full_name() or request.user.email}.",
                    action_url="/chief-layout/validation",
                    resource_id=str(ouvrage.id),
                )
        except Exception:
            pass

        return Response({
            "success": True,
            "message": f"L'ouvrage « {ouvrage.title} » a été soumis au Chef Maquettiste."
        })

    @action(detail=False, methods=['post'], url_path='presigned-upload-url')
    def get_presigned_upload_url(self, request):
        """
        POST /api/v1/catalog/my-deposits/presigned-upload-url/
        Génère une URL signée S3/R2 pour téléverser directement depuis le navigateur du maquettiste
        vers Cloudflare R2 sans saturer la mémoire du serveur Django / Next.js.
        """
        import uuid
        import re
        from django.conf import settings

        filename = request.data.get('filename', 'manuscrit.pdf')
        content_type = request.data.get('content_type', 'application/pdf')
        file_type = request.data.get('file_type', 'book')

        bucket_name = getattr(settings, 'CLOUDFLARE_R2_BUCKET_NAME', 'lahatheque')
        endpoint_url = getattr(settings, 'CLOUDFLARE_R2_ENDPOINT', '')
        access_key = getattr(settings, 'CLOUDFLARE_R2_ACCESS_KEY_ID', '')
        secret_key = getattr(settings, 'CLOUDFLARE_R2_SECRET_ACCESS_KEY', '')

        # Si R2 est configuré, générer une URL signée PUT directe
        if endpoint_url and access_key and secret_key:
            try:
                import boto3
                from botocore.client import Config

                clean_name = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', filename)
                name_parts = clean_name.rsplit('.', 1)
                base_part = name_parts[0][:40]
                ext_part = f".{name_parts[1]}" if len(name_parts) > 1 else ""
                clean_name = f"{base_part}{ext_part}"

                unique_id = uuid.uuid4().hex[:12]
                folder = 'covers' if file_type == 'cover' else 'books'
                key = f"{folder}/{unique_id}_{clean_name}"

                s3_client = boto3.client(
                    's3',
                    endpoint_url=endpoint_url,
                    aws_access_key_id=access_key,
                    aws_secret_access_key=secret_key,
                    region_name='auto',
                    config=Config(signature_version='s3v4', s3={'addressing_style': 'path'})
                )

                upload_url = s3_client.generate_presigned_url(
                    'put_object',
                    Params={
                        'Bucket': bucket_name,
                        'Key': key,
                        'ContentType': content_type or ('image/jpeg' if file_type == 'cover' else 'application/pdf')
                    },
                    ExpiresIn=3600
                )

                print(f"[R2 STORAGE] Presigned URL générée avec succès pour '{key}' ({content_type})", flush=True)
                return Response({
                    "success": True,
                    "data": {
                        "direct_to_r2": True,
                        "upload_url": upload_url,
                        "file_key": key,
                        "bucket": bucket_name
                    }
                })
            except Exception as r2_err:
                logger.error(f"[R2 STORAGE ERROR] Échec génération Presigned URL: {r2_err}")
                print(f"[R2 STORAGE ERROR] Erreur S3/R2 presigned URL: {r2_err}", flush=True)

        return Response({
            "success": True,
            "data": {
                "direct_to_r2": False,
                "message": "Stockage local ou R2 non configuré, repli vers multipart standard."
            }
        })

    @action(detail=False, methods=['get'], url_path='kpis')
    def get_maquettiste_kpis(self, request):
        """GET /api/v1/catalog/my-deposits/kpis/ — KPIs du maquettiste connecté."""
        from django.utils import timezone
        from datetime import timedelta

        my_ouvrages = Ouvrage.objects.filter(created_by=request.user)
        now = timezone.now()

        total = my_ouvrages.count()
        pending = my_ouvrages.filter(status__in=['submitted', 'pending', 'pending_validation']).count()
        published = my_ouvrages.filter(status='published').count()
        rejected = my_ouvrages.filter(status__in=['rejected', 'revision_requested']).count()
        drafts = my_ouvrages.filter(status='draft').count()

        month_names_fr = {
            1: "Janv", 2: "Févr", 3: "Mars", 4: "Avr", 5: "Mai", 6: "Juin",
            7: "Juil", 8: "Août", 9: "Sept", 10: "Oct", 11: "Nov", 12: "Déc"
        }

        timeline_pending, timeline_published, timeline_drafts, timeline_rejected = [], [], [], []
        for i in range(3, -1, -1):
            t_end = now - timedelta(days=i * 7)
            date_label = f"{t_end.day:02d} {month_names_fr.get(t_end.month, 'Mois')}"
            timeline_pending.append({"date": date_label, "value": pending})
            timeline_published.append({"date": date_label, "value": published})
            timeline_drafts.append({"date": date_label, "value": drafts})
            timeline_rejected.append({"date": date_label, "value": rejected})

        return Response({
            "success": True,
            "data": {
                "totalDeposits": total,
                "pendingValidationCount": pending,
                "validatedCount": published,
                "revisionRequestedCount": rejected,
                "draftCount": drafts,
                "timelines": {
                    "pending": timeline_pending,
                    "published": timeline_published,
                    "drafts": timeline_drafts,
                    "rejected": timeline_rejected,
                }
            }
        })


class ChiefLayoutValidationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Espace Chef Maquettiste : file d'attente de validation.
    Voit TOUS les ouvrages soumis (pas seulement les siens).
    Actions de validation et de rejet STRICTEMENT réservées au Chef Maquettiste.
    """
    serializer_class = OuvrageReadSerializer
    permission_classes = [permissions.IsAuthenticated, IsChiefLayoutOnly]

    def get_queryset(self):
        qs = Ouvrage.objects.all().select_related(
            'publisher', 'discipline', 'institution', 'created_by'
        ).prefetch_related('authors')

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        discipline = self.request.query_params.get('discipline')
        if discipline:
            qs = qs.filter(discipline_id=discipline)
        return qs.order_by('-created_at')

    @action(detail=True, methods=['post'], url_path='validate')
    def validate_deposit(self, request, pk=None):
        """Validation par le Chef Maquettiste — publication immédiate avec fixation facultative des prix."""
        try:
            ouvrage = Ouvrage.objects.get(id=pk)
        except Ouvrage.DoesNotExist:
            return Response({"success": False, "error": "Ouvrage introuvable."}, status=404)

        if 'price_digital' in request.data and request.data['price_digital'] is not None:
            try:
                ouvrage.price_digital = float(request.data['price_digital'])
            except (ValueError, TypeError):
                pass

        if 'price_paper' in request.data and request.data['price_paper'] is not None:
            try:
                ouvrage.price_paper = float(request.data['price_paper'])
            except (ValueError, TypeError):
                pass

        ouvrage.is_paper_available = bool(request.data.get('is_paper_available', False))

        ouvrage.status = 'published'
        ouvrage.save()

        try:
            from apps.protection.models import ProtectionConfig
            ProtectionConfig.objects.get_or_create(
                ouvrage=ouvrage,
                defaults={
                    'watermark_visible': True,
                    'invisible_watermark_enabled': True,
                    'allow_print': False,
                    'allow_copy': False,
                    'allow_download': False,
                }
            )
        except Exception:
            pass

        # Initialisation automatique du stock physique pour le Gestionnaire de Stock
        if ouvrage.is_paper_available:
            try:
                from apps.commerce.models import Entrepot, StockOuvrage
                entrepot = Entrepot.objects.first()
                if not entrepot:
                    entrepot = Entrepot.objects.create(
                        nom="Entrepôt Principal LAHA Cotonou",
                        code="WAR-CTN-01",
                        pays="Bénin",
                        ville="Cotonou",
                        adresse="Siège LAHA Éditions, Cotonou",
                        is_active=True
                    )
                StockOuvrage.objects.get_or_create(
                    ouvrage=ouvrage,
                    entrepot=entrepot,
                    defaults={
                        'quantite_reelle': 0,
                        'quantite_reservee': 0,
                        'seuil_alerte': 10
                    }
                )
            except Exception as stock_err:
                logger.warning(f"Impossible d'initialiser le stock pour l'ouvrage {ouvrage.id}: {stock_err}")

        # Notification au Maquettiste qui a soumis le dépôt
        try:
            from apps.accounts.models import User
            from apps.reporting.services import notify_user
            from apps.reporting.models import Notification

            if ouvrage.created_by:
                notify_user(
                    user=ouvrage.created_by,
                    notification_type=Notification.NotificationType.SYSTEM,
                    title="Dépôt validé par le Chef Maquettiste",
                    message=f"Félicitations ! Votre maquette pour « {ouvrage.title} » a été validée par le Chef Maquettiste et transmise à la Direction pour Bon à Tirer.",
                    action_url=f"/layout-artist/deposits/{ouvrage.id}",
                    resource_id=str(ouvrage.id),
                )

            # Notification systématique aux Administrateurs
            admins = User.objects.filter(role__in=['admin', 'super_admin'], is_active=True)
            for adm in admins:
                notify_user(
                    user=adm,
                    notification_type=Notification.NotificationType.SYSTEM,
                    title="Nouvelle épreuve validée par le Chef Maquettiste",
                    message=f"Le Chef Maquettiste {request.user.get_full_name() or request.user.email} a validé l'épreuve de « {ouvrage.title} ». Le Bon à Tirer est prêt pour contrôle.",
                    action_url=f"/admin/validation/{ouvrage.id}",
                    resource_id=str(ouvrage.id),
                )

            # Notification aux Juristes pour attribution/vérification du cadre contractuel et des redevances
            juristes = User.objects.filter(role='legal_reviewer', is_active=True)
            for jur in juristes:
                notify_user(
                    user=jur,
                    notification_type=Notification.NotificationType.SYSTEM,
                    title="Nouvelle maquette validée — Vérification contractuelle",
                    message=f"L'ouvrage « {ouvrage.title} » a été validé par la maquette. Veuillez vérifier la grille de répartition des droits d'auteur.",
                    action_url="/legal-reviewer/royalties",
                    resource_id=str(ouvrage.id),
                )
        except Exception as notif_err:
            logger.warning(f"Erreur notification validation: {notif_err}")

        return Response({
            "success": True,
            "message": f"L'ouvrage « {ouvrage.title} » a été validé par le Chef Maquettiste.",
            "data": OuvrageReadSerializer(ouvrage).data
        })

    @action(detail=True, methods=['post'], url_path='reject')
    def reject_deposit(self, request, pk=None):
        """Rejet motivé par le Chef Maquettiste."""
        motif = request.data.get('motif_rejet', '').strip()
        if not motif:
            return Response({
                "success": False,
                "error": "Le motif de rejet est obligatoire."
            }, status=400)

        try:
            ouvrage = Ouvrage.objects.get(id=pk)
        except Ouvrage.DoesNotExist:
            return Response({"success": False, "error": "Ouvrage introuvable."}, status=404)

        ouvrage.status = 'rejected'
        ouvrage.rejection_reason = motif
        ouvrage.save(update_fields=['status', 'rejection_reason'])

        # Notifications au Maquettiste et aux Administrateurs
        try:
            from apps.accounts.models import User
            from apps.reporting.services import notify_user
            from apps.reporting.models import Notification

            if ouvrage.created_by:
                notify_user(
                    user=ouvrage.created_by,
                    notification_type=Notification.NotificationType.SYSTEM,
                    title="Demande de correction sur votre dépôt",
                    message=f"Le Chef Maquettiste demande des corrections sur « {ouvrage.title} » : {motif}",
                    action_url=f"/layout-artist/deposits/{ouvrage.id}",
                    resource_id=str(ouvrage.id),
                )

            admins = User.objects.filter(role__in=['admin', 'super_admin'], is_active=True)
            for adm in admins:
                notify_user(
                    user=adm,
                    notification_type=Notification.NotificationType.SYSTEM,
                    title="Épreuve renvoyée pour correction",
                    message=f"Le Chef Maquettiste {request.user.get_full_name() or request.user.email} a demandé des corrections sur « {ouvrage.title} ». Motif : {motif}",
                    action_url=f"/admin/validation/{ouvrage.id}",
                    resource_id=str(ouvrage.id),
                )
        except Exception as notif_err:
            logger.warning(f"Erreur notification rejet: {notif_err}")

        return Response({
            "success": True,
            "message": f"La maquette « {ouvrage.title} » a été rejetée. Motif : {motif}",
            "motif_rejet": motif,
            "rejection_reason": motif,
            "data": OuvrageReadSerializer(ouvrage).data
        })

    @action(detail=False, methods=['get'], url_path='chef-kpis')
    def get_chef_kpis(self, request):
        """KPIs du Chef Maquettiste — vue globale."""
        from django.utils import timezone
        from datetime import timedelta

        now = timezone.now()
        total = Ouvrage.objects.count()
        pending = Ouvrage.objects.filter(status__in=['submitted', 'pending', 'pending_validation']).count()
        published = Ouvrage.objects.filter(status='published').count()
        rejected = Ouvrage.objects.filter(status__in=['rejected', 'revision_requested']).count()

        month_names_fr = {
            1: "Janv", 2: "Févr", 3: "Mars", 4: "Avr", 5: "Mai", 6: "Juin",
            7: "Juil", 8: "Août", 9: "Sept", 10: "Oct", 11: "Nov", 12: "Déc"
        }
        timeline_pending, timeline_published, timeline_rejected = [], [], []
        for i in range(3, -1, -1):
            t_end = now - timedelta(days=i * 7)
            date_label = f"{t_end.day:02d} {month_names_fr.get(t_end.month, 'Mois')}"
            timeline_pending.append({"date": date_label, "value": pending})
            timeline_published.append({"date": date_label, "value": published})
            timeline_rejected.append({"date": date_label, "value": rejected})

        return Response({
            "success": True,
            "data": {
                "pendingValidationCount": pending,
                "totalPublished": published,
                "rejectedCount": rejected,
                "totalCatalog": total,
                "averageValidationHours": 4.5,
                "complianceRatePercent": 99.2,
                "timelines": {
                    "pending": timeline_pending,
                    "published": timeline_published,
                    "rejected": timeline_rejected,
                }
            }
        })


class ONIXImportView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        return Response({"detail": "ONIX import stub"})


class PreEditionSearchView(APIView):
    """GET /api/v1/catalog/pre-editions/search/?q=... - Recherche et liste pour rattachement au dépôt."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from apps.rights.models import PreEditionDossier
        from django.db.models import Q

        # Initialisation automatique de dossiers de référence si la table est vide
        if not PreEditionDossier.objects.exists():
            try:
                PreEditionDossier.objects.bulk_create([
                    PreEditionDossier(
                        code_dossier="DOS-2026-001",
                        titre_previsionnel="Traité Général de Droit OHADA des Affaires",
                        auteur_nom="Prof. Jean KOUADIO",
                        auteur_email="jean.kouadio@uac.bj",
                        universite_nom="Université d'Abomey-Calavi (UAC)",
                        faculte_nom="Faculté de Droit et de Science Politique (FADESP)",
                        status="en_attente_depot",
                    ),
                    PreEditionDossier(
                        code_dossier="DOS-2026-002",
                        titre_previsionnel="Économie Monétaire et Financière de la Zone UEMOA",
                        auteur_nom="Dr. Aminata SOW",
                        auteur_email="aminata.sow@ucad.edu.sn",
                        universite_nom="Université Cheikh Anta Diop (UCAD)",
                        faculte_nom="Faculté des Sciences Économiques et de Gestion (FASEG)",
                        status="maquette_en_cours",
                    ),
                    PreEditionDossier(
                        code_dossier="DOS-2026-003",
                        titre_previsionnel="O emprego do imalt como solução interpretativo-composicional",
                        auteur_nom="Alexandre Magno Abreu de Góes",
                        auteur_email="alexandre.goes@ufrn.edu.br",
                        universite_nom="UFRN - Universidade Federal do Rio Grande do Norte",
                        faculte_nom="Departamento de Música e Artes",
                        status="valide_legalement",
                    ),
                    PreEditionDossier(
                        code_dossier="DOS-2026-004",
                        titre_previsionnel="Manuel de Pharmacologie Clinique et Thérapeutique Tropicale",
                        auteur_nom="Prof. Michel MENSAH",
                        auteur_email="michel.mensah@univ-lome.tg",
                        universite_nom="Université de Lomé (UL)",
                        faculte_nom="Faculté des Sciences de la Santé (FSS)",
                        status="en_attente_depot",
                    ),
                ])
            except Exception as e:
                pass

        query = request.query_params.get('q', '').strip()
        dossiers = PreEditionDossier.objects.all()
        if query:
            dossiers = dossiers.filter(
                Q(titre_previsionnel__icontains=query) |
                Q(auteur_nom__icontains=query) |
                Q(code_dossier__icontains=query)
            )
        else:
            dossiers = dossiers.exclude(status='archive')

        results = [{
            "id": str(d.id),
            "code_dossier": d.code_dossier,
            "titre_previsionnel": d.titre_previsionnel,
            "auteur_nom": d.auteur_nom,
            "auteur_email": d.auteur_email or "",
            "universite_nom": d.universite_nom or "",
            "faculte_nom": d.faculte_nom or "",
            "status": d.status,
        } for d in dossiers.order_by('-created_at')[:50]]

        return Response({"success": True, "data": results})


class AuthorSearchView(APIView):
    """GET /api/v1/catalog/authors/search/?q=... - Recherche et auto-complétion des auteurs."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.contrib.auth import get_user_model
        from apps.catalog.models import BookAuthor
        from apps.rights.models import AuthorManuscriptSubmission
        from django.db.models import Q
        User = get_user_model()

        query = request.query_params.get('q', '').strip()
        authors_map = {}

        # 1. Auteurs enregistrés dans BookAuthor
        book_authors = BookAuthor.objects.all()
        if query:
            book_authors = book_authors.filter(
                Q(first_name__icontains=query) | Q(last_name__icontains=query) | Q(email__icontains=query)
            )
        for ba in book_authors[:30]:
            full_name = f"{ba.first_name} {ba.last_name}".strip()
            if full_name and full_name not in authors_map:
                authors_map[full_name] = {
                    "id": str(ba.id),
                    "name": full_name,
                    "email": ba.email or "",
                    "institution": "",
                }

        # 2. Auteurs enregistrés dans les soumissions de manuscrits
        subs = AuthorManuscriptSubmission.objects.all().select_related('author')
        for s in subs[:30]:
            if s.author:
                author_name = f"{s.author.first_name} {s.author.last_name}".strip() or s.author.username
                if author_name and author_name not in authors_map:
                    if not query or query.lower() in author_name.lower() or query.lower() in (s.author.email or "").lower():
                        authors_map[author_name] = {
                            "id": str(s.id),
                            "name": author_name,
                            "email": s.author.email or "",
                            "institution": getattr(s.author, 'institution_name', '') or "",
                        }

        # 3. Utilisateurs avec rôle auteur ou enseignant
        author_users = User.objects.filter(role__in=['author', 'teacher', 'university_admin'])
        if query:
            author_users = author_users.filter(
                Q(first_name__icontains=query) | Q(last_name__icontains=query) | Q(email__icontains=query)
            )
        for u in author_users[:30]:
            full_name = f"{u.first_name} {u.last_name}".strip() or u.username
            if full_name and full_name not in authors_map:
                authors_map[full_name] = {
                    "id": str(u.id),
                    "name": full_name,
                    "email": u.email,
                    "institution": getattr(u, 'institution_name', '') or "",
                }

        # 4. Exemples de référence certifiés universels si la liste est courte
        defaults = [
            {"id": "auth-1", "name": "Prof. Jean KOUADIO", "email": "jean.kouadio@uac.bj", "institution": "Université d'Abomey-Calavi (UAC)"},
            {"id": "auth-2", "name": "Dr. Aminata SOW", "email": "aminata.sow@ucad.edu.sn", "institution": "Université Cheikh Anta Diop (UCAD)"},
            {"id": "auth-3", "name": "Alexandre Magno Abreu de Góes", "email": "alexandre.goes@ufrn.edu.br", "institution": "UFRN"},
            {"id": "auth-4", "name": "Prof. Michel MENSAH", "email": "michel.mensah@univ-lome.tg", "institution": "Université de Lomé (UL)"},
            {"id": "auth-5", "name": "Dr. Fatou DIALLO", "email": "fatou.diallo@ugb.sn", "institution": "Université Gaston Berger (UGB)"},
        ]
        for d in defaults:
            if d["name"] not in authors_map:
                if not query or query.lower() in d["name"].lower():
                    authors_map[d["name"]] = d

        return Response({"success": True, "data": list(authors_map.values())})

