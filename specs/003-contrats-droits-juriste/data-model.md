# 🗄️ Modèle de Données: Module 3 — Contrats, Droits & Relances (`apps.rights` / `apps.legal`)

```python
"""
Modèles de données pour la gestion juridique, la GED des contrats (FTS),
les clés de répartition des droits d'auteur (validation 100%), les dossiers de pré-édition,
les suggestions IA de redevances et le journal immuable des relances.
Conforme à la Section 4 du cahier des charges LAHAThèque v3.2.
"""

import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError


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
    type_contrat = models.CharField(max_length=32, choices=TYPE_CHOICES, db_index=True)
    titre = models.CharField(max_length=255, db_index=True)
    contracting_party = models.CharField(max_length=255, db_index=True)  # ex: "Prof. Augustin Chakirou", "Université d'Abomey-Calavi"
    parties_prenantes = models.JSONField(default=list)  # ex: ["Prof. Augustin Chakirou", "Faculté de Droit UAC"]
    
    fichier_contrat_path = models.CharField(max_length=512)
    file_name = models.CharField(max_length=255, default="")
    file_size = models.BigIntegerField(default=0)  # Jusqu'à 800 Mo (838 860 800 octets)
    texte_integral_index = models.TextField(blank=True)  # Contenu extrait pour PostgreSQL SearchVector
    
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
        db_table = "legal_contrat"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Contrat {self.numero_contrat} - {self.titre}"


class RepartitionDroits(models.Model):
    """
    Clé de répartition des pourcentages de droits d'auteur pour un ouvrage.
    La somme des pourcentages pour un même ouvrage DOIT être strictement égale à 100.00%.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ouvrage = models.ForeignKey(
        "catalog.Ouvrage",
        on_delete=models.CASCADE,
        related_name="repartitions_droits"
    )
    beneficiaire = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="droits_acquis"
    )
    role_libelle = models.CharField(max_length=100, default="Auteur Principal")  # Auteur Principal, Co-auteur, Illustrateur, Préfacier
    pourcentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01")), MaxValueValidator(Decimal("100.00"))]
    )  # ex: 70.00 %
    taux_papier = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    taux_numerique = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    taux_audio_tts = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # Quote-part écoutes TTS (Text-To-Speech)
    date_effet = models.DateField(auto_now_add=True)

    class Meta:
        db_table = "legal_repartition_droits"
        constraints = [
            models.UniqueConstraint(
                fields=["ouvrage", "beneficiaire"],
                name="unique_repartition_ouvrage_beneficiaire"
            )
        ]

    def clean(self):
        super().clean()
        if self.pourcentage <= 0 or self.pourcentage > 100:
            raise ValidationError("Le pourcentage doit être compris entre 0.01% et 100.00%.")


class AIRoyaltySuggestion(models.Model):
    """
    Suggestion automatique de clé de répartition extraite par l'IA lors de l'indexation du contrat.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contrat = models.ForeignKey(ContratLegal, on_delete=models.CASCADE, related_name="suggestions_ia")
    ouvrage = models.ForeignKey("catalog.Ouvrage", on_delete=models.SET_NULL, null=True, blank=True)
    beneficiaire_nom = models.CharField(max_length=255)
    pourcentage_suggere = models.DecimalField(max_digits=5, decimal_places=2)
    clause_extraite = models.TextField()
    confiance_score = models.DecimalField(max_digits=3, decimal_places=2, default=0.90)  # ex: 0.95 (95%)
    is_validated = models.BooleanField(default=False)
    validated_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "legal_ai_royalty_suggestion"


class PreEditionDossier(models.Model):
    """
    Fiche de pré-édition d'un ouvrage avant transmission à l'équipe de maquettage.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code_dossier = models.CharField(max_length=64, unique=True, db_index=True)
    titre_previsionnel = models.CharField(max_length=255, db_index=True)
    auteur_nom = models.CharField(max_length=255)
    universite_nom = models.CharField(max_length=128, blank=True)  # ex: Université d'Abomey-Calavi
    faculte_nom = models.CharField(max_length=128, blank=True)     # ex: Faculté de Droit et de Science Politique (FADESP)
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
        db_table = "legal_pre_edition_dossier"
        ordering = ["-created_at"]


class RelanceEmailJournal(models.Model):
    """
    Historique immuable de chaque relance automatique émise par la plateforme.
    """
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
        db_table = "legal_relance_email_journal"
        ordering = ["-date_envoi"]
```
