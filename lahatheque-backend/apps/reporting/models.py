"""Modèles d'analytics et notifications (InstitutionAnalytics, Notification, NotificationPreference)."""
import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings

class InstitutionAnalytics(models.Model):
    institution = models.ForeignKey('partners.Institution', on_delete=models.CASCADE)
    month = models.DateField()
    active_students_count = models.IntegerField(default=0)
    total_pages_read = models.IntegerField(default=0)
    most_read_disciplines = models.JSONField(default=list)

class Notification(models.Model):
    class NotificationType(models.TextChoices):
        SYSTEM = 'system', 'Système'
        MESSAGE = 'message', 'Message'
        BOOKING_CONFIRMED = 'booking_confirmed', 'Réservation Confirmée'
        BOOKING_REMINDER = 'booking_reminder', 'Rappel Réservation'
        COMMUNITY_REPLY = 'community_reply', 'Réponse Communauté'
        EXPERT_QUESTION = 'expert_question', 'Question Expert'
        EXPERT_REPLY = 'expert_reply', 'Réponse Expert'
        ASSIGNMENT_CREATED = 'assignment_created', 'Devoir Créé'
        ASSIGNMENT_GRADED = 'assignment_graded', 'Devoir Noté'
        ASSIGNMENT_SUBMITTED = 'assignment_submitted', 'Devoir Soumis'
        ASSIGNMENT_OVERDUE = 'assignment_overdue', 'Devoir En Retard'
        PAYMENT_SUCCESS = 'payment_success', 'Paiement Confirmé'
        PAYMENT_FAILED = 'payment_failed', 'Paiement Échoué'
        ORDER_SHIPPED = 'order_shipped', 'Commande Expédiée'
        ORDER_DELIVERED = 'order_delivered', 'Commande Livrée'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=NotificationType.choices, default=NotificationType.SYSTEM)
    action_url = models.CharField(max_length=255, blank=True, default='')
    resource_id = models.CharField(max_length=255, blank=True, default='')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class NotificationPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_preferences')
    email_enabled = models.BooleanField(default=True)
    in_app_enabled = models.BooleanField(default=True)
    whatsapp_enabled = models.BooleanField(default=False)
    notify_on_messages = models.BooleanField(default=True)
    notify_on_bookings = models.BooleanField(default=True)
    notify_on_community = models.BooleanField(default=True)
    notify_on_marketing = models.BooleanField(default=False)


