# Modèle de Données: Module 8 - Administration Globale, Tarification & Supervision

```python
"""
apps/reporting/models.py — Modèles pour l'administration globale, la tarification
cascade multi-pays, les relances automatiques et les journaux d'audit.
Conforme aux sections 1, 15, 19 et 20 du cahier des charges LAHAThèque v3.2.
"""

import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings


class ConfigurationPlateformeGlobale(models.Model):
    """
    Singleton de configuration globale de la plateforme LAHAThèque.
    Gère la cascade tarifaire par défaut, les politiques DRM et les paramètres de relance.
    """
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
```
