import uuid
from django.db import models
from django.conf import settings

class ContactMessage(models.Model):
    """
    Journal des messages et demandes d'assistance envoyés via le formulaire de contact.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, verbose_name="Nom complet")
    email = models.EmailField(verbose_name="Adresse email")
    role = models.CharField(max_length=50, blank=True, default="lecteur", verbose_name="Rôle utilisateur")
    subject = models.CharField(max_length=255, verbose_name="Sujet de la demande")
    message = models.TextField(verbose_name="Message")
    is_processed = models.BooleanField(default=False, verbose_name="Traité par le support")
    admin_notes = models.TextField(blank=True, default="", verbose_name="Notes internes")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date d'envoi")

    class Meta:
        db_table = "communications_contact_message"
        ordering = ["-created_at"]
        verbose_name = "Message Support"
        verbose_name_plural = "Messages Support"

    def __str__(self) -> str:
        return f"{self.subject} - {self.name} ({self.created_at.strftime('%d/%m/%Y %H:%M')})"


class GuideCategory(models.Model):
    """
    Catégorie de guide d'utilisation (ex: 'Mon Compte', 'Paiements', 'Lecteur & Annotations')
    Filtrée automatiquement selon les rôles cibles.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    roles = models.JSONField(
        default=list, 
        help_text='Liste des rôles cibles (ex: ["student", "wholesaler", "university", "publisher", "author", "manager", "layout_artist", "chief_layout", "legal_reviewer", "admin"])'
    )
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'guide_categories'
        verbose_name = "Catégorie de Guide"
        verbose_name_plural = "Catégories de Guide"
        ordering = ['order', 'title']

    def __str__(self):
        return self.title


class GuideArticle(models.Model):
    """
    Article ou Question/Réponse au sein d'une catégorie.
    Contient du texte HTML riche généré par Tiptap, avec images et vidéos.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(GuideCategory, on_delete=models.CASCADE, related_name='articles')
    title = models.CharField(max_length=200, help_text="Titre ou question de l'article")
    content = models.TextField(help_text="Contenu HTML Tiptap ou Markdown")
    video_url = models.URLField(blank=True, null=True, help_text="Lien vidéo externe (YouTube, Vimeo, MP4 direct...)")
    stream_id = models.CharField(max_length=100, blank=True, verbose_name="ID Cloudflare Stream")
    image = models.ImageField(upload_to='guides/images/%Y/%m/', blank=True, null=True)
    image_url = models.URLField(blank=True, null=True, verbose_name="URL Image Cloudflare R2 / Cloudinary")
    order = models.IntegerField(default=0)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'guide_articles'
        verbose_name = "Article de Guide"
        verbose_name_plural = "Articles de Guide"
        ordering = ['order', 'title']

    def __str__(self):
        return self.title


class EmailNotificationLog(models.Model):
    """
    Journalisation immuable de chaque envoi d'email transactionnel ou notification.
    Trace le fournisseur utilisé (Resend ou SMTP), l'état de délivrance, les pièces jointes et les erreurs.
    """
    class Status(models.TextChoices):
        PENDING = "pending", "En cours"
        SENT = "sent", "Envoyé avec succès"
        DELIVERED = "delivered", "Délivré"
        FAILED = "failed", "Échec d'envoi"

    class Provider(models.TextChoices):
        RESEND = "resend", "Resend API REST"
        SMTP = "smtp", "SMTP Professionnel"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient_email = models.EmailField(db_index=True, verbose_name="Adresse email destinataire")
    recipient_name = models.CharField(max_length=255, blank=True, default="", verbose_name="Nom du destinataire")
    email_type = models.CharField(max_length=64, db_index=True, verbose_name="Type de notification / Template")
    subject = models.CharField(max_length=255, verbose_name="Objet de l'email")
    provider_used = models.CharField(max_length=16, choices=Provider.choices, default=Provider.RESEND, verbose_name="Fournisseur employé")
    provider_message_id = models.CharField(max_length=128, blank=True, default="", verbose_name="Identifiant message fournisseur")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True, verbose_name="Statut d'envoi")
    has_attachment = models.BooleanField(default=False, verbose_name="Contient une ou plusieurs pièces jointes")
    attachment_names = models.JSONField(default=list, blank=True, verbose_name="Liste des noms de pièces jointes (ex: factures PDF)")
    error_message = models.TextField(blank=True, default="", verbose_name="Détail de l'erreur en cas d'échec")
    retry_count = models.PositiveIntegerField(default=0, verbose_name="Nombre de tentatives d'envoi")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="Date de création de la demande")
    sent_at = models.DateTimeField(null=True, blank=True, verbose_name="Date effective d'envoi")

    class Meta:
        db_table = "communications_email_notification_log"
        ordering = ["-created_at"]
        verbose_name = "Journal Email Notification"
        verbose_name_plural = "Journaux Emails & Notifications"

    def __str__(self) -> str:
        return f"[{self.get_status_display()}] {self.email_type} -> {self.recipient_email} ({self.created_at.strftime('%d/%m/%Y %H:%M')})"


class PartnershipSubmission(models.Model):
    """
    Journal et persistance des demandes de conventions et partenariats institutionnels/B2B.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    partner_type = models.CharField(max_length=64, verbose_name="Type de partenariat")
    organization_name = models.CharField(max_length=255, verbose_name="Nom de l'organisation")
    contact_name = models.CharField(max_length=255, verbose_name="Nom & Fonction du contact")
    contact_email = models.EmailField(verbose_name="Adresse e-mail")
    contact_phone = models.CharField(max_length=64, verbose_name="Téléphone / WhatsApp")
    country = models.CharField(max_length=64, verbose_name="Pays")
    message = models.TextField(blank=True, default="", verbose_name="Détails du besoin")
    is_processed = models.BooleanField(default=False, verbose_name="Traité par la direction")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de soumission")

    class Meta:
        db_table = "communications_partnership_submission"
        ordering = ["-created_at"]
        verbose_name = "Demande de Partenariat"
        verbose_name_plural = "Demandes de Partenariats"

    def __str__(self) -> str:
        return f"{self.organization_name} ({self.partner_type}) - {self.contact_name}"


