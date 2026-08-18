# Modele de Donnees: Module 4 - Editeurs Tiers et ONIX (Publishers)

```python
"""
Modeles de donnees pour la gestion des comptes editeurs tiers,
des imports ONIX 3.0 et du flux de validation editorial.
Conforme a la section 5 du cahier des charges.
"""

import uuid
from django.db import models


class CompteEditeurTiers(models.Model):
    """
    Compte partenaire d'une maison d'edition tierce.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom_maison = models.CharField(max_length=255, unique=True, db_index=True)
    contact_principal = models.ForeignKey("accounts.User", on_delete=models.PROTECT)
    pays_siege = models.CharField(max_length=64, db_index=True)
    taux_redevance_contractuel = models.DecimalField(max_digits=5, decimal_places=2, default=70.00)  # ex: 70%
    api_key_hash = models.CharField(max_length=128, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "publishers_compte_editeur"

    def __str__(self) -> str:
        return self.nom_maison


class DepotEditeurTiers(models.Model):
    """
    Ouvrage depose par un editeur tiers en attente ou ayant termine la validation.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    editeur = models.ForeignKey(
        CompteEditeurTiers,
        on_delete=models.CASCADE,
        related_name="depots"
    )
    titre = models.CharField(max_length=255, db_index=True)
    sous_titre = models.CharField(max_length=255, blank=True)
    isbn_numerique = models.CharField(max_length=32, blank=True, db_index=True)
    isbn_papier = models.CharField(max_length=32, blank=True, db_index=True)
    doi = models.CharField(max_length=64, blank=True)
    auteurs_detail = models.JSONField(default=list)  # [{"nom": "...", "orcid": "...", "role": "A01"}]
    discipline = models.CharField(max_length=128, db_index=True)
    langue = models.CharField(max_length=32, default="français", db_index=True)
    territoires_autorises = models.JSONField(default=list)  # ["BEN", "SEN", "CIV"]
    prix_par_devise = models.JSONField(default=dict)  # {"XOF": 10000, "EUR": 15.00}
    date_embargo = models.DateField(null=True, blank=True)
    resume = models.TextField(blank=True)
    
    MODE_DEPOT_CHOICES = [
        ("web_unitaire", "Formulaire Web Unitaire"),
        ("web_zip", "Archive ZIP Multifichiers"),
        ("onix_3_0", "Import ONIX 3.0"),
        ("api_rest", "API REST Programmatique"),
    ]
    mode_depot = models.CharField(max_length=32, choices=MODE_DEPOT_CHOICES)
    
    STATUT_CHOICES = [
        ("en_attente_controle", "En attente de contrôle automatique"),
        ("en_examen_laha", "En examen par l'équipe LAHA"),
        ("valide_publie", "Validé et publié"),
        ("demande_correction", "Demande de correction"),
        ("rejete", "Rejeté"),
    ]
    statut = models.CharField(max_length=32, choices=STATUT_CHOICES, default="en_attente_controle", db_index=True)
    rapport_controle = models.JSONField(default=dict, blank=True)
    commentaires_laha = models.TextField(blank=True)
    
    fichier_numerique_path = models.CharField(max_length=512)
    couverture_path = models.CharField(max_length=512)
    ouvrage_publie = models.OneToOneField(
        "catalog.Ouvrage",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="depot_editeur_source"
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "publishers_depot_editeur"
        ordering = ["-created_at"]


class ImportBatchLog(models.Model):
    """
    Journal d'un import en lot (ONIX ou ZIP).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    editeur = models.ForeignKey(CompteEditeurTiers, on_delete=models.CASCADE)
    nom_fichier_source = models.CharField(max_length=255)
    nombre_total_notices = models.IntegerField(default=0)
    nombre_succes = models.IntegerField(default=0)
    nombre_erreurs = models.IntegerField(default=0)
    rapport_erreurs = models.JSONField(default=list, blank=True)
    statut = models.CharField(max_length=16, choices=[("en_cours", "En cours"), ("termine", "Terminé"), ("echec", "Échec")])
    created_at = models.DateTimeField(auto_now_add=True)
```
