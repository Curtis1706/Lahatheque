import logging
from rest_framework import permissions, status, viewsets, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from .models import ContactMessage, GuideCategory, GuideArticle
from .serializers import (
    GuideCategorySerializer,
    AdminGuideCategorySerializer,
    AdminGuideArticleSerializer,
    GuideArticleSerializer,
)

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def submit_contact_view(request):
    """
    Endpoint public recevant les soumissions du formulaire de contact,
    enregistrant la demande en base et notifiant l'équipe support.
    """
    name = request.data.get('name', '').strip()
    email = request.data.get('email', '').strip()
    role = request.data.get('role', 'lecteur').strip()
    subject = request.data.get('subject', '').strip()
    message = request.data.get('message', '').strip()

    if not all([name, email, subject, message]):
        return Response({
            'success': False,
            'data': {},
            'error': 'Tous les champs (nom, email, sujet, message) sont obligatoires.'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        contact_record = ContactMessage.objects.create(
            name=name,
            email=email,
            role=role,
            subject=subject,
            message=message,
        )
    except Exception as e:
        logger.error(f"Erreur enregistrement message contact: {e}")
        return Response({
            'success': False,
            'data': {},
            'error': "Impossible d'enregistrer votre message. Veuillez réessayer."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    admin_recipients = getattr(settings, 'SUPPORT_EMAIL_RECIPIENTS', ["contact@lahatheque.bj", "support@lahatheque.bj"])
    email_subject = f"[Support LAHAThèque] Nouveau message ({role}) : {subject}"
    html_body = f"""
    <h3>Nouveau message d'assistance reçu sur LAHAThèque</h3>
    <p><strong>Demandeur :</strong> {name} ({email})</p>
    <p><strong>Profil / Rôle :</strong> {role}</p>
    <p><strong>Sujet :</strong> {subject}</p>
    <hr />
    <p><strong>Message :</strong></p>
    <p style="white-space: pre-wrap;">{message}</p>
    """

    try:
        send_mail(
            subject=email_subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'support@lahatheque.bj'),
            recipient_list=admin_recipients,
            html_message=html_body,
            fail_silently=True
        )
    except Exception as mail_err:
        logger.warning(f"Notification email support non envoyée: {mail_err}")

    return Response({
        'success': True,
        'data': {
            'id': str(contact_record.id),
            'message': 'Votre demande a été transmise avec succès à notre équipe support.'
        },
        'error': None
    }, status=status.HTTP_201_CREATED)


class GuideCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Vue publique / utilisateur connecté pour consulter les guides d'utilisation.
    Filtre automatiquement par le rôle passé en query param ou extrait du compte utilisateur.
    """
    serializer_class = GuideCategorySerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description', 'articles__title', 'articles__content']

    def get_queryset(self):
        role_param = self.request.query_params.get('role')
        if role_param and role_param != 'all':
            return GuideCategory.objects.filter(is_active=True, roles__contains=role_param).order_by('order').distinct()

        user = getattr(self.request, 'user', None)
        user_role = getattr(user, 'role', '') if user and hasattr(user, 'is_authenticated') and user.is_authenticated else ''
        
        if user_role and user_role not in ['admin', 'super_admin']:
            qs = GuideCategory.objects.filter(is_active=True, roles__contains=user_role).order_by('order').distinct()
            if qs.exists():
                return qs

        return GuideCategory.objects.filter(is_active=True).order_by('order').distinct()


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and (getattr(request.user, 'role', '') in ['admin', 'super_admin'] or request.user.is_staff))


class AdminGuideCategoryViewSet(viewsets.ModelViewSet):
    """Vue CRUD admin pour gérer les catégories de guide."""
    queryset = GuideCategory.objects.all().order_by('order')
    serializer_class = AdminGuideCategorySerializer
    permission_classes = [permissions.AllowAny]


class AdminGuideArticleViewSet(viewsets.ModelViewSet):
    """Vue CRUD admin pour créer, modifier et supprimer les articles."""
    queryset = GuideArticle.objects.all().order_by('category', 'order')
    serializer_class = AdminGuideArticleSerializer
    permission_classes = [permissions.AllowAny]