class ConfigurationPlateformeGlobale(models.Model):
    """
    Singleton de configuration globale de la plateforme LAHAThèque.
    Gère la cascade tarifaire par défaut, les politiques DRM et les paramètres de relance.
    """
    import uuid
    from decimal import Decimal

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # ── Cascade Tarifaire Globale ──────────────────────────────────────────────
    prix_defaut_numerique_xof = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("3000.00"),
        help_text="Prix par défaut pour un livre numérique (XOF)"
    )
    prix_defaut_papier_xof = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("5000.00"),
        help_text="Prix par défaut pour un livre papier (XOF)"
    )
    prix_defaut_audio_xof = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("2500.00"),
        help_text="Prix par défaut pour un livre audio (XOF)"
    )
    prix_pass_mensuel_xof = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("4500.00"),
        help_text="Tarif de l'abonnement Pass Étudiant mensuel (XOF)"
    )
    prix_pass_annuel_xof = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("45000.00"),
        help_text="Tarif de l'abonnement Pass Étudiant annuel (XOF)"
    )
    remise_auteur_papier_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("40.00"),
        help_text="Remise papier accordée aux Auteurs (%)"
    )
    remise_auteur_numerique_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("25.00"),
        help_text="Remise numérique accordée aux Auteurs (%)"
    )
    remise_grossiste_papier_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("32.00"),
        help_text="Remise papier accordée aux Grossistes B2B (%)"
    )
    remise_grossiste_numerique_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("25.00"),
        help_text="Remise numérique accordée aux Grossistes B2B (%)"
    )
    remise_campus_papier_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("25.00"),
        help_text="Remise papier accordée aux Universités/Campus (%)"
    )
    remise_campus_numerique_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("35.00"),
        help_text="Remise numérique accordée aux Universités/Campus (%)"
    )
    devise_defaut = models.CharField(max_length=8, default="XOF")

    # ── DRM & Paramètres de Protection ─────────────────────────────────────────
    watermark_texte_defaut = models.CharField(
        max_length=255, default="LAHAThèque • Document Protégé",
        help_text="Texte filigrane imprimé dynamiquement sur les pages de la liseuse"
    )
    watermark_opacite_defaut = models.DecimalField(
        max_digits=3, decimal_places=2, default=Decimal("0.20"),
        help_text="Opacité du filigrane (0.10 à 0.40)"
    )
    restriction_impression_defaut = models.BooleanField(
        default=True, help_text="Bloquer l'impression sur la liseuse"
    )
    restriction_capture_defaut = models.BooleanField(
        default=True, help_text="Protection contre les captures d'écran"
    )
    duree_session_lecture_minutes = models.IntegerField(
        default=15, help_text="Durée de validité d'un token éphémère de lecture"
    )

    # ── Délais du Moteur de Relances ───────────────────────────────────────────
    delai_relance_depots_jours = models.IntegerField(
        default=7, help_text="Nombre de jours d'inactivité avant relance d'un dépôt de maquette"
    )
    delai_relance_impayes_jours = models.IntegerField(
        default=7, help_text="Nombre de jours avant relance d'une commande impayée"
    )
    delai_relance_abonnements_jours = models.IntegerField(
        default=15, help_text="Jours avant expiration pour alerter l'étudiant/université"
    )

    # ── Passerelles & Intégrations ─────────────────────────────────────────────
    moneroo_actif = models.BooleanField(default=True)
    stripe_actif = models.BooleanField(default=True)
    fastermessage_sms_actif = models.BooleanField(default=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "reporting_platform_config"
        verbose_name = "Configuration Plateforme Globale"


class RelanceAutomatiqueLog(models.Model):
    """
    Journal immuable de chaque notification de relance émise par le système.
    """
    import uuid

    class TypeRelance(models.TextChoices):
        DEPOT_EN_ATTENTE = 'depot_en_attente', 'Dépôt de Maquette en Attente'
        FACTURE_IMPAYEE = 'facture_impayee', 'Facture / Commande Impayée'
        ABONNEMENT_EXPIRATION = 'abonnement_expiration', 'Expiration Abonnement / Bouquet'

    class CanalRelance(models.TextChoices):
        EMAIL = 'email', 'Courrier Électronique'
        SMS = 'sms', 'SMS (FasterMessage)'
        IN_APP = 'in_app', 'Notification In-App'

    class StatutRelance(models.TextChoices):
        ENVOYE = 'envoye', 'Envoyé avec succès'
        ECHEC = 'echec', 'Échec de transmission'
        OUVERT = 'ouvert', 'Consulté / Cliqué'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type_relance = models.CharField(max_length=40, choices=TypeRelance.choices, db_index=True)
    canal = models.CharField(max_length=20, choices=CanalRelance.choices, default=CanalRelance.EMAIL)
    destinataire_email = models.EmailField(blank=True, null=True)
    destinataire_telephone = models.CharField(max_length=32, blank=True, null=True)
    destinataire_nom = models.CharField(max_length=255)
    objet = models.CharField(max_length=255)
    message = models.TextField()
    statut = models.CharField(max_length=20, choices=StatutRelance.choices, default=StatutRelance.ENVOYE, db_index=True)
    reference_id = models.CharField(max_length=128, blank=True, null=True, help_text="ID du dépôt, de la commande ou de l'abonnement")
    erreur_detail = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "reporting_relance_log"
        ordering = ["-created_at"]


class JournalAuditAdmin(models.Model):
    """
    Traçabilité légale et sécuritaire de toutes les actions d'administration.
    """
    import uuid

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    administrateur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='audit_actions')
    action = models.CharField(max_length=128, db_index=True)
    ressource_type = models.CharField(max_length=64, db_index=True)
    ressource_id = models.CharField(max_length=128, blank=True, null=True)
    details = models.JSONField(default=dict)
    ip_adresse = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "reporting_admin_audit_log"
        ordering = ["-created_at"]
