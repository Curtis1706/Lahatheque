# Modele de Donnees: Module 2 - Stocks et Livraisons (Logistics)

```python
"""
Modeles de donnees pour la gestion des entrepots, des stocks physiques
et du suivi des expeditions. Conforme a la section 3 du cahier des charges.
"""

import uuid
from django.db import models
from django.core.validators import MinValueValidator


class Entrepot(models.Model):
    """
    Representation d'un lieu de stockage physique gere par LAHA Editions.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=128, db_index=True)
    code = models.CharField(max_length=32, unique=True, db_index=True)  # ex: "WAR-CTN-01"
    pays = models.CharField(max_length=64, db_index=True)  # Bénin, Sénégal, Côte d'Ivoire...
    ville = models.CharField(max_length=128)
    adresse = models.TextField()
    responsable_nom = models.CharField(max_length=128, blank=True)
    telephone = models.CharField(max_length=32, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "logistics_entrepot"
        ordering = ["pays", "nom"]

    def __str__(self) -> str:
        return f"{self.nom} ({self.pays})"


class StockOuvrage(models.Model):
    """
    Quantites en stock d'un livre papier au sein d'un entrepot donne.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ouvrage = models.ForeignKey(
        "catalog.Ouvrage",
        on_delete=models.CASCADE,
        related_name="stocks_entrepots"
    )
    entrepot = models.ForeignKey(
        Entrepot,
        on_delete=models.CASCADE,
        related_name="stocks_ouvrages"
    )
    quantite_reelle = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    quantite_reservee = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    seuil_alerte = models.IntegerField(default=10, validators=[MinValueValidator(1)])
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "logistics_stock_ouvrage"
        constraints = [
            models.UniqueConstraint(
                fields=["ouvrage", "entrepot"],
                name="unique_stock_ouvrage_par_entrepot"
            ),
            models.CheckConstraint(
                condition=models.Q(quantite_reelle__gte=models.F("quantite_reservee")),
                name="check_quantite_reelle_gte_reservee"
            )
        ]

    @property
    def quantite_disponible(self) -> int:
        return max(0, self.quantite_reelle - self.quantite_reservee)

    @property
    def statut_alerte(self) -> str:
        if self.quantite_disponible == 0:
            return "rupture"
        if self.quantite_disponible <= self.seuil_alerte:
            return "seuil_bas"
        return "normal"


class MouvementStock(models.Model):
    """
    Journal immuable des variations de stock physique.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    stock = models.ForeignKey(
        StockOuvrage,
        on_delete=models.PROTECT,
        related_name="mouvements"
    )
    TYPE_CHOICES = [
        ("reassort", "Réassort / Entrée fournisseur"),
        ("vente", "Sortie vente commande"),
        ("retour", "Retour client / Annulation"),
        ("ajustement", "Ajustement inventaire / Avarie"),
    ]
    type_mouvement = models.CharField(max_length=32, choices=TYPE_CHOICES, db_index=True)
    quantite = models.IntegerField()  # Valeur signee (+ pour entree, - pour sortie)
    solde_apres = models.IntegerField()
    reference_document = models.CharField(max_length=128, blank=True)  # BL, Facture...
    motif = models.TextField(blank=True)
    auteur = models.ForeignKey("accounts.User", on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "logistics_mouvement_stock"
        ordering = ["-created_at"]


class ExpeditionCommande(models.Model):
    """
    Suivi de la livraison physique d'une commande.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commande = models.OneToOneField(
        "orders.Commande",
        on_delete=models.CASCADE,
        related_name="expedition"
    )
    entrepot_depart = models.ForeignKey(Entrepot, on_delete=models.PROTECT)
    transporteur_nom = models.CharField(max_length=128)
    numero_suivi = models.CharField(max_length=128, db_index=True)
    url_suivi = models.URLField(blank=True)
    STATUT_CHOICES = [
        ("en_preparation", "En préparation"),
        ("expediee", "Expédiée / En transit"),
        ("livree", "Livrée avec succès"),
        ("echec", "Échec de livraison"),
    ]
    statut = models.CharField(max_length=32, choices=STATUT_CHOICES, default="en_preparation", db_index=True)
    date_expedition = models.DateTimeField(null=True, blank=True)
    date_livraison = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "logistics_expedition_commande"
        ordering = ["-created_at"]
```
