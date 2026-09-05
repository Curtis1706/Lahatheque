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
    manuscript_file_key = request.data.get('manuscript_file_key', '').strip()

    if not all([first_name, last_name, email, phone, book_title, genre, country]):
        return Response({
            'success': False,
            'data': {},
            'error': "Veuillez remplir tous les champs obligatoires (prénom, nom, email, téléphone, titre, genre, pays)."
        }, status=status.HTTP_400_BAD_REQUEST)

    if not manuscript_file and not manuscript_file_key:
        return Response({
            'success': False,
            'data': {},
            'error': "Le fichier du manuscrit (PDF, DOC ou DOCX) est obligatoire."
        }, status=status.HTTP_400_BAD_REQUEST)

    source_filename = manuscript_file.name if manuscript_file else manuscript_file_key.rsplit('/', 1)[-1]
    ext = os.path.splitext(source_filename)[1].lower()
    if ext not in ['.pdf', '.doc', '.docx']:
        return Response({
            'success': False,
            'data': {},
            'error': "Format non supporté. Veuillez joindre un fichier .pdf, .doc ou .docx."
        }, status=status.HTTP_400_BAD_REQUEST)

    if manuscript_file:
        file_size_bytes = manuscript_file.size
    else:
        file_size_bytes = int(request.data.get('file_size_bytes', 0) or 0)

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
            manuscript_file=manuscript_file if manuscript_file else None,
            manuscript_file_key=manuscript_file_key,
            file_size_bytes=file_size_bytes,
            file_size_formatted=file_size_formatted,
        )

        # Construction de l'URL absolue de téléchargement direct
        if submission.manuscript_file:
            submission.file_url = request.build_absolute_uri(submission.manuscript_file.url)
            submission.save(update_fields=['file_url'])
        elif manuscript_file_key:
            r2_public_domain = getattr(settings, 'CLOUDFLARE_R2_PUBLIC_URL', '') or getattr(settings, 'CLOUDFLARE_R2_PUBLIC_DOMAIN', 'https://pub-98cb000b12874eae9d7deed8a2ead6ee.r2.dev')
            submission.file_url = f"{r2_public_domain.rstrip('/')}/{manuscript_file_key}"
            submission.save(update_fields=['file_url'])

        print(f"[MANUSCRIPT] Nouveau dépôt {reference} : « {book_title} » par {first_name} {last_name} ({file_size_formatted})")
        logger.info(f"Nouveau dépôt manuscrit {reference} : « {book_title} » par {first_name} {last_name} ({file_size_formatted})")

        # Synchronisation automatique dans PublicManuscriptLead pour visibilité admin instantanée
        try:
            from apps.rights.models import PublicManuscriptLead
            PublicManuscriptLead.objects.get_or_create(
                id=submission.id,
                defaults={
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": email,
                    "phone": phone,
                    "book_title": book_title,
                    "genre": genre,
                    "country": country,
                    "summary": summary,
                    "manuscript_file": submission.manuscript_file,
                    "manuscript_file_key": manuscript_file_key,
                    "status": "new",
                }
            )
        except Exception as sync_err:
            logger.warning(f"[MANUSCRIPT-SYNC-WARN] Erreur synchro PublicManuscriptLead: {sync_err}")
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

    if file_size_bytes <= TEN_MB and submission.manuscript_file and not manuscript_file_key:
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
    download_url = submission.file_url or (f"https://lahatheque.com/media/manuscripts/{manuscript_file.name}" if manuscript_file else "")

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


# ==============================================================================
# CARNET DE CONTACTS PROFESSIONNELS (ADMIN & JURISTE)
# ==============================================================================
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Q
from rest_framework.views import APIView
from apps.accounts.permissions import IsAdminOrLegalReviewer
from .models import ProfessionalContact, ContactEmailDispatch
from .serializers import ProfessionalContactSerializer, ContactEmailDispatchSerializer


