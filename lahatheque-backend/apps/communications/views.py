import os
import uuid
import logging
from rest_framework import permissions, status, viewsets, filters
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from django.conf import settings
from django.core.files.storage import default_storage
from .models import (
    ContactMessage,
    GuideCategory,
    GuideArticle,
    PartnershipSubmission,
    ManuscriptPublicSubmission,
)
from .serializers import (
    GuideCategorySerializer,
    AdminGuideCategorySerializer,
    AdminGuideArticleSerializer,
    GuideArticleSerializer,
)
from apps.communications.services.email_service import send_transactional_email

logger = logging.getLogger(__name__)

# Liste des emails d'administration LAHAThèque
ADMIN_NOTIFICATION_EMAILS = [
    "lahaeditions1@gmail.com",
    "alhtdharry7@gmail.com",
    "firinzegbenitodossou@gmail.com",
]

PARTNER_TYPE_LABELS = {
    "university": "Université / Faculté / Grande École",
    "publisher": "Éditeur / Maison d'Édition",
    "distributor": "Diffuseur / Librairie / Grossiste Papier",
    "institution": "Ministère / Institution Publique",
    "other": "Autre partenaire",
}

COUNTRY_LABELS = {
    "BJ": "Bénin",
    "CI": "Côte d'Ivoire",
    "SN": "Sénégal",
    "TG": "Togo",
    "GN": "Guinée",
    "GA": "Gabon",
    "CD": "RDC (Congo)",
    "OTHER": "Autre pays",
}


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
        print(f"[CONTACT] Nouveau message #{contact_record.id} de {name} ({email})")
        logger.info(f"Nouveau message contact #{contact_record.id} de {name} ({email})")
    except Exception as e:
        print(f"[CONTACT-ERROR] Impossible d'enregistrer le message: {e}")
        logger.error(f"Erreur enregistrement message contact: {e}")
        return Response({
            'success': False,
            'data': {},
            'error': "Impossible d'enregistrer votre message. Veuillez réessayer."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # 1. Envoi de l'accusé de réception au demandeur
    send_transactional_email(
        email_type="support_contact_ack",
        to_email=email,
        subject=f"Accusé de réception • Votre demande #{str(contact_record.id)[:8]}",
        template_name="emails/support/contact_ack.html",
        context={
            "recipient_name": name,
            "subject_text": subject,
            "message_body": message,
            "ticket_id": str(contact_record.id),
        },
        recipient_name=name,
        async_send=True,
    )

    # 2. Envoi de l'alerte interne aux 3 administrateurs
    send_transactional_email(
        email_type="support_internal_alert",
        to_email=ADMIN_NOTIFICATION_EMAILS,
        subject=f"[Support LAHAThèque] Nouveau message de {name} ({role}) : {subject}",
        template_name="emails/support/internal_alert.html",
        context={
            "sender_name": name,
            "sender_email": email,
            "sender_role": role,
            "subject_text": subject,
            "message_body": message,
            "ticket_id": str(contact_record.id),
        },
        recipient_name="Administration LAHAThèque",
        reply_to=email,
        async_send=True,
    )

    return Response({
        'success': True,
        'data': {
            'id': str(contact_record.id),
            'message': 'Votre demande a été transmise avec succès à notre équipe support.'
        },
        'error': None
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def submit_partnership_view(request):
    """
    Endpoint public recevant les demandes de partenariat et conventions (/partners).
    Enregistre en base et notifie à la fois le demandeur et les 3 administrateurs.
    """
    partner_type = request.data.get('partner_type', 'university').strip()
    org_name = request.data.get('organization_name', '').strip()
    contact_name = request.data.get('contact_name', '').strip()
    contact_email = request.data.get('contact_email', '').strip()
    contact_phone = request.data.get('contact_phone', '').strip()
    country = request.data.get('country', 'BJ').strip()
    message = request.data.get('message', '').strip()

    if not all([org_name, contact_name, contact_email, contact_phone]):
        return Response({
            'success': False,
            'data': {},
            'error': "Veuillez renseigner tous les champs obligatoires (organisation, nom, e-mail, téléphone)."
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        submission = PartnershipSubmission.objects.create(
            partner_type=partner_type,
            organization_name=org_name,
            contact_name=contact_name,
            contact_email=contact_email,
            contact_phone=contact_phone,
            country=country,
            message=message,
        )
        print(f"[PARTNERSHIP] Nouvelle demande de partenariat #{submission.id} - {org_name} ({contact_email})")
        logger.info(f"Nouvelle demande de partenariat #{submission.id} - {org_name} ({contact_email})")
    except Exception as e:
        print(f"[PARTNERSHIP-ERROR] Erreur création demande partenariat: {e}")
        logger.error(f"Erreur création demande partenariat: {e}")
        return Response({
            'success': False,
            'data': {},
            'error': "Une erreur est survenue lors de l'enregistrement de votre demande. Veuillez réessayer."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    partner_type_display = PARTNER_TYPE_LABELS.get(partner_type, partner_type)
    country_display = COUNTRY_LABELS.get(country, country)

    # 1. Email de confirmation / accusé de réception pour le partenaire
    send_transactional_email(
        email_type="partnership_ack",
        to_email=contact_email,
        subject=f"Demande de Partenariat Reçue • LAHAThèque x {org_name}",
        template_name="emails/partners/partnership_ack.html",
        context={
            "recipient_name": contact_name,
            "contact_name": contact_name,
            "organization_name": org_name,
            "partner_type": partner_type,
            "partner_type_display": partner_type_display,
            "country": country,
            "country_name": country_display,
            "message": message,
        },
        recipient_name=contact_name,
        async_send=True,
    )

    # 2. Email d'alerte pour les 3 administrateurs
    send_transactional_email(
        email_type="partnership_admin_alert",
        to_email=ADMIN_NOTIFICATION_EMAILS,
        subject=f"[Partenariat LAHAThèque] Nouvelle demande : {org_name} ({contact_name})",
        template_name="emails/partners/partnership_admin_alert.html",
        context={
            "organization_name": org_name,
            "contact_name": contact_name,
            "contact_email": contact_email,
            "contact_phone": contact_phone,
            "partner_type": partner_type,
            "partner_type_display": partner_type_display,
            "country": country,
            "country_name": country_display,
            "message": message,
        },
        recipient_name="Direction des Partenariats LAHAThèque",
        reply_to=contact_email,
        async_send=True,
    )

    return Response({
        'success': True,
        'data': {
            'id': str(submission.id),
            'organization_name': org_name,
            'message': 'Votre demande de partenariat a été enregistrée avec succès. Notre équipe vous contactera sous 24 à 48 heures.'
        },
        'error': None
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@parser_classes([MultiPartParser, FormParser])
def submit_public_manuscript_view(request):
    """
    Endpoint public de soumission de manuscrit (/authors).
    Gère les uploads volumineux (jusqu'à plusieurs centaines de Mo),
    applique la règle de seuil (10 Mo) pour les pièces jointes,
    persiste le dossier et notifie l'auteur et les 3 administrateurs.
    """
    first_name = request.data.get('first_name', '').strip()
    last_name = request.data.get('last_name', '').strip()
    email = request.data.get('email', '').strip()
    phone = request.data.get('phone', '').strip()
    book_title = request.data.get('book_title', '').strip()
    genre = request.data.get('genre', '').strip()
    country = request.data.get('country', '').strip()
    summary = request.data.get('summary', '').strip()
    manuscript_file = request.FILES.get('manuscript_file')

    if not all([first_name, last_name, email, phone, book_title, genre, country]):
        return Response({
            'success': False,
            'data': {},
            'error': "Veuillez remplir tous les champs obligatoires (prénom, nom, email, téléphone, titre, genre, pays)."
        }, status=status.HTTP_400_BAD_REQUEST)

    if not manuscript_file:
        return Response({
            'success': False,
            'data': {},
            'error': "Le fichier du manuscrit (PDF, DOC ou DOCX) est obligatoire."
        }, status=status.HTTP_400_BAD_REQUEST)

    # Validation de l'extension
    ext = os.path.splitext(manuscript_file.name)[1].lower()
    if ext not in ['.pdf', '.doc', '.docx']:
        return Response({
            'success': False,
            'data': {},
            'error': "Format non supporté. Veuillez joindre un fichier .pdf, .doc ou .docx."
        }, status=status.HTTP_400_BAD_REQUEST)

    # Calcul et formatage du poids
    file_size_bytes = manuscript_file.size
    if file_size_bytes < 1024 * 1024:
        file_size_formatted = f"{file_size_bytes / 1024:.1f} Ko"
    else:
        file_size_formatted = f"{file_size_bytes / (1024 * 1024):.1f} Mo"

    # Génération du numéro de dossier unique
    import random
    rand_code = random.randint(1000, 9999)
    reference = f"DEP-2026-{rand_code}"

    try:
        submission = ManuscriptPublicSubmission.objects.create(
            reference=reference,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
            book_title=book_title,
            genre=genre,
            country=country,
            summary=summary,
            manuscript_file=manuscript_file,
            file_size_bytes=file_size_bytes,
            file_size_formatted=file_size_formatted,
        )

        # Construction de l'URL absolue de téléchargement direct
        if submission.manuscript_file:
            submission.file_url = request.build_absolute_uri(submission.manuscript_file.url)
            submission.save(update_fields=['file_url'])

        print(f"[MANUSCRIPT] Nouveau dépôt {reference} : « {book_title} » par {first_name} {last_name} ({file_size_formatted})")
        logger.info(f"Nouveau dépôt manuscrit {reference} : « {book_title} » par {first_name} {last_name} ({file_size_formatted})")
    except Exception as e:
        print(f"[MANUSCRIPT-ERROR] Erreur enregistrement manuscrit: {e}")
        logger.error(f"Erreur enregistrement manuscrit: {e}")
        return Response({
            'success': False,
            'data': {},
            'error': "Une erreur est survenue lors de l'enregistrement de votre manuscrit. Veuillez réessayer."
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    country_display = COUNTRY_LABELS.get(country, country)

    # 1. Email de confirmation à l'Auteur
    send_transactional_email(
        email_type="manuscript_ack",
        to_email=email,
        subject=f"Dépôt de Manuscrit Confirmé • Dossier #{reference} • LAHAThèque",
        template_name="emails/authors/manuscript_ack.html",
        context={
            "recipient_name": f"{first_name} {last_name}",
            "first_name": first_name,
            "last_name": last_name,
            "reference": reference,
            "book_title": book_title,
            "genre": genre,
            "country": country,
            "country_name": country_display,
            "summary": summary,
            "file_size_formatted": file_size_formatted,
        },
        recipient_name=f"{first_name} {last_name}",
        async_send=True,
    )

    # 2. Gestion de la pièce jointe pour l'alerte comité / administration (Seuil 10 Mo)
    TEN_MB = 10 * 1024 * 1024
    admin_attachments = []
    has_attached = False

    if file_size_bytes <= TEN_MB and submission.manuscript_file:
        try:
            submission.manuscript_file.seek(0)
            file_content = submission.manuscript_file.read()
            mime_type = "application/pdf" if ext == ".pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            admin_attachments.append({
                "filename": f"Manuscrit_{reference}_{manuscript_file.name}",
                "content": file_content,
                "content_type": mime_type,
            })
            has_attached = True
            print(f"[MANUSCRIPT-ATTACH] Manuscrit attaché directement ({file_size_formatted} <= 10 Mo)")
        except Exception as e:
            print(f"[MANUSCRIPT-ATTACH-WARN] Erreur lecture fichier pour pièce jointe: {e}")

    # 3. Email d'alerte pour les 3 administrateurs
    download_url = submission.file_url or f"https://lahatheque.com/media/manuscripts/{manuscript_file.name}"

    send_transactional_email(
        email_type="manuscript_admin_alert",
        to_email=ADMIN_NOTIFICATION_EMAILS,
        subject=f"[Comité Éditorial] Nouveau manuscrit : « {book_title} » par {first_name} {last_name} (Réf: {reference})",
        template_name="emails/authors/manuscript_admin_alert.html",
        context={
            "reference": reference,
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "phone": phone,
            "book_title": book_title,
            "genre": genre,
            "country": country,
            "country_name": country_display,
            "summary": summary,
            "file_size_formatted": file_size_formatted,
            "download_url": download_url,
            "has_attached_file": has_attached,
        },
        recipient_name="Comité Éditorial LAHAThèque",
        attachments=admin_attachments if has_attached else None,
        reply_to=email,
        async_send=True,
    )

    return Response({
        'success': True,
        'data': {
            'id': str(submission.id),
            'reference': reference,
            'book_title': book_title,
            'file_size': file_size_formatted,
            'message': f"Votre manuscrit a été transmis avec succès au comité éditorial sous la référence {reference}."
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
