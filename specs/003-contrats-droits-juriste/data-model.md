# Modele de Donnees: Module 3 - Contrats et Droits d'Auteur (Legal)

```python
"""
Modeles de donnees pour la gestion des contrats legaux, des droits d'auteur
et des relances automatiques. Conforme a la section 4 du cahier des charges.
"""

import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class ContratLegal(models.Model):
    """
    Contrat numerise, stocke et indexe pour la recherche plein texte.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero_contrat = models.CharField(max_length=64, unique=True, db_index=True)
    TYPE_CHOICES = [
        ("edition_auteur", "Contrat d'édition auteur"),
        ("partenariat_universite", "Convention université partenaire"),
        ("editeur_tiers", "Contrat éditeur tiers"),
        ("pre_edition", "Accord de pré-édition"),
    ]
    type_contrat = models.CharField(max_length=32, choices=TYPE_CHOICES, db_index=True)
    titre = models.CharField(max_length=255, db_index=True)
    parties_prenantes = models.JSONField(default=list)  # ex: ["Prof. Koffi", "Université Abomey-Calavi"]
    fichier_contrat_path = models.CharField(max_length=512)
    texte_integral_index = models.TextField(blank=True)  # Texte extrait pour PostgreSQL FTS
    date_signature = models.DateField(null=True, blank=True)
    date_expiration = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "legal_contrat"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Contrat {self.numero_contrat} - {self.titre}"


class RepartitionDroits(models.Model):
    """
    Cle de repartition des pourcentages de droits d'auteur pour un ouvrage.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ouvrage = models.ForeignKey(
        "catalog.Ouvrage",
        on_delete=models.CASCADE,
        related_name="repartitions_droits"
    )
    beneficiaire = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="droits_acquis"
    )
    pourcentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0.01), MaxValueValidator(100.00)]
    )  # ex: 60.00 %
    taux_papier = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    taux_numerique = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    date_effet = models.DateField(auto_now_add=True)

    class Meta:
        db_table = "legal_repartition_droits"
        constraints = [
            models.UniqueConstraint(
                fields=["ouvrage", "beneficiaire"],
                name="unique_repartition_ouvrage_beneficiaire"
            )
        ]


class PreEditionDossier(models.Model):
    """
    Fiche de pre-edition d'un ouvrage avant reception de la maquette.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    titre_previsionnel = models.CharField(max_length=255, db_index=True)
    auteur_nom = models.CharField(max_length=255)
    universite_nom = models.CharField(max_length=128, blank=True)
    faculte_nom = models.CharField(max_length=128, blank=True)
    date_prevue_remise = models.DateField(null=True, blank=True)
    notes_juridiques = models.TextField(blank=True)
    contrat = models.ForeignKey(
        ContratLegal,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dossiers_pre_edition"
    )
    created_at = models.DateTimeField(auto_now_add=True)


class RelanceEmailJournal(models.Model):
    """
    Historique immuable de chaque relance emise par la plateforme.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    TYPE_RELANCE_CHOICES = [
        ("rapport_droits_auteur", "Rapport périodique des droits d'auteur"),
        ("facture_impayee_client", "Relance facture impayée client"),
        ("depot_en_attente", "Relance dépôt en attente"),
        ("expiration_abonnement", "Relance expiration abonnement"),
    ]
    type_relance = models.CharField(max_length=32, choices=TYPE_RELANCE_CHOICES, db_index=True)
    destinataire = models.ForeignKey("accounts.User", on_delete=models.CASCADE)
    sujet = models.CharField(max_length=255)
    corps_message = models.TextField()
    STATUT_ENVOI_CHOICES = [("envoye", "Envoyé"), ("echec", "Échec")]
    statut_envoi = models.CharField(max_length=16, choices=STATUT_ENVOI_CHOICES, default="envoye")
    date_envoi = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "legal_relance_email_journal"
        ordering = ["-date_envoi"]
```
