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


class GuideItem(models.Model):
    """
    Guide d'utilisation créé et administré par l'Admin, ciblé par rôle utilisateur.
    """
    ROLE_CHOICES = [
        ("public", "Grand Public / Visiteurs"),
        ("student", "Lecteurs & Étudiants"),
        ("wholesaler", "Libraires & Grossistes"),
        ("university", "Universités & Partenaires"),
        ("publisher", "Éditeurs Tiers"),
        ("author", "Auteurs"),
        ("manager", "Gestionnaires Logistiques"),
        ("layout_artist", "Maquettistes"),
        ("chief_layout", "Chefs Maquettistes"),
        ("legal_reviewer", "Relecteurs Juridiques"),
        ("admin", "Administrateurs Plateforme"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    target_role = models.CharField(max_length=50, choices=ROLE_CHOICES, default="student", verbose_name="Rôle ciblé")
    category_label = models.CharField(max_length=150, verbose_name="Libellé catégorie")
    title = models.CharField(max_length=255, verbose_name="Titre du guide")
    summary = models.TextField(verbose_name="Résumé / Objectif")
    icon_name = models.CharField(max_length=50, default="BookOpen", verbose_name="Nom de l'icône Lucide")
    image_url = models.URLField(blank=True, default="", verbose_name="URL de l'image d'illustration (Cloudflare R2 / CDN)")
    video_url = models.URLField(blank=True, default="", verbose_name="URL de la vidéo explicative (Cloudflare R2 MP4 / WebM ou externe)")
    content = models.TextField(blank=True, default="", verbose_name="Corps riche (HTML / Markdown)")
    steps = models.JSONField(default=list, verbose_name="Étapes pas-à-pas (JSON)")
    faq = models.JSONField(default=list, blank=True, verbose_name="Questions fréquentes associées (JSON)")
    order = models.IntegerField(default=0, verbose_name="Ordre d'affichage")
    is_published = models.BooleanField(default=True, verbose_name="Publié")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_guides",
        verbose_name="Créé par (Admin)"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Dernière mise à jour")

    class Meta:
        db_table = "communications_guide_item"
        ordering = ["order", "-created_at"]
        verbose_name = "Guide d'Utilisation"
        verbose_name_plural = "Guides d'Utilisation"

    def __str__(self) -> str:
        return f"[{self.get_target_role_display()}] {self.title}"
