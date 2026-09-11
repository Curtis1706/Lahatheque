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

class Country(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=150)
    phone_code = models.CharField(max_length=20, blank=True, default='')
    currency = models.CharField(max_length=20, blank=True, default='FCFA')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Pays'
        verbose_name_plural = 'Pays'

    def __str__(self):
        return f"{self.name} ({self.code})"

from django.utils.text import slugify

class Ouvrage(models.Model):
    FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('epub', 'EPUB'),
        ('audio', 'Audio'),
        ('papier', 'Livre Papier'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(max_length=280, blank=True, default='', db_index=True)
    isbn = models.CharField(max_length=64, blank=True, default='')
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True)
    publisher = models.ForeignKey('publishers_portal.Publisher', on_delete=models.PROTECT, related_name='ouvrages', null=True, blank=True)
    publisher_name = models.CharField(max_length=255, blank=True, default='', verbose_name="Maison d'édition / Éditeur")
    authors = models.ManyToManyField(BookAuthor, related_name='ouvrages', blank=True)
    discipline = models.ForeignKey(Discipline, null=True, blank=True, on_delete=models.SET_NULL, related_name='ouvrages')
    disciplines = models.ManyToManyField(Discipline, related_name='ouvrages_multi', blank=True)
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
    price_audio = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_audio_eur = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    has_audio_version = models.BooleanField(default=False)
    audio_status = models.CharField(
        max_length=30,
        default='draft',
        choices=[
            ('draft', 'Brouillon'),
            ('pending_layout_validation', 'En attente validation maquette'),
            ('pending_legal_validation', 'En attente validation juridique'),
            ('published', 'Publié'),
            ('rejected', 'Rejeté'),
        ]
    )
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
    def sample_pages_count(self) -> int:
        """
        Nombre de pages de l'extrait gratuit. Il y a TOUJOURS un extrait, quelle que soit la
        taille du fichier (y compris les PDF de test à 4-5 pages), mais il ne donne jamais le
        livre entier — au moins une page reste toujours réservée à l'achat, sauf le cas
        limite d'un livre d'une seule page. Pour les livres suffisamment longs : 12% du
        contenu, plancher 8, plafond 30.
        """
        if not self.page_count or self.page_count <= 0:
            return 10

        if self.page_count == 1:
            return 1

        page_cnt = int(self.page_count)
        max_allowed = page_cnt - 1  # au moins 1 page reste derrière le mur de paiement
        proportional = round(page_cnt * 0.12)
        desired = min(30, max(8, proportional))
        return max(1, min(desired, max_allowed))

    @property
    def price(self):
        return self.price_digital

    @property
    def cover_url(self) -> str:
        if self.cover_image and hasattr(self.cover_image, 'url'):
            url = str(self.cover_image.url)
            if url.startswith('/media/'):
                return f"/api/bff{url}"
            return url
        if self.id:
            return f"/api/bff/catalog/books/{self.id}/cover/"
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

    @property
    def available_languages(self) -> list[str]:
        """Retourne la liste des codes langues disponibles pour cet ouvrage."""
        if self.pk and hasattr(self, 'language_versions'):
            langs = [str(lv.language) for lv in self.language_versions.all() if getattr(lv, 'language', None)]
            if langs:
                return sorted(list(set(langs)))
        return [str(self.language)] if self.language else ['fr']

    @property
    def original_language(self) -> str:
        if hasattr(self, '_original_language_val') and self._original_language_val:
            return self._original_language_val
        if self.pk and hasattr(self, 'language_versions'):
            for lv in self.language_versions.all():
                if lv.is_original and lv.language:
                    return str(lv.language)
        return str(self.language or 'fr')

    @original_language.setter
    def original_language(self, value: str):
        self._original_language_val = value

    @property
    def is_original(self) -> bool:
        if hasattr(self, '_is_original_val'):
            return bool(self._is_original_val)
        return True

    @is_original.setter
    def is_original(self, value: bool):
        self._is_original_val = bool(value)

    @property
    def r2_key(self) -> str:
        if hasattr(self, '_r2_key_val') and self._r2_key_val:
            return self._r2_key_val
        if self.file:
            return str(self.file.name)
        return ""

    @r2_key.setter
    def r2_key(self, value: str):
        self._r2_key_val = value

    def save(self, *args, **kwargs):
        if not self.slug:
            base_title = self.title or f"ouvrage-{uuid.uuid4().hex[:8]}"
            base_slug = slugify(base_title)[:250] or f"ouvrage-{uuid.uuid4().hex[:8]}"
            candidate = base_slug
            counter = 1
            while Ouvrage.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
                candidate = f"{base_slug}-{counter}"
                counter += 1
            self.slug = str(candidate)
        super().save(*args, **kwargs)

        try:
            from .models import OuvrageLanguageVersion
            if self.is_paper_available:
                all_lvs = OuvrageLanguageVersion.objects.filter(ouvrage=self)
                if all_lvs.exists():
                    for ol in all_lvs:
                        if not ol.is_paper_available:
                            ol.is_paper_available = True
                            ol.save(update_fields=['is_paper_available'])
            else:
                OuvrageLanguageVersion.objects.filter(ouvrage=self).update(is_paper_available=False)
        except Exception:
            pass

        try:
            from apps.catalog.views import invalidate_catalog_cache
            invalidate_catalog_cache()
        except Exception:
            pass



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


class OuvrageLanguageVersion(models.Model):
    """
    Déclinaison linguistique d'un ouvrage maître (ex: version originale anglaise, traduction française).
    """
    TRANSLATION_STATUS_CHOICES = [
        ('ready', 'Prêt'),
        ('in_progress', 'En cours de traduction'),
        ('draft', 'Brouillon'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ouvrage = models.ForeignKey(
        Ouvrage,
        on_delete=models.CASCADE,
        related_name='language_versions'
    )
    language = models.CharField(max_length=10, db_index=True)
    is_original = models.BooleanField(default=False, db_index=True)
    title = models.CharField(max_length=255)
    summary = models.TextField(blank=True, default='')
    r2_key_pdf = models.CharField(max_length=512, blank=True, default='')
    r2_key_epub = models.CharField(max_length=512, blank=True, default='')
    r2_key_audio = models.CharField(max_length=512, blank=True, default='')
    cover_url = models.URLField(max_length=1024, blank=True, default='')
    page_count = models.PositiveIntegerField(default=0)
    is_paper_available = models.BooleanField(default=False)
    paper_stock = models.PositiveIntegerField(default=0)
    translation_status = models.CharField(
        max_length=30,
        choices=TRANSLATION_STATUS_CHOICES,
        default='ready',
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_original', 'language']
        constraints = [
            models.UniqueConstraint(
                fields=['ouvrage', 'language'],
                name='unique_ouvrage_language_version'
            )
        ]
        indexes = [
            models.Index(fields=['ouvrage', 'language']),
            models.Index(fields=['language', 'is_original']),
        ]

    def __str__(self) -> str:
        role = "Original" if self.is_original else "Traduction"
        return f"{self.title} [{self.language.upper()}] ({role})"

