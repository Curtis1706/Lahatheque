from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from .models import Ouvrage, Discipline
from .serializers import OuvrageSerializer, DisciplineSerializer

class OuvrageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Ouvrage.objects.all().select_related('publisher', 'discipline', 'institution').prefetch_related('authors')
    serializer_class = OuvrageSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        
        # Filtre texte via PostgreSQL SearchVector / SearchRank
        q = self.request.query_params.get('q', '').strip()
        if q:
            vector = SearchVector('title', weight='A') + \
                     SearchVector('subtitle', weight='B') + \
                     SearchVector('summary', weight='C')
            query = SearchQuery(q)
            qs = qs.annotate(rank=SearchRank(vector, query)).filter(rank__gte=0.01).order_by('-rank')

        # Filtres hiérarchiques & métadonnées
        discipline_id = self.request.query_params.get('discipline')
        if discipline_id:
            qs = qs.filter(discipline_id=discipline_id)

        institution_id = self.request.query_params.get('institution')
        if institution_id:
            qs = qs.filter(institution_id=institution_id)

        language = self.request.query_params.get('language')
        if language:
            qs = qs.filter(language=language)

        country = self.request.query_params.get('country')
        if country:
            qs = qs.filter(country=country)

        format_type = self.request.query_params.get('format')
        if format_type:
            qs = qs.filter(format_type=format_type)

        return qs

class DisciplineViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Discipline.objects.all()
    serializer_class = DisciplineSerializer
    permission_classes = [permissions.AllowAny]

class ONIXImportView(APIView):
    def post(self, request):
        return Response({"detail": "ONIX import stub"})

