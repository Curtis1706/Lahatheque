import logging
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from .models import ContactMessage, GuideItem
from .serializers import GuideItemSerializer

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

    # 1. Enregistrement en base de données
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

    # 2. Notification email (silencieuse si SMTP non configuré en dev)
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


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Seul l'Administrateur peut créer, modifier ou supprimer des guides.
    Tout utilisateur (ou visiteur) peut lire les guides autorisés pour son rôle.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and (request.user.role in ['admin', 'super_admin'] or request.user.is_staff))


class GuideViewSet(viewsets.ModelViewSet):
    """
    CRUD complet pour les Guides d'utilisation.
    - Filtrage automatique selon le rôle de l'utilisateur connecté
    - L'Admin accède à l'intégralité des guides pour création / édition / suppression.
    """
    queryset = GuideItem.objects.all()
    serializer_class = GuideItemSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        role_filter = self.request.query_params.get('role', None)

        # Si l'Admin souhaite filtrer ou lister
        if user.is_authenticated and user.role in ['admin', 'super_admin']:
            if role_filter and role_filter != 'all':
                return GuideItem.objects.filter(target_role=role_filter)
            return GuideItem.objects.all()

        # Utilisateur connecté spécifique (non-admin) : il ne voit QUE les guides de son rôle
        if user.is_authenticated:
            user_role = user.role
            # Mappe le rôle réel vers les guides
            allowed_roles = [user_role, 'public']
            return GuideItem.objects.filter(is_published=True, target_role__in=allowed_roles)

        # Visiteur non-connecté public
        if role_filter:
            return GuideItem.objects.filter(is_published=True, target_role=role_filter)
        return GuideItem.objects.filter(is_published=True, target_role__in=['public', 'student'])

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)
