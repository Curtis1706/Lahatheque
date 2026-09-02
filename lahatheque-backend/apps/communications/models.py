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
