from rest_framework import serializers
from .models import Ouvrage, BookAuthor, Discipline, MetadataONIX


class BookAuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookAuthor
        fields = '__all__'


class DisciplineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discipline
        fields = '__all__'


class OuvrageReadSerializer(serializers.ModelSerializer):
    """Serializer en lecture — utilisé pour lister / détailler les ouvrages."""
    authors_details = BookAuthorSerializer(source='authors', many=True, read_only=True)
    discipline_detail = DisciplineSerializer(source='discipline', read_only=True)
    publisher_name = serializers.SerializerMethodField()
    institution_name = serializers.SerializerMethodField()
    authors_names = serializers.SerializerMethodField()
    faculty_name = serializers.CharField(source='faculty', read_only=True)
    is_owned = serializers.SerializerMethodField()
    has_digital_access = serializers.SerializerMethodField()

    class Meta:
        model = Ouvrage
        fields = '__all__'

    def get_publisher_name(self, obj):
        return obj.publisher.company_name if obj.publisher else 'LAHA Éditions'

    def get_institution_name(self, obj):
        return obj.institution.name if obj.institution else ''

    def get_authors_names(self, obj):
        if obj.pk and obj.authors.exists():
            return ", ".join([f"{a.first_name} {a.last_name}".strip() for a in obj.authors.all()])
        return ""

    def get_is_owned(self, obj) -> bool:
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            from apps.student.models import ReadingProgress
            return ReadingProgress.objects.filter(user=request.user, ouvrage=obj).exists()
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
    isbn = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    authors_names = serializers.CharField(required=False, allow_blank=True, default='')
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
    is_paper_available = serializers.BooleanField(required=False, default=False)

    # Classification
    faculty = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    department = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    keywords = serializers.CharField(required=False, allow_blank=True, default='')
    target_audience = serializers.CharField(max_length=128, required=False, allow_blank=True, default='')
    dewey_code = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    discipline_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    institution_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    pre_edition_dossier_id = serializers.CharField(required=False, allow_blank=True, default='')
    authors_emails = serializers.CharField(required=False, allow_blank=True, default='')
    classification_source = serializers.CharField(max_length=30, required=False, allow_blank=True, default='ai_suggested')
    language_source = serializers.CharField(max_length=30, required=False, allow_blank=True, default='ai_suggested')
    summary_source = serializers.CharField(max_length=30, required=False, allow_blank=True, default='ai_suggested')

    # Fichiers (optionnels — envoyés en multipart)
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

        # Résolution de la discipline par nom
        discipline_obj = None
        discipline_name = validated_data.pop('discipline_name', '')
        if discipline_name:
            discipline_obj, _ = Discipline.objects.get_or_create(
                name=discipline_name,
                defaults={'code_dewey': validated_data.get('dewey_code', '')}
            )

        # Résolution de l'institution par nom
        institution_obj = None
        institution_name = validated_data.pop('institution_name', '')
        if institution_name and 'non affilié' not in institution_name.lower():
            institution_obj = Institution.objects.filter(
                name__icontains=institution_name.split('(')[0].strip()
            ).first()

        # Extraction des noms et emails d'auteurs
        authors_names = validated_data.pop('authors_names', '')
        authors_emails = validated_data.pop('authors_emails', '')
        book_file = validated_data.pop('book_file', None)
        cover_image = validated_data.pop('cover_image', None)
        validated_data.pop('dewey_code_field', None)

        raw_country = validated_data.get('country', 'BJ') or 'BJ'
        country_code = 'GL' if raw_country.upper() in ('GLOBAL', 'INTERNATIONAL') else raw_country[:2].upper()

        ouvrage = Ouvrage.objects.create(
            title=validated_data['title'],
            subtitle=validated_data.get('subtitle', ''),
            isbn=validated_data.get('isbn', '')[:17],
            summary=validated_data.get('summary', ''),
            language=validated_data.get('language', 'fr')[:10],
            format_type=validated_data.get('format_type', 'pdf').lower()[:20],
            country=country_code,
            publication_date=validated_data.get('publication_date'),
            price_digital=validated_data.get('price_digital', 5000.00),
            price_paper=validated_data.get('price_paper', 7500.00),
            is_paper_available=validated_data.get('is_paper_available', False),
            faculty=validated_data.get('faculty', ''),
            department=validated_data.get('department', ''),
            keywords=validated_data.get('keywords', []),
            target_audience=validated_data.get('target_audience', ''),
            dewey_code=validated_data.get('dewey_code', ''),
            classification_source=validated_data.get('classification_source', 'ai_suggested'),
            language_source=validated_data.get('language_source', 'ai_suggested'),
            summary_source=validated_data.get('summary_source', 'ai_suggested'),
            discipline=discipline_obj,
            institution=institution_obj,
            pre_edition_dossier=dossier,
            created_by=user,
            status='draft',
        )

        if book_file:
            ouvrage.file = book_file
            ouvrage.file_size_bytes = book_file.size

            # Calcul du nombre de pages réel pour les fichiers PDF
            page_count = 0
            try:
                if book_file.name.lower().endswith('.pdf'):
                    import fitz  # PyMuPDF
                    book_file.seek(0)
                    file_bytes = book_file.read()
                    book_file.seek(0)
                    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
                        page_count = doc.page_count
            except Exception:
                page_count = 0  # Ne bloque jamais la création si l'extraction échoue

            ouvrage.page_count = page_count
            ouvrage.save(update_fields=['file', 'file_size_bytes', 'page_count'])

        if cover_image:
            ouvrage.cover_image = cover_image
            ouvrage.save(update_fields=['cover_image'])

        # Créer les BookAuthor à partir des noms et lier les comptes auteurs si fournis
        if authors_names:
            names = [n.strip() for n in authors_names.split(',') if n.strip()]
            emails = [e.strip() for e in authors_emails.split(',') if e.strip()] if authors_emails else []
            for idx, name in enumerate(names):
                parts = name.rsplit(' ', 1)
                first = parts[0] if len(parts) > 1 else name
                last = parts[1] if len(parts) > 1 else ''
                author_email = emails[idx] if idx < len(emails) else ''

                author_user = None
                if author_email:
                    from apps.accounts.models import User
                    author_user = User.objects.filter(email__iexact=author_email, role='author').first()

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

                # Si un dossier de pré-édition est lié et possède un auteur_user
                if dossier and dossier.auteur_user and not author_obj.user:
                    author_obj.user = dossier.auteur_user
                    author_obj.email = dossier.auteur_email or author_obj.email
                    author_obj.save(update_fields=['user', 'email'])

        # Mise à jour du statut du dossier de pré-édition si applicable
        if dossier and dossier.status == 'en_attente_depot':
            dossier.status = 'maquette_en_cours'
            dossier.save(update_fields=['status'])

        return ouvrage


class MetadataONIXSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetadataONIX
        fields = '__all__'
