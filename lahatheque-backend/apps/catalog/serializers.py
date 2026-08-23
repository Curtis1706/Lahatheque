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


# Alias pour rétrocompatibilité
OuvrageSerializer = OuvrageReadSerializer


class OuvrageCreateSerializer(serializers.Serializer):
    """
    Serializer de création — accepte un formulaire multipart/form-data
    envoyé par le maquettiste (ou du JSON pour les champs texte).
    Gère la création de l'Ouvrage + association d'auteurs.
    """
    title = serializers.CharField(max_length=255)
    subtitle = serializers.CharField(max_length=255, required=False, default='')
    isbn = serializers.CharField(max_length=17, required=False, default='')
    authors_names = serializers.CharField(required=False, default='')
    summary = serializers.CharField(required=False, default='')
    language = serializers.CharField(max_length=10, required=False, default='fr')
    format_type = serializers.ChoiceField(
        choices=['pdf', 'epub', 'audio', 'papier'],
        required=False,
        default='pdf'
    )
    country = serializers.CharField(max_length=2, required=False, default='BJ')
    publication_date = serializers.DateField(required=False, allow_null=True, default=None)
    price_digital = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, default=5000.00
    )
    price_paper = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, default=7500.00
    )

    # Classification
    faculty = serializers.CharField(max_length=255, required=False, default='')
    department = serializers.CharField(max_length=255, required=False, default='')
    keywords = serializers.JSONField(required=False, default=list)
    target_audience = serializers.CharField(max_length=128, required=False, default='')
    dewey_code = serializers.CharField(max_length=20, required=False, default='')
    discipline_name = serializers.CharField(max_length=255, required=False, default='')
    institution_name = serializers.CharField(max_length=255, required=False, default='')

    # Fichiers (optionnels — envoyés en multipart)
    book_file = serializers.FileField(required=False, allow_null=True)
    cover_image = serializers.ImageField(required=False, allow_null=True)

    def create(self, validated_data):
        from django.apps import apps
        Institution = apps.get_model('partners', 'Institution')

        user = self.context['request'].user

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

        # Extraction des noms d'auteurs
        authors_names = validated_data.pop('authors_names', '')
        book_file = validated_data.pop('book_file', None)
        cover_image = validated_data.pop('cover_image', None)
        validated_data.pop('dewey_code_field', None)

        ouvrage = Ouvrage.objects.create(
            title=validated_data['title'],
            subtitle=validated_data.get('subtitle', ''),
            isbn=validated_data.get('isbn', ''),
            summary=validated_data.get('summary', ''),
            language=validated_data.get('language', 'fr'),
            format_type=validated_data.get('format_type', 'pdf'),
            country=validated_data.get('country', 'BJ'),
            publication_date=validated_data.get('publication_date'),
            price_digital=validated_data.get('price_digital', 5000.00),
            price_paper=validated_data.get('price_paper', 7500.00),
            faculty=validated_data.get('faculty', ''),
            department=validated_data.get('department', ''),
            keywords=validated_data.get('keywords', []),
            target_audience=validated_data.get('target_audience', ''),
            dewey_code=validated_data.get('dewey_code', ''),
            discipline=discipline_obj,
            institution=institution_obj,
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

        # Créer les BookAuthor à partir des noms
        if authors_names:
            for name in authors_names.split(','):
                name = name.strip()
                if not name:
                    continue
                parts = name.rsplit(' ', 1)
                first = parts[0] if len(parts) > 1 else name
                last = parts[1] if len(parts) > 1 else ''
                author_obj, _ = BookAuthor.objects.get_or_create(
                    first_name=first,
                    last_name=last,
                )
                ouvrage.authors.add(author_obj)

        return ouvrage


class MetadataONIXSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetadataONIX
        fields = '__all__'
