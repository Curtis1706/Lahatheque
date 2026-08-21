import secrets
import string
from django.db import transaction
from django.db.models import Q
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import User
from .serializers import UserSerializer, AdminUserCreateSerializer
from .permissions import IsAdminOrSuperAdmin
from apps.partners.models import Institution

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class AdminUserManagementViewSet(viewsets.ViewSet):
    """
    Gestion complète des utilisateurs par l'Administrateur (/admin/users).
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSuperAdmin]
    pagination_class = StandardResultsSetPagination

    def list(self, request):
        """
        GET /api/v1/admin/users/
        Paramètres de filtre : role, is_active, is_suspended, country, q (recherche textuelle)
        """
        queryset = User.objects.all().order_by('-date_joined')

        role = request.query_params.get('role')
        if role and role != 'all':
            queryset = queryset.filter(role=role)

        is_suspended = request.query_params.get('is_suspended')
        if is_suspended is not None:
            queryset = queryset.filter(is_suspended=(is_suspended.lower() == 'true'))

        country = request.query_params.get('country')
        if country:
            queryset = queryset.filter(country=country)

        search = request.query_params.get('q') or request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(phone__icontains=search) |
                Q(pen_name__icontains=search)
            )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = UserSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = UserSerializer(queryset, many=True)
        return Response({"results": serializer.data, "count": queryset.count()})

    def retrieve(self, request, pk=None):
        """GET /api/v1/admin/users/<id>/"""
        try:
            user = User.objects.get(id=pk)
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

    def create(self, request):
        """
        POST /api/v1/admin/users/
        Création administrative d'un compte privilégié ou partenaire.
        """
        serializer = AdminUserCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        email = data['email'].strip().lower()

        if User.objects.filter(email=email).exists():
            return Response({"error": "Cet email est déjà utilisé."}, status=status.HTTP_400_BAD_REQUEST)

        phone = str(data.get('phone', '')).strip().replace(" ", "")
        if phone and User.objects.filter(phone=phone, is_active=True).exists():
            return Response({"error": "Ce numéro de téléphone est déjà associé à un autre compte."}, status=status.HTTP_400_BAD_REQUEST)

        temp_password = data.get('temporary_password') or ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        institution_id = data.get('institution_id')
        institution = None
        if institution_id:
            try:
                institution = Institution.objects.get(id=institution_id)
            except Institution.DoesNotExist:
                pass

        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=temp_password,
                    first_name=data.get('first_name', '').strip(),
                    last_name=data.get('last_name', '').strip(),
                    phone=phone,
                    country=data.get('country', 'BJ'),
                    role=data['role'],
                    active_roles=[data['role']],
                    institution=institution,
                    is_verified=True,
                )

                if data['role'] in ['admin', 'super_admin']:
                    user.is_staff = True
                    if data['role'] == 'super_admin':
                        user.is_superuser = True
                    user.save(update_fields=['is_staff', 'is_superuser'])

            return Response({
                "success": True,
                "message": f"Compte {data['role']} créé avec succès.",
                "user": UserSerializer(user).data,
                "temporary_password": temp_password
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": f"Erreur de création: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['patch'], url_path='toggle-status')
    def toggle_status(self, request, pk=None):
        """PATCH /api/v1/admin/users/<id>/toggle-status/"""
        try:
            user = User.objects.get(id=pk)
            user.is_suspended = not user.is_suspended
            if user.is_suspended:
                user.suspension_reason = request.data.get('reason', 'Suspension administrative.')
            else:
                user.suspension_reason = ''
            user.save(update_fields=['is_suspended', 'suspension_reason'])

            status_label = "suspendu" if user.is_suspended else "réactivé"
            return Response({
                "success": True,
                "message": f"Le compte de {user.email} a été {status_label}.",
                "is_suspended": user.is_suspended
            })
        except User.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        """POST /api/v1/admin/users/<id>/reset-password/"""
        try:
            user = User.objects.get(id=pk)
            new_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
            user.set_password(new_password)
            user.save(update_fields=['password'])

            return Response({
                "success": True,
                "message": f"Nouveau mot de passe temporaire généré pour {user.email}.",
                "temporary_password": new_password
            })
        except User.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)
