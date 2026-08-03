from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Ouvrage
from .serializers import OuvrageSerializer

class OuvrageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Ouvrage.objects.all()
    serializer_class = OuvrageSerializer
    permission_classes = [permissions.AllowAny]

class ONIXImportView(APIView):
    def post(self, request):
        # TODO: Traiter le XML ONIX 3.0
        return Response({"detail": "ONIX import stub"})
