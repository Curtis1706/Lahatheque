"""Modèles de droits d'auteur, calcul de redevances et demandes de versement."""
import uuid
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

class AuthorRight(models.Model):
    ouvrage = models.ForeignKey('catalog.Ouvrage', on_delete=models.CASCADE, related_name='author_rights')
    author = models.ForeignKey('catalog.BookAuthor', null=True, blank=True, on_delete=models.SET_NULL)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    role = models.CharField(max_length=50, default='auteur_principal')
    pool_share_percent = models.DecimalField(max_digits=5, decimal_places=2) # ex: 70.00%

class RightTerritory(models.Model):
    ouvrage = models.ForeignKey('catalog.Ouvrage', on_delete=models.CASCADE)
    allowed_countries = models.JSONField(default=list) # Codes ISO ex: ["BJ", "CI"]
    exclusive = models.BooleanField(default=True)

class RoyaltyRate(models.Model):
    ouvrage = models.ForeignKey('catalog.Ouvrage', on_delete=models.CASCADE)
    author_share_percent = models.DecimalField(max_digits=5, decimal_places=2)
    publisher_share_percent = models.DecimalField(max_digits=5, decimal_places=2)
    platform_share_percent = models.DecimalField(max_digits=5, decimal_places=2)
    university_share_percent = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text="Taux de redevance université spécifique à ce livre/contrat — si vide, repli sur le taux général de l'institution."
    )

class RoyaltyCalculation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    period_month = models.DateField()
    ouvrage = models.ForeignKey('catalog.Ouvrage', on_delete=models.CASCADE)
    total_reads_count = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2)
    publisher_payout_amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_settled = models.BooleanField(default=False)

    @property
    def author_payout_total(self):
        return sum(line.payout_amount for line in self.payout_lines.all())

class RoyaltyPayoutLine(models.Model):
    calculation = models.ForeignKey(RoyaltyCalculation, on_delete=models.CASCADE, related_name='payout_lines')
    author_right = models.ForeignKey(AuthorRight, on_delete=models.PROTECT)
    payout_amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_settled = models.BooleanField(default=False)

class PayoutRequest(models.Model):
    """Demande de versement / retrait des droits d'auteur."""
    PAYMENT_METHODS = [
        ('momo', 'MTN Mobile Money'),
        ('moov', 'Moov Money'),
        ('orange', 'Orange Money / Wave'),
        ('bank', 'Virement Bancaire (RIB/IBAN)'),
    ]
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvé'),
        ('rejected', 'Rejeté'),
        ('processed', 'Traité / Viré'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payout_requests')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='momo')
    account_details = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)
    transaction_reference = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        related_name='processed_payouts'
    )

    class Meta:
        ordering = ['-created_at']


