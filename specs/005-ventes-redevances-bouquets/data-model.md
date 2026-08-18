# Modele de Donnees: Module 5 - Ventes, Redevances et Bouquets (Finance)

```python
"""
Modeles de donnees pour l'enregistrement des ventes, le calcul des redevances
universitaires (15%), auteurs et editeurs, et la ventilation des bouquets.
Conforme aux sections 7, 10, 11 et 12 du cahier des charges.
Devises : XOF, XAF, CDF, GNF, USD.
"""

import uuid
from decimal import Decimal
from django.db import models


class VenteTransaction(models.Model):
    """
    Enregistrement transactionnel d'un achat sur la plateforme.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=64, unique=True, db_index=True)
    client = models.ForeignKey("accounts.User", on_delete=models.PROTECT)
    ouvrage = models.ForeignKey("catalog.Ouvrage", on_delete=models.PROTECT, null=True, blank=True)
    bouquet = models.ForeignKey("finance.BouquetDocumentaire", on_delete=models.PROTECT, null=True, blank=True)
    
    FORMAT_CHOICES = [
        ("papier", "Livre Papier"),
        ("numerique", "Livre Numérique"),
        ("audio", "Livre Audio"),
        ("bouquet", "Bouquet Documentaire"),
        ("abonnement", "Abonnement"),
    ]
    format_produit = models.CharField(max_length=32, choices=FORMAT_CHOICES, db_index=True)
    montant_ht = models.DecimalField(max_digits=14, decimal_places=2)
    montant_ttc = models.DecimalField(max_digits=14, decimal_places=2)
    
    DEVISE_CHOICES = [
        ("XOF", "Franc CFA (UEMOA)"),
        ("XAF", "Franc CFA (CEMAC)"),
        ("CDF", "Franc Congolais"),
        ("GNF", "Franc Guinéen"),
        ("USD", "Dollar US"),
    ]
    devise = models.CharField(max_length=8, choices=DEVISE_CHOICES, default="XOF", db_index=True)
    pays = models.CharField(max_length=64, db_index=True)  # Bénin, Sénégal, Côte d'Ivoire, Gabon, RDC...
    
    MODE_PAIEMENT_CHOICES = [
        ("mtn_momo", "MTN Mobile Money"),
        ("moov_money", "Moov Money"),
        ("orange_money", "Orange Money"),
        ("wave", "Wave"),
        ("carte_bancaire", "Carte Bancaire / GIM-UEMOA"),
        ("virement", "Virement bancaire institutionnel"),
    ]
    mode_paiement = models.CharField(max_length=32, choices=MODE_PAIEMENT_CHOICES)
    
    STATUT_PAIEMENT_CHOICES = [
        ("paye", "Payé"),
        ("rembourse", "Remboursé"),
        ("en_attente", "En attente"),
    ]
    statut_paiement = models.CharField(max_length=32, choices=STATUT_PAIEMENT_CHOICES, default="paye", db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "finance_vente_transaction"
        ordering = ["-created_at"]


class BouquetDocumentaire(models.Model):
    """
    Pack d'ouvrages regroupe par discipline, universite, faculte ou pays.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    titre = models.CharField(max_length=255, db_index=True)
    TYPE_BOUQUET_CHOICES = [
        ("discipline", "Bouquet par Discipline"),
        ("universite", "Bouquet par Université"),
        ("faculte", "Bouquet par Faculté"),
        ("pays", "Bouquet par Pays"),
    ]
    type_bouquet = models.CharField(max_length=32, choices=TYPE_BOUQUET_CHOICES, db_index=True)
    ouvrages = models.ManyToManyField("catalog.Ouvrage", related_name="bouquets")
    prix_annuel = models.DecimalField(max_digits=14, decimal_places=2)
    devise = models.CharField(max_length=8, default="XOF")
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "finance_bouquet_documentaire"


class MetriqueUsageLivre(models.Model):
    """
    Agregation periodique de l'usage reel par universite et ouvrage pour la repartition.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bouquet = models.ForeignKey(BouquetDocumentaire, on_delete=models.CASCADE, null=True, blank=True)
    ouvrage = models.ForeignKey("catalog.Ouvrage", on_delete=models.CASCADE)
    universite_nom = models.CharField(max_length=128, db_index=True)
    periode_mois = models.CharField(max_length=7, db_index=True)  # ex: "2026-08"
    nombre_consultations = models.IntegerField(default=0)
    pages_lues = models.IntegerField(default=0)
    secondes_lecture = models.IntegerField(default=0)
    ecoutes_audio = models.IntegerField(default=0)
    score_usage = models.DecimalField(max_digits=16, decimal_places=4, default=Decimal("0.0000"))

    class Meta:
        db_table = "finance_metrique_usage"
        constraints = [
            models.UniqueConstraint(
                fields=["bouquet", "ouvrage", "universite_nom", "periode_mois"],
                name="unique_metrique_par_periode"
            )
        ]


class RedevanceUniversite(models.Model):
    """
    Ligne comptable des 15% de redevance revenant aux universites partenaires.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    universite_nom = models.CharField(max_length=128, db_index=True)  # UAC, UNA, Parakou, UCAD...
    periode = models.CharField(max_length=16, db_index=True)          # ex: "2026-T3"
    chiffre_affaires_base = models.DecimalField(max_digits=14, decimal_places=2)
    taux_applique = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("15.00"))  # 15.00 %
    montant_redevance = models.DecimalField(max_digits=14, decimal_places=2)
    devise = models.CharField(max_length=8, default="XOF")
    STATUT_PAIEMENT = [("a_verser", "À verser"), ("paye", "Payé")]
    statut_paiement = models.CharField(max_length=16, choices=STATUT_PAIEMENT, default="a_verser", db_index=True)
    date_paiement = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "finance_redevance_universite"
        ordering = ["-created_at"]
```
