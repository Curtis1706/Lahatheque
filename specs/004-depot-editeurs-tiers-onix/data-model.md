# Data Model: Module 4 - Espace Éditeur Tiers, Assistance IA & Synchronisation ONIX

**Feature Branch**: `004-depot-editeurs-tiers-onix`  
**Created**: 2026-08-20  
**Stack**: Django 5.x ORM & TypeScript Strict

---

## 1. Modèles Django Backend (`apps/publishers_portal/models.py`)

```python
import uuid
from django.db import models
from django.conf import settings

# ─── 1. Profil Éditeur Tiers (Maison d'Édition ou Éditeur Indépendant) ───────

class PublisherEntityType(models.TextChoices):
    COMPANY = "company", "Maison d'Édition / Personne Morale"
    INDIVIDUAL = "individual", "Éditeur Indépendant / Auto-Éditeur (Personne Physique)"


class PublisherProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="publisher_profile"
    )
    entity_type = models.CharField(
        max_length=20,
        choices=PublisherEntityType.choices,
        default=PublisherEntityType.COMPANY,
        verbose_name="Type d'Entité"
    )
    
    # Identification Légale
    company_name = models.CharField(max_length=255, verbose_name="Raison Sociale ou Nom d'Auteur/Éditeur")
    trade_name = models.CharField(max_length=255, blank=True, default="", verbose_name="Nom Commercial / Enseigne")
    nif_number = models.CharField(max_length=64, blank=True, default="", verbose_name="Numéro NIF / IFU")
    rccm_number = models.CharField(max_length=64, blank=True, default="", verbose_name="Numéro RCCM (si société)")
    identity_card_number = models.CharField(max_length=64, blank=True, default="", verbose_name="Numéro CNI / Passeport (si particulier)")
    
    # Localisation & Contact
    country = models.CharField(max_length=10, default="BJ", verbose_name="Pays du Siège / Résidence")
    city = models.CharField(max_length=128, default="Cotonou", verbose_name="Ville")
    headquarters_address = models.TextField(verbose_name="Adresse Postale / Siège")
    contact_person = models.CharField(max_length=128, verbose_name="Responsable / Nom du Contact")
    contact_email = models.EmailField(verbose_name="E-mail de Facturation & Notifications")
    contact_phone = models.CharField(max_length=32, verbose_name="Téléphone Direct / Astreinte")
    
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "publishers_profile"
        verbose_name = "Profil Éditeur Tiers"
        verbose_name_plural = "Profils Éditeurs Tiers"


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
        PublisherProfile,
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
    
    summary = models.TextField(verbose_name="Résumé / 4e de couverture")
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
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "publishers_book_deposit"
        ordering = ["-created_at"]


# ─── 3. Import par Lots (ONIX 3.0 / ZIP / CSV) ───────────────────────────────

class PublisherBatchImportLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    publisher = models.ForeignKey(PublisherProfile, on_delete=models.CASCADE, related_name="batch_imports")
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
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "publishers_batch_import_log"
        ordering = ["-created_at"]


# ─── 4. Clés API & Intégration REST ──────────────────────────────────────────

class PublisherApiKey(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    publisher = models.ForeignKey(PublisherProfile, on_delete=models.CASCADE, related_name="api_keys")
    name = models.CharField(max_length=128, verbose_name="Libellé du connecteur ERP")
    client_id = models.CharField(max_length=64, unique=True, db_index=True)
    client_secret_hash = models.CharField(max_length=255)
    client_secret_masked = models.CharField(max_length=64)
    permissions = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=[("active", "Active"), ("revoked", "Révoquée")], default="active")
    last_used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "publishers_api_key"
        ordering = ["-created_at"]


# ─── 5. Relevés de Redevances & Ventes ───────────────────────────────────────

class PublisherRoyaltyPayment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    publisher = models.ForeignKey(PublisherProfile, on_delete=models.CASCADE, related_name="royalty_payments")
    reference = models.CharField(max_length=64, unique=True, db_index=True)
    period = models.CharField(max_length=64, verbose_name="Période (ex: Octobre 2025)")
    total_sales_amount = models.DecimalField(max_digits=14, decimal_places=2)
    royalty_rate = models.DecimalField(max_digits=5, decimal_places=2)
    net_royalty_amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=10, default="XOF")
    status = models.CharField(max_length=20, choices=[("paid", "Réglé"), ("pending", "En traitement"), ("failed", "Échoué")], default="paid")
    pdf_statement_url = models.CharField(max_length=500, blank=True, default="")
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "publishers_royalty_payment"
        ordering = ["-created_at"]


# ─── 6. Journal d'Audit & Traçabilité DRM ────────────────────────────────────

class PublisherAuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    publisher = models.ForeignKey(PublisherProfile, on_delete=models.CASCADE, related_name="audit_logs")
    book_id = models.CharField(max_length=64)
    book_title = models.CharField(max_length=255)
    action_type = models.CharField(max_length=64)
    user_masked = models.CharField(max_length=64)
    device_type = models.CharField(max_length=64)
    ip_address_masked = models.CharField(max_length=64)
    location = models.CharField(max_length=128)
    is_suspicious = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "publishers_audit_log"
        ordering = ["-timestamp"]
```