class ContratLegal(models.Model):
    """
    Contrat numérisé, stocké sur Cloudflare R2 (jusqu'à 800 Mo)
    et indexé pour la recherche plein texte (PostgreSQL FTS).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero_contrat = models.CharField(max_length=64, unique=True, db_index=True)
    
    TYPE_CHOICES = [
        ("edition_auteur", "Contrat d'édition auteur"),
        ("partenariat_universite", "Convention université partenaire"),
        ("editeur_tiers", "Contrat éditeur tiers"),
        ("pre_edition", "Accord de pré-édition"),
        ("avenant", "Avenant contractuel"),
    ]
    type_contrat = models.CharField(max_length=32, choices=TYPE_CHOICES, default="edition_auteur", db_index=True)
    titre = models.CharField(max_length=255, db_index=True)
    contracting_party = models.CharField(max_length=255, default="", db_index=True)
    contracting_party_email = models.EmailField(blank=True, default="")
    contracting_party_phone = models.CharField(max_length=30, blank=True, default="")
    juriste_responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="dossiers_geres", limit_choices_to={"role__in": ["legal_reviewer", "admin", "super_admin"]}
    )
    parties_prenantes = models.JSONField(default=list)

    # Liaisons directes avec les entités réelles de la base
    ouvrage = models.ForeignKey(
        'catalog.Ouvrage', null=True, blank=True, on_delete=models.SET_NULL, related_name='contrats'
    )
    signataire_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='contrats_signes'
    )
    institution = models.ForeignKey(
        'partners.Institution', null=True, blank=True, on_delete=models.SET_NULL, related_name='contrats_partenariat'
    )
    publisher = models.ForeignKey(
        'publishers_portal.Publisher', null=True, blank=True, on_delete=models.SET_NULL, related_name='contrats_distribution'
    )
    pre_edition = models.ForeignKey(
        'rights.PreEditionDossier', null=True, blank=True, on_delete=models.SET_NULL, related_name='contrats_associes'
    )
    
    fichier_contrat_path = models.CharField(max_length=512, default="")
    file_name = models.CharField(max_length=255, default="")
    file_size = models.BigIntegerField(default=0)  # Jusqu'à 800 Mo
    texte_integral_index = models.TextField(blank=True)
    
    date_signature = models.DateField(null=True, blank=True)
    date_expiration = models.DateField(null=True, blank=True)
    
    STATUS_CHOICES = [
        ("active", "Actif"),
        ("pending_signature", "En attente de signature"),
        ("expired", "Expiré"),
        ("terminated", "Résilié"),
    ]
    status = models.CharField(max_length=24, choices=STATUS_CHOICES, default="active", db_index=True)
    notes = models.TextField(blank=True)
    tags = models.JSONField(default=list)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Contrat {self.numero_contrat} - {self.titre}"


class RepartitionDroits(models.Model):
    """
    Clé de répartition des pourcentages de droits d'auteur pour un ouvrage.
    Validation stricte : somme(pourcentages) == 100.00%.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ouvrage = models.ForeignKey(
        'catalog.Ouvrage',
        on_delete=models.CASCADE,
        related_name="repartitions_droits"
    )
    beneficiaire = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="droits_acquis"
    )
    role_libelle = models.CharField(max_length=100, default="Auteur Principal")
    pourcentage = models.DecimalField(max_digits=5, decimal_places=2)  # ex: 70.00 %
    taux_papier = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    taux_numerique = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    taux_audio_tts = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # Quote-part écoutes TTS (Text-To-Speech)
    date_effet = models.DateField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["ouvrage", "beneficiaire"],
                name="unique_repartition_ouvrage_beneficiaire"
            )
        ]

    def __str__(self) -> str:
        return f"{self.ouvrage.titre} - {self.beneficiaire} ({self.pourcentage}%)"


