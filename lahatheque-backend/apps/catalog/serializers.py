import logging
from rest_framework import serializers
from .models import Ouvrage, BookAuthor, Discipline, Domain, MetadataONIX, Country

logger = logging.getLogger(__name__)


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = '__all__'


class BookAuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookAuthor
        fields = '__all__'


class DisciplineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discipline
        fields = '__all__'


class DomainSerializer(serializers.ModelSerializer):
    discipline_name = serializers.CharField(source='discipline.name', read_only=True)

    class Meta:
        model = Domain
        fields = ['id', 'discipline', 'discipline_name', 'name', 'is_active']


class OuvrageReadSerializer(serializers.ModelSerializer):
    """Serializer en lecture — utilisé pour lister / détailler les ouvrages."""
    authors_details = BookAuthorSerializer(source='authors', many=True, read_only=True)
    discipline_detail = DisciplineSerializer(source='discipline', read_only=True)
    discipline_name = serializers.SerializerMethodField()
    disciplines_details = DisciplineSerializer(source='disciplines', many=True, read_only=True)
    disciplines_names = serializers.SerializerMethodField()
    publisher_name = serializers.SerializerMethodField()
    institution_name = serializers.SerializerMethodField()
    authors_names = serializers.SerializerMethodField()
    faculty_name = serializers.CharField(source='faculty', read_only=True)
    is_owned = serializers.SerializerMethodField()
    has_digital_access = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    created_by_id = serializers.SerializerMethodField()

    class Meta:
        model = Ouvrage
        fields = '__all__'

    def get_created_by_name(self, obj):
        if obj.created_by:
            full_name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
            return full_name or obj.created_by.email or "Maquettiste"
        if obj.publisher:
            return obj.publisher.company_name or "Éditeur"
        return "Équipe Éditoriale LAHA"

    def get_created_by_id(self, obj):
        return str(obj.created_by.id) if obj.created_by else ""

    def get_publisher_name(self, obj):
        if getattr(obj, 'publisher_name', None):
            return obj.publisher_name
        if obj.publisher:
            return obj.publisher.company_name or obj.publisher.name or obj.publisher.trade_name
        return ""

    def get_institution_name(self, obj):
        return obj.institution.name if obj.institution else ''

    def get_discipline_name(self, obj):
        if obj.discipline:
            return obj.discipline.name
        if obj.pk and hasattr(obj, 'disciplines') and obj.disciplines.exists():
            first_d = obj.disciplines.first()
            return first_d.name if first_d else ""
        return ""

    def get_disciplines_names(self, obj):
        if obj.pk and hasattr(obj, 'disciplines') and obj.disciplines.exists():
            return [d.name for d in obj.disciplines.all()]
        if obj.discipline:
            return [obj.discipline.name]
        return []

    def get_authors_names(self, obj):
        if obj.pk and obj.authors.exists():
            return ", ".join([f"{a.first_name} {a.last_name}".strip() for a in obj.authors.all()])
        return ""

    def get_is_owned(self, obj) -> bool:
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            from apps.protection.access_service import AccessService
            access_info = AccessService.check_user_book_access(request.user, str(obj.id))
            return bool(access_info.get("access_granted"))
        return False

    def get_has_digital_access(self, obj) -> bool:
        return self.get_is_owned(obj)


# Alias pour rétrocompatibilité
OuvrageSerializer = OuvrageReadSerializer


