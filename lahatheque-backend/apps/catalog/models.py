"""Modèles du catalogue (Ouvrage, BookAuthor, Discipline, Domain, MetadataONIX)."""
import uuid
from django.db import models
from django.conf import settings

class BookAuthor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.EmailField(blank=True, null=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    biography = models.TextField(blank=True)

class Discipline(models.Model):
    name = models.CharField(max_length=255, unique=True)
    code_dewey = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return self.name

class Domain(models.Model):
    discipline = models.ForeignKey(Discipline, on_delete=models.CASCADE, related_name='domains')
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

class Ouvrage(models.Model):
    FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('epub', 'EPUB'),
        ('audio', 'Audio'),
        ('papier', 'Livre Papier'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    isbn = models.CharField(max_length=17, blank=True, default='')
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True)
    publisher = models.ForeignKey('publishers_portal.Publisher', on_delete=models.PROTECT, related_name='ouvrages', null=True, blank=True)
    authors = models.ManyToManyField(BookAuthor, related_name='ouvrages', blank=True)
    discipline = models.ForeignKey(Discipline, null=True, blank=True, on_delete=models.SET_NULL, related_name='ouvrages')
    institution = models.ForeignKey('partners.Institution', null=True, blank=True, on_delete=models.SET_NULL, related_name='ouvrages')
    country = models.CharField(max_length=2, default='BJ')
    format_type = models.CharField(max_length=20, choices=FORMAT_CHOICES, default='pdf')
    file = models.FileField(upload_to='books/', max_length=512, blank=True, null=True)
    file_size_bytes = models.BigIntegerField(default=0)
    page_count = models.IntegerField(default=0)
    publication_date = models.DateField(null=True, blank=True)
    language = models.CharField(max_length=10, default='fr')
    summary = models.TextField(blank=True)
    table_of_contents = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=30, default='draft')
    protection_type = models.CharField(max_length=30, default='lcp')
    price_digital = models.DecimalField(max_digits=10, decimal_places=2, default=5000.00)
    price_paper = models.DecimalField(max_digits=10, decimal_places=2, default=7500.00)
    is_paper_available = models.BooleanField(
        default=False,
        verbose_name="Disponible en version papier",
        help_text="Décision éditoriale du Chef Maquettiste — distincte du prix papier renseigné."
    )
    cover_image = models.ImageField(upload_to='covers/', max_length=512, null=True, blank=True)

    # Traçabilité & dates
    pre_edition_dossier = models.ForeignKey(
        'rights.PreEditionDossier', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='ouvrages'
    )
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='ouvrages_created')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Classification & formulaire Maquettiste
    faculty = models.CharField(max_length=255, blank=True, default='')
    department = models.CharField(max_length=255, blank=True, default='')
    keywords = models.JSONField(default=list, blank=True)
    target_audience = models.CharField(max_length=128, blank=True, default='')
    dewey_code = models.CharField(max_length=50, blank=True, default='')
    classification_source = models.CharField(max_length=30, blank=True, default='ai_suggested')
    language_source = models.CharField(max_length=30, blank=True, default='ai_suggested')
    summary_source = models.CharField(max_length=30, blank=True, default='ai_suggested')
    rejection_reason = models.TextField(
        blank=True, default='',
        verbose_name="Motif de correction ou de rejet",
        help_text="Motif de rejet ou demande de correction émis par le Chef Maquettiste"
    )

    @property
    def price(self):
        return self.price_digital

    @property
    def cover_url(self) -> str:
        if self.cover_image and hasattr(self.cover_image, 'url'):
            return self.cover_image.url
        return ""

    @property
    def titre(self) -> str:
        return str(self.title or '')

    @property
    def auteur(self) -> str:
        if self.pk and hasattr(self, 'authors'):
            authors_qs = getattr(self, 'authors')
            if hasattr(authors_qs, 'all'):
                return ", ".join([f"{a.first_name} {a.last_name}".strip() for a in authors_qs.all()])
        return ""



class Quiz(models.Model):
    """Quiz d'auto-évaluation associé à un ouvrage."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ouvrage = models.ForeignKey(Ouvrage, on_delete=models.CASCADE, related_name='quizzes')
    title = models.CharField(max_length=255, default='Évaluation de lecture')
    description = models.TextField(blank=True, default='')
    is_ai_generated = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='quizzes_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Quiz: {self.title} ({self.ouvrage.title})"


class QuizQuestion(models.Model):
    """Question individuelle d'un quiz (QCM)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    options = models.JSONField(default=list, help_text='Liste des choix : ["Option A", "Option B", ...]')
    correct_index = models.IntegerField(default=0, help_text='Index (0-based) de la bonne réponse')
    explanation = models.TextField(blank=True, default='', help_text='Explication affichée après correction')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        text = str(self.question_text) if self.question_text else ""
        return f"Q{self.order}: {text[:60]}"


class MetadataONIX(models.Model):
    ouvrage = models.OneToOneField(Ouvrage, on_delete=models.CASCADE, related_name='onix_metadata')
    onix_xml = models.TextField()
    onix_version = models.CharField(max_length=10, default='3.0')
    last_imported_at = models.DateTimeField(auto_now=True)