class AIRoyaltySuggestion(models.Model):
    """Suggestion IA de clé de répartition issue de l'indexation de contrat."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contrat = models.ForeignKey(ContratLegal, on_delete=models.CASCADE, related_name="suggestions_ia")
    ouvrage = models.ForeignKey('catalog.Ouvrage', on_delete=models.SET_NULL, null=True, blank=True)
    beneficiaire_nom = models.CharField(max_length=255)
    pourcentage_suggere = models.DecimalField(max_digits=5, decimal_places=2)
    clause_extraite = models.TextField()
    confiance_score = models.DecimalField(max_digits=3, decimal_places=2, default=0.95)
    is_validated = models.BooleanField(default=False)
    validated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)


class PreEditionDossier(models.Model):
    """Fiche de pré-édition d'un ouvrage avant transmission maquette."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code_dossier = models.CharField(max_length=64, unique=True, db_index=True)
    titre_previsionnel = models.CharField(max_length=255, db_index=True)
    auteur_nom = models.CharField(max_length=255)
    auteur_email = models.EmailField(blank=True, default='')
    auteur_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='pre_editions_liees'
    )
    universite_nom = models.CharField(max_length=128, blank=True)
    faculte_nom = models.CharField(max_length=128, blank=True)
    date_prevue_remise = models.DateField(null=True, blank=True)
    
    STATUS_CHOICES = [
        ("en_attente_depot", "En attente du manuscrit"),
        ("maquette_en_cours", "Maquette en cours"),
        ("valide_legalement", "Validé légalement"),
        ("archive", "Archivé"),
    ]
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="en_attente_depot", db_index=True)
    notes_juridiques = models.TextField(blank=True)
    contrat = models.ForeignKey(
        ContratLegal,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dossiers_pre_edition"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]


class RelanceEmailJournal(models.Model):
    """Historique immuable de chaque relance automatique émise."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    TYPE_RELANCE_CHOICES = [
        ("rapport_droits_auteur", "Rapport périodique des droits d'auteur"),
        ("facture_impayee_client", "Relance facture impayée client"),
        ("depot_en_attente", "Relance dépôt en attente"),
        ("expiration_abonnement", "Relance expiration abonnement"),
    ]
    type_relance = models.CharField(max_length=32, choices=TYPE_RELANCE_CHOICES, db_index=True)
    destinataire = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="relances_recues")
    destinataire_email = models.EmailField()
    sujet = models.CharField(max_length=255)
    corps_message = models.TextField()
    
    niveau_relance = models.IntegerField(default=1)  # 1: J+7, 2: J+14, 3: J+21
    montant_du = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    STATUT_ENVOI_CHOICES = [("envoye", "Envoyé"), ("echec", "Échec")]
    statut_envoi = models.CharField(max_length=16, choices=STATUT_ENVOI_CHOICES, default="envoye")
    date_envoi = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-date_envoi"]


class AuthorManuscriptSubmission(models.Model):
    """Manuscrit déposé par un auteur pour étude avant finalisation éditoriale."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    VERSION_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('finale', 'Version finale'),
    ]
    STATUS_CHOICES = [
        ('study_pending', "À l'étude"),
        ('catalog_preparation', 'En préparation catalogue'),
        ('accepted', 'Accepté'),
        ('rejected', 'Refusé'),
    ]
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='manuscript_submissions'
    )
    title = models.CharField(max_length=255)
    manuscript_file = models.FileField(upload_to='manuscripts/', blank=True, null=True)
    version_type = models.CharField(max_length=20, choices=VERSION_CHOICES, default='brouillon')
    suggested_summary = models.TextField(blank=True, default='')
    suggested_language = models.CharField(max_length=50, default='Français')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='study_pending')
    editorial_note = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']


class DebtReminderConfig(models.Model):
    """Configuration unique des règles de relance automatique des impayés (singleton)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    auto_remind_enabled = models.BooleanField(default=True)
    first_reminder_days = models.IntegerField(default=7)
    min_amount_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=5000.00)
    max_reminders_count = models.IntegerField(default=3)
    reminder_frequency_days = models.IntegerField(
        default=5, help_text="Nombre de jours entre deux relances successives pour un même impayé"
    )
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def get_or_create_singleton(cls):
        obj, _ = cls.objects.get_or_create(id='00000000-0000-0000-0000-000000000001')
        return obj


class PublicManuscriptLead(models.Model):
    """Soumission de manuscrit via le formulaire public — avant toute création de compte."""
    STATUS_CHOICES = [
        ('new', 'Nouvelle'),
        ('contacted', 'Contactée'),
        ('converted', 'Compte auteur créé'),
        ('rejected', 'Non retenue'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True, default='')
    book_title = models.CharField(max_length=255)
    genre = models.CharField(max_length=100, blank=True, default='')
    country = models.CharField(max_length=100, blank=True, default='')
    summary = models.TextField(blank=True, default='')
    manuscript_file = models.FileField(upload_to='public_manuscript_leads/%Y/%m/', blank=True, null=True)
    manuscript_file_key = models.CharField(max_length=500, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rights_public_manuscript_lead'
        ordering = ['-created_at']
