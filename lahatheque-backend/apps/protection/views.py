from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Annotation, ProtectionConfig
from .serializers import AnnotationSerializer
from .permissions import IsAnnotationOwner
from .lcp_client import LCPClient

class ReadBookView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, book_id):
        from .access_service import AccessService
        result = AccessService.check_user_book_access(request.user, book_id)
        if result.get("access_granted"):
            return Response(result, status=status.HTTP_200_OK)
        return Response({
            "access_granted": False,
            "error": result.get("error", "Accès non autorisé.")
        }, status=status.HTTP_403_FORBIDDEN)

class LCPLicenseView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, book_id):
        client = LCPClient()
        license_data = client.generate_license(request.user.id, book_id)
        return Response(license_data)

class TraceAccesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({"status": "recorded"})

class AnnotationViewSet(ModelViewSet):
    serializer_class = AnnotationSerializer
    permission_classes = [IsAuthenticated, IsAnnotationOwner]

    def get_queryset(self):
        qs = Annotation.objects.filter(user=self.request.user)
        ouvrage_id = self.request.query_params.get('ouvrage') or self.request.query_params.get('book')
        if ouvrage_id:
            qs = qs.filter(ouvrage_id=ouvrage_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
