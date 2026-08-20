"""Modèles portail éditeur tiers et workflows (Publisher, PublisherBookDeposit, PublisherBatchImportLog, PublisherApiKey, PublisherRoyaltyPayment, PublisherAuditLog)."""
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


# ─── 1. Profil Éditeur Tiers (Maison d'Édition ou Éditeur Indépendant) ───────

class PublisherEntityType(models.TextChoices):
    COMPANY = "company", "Maison d'Édition / Personne Morale"
    INDIVIDUAL = "individual", "Éditeur Indépendant / Auto-Éditeur (Personne Physique)"


class Publisher(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="publisher_profile",
        null=True,
        blank=True
    )
    entity_type = models.CharField(
        max_length=20,
        choices=PublisherEntityType.choices,
        default=PublisherEntityType.COMPANY,
        verbose_name="Type d'Entité"
    )
    
    # Identification Légale
    name = models.CharField(max_length=255, default="", blank=True, verbose_name="Nom Principal")
    company_name = models.CharField(max_length=255, default="", blank=True, verbose_name="Raison Sociale ou Nom d'Auteur/Éditeur")
    trade_name = models.CharField(max_length=255, blank=True, default="", verbose_name="Nom Commercial / Enseigne")
    nif_number = models.CharField(max_length=64, blank=True, default="", verbose_name="Numéro NIF / IFU")
    rccm_number = models.CharField(max_length=64, blank=True, default="", verbose_name="Numéro RCCM (si société)")
    identity_card_number = models.CharField(max_length=64, blank=True, default="", verbose_name="Numéro CNI / Passeport (si particulier)")
    
    # Localisation & Contact
    country = models.CharField(max_length=10, default="BJ", verbose_name="Pays du Siège / Résidence")
    city = models.CharField(max_length=128, default="Cotonou", verbose_name="Ville")
    headquarters_address = models.TextField(default="Cotonou, Bénin", blank=True, verbose_name="Adresse Postale / Siège")
    contact_person = models.CharField(max_length=128, default="", blank=True, verbose_name="Responsable / Nom du Contact")
    contact_email = models.EmailField(default="", blank=True, verbose_name="E-mail de Facturation & Notifications")
    contact_phone = models.CharField(max_length=32, default="", blank=True, verbose_name="Téléphone Direct / Astreinte")
    
    # Coordonnées Bancaires pour Reversement des Redevances
    bank_name = models.CharField(max_length=128, blank=True, default="", verbose_name="Banque de Domiciliation")
    bank_iban = models.CharField(max_length=128, blank=True, default="", verbose_name="Numéro IBAN / Compte Bancaire")
    bank_swift = models.CharField(max_length=32, blank=True, default="", verbose_name="Code BIC / SWIFT")
    momo_number = models.CharField(max_length=32, blank=True, default="", verbose_name="Compte Mobile Money (MTN/Moov/Orange/Wave)")
    
    # Conditions Contractuelles & Mandat
    contract_reference = models.CharField(max_length=64, default="CTR-PUB-2025-01", verbose_name="Réf. Contrat de Mandat")
    contractual_royalty_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=22.00,
        verbose_name="Taux Contractuel de Redevance (%)"
    )
    is_verified = models.BooleanField(default=True, verbose_name="Partenaire Certifié & Validé")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "publishers_profile"
        verbose_name = "Profil Éditeur Tiers"
        verbose_name_plural = "Profils Éditeurs Tiers"

    def __str__(self) -> str:
        return f"{self.company_name or self.name} ({self.get_entity_type_display()})"

    def save(self, *args, **kwargs):
        if not self.name and self.company_name:
            self.name = self.company_name
        elif not self.company_name and self.name:
            self.company_name = self.name
        super().save(*args, **kwargs)


PublisherProfile = Publisher


# ─── 2. Dépôt d'Ouvrage & Circuit de Validation ──────────────────────────────

class PublisherDepositStatus(models.TextChoices):
    DRAFT = "draft", "Brouillon"
    PENDING = "pending", "En cours de validation"
    REVISION_REQUESTED = "revision_requested", "Corrections demandées"
    APPROVED = "approved", "Validé par le comité"
    PUBLISHED = "published", "Publié sur la vitrine"


class PublisherValidationStep(models.TextChoices):
    STEP_1 = "step_1_deposited", "1. Dépôt initial effectué"
    STEP_2 = "step_2_auto_check", "2. Contrôle automatique technique"
    STEP_3 = "step_3_editorial_review", "3. Examen éditorial LAHA"
    STEP_4 = "step_4_notification", "4. Notification & Validation"
    STEP_5 = "step_5_published", "5. Publication finale vitrine"


