"""
Vues de gestion de la protection DRM, traçabilité légale et annotations.
Conforme au format d'API unifié LAHAThèque: { success, data, error }.
"""

import uuid
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status

from .models import Annotation, ProtectionConfig, TraceAcces, GlobalDrmConfig
from .serializers import AnnotationSerializer, ProtectionConfigSerializer, TraceAccesSerializer, GlobalDrmConfigSerializer
from .permissions import IsAnnotationOwner, IsAdminOrStaff
from .lcp_client import LCPClient
from .access_service import AccessService


class ReadBookView(APIView):
    """Vérifie les droits d'accès avant d'autoriser l'ouverture du lecteur."""
    permission_classes = [IsAuthenticated]

    def get(self, request, book_id):
        result = AccessService.check_user_book_access(request.user, book_id)
        if result.get("access_granted"):
            return Response({
                "success": True,
                "data": result,
                "error": None
            }, status=status.HTTP_200_OK)

        return Response({
            "success": False,
            "data": {},
            "error": result.get("error", "Accès non autorisé à cet ouvrage.")
        }, status=status.HTTP_403_FORBIDDEN)


class LCPLicenseView(APIView):
    """Génère la structure de licence LCP pour un utilisateur et un ouvrage."""
    permission_classes = [IsAuthenticated]

    def get(self, request, book_id):
        client = LCPClient()
        license_data = client.generate_license(request.user.id, book_id)
        return Response({
            "success": True,
            "data": license_data,
            "error": None
        })


class TraceAccesView(APIView):
    """Enregistre un événement de lecture côté client dans TraceAcces."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ip = request.META.get("HTTP_X_FORWARDED_FOR")
        if ip:
            ip = ip.split(",")[0].strip()
        else:
            ip = request.META.get("REMOTE_ADDR", "127.0.0.1")

        ouvrage_id = request.data.get("ouvrage") or request.data.get("book_id")
        page_number = request.data.get("page_number") or request.data.get("page")
        access_type = request.data.get("access_type", "read_online")

        trace = TraceAcces.objects.create(
            user=request.user,
            ouvrage_id=ouvrage_id,
            ip_address=ip,
            country=request.headers.get("CF-IPCountry", request.data.get("country", "")),
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
            device_fingerprint=request.data.get("device_fingerprint", "")[:255],
            access_type=access_type,
            page_number=page_number,
        )

        return Response({
            "success": True,
            "data": {"trace_id": str(trace.id), "recorded": True},
            "error": None
        }, status=status.HTTP_201_CREATED)


class TraceAccesViewSet(ReadOnlyModelViewSet):
    """Consultation et filtrage des traces d'accès pour l'Administrateur."""
    serializer_class = TraceAccesSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        qs = TraceAcces.objects.select_related("user", "ouvrage").all()
        user_id = self.request.query_params.get("user")
        ouvrage_id = self.request.query_params.get("ouvrage")
        country = self.request.query_params.get("country")
        access_type = self.request.query_params.get("access_type")

        if user_id:
            qs = qs.filter(user_id=user_id)
        if ouvrage_id:
            qs = qs.filter(ouvrage_id=ouvrage_id)
        if country:
            qs = qs.filter(country__iexact=country)
        if access_type:
            qs = qs.filter(access_type=access_type)

        return qs


class ProtectionConfigViewSet(ModelViewSet):
    """Configuration DRM par ouvrage pour l'Éditeur et l'Administrateur."""
    serializer_class = ProtectionConfigSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ProtectionConfig.objects.select_related("ouvrage").all()

    def perform_update(self, serializer):
        # Incrémenter la version de configuration pour invalider automatiquement les caches dérivés
        instance = serializer.save()
        instance.config_version += 1
        instance.save(update_fields=["config_version"])


class AnnotationViewSet(ModelViewSet):
    """Annotations et surlignages personnels de l'utilisateur."""
    serializer_class = AnnotationSerializer
    permission_classes = [IsAuthenticated, IsAnnotationOwner]

    def get_queryset(self):
        qs = Annotation.objects.filter(user=self.request.user)
        ouvrage_id = self.request.query_params.get('ouvrage') or self.request.query_params.get('book')
        if ouvrage_id:
            try:
                uuid.UUID(str(ouvrage_id))
                qs = qs.filter(ouvrage_id=ouvrage_id)
            except (ValueError, TypeError):
                # Si ouvrage_id n'est pas un UUID valide (ex: 'lesson_pdf' pour un contrat), retourner queryset vide
                return qs.none()
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class GlobalDrmConfigView(APIView):
    """
    Vue singleton pour la configuration DRM globale du catalogue.
    GET  → retourne la configuration globale (tout utilisateur authentifié — nécessaire pour le lecteur).
    PATCH → met à jour partiellement et incrémente config_version pour invalider les dérivés (Admin/Staff).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cfg = GlobalDrmConfig.get_singleton()
        serializer = GlobalDrmConfigSerializer(cfg)
        return Response({
            "success": True,
            "data": serializer.data,
            "error": None,
        })

    def patch(self, request):
        # Le PATCH reste réservé aux admins/staff
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {"success": False, "data": {}, "error": "Accès réservé aux administrateurs."},
                status=status.HTTP_403_FORBIDDEN,
            )
        cfg = GlobalDrmConfig.get_singleton()
        serializer = GlobalDrmConfigSerializer(cfg, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({
                "success": False,
                "data": {},
                "error": serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        instance = serializer.save()
        # Invalider les dérivés mis en cache en incrémentant la version
        instance.config_version = (instance.config_version or 0) + 1
        instance.save(update_fields=["config_version"])

        return Response({
            "success": True,
            "data": GlobalDrmConfigSerializer(instance).data,
            "error": None,
        })
