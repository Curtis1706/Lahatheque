import secrets
import string
import logging
from django.db import transaction
from django.db.models import Q
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from decimal import Decimal
from .models import User
from .serializers import UserSerializer, AdminUserCreateSerializer
from .permissions import IsAdminOrSuperAdmin
from apps.partners.models import Institution

logger = logging.getLogger(__name__)

ROLE_LABELS = {
    'student': 'Client Lecteur / Étudiant',
    'teacher': 'Enseignant / Chercheur',
    'author': 'Auteur Partenaire',
    'publisher': 'Maison d\'Édition / Éditeur Tiers',
    'university': 'Université & Institut Partenaire',
    'wholesaler': 'Grossiste & Librairie',
    'layout_artist': 'Maquettiste / Studio Pré-Presse',
    'chief_layout': 'Chef Maquettiste / Contrôle Qualité',
    'legal_reviewer': 'Relecteur Juridique & Juriste',
    'manager': 'Manager & Coordination Logistique',
    'admin': 'Administrateur Plateforme',
    'super_admin': 'Super Administrateur',
    'partner_api': 'Partenaire API & Intégration',
}

ROLE_GUIDES = {
    'author': 'Depuis votre espace auteur, vous pouvez déposer vos manuscrits, suivre les étapes de relecture et de mise en page, et consulter en temps réel l\'état de vos ventes et de vos redevances de droits d\'auteur.',
    'publisher': 'Votre espace éditeur vous permet de téléverser et administrer votre catalogue d\'ouvrages, configurer les paramètres de protection DRM et superviser les statistiques de consultation institutionnelle.',
    'legal_reviewer': 'Votre espace juridique vous donne accès au registre des contrats numérisés, à l\'instruction des mandats d\'édition et à la conformité des accords de publication.',
    'layout_artist': 'Votre espace pré-presse vous permet de récupérer les manuscrits originaux et de téléverser les épreuves PDF et EPUB finalisées pour validation.',
    'chief_layout': 'Vous assurez le contrôle qualité pré-presse final, l\'inspection des maquettes et la validation technique avant parution au catalogue officiel.',
    'wholesaler': 'Votre portail grossiste vous permet de commander des volumes de livres papier avec les remises accordées à votre établissement et de suivre les expéditions.',
    'university': 'Votre portail institutionnel permet de superviser les affiliations étudiantes, gérer vos bouquets de manuels universitaires et consulter les reversements statutaires de 15%.',
    'student': 'Accédez à votre bibliothèque numérique personnelle, profitez de notre liseuse sécurisée avec prise de notes et consultez les manuels recommandés.',
    'teacher': 'Consultez les ouvrages de référence de votre discipline, recommandez des manuels à vos étudiants et accédez aux ressources pédagogiques.',
    'manager': 'Vous supervisez les flux opérationnels, la coordination des stocks physiques et les livraisons aux librairies partenaires.',
    'admin': 'Vous disposez des privilèges d\'administration générale pour superviser la plateforme, paramétrer la cascade tarifaire et gérer les utilisateurs.',
    'super_admin': 'Vous disposez d\'un accès complet à l\'ensemble des configurations, clés API, relances et journaux d\'audit de la plateforme.',
}


def send_account_creation_welcome_email(user: User, temporary_password: str) -> bool:
    """
    Envoie un email de bienvenue officiel, complet et élégant à l'utilisateur lors de la création de son compte.
    Charte graphique LAHAThèque (Navy #1B2A4E & Or #B08D42).
    """
    from apps.communications.services.email_service import send_transactional_email

    user_role_str = str(user.role or "student")
    role_label = ROLE_LABELS.get(user_role_str, user_role_str.capitalize())
    full_name = f"{user.first_name or ''} {user.last_name or ''}".strip() or str(user.email)
    user_email_str = str(user.email)
    login_url = "https://lahatheque.com/login"

    res = send_transactional_email(
        email_type="account_created_by_admin",
        to_email=user_email_str,
        subject=f"Bienvenue sur LAHAThèque — Vos identifiants d'accès ({role_label})",
        template_name="emails/auth/account_created_by_admin.html",
        context={
            "recipient_name": full_name,
            "email": user_email_str,
            "temporary_password": temporary_password,
            "role_display": role_label,
            "login_url": login_url,
        },
        recipient_name=full_name,
        async_send=True,
    )
    return res.success