class ManuscriptPublicSubmission(models.Model):
    """
    Journal et persistance des soumissions de manuscrits déposés par les auteurs.
    Gère les métadonnées, le stockage sécurisé et le lien de téléchargement direct.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=64, unique=True, db_index=True, verbose_name="N° de dossier")
    first_name = models.CharField(max_length=128, verbose_name="Prénom")
    last_name = models.CharField(max_length=128, verbose_name="Nom")
    email = models.EmailField(verbose_name="Adresse e-mail de l'auteur")
    phone = models.CharField(max_length=64, verbose_name="Téléphone / WhatsApp")
    book_title = models.CharField(max_length=255, verbose_name="Titre du manuscrit")
    genre = models.CharField(max_length=128, verbose_name="Genre littéraire / Discipline")
    country = models.CharField(max_length=64, verbose_name="Pays")
    summary = models.TextField(verbose_name="Résumé / Description de l'œuvre")
    manuscript_file = models.FileField(upload_to="manuscripts/%Y/%m/", blank=True, null=True, verbose_name="Fichier manuscrit")
    file_size_bytes = models.BigIntegerField(default=0, verbose_name="Taille en octets")
    file_size_formatted = models.CharField(max_length=32, blank=True, default="", verbose_name="Taille formatée")
    file_url = models.URLField(max_length=1000, blank=True, default="", verbose_name="URL de téléchargement direct")
    status = models.CharField(max_length=32, default="pending", verbose_name="Statut d'instruction")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de dépôt")

    class Meta:
        db_table = "communications_manuscript_submission"
        ordering = ["-created_at"]
        verbose_name = "Soumission de Manuscrit"
        verbose_name_plural = "Soumissions de Manuscrits"

    def __str__(self) -> str:
        return f"[{self.reference}] {self.book_title} - {self.first_name} {self.last_name}"