class ProfessionalContactsListView(APIView):
    """
    Gestion de la liste et création des contacts professionnels (Admin & Juriste).
    """
    permission_classes = [IsAdminOrLegalReviewer]

    def get(self, request):
        qs = ProfessionalContact.objects.all()

        # Recherche textuelle
        q = request.query_params.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q) |
                Q(email__icontains=q) |
                Q(organization__icontains=q) |
                Q(role_or_title__icontains=q) |
                Q(notes__icontains=q)
            )

        # Filtre par catégorie
        category = request.query_params.get('category', '').strip()
        if category and category != 'all':
            qs = qs.filter(category=category)

        # Tri
        ordering = request.query_params.get('ordering', '-created_at').strip()
        valid_orderings = ['-created_at', 'created_at', 'last_name', '-last_name', 'organization', '-organization', '-last_contacted_at', '-emails_sent_count']
        if ordering in valid_orderings:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by('-created_at')

        serializer = ProfessionalContactSerializer(qs, many=True, context={'request': request})
        
        # Statistiques synthétiques (KPIs)
        total_count = ProfessionalContact.objects.count()
        university_count = ProfessionalContact.objects.filter(category=ProfessionalContact.Category.UNIVERSITY).count()
        authors_publishers_count = ProfessionalContact.objects.filter(category__in=[ProfessionalContact.Category.AUTHOR, ProfessionalContact.Category.PUBLISHER]).count()
        total_emails_sent = sum(ProfessionalContact.objects.values_list('emails_sent_count', flat=True))

        return Response({
            'success': True,
            'data': serializer.data,
            'kpis': {
                'total_contacts': total_count,
                'university_count': university_count,
                'authors_publishers_count': authors_publishers_count,
                'total_emails_sent': total_emails_sent,
            },
            'error': None
        })

    def post(self, request):
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        email = request.data.get('email', '').strip().lower()

        if not all([first_name, last_name, email]):
            return Response({
                'success': False,
                'data': {},
                'error': 'Le prénom, le nom et l\'adresse e-mail sont obligatoires.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Vérification des doublons d'adresse e-mail
        if ProfessionalContact.objects.filter(email__iexact=email).exists():
            existing = ProfessionalContact.objects.filter(email__iexact=email).first()
            return Response({
                'success': False,
                'data': {},
                'error': f"Un contact avec l'adresse e-mail '{email}' existe déjà ({existing.first_name} {existing.last_name})."
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = ProfessionalContactSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            contact = serializer.save(
                created_by=request.user,
                email=email
            )
            return Response({
                'success': True,
                'data': ProfessionalContactSerializer(contact, context={'request': request}).data,
                'message': f"Le contact {contact.first_name} {contact.last_name} a été enregistré avec succès."
            }, status=status.HTTP_201_CREATED)

        return Response({
            'success': False,
            'data': {},
            'error': 'Données invalides : ' + str(serializer.errors)
        }, status=status.HTTP_400_BAD_REQUEST)


class ProfessionalContactDetailView(APIView):
    """
    Consultation, modification et suppression unitaire d'un contact professionnel.
    """
    permission_classes = [IsAdminOrLegalReviewer]

    def get_object(self, contact_id):
        try:
            return ProfessionalContact.objects.get(id=contact_id)
        except (ProfessionalContact.DoesNotExist, ValueError):
            return None

    def get(self, request, contact_id):
        contact = self.get_object(contact_id)
        if not contact:
            return Response({'success': False, 'error': 'Contact introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProfessionalContactSerializer(contact, context={'request': request})
        # Récupérer les 10 derniers e-mails envoyés
        dispatches = contact.dispatched_emails.all().order_by('-sent_at')[:10]
        dispatches_data = ContactEmailDispatchSerializer(dispatches, many=True).data

        return Response({
            'success': True,
            'data': {
                **serializer.data,
                'dispatches': dispatches_data
            }
        })

    def patch(self, request, contact_id):
        contact = self.get_object(contact_id)
        if not contact:
            return Response({'success': False, 'error': 'Contact introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        email = request.data.get('email', '').strip().lower()
        if email and email != contact.email.lower():
            if ProfessionalContact.objects.filter(email__iexact=email).exclude(id=contact.id).exists():
                return Response({
                    'success': False,
                    'error': f"L'adresse e-mail '{email}' est déjà utilisée par un autre contact."
                }, status=status.HTTP_400_BAD_REQUEST)

        serializer = ProfessionalContactSerializer(contact, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            updated = serializer.save()
            return Response({
                'success': True,
                'data': ProfessionalContactSerializer(updated, context={'request': request}).data,
                'message': 'Contact mis à jour avec succès.'
            })

        return Response({'success': False, 'error': str(serializer.errors)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, contact_id):
        contact = self.get_object(contact_id)
        if not contact:
            return Response({'success': False, 'error': 'Contact introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        full_name = f"{contact.first_name} {contact.last_name}".strip()
        contact.delete()
        return Response({
            'success': True,
            'message': f"Le contact {full_name} a été supprimé."
        })


class ProfessionalContactBatchDeleteView(APIView):
    """
    Suppression massive d'une liste d'identifiants de contacts.
    """
    permission_classes = [IsAdminOrLegalReviewer]

    def post(self, request):
        ids = request.data.get('contact_ids', [])
        if not ids or not isinstance(ids, list):
            return Response({
                'success': False,
                'error': 'Aucun contact spécifié pour la suppression.'
            }, status=status.HTTP_400_BAD_REQUEST)

        deleted_count, _ = ProfessionalContact.objects.filter(id__in=ids).delete()
        return Response({
            'success': True,
            'deleted_count': deleted_count,
            'message': f"{deleted_count} contact(s) supprimé(s) avec succès."
        })


class ProfessionalContactImportView(APIView):
    """
    Importation massive de contacts professionnels depuis un fichier CSV ou Excel (.xlsx, .xls)
    ou depuis un tableau JSON.
    Gère la détection de colonnes, la normalisation et la détection des doublons.
    """
    permission_classes = [IsAdminOrLegalReviewer]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        uploaded_file = request.FILES.get('file')
        raw_rows = []

        if uploaded_file:
            filename = uploaded_file.name.lower()
            # 1. Traitement Excel via openpyxl (Correction 2)
            if filename.endswith('.xlsx') or filename.endswith('.xls'):
                import openpyxl
                from io import BytesIO
                try:
                    wb = openpyxl.load_workbook(BytesIO(uploaded_file.read()), data_only=True)
                    sheet = wb.active
                    rows = list(sheet.iter_rows(values_only=True))
                    if not rows or len(rows) < 2:
                        return Response({
                            'success': False,
                            'error': 'Le fichier Excel est vide ou ne contient aucune ligne de données.'
                        }, status=status.HTTP_400_BAD_REQUEST)

                    headers = [str(h).strip().lower() if h else "" for h in rows[0]]
                    for row in rows[1:]:
                        if not any(row):
                            continue
                        row_dict = {}
                        for idx, h in enumerate(headers):
                            if h and idx < len(row):
                                val = row[idx]
                                row_dict[h] = str(val).strip() if val is not None else ""
                        raw_rows.append(row_dict)
                except Exception as e:
                    logger.error(f"Erreur lecture fichier Excel : {e}")
                    return Response({
                        'success': False,
                        'error': f"Impossible de lire le fichier Excel : {str(e)}"
                    }, status=status.HTTP_400_BAD_REQUEST)

            # 2. Traitement CSV
            elif filename.endswith('.csv'):
                import csv
                from io import StringIO
                try:
                    content = uploaded_file.read().decode('utf-8-sig', errors='replace')
                    if not content.strip():
                        return Response({
                            'success': False,
                            'error': 'Le fichier CSV est vide.'
                        }, status=status.HTTP_400_BAD_REQUEST)

                    first_sample = content[:4096]
                    try:
                        dialect = csv.Sniffer().sniff(first_sample, delimiters=',;\t')
                    except Exception:
                        dialect = csv.excel
                    
                    reader = csv.DictReader(StringIO(content), dialect=dialect)
                    for row in reader:
                        clean_row = {
                            str(k).strip().lower() if k else "": str(v).strip() if v else ""
                            for k, v in row.items()
                        }
                        if any(clean_row.values()):
                            raw_rows.append(clean_row)
                except Exception as e:
                    logger.error(f"Erreur lecture fichier CSV : {e}")
                    return Response({
                        'success': False,
                        'error': f"Impossible de lire le fichier CSV : {str(e)}"
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'success': False,
                    'error': 'Format de fichier non supporté. Veuillez téléverser un fichier .csv, .xlsx ou .xls.'
                }, status=status.HTTP_400_BAD_REQUEST)

        # 3. Traitement payload JSON direct
        elif isinstance(request.data.get('contacts'), list):
            raw_rows = request.data.get('contacts')
        else:
            return Response({
                'success': False,
                'error': 'Veuillez joindre un fichier CSV/Excel ou transmettre une liste de contacts.'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not raw_rows:
            return Response({
                'success': False,
                'error': 'Aucune ligne exploitable trouvée dans la source fournie.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # 4. Pipeline de normalisation et détection de colonnes unifié
        def find_value(row, candidate_keys):
            for ck in candidate_keys:
                for k, v in row.items():
                    if ck in k:
                        return v
            return ""

        existing_emails = set(ProfessionalContact.objects.values_list('email', flat=True))
        existing_emails_lower = {e.lower() for e in existing_emails if e}

        created_contacts = []
        duplicates_skipped = 0
        seen_in_batch = set()

        category_map = {
            'universite': 'university',
            'université': 'university',
            'university': 'university',
            'academie': 'university',
            'auteur': 'author',
            'author': 'author',
            'editeur': 'publisher',
            'éditeur': 'publisher',
            'publisher': 'publisher',
            'institution': 'institution',
            'ministere': 'institution',
            'ministère': 'institution',
            'partenaire': 'partner',
            'partner': 'partner',
            'presse': 'press',
            'press': 'press',
            'media': 'press',
        }

        for row in raw_rows:
            first_name = find_value(row, ['prénom', 'prenom', 'first_name', 'firstname'])
            last_name = find_value(row, ['nom', 'last_name', 'lastname', 'family_name'])
            email = find_value(row, ['email', 'courriel', 'mail', 'e-mail']).strip().lower()

            # Si seul le nom complet est fourni dans une colonne unique
            if not first_name and not last_name:
                full_name_val = find_value(row, ['nom_complet', 'nom complet', 'name', 'full_name'])
                if full_name_val:
                    parts = full_name_val.split(' ', 1)
                    first_name = parts[0]
                    last_name = parts[1] if len(parts) > 1 else ""

            if not email or '@' not in email:
                continue

            # Détection de doublons dans le batch ou en base de données
            if email in seen_in_batch or email in existing_emails_lower:
                duplicates_skipped += 1
                continue

            seen_in_batch.add(email)

            phone = find_value(row, ['téléphone', 'telephone', 'phone', 'tel', 'whatsapp', 'mobile'])
            organization = find_value(row, ['organisation', 'organization', 'etablissement', 'société', 'societe', 'entreprise', 'universite'])
            role_or_title = find_value(row, ['fonction', 'qualité', 'qualite', 'role', 'title', 'poste'])
            raw_category = find_value(row, ['catégorie', 'categorie', 'category', 'type']).lower()
            category = category_map.get(raw_category, 'other')
            notes = find_value(row, ['notes', 'remarques', 'commentaire', 'description'])

            contact = ProfessionalContact(
                first_name=first_name or "Contact",
                last_name=last_name or "",
                email=email,
                phone=phone,
                organization=organization,
                role_or_title=role_or_title,
                category=category,
                notes=notes,
                created_by=request.user
            )
            created_contacts.append(contact)

        if created_contacts:
            ProfessionalContact.objects.bulk_create(created_contacts)

        return Response({
            'success': True,
            'data': {
                'imported_count': len(created_contacts),
                'duplicates_skipped': duplicates_skipped,
                'total_analyzed': len(raw_rows),
            },
            'message': f"{len(created_contacts)} contact(s) importé(s) avec succès ({duplicates_skipped} doublon(s) ignoré(s))."
        }, status=status.HTTP_201_CREATED if created_contacts else status.HTTP_200_OK)


class ProfessionalContactExportView(APIView):
    """
    Exportation massive des contacts professionnels en format CSV compatible Microsoft Excel (UTF-8 BOM).
    """
    permission_classes = [IsAdminOrLegalReviewer]

    def get(self, request):
        import csv
        qs = ProfessionalContact.objects.all().order_by('last_name', 'first_name')

        ids_param = request.query_params.get('ids', '')
        if ids_param:
            id_list = [i.strip() for i in ids_param.split(',') if i.strip()]
            qs = qs.filter(id__in=id_list)

        category = request.query_params.get('category', '').strip()
        if category and category != 'all':
            qs = qs.filter(category=category)

        q = request.query_params.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q) |
                Q(email__icontains=q) |
                Q(organization__icontains=q)
            )

        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="contacts_lahatheque_{timezone.now().strftime("%Y%m%d_%H%M")}.csv"'

        # Préfixe UTF-8 BOM indispensable pour que Microsoft Excel affiche immédiatement les accents sans problème d'encodage
        response.write('\ufeff')

        writer = csv.writer(response, delimiter=';')
        writer.writerow([
            'Prénom',
            'Nom',
            'Email',
            'Téléphone',
            'Organisation / Établissement',
            'Fonction / Qualité',
            'Catégorie',
            'Dernier contact',
            'Emails envoyés',
            'Notes',
            'Créé le'
        ])

        for c in qs:
            writer.writerow([
                c.first_name,
                c.last_name,
                c.email,
                c.phone,
                c.organization,
                c.role_or_title,
                c.get_category_display(),
                c.last_contacted_at.strftime('%d/%m/%Y %H:%M') if c.last_contacted_at else 'Jamais',
                c.emails_sent_count,
                c.notes.replace('\n', ' '),
                c.created_at.strftime('%d/%m/%Y %H:%M')
            ])

        return response


class ProfessionalContactSendEmailView(APIView):
    """
    Expédition d'e-mails officiels personnalisés via l'infrastructure professionnelle de LAHAThèque.
    Met à jour la traçabilité des contacts et consigne l'envoi dans ContactEmailDispatch.
    """
    permission_classes = [IsAdminOrLegalReviewer]

    def post(self, request):
        contact_ids = request.data.get('contact_ids', [])
        subject = request.data.get('subject', '').strip()
        message_template = request.data.get('message', '').strip()

        if not contact_ids or not isinstance(contact_ids, list):
            return Response({
                'success': False,
                'error': 'Veuillez sélectionner au moins un contact destinataire.'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not subject or not message_template:
            return Response({
                'success': False,
                'error': 'Le sujet et le corps du message sont obligatoires.'
            }, status=status.HTTP_400_BAD_REQUEST)

        contacts = ProfessionalContact.objects.filter(id__in=contact_ids)
        if not contacts.exists():
            return Response({
                'success': False,
                'error': 'Aucun contact valide trouvé parmi les identifiants fournis.'
            }, status=status.HTTP_404_NOT_FOUND)

        sender = request.user
        sender_full_name = f"{sender.first_name} {sender.last_name}".strip() or sender.email
        sender_role = getattr(sender, 'role', '')
        if sender_role in ['super_admin', 'admin']:
            sender_role_display = "Direction Générale • Administration LAHAThèque"
        elif sender_role == 'legal_reviewer':
            sender_role_display = "Direction Juridique & Propriété Intellectuelle • LAHAThèque"
        else:
            sender_role_display = "Direction LAHAThèque"

        dispatched_count = 0
        now = timezone.now()

        for contact in contacts:
            # Substitution dynamique des balises personnalisées
            personalized_msg = message_template
            personalized_msg = personalized_msg.replace('{{prenom}}', contact.first_name)
            personalized_msg = personalized_msg.replace('{{first_name}}', contact.first_name)
            personalized_msg = personalized_msg.replace('{{nom}}', contact.last_name)
            personalized_msg = personalized_msg.replace('{{last_name}}', contact.last_name)
            personalized_msg = personalized_msg.replace('{{organisation}}', contact.organization or "votre établissement")
            personalized_msg = personalized_msg.replace('{{organization}}', contact.organization or "votre établissement")

            # Envoi via la façade centrale send_transactional_email
            try:
                send_transactional_email(
                    email_type="pro_contact_direct",
                    to_email=contact.email,
                    subject=subject,
                    template_name="emails/pro_direct_message.html",
                    context={
                        "recipient_name": f"{contact.first_name} {contact.last_name}".strip(),
                        "subject_text": subject,
                        "message_body": personalized_msg,
                        "sender_name": sender_full_name,
                        "sender_role_display": sender_role_display,
                        "sender_email": sender.email,
                    },
                    recipient_name=f"{contact.first_name} {contact.last_name}".strip(),
                    reply_to=sender.email,
                    async_send=True
                )

                # Journalisation dans ContactEmailDispatch
                ContactEmailDispatch.objects.create(
                    contact=contact,
                    sender=sender,
                    subject=subject,
                    body_snippet=personalized_msg[:500],
                    status="sent"
                )

                # Mise à jour des compteurs du contact
                contact.emails_sent_count += 1
                contact.last_contacted_at = now
                contact.save(update_fields=['emails_sent_count', 'last_contacted_at'])
                dispatched_count += 1
            except Exception as err:
                logger.error(f"Échec envoi e-mail au contact {contact.email}: {err}")
                ContactEmailDispatch.objects.create(
                    contact=contact,
                    sender=sender,
                    subject=subject,
                    body_snippet=personalized_msg[:500],
                    status="failed"
                )

        return Response({
            'success': True,
            'data': {
                'sent_count': dispatched_count,
                'total_targeted': contacts.count()
            },
            'message': f"{dispatched_count} e-mail(s) officiel(s) expédié(s) avec succès."
        })

