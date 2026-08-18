from django.db import models
from django.conf import settings
from common.models import UUIDTimestampedModel
from shared.constants import LAHA_COUNTRIES, DEFAULT_COUNTRY

class TargetAudience(models.TextChoices):
    STUDENTS = 'students', 'Ã‰lÃ¨ves'
    TEACHERS = 'teachers', 'Enseignants et Auteurs'

class LibraryBook(UUIDTimestampedModel):
    """
    ModÃ¨le pour les documents de la bibliothÃ¨que numÃ©rique.
    L'admin peut uploader un PDF et l'assigner Ã  plusieurs niveaux scolaires.
    """
    title = models.CharField(max_length=255, verbose_name="Titre du livre")
    description = models.TextField(blank=True, verbose_name="Description")
    file = models.FileField(upload_to='library/books/', verbose_name="Fichier (PDF)")
    thumbnail_url = models.URLField(
        blank=True,
        verbose_name="Miniature du livre",
        help_text="Image PNG de la premiÃ¨re page, gÃ©nÃ©rÃ©e automatiquement Ã  l'upload et stockÃ©e sur R2.",
    )
    cover_image = models.ImageField(
        upload_to='library/covers/', 
        null=True, 
        blank=True, 
        verbose_name="Image de couverture (Custom)",
        help_text="Si fournie, cette image remplacera la miniature gÃ©nÃ©rÃ©e automatiquement."
    )
    audio_file = models.FileField(
        upload_to='library/audio/', 
        null=True, 
        blank=True, 
        verbose_name="Fichier Audio (MP3)",
        help_text="Optionnel : pour les audio-livres ou lectures assistÃ©es."
    )
    
    class Category(models.TextChoices):
        MANUAL = 'manuel', 'Manuel Scolaire'
        ROMAN  = 'roman', 'Roman / LittÃ©rature'
        FICHE  = 'fiche', "Fiche d'analyse"
        SUMMARY = 'summary', 'RÃ©sumÃ© illustrÃ©'
        AUDIO  = 'audio', 'Livre Audio'
        OTHER  = 'autre', 'Autre'

    category = models.CharField(
        max_length=20, 
        choices=Category.choices, 
        default=Category.MANUAL,
        verbose_name="CatÃ©gorie"
    )
    
    subject = models.ForeignKey(
        'academics.Subject', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='library_books',
        verbose_name="MatiÃ¨re"
    )
    grade_levels = models.ManyToManyField('academics.GradeLevel', related_name='library_books', verbose_name="Niveaux scolaires")
    STATUS_CHOICES = [
        ('DRAFT', 'Brouillon'),
        ('REVIEW', 'En rÃ©vision'),
        ('PUBLISHED', 'PubliÃ©'),
        ('REJECTED', 'RejetÃ©'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PUBLISHED', verbose_name="Statut")
    rejection_reason = models.TextField(blank=True, null=True, verbose_name="Raison du refus")

    # GÃ©olocalisation
    is_international = models.BooleanField(
        default=True, 
        verbose_name="Disponible Ã  l'international",
        help_text="Si cochÃ©, le livre sera visible dans tous les pays."
    )
    target_countries = models.JSONField(
        default=list, 
        blank=True, 
        verbose_name="Pays cibles",
        help_text="Liste des codes pays (ex: ['SN', 'CI']) si non international."
    )

    is_active = models.BooleanField(default=True, verbose_name="Actif")
    author_profile = models.ForeignKey(
        'authors.AuthorProfile', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL,
        related_name='library_books',
        verbose_name="Auteur (PropriÃ©taire)"
    )
    
    target_audiences = models.JSONField(
        default=list, 
        blank=True, 
        help_text="Liste des publics cibles : ['students'], ['teachers'], ou les deux"
    )

    class Meta:
        db_table = 'library_books'
        verbose_name = 'Livre numÃ©rique'
        verbose_name_plural = 'Livres numÃ©riques'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class ReadingProgress(UUIDTimestampedModel):
    """
    Suivi automatique de la progression de lecture pour chaque utilisateur.
    Ce modÃ¨le est mis Ã  jour en arriÃ¨re-plan par le lecteur.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='reading_progress',
        verbose_name="Utilisateur"
    )
    book = models.ForeignKey(
        LibraryBook, 
        on_delete=models.CASCADE, 
        related_name='progress_records',
        verbose_name="Livre"
    )
    last_page = models.PositiveIntegerField(default=1, verbose_name="DerniÃ¨re page lue")
    total_pages = models.PositiveIntegerField(default=0, verbose_name="Nombre total de pages")

    class Meta:
        db_table = 'library_reading_progress'
        unique_together = ('user', 'book')
        verbose_name = 'Progression de lecture'
        verbose_name_plural = 'Progressions de lecture'

    def __str__(self):
        return f"{self.user} - {self.book.title} (Page {self.last_page})"

class LibraryAnnotation(UUIDTimestampedModel):
    """
    Stockage des annotations (surlignage et notes) sur les PDF.
    Les donnÃ©es brutes (coordonnÃ©es) sont stockÃ©es en JSON.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='library_annotations',
        verbose_name="Utilisateur"
    )
    book = models.ForeignKey(
        LibraryBook, 
        on_delete=models.CASCADE, 
        related_name='annotations',
        verbose_name="Livre"
    )
    content = models.TextField(blank=True, verbose_name="Commentaire/Note")
    color = models.CharField(max_length=50, default='gold', verbose_name="Couleur du surlignage")
    data = models.JSONField(verbose_name="DonnÃ©es techniques du surlignage")

    class Meta:
        db_table = 'library_annotations'
        verbose_name = 'Annotation'
        verbose_name_plural = 'Annotations'
        ordering = ['-created_at']

    def __str__(self):
        return f"Annotation de {self.user} sur '{self.book.title}'"

class QRBatch(UUIDTimestampedModel):
    """
    Regroupe une gÃ©nÃ©ration de lots de QR codes pour un livre spÃ©cifique.
    Permet de suivre les exports envoyÃ©s Ã  l'imprimeur.
    """
    book = models.ForeignKey(
        'PhysicalBook', 
        on_delete=models.CASCADE, 
        related_name='qr_batches',
        verbose_name="Livre Physique"
    )
    quantity = models.PositiveIntegerField(verbose_name="QuantitÃ© gÃ©nÃ©rÃ©e")
    notes = models.TextField(blank=True, verbose_name="Notes (ex: Imprimeur X, Lot nÂ°5)")
    
    class Meta:
        db_table = 'library_qr_batches'
        verbose_name = 'Lot de QR Codes'
        verbose_name_plural = 'Lots de QR Codes'
        ordering = ['-created_at']

    def __str__(self):
        return f"Lot {self.quantity} - {self.book.title} ({self.created_at.strftime('%d/%m/%Y')})"

class PhysicalBook(UUIDTimestampedModel):
    """
    ReprÃ©sentation d'un livre imprimÃ© (ex: Manuel de Maths 3Ã¨me) qui peut possÃ©der
    des ressources digitales associÃ©es dÃ©blocables par code QR physique.
    """
    title = models.CharField(max_length=255, verbose_name="Titre du livre physique")
    subject = models.ForeignKey(
        'academics.Subject', 
        on_delete=models.PROTECT, 
        related_name='physical_books',
        verbose_name="Matière"
    )
    grade_level = models.ForeignKey(
        'academics.GradeLevel', 
        on_delete=models.PROTECT, 
        related_name='physical_books',
        verbose_name="Niveau scolaire"
    )
    country = models.CharField(
        max_length=2, 
        choices=LAHA_COUNTRIES, 
        default=DEFAULT_COUNTRY,
        verbose_name="Pays"
    )
    cover_image = models.ImageField(
        upload_to='library/physical_covers/', 
        null=True, 
        blank=True, 
        verbose_name="Image de couverture"
    )
    publisher = models.CharField(max_length=255, default='Laha Éditions', verbose_name="Éditeur")
    edition_year = models.PositiveIntegerField(null=True, blank=True, verbose_name="Année d'édition")
    isbn = models.CharField(max_length=20, blank=True, null=True, verbose_name="ISBN")
    
    class Meta:
        db_table = 'library_physical_books'
        verbose_name = 'Livre Physique'
        verbose_name_plural = 'Livres Physiques'
        ordering = ['title']

    def __str__(self):
        return f"{self.title} - {self.grade_level}"

class PhysicalBookChapter(UUIDTimestampedModel):
    """Chapitre d'un livre physique."""
    book = models.ForeignKey(
        PhysicalBook, 
        on_delete=models.CASCADE, 
        related_name='chapters',
        verbose_name="Livre Physique"
    )
    title = models.CharField(max_length=255, verbose_name="Titre du chapitre")
    order = models.PositiveIntegerField(default=0, verbose_name="Ordre d'affichage")

    class Meta:
        db_table = 'library_physical_book_chapters'
        verbose_name = 'Chapitre (Livre Physique)'
        verbose_name_plural = 'Chapitres (Livre Physique)'
        ordering = ['order']

    def __str__(self):
        return f"{self.book.title} - {self.title}"

class PhysicalBookResource(UUIDTimestampedModel):
    """Ressource numÃ©rique liÃ©e Ã  un chapitre de livre physique."""
    class ResourceType(models.TextChoices):
        VIDEO = 'video', 'VidÃ©o explicative'
        PDF = 'pdf', 'Fiche PDF'
        EXERCISE = 'exercise', 'Exercice interactif'
        QCM = 'qcm', 'QCM'
        CORRECTION = 'correction', 'CorrigÃ©'

    chapter = models.ForeignKey(
        PhysicalBookChapter, 
        on_delete=models.CASCADE, 
        related_name='resources',
        verbose_name="Chapitre"
    )
    resource_type = models.CharField(
        max_length=20, 
        choices=ResourceType.choices, 
        default=ResourceType.VIDEO,
        verbose_name="Type de ressource"
    )
    title = models.CharField(max_length=255, verbose_name="Titre de la ressource")
    
    # Liens optionnels vers les contenus existants
    lesson = models.ForeignKey(
        'content.Lesson', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='physical_resources',
        verbose_name="LeÃ§on liÃ©e"
    )
    qcm = models.ForeignKey(
        'assessments.QCM', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='physical_resources',
        verbose_name="QCM liÃ©"
    )
    exercise = models.ForeignKey(
        'assessments.Exercise',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='physical_book_resources',
        verbose_name="Exercice interactif"
    )
    
    # DonnÃ©es directes
    file = models.FileField(
        upload_to='library/physical_resources/', 
        null=True, 
        blank=True, 
        verbose_name="Fichier source"
    )
    file_url = models.URLField(blank=True, verbose_name="URL externe (YouTube, etc.)")
    content = models.TextField(blank=True, null=True, verbose_name="Contenu textuel / HTML (Corrigé)")
    stream_id = models.CharField(max_length=128, blank=True, verbose_name="Cloudflare Stream ID")
    hls_url = models.URLField(blank=True, verbose_name="Lien de streaming HLS")
    
    duration_minutes = models.PositiveIntegerField(null=True, blank=True, verbose_name="Durée (min)")
    page_reference = models.CharField(max_length=20, blank=True, verbose_name="Référence page (ex: p.42)")
    order = models.PositiveIntegerField(default=0, verbose_name="Ordre")

    class Meta:
        db_table = 'library_physical_book_resources'
        verbose_name = 'Ressource (Livre Physique)'
        verbose_name_plural = 'Ressources (Livre Physique)'
        ordering = ['order']

    def __str__(self):
        return f"{self.chapter.title} - {self.title} ({self.get_resource_type_display()})"

class PhysicalBookQRToken(UUIDTimestampedModel):
    """
    Jeton unique gÃ©nÃ©rÃ© en lot et imprimÃ© dans chaque exemplaire physique du livre.
    Un jeton ne peut Ãªtre activÃ© qu'une seule fois.
    """
    token = models.CharField(max_length=128, unique=True, verbose_name="Code Unique")
    book = models.ForeignKey(
        PhysicalBook, 
        on_delete=models.CASCADE, 
        related_name='tokens',
        verbose_name="Livre Physique"
    )
    batch = models.ForeignKey(
        QRBatch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tokens',
        verbose_name="Lot de gÃ©nÃ©ration"
    )
    is_activated = models.BooleanField(default=False, verbose_name="ActivÃ©")
    activated_at = models.DateTimeField(null=True, blank=True, verbose_name="Date d'activation")
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name="Date d'expiration")
    activated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL,
        related_name='activated_physical_books',
        verbose_name="ActivÃ© par"
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="Adresse IP")
    user_agent = models.TextField(null=True, blank=True, verbose_name="User Agent")
    device_info = models.JSONField(null=True, blank=True, verbose_name="Informations du Device")
    device_fingerprint = models.CharField(max_length=255, blank=True, verbose_name="Fingerprint Device")
    access_count = models.PositiveIntegerField(default=0, verbose_name="Nombre d'accÃ¨s")

    class Meta:
        db_table = 'library_physical_book_qr_tokens'
        verbose_name = 'QR Token (Livre)'
        verbose_name_plural = 'QR Tokens (Livres)'

    def __str__(self):
        status = "ActivÃ©" if self.is_activated else "Non ActivÃ©"
        return f"Token {self.token} - {self.book.title} ({status})"