class PublisherBookDeposit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    publisher = models.ForeignKey(
        Publisher,
        on_delete=models.CASCADE,
        related_name="deposits"
    )
    title = models.CharField(max_length=255, verbose_name="Titre Principal")
    subtitle = models.CharField(max_length=255, blank=True, default="", verbose_name="Sous-Titre")
    isbn_digital = models.CharField(max_length=64, db_index=True, verbose_name="ISBN Numérique (EPUB/PDF)")
    isbn_print = models.CharField(max_length=64, blank=True, default="", verbose_name="ISBN Papier")
    doi = models.CharField(max_length=128, blank=True, default="", verbose_name="Identifiant DOI")
    
    authors = models.JSONField(default=list, verbose_name="Auteurs Principaux")
    contributors = models.JSONField(default=list, blank=True, verbose_name="Contributeurs (Traducteurs, Préfaciers)")
    discipline = models.CharField(max_length=128, db_index=True, verbose_name="Discipline Académique")
    language = models.CharField(max_length=10, default="fr", verbose_name="Langue de l'ouvrage")
    keywords = models.JSONField(default=list, blank=True, verbose_name="Mots-Clés Thématiques")
    target_audience = models.CharField(max_length=64, default="universitaire", verbose_name="Public Cible")
    
    price = models.DecimalField(max_digits=10, decimal_places=2, default=5000.00, verbose_name="Prix Public Unitaire")
    currency = models.CharField(max_length=10, default="XOF", verbose_name="Devise")
    sales_model = models.CharField(max_length=32, default="purchase", verbose_name="Modèle Commercial")
    allowed_territories = models.JSONField(default=list, verbose_name="Territoires d'Exploitation")
    embargo_date = models.DateField(null=True, blank=True, verbose_name="Date Fin d'Embargo")
    
    summary = models.TextField(default="Résumé de l'ouvrage.", verbose_name="Résumé / 4e de couverture")
    authors_bio = models.TextField(blank=True, default="", verbose_name="Biographie Auteurs")
    cover_url = models.CharField(max_length=500, blank=True, default="", verbose_name="URL Couverture")
    file_url = models.CharField(max_length=500, blank=True, default="", verbose_name="URL Fichier")
    file_format = models.CharField(max_length=10, default="pdf", choices=[("pdf", "PDF"), ("epub", "EPUB"), ("audio", "Audio")])
    licence_type = models.CharField(max_length=64, default="tous_droits_reserves")
    
    status = models.CharField(
        max_length=32,
        choices=PublisherDepositStatus.choices,
        default=PublisherDepositStatus.PENDING,
        db_index=True
    )
    validation_step = models.CharField(
        max_length=64,
        choices=PublisherValidationStep.choices,
        default=PublisherValidationStep.STEP_1
    )
    editorial_comment = models.TextField(blank=True, default="", verbose_name="Commentaires du Comité LAHA")
    
    # Indicateurs d'usage
    consultations_count = models.PositiveIntegerField(default=0)
    downloads_count = models.PositiveIntegerField(default=0)
    revenue_generated = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    
    # Configuration DRM & Protection
    watermark_enabled = models.BooleanField(default=True)
    watermark_position = models.CharField(max_length=32, default="bottom-right")
    watermark_opacity = models.PositiveIntegerField(default=30)
    lcp_drm_enabled = models.BooleanField(default=True)
    disable_copy_paste = models.BooleanField(default=True)
    disable_print = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "publishers_book_deposit"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.get_status_display()})"


SubmissionDraft = PublisherBookDeposit


# ─── 3. Import par Lots (ONIX 3.0 / ZIP / CSV) ───────────────────────────────

class PublisherBatchImportLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    publisher = models.ForeignKey(Publisher, on_delete=models.CASCADE, related_name="batch_imports")
    file_name = models.CharField(max_length=255)
    format = models.CharField(max_length=20, choices=[("onix_3", "ONIX 3.0 XML"), ("csv", "CSV Tableur"), ("zip", "Archive ZIP")])
    total_records = models.PositiveIntegerField(default=0)
    success_count = models.PositiveIntegerField(default=0)
    error_count = models.PositiveIntegerField(default=0)
    errors = models.JSONField(default=list, blank=True)
    status = models.CharField(
        max_length=32,
        choices=[("processing", "En cours"), ("completed", "Terminé avec succès"), ("completed_with_errors", "Terminé avec erreurs"), ("failed", "Échec critique")],
        default="processing"
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "publishers_batch_import_log"
        ordering = ["-created_at"]


# ─── 4. Clés API & Intégration REST ──────────────────────────────────────────

class PublisherApiKey(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    publisher = models.ForeignKey(Publisher, on_delete=models.CASCADE, related_name="api_keys")
    name = models.CharField(max_length=128, verbose_name="Libellé du connecteur ERP")
    client_id = models.CharField(max_length=64, unique=True, db_index=True)
    client_secret_hash = models.CharField(max_length=255)
    client_secret_masked = models.CharField(max_length=64)
    permissions = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=[("active", "Active"), ("revoked", "Révoquée")], default="active")
    last_used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "publishers_api_key"
        ordering = ["-created_at"]


# ─── 5. Relevés de Redevances & Ventes ───────────────────────────────────────

class PublisherRoyaltyPayment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    publisher = models.ForeignKey(Publisher, on_delete=models.CASCADE, related_name="royalty_payments")
    reference = models.CharField(max_length=64, unique=True, db_index=True)
    period = models.CharField(max_length=64, verbose_name="Période (ex: Octobre 2025)")
    total_sales_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    royalty_rate = models.DecimalField(max_digits=5, decimal_places=2, default=22.00)
    net_royalty_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=10, default="XOF")
    status = models.CharField(max_length=20, choices=[("paid", "Réglé"), ("pending", "En traitement"), ("failed", "Échoué")], default="paid")
    pdf_statement_url = models.CharField(max_length=500, blank=True, default="")
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "publishers_royalty_payment"
        ordering = ["-created_at"]


# ─── 6. Journal d'Audit & Traçabilité DRM ────────────────────────────────────

class PublisherAuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    publisher = models.ForeignKey(Publisher, on_delete=models.CASCADE, related_name="audit_logs")
    book_id = models.CharField(max_length=64)
    book_title = models.CharField(max_length=255)
    action_type = models.CharField(max_length=64)
    user_masked = models.CharField(max_length=64)
    device_type = models.CharField(max_length=64)
    ip_address_masked = models.CharField(max_length=64)
    location = models.CharField(max_length=128)
    is_suspicious = models.BooleanField(default=False)
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "publishers_audit_log"
        ordering = ["-timestamp"]