---

## 2. Types TypeScript (`lib/types/publisher.ts`)

```typescript
export type PublisherEntityType = "company" | "individual";

export type ValidationStep =
  | "step_1_deposited"
  | "step_2_auto_check"
  | "step_3_editorial_review"
  | "step_4_notification"
  | "step_5_published";

export type PublisherBookStatus =
  | "draft"
  | "pending"
  | "revision_requested"
  | "approved"
  | "published";

export type SalesModel = "purchase" | "subscription" | "free" | "bundle";

export interface ProtectionConfig {
  watermark_enabled: boolean;
  watermark_position: "top-left" | "top-right" | "center" | "bottom-right";
  watermark_opacity: number;
  user_watermarking: boolean;
  lcp_drm_enabled: boolean;
  max_allowed_devices: number;
  max_loan_days: number;
  disable_copy_paste: boolean;
  disable_print: boolean;
  audio_encryption_auto: boolean;
  access_tracing_auto: boolean;
}

export interface PublisherBook {
  id: string;
  publisher_id: string;
  publisher_name: string;
  title: string;
  subtitle?: string;
  isbn_digital: string;
  isbn_print?: string;
  doi?: string;
  authors: string[];
  contributors?: {
    name: string;
    role: "co_author" | "translator" | "prefacer" | "editor";
    orcid?: string;
  }[];
  discipline: string;
  language: string;
  keywords: string[];
  target_audience: "universitaire" | "professionnel" | "grand_public";
  price: number;
  currency: string;
  sales_model: SalesModel;
  allowed_territories: string[];
  embargo_date?: string;
  summary: string;
  authors_bio?: string;
  cover_url?: string;
  file_url?: string;
  file_format?: "pdf" | "epub" | "audio";
  licence_type: "tous_droits_reserves" | "creative_commons";
  contract_reference: string;
  contractual_royalty_rate: number;
  status: PublisherBookStatus;
  validation_step: ValidationStep;
  editorial_comment?: string;
  consultations_count: number;
  downloads_count: number;
  revenue_generated: number;
  created_at: string;
  protection_config: ProtectionConfig;
}

export interface PublisherAiMetadataSuggestion {
  summary: string;
  discipline: string;
  language: string;
  country: string;
  suggested_keywords: string[];
  target_audience: "universitaire" | "professionnel" | "grand_public";
  confidence_score: number;
}

export interface PublisherProfileData {
  id: string;
  entity_type: PublisherEntityType;
  company_name: string;
  trade_name?: string;
  nif_number: string;
  rccm_number?: string;
  identity_card_number?: string;
  country: string;
  city: string;
  headquarters_address: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  bank_name?: string;
  bank_iban?: string;
  bank_swift?: string;
  momo_number?: string;
  contract_reference: string;
  contractual_royalty_rate: number;
  is_verified: boolean;
}

export interface BatchImportReport {
  batch_id: string;
  file_name: string;
  format: "onix_3" | "csv" | "json" | "zip";
  total_records: number;
  success_count: number;
  error_count: number;
  errors: {
    line_number: number;
    isbn_or_title: string;
    error_message: string;
  }[];
  status: "processing" | "completed" | "completed_with_errors" | "failed";
  created_at: string;
}

export interface ApiKey {
  id: string;
  name: string;
  client_id: string;
  client_secret_masked: string;
  permissions: string[];
  created_at: string;
  last_used_at?: string;
  status: "active" | "revoked";
}

export interface PublisherRoyaltyPayment {
  id: string;
  reference: string;
  period: string;
  total_sales_amount: number;
  royalty_rate: number;
  net_royalty_amount: number;
  currency: string;
  status: "paid" | "pending" | "failed";
  pdf_statement_url: string;
  paid_at?: string;
}

export interface PublisherAuditLog {
  id: string;
  book_id: string;
  book_title: string;
  action_type: string;
  user_masked: string;
  device_type: string;
  ip_address_masked: string;
  location: string;
  timestamp: string;
  is_suspicious?: boolean;
}

export interface PublisherKpis {
  totalBooks: number;
  pendingValidations: number;
  publishedBooks: number;
  totalConsultations: number;
  totalDownloads: number;
  totalRevenue: number;
  pendingRoyalties: number;
  contractualRoyaltyRate: number;
}
```
