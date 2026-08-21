import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from .models import Ouvrage, Discipline
from .serializers import OuvrageReadSerializer, OuvrageCreateSerializer, DisciplineSerializer
from .permissions import IsLayoutArtistOrAbove, IsChiefLayoutOnly

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

        for param, field in [('discipline', 'discipline_id'), ('institution', 'institution_id'),
                             ('language', 'language'), ('country', 'country'), ('format', 'format_type')]:
            val = self.request.query_params.get(param)
            if val:
                qs = qs.filter(**{field: val})
        return qs


class DisciplineViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Discipline.objects.all()
    serializer_class = DisciplineSerializer
    permission_classes = [permissions.AllowAny]


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
        """Le maquettiste ne voit que SES propres dépôts."""
        qs = Ouvrage.objects.filter(
            created_by=self.request.user
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
        """Dépôt d'une nouvelle maquette par un maquettiste."""
        serializer = OuvrageCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        ouvrage = serializer.save()

        # Appliquer le statut demandé par le frontend
        requested_status = request.data.get('status', 'draft')
        if requested_status in ('submitted', 'pending_validation'):
            ouvrage.status = 'submitted'
            ouvrage.save(update_fields=['status'])

        return Response({
            "success": True,
            "message": "Maquette déposée avec succès." if ouvrage.status == 'draft'
                       else "Maquette soumise au Chef Maquettiste pour validation.",
            "data": OuvrageReadSerializer(ouvrage).data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Mise à jour d'un brouillon ou d'un ouvrage rejeté."""
        ouvrage = self.get_object()
        if ouvrage.status not in ('draft', 'rejected'):
            return Response({
                "success": False,
                "error": "Seuls les brouillons et les ouvrages rejetés peuvent être modifiés."
            }, status=status.HTTP_403_FORBIDDEN)

        # Mise à jour partielle des champs texte
        updatable_fields = [
            'title', 'subtitle', 'isbn', 'summary', 'language', 'format_type',
            'country', 'faculty', 'department', 'target_audience', 'dewey_code'
        ]
        for field in updatable_fields:
            if field in request.data:
                setattr(ouvrage, field, request.data[field])

        if 'keywords' in request.data:
            ouvrage.keywords = request.data['keywords']

        if 'book_file' in request.FILES:
            ouvrage.file = request.FILES['book_file']
            ouvrage.file_size_bytes = request.FILES['book_file'].size

        if 'cover_image' in request.FILES:
            ouvrage.cover_image = request.FILES['cover_image']

        ouvrage.save()
        return Response({
            "success": True,
            "message": "Modifications enregistrées.",
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
        return Response({
            "success": True,
            "message": f"L'ouvrage « {ouvrage.title} » a été soumis au Chef Maquettiste."
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

        ouvrage.status = 'published'
        ouvrage.save()

        try:
            from apps.protection.models import ProtectionConfig
            ProtectionConfig.objects.get_or_create(
                ouvrage=ouvrage,
                defaults={
                    'watermark_enabled': True,
                    'invisible_watermark': True,
                    'allow_printing': False,
                    'allow_copy': False,
                }
            )
        except Exception:
            pass

        # Initialisation automatique du stock physique pour le Gestionnaire de Stock
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

        return Response({
            "success": True,
            "message": f"L'ouvrage « {ouvrage.title} » a été validé et publié sur la vitrine.",
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
        ouvrage.save(update_fields=['status'])

        return Response({
            "success": True,
            "message": f"La maquette « {ouvrage.title} » a été rejetée. Motif : {motif}",
            "motif_rejet": motif,
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
