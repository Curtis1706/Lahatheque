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
    role_label = ROLE_LABELS.get(user.role, user.role.capitalize())
    role_guide = ROLE_GUIDES.get(user.role, "Bienvenue sur votre espace connecté LAHAThèque.")
    login_url = "https://lahatheque.com/login"

    full_name = f"{user.first_name} {user.last_name}".strip() or user.email
    subject = f"Bienvenue sur LAHAThèque — Vos identifiants d'accès ({role_label})"
    
    text_content = f"""Bonjour {full_name},

L'équipe LAHAThèque a le plaisir de vous annoncer la création de votre compte d'accès officiel sur notre plateforme académique et universitaire.

Voici vos identifiants de connexion confidentiels :
==================================================
• Adresse e-mail de connexion : {user.email}
• Mot de passe temporaire : {temporary_password}
• Rôle attribué : {role_label}
• Page de connexion : {login_url}
==================================================

VOTRE GUIDE D'ACCÈS MÉTIER :
{role_guide}

CONSIGNES DE SÉCURITÉ :
Pour garantir la stricte confidentialité et la sécurité de vos données, nous vous recommandons de remplacer ce mot de passe temporaire dès votre première ouverture de session via la rubrique Mon Profil.

Cordialement,
L'équipe LAHAThèque
Éditions LAHA & Partenaires Académiques
contact@lahacademia.com
"""

    html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F7FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1E293B;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#F5F7FA;padding:35px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width:600px;width:100%;border-collapse:collapse;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #E2E8F0;">
          <!-- Header Banner -->
          <tr>
            <td style="background-color:#1B2A4E;padding:32px 30px;text-align:center;">
              <h1 style="color:#FFFFFF;font-size:24px;font-weight:bold;margin:0;letter-spacing:0.5px;">LAHAThèque</h1>
              <p style="color:#B08D42;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;margin:6px 0 0 0;">Bibliothèque Numérique & Académique Africaine</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:32px 30px;">
              <h2 style="color:#0F1A33;font-size:18px;font-weight:bold;margin:0 0 12px 0;">Bonjour {full_name},</h2>
              <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px 0;">
                L'équipe <strong>LAHAThèque</strong> a le plaisir de vous annoncer la création de votre compte officiel avec le profil de <span style="display:inline-block;padding:2px 10px;background-color:#EBF3FF;color:#1B2A4E;border-radius:999px;font-weight:bold;font-size:12px;">{role_label}</span>.
              </p>

              <!-- Credentials Box -->
              <table role="presentation" style="width:100%;background-color:#F8FAFC;border:1px solid #CBD5E1;border-radius:12px;margin:0 0 24px 0;padding:18px;">
                <tr>
                  <td>
                    <div style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;margin-bottom:12px;letter-spacing:0.5px;">Vos Paramètres d'Accès Sécurisés</div>
                    <table role="presentation" style="width:100%;font-size:13px;">
                      <tr>
                        <td style="color:#64748B;padding:4px 0;width:150px;">E-mail de connexion :</td>
                        <td style="color:#0F1A33;font-weight:bold;padding:4px 0;font-family:monospace;">{user.email}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748B;padding:4px 0;">Mot de passe temporaire :</td>
                        <td style="color:#92400E;font-weight:bold;padding:4px 0;font-family:monospace;background-color:#FEF3C7;display:inline-block;padding:2px 8px;border-radius:6px;">{temporary_password}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748B;padding:4px 0;">Rôle assigné :</td>
                        <td style="color:#1B2A4E;font-weight:bold;padding:4px 0;">{role_label}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748B;padding:4px 0;">Statut :</td>
                        <td style="color:#16A34A;font-weight:bold;padding:4px 0;">Actif & Validé</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Role Context Guide -->
              <div style="background-color:#FFFBEB;border-left:4px solid #B08D42;padding:14px 16px;border-radius:0 8px 8px 0;margin:0 0 24px 0;">
                <p style="color:#78350F;font-size:13px;line-height:1.5;margin:0;">
                  <strong>Ce que vous pouvez faire :</strong> {role_guide}
                </p>
              </div>

              <!-- Action CTA Button -->
              <table role="presentation" style="width:100%;text-align:center;margin:0 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="{login_url}" target="_blank" style="display:inline-block;background-color:#1B2A4E;color:#FFFFFF;padding:14px 32px;font-size:14px;font-weight:bold;text-decoration:none;border-radius:10px;box-shadow:0 4px 12px rgba(27,42,78,0.25);">
                      Accéder à mon Espace Connecté
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#94A3B8;font-size:12px;line-height:1.5;margin:0;border-top:1px solid #E2E8F0;padding-top:16px;">
                <strong>Consigne de sécurité :</strong> Pour des raisons de confidentialité, nous vous recommandons de remplacer ce mot de passe temporaire dès votre première connexion dans les réglages de votre profil.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F8FAFC;padding:20px 30px;border-top:1px solid #E2E8F0;text-align:center;">
              <p style="color:#94A3B8;font-size:11px;margin:0;">
                LAHAThèque • Éditions LAHA & Réseau Universitaire Africain<br>
                Pour toute question ou assistance technique : <a href="mailto:contact@lahacademia.com" style="color:#B08D42;text-decoration:none;">contact@lahacademia.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'LAHATHEQUE <contact@lahacademia.com>')
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[user.email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        logger.info(f"Email de bienvenue avec accès transmis avec succès à {user.email}")
        return True
    except Exception as e:
        logger.error(f"Erreur lors de l'envoi de l'email de bienvenue à {user.email}: {e}")
        return False


def send_custom_notification_email(recipient_email: str, recipient_name: str, subject: str, body_text: str) -> bool:
    """
    Envoie un email personnalisé rédigé par l'administrateur.
    """
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F7FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1E293B;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#F5F7FA;padding:30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width:600px;width:100%;border-collapse:collapse;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #E2E8F0;">
          <tr>
            <td style="background-color:#1B2A4E;padding:24px 30px;text-align:center;">
              <h1 style="color:#FFFFFF;font-size:22px;font-weight:bold;margin:0;">LAHAThèque</h1>
              <p style="color:#B08D42;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:4px 0 0 0;">Communication Administrative Officielle</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px;">
              <h2 style="color:#0F1A33;font-size:16px;font-weight:bold;margin:0 0 16px 0;">Bonjour {recipient_name},</h2>
              <div style="color:#334155;font-size:14px;line-height:1.6;white-space:pre-wrap;background-color:#F8FAFC;padding:16px;border-radius:10px;border:1px solid #E2E8F0;">{body_text}</div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F8FAFC;padding:16px 30px;border-top:1px solid #E2E8F0;text-align:center;">
              <p style="color:#94A3B8;font-size:11px;margin:0;">LAHAThèque • contact@lahacademia.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
 </body>
</html>
"""
    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'LAHATHEQUE <contact@lahacademia.com>')
        msg = EmailMultiAlternatives(
            subject=subject,
            body=body_text,
            from_email=from_email,
            to=[recipient_email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        return True
    except Exception as e:
        logger.error(f"Erreur envoi email personnalisé à {recipient_email}: {e}")
        return False


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
            except Exception:
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

            # Envoi automatique de l'e-mail de bienvenue avec identifiants
            email_sent = send_account_creation_welcome_email(user, temp_password)

            return Response({
                "success": True,
                "message": f"Compte {ROLE_LABELS.get(data['role'], data['role'])} créé avec succès. Un e-mail d'accès sécurisé a été transmis au titulaire.",
                "user": UserSerializer(user).data,
                "email_sent": email_sent
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": f"Erreur de création: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, pk=None):
        """
        DELETE /api/v1/admin/users/<id>/
        Suppression définitive d'un compte utilisateur. Accessible aux rôles admin et super_admin.
        """
        try:
            user = User.objects.get(id=pk)
            user_email = user.email
            user.delete()
            return Response({
                "success": True,
                "message": f"Le compte {user_email} a été supprimé définitivement."
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

    def partial_update(self, request, pk=None):
        """PATCH /api/v1/admin/users/<id>/ - Modification d'un compte existant."""
        try:
            user = User.objects.get(id=pk)
        except User.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

        allowed_fields = ['first_name', 'last_name', 'phone', 'role', 'is_active', 'country', 'pen_name']
        updated_fields = []

        for field in allowed_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
                updated_fields.append(field)

        if 'email' in request.data:
            new_email = request.data['email'].strip().lower()
            if new_email != user.email and User.objects.filter(email=new_email).exclude(id=user.id).exists():
                return Response({"error": "Cet email est déjà utilisé par un autre compte."}, status=400)
            user.email = new_email
            user.username = new_email
            updated_fields.extend(['email', 'username'])

        if updated_fields:
            user.save(update_fields=updated_fields)

        return Response({
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "is_active": user.is_active,
            "phone": user.phone,
            "country": user.country,
        })

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

            # Envoyer le nouveau mot de passe par email
            send_account_creation_welcome_email(user, new_password)

            return Response({
                "success": True,
                "message": f"Nouveau mot de passe temporaire généré et envoyé par email à {user.email}."
            })
        except User.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

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
                return Response({"error": "L'objet et le message sont obligatoires."}, status=status.HTTP_400_BAD_REQUEST)

            recipient_name = f"{user.first_name} {user.last_name}".strip() or user.email
            ok = send_custom_notification_email(user.email, recipient_name, subject, message)

            if ok:
                return Response({
                    "success": True,
                    "message": f"Email transmis avec succès à {user.email}."
                })
            else:
                return Response({
                    "success": False,
                    "error": "Échec de l'envoi de l'email via le serveur SMTP."
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except User.DoesNotExist:
            return Response({"error": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)