def send_custom_notification_email(recipient_email: str, recipient_name: str, subject: str, body_text: str) -> bool:
    """
    Envoie un email personnalisé rédigé par l'administrateur depuis SendEmailModal.
    """
    from apps.communications.services.email_service import send_transactional_email

    res = send_transactional_email(
        email_type="admin_custom_user_email",
        to_email=recipient_email,
        subject=subject,
        template_name="emails/admin/custom_message.html",
        context={
            "recipient_name": recipient_name,
            "custom_subject": subject,
            "message_body": body_text,
        },
        recipient_name=recipient_name,
        async_send=True,
    )
    return res.success


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
        Création administrative d'un compte privilégié ou partenaire avec envoi automatique de l'email complet.
        Pour garantir la confidentialité, le mot de passe n'est pas renvoyé en clair à l'administrateur.
        """
        serializer = AdminUserCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "success": False,
                "data": serializer.errors,
                "error": "Données de formulaire invalides."
            }, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        email = data['email'].strip().lower()

        if User.objects.filter(email=email).exists():
            return Response({
                "success": False,
                "data": None,
                "error": "Cet email est déjà utilisé."
            }, status=status.HTTP_400_BAD_REQUEST)

        phone = str(data.get('phone', '')).strip().replace(" ", "")
        if phone and User.objects.filter(phone=phone, is_active=True).exists():
            return Response({
                "success": False,
                "data": None,
                "error": "Ce numéro de téléphone est déjà associé à un autre compte."
            }, status=status.HTTP_400_BAD_REQUEST)

        temp_password = data.get('temporary_password') or ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        institution_id = data.get('institution_id')
        institution_mode = data.get('institution_mode', 'existing')
        new_inst_name = data.get('institution_name', '').strip()
        new_inst_code = data.get('institution_code', '').strip().upper()
        new_inst_country = data.get('institution_country', 'BJ').strip() or 'BJ'

        institution = None

        try:
            with transaction.atomic():
                if institution_mode == 'new' and new_inst_name:
                    if not new_inst_code:
                        stop_words = {'de', 'du', 'des', 'la', 'le', 'et', 'l', "d'"}
                        words = [w for w in new_inst_name.split() if w.lower() not in stop_words]
                        new_inst_code = "".join(w[0].upper() for w in words)[:8] or "UNIV"

                    # Edge Case L81 / T019 : Bloquer en cas de doublon et suggérer l'institution existante
                    existing_inst = Institution.objects.filter(
                        Q(name__iexact=new_inst_name) | (Q(code__iexact=new_inst_code) if new_inst_code else Q(pk__in=[]))
                    ).first()
                    if existing_inst:
                        return Response({
                            "success": False,
                            "data": {
                                "suggestion_id": str(existing_inst.id),
                                "suggestion_name": existing_inst.name,
                                "suggestion_code": existing_inst.code,
                            },
                            "error": f"L'institution '{existing_inst.name}' ({existing_inst.code}) existe déjà. Veuillez la sélectionner dans la liste des institutions partenaires existantes."
                        }, status=status.HTTP_400_BAD_REQUEST)

                    institution = Institution.objects.create(
                        name=new_inst_name,
                        short_name=new_inst_code,
                        code=new_inst_code,
                        country=new_inst_country,
                        royalty_rate=Decimal("15.00"),
                        contract_reference=f"CTR-UNIV-2026-{new_inst_code}",
                        is_active=True
                    )
                elif institution_id:
                    try:
                        institution = Institution.objects.get(id=institution_id)
                    except Institution.DoesNotExist:
                        pass

                # Règle SC-001 : Zéro compte orphelin pour le rôle university
                if data['role'] == 'university' and not institution:
                    return Response({
                        "success": False,
                        "data": None,
                        "error": "Un compte de rôle Université Partenaire doit obligatoirement être rattaché à une institution partenaire officielle."
                    }, status=status.HTTP_400_BAD_REQUEST)

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

                if institution and (not institution.user or institution.user == user):
                    institution.user = user
                    institution.save(update_fields=['user'])

                if data['role'] in ['admin', 'super_admin']:
                    user.is_staff = True
                    if data['role'] == 'super_admin':
                        user.is_superuser = True
                    user.save(update_fields=['is_staff', 'is_superuser'])

            # Envoi automatique de l'e-mail de bienvenue avec identifiants
            email_sent = send_account_creation_welcome_email(user, temp_password)

            return Response({
                "success": True,
                "data": {
                    "user": UserSerializer(user).data,
                    "message": f"Compte {ROLE_LABELS.get(data['role'], data['role'])} créé avec succès. Un e-mail d'accès sécurisé a été transmis au titulaire.",
                    "email_sent": email_sent,
                },
                "error": None
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"[AdminUserViewSet.create] Erreur de création: {e}", exc_info=True)
            return Response({
                "success": False,
                "data": None,
                "error": f"Erreur de création: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, pk=None):
        """
        DELETE /api/v1/admin/users/<id>/
        Suppression définitive d'un compte utilisateur. Accessible aux rôles admin et super_admin.
        """
        try:
            user = User.objects.get(id=pk)
            user_email = user.email

            # Délier de manière sécurisée toute institution associée avant suppression pour éviter le cascade delete (Edge Case L82 / T022)
            Institution.objects.filter(user=user).update(user=None)

            user.delete()
            return Response({
                "success": True,
                "data": {
                    "message": f"Le compte {user_email} a été supprimé définitivement."
                },
                "error": None
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "Utilisateur introuvable."
            }, status=status.HTTP_404_NOT_FOUND)

    def partial_update(self, request, pk=None):
        """PATCH /api/v1/admin/users/<id>/ - Modification d'un compte existant."""
        try:
            user = User.objects.get(id=pk)
        except User.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "Utilisateur introuvable."
            }, status=status.HTTP_404_NOT_FOUND)

        allowed_fields = [
            'first_name', 'last_name', 'phone', 'role', 'is_active', 'country', 'pen_name',
            'custom_remise_papier_pct', 'custom_remise_numerique_pct', 'custom_remise_audio_pct'
        ]
        updated_fields = []

        for field in allowed_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
                updated_fields.append(field)

        if 'email' in request.data:
            new_email = request.data['email'].strip().lower()
            if new_email != user.email and User.objects.filter(email=new_email).exclude(id=user.id).exists():
                return Response({
                    "success": False,
                    "data": None,
                    "error": "Cet email est déjà utilisé par un autre compte."
                }, status=status.HTTP_400_BAD_REQUEST)
            user.email = new_email
            user.username = new_email
            updated_fields.extend(['email', 'username'])

        # Gestion de l'institution : rattachement d'une institution existante ou création
        if 'institution_id' in request.data:
            inst_id = request.data.get('institution_id')
            if inst_id:
                try:
                    inst = Institution.objects.get(id=inst_id)
                    user.institution = inst
                    updated_fields.append('institution')
                    if not inst.user or inst.user == user:
                        inst.user = user
                        inst.save(update_fields=['user'])
                except Institution.DoesNotExist:
                    return Response({
                        "success": False,
                        "data": None,
                        "error": "Institution introuvable."
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                user.institution = None
                updated_fields.append('institution')

        if request.data.get('institution_mode') == 'new' and request.data.get('institution_name'):
            new_name = request.data['institution_name'].strip()
            new_code = request.data.get('institution_code', '').strip().upper()
            if not new_code:
                stop_words = {'de', 'du', 'des', 'la', 'le', 'et', 'l', "d'"}
                words = [w for w in new_name.split() if w.lower() not in stop_words]
                new_code = "".join(w[0].upper() for w in words)[:8] or "UNIV"

            # Edge Case L81 / T019 : Bloquer en cas de doublon et suggérer l'institution existante
            existing_inst = Institution.objects.filter(
                Q(name__iexact=new_name) | (Q(code__iexact=new_code) if new_code else Q(pk__in=[]))
            ).first()
            if existing_inst:
                return Response({
                    "success": False,
                    "data": {
                        "suggestion_id": str(existing_inst.id),
                        "suggestion_name": existing_inst.name,
                        "suggestion_code": existing_inst.code,
                    },
                    "error": f"L'institution '{existing_inst.name}' ({existing_inst.code}) existe déjà. Veuillez la sélectionner dans la liste des institutions partenaires existantes."
                }, status=status.HTTP_400_BAD_REQUEST)

            inst = Institution.objects.create(
                name=new_name,
                short_name=new_code,
                code=new_code,
                country=request.data.get('institution_country', user.country or 'BJ'),
                royalty_rate=Decimal("15.00"),
                contract_reference=f"CTR-UNIV-2026-{new_code}",
                is_active=True,
                user=user
            )
            user.institution = inst
            updated_fields.append('institution')

        # Validation finale SC-001 / T021 : Aucun compte orphelin pour le rôle university après modification
        effective_role = request.data.get('role', user.role)
        if effective_role == 'university' and not user.institution:
            return Response({
                "success": False,
                "data": None,
                "error": "Un compte de rôle Université Partenaire doit obligatoirement être rattaché à une institution partenaire officielle."
            }, status=status.HTTP_400_BAD_REQUEST)

        if updated_fields:
            user.save(update_fields=list(set(updated_fields)))

        user_data = UserSerializer(user).data
        return Response({
            "success": True,
            "data": {
                "user": user_data,
                "message": "Informations du compte et institution mises à jour avec succès.",
                "id": str(user.id),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "is_active": user.is_active,
                "phone": user.phone,
                "country": user.country,
            },
            "error": None
        }, status=status.HTTP_200_OK)

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
                "data": {
                    "message": f"Le compte de {user.email} a été {status_label}.",
                    "is_suspended": user.is_suspended
                },
                "error": None
            })
        except User.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "Utilisateur introuvable."
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        """POST /api/v1/admin/users/<id>/reset-password/"""
        try:
            user = User.objects.get(id=pk)
            new_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
            user.set_password(new_password)
            user.save(update_fields=['password'])

            # Envoyer le nouveau mot de passe par email
            send_account_creation_welcome_email(user, new_password)

            return Response({
                "success": True,
                "data": {
                    "message": f"Nouveau mot de passe temporaire généré et envoyé par email à {user.email}."
                },
                "error": None
            })
        except User.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "Utilisateur introuvable."
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path='send-email')
    def send_email(self, request, pk=None):
        """
        POST /api/v1/admin/users/<id>/send-email/
        Envoie un email personnalisé à l'utilisateur depuis l'espace admin.
        """
        try:
            user = User.objects.get(id=pk)
            subject = request.data.get('subject', '').strip()
            message = request.data.get('message', '').strip()

            if not subject or not message:
                return Response({
                    "success": False,
                    "data": None,
                    "error": "L'objet et le message sont obligatoires."
                }, status=status.HTTP_400_BAD_REQUEST)

            recipient_name = f"{user.first_name} {user.last_name}".strip() or user.email
            ok = send_custom_notification_email(user.email, recipient_name, subject, message)

            if ok:
                return Response({
                    "success": True,
                    "data": {
                        "message": f"Email transmis avec succès à {user.email}."
                    },
                    "error": None
                })
            else:
                return Response({
                    "success": False,
                    "data": None,
                    "error": "Échec de l'envoi de l'email via le serveur SMTP."
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except User.DoesNotExist:
            return Response({
                "success": False,
                "data": None,
                "error": "Utilisateur introuvable."
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get', 'patch'], url_path='discounts')
    def discounts(self, request, pk=None):
        """
        GET /api/v1/admin/users/<id>/discounts/
        PATCH /api/v1/admin/users/<id>/discounts/
        Consultation et configuration des remises auteur (spécifiques vs politique globale).
        """
        try:
            user = User.objects.get(id=pk)
        except User.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

        from apps.reporting.pricing_service import get_platform_config
        config = get_platform_config()

        if request.method == 'GET':
            has_custom = bool(
                user.custom_remise_papier_pct is not None or
                user.custom_remise_numerique_pct is not None or
                user.custom_remise_audio_pct is not None
            )
            return Response({
                "success": True,
                "data": {
                    "user_id": str(user.id),
                    "user_name": f"{user.first_name} {user.last_name}".strip() or user.email,
                    "role": user.role,
                    "is_custom": has_custom,
                    "custom_remise_papier_pct": float(user.custom_remise_papier_pct) if user.custom_remise_papier_pct is not None else None,
                    "custom_remise_numerique_pct": float(user.custom_remise_numerique_pct) if user.custom_remise_numerique_pct is not None else None,
                    "custom_remise_audio_pct": float(user.custom_remise_audio_pct) if user.custom_remise_audio_pct is not None else None,
                    "effective_paper_pct": float(user.custom_remise_papier_pct if user.custom_remise_papier_pct is not None else config.remise_auteur_papier_pct),
                    "effective_digital_pct": float(user.custom_remise_numerique_pct if user.custom_remise_numerique_pct is not None else config.remise_auteur_numerique_pct),
                    "effective_audio_pct": float(user.custom_remise_audio_pct if user.custom_remise_audio_pct is not None else getattr(config, 'remise_auteur_audio_pct', 25.0)),
                    "global_defaults": {
                        "paper_pct": float(config.remise_auteur_papier_pct),
                        "digital_pct": float(config.remise_auteur_numerique_pct),
                        "audio_pct": float(getattr(config, 'remise_auteur_audio_pct', 25.0)),
                    }
                }
            })

        # PATCH: Mise à jour
        use_global = request.data.get('use_global', False)
        if use_global:
            user.custom_remise_papier_pct = None
            user.custom_remise_numerique_pct = None
            user.custom_remise_audio_pct = None
            user.save(update_fields=['custom_remise_papier_pct', 'custom_remise_numerique_pct', 'custom_remise_audio_pct'])
            return Response({
                "success": True,
                "message": f"Remises de {user.email} réalignées sur la politique générale de la plateforme.",
                "data": {
                    "is_custom": False,
                    "effective_paper_pct": float(config.remise_auteur_papier_pct),
                    "effective_digital_pct": float(config.remise_auteur_numerique_pct),
                    "effective_audio_pct": float(getattr(config, 'remise_auteur_audio_pct', 25.0)),
                }
            })

        # Remises spécifiques
        from decimal import Decimal
        updated_fields = []
        if 'paper_pct' in request.data:
            user.custom_remise_papier_pct = Decimal(str(request.data['paper_pct']))
            updated_fields.append('custom_remise_papier_pct')
        if 'digital_pct' in request.data:
            user.custom_remise_numerique_pct = Decimal(str(request.data['digital_pct']))
            updated_fields.append('custom_remise_numerique_pct')
        if 'audio_pct' in request.data:
            user.custom_remise_audio_pct = Decimal(str(request.data['audio_pct']))
            updated_fields.append('custom_remise_audio_pct')

        if updated_fields:
            user.save(update_fields=updated_fields)

        return Response({
            "success": True,
            "message": f"Remises personnalisées appliquées pour {user.email}.",
            "data": {
                "is_custom": True,
                "effective_paper_pct": float(user.custom_remise_papier_pct or config.remise_auteur_papier_pct),
                "effective_digital_pct": float(user.custom_remise_numerique_pct or config.remise_auteur_numerique_pct),
                "effective_audio_pct": float(user.custom_remise_audio_pct or getattr(config, 'remise_auteur_audio_pct', 25.0)),
            }
        })