class OuvrageCreateSerializer(serializers.Serializer):
    """
    Serializer de création — accepte un formulaire multipart/form-data
    envoyé par le maquettiste (ou du JSON pour les champs texte).
    Gère la création de l'Ouvrage + association d'auteurs.
    """
    title = serializers.CharField(max_length=255)
    subtitle = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    isbn = serializers.CharField(max_length=64, required=False, allow_blank=True, default='')
    publisher_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    publisher_id = serializers.CharField(max_length=64, required=False, allow_blank=True, default='')
    authors_names = serializers.CharField(required=False, allow_blank=True, default='')
    author_id = serializers.CharField(max_length=64, required=False, allow_blank=True, default='')
    author_user_id = serializers.CharField(max_length=64, required=False, allow_blank=True, default='')
    summary = serializers.CharField(required=False, allow_blank=True, default='')
    language = serializers.CharField(max_length=50, required=False, allow_blank=True, default='fr')
    format_type = serializers.CharField(max_length=20, required=False, allow_blank=True, default='pdf')
    country = serializers.CharField(max_length=20, required=False, allow_blank=True, default='BJ')
    publication_date = serializers.DateField(required=False, allow_null=True, default=None)
    price_digital = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, default=5000.00
    )
    price_paper = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, default=7500.00
    )
    price_audio = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True, default=None
    )
    has_audio_version = serializers.BooleanField(required=False, default=False)
    is_paper_available = serializers.BooleanField(required=False, default=False)

    # Classification
    faculty = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    department = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    keywords = serializers.CharField(required=False, allow_blank=True, default='')
    target_audience = serializers.CharField(max_length=128, required=False, allow_blank=True, default='')
    dewey_code = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    discipline_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    disciplines = serializers.CharField(required=False, allow_blank=True, default='')
    discipline_names = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    institution_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    pre_edition_dossier_id = serializers.CharField(required=False, allow_blank=True, default='')
    authors_emails = serializers.CharField(required=False, allow_blank=True, default='')
    classification_source = serializers.CharField(max_length=30, required=False, allow_blank=True, default='ai_suggested')
    language_source = serializers.CharField(max_length=30, required=False, allow_blank=True, default='ai_suggested')
    summary_source = serializers.CharField(max_length=30, required=False, allow_blank=True, default='ai_suggested')

    # Support Direct-to-R2 (Presigned upload)
    file_key = serializers.CharField(required=False, allow_blank=True, default='')
    cover_key = serializers.CharField(required=False, allow_blank=True, default='')
    file_size_bytes = serializers.IntegerField(required=False, default=0)

    # Fichiers (optionnels — fallback multipart)
    book_file = serializers.FileField(required=False, allow_null=True)
    cover_image = serializers.FileField(required=False, allow_null=True)

    def create(self, validated_data):
        from django.apps import apps
        Institution = apps.get_model('partners', 'Institution')

        user = self.context['request'].user

        # Résolution du dossier de pré-édition
        dossier = None
        dossier_id = validated_data.pop('pre_edition_dossier_id', '')
        if dossier_id:
            from apps.rights.models import PreEditionDossier
            dossier = PreEditionDossier.objects.filter(id=dossier_id).first()

        # Résolution des disciplines multiples & principale
        discipline_obj = None
        discipline_name = validated_data.pop('discipline_name', '')
        disciplines_input_list = validated_data.pop('discipline_names', [])
        disciplines_str = validated_data.pop('disciplines', '')

        all_disc_names = []
        if isinstance(disciplines_input_list, list):
            all_disc_names.extend([str(d).strip() for d in disciplines_input_list if str(d).strip()])
        if isinstance(disciplines_str, str) and disciplines_str.strip():
            all_disc_names.extend([d.strip() for d in disciplines_str.split(',') if d.strip()])
        if discipline_name and discipline_name not in all_disc_names:
            all_disc_names.insert(0, discipline_name)

        disciplines_objs = []
        for d_name in all_disc_names:
            d_item = Discipline.objects.filter(name__iexact=d_name).first()
            if not d_item:
                d_item, _ = Discipline.objects.get_or_create(
                    name=d_name,
                    defaults={'code_dewey': validated_data.get('dewey_code', '')}
                )
            disciplines_objs.append(d_item)

        if disciplines_objs:
            discipline_obj = disciplines_objs[0]
        elif discipline_name:
            discipline_obj, _ = Discipline.objects.get_or_create(
                name=discipline_name,
                defaults={'code_dewey': validated_data.get('dewey_code', '')}
            )
            disciplines_objs = [discipline_obj]

        # Résolution de l'institution par nom
        institution_obj = None
        institution_name = validated_data.pop('institution_name', '')
        if institution_name and 'non affilié' not in institution_name.lower():
            institution_obj = Institution.objects.filter(
                name__icontains=institution_name.split('(')[0].strip()
            ).first()

        # Résolution du diffuseur / éditeur
        publisher_obj = None
        publisher_id = validated_data.pop('publisher_id', '')
        publisher_name = validated_data.pop('publisher_name', '')
        from apps.publishers_portal.models import Publisher
        if publisher_id:
            try:
                publisher_obj = Publisher.objects.filter(id=publisher_id).first()
            except Exception:
                publisher_obj = None
        if not publisher_obj and publisher_name:
            publisher_obj = Publisher.objects.filter(company_name__iexact=publisher_name.strip()).first() or \
                            Publisher.objects.filter(name__iexact=publisher_name.strip()).first() or \
                            Publisher.objects.filter(company_name__icontains=publisher_name.strip()).first()
        resolved_publisher_name = publisher_name.strip() if publisher_name else (publisher_obj.company_name if publisher_obj else "")

        # Extraction des identifiants et données d'auteurs
        author_id = validated_data.pop('author_id', '')
        author_user_id = validated_data.pop('author_user_id', '')
        authors_names = validated_data.pop('authors_names', '')
        authors_emails = validated_data.pop('authors_emails', '')
        file_key = validated_data.pop('file_key', '')
        cover_key = validated_data.pop('cover_key', '')
        file_size_bytes = validated_data.pop('file_size_bytes', 0)
        book_file = validated_data.pop('book_file', None)
        cover_image = validated_data.pop('cover_image', None)
        validated_data.pop('dewey_code_field', None)

        raw_country = validated_data.get('country', 'BJ') or 'BJ'
        country_code = 'GL' if raw_country.upper() in ('GLOBAL', 'INTERNATIONAL') else raw_country[:2].upper()

        raw_keywords = validated_data.get('keywords', '')
        if isinstance(raw_keywords, str):
            keywords_list = [k.strip() for k in raw_keywords.split(',') if k.strip()] if raw_keywords.strip() else []
        elif isinstance(raw_keywords, list):
            keywords_list = raw_keywords
        else:
            keywords_list = []

        # Recherche d'un dépôt existant en cours de traitement pour éviter les doublons
        existing_ouvrage = None
        if dossier:
            existing_ouvrage = Ouvrage.objects.filter(
                created_by=user,
                pre_edition_dossier=dossier,
                status__in=['draft', 'submitted', 'pending_validation', 'revision_requested']
            ).first()

        if not existing_ouvrage and validated_data.get('isbn'):
            clean_isbn = validated_data.get('isbn', '').strip()
            if clean_isbn and not clean_isbn.startswith('0000'):
                existing_ouvrage = Ouvrage.objects.filter(
                    created_by=user,
                    isbn=clean_isbn,
                    status__in=['draft', 'submitted', 'pending_validation', 'revision_requested']
                ).first()

        if not existing_ouvrage:
            existing_ouvrage = Ouvrage.objects.filter(
                created_by=user,
                title__iexact=validated_data['title'].strip(),
                status__in=['draft', 'submitted', 'pending_validation', 'revision_requested']
            ).first()

        if existing_ouvrage:
            ouvrage = existing_ouvrage
            ouvrage.title = validated_data['title']
            ouvrage.subtitle = validated_data.get('subtitle', '')
            ouvrage.isbn = validated_data.get('isbn', '')[:64]
            ouvrage.summary = validated_data.get('summary', '')
            ouvrage.language = validated_data.get('language', 'fr')[:10]
            ouvrage.format_type = validated_data.get('format_type', 'pdf').lower()[:20]
            ouvrage.country = country_code
            ouvrage.publication_date = validated_data.get('publication_date')
            ouvrage.price_digital = validated_data.get('price_digital', 5000.00)
            ouvrage.price_paper = validated_data.get('price_paper', 7500.00)
            if 'price_audio' in validated_data:
                ouvrage.price_audio = validated_data.get('price_audio')
            if 'has_audio_version' in validated_data:
                ouvrage.has_audio_version = validated_data.get('has_audio_version', False)
            ouvrage.is_paper_available = validated_data.get('is_paper_available', False)
            ouvrage.faculty = validated_data.get('faculty', '')
            ouvrage.department = validated_data.get('department', '')
            ouvrage.keywords = keywords_list
            ouvrage.target_audience = validated_data.get('target_audience', '')
            ouvrage.dewey_code = validated_data.get('dewey_code', '')
            ouvrage.classification_source = validated_data.get('classification_source', 'ai_suggested')
            ouvrage.language_source = validated_data.get('language_source', 'ai_suggested')
            ouvrage.summary_source = validated_data.get('summary_source', 'ai_suggested')
            ouvrage.discipline = discipline_obj
            ouvrage.institution = institution_obj
            ouvrage.publisher = publisher_obj or ouvrage.publisher
            ouvrage.pre_edition_dossier = dossier
            ouvrage.rejection_reason = ''  # Réinitialiser le motif de rejet lors d'une nouvelle soumission
        else:
            ouvrage = Ouvrage.objects.create(
                title=validated_data['title'],
                subtitle=validated_data.get('subtitle', ''),
                isbn=validated_data.get('isbn', '')[:64],
                summary=validated_data.get('summary', ''),
                language=validated_data.get('language', 'fr')[:10],
                format_type=validated_data.get('format_type', 'pdf').lower()[:20],
                country=country_code,
                publication_date=validated_data.get('publication_date'),
                price_digital=validated_data.get('price_digital', 5000.00),
                price_paper=validated_data.get('price_paper', 7500.00),
                price_audio=validated_data.get('price_audio', None),
                has_audio_version=validated_data.get('has_audio_version', False),
                is_paper_available=validated_data.get('is_paper_available', False),
                faculty=validated_data.get('faculty', ''),
                department=validated_data.get('department', ''),
                keywords=keywords_list,
                target_audience=validated_data.get('target_audience', ''),
                dewey_code=validated_data.get('dewey_code', ''),
                classification_source=validated_data.get('classification_source', 'ai_suggested'),
                language_source=validated_data.get('language_source', 'ai_suggested'),
                summary_source=validated_data.get('summary_source', 'ai_suggested'),
                discipline=discipline_obj,
                institution=institution_obj,
                publisher=publisher_obj,
                publisher_name=resolved_publisher_name,
                pre_edition_dossier=dossier,
                created_by=user,
                status='draft',
            )

        # Association des disciplines ManyToMany
        if disciplines_objs:
            ouvrage.disciplines.set(disciplines_objs)
        elif discipline_obj:
            ouvrage.disciplines.set([discipline_obj])

        # Attribution de la clé R2 ou du fichier joint
        if file_key:
            ouvrage.file.name = file_key
            if file_size_bytes > 0:
                ouvrage.file_size_bytes = file_size_bytes
        elif book_file:
            ouvrage.file = book_file
            ouvrage.file_size_bytes = book_file.size
            try:
                if book_file.name.lower().endswith('.pdf'):
                    import fitz  # PyMuPDF
                    book_file.seek(0)
                    file_bytes = book_file.read()
                    book_file.seek(0)
                    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
                        ouvrage.page_count = doc.page_count
            except Exception:
                pass

        if cover_key:
            ouvrage.cover_image.name = cover_key
        elif cover_image:
            ouvrage.cover_image = cover_image

        ouvrage.save()

        # Réinitialiser les auteurs si mise à jour
        if existing_ouvrage and (authors_names or author_user_id or author_id):
            ouvrage.authors.clear()

        # Résolution de l'auteur sélectionné (User ou BookAuthor)
        from apps.accounts.models import User
        from apps.rights.models import AuthorRight, RepartitionDroits, RoyaltyRate

        selected_author_user = None
        target_uid = author_user_id or author_id
        if target_uid:
            try:
                selected_author_user = User.objects.filter(id=target_uid).first()
            except Exception:
                selected_author_user = None

        # Créer les BookAuthor à partir des noms ou de l'auteur sélectionné
        primary_author_obj = None
        if selected_author_user:
            primary_author_obj, _ = BookAuthor.objects.get_or_create(
                user=selected_author_user,
                defaults={
                    'first_name': selected_author_user.first_name or (authors_names.split(' ')[0] if authors_names else "Auteur"),
                    'last_name': selected_author_user.last_name or (authors_names.split(' ', 1)[1] if ' ' in authors_names else ""),
                    'email': selected_author_user.email
                }
            )
            ouvrage.authors.add(primary_author_obj)

        if authors_names:
            names = [n.strip() for n in authors_names.split(',') if n.strip()]
            emails = [e.strip() for e in authors_emails.split(',') if e.strip()] if authors_emails else []
            for idx, name in enumerate(names):
                parts = name.rsplit(' ', 1)
                first = parts[0] if len(parts) > 1 else name
                last = parts[1] if len(parts) > 1 else ''
                author_email = emails[idx] if idx < len(emails) else ''

                author_user = selected_author_user
                if not author_user and author_email:
                    author_user = User.objects.filter(email__iexact=author_email).first()

                author_obj, created = BookAuthor.objects.get_or_create(
                    first_name=first,
                    last_name=last,
                    defaults={'email': author_email, 'user': author_user}
                )
                if not created and not author_obj.user and author_user:
                    author_obj.user = author_user
                    if author_email:
                        author_obj.email = author_email
                    author_obj.save(update_fields=['user', 'email'])

                ouvrage.authors.add(author_obj)
                if not primary_author_obj:
                    primary_author_obj = author_obj
                if not selected_author_user and author_user:
                    selected_author_user = author_user

                # Si un dossier de pré-édition est lié et possède un auteur_user
                if dossier and dossier.auteur_user and not author_obj.user:
                    author_obj.user = dossier.auteur_user
                    author_obj.email = dossier.auteur_email or author_obj.email
                    author_obj.save(update_fields=['user', 'email'])
                    if not selected_author_user:
                        selected_author_user = dossier.auteur_user

        # ─── Configuration Automatique des Droits & Redevances de Vente ────────────
        try:
            # 1. Barème standard de redevances
            RoyaltyRate.objects.get_or_create(
                ouvrage=ouvrage,
                defaults={
                    "author_share_percent": 70.00 if selected_author_user else 0.00,
                    "publisher_share_percent": 30.00 if publisher_obj else 0.00,
                    "platform_share_percent": 0.00
                }
            )

            # 2. Rattachement du droit d'auteur pour l'auteur sélectionné
            if selected_author_user:
                AuthorRight.objects.get_or_create(
                    ouvrage=ouvrage,
                    user=selected_author_user,
                    defaults={
                        "author": primary_author_obj,
                        "role": "auteur_principal",
                        "pool_share_percent": 100.00
                    }
                )

                RepartitionDroits.objects.get_or_create(
                    ouvrage=ouvrage,
                    beneficiaire=selected_author_user,
                    defaults={
                        "role_libelle": "Auteur Principal",
                        "pourcentage": 100.00,
                        "taux_papier": 10.00,
                        "taux_numerique": 15.00,
                        "taux_audio_tts": 8.00,
                    }
                )

            # 3. Rattachement pour l'Éditeur Tiers partenaire
            if publisher_obj and publisher_obj.user:
                if not RepartitionDroits.objects.filter(ouvrage=ouvrage, beneficiaire=publisher_obj.user).exists():
                    RepartitionDroits.objects.create(
                        ouvrage=ouvrage,
                        beneficiaire=publisher_obj.user,
                        role_libelle="Éditeur Tiers",
                        pourcentage=100.00 if not selected_author_user else 30.00,
                        taux_papier=70.00,
                        taux_numerique=70.00,
                        taux_audio_tts=50.00,
                    )
        except Exception as rights_err:
            logger.warning(f"Impossible d'initialiser les droits d'auteur pour {ouvrage.id}: {rights_err}")

        # Mise à jour du statut du dossier de pré-édition si applicable
        if dossier and dossier.status == 'en_attente_depot':
            dossier.status = 'maquette_en_cours'
            dossier.save(update_fields=['status'])

        return ouvrage


class MetadataONIXSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetadataONIX
        fields = '__all__'