class BookAccess(UUIDTimestampedModel):
    """
    Connexion entre un utilisateur (guest/identifiÃ©) et un accÃ¨s temporaire dÃ©bloquÃ© via QR code.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='book_accesses',
        verbose_name="Utilisateur"
    )
    book = models.ForeignKey(
        PhysicalBook, 
        on_delete=models.CASCADE, 
        related_name='user_accesses',
        verbose_name="Livre Physique"
    )
    expires_at = models.DateTimeField(verbose_name="Date de fin d'accÃ¨s")

    class Meta:
        db_table = 'library_book_accesses'
        unique_together = ('user', 'book')
        verbose_name = 'AccÃ¨s Livre'
        verbose_name_plural = 'AccÃ¨s Livres'

    def __str__(self):
        return f"AccÃ¨s {self.user} -> {self.book.title}"

class BookQuiz(UUIDTimestampedModel):
    """
    Quiz associÃ© Ã  un livre pour valider la lecture.
    """
    book = models.OneToOneField(
        LibraryBook, 
        on_delete=models.CASCADE, 
        related_name='quiz',
        verbose_name="Livre"
    )
    description = models.TextField(blank=True, verbose_name="Description du quiz")
    passing_score = models.PositiveIntegerField(
        default=12, 
        verbose_name="Score de validation (sur 20)",
        help_text="Le score minimum pour que la lecture soit considÃ©rÃ©e comme validÃ©e."
    )

    class Meta:
        db_table = 'library_book_quizzes'
        verbose_name = 'Quiz de livre'
        verbose_name_plural = 'Quiz de livres'

    def __str__(self):
        return f"Quiz: {self.book.title}"

class BookQuestion(UUIDTimestampedModel):
    """
    Question individuelle au sein d'un quiz.
    """
    quiz = models.ForeignKey(
        BookQuiz, 
        on_delete=models.CASCADE, 
        related_name='questions',
        verbose_name="Quiz"
    )
    text = models.TextField(verbose_name="Texte de la question")
    order = models.PositiveIntegerField(default=0, verbose_name="Ordre d'affichage")
    points = models.PositiveIntegerField(default=1, verbose_name="Points")

    class Meta:
        db_table = 'library_book_questions'
        ordering = ['order', 'created_at']
        verbose_name = 'Question de quiz'
        verbose_name_plural = 'Questions de quiz'

    def __str__(self):
        return f"Q: {self.text[:50]}..."

class BookChoice(UUIDTimestampedModel):
    """
    Option de rÃ©ponse pour une question.
    """
    question = models.ForeignKey(
        BookQuestion, 
        on_delete=models.CASCADE, 
        related_name='choices',
        verbose_name="Question"
    )
    text = models.CharField(max_length=255, verbose_name="Texte du choix")
    is_correct = models.BooleanField(default=False, verbose_name="Est la bonne rÃ©ponse")

    class Meta:
        db_table = 'library_book_choices'
        verbose_name = 'Choix de rÃ©ponse'
        verbose_name_plural = 'Choix de rÃ©ponses'

    def __str__(self):
        return self.text

class BookQuizAttempt(UUIDTimestampedModel):
    """
    Enregistrement d'une tentative de quiz par un Ã©lÃ¨ve.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='quiz_attempts',
        verbose_name="Ã‰lÃ¨ve"
    )
    quiz = models.ForeignKey(
        BookQuiz, 
        on_delete=models.CASCADE, 
        related_name='attempts',
        verbose_name="Quiz"
    )
    score = models.FloatField(verbose_name="Score obtenu")
    is_validated = models.BooleanField(default=False, verbose_name="Lecture validÃ©e")
    answers_data = models.JSONField(
        default=dict, 
        verbose_name="DÃ©tail des rÃ©ponses",
        help_text="Stocke les choix faits par l'Ã©lÃ¨ve pour chaque question."
    )

    class Meta:
        db_table = 'library_book_quiz_attempts'
        ordering = ['-created_at']
        verbose_name = 'Tentative de quiz'
        verbose_name_plural = 'Tentatives de quiz'

    def __str__(self):
        status = "ValidÃ©" if self.is_validated else "Ã‰chec"
        return f"{self.user} - {self.quiz.book.title} ({self.score}/20 - {status})"



class ShowcaseBook(UUIDTimestampedModel):
    """Livre vitrine affiché sur la page publique des ouvrages."""
    title = models.CharField(max_length=255, verbose_name="Titre du livre")
    cover_image = models.ImageField(upload_to="library/showcase/", verbose_name="Image de couverture")
    is_active = models.BooleanField(default=True, verbose_name="Actif")
    country = models.CharField(max_length=100, default="International", verbose_name="Pays cible")
    order = models.PositiveIntegerField(default=0, verbose_name="Ordre d'affichage")

    class Meta:
        db_table = "library_showcase_books"
        verbose_name = "Livre Vitrine"
        verbose_name_plural = "Livres Vitrines"
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title
